# icecast-parser

![Build Status](https://img.shields.io/travis/ghaiklor/icecast-parser.svg)
![Coverage](https://img.shields.io/coveralls/ghaiklor/icecast-parser.svg)
![Downloads](https://img.shields.io/npm/dm/icecast-parser.svg)
![Downloads](https://img.shields.io/npm/dt/icecast-parser.svg)

Node.js module for getting and parsing metadata from SHOUTcast/Icecast radio streams.

## Features

- Opens async connection to URL and gets response with radio stream and metadata. Then pipes response to Transform stream for processing;
- Getting metadata from stream is realized in Transform stream, so you can pipe radio station stream to another Writable\Duplex\Transform stream;
- Once metadata is received, `metadata` event triggers with metadata object;
- After metadata is received, connection to radio station closes automatically, so you will not spent a lot of traffic;
- But you can set `keepListen` flag in config object and continue listening radio station;
- Auto updating metadata from radio station by interval in economical way (connection is opens when time has come);
- Metadata parsed as a Map with key-value;
- When you create new instance, you get EventEmitter. So you can subscribe to other events;
- Easy to configure and use;

## Getting started

You can install icecast-parser from npm.

```shell
npm install icecast-parser
```

Get your first metadata from radio station.

```javascript
const Parser = require('icecast-parser');
const radioStation = new Parser({ url: 'https://live.hunter.fm/80s_high' });

radioStation.on('metadata', function(metadata) {
    console.log([metadata.get('StreamTitle'), 'is playing on', this.getConfig('url')].join(' '));
});
```

## Configuration

You can provide additional parameters to constructor:

- `url` - by default empty and **REQUIRED**.
- `userAgent` - by default `Mozilla`. You can set userAgent from request.
- `keepListen` - by default `false`. If you set to `true`, then response from radio station is not destroys and you can pipe it to another streams.
- `autoUpdate` - by default `true`. If you set to `false`, then parser will not be listening for recent updates and immediately close the stream. So you will get a metadata only once.
- `notifyOnChangeOnly` - by default `false`. If you set both `autoUpdate` and `notifyOnChangeOnly` to `true`, it will keep listening the stream and notifying you about metadata, but it will not notify if metadata did not change from the previous time.
- `errorInterval` - by default `600` s. You can set interval in seconds when next try will be executed if connection was refused or rejected. Works only if `autoUpdate` is enabled.
- `emptyInterval` - by default `300` s. You can set interval in seconds when next try will be executed if metadata is empty. Works only if `autoUpdate` is enabled.
- `metadataInterval` - by default `5` s. You can set interval in seconds when will be next update of metadata. Works only if `autoUpdate` is enabled.

```javascript
const Parser = require('icecast-parser');

const radioStation = new Parser({
    url: 'https://live.hunter.fm/80s', // URL to radio station
    userAgent: 'Parse-Icy', // userAgent to request
    keepListen: false, // don't listen radio station after metadata was received
    autoUpdate: true, // update metadata after interval
    notifyOnChangeOnly: true, // notify if metadata really changed
    errorInterval: 10 * 60, // retry connection after 10 minutes
    emptyInterval: 5 * 60, // retry get metadata after 5 minutes
    metadataInterval: 5 // update metadata after 5 seconds
});

radioStation.on('metadata', function(metadata) {
    console.log('Here you will receive metadata each 10 seconds');
    console.log(metadata.StreamTitle);
});
```

## Events

You can subscribe to 5 events - `end`, `error`, `empty`, `metadata`, `stream`.

- `end` event triggers when connection to radio station was finished;
- `error` event triggers when connection to radio station was refused, rejected or timed out;
- `empty` event triggers when connection was established successful, but radio station doesn't return metaint byte in response headers;
- `metadata` event triggers when connection was established successful and metadata is parsed successful;
- `stream` event triggers when response from radio station returned and successfully piped to Transform stream.

```javascript
const Parser = require('icecast-parser');

const radioStation = new Parser({
    url: 'https://live.hunter.fm/80s'
    keepListen: true
});

radioStation.on('end', function(error) {
    console.log(['Connection to', this.getConfig('url'), 'was finished'].join(' '));
});

radioStation.on('error', function(error) {
    console.log(['Connection to', this.getConfig('url'), 'was rejected'].join(' '));
});

radioStation.on('empty', function() {
    console.log(['Radio station', this.getConfig('url'), 'doesn\'t have metadata'].join(' '));
});

radioStation.on('metadata', function(metadata) {
    console.log(metadata.StreamTitle);
});

radioStation.on('stream', function(stream) {
    stream.pipe(process.stdout);
});
```

## How to get radio's stream for your purposes

You can use `stream` event for that.
When connection is established, parser is sending stream as first argument to your listener.

**Note:** You **MUST** enable `keepListen` in configuration object.

```javascript
const Parser = require('icecast-parser');

const radioStation = new Parser({
    url: 'https://live.hunter.fm/80s',
    keepListen: true // keep listening radio station
});

radioStation.on('stream', function(stream) {
    stream.pipe(process.stdout); // Stream it's readable stream and you can pipe it to any writable stream
});
```

## License

The MIT License (MIT)

Copyright (c) 2016 Eugene Obrezkov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
