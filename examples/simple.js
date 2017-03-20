const Parser = require('../src');
const radioStation = new Parser('http://online-kissfm.tavrmedia.ua/KissFM_deep');

// It will notify you every time when new metadata accepted
radioStation.on('metadata', metadata => console.log(metadata.StreamTitle));
