var util = require('util'),
    Transform = require('stream').Transform;

/**
 * Helper method that returns trampolined function
 * @param {Function} fn Function that need to trampoline
 * @return {Function} Returns trampolined function
 * @private
 */
function _trampoline(fn) {
    return function () {
        var result = fn.apply(this, arguments);

        while (typeof result === 'function') {
            result = result();
        }

        return result;
    };
}

/**
 * "Init" state
 * @description :: State which indicates that StreamReader is initializing
 * @type {Number}
 * @private
 */
var INIT_STATE = 1;

/**
 * "Buffering" state
 * @description :: State which indicates that StreamReader is grabbing data to buffer
 * @type {Number}
 * @private
 */
var BUFFERING_STATE = 2;

/**
 * "Pass through" state
 * @description :: State which indicates that StreamReader is just sends data without caching
 * @type {Number}
 * @private
 */
var PASSTHROUGH_STATE = 3;

/**
 * Block size of metadata
 * @description :: How many bytes need to multiply to number from response.headers['icy-metaint']
 * @type {Number}
 * @private
 */
var METADATA_BLOCK_SIZE = 16;

/**
 * Process one chunk of data
 * @param {StreamReader} stream StreamReader instance
 * @param {Buffer} chunk Chunk of data
 * @param {Function} done Triggers when processing is done
 * @returns {Function}
 * @private
 */
var _processData = function _processData(stream, chunk, done) {
    stream._bytesLeft -= chunk.length;

    if (stream._readerCurrentState === BUFFERING_STATE) {
        stream._readerBuffers.push(chunk);
        stream._readerBuffersLength += chunk.length;
    } else if (stream._readerCurrentState === PASSTHROUGH_STATE) {
        stream.push(chunk);
    }

    if (stream._bytesLeft === 0) {
        var cb = stream._readerCallback;

        if (cb && stream._readerCurrentState === BUFFERING_STATE && stream._readerBuffers.length > 1) {
            chunk = Buffer.concat(stream._readerBuffers, stream._readerBuffersLength);
        }

        if (stream._readerCurrentState !== BUFFERING_STATE) {
            chunk = null;
        }

        stream._readerCurrentState = INIT_STATE;
        stream._readerCallback = null;
        stream._readerBuffers.splice(0);
        stream._readerBuffersLength = 0;

        cb.call(stream, chunk);
    }

    return done;
};

/**
 * Function where sends all data from `_transform` function
 * @param {StreamReader} stream
 * @param {Buffer} chunk
 * @param {Function} done
 * @type {Function}
 * @private
 */
var _onData = _trampoline(function _onData(stream, chunk, done) {
    if (stream._bytesLeft <= 0) {
        return done(new Error("Transform stream is not parsing data anymore"));
    }

    if (chunk.length <= stream._bytesLeft) {
        return function () {
            return _processData(stream, chunk, done);
        };
    } else {
        return function () {
            var b = chunk.slice(0, stream._bytesLeft);
            return _processData(stream, b, function (err) {
                if (err) return done(err);

                if (chunk.length > b.length) {
                    return function () {
                        return _onData(stream, chunk.slice(b.length), done);
                    };
                }
            });
        };
    }
});

util.inherits(StreamReader, Transform);

/**
 * Creates new transform stream which emits `metadata` event when it will be read
 * @param {Number} icyMetaInt Number of bytes from response headers which shows how many bytes need to skip
 * @constructor
 */
function StreamReader(icyMetaInt) {
    Transform.call(this);

    // How many bytes left to read
    this._bytesLeft = 0;

    // Current state of reader, what the reader should do with received bytes
    this._readerCurrentState = INIT_STATE;

    // Callback for the next chunk
    this._readerCallback = null;

    // Array of Buffers for the next chunk
    this._readerBuffers = [];

    // How many bytes already read
    this._readerBuffersLength = 0;

    // icy-metaint number from radio response
    this._icyMetaInt = +icyMetaInt;

    this._passthrough(this._icyMetaInt, this._onMetaSectionStart);
}

/**
 * Collect bytes in buffer and trigger callback with collected chunk
 * @param {Number} length Length of bytes that need to read
 * @param {Function} cb Callback function with collected data in arguments
 * @private
 */
StreamReader.prototype._bytes = function (length, cb) {
    this._bytesLeft = length;
    this._readerCurrentState = BUFFERING_STATE;
    this._readerCallback = cb;
};

/**
 * Pass through Transform stream and trigger callback
 * @param {Number} length Length of bytes to pass through
 * @param {Function} cb Callback function when all data will be sent
 * @private
 */
StreamReader.prototype._passthrough = function (length, cb) {
    this._bytesLeft = length;
    this._readerCurrentState = PASSTHROUGH_STATE;
    this._readerCallback = cb;
};

/**
 * Transform stream processor
 * @param {Buffer} chunk
 * @param {Function} output
 * @param {Function} done
 * @returns {*}
 * @private
 */
StreamReader.prototype._transform = function (chunk, output, done) {
    output = typeof output === 'function' ? output : this.push.bind(this);
    _onData(this, chunk, output, done);
};

/**
 * Triggers when metadata section is starting
 * @private
 */
StreamReader.prototype._onMetaSectionStart = function () {
    this._bytes(1, this._onMetaSectionLengthByte);
};

/**
 * Triggers when we read 1 byte with metadata section length
 * @param chunk Chunk where located length byte
 * @private
 */
StreamReader.prototype._onMetaSectionLengthByte = function (chunk) {
    var length = chunk[0] * METADATA_BLOCK_SIZE;

    if (length > 0) {
        this._bytes(length, this._onMetaData);
    } else {
        this._passthrough(this._icyMetaInt, this._onMetaSectionStart);
    }
};

/**
 * Triggers when metadata is collected
 * @param chunk Metadata buffer
 * @private
 */
StreamReader.prototype._onMetaData = function (chunk) {
    this.emit('metadata', chunk);
    this._passthrough(this._icyMetaInt, this._onMetaSectionStart);
};

module.exports = StreamReader;
