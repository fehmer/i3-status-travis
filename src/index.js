'use strict';

import { EventEmitter } from 'events';
import request from 'request';
import defaults from 'lodash.defaultsdeep'

const accept_header = 'application/vnd.travis-ci.2+json';
const user_agent = 'i3-status-travis/1.0.0'

const defaultParameter = {
    url: 'https://api.travis-ci.org',
    projectUrl: 'https://travis-ci.org',
    colorize: false,
    success: {
        text: '',
        color: '#00FF00'
    },
    failure: {
        text: '',
        color: '#FF0000'
    },
    report: {
        dots: true,
        showSuccess: false,
        sortByName: false
    }
}

export default class Travis extends EventEmitter {
    constructor(givenOptions, output) {
        super();
        const options = defaults(Object.assign({}, givenOptions), defaultParameter);
        this.output = Object.assign({}, output);

        //set custom url or use the public travis api
        this.url = options.url;
        this.projectUrl = options.projectUrl;
        this.token = options.token;

        //user is a mandatary field
        if (!options.user)
            throw new Error('config value user is missing');
        this.user = this.optionToArray(options.user, 'user');

        //set filter for projects
        if (options.project) {
            this.project = this.optionToArray(options.project, 'project');
        }

        this.success = options.success;
        this.failure = options.failure;
        this.colorize = options.colorize;

        if ((givenOptions.failure && givenOptions.failure.color) || (givenOptions.success && givenOptions.success.color)) {
            this.colorize = true;
        }


        this.report = options.report;
        this.report.userStyle = `.project-green a {color: ${this.success.color}} .project-red a {color: ${this.failure.color}}`;
        this.report.userStyle += '.circle{width: 1em;height: 1em;float: left;border-radius: 50%;margin-right: .5em;}';
        this.report.userStyle += `.circle-green {background: ${this.success.color}} .circle-red  {background: ${this.failure.color}}`;

    }

    update() {

        //prepare one api call per user
        var calls = this.user.map(user => this.readForUser(user));

        //call api
        Promise
            .all(calls)
            .then((result) => {
                var allProjects = this.flatten(result);
                this.lastResult = allProjects;

                var brokenProjects = allProjects.filter((project) => {
                    return project.ok === false;
                });

                this.setOutput(brokenProjects);
            })
            .catch(error => {
                this.handleError(error);
            });
    }

    action(action) {
        if (this.__reporter && this.__reporter.supports('html'))
            try {
                this.__reporter.display(this.generateHtmlStatus(), action);
            } catch (e) {
                this.__logger.warn(e);
        }
    }

    /**
     * set the output of the block
     */
    setOutput(brokenProjects) {
        var ok = brokenProjects.length == 0;
        var text = ok ? this.success.text : this.failure.text;

        if (!ok && brokenProjects && brokenProjects.length > 1) {
            text += ` (${brokenProjects.length})`;
        }

        //update output
        this.output.full_text = text;
        this.output.short_text = text;

        //set color
        if (this.colorize) {
            this.output.color = ok ? this.success.color : this.failure.color;
        }

        //emit updated event to i3Status
        this.emit('updated', this, this.output);
    }

    /**
     * set the error message as output of the block
     */
    handleError(error) {
        //update output
        this.output.full_text = error;
        this.output.short_text = error;

        //emit updated event to i3Status
        this.emit('updated', this, this.output);
    }

    /**
     * read recent builds for a user
     * @returns {Promise} {Array} - array of projects, containing the project slug and if the build was ok.
     */
    readForUser(user) {
        return new Promise((resolve, reject) => {
            var headers = {
                'User-Agent': user_agent,
                'Accept': accept_header
            }
            if (this.token)
                headers['Authorization'] = 'token ' + this.token;

            request({
                url: `${this.url}/repos/${user}?active=true`,
                headers: headers
            }, (error, response, body) => {
                if (error || response.statusCode != 200) {
                    return reject(error || 'Error: Got response code ' + response.statusCode);
                }

                var repos = JSON.parse(body);
                if (!repos.repos) return reject('result does not contain any repo data');

                var result = repos.repos;

                // filter, if active
                if (this.project) {
                    result = result.filter(repo => this.project.includes(repo.slug));
                }

                //map output format
                result = result.map(repo => {
                    return {
                        project: repo.slug,
                        ok: repo.last_build_state != 'errored' && repo.last_build_state != 'failed',
                        build: repo.last_build_id !== null
                    };
                });

                return resolve(result);

            })
        });
    }


    /**
     * check the options to be a string or an array. If the option is a string an array containing
     * the string is returned. If the option is an array it will be returned. If neither an Error is thrown.
     */
    optionToArray(option, name) {
        if (typeof option === 'string') {
            return Array.of(option);
        } else if (Array.isArray(option)) {
            return option;
        } else {
            throw new Error('config value ' + name + ' must be a string or an array');
        }
    }

    /**
     * flatten the array of arrays of projects down to a single array of projects
     */
    flatten(multiUserResult) {
        var result = new Array();
        multiUserResult.forEach((forUser) => {
            forUser.forEach((project) => result.push(project))
        });
        return result;
    }

    generateHtmlStatus() {
        var header = this.report.showSuccess ? `Builds on ${this.projectUrl}` : `Failed builds on ${this.projectUrl}`;
        var projects = this.lastResult.filter(p => p.build == true);

        if (this.report.sortByName)
            projects = projects.sort((p1, p2) => p1.project.localeCompare(p2.project));

        if (!this.report.showSuccess)
            projects = projects.filter((p) => !p.ok);

        var content = '<ul>';
        projects.forEach((project) => {
            var state = project.ok ? 'green' : 'red';
            if (this.report.dots)
                content += `<li><div class="circle circle-${state}"></div><a href="${this.projectUrl}/${project.project}">${project.project}</a></li>`;
            else
                content += `<li class="project-${state}"><a href="${this.projectUrl}/${project.project}">${project.project}</a></li>`;

        });
        content += '</ul>'
        return {
            header: header,
            content: content,
            userStyle: this.report.userStyle
        };
    }
}
