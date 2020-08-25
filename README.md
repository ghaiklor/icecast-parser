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

```typescript
import { RadioParser } from 'icecast-parser';

const radioStation = new RadioParser({ url: 'https://live.hunter.fm/80s_high' });
radioStation.on(
  'metadata',
  (metadata: Map<string, string>) => process.stdout.write(`${metadata.get('StreamTitle') ?? 'unknown'}\n`)
);
```

## Configuration

You can provide additional parameters to constructor:

- `url` - by default empty and **REQUIRED**.
- `userAgent` - by default `icecast-parser`. You can set userAgent from request.
- `keepListen` - by default `false`. If you set to `true`, then response from radio station is not destroys and you can pipe it to another streams.
- `autoUpdate` - by default `true`. If you set to `false`, then parser will not be listening for recent updates and immediately close the stream. So you will get a metadata only once.
- `notifyOnChangeOnly` - by default `false`. If you set both `autoUpdate` and `notifyOnChangeOnly` to `true`, it will keep listening the stream and notifying you about metadata, but it will not notify if metadata did not change from the previous time.
- `errorInterval` - by default `600` s. You can set interval in seconds when next try will be executed if connection was refused or rejected. Works only if `autoUpdate` is enabled.
- `emptyInterval` - by default `300` s. You can set interval in seconds when next try will be executed if metadata is empty. Works only if `autoUpdate` is enabled.
- `metadataInterval` - by default `5` s. You can set interval in seconds when will be next update of metadata. Works only if `autoUpdate` is enabled.

```typescript
import { RadioParser } from 'icecast-parser';

const radioStation = new RadioParser({
  autoUpdate: true,
  emptyInterval: 5 * 60,
  errorInterval: 10 * 60,
  keepListen: false,
  metadataInterval: 5,
  notifyOnChangeOnly: false,
  url: 'https://live.hunter.fm/80s_high'
});

radioStation.on(
  'metadata',
  (metadata: Map<string, string>) => process.stdout.write(`${metadata.get('StreamTitle') ?? 'unknown'}\n`)
);
```

## Events

You can subscribe to 5 events - `end`, `error`, `empty`, `metadata`, `stream`.

- `end` event triggers when connection to radio station was finished;
- `error` event triggers when connection to radio station was refused, rejected or timed out;
- `empty` event triggers when connection was established successful, but radio station doesn't return metaint byte in response headers;
- `metadata` event triggers when connection was established successful and metadata is parsed successful;
- `stream` event triggers when response from radio station returned and successfully piped to Transform stream.

## How to get radio's stream for your purposes

You can use `stream` event for that.
When connection is established, parser is sending stream as first argument to your listener.

**Note:** You **MUST** enable `keepListen` in configuration object.

```typescript
import { RadioParser } from 'icecast-parser';

const radioStation = new RadioParser({
  url: 'https://live.hunter.fm/80s',
  keepListen: true
});

radioStation.on('stream', function(stream) {
  stream.pipe(process.stdout);
});
```

## License

[MIT](./LICENSE)
