"use strict";

const Parser = require('../lib/index');
const radioStation = new Parser({
  url: 'http://streaming.radionomy.com/Elium-Rock', // URL to radio station
  keepListen: false, // don't listen radio station after metadata was received
  autoUpdate: true, // update metadata after interval
  errorInterval: 10 * 60, // retry connection after 10 minutes
  emptyInterval: 5 * 60, // retry get metadata after 5 minutes
  metadataInterval: 5 // update metadata after 5 seconds
});

radioStation.on('metadata', function (metadata) {
  //Here you will receive metadata each 10 seconds
  console.log(metadata.StreamTitle);
});
