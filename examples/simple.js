"use strict";

const Parser = require('../lib/index');
const radioStation = new Parser('http://streaming.radionomy.com:80/Elium-Rock');

radioStation.on('metadata', function (metadata) {
  console.log([metadata.StreamTitle, 'is playing on', this.getConfig('url')].join(' '));
});
