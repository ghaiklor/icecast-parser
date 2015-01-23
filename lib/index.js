var http = require('http'),
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
}

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
