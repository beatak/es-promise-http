'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var PROJECT_ROOT = path.join(__dirname, '..');
var SRC_DIR = path.join(PROJECT_ROOT, 'src');
var TEST_DIR = path.join(PROJECT_ROOT, 'test');
var HTTP_PORT = 12388;

var promise_http = require(path.join(SRC_DIR, 'promise-http.js'));
var variation = require(path.join(TEST_DIR, 'type_variation.js'));
var myserver = require(path.join(TEST_DIR, 'server.js'));

promise_http.debug = true;

describe('promise_http', function () {
    var server;

    before(function () {
        server = myserver(HTTP_PORT);
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

    it('should be able to access to a server', function (done) {
        promise_http.get(
            '/hello',
            {port: HTTP_PORT}
        ).then(
            function (value) {
                try {
                    assert.equal('world', value.data.toString());
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

    it('should fetch a large (1M+) data', function (done) {
        promise_http.get(
            '/large',
            {port: HTTP_PORT}
        ).then(
            function (value) {
                // console.error(value);
                try {
                    assert.strictEqual(true, value.data.toString().length > 1000000);
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

    it('should fetch an image', function (done) {
        promise_http.get(
            '/image/node_zero_gallery.jpg',
            {port: HTTP_PORT}
        ).then(
            function (value) {
                // console.error(value);
                try {
                    var image = fs.readFileSync(path.join(TEST_DIR, 'node_zero_gallery.jpg'));
                    assert.strictEqual(0, image.compare(value.data));
                    done();
                }
                catch (er) {
                    done(er.stack);
                }
            },
            function (reason) {
                done(reason);
            }
        );
    });
});
