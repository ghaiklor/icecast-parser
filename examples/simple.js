const Parser = require('..');
const radioStation = new Parser('https://live.hunter.fm/80s');

// It will notify you every time when new metadata accepted
radioStation.on('metadata', metadata => console.log(metadata.StreamTitle));
