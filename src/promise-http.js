'use strict';

var http = require('http');
var https = require('https');
var url = require('url');
var querystring = require('querystring');

var ALLOWED_REQUEST_OPTIONS = ['agent', 'auth', 'headers', 'host', 'hostname', 'keepAlive', 'keepAliveMsecs', 'localAddress', 'path', 'port', 'socketPath'];
var ALLOWED_URL_OPTIONS = ['auth', 'host', 'hostname', 'path', 'port'];

var debug = false;

var promise_http = function (option, is_https, request_body) {
    var carrier = is_https ? https : http;
    request_body = request_body || {};
    return (new Promise(function (fullfill, reject) {
        var req = carrier.request(option, function (response) {
            if (debug) {
                console.error('STATUS: ' + response.statusCode);
                console.error('HEADERS: ' + JSON.stringify(response.headers));
            }
            response.setEncoding('utf8');            

            var result = [];
            response.on('data', function (chunk) {
                result.push(chunk);
            }).on('end', function () {
                fullfill(Buffer.concat(result));
            });
        });
        req.on('error', function (err) {
            reject(err);
        });
        // data writing
        req.write(querystring.stringify(request_body));
        req.end();
    }));
};

var create_request_option = function (myurl, option) {
    var param,
        result = {},
        is_https = false;
    option = option || {};
    // only allowed option will be passed
    if (Object.keys(option).length) {
        ALLOWED_REQUEST_OPTIONS.forEach(function (key) {
            if (option[key]) {
                result[key] = option[key];
            }
        });
    }
    // url.parse() may fail
    try {
        param = url.parse(myurl);
    }
    catch(er) {
        param = {};
    }
    if (Object.keys(param).length) {
        ALLOWED_URL_OPTIONS.forEach(function (key) {
            if (param[key]) {
                result[key] = param[key];
            }
        });
        is_https = 'https:' === param.protocol;
    }
    return [result, is_https];
};

promise_http.get = function (myurl, option, body) {
    var arr = create_request_option(myurl, option);
    var param = arr[0];
    var is_https = arr[1];
    param.method = 'GET';
    return promise_http(param, is_https, body);
};

promise_http.post = function (myurl, option, body) {
    var arr = create_request_option(myurl, option);
    var param = arr[0];
    var is_https = arr[1];
    param.method = 'POST';
    return promise_http(param, is_https, body);
};

module.exports = promise_http;
