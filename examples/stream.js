"use strict";

const Parser = require('../lib/index');
const radioStation = new Parser({
  url: 'http://streaming.radionomy.com/Elium-Rock',
  keepListen: true // keep listening radio station
});

radioStation.on('stream', stream => stream.pipe(process.stdout));
