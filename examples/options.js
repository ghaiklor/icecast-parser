const Parser = require('..');
const radioStation = new Parser({
  autoUpdate: true,
  emptyInterval: 5 * 60,
  errorInterval: 10 * 60,
  keepListen: false,
  metadataInterval: 5,
  notifyOnChangeOnly: true,
  url: 'https://live.hunter.fm/80s_high'
});

radioStation.on('metadata', (metadata) => console.log(metadata.StreamTitle));
