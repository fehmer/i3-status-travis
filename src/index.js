'use strict';

import { EventEmitter } from 'events';
import request from 'request';

const accept_header = 'application/vnd.travis-ci.2+json';
const user_agent = 'i3-status-travis/1.0.0'

export default class Travis extends EventEmitter {
    constructor(givenOptions, output) {
        super();
        var options = Object.assign({}, givenOptions || {});
        options.success = options.success || {};
        options.failure = options.failure || {};
        this.output = output || {};

        //set custom url or use the public travis api
        this.url = options.url || 'https://api.travis-ci.org';
        this.token = options.token;

        //user is a mandatary field
        if (!options.user)
            throw new Error('config value user is missing');

        //set the user
        this.user = this.optionToArray(options.user, 'user');

        //set filter for projects
        if (options.project) {
            this.project = this.optionToArray(options.project, 'project');
        }

        //use given status text or use defaults
        this.status = {
            success: options.success.text || '',
            failure: options.failure.text || ''
        }

        //if colorize=true or colors defined use them
        if (options.colorize || options.success.color || options.failure.color) {
            this.color = {
                success: options.success.color || '#00FF00',
                failure: options.failure.color || '#FF0000'
            }
        } else {
            //don't use any colors if colorize is false or not defined
            this.color = false;
        }
    }

    update() {

        //prepare one api call per user
        var calls = new Array();
        this.user.forEach((user) => {
            calls.push(this.readForUser(user));
        });

        //call api
        Promise
            .all(calls)
            .then((result) => {
                var allProjects = this.flatten(result);

                var brokenProjects = allProjects.filter((project) => {
                    return project.ok === false;
                });

                this.setOutput(brokenProjects.length == 0, brokenProjects);
            })
            .catch(error => {
                this.handleError(error);
            });
    }

    /**
     * set the output of the block
     */
    setOutput(ok, brokenProjects) {
        var text = ok ? this.status.success : this.status.failure;

        if (!ok && brokenProjects && brokenProjects.length > 1) {
            text = text + ' (' + brokenProjects.length + ')';
        }

        //update output
        this.output.full_text = text;
        this.output.short_text = text;

        //set color
        if (this.color) {
            this.output.color = ok ? this.color.success : this.color.failure;
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
                url: this.url + '/repos/' + user + '?active=true',
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
                    result = result.filter((repo) => {
                        return this.project.includes(repo.slug);
                    });
                }

                //map output format
                result = result.map((repo) => {
                    return {
                        project: repo.slug,
                        ok: repo.last_build_state != 'errored' && repo.last_build_state != 'failed'
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
            forUser.forEach((project) => {
                result.push(project)
            })
        });
        return result;
    }
}
