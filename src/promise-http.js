'use strict';

var http = require('http');
var https = require('https');
var url = require('url');
var querystring = require('querystring');

var ALLOWED_REQUEST_OPTIONS = ['agent', 'auth', 'headers', 'host', 'hostname', 'keepAlive', 'keepAliveMsecs', 'localAddress', 'path', 'port', 'socketPath'];
var ALLOWED_URL_OPTIONS = ['auth', 'host', 'hostname', 'path', 'port'];
var DEFAULT_UA = 'Mozilla/5.0 (Node) Node (like Gecko)';

var debug = false;

var promise_http = function (option, request_body, is_https) {
    var er, carrier;

    if ('object' !== typeof option || null === option || Array.isArray(option)) {
        er = new Error('option needs to be an object');
        er.name = 'ArgumentError';
        throw er;
    }

    is_https = true == is_https;
    if (undefined === request_body) {
        request_body = {};
    }
    carrier = is_https ? https : http;

    return new Promise(function (fulfill, reject) {
        var body_data;
        if ('object' === typeof request_body) {
            body_data = querystring.stringify(request_body);
        }
        else {
            body_data = request_body;
        }
        if (!option.headers) {
            option.headers = {};
        }
        if (!option.headers['Content-Type'] && ('POST' === option.method || 'PUT' === option.method || body_data.length)) {
            option.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        if (!option.headers['User-Agent']) {
            option.headers['User-Agent'] = DEFAULT_UA;
        }
        // FIXME length maybe different for a) multibyte string or b) binary data
        option.headers['Content-Length'] = body_data.length;

        if (debug) {
            console.error('REQUEST: ' + JSON.stringify({is_https: is_https, option: option, data: body_data}));
        }

        var req = carrier.request(option, function (res) {
            var result = [];
            var is_binary = true;
            if (debug) {
                console.error('RESPONSE STATUS: ' + res.statusCode);
                console.error('RESPONSE HEADERS: ' + JSON.stringify(res.headers));
            }
            if (res.headers['content-type'] && 0 === res.headers['content-type'].indexOf('text')) {
                res.setEncoding('utf8');
                is_binary = false;
            }
            res.on('data', function (chunk) {
                result.push(chunk);
            });
            res.on('end', function () {
                var returning;
                if (is_binary) {
                    returning = Buffer.concat(result);
                }
                else {
                    returning = result.join('');
                }
                fulfill({
                    data: returning,
                    response: res
                });
            });
        });
        req.on('error', function (err) {
            reject(err);
        });

        // data writing
        req.write(body_data);
        req.end();
    });
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

promise_http.get = function (myurl, option) {
    var arr = create_request_option(myurl, option);
    var param = arr[0];
    var is_https = arr[1];
    var body = {};
    param.method = 'GET';
    return promise_http(param, body, is_https);
};

promise_http.post = function (myurl, body, option) {
    var arr = create_request_option(myurl, option);
    var param = arr[0];
    var is_https = arr[1];
    param.method = 'POST';
    return promise_http(param, body, is_https);
};

Object.defineProperty(
    promise_http,
    'debug',
    {
        get: function () {return debug;},
        set: function (v) {debug = !!v;}
    }
);

module.exports = promise_http;
