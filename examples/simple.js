"use strict";

const Parser = require('../lib/index');
const radioStation = new Parser('http://streaming.radionomy.com:80/Elium-Rock');

// It will notify you every time when new metadata accepted
radioStation.on('metadata', metadata => console.log(metadata.StreamTitle));
