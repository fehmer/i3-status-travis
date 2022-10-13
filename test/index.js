'use strict';

import { expect } from 'chai';
import nock from 'nock'
import Travis from './../src/index.js';
import request from 'request';

const options = {
    url: 'http://localhost:4001',
    user: 'fehmer',
    colorize: true
};

describe('Travis Module', ()=> {
    // remove service mocks after each test
    afterEach(() => {
        nock.isDone();
        nock.cleanAll();
    });

    describe('#constructor', ()=> {
        it('should construct with defaults', () => {
            //construct block
            var block = new Travis({
                user: 'fehmer'
            });

            //expect url and user to be set
            expect(block.url).to.equal('https://api.travis-ci.org');
            expect(block.projectUrl).to.equal('https://travis-ci.org');
            expect(block.user).to.contain('fehmer');

            //expect the status text to be the default values
            expect(block.success.text).to.equal('');
            expect(block.failure.text).to.equal('');
            expect(block.success.color).to.equal('#00FF00');
            expect(block.failure.color).to.equal('#FF0000');

            //expect color to be false
            expect(block.colorize).to.be.false;

            //expect report defaults
            expect(block.report.dots).to.be.true;
            expect(block.report.showSuccess).to.be.false;
            expect(block.report.sortByName).to.be.false;
        });

        it('should construct with custom url', () => {
            //construct block
            var block = new Travis({
                url: 'https://my.travis-server.tld',
                user: 'peter'
            });

            //expect url to be set
            expect(block.url).to.equal('https://my.travis-server.tld');
        });

        it('should construct with custom status', () => {
            //use a config with custom status texts
            var config = Object.assign({}, options, {
                success: {
                    text: 'OK'
                },
                failure: {
                    text: 'DOOMED'
                }
            });

            //construct block
            var block = new Travis(config);

            //expect the custom status texts to be set
            expect(block.success.text).to.equal('OK');
            expect(block.failure.text).to.equal('DOOMED');
        });

        it('should construct with default colors if colorize is enabled', () => {
            //enable colors in config
            var config = Object.assign({}, options, {
                colorize: true
            });

            //construct block
            var block = new Travis(config);

            //check colors
            expect(block.success.color).to.equal('#00FF00');
            expect(block.failure.color).to.equal('#FF0000');
        });

        it('should construct with custom colors', () => {
            //enable colors in config
            var config = Object.assign({}, options, {
                success: {
                    color: '#88FF88'
                },
                failure: {
                    color: '#FF8888'
                }
            });

            //construct block
            var block = new Travis(config);

            //check colors
            expect(block.success.color).to.equal('#88FF88');
            expect(block.failure.color).to.equal('#FF8888');
        });

        it('should construct with custom report', () => {
            //enable colors in config
            var config = Object.assign({}, options, {
                report: {
                    dots: false,
                    showSuccess: true,
                    sortByName: true

                }
            });

            //construct block
            var block = new Travis(config);

            //check report values
            expect(block.report.dots).to.be.false;
            expect(block.report.showSuccess).to.be.true;
            expect(block.report.sortByName).to.be.true;
        });

        it('should fail without user', () => {

            expect(()=> {
                var client = new Travis({});
            }).to.throw('config value user is missing');
        });

        it('should fail with invalid user type', () => {
            //enable project filter in config
            var config = Object.assign({}, options, {
                user: {
                    test: 'test'
                }
            });

            //construct block
            expect(()=> {
                var client = new Travis(config);
            }).to.throw('config value user must be a string or an array');
        });


        it('should construct with single project filter', () => {
            //enable project filter in config
            var config = Object.assign({}, options, {
                project: 'i3-status-gitlab'
            });

            //construct block
            var block = new Travis(config);

            //check project filter
            expect(block.project).to.be.a('array');
            expect(block.project).to.include('i3-status-gitlab');
        });

        it('should construct with single project filter', () => {
            //enable project filter in config
            var config = Object.assign({}, options, {
                project: ['i3-status-gitlab', 'i3-status']
            });

            //construct block
            var block = new Travis(config);

            //check project filter
            expect(block.project).to.be.a('array');
            expect(block.project).to.include('i3-status-gitlab');
            expect(block.project).to.include('i3-status');
        });

        it('should fail with invalid project type', () => {
            //enable project filter in config
            var config = Object.assign({}, options, {
                project: {
                    test: 'test'
                }
            });

            //construct block
            expect(()=> {
                var client = new Travis(config);
            }).to.throw('config value project must be a string or an array');
        });


        it('should construct with token', () => {
            //enable project filter in config
            var config = Object.assign({}, options, {
                token: 'secretToken'
            });

            //construct block
            var block = new Travis(config);

            //check token
            expect(block.token).to.equal('secretToken');
        });

    });


    describe('update for all projects', ()=> {
        it('should handle success',  async () => {

            //construct block
            var config = Object.assign({}, options);
            var block = new Travis(config, {});

            //prepare mock response
            const expectation = mock('/repos/fehmer', {
                active: 'true'
            }, {
                repos: [{
                    id: 1,
                    slug: 'fehmer/i3-status-travis',
                    last_build_state: 'passed'
                }, {
                    id: 2,
                    slug: 'fehmer/i3-status-gitlab',
                    last_build_state: null
                }, {
                    id: 3,
                    slug: 'fehmer/i3-status',
                    last_build_state: ''
                }]
            });

            const output = await execute(block);
            //verify server interaction
            expectation.isDone();

            //check output line
            expect(output.short_text).to.equal('');
            expect(output.full_text).to.equal('');
            expect(output.color).to.equal('#00FF00');
        });

        it('should handle failures', async() => {

            //construct block
            var config = Object.assign({}, options);
            var block = new Travis(config, {});

            //prepare mock response
            const expectation = mock('/repos/fehmer', {
                active: 'true'
            }, {
                repos: [{
                    id: 1,
                    slug: 'fehmer/i3-status-travis',
                    last_build_state: 'errored'
                }, {
                    id: 2,
                    slug: 'fehmer/i3-status-gitlab',
                    last_build_state: null
                }, {
                    id: 3,
                    slug: 'fehmer/i3-status',
                    last_build_state: ''
                }]
            });

            const output = await execute(block);
            //verify server interaction
            expectation.isDone();

            //check output line
            expect(output.short_text).to.equal('');
            expect(output.full_text).to.equal('');
            expect(output.color).to.equal('#FF0000');
        });

        it('should handle multiple failures', async() => {

            //construct block
            var config = Object.assign({}, options);
            var block = new Travis(config, {});

            //prepare mock response
            const expectation = mock('/repos/fehmer', {
                active: 'true'
            }, {
                repos: [{
                    id: 1,
                    slug: 'fehmer/i3-status-travis',
                    last_build_state: 'failed'
                }, {
                    id: 2,
                    slug: 'fehmer/i3-status-gitlab',
                    last_build_state: 'errored'
                }, {
                    id: 3,
                    slug: 'fehmer/i3-status',
                    last_build_state: ''
                }]
            });

            const output = await execute(block);
            //verify server interaction
            expectation.isDone();

            //check output line
            expect(output.short_text).to.equal(' (2)');
            expect(output.full_text).to.equal(' (2)');
            expect(output.color).to.equal('#FF0000');
        });

        it('should handle errors', async() => {

            //construct block
            var config = Object.assign({}, options);
            var block = new Travis(config, {});

            //prepare mock response, responds error
            const expectation = mock('/repos/fehmer', {
                active: 'true'
            });
            const output = await execute(block);
            //verify server interaction
            expectation.isDone();

            //check output line
            expect(output.short_text).to.equal('Error: Got response code 404');
            expect(output.full_text).to.equal('Error: Got response code 404');
            expect(output.color).to.be.undefined;
        });

        it('should handle invalid results', async() => {

            //construct block
            var config = Object.assign({}, options);
            var block = new Travis(config, {});

            //prepare mock response
            const expectation = mock('/repos/fehmer', {
                active: 'true'
            }, {});

            const output = await execute(block);
            //verify server interaction
            expectation.isDone();

            //check output line
            expect(output.short_text).to.equal('result does not contain any repo data');
            expect(output.full_text).to.equal('result does not contain any repo data');
            expect(output.color).to.be.undefined;
        });

    });


    describe('update for filtered projects', ()=> {
        it('should handle success', async() => {

            //construct block, filter two projects
            var config = Object.assign({}, options, {
                project: ['fehmer/i3-status-gitlab', 'fehmer/i3-status']
            });
            var block = new Travis(config, {});

            //prepare mock response
            const expectation = mock('/repos/fehmer', {
                active: 'true'
            }, {
                repos: [{
                    id: 1,
                    slug: 'fehmer/i3-status-travis',
                    last_build_state: 'errored'
                }, {
                    id: 2,
                    slug: 'fehmer/i3-status-gitlab',
                    last_build_state: null
                }, {
                    id: 3,
                    slug: 'fehmer/i3-status',
                    last_build_state: ''
                }]
            });

            const output = await execute(block);
            //verify server interaction
            expectation.isDone();

            //check output line
            expect(output.short_text).to.equal('');
            expect(output.full_text).to.equal('');
        });

        it('should handle failures', async() => {

            //construct block, filter two projects
            var config = Object.assign({}, options, {
                project: ['fehmer/i3-status-gitlab', 'fehmer/i3-status']
            });
            var block = new Travis(config, {});

            //prepare mock response
            const expectation = mock('/repos/fehmer', {
                active: 'true'
            }, {
                repos: [{
                    id: 1,
                    slug: 'fehmer/i3-status-travis',
                    last_build_state: 'errored'
                }, {
                    id: 2,
                    slug: 'fehmer/i3-status-gitlab',
                    last_build_state: 'errored'
                }, {
                    id: 3,
                    slug: 'fehmer/i3-status',
                    last_build_state: ''
                }]
            });

            const output = await execute(block);
            //verify server interaction
            expectation.isDone();

            //check output line
            expect(output.short_text).to.equal('');
            expect(output.full_text).to.equal('');
        });


        it('should handle multiple failures', async() => {

            //construct block, filter two projects
            var config = Object.assign({}, options, {
                project: ['fehmer/i3-status-gitlab', 'fehmer/i3-status']
            });
            var block = new Travis(config, {});

            //prepare mock response
            const expectation = mock('/repos/fehmer', {
                active: 'true'
            }, {
                repos: [{
                    id: 1,
                    slug: 'fehmer/i3-status-travis',
                    last_build_state: 'errored'
                }, {
                    id: 2,
                    slug: 'fehmer/i3-status-gitlab',
                    last_build_state: 'errored'
                }, {
                    id: 3,
                    slug: 'fehmer/i3-status',
                    last_build_state: 'errored'
                }]
            });

            const output = await execute(block);
            //verify server interaction
            expectation.isDone();

            //check output line
            expect(output.short_text).to.equal(' (2)');
            expect(output.full_text).to.equal(' (2)');
        });

        it('should handle errors', async() => {

            //construct block, filter two projects
            var config = Object.assign({}, options, {
                project: ['fehmer/i3-status-gitlab', 'fehmer/i3-status']
            });
            var block = new Travis(config, {});

            //prepare mock response, responds error
            const expectation = mock('/repos/fehmer', {
                active: 'true'
            });
            const output = await execute(block);
            //verify server interaction
            expectation.isDone();

            //check output line
            expect(output.short_text).to.equal('Error: Got response code 404');
            expect(output.full_text).to.equal('Error: Got response code 404');
        });
    });

    describe('update with token', ()=> {
        it('should handle success', async() => {

            //construct block, filter two projects
            var config = Object.assign({}, options, {
                token: 'mySecret'
            });
            var block = new Travis(config, {});

            //prepare mock response
            const expectation = mock('/repos/fehmer', 
                /* query */ { active: 'true' },
                /* result */ { repos: [] }, 
                /* additonalHeaders: */ { 'Authorization':'token mySecret'}
            );


            const output = await execute(block);
            //verify server interaction
            expectation.isDone();

            //check output line
            expect(output.short_text).to.equal('');
            expect(output.full_text).to.equal('');
        });
    });

    describe('generateHtmlStatus', ()=> {
        it('should handle all success', async() => {

            //construct block
            var config = Object.assign({}, options);
            var block = new Travis(config, {});

            //prepare mock response
            const expectation = mock('/repos/fehmer', {
                active: 'true'
            }, {
                repos: [{
                    id: 1,
                    slug: 'fehmer/i3-status-travis',
                    last_build_state: 'passed'
                }, {
                    id: 2,
                    slug: 'fehmer/i3-status-gitlab',
                    last_build_state: null
                }, {
                    id: 3,
                    slug: 'fehmer/i3-status',
                    last_build_state: ''
                }]
            });

            const output = await execute(block);
            expectation.isDone();

            //check output line
            var report = block.generateHtmlStatus();

            expect(report.content).to.be.equal('<ul></ul>');
        });

        it('should handle errors', async() => {

            //construct block
            var config = Object.assign({}, options);
            var block = new Travis(config, {});

            //prepare mock response
            const expectation = mock('/repos/fehmer', {
                active: 'true'
            }, {
                repos: [{
                    id: 1,
                    slug: 'fehmer/a-project',
                    last_build_state: 'passed'
                }, {
                    id: 3,
                    slug: 'fehmer/c-project',
                    last_build_state: 'failed'
                }, {
                    id: 5,
                    slug: 'fehmer/b-project',
                    last_build_state: 'failed'
                }]
            });

            const output = await execute(block);
            //verify server interaction
            expectation.isDone();

            //check output line
            var report = block.generateHtmlStatus();

            expect(report.content).to.be.equal('<ul><li><div class="circle circle-red"></div><a href="https://travis-ci.org/fehmer/c-project">fehmer/c-project</a></li><li><div class="circle circle-red"></div><a href="https://travis-ci.org/fehmer/b-project">fehmer/b-project</a></li></ul>');
        });

    });
    describe('#flatten', ()=> {
        it('should flatten structure', () => {

            //construct block
            const config = Object.assign({}, options);
            const block = new Travis(config, {});

            const result = block.flatten([
                [{
                    project: 'fehmer/a-project',
                    ok: true,
                    build: true
                },
                    {
                        project: 'fehmer/c-project',
                        ok: false,
                        build: true
                    }], [
                    {
                        project: 'fehmer/b-project',
                        ok: false,
                        build: true
                    }]
            ]
            );

            expect(result).to.be.an('array').that.has.lengthOf(3);
            expect(result[0].project).to.equal('fehmer/a-project');
            expect(result[1].project).to.equal('fehmer/c-project');
            expect(result[2].project).to.equal('fehmer/b-project');
        });
    });
})


async function execute(block) {
    return await new Promise(resolve => {
        block.update();
        block.on("updated", async(target, output) => {
            resolve(output);
        });
    });
}

function mock(url, params, response, additionalHeaders) {
    var reqheaders = {
        'User-Agent': 'i3-status-travis/2.0.0',
        'Accept': 'application/vnd.travis-ci.2+json',
        ...additionalHeaders
    }
    var result = nock('http://localhost:4001/', {
        reqheaders    
    })
    .get(url)
    .query(params)
    .delayConnection(20);

    if (response) {
        result = result.reply(200, response);
    } else {
        result = result.reply(404);
    }

    return result;
}