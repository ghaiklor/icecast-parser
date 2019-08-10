const Transform = require('stream').Transform;

/**
 * "Init" state
 * @description :: State which indicates that StreamReader is initializing
 * @type {Number}
 * @private
 */
const INIT_STATE = 1;

/**
 * "Buffering" state
 * @description :: State which indicates that StreamReader is grabbing data to buffer
 * @type {Number}
 * @private
 */
const BUFFERING_STATE = 2;

/**
 * "Pass through" state
 * @description :: State which indicates that StreamReader is just sends data without caching
 * @type {Number}
 * @private
 */
const PASSTHROUGH_STATE = 3;

/**
 * Block size of metadata
 * @description :: How many bytes need to multiply to number from response.headers['icy-metaint']
 * @type {Number}
 * @private
 */
const METADATA_BLOCK_SIZE = 16;

/**
 * Regular expression used to match metadata from the stream
 * @description :: Key goes before `=` and value goes after it in quotes
 * @type {RegExp}
 * @private
 */
const METADATA_REGEX = /(\w+)=['"](.+?)['"];/g;

/**
 * Parse metadata to object
 * @param {Buffer|String} metadata Buffer or string with metadata information
 * @returns {Object}
 * @private
 */
const _parseMetadata = metadata => {
  const data = Buffer.isBuffer(metadata) ? metadata.toString('utf8') : metadata || '';
  const parts = [...data.replace(/\0*$/, '').matchAll(METADATA_REGEX)];

  return parts.reduce((metadata, item) => (metadata[item[1]] = String(item[2])) && metadata, {});
};

/**
 * Helper method that returns trampolined function
 * @param {Function} fn Function that need to trampoline
 * @returns {Function} Returns trampolined function
 * @private
 */
const _trampoline = function (fn) {
  return function () {
    let result = fn.apply(this, arguments);
    while (typeof result === 'function') result = result();
    return result;
  };
};

/**
 * Process one chunk of data
 * @param {StreamReader} stream StreamReader instance
 * @param {Buffer} chunk Chunk of data
 * @param {Function} done Triggers when processing is done
 * @returns {Function}
 * @private
 */
const _processData = (stream, chunk, done) => {
  stream._bytesLeft -= chunk.length;

  if (stream._currentState === BUFFERING_STATE) {
    stream._buffers.push(chunk);
    stream._buffersLength += chunk.length;
  } else if (stream._currentState === PASSTHROUGH_STATE) {
    stream.push(chunk);
  }

  if (stream._bytesLeft === 0) {
    const cb = stream._callback;

    if (cb && stream._currentState === BUFFERING_STATE && stream._buffers.length > 1) {
      chunk = Buffer.concat(stream._buffers, stream._buffersLength);
    } else if (stream._currentState !== BUFFERING_STATE) {
      chunk = null;
    }

    stream._currentState = INIT_STATE;
    stream._callback = null;
    stream._buffers.splice(0);
    stream._buffersLength = 0;

    cb.call(stream, chunk);
  }

  return done;
};

/**
 * Function to which sends all data from `_transform` function
 * @param {StreamReader} stream StreamReader instance
 * @param {Buffer} chunk Chunk of data
 * @param {Function} done Function that triggers when processing is done
 * @type {Function}
 * @private
 */
const _onData = _trampoline((stream, chunk, done) => {
  if (chunk.length <= stream._bytesLeft) {
    return () => _processData(stream, chunk, done);
  } else {
    return () => {
      const buffer = chunk.slice(0, stream._bytesLeft);

      return _processData(stream, buffer, error => {
        if (error) return done(error);
        if (chunk.length > buffer.length) {
          return () => _onData(stream, chunk.slice(buffer.length), done);
        }
      });
    };
  }
});

class StreamReader extends Transform {
  /**
   * Creates new transform stream which emits `metadata` event when it will be read
   * @param {Number} icyMetaInt Number of bytes from response headers which shows how many bytes need to skip
   * @constructor
   */
  constructor (icyMetaInt) {
    super();

    // How many bytes left to read
    this._bytesLeft = 0;

    // Current state of reader, what the reader should do with received bytes
    this._currentState = INIT_STATE;

    // Callback for the next chunk
    this._callback = null;

    // Array of collected Buffers
    this._buffers = [];

    // How many bytes already read
    this._buffersLength = 0;

    // icy-metaint number from radio response
    this._icyMetaInt = +icyMetaInt;

    this._passthrough(this._icyMetaInt, this._onMetaSectionStart);
  }

  /**
   * Collect bytes in buffer and trigger callback with collected chunk
   * @param {Number} length Length of bytes that need to read
   * @param {Function} cb Callback function with collected data in arguments
   * @returns {StreamReader}
   * @private
   */
  _bytes (length, cb) {
    this._bytesLeft = length;
    this._currentState = BUFFERING_STATE;
    this._callback = cb;
    return this;
  }

  /**
   * Pass through Transform stream and trigger callback after all data is sent
   * @param {Number} length Length of bytes to pass through
   * @param {Function} cb Callback function when all data will be sent
   * @returns {StreamReader}
   * @private
   */
  _passthrough (length, cb) {
    this._bytesLeft = length;
    this._currentState = PASSTHROUGH_STATE;
    this._callback = cb;
    return this;
  }

  /**
   * Transform stream processor
   * @param {Buffer} chunk Chunk of data
   * @param {String} encoding Current encoding of chunk
   * @param {Function} done Callback function when processing is done
   * @returns {Function}
   * @private
   */
  _transform (chunk, encoding, done) {
    _onData(this, chunk, done);
  }

  /**
   * Triggers when metadata section is starting
   * @private
   */
  _onMetaSectionStart () {
    this._bytes(1, this._onMetaSectionLengthByte);
  }

  /**
   * Triggers when we read 1 byte with metadata section length
   * @param chunk Chunk where located length byte
   * @private
   */
  _onMetaSectionLengthByte (chunk) {
    const length = chunk[0] * METADATA_BLOCK_SIZE;

    if (length > 0) {
      this._bytes(length, this._onMetaData);
    } else {
      this._passthrough(this._icyMetaInt, this._onMetaSectionStart);
    }
  }

  /**
   * Triggers when metadata is collected
   * @param chunk Metadata buffer
   * @private
   */
  _onMetaData (chunk) {
    this.emit('metadata', _parseMetadata(chunk));
    this._passthrough(this._icyMetaInt, this._onMetaSectionStart);
  }
}

module.exports = StreamReader;
