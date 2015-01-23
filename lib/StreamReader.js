var util = require('util'),
    EventEmitter = require('events').EventEmitter;

util.inherits(StreamReader, EventEmitter);

/**
 * Transform stream for reading metadata
 * @constructor
 */
function StreamReader() {
}

module.exports = StreamReader;
