'use strict';

var fs = require('fs');
var path = require('path');
var http = require('http');
var generate = require('placeholder-generator');

module.exports = function (HTTP_PORT) {
    var server = http.createServer();

    server.on('request', function (req, res) {
        var url = req.url;
        var contents;

        // console.error(['server request:', req.method, req.url]);
        switch(url) {
        case '/hello':
            contents = 'world';
            res.writeHead(200, {
                'Content-Length': Buffer.byteLength(contents),
                'Content-Type': 'text/plain' });
            res.write(contents);
            break;

        case '/large':
            contents = generate(1024 * 1024);
            res.writeHead(200, {
                'Content-Length': Buffer.byteLength(contents),
                'Content-Type': 'text/plain' });
            res.write(contents);
            break;

        case '/image/node_zero_gallery.jpg':
            contents = fs.readFileSync(path.join(__dirname, 'node_zero_gallery.jpg'));
            res.writeHead(200, {
                'Content-Length': contents.length,
                'Content-Type': 'image/jpeg' });
            res.write(contents, 'binary');
            break;

        default:
            res.write('Cat got your tongue?');
            break;
        }

        res.end();
    });

    server.listen(HTTP_PORT);
    return server;
};
