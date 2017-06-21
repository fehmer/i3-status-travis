'use strict';

import { expect } from 'chai';
import server from 'mockyeah';
import Travis from './../lib/index';
import request from 'request';

const options = {
    url: 'http://localhost:4001',
    user: 'fehmer',
    colorize: true
};

describe('Travis Module', function() {
    // remove service mocks after each test
    afterEach(() => server.reset());

    describe('#constructor', function() {
        it('should construct with defaults', () => {
            //construct block
            var block = new Travis({
                user: 'fehmer'
            });

            //expect url and user to be set
            expect(block.url).to.equal('https://api.travis-ci.org');
            expect(block.user).to.contain('fehmer');

            //expect the status text to be the default values
            expect(block.success.text).to.equal('');
            expect(block.failure.text).to.equal('');

            //expect color to be false
            expect(block.colorize).to.be.false;
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

        it('should fail without user', () => {

            expect(function() {
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
            expect(function() {
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
            expect(function() {
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


    describe('update for all projects', function() {
        it('should handle success', (done) => {

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


            execute(block, (output) => {
                //verify server interaction
                expectation.verify();

                //check output line
                expect(output.short_text).to.equal('');
                expect(output.full_text).to.equal('');
                expect(output.color).to.equal('#00FF00');

                done();
            });
        });

        it('should handle failures', (done) => {

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


            execute(block, (output) => {
                //verify server interaction
                expectation.verify();

                //check output line
                expect(output.short_text).to.equal('');
                expect(output.full_text).to.equal('');
                expect(output.color).to.equal('#FF0000');

                done();
            });
        });

        it('should handle multiple failures', (done) => {

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


            execute(block, (output) => {
                //verify server interaction
                expectation.verify();

                //check output line
                expect(output.short_text).to.equal(' (2)');
                expect(output.full_text).to.equal(' (2)');
                expect(output.color).to.equal('#FF0000');

                done();
            });
        });

        it('should handle errors', (done) => {

            //construct block
            var config = Object.assign({}, options);
            var block = new Travis(config, {});

            //prepare mock response, responds error
            const expectation = mock('/repos/fehmer', {
                active: 'true'
            });

            execute(block, (output) => {
                //verify server interaction
                expectation.verify();

                //check output line
                expect(output.short_text).to.equal('Error: Got response code 404');
                expect(output.full_text).to.equal('Error: Got response code 404');
                expect(output.color).to.be.undefined;

                done();
            });
        });

        it('should handle invalid results', (done) => {

            //construct block
            var config = Object.assign({}, options);
            var block = new Travis(config, {});

            //prepare mock response
            const expectation = mock('/repos/fehmer', {
                active: 'true'
            }, {});


            execute(block, (output) => {
                //verify server interaction
                expectation.verify();

                //check output line
                expect(output.short_text).to.equal('result does not contain any repo data');
                expect(output.full_text).to.equal('result does not contain any repo data');
                expect(output.color).to.be.undefined;

                done();
            });
        });

    });


    describe('update for filtered projects', function() {
        it('should handle success', (done) => {

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


            execute(block, (output) => {
                //verify server interaction
                expectation.verify();

                //check output line
                expect(output.short_text).to.equal('');
                expect(output.full_text).to.equal('');

                done();
            });
        });

        it('should handle failures', (done) => {

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


            execute(block, (output) => {
                //verify server interaction
                expectation.verify();

                //check output line
                expect(output.short_text).to.equal('');
                expect(output.full_text).to.equal('');

                done();
            });
        });


        it('should handle multiple failures', (done) => {

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


            execute(block, (output) => {
                //verify server interaction
                expectation.verify();

                //check output line
                expect(output.short_text).to.equal(' (2)');
                expect(output.full_text).to.equal(' (2)');

                done();
            });
        });

        it('should handle errors', (done) => {

            //construct block, filter two projects
            var config = Object.assign({}, options, {
                project: ['fehmer/i3-status-gitlab', 'fehmer/i3-status']
            });
            var block = new Travis(config, {});

            //prepare mock response, responds error
            const expectation = mock('/repos/fehmer', {
                active: 'true'
            });

            execute(block, (output) => {
                //verify server interaction
                expectation.verify();

                //check output line
                expect(output.short_text).to.equal('Error: Got response code 404');
                expect(output.full_text).to.equal('Error: Got response code 404');

                done();
            });
        });
    });


    describe('update with token', function() {
        it('should handle success', (done) => {

            //construct block, filter two projects
            var config = Object.assign({}, options, {
                token: 'mySecret'
            });
            var block = new Travis(config, {});

            //prepare mock response
            const expectation = server
                .get('/repos/fehmer', {
                    json: {
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
                    }
                })
                .expect()
                .params({
                    active: 'true'
                })
                .header('User-Agent', 'i3-status-travis/1.0.0')
                .header('Accept', 'application/vnd.travis-ci.2+json')
                .header('Authorization', 'token mySecret')
                .once();

            execute(block, (output) => {
                //verify server interaction
                expectation.verify();

                //check output line
                expect(output.short_text).to.equal('');
                expect(output.full_text).to.equal('');

                done();
            });
        });
    });

    describe('generateHtmlStatus', function() {
        it('should handle all success', (done) => {

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


            execute(block, (output) => {
                //verify server interaction
                expectation.verify();

                //check output line
                var report = block.generateHtmlStatus();

                expect(report.content).to.be.equal('<ul></ul>');

                done();
            });
        });

        it('should handle errors', (done) => {

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


            execute(block, (output) => {
                //verify server interaction
                expectation.verify();

                //check output line
                var report = block.generateHtmlStatus();

                expect(report.content).to.be.equal('<ul><li><div class="circle circle-red"></div><a href="https://travis-ci.org/fehmer/c-project">fehmer/c-project</a></li><li><div class="circle circle-red"></div><a href="https://travis-ci.org/fehmer/b-project">fehmer/b-project</a></li></ul>');

                done();
            });
        });
    });



})


//copied from i3-status
function execute(block, verify) {
    block.name = block.constructor.name;

    block.on('updated', function(target, output) {
        clearInterval(block.interval);

        expect(target.name).to.equal(block.name);
        verify(output);
    });

    //simulate set interval, will never fire
    block._interval = 10000;
    block.interval = setInterval(() => {
        block.update();
    }, block._interval);

    block.update();
}

function mock(url, params, response) {
    var result;

    if (response) {
        result = server.get(url, {
            json: response
        });
    } else {
        result = server.get(url, {
            status: 404
        });
    }

    return result
        .expect()
        .params(params)
        .header('User-Agent', 'i3-status-travis/1.0.0')
        .header('Accept', 'application/vnd.travis-ci.2+json')
        .once();
}