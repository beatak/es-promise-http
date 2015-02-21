# promise-http

A promise interface to standard `http` object.  This needs EcmaScript standard `Promise`, so you might need `node v0.11+`?  Test and spec will come soon…

```
var http = require('es-promise-http');
http.get('http://www.google.com/')
	.then(
		function(str) {
			console.log(str)
		},
		function(er) {
			console.log(er);
		}
	);
```