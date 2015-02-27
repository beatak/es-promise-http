'use strict';

var assert = require('assert');
var http = require('http');
var path = require('path');
var generate = require('placeholder-generator');

var PROJECT_ROOT = path.join(__dirname, '..');
var SRC_DIR = path.join(PROJECT_ROOT, 'src');
var TEST_DIR = path.join(PROJECT_ROOT, 'test');
var HTTP_PORT = 12388;

var promise_http = require(path.join(SRC_DIR, 'promise-http.js'));
var variation = require(path.join(TEST_DIR, 'type_variation.js'));
promise_http.debug = true;

describe('promise_http', function () {
    var server;
    var server_response;

    before(function () {
        server = http.createServer();
        server.on('request', function (req, res) {
            console.error(['server request:', req.method, req.url]);
            res.write('world');
            res.end();
        });
        server.listen(HTTP_PORT);
    });

    it('should raise errors if wrong arguments are passed', function () {
        Object.keys(variation).forEach(function (key) {
            if (key === 'Object') {
                return;
            }
            assert.throws(function () {
                promise_http(variation[key]);
            });
        });
    });

    it('should access server', function (done) {
        promise_http.get(
            '/hello',
            undefined,
            {port: HTTP_PORT}
        ).then(
            function (value) {
                try {
                    assert.equal('world', value);
                    done();
                }
                catch (er) {
                    done(er);
                }
            },
            function (reason) {
                done(reason);
            }
        );
    });
});
