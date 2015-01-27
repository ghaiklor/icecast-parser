# Changelog

## Version 2.0.0

- Refactor stream reader and rewrite it with Transform stream;
- Remove CLI from project (maybe in future will back);

## Version 1.4.0

- Implement SHOUTcast protocol support;
- Add CLI;
- Add option `--watch` in CLI;
- Add option `--listen` in CLI;
- Fix bug with parsing IP addresses and ports;

## Version 1.3.0

- Set `autoUpdate` by default to true;
- Fixed bug when metadata is empty and `.parse()` breaks the script;
- Write mocha tests;
- Integrate Travis CI;
- Update docs;

## Version 1.2.0

- Cleaning up in index;
- Implemented get\set for reader stream, so you can pipe in\out metadata stream;
- Implemented `keepListen` option. If `true` connection not closing and keep listen radio station;
- Add `stream` event so you can get stream when it will be available;
- Fix bug when `keepListen` and `autoUpdate` enabled at once (request overflow);

## Version 1.1.0

- Small improvements in code style;
- Realized queuing of requests;
- Implemented auto updating of metadata in economy mode;
- Added configuration object where you can set intervals for auto update (error, empty, metadata);

## Version 1.0.0

- Opens async connection to URL and get response stream;
- Realized Transform stream that access response stream and gets metadata from stream;
- Realized Parser class that parse metadata received from stream into readable object;
- Automatically close connection after getting metadata from radio station;
