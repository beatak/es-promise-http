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
        var data;
        if ('object' === typeof request_body) {
            data = querystring.stringify(request_body);
        }
        else {
            data = request_body;
        }
        if (!option.headers) {
            option.headers = {};
        }
        if (!option.headers['Content-Type']) {
            option.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        if (!option.headers['User-Agent']) {
            option.headers['User-Agent'] = DEFAULT_UA;
        }
        option.headers['Content-Length'] = data.length;

        if (debug) {
            console.error(JSON.stringify(['REQUESTING: ', is_https, option, data], '\n', 2));
        }

        var req = carrier.request(option, function (response) {
            var result = [];
            if (debug) {
                console.error('STATUS: ' + response.statusCode);
                console.error('HEADERS: ' + JSON.stringify(response.headers));
            }
            response.setEncoding('utf8');
            response.on('data', function (chunk) {
                // result.push(chunk);
                result.push(chunk.toString());
            });
            response.on('end', function () {
                // fulfill(Buffer.concat(result, result.length));
                // fulfill only returns string now until
                // the buffer issue is fixed.
                var returning;
                try {
                    returning = result.join('');
                    fulfill(capsule(returning, response));
                }
                catch (er) {
                    reject(er);
                }
            });
        });
        req.on('error', function (err) {
            reject(err);
        });
        // data writing
        req.write(data);
        req.end();
    });
};

var capsule = function (value, response) {
    // probably should have binary option here.
    var result = new String(value);
    Object.defineProperty(
        result,
        'headers',
        {
            get: function (){return response.headers;}
        }
    );
    Object.defineProperty(
        result,
        'statusCode',
        {
            get: function (){return response.statusCode;}
        }
    );
    return result;
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

promise_http.get = function (myurl, body, option) {
    var arr = create_request_option(myurl, option);
    var param = arr[0];
    var is_https = arr[1];
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
