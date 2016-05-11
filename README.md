# wgetpage
Download an HTML document with all dependencies (css, js, image, html)

## CLI

Install:

```sh
npm install -g wgetpage
```

Use:

```text
Usage: wgetpage <url>
```

Example:

```sh
wgetpage http://example.com
```
## API

```
npm install --save wgetpage
```

Use:

```js
var wget = require('wgetpage');

wget(url, dest, done);
```

Example:

```js
var wget = require('wgetpage');

const URL = 'http://example.com';
const DEST = '/tmp/output';

wget(URL, DEST, function() {
    console.log('done');
});
```
## License

This library is licensed under the MIT license.
