"use strict";

const Parser = require('../lib/index');
const Speaker = require('speaker');
const lame = require('lame');

const speaker = new Speaker();
const decoder = new lame.Decoder();
const radioStation = new Parser({
  url: 'http://streaming.radionomy.com/Elium-Rock',
  keepListen: true
});

radioStation.on('error', error => console.log(['Connection to', this.getConfig('url'), 'was rejected'].join(' ')));
radioStation.on('empty', () => console.log(['Radio station', this.getConfig('url'), 'doesn\'t have metadata'].join(' ')));
radioStation.on('metadata', metadata => console.log(metadata.StreamTitle));
radioStation.on('stream', stream => stream.pipe(decoder).pipe(speaker));
