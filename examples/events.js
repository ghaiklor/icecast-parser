"use strict";

const Parser = require('../lib/index');
const radioStation = new Parser({
  url: 'http://streaming.radionomy.com/Elium-Rock',
  keepListen: true
});

radioStation.on('error', error => console.log(['Connection to', this.getConfig('url'), 'was rejected'].join(' ')));
radioStation.on('empty', () => console.log(['Radio station', this.getConfig('url'), 'doesn\'t have metadata'].join(' ')));
radioStation.on('metadata', metadata => console.log(metadata.StreamTitle));
