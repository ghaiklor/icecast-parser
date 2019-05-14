const http = require('http');
const https = require('https');
const EventEmitter = require('events');
const StreamReader = require('./StreamReader');

/**
 * Default options
 * @description :: Default configuration object for RadioParser
 * @type {Object}
 * @private
 */
const DEFAULT_OPTIONS = {
  userAgent: 'Mozilla',
  keepListen: false,
  autoUpdate: true,
  errorInterval: 10 * 60,
  emptyInterval: 5 * 60,
  metadataInterval: 5
};

class RadioParser extends EventEmitter {
  /**
   * RadioParser class
   * @param {Object|String} options Configuration object or string with radio station URL
   * @constructor
   */
  constructor (options) {
    super();

    if (typeof options === 'string') {
      this.setConfig({ url: options });
    } else {
      this.setConfig(options);
    }

    this.queueRequest();
  }

  /**
   * When request to radio station is successful this function is called
   * @param response
   * @returns {RadioParser}
   * @private
   */
  _onRequestResponse (response) {
    const icyMetaInt = response.headers['icy-metaint'];

    if (icyMetaInt) {
      const reader = new StreamReader(icyMetaInt);

      reader.on('metadata', metadata => {
        this._destroyResponse(response);
        this._queueNextRequest(this.getConfig('metadataInterval'));
        this.emit('metadata', metadata);
      });

      response.pipe(reader);
      this.emit('stream', reader);
    } else {
      this._destroyResponse(response);
      this._queueNextRequest(this.getConfig('emptyInterval'));
      this.emit('empty');
    }

    return this;
  }

  /**
   * Called when some error in request is appears
   * @param error
   * @returns {RadioParser}
   * @private
   */
  _onRequestError (error) {
    this._queueNextRequest(this.getConfig('errorInterval'));
    this.emit('error', error);
    return this;
  }

  /**
   * Called when socket end
   * @returns {RadioParser}
   * @private
   */
  _onSocketEnd () {
    if (this.getConfig('keepListen')) this.emit('end');
    return this;
  }

  /**
   * Make request to radio station and get stream
   * @private
   */
  _makeRequest () {
    const request = (this.getConfig('url').indexOf('https://') === 0) ? https.request(this.getConfig('url')) : http.request(this.getConfig('url'));

    request.setHeader('Icy-MetaData', '1');
    request.setHeader('User-Agent', this.getConfig('userAgent'));
    request.once('socket', function (socket) {
      socket.once('end', this._onSocketEnd.bind(this));
    }.bind(this));
    request.once('response', this._onRequestResponse.bind(this));
    request.once('error', this._onRequestError.bind(this));
    request.end();

    return this;
  }

  /**
   * Check if response can be destroyed
   * @param {IncomingMessage} response
   * @returns {RadioParser}
   * @private
   */
  _destroyResponse (response) {
    if (!this.getConfig('keepListen')) response.destroy();
    return this;
  }

  /**
   * Queue next request with checking if next request is needed
   * @param {Number} timeout Timeout in seconds for next request
   * @returns {RadioParser}
   * @private
   */
  _queueNextRequest (timeout) {
    if (this.getConfig('autoUpdate') && !this.getConfig('keepListen')) this.queueRequest(timeout);
    return this;
  }

  /**
   * Queue request to radio station after some time
   * @param {Number} [timeout] Timeout in seconds
   * @returns {RadioParser}
   */
  queueRequest (timeout = 0) {
    setTimeout(this._makeRequest.bind(this), timeout * 1000);
    return this;
  }

  /**
   * Get configuration object or configuration value by key
   * @param {String} [key] Key name
   * @returns {*} Returns appropriate value by key or configuration object
   */
  getConfig (key) {
    return key ? this._config[key] : this._config;
  }

  /**
   * Set configuration object or set configuration key with new value
   * @param {Object} config New configuration object
   * @returns {RadioParser}
   */
  setConfig (config) {
    if (!this._config) {
      const defaultConfig = Object.assign({}, DEFAULT_OPTIONS);
      this._config = Object.assign(defaultConfig, config);
    } else {
      this._config = Object.assign(this._config, config);
    }

    return this;
  }
}

module.exports = RadioParser;
