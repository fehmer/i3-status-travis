'use strict';

import { EventEmitter } from 'events';
import request from 'request';

const accept_header = 'application/vnd.travis-ci.2+json';
const user_agent = 'i3-status-travis/1.0.0'

const defaultParameter = {
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
    constructor({ //
            url = 'https://api.travis-ci.org', //
            projectUrl = 'https://travis-ci.org', //
            token, //
            user, //
            project, //
            success, //
            failure, //
            colorize = (failure && failure.color) || (success && success.color) || false, //
            report //
        } = {}, output) {

        super();

        //user is a mandatary field
        if (!user)
            throw new Error('config value user is missing');

        // set fieldy, apply default parameter
        Object.assign(this, {
            output: Object.assign({}, output),
            url,
            projectUrl,
            token,
            user: this.optionToArray(user, 'user'),
            project: this.optionToArray(project, 'project'),
            success: Object.assign({}, defaultParameter.success, success),
            failure: Object.assign({}, defaultParameter.failure, failure),
            colorize,
            report: Object.assign({}, defaultParameter.report, report)
        });

        //set custom css to reporter
        this.report.userStyle = `.project-green a {color: ${this.success.color}}
        .project-red a{color: ${this.failure.color}}
        .circle{width: 1em;height: 1em;float: left;border-radius: 50%;margin-right: .5em;}
        .circle-green{background: ${this.success.color}}
        .circle-red{background: ${this.failure.color}}`;
    }

    update() {

        //prepare one api call per user
        const calls = this.user.map(user => this.readForUser(user));

        //call api
        Promise
            .all(calls)
            .then(result => {
                const allProjects = this.flatten(result);
                this.lastResult = allProjects;

                const brokenProjects = allProjects.filter(project => {
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
        const ok = brokenProjects.length == 0;
        let text = ok ? this.success.text : this.failure.text;

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
            const headers = {
                'User-Agent': user_agent,
                'Accept': accept_header
            }
            if (this.token)
                headers['Authorization'] = 'token ' + this.token;

            request({
                url: `${this.url}/repos/${user}?active=true`,
                headers
            }, (error, response, body) => {
                if (error || response.statusCode != 200) {
                    return reject(error || 'Error: Got response code ' + response.statusCode);
                }

                const repos = JSON.parse(body);
                if (!repos.repos) return reject('result does not contain any repo data');

                let result = repos.repos;

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
        if (option === undefined) {
            return undefined;
        } else if (typeof option === 'string') {
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
        return multiUserResult.reduce((a, b) => a.concat(Array.isArray(b) ? this.flatten(b) : b), []);
    }

    generateHtmlStatus() {
        const header = this.report.showSuccess ? `Builds on ${this.projectUrl}` : `Failed builds on ${this.projectUrl}`;
        let projects = this.lastResult.filter(p => p.build == true);

        if (this.report.sortByName)
            projects = projects.sort((p1, p2) => p1.project.localeCompare(p2.project));

        if (!this.report.showSuccess)
            projects = projects.filter(p => !p.ok);

        const list = projects.map(project => this.getHtml(project)).join('');
        const content = `<ul>${list}</ul>`;

        return {
            header,
            content,
            userStyle: this.report.userStyle
        };
    }

    getHtml(project) {
        const state = project.ok ? 'green' : 'red';
        if (this.report.dots)
            return `<li><div class="circle circle-${state}"></div><a href="${this.projectUrl}/${project.project}">${project.project}</a></li>`;
        else
            return `<li class="project-${state}"><a href="${this.projectUrl}/${project.project}">${project.project}</a></li>`;
    }

}
