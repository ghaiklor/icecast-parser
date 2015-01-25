var http = require('http'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter;

util.inherits(RadioParser, EventEmitter);

/**
 * RadioParser class
 * @param {Object|String} options Configuration object or string with radio station URL
 * @constructor
 */
function RadioParser(options) {
    EventEmitter.call(this);

    this.setConfig(options);
    this.queueRequest();
}

/**
 * When request to radio station is successful this function is called
 * @param {IncomingMessage} response
 * @private
 */
RadioParser.prototype._onRequestResponse = function (response) {
    var icyMetaInt = response.headers['icy-metaint'];

    if (icyMetaInt) {
        //    TODO: implement
    } else {
        //    TODO: implement
    }
};

RadioParser.prototype._onSocketResponse = function (socket) {
    // TODO: implement
};

RadioParser.prototype._onRequestError = function () {
    // TODO: implement
};

/**
 * Make request to radio station and get stream
 * @private
 */
RadioParser.prototype._makeRequest = function () {
    var request = http.request(this.getConfig('url'));
    request.setHeader('Icy-MetaData', '1');
    request.setHeader('User-Agent', 'Mozilla');
    request.once('response', this._onRequestResponse.bind(this));
    request.once('socket', this._onSocketResponse.bind(this));
    request.once('error', this._onRequestError.bind(this));
    request.end();
};

/**
 * Queue request to radio station after some time
 * @param {Number} [timeout] Timeout in seconds
 * @returns {RadioParser}
 */
RadioParser.prototype.queueRequest = function (timeout) {
    timeout = timeout || 0;

    setTimeout(this._makeRequest.bind(this), timeout * 1000);
    return this;
};

/**
 * Get configuration object or configuration value by key
 * @param {String} [key] Key name
 * @returns {*} Returns appropriate value by key or configuration object
 */
RadioParser.prototype.getConfig = function (key) {
    if (key) {
        return this._config[key];
    } else {
        return this._config;
    }
};

/**
 * Set configuration object or set configuration key with new value
 * @param {Object} config New configuration object
 * @returns {RadioParser}
 */
RadioParser.prototype.setConfig = function (config) {
    this._config = config;
    return this;
};

module.exports = RadioParser;
