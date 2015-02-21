'use strict';

var assert = require('assert');
var path = require('path');

var PROJECT_ROOT = path.join(__dirname, '..');
var SRC_DIR = path.join(PROJECT_ROOT, 'src');
var TEST_DIR = path.join(PROJECT_ROOT, 'test');

var promise_http = require(path.join(SRC_DIR, 'promise-http.js'));
var variation = require(path.join(TEST_DIR, 'type_variation.js'));
// preprocess_argv.debug = true;

describe('promise_http', function () {
    it('should be okay', function () {
    });
});
