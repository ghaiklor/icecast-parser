# icecast-parser

![Build Status](https://img.shields.io/travis/ghaiklor/icecast-parser.svg)
![Coverage](https://img.shields.io/coveralls/ghaiklor/icecast-parser.svg)
![Downloads](https://img.shields.io/npm/dm/icecast-parser.svg)
![Downloads](https://img.shields.io/npm/dt/icecast-parser.svg)

Node.js module for getting and parsing metadata from SHOUTcast/Icecast radio streams.

*NOTE: the server that serves radio station stream must support `Icy-Metadata` header. If that is not the case, this parser cannot parse the metadata from there.*

## Features

- Opens async connection to URL and gets response with radio stream and metadata. Then pipes the response to `Transform` stream for processing;
- Getting metadata from stream is implemented as `Transform` stream, so you can pipe it to another Writable\Duplex\Transform;
- Once it receives metadata, `metadata` event triggers with metadata object;
- After metadata is received, connection to radio station closes automatically, so you will not spend a lot of traffic;
- But you can set `keepListen` flag in configuration object and continue listening radio station;
- Auto updating metadata from radio station by interval in economical way (connection is opens when time has come);
- Metadata parsed as a `Map` with key-value;
- When you create a new instance, you get `EventEmitter`. So you can subscribe to other events;
- Easy to configure and use;

## Getting Started

You can install icecast-parser from npm.

```shell
npm install icecast-parser
```

Get your first metadata from radio station.

```typescript
import { Parser } from 'icecast-parser';

const radioStation = new Parser({ url: 'https://live.hunter.fm/80s_high' });
radioStation.on('metadata', (metadata) => process.stdout.write(`${metadata.get('StreamTitle') ?? 'unknown'}\n`));
```

## Configuration

You can provide additional parameters to constructor:

- `url` - by default empty and **REQUIRED**. Otherwise, you will get an error.
- `userAgent` - by default `icecast-parser`.
- `keepListen` - by default `false`. If you set to `true`, then response from radio station will not be destroyed and you can pipe it to another streams. E.g. piping it to the `speaker` module.
- `autoUpdate` - by default `true`. If you set to `false`, then parser will not be listening for recent updates and immediately close the stream. So that, you will get a metadata only once.
- `notifyOnChangeOnly` - by default `false`. If you set both `autoUpdate` and `notifyOnChangeOnly` to `true`, it will keep listening the stream and notifying you about metadata, but it will not notify if metadata did not change from the previous time.
- `errorInterval` - by default 10 minutes. If an error occurred when requesting, the next try will be executed after this interval. Works only if `autoUpdate` is enabled.
- `emptyInterval` - by default 5 minutes. If the request was fullfiled but the metadata field was empty, the next try will be executed after this interval. Works only if `autoUpdate` is enabled.
- `metadataInterval` - by default 5 seconds. If the request was fullfiled and the metadata was present, the next update will be scheduled after this interval. Works only if `autoUpdate` is enabled.

```typescript
import { Parser } from 'icecast-parser';

const radioStation = new Parser({
  autoUpdate: true,
  emptyInterval: 5 * 60,
  errorInterval: 10 * 60,
  keepListen: false,
  metadataInterval: 5,
  notifyOnChangeOnly: false,
  url: 'https://live.hunter.fm/80s_high',
  userAgent: 'Custom User Agent',
});

radioStation.on('metadata', (metadata) => process.stdout.write(`${metadata.get('StreamTitle') ?? 'unknown'}\n`));
```

## Events

You can subscribe to following events: `end`, `error`, `empty`, `metadata`, `stream`.

- `end` event triggers when connection to radio station was ended;
- `error` event triggers when connection to radio station was refused, rejected or timed out;
- `empty` event triggers when connection was established successfully, but the radio station doesn't have metadata in there;
- `metadata` event triggers when connection was established successfully and metadata is parsed;
- `stream` event triggers when response from radio station returned and successfully piped to `Transform` stream.

## License

[MIT](./LICENSE)
