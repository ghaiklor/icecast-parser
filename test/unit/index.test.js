const assert = require('chai').assert;
const RadioParser = require('../../src');

describe('RadioParser', () => {
  it('Should properly create new instance', () => {
    const radio = new RadioParser('http://online-kissfm.tavrmedia.ua/KissFM_deep');
    assert.instanceOf(radio, RadioParser);
  });

  it('Should properly create new instance with options', () => {
    const radio = new RadioParser({url: 'http://online-kissfm.tavrmedia.ua/KissFM_deep'});
    assert.instanceOf(radio, RadioParser);
  });

  it('Should properly get/set config', () => {
    const radio = new RadioParser('http://online-kissfm.tavrmedia.ua/KissFM_deep');

    assert.deepEqual(radio.getConfig(), {
      url: 'http://online-kissfm.tavrmedia.ua/KissFM_deep',
      keepListen: false,
      autoUpdate: true,
      errorInterval: 10 * 60,
      emptyInterval: 5 * 60,
      metadataInterval: 5
    });

    assert.instanceOf(radio.setConfig({
      url: 'http://another-link.com',
      keepListen: true,
      autoUpdate: false,
      errorInterval: 1000,
      emptyInterval: 900,
      metadataInterval: 800
    }), RadioParser);

    assert.deepEqual(radio.getConfig(), {
      url: 'http://another-link.com',
      keepListen: true,
      autoUpdate: false,
      errorInterval: 1000,
      emptyInterval: 900,
      metadataInterval: 800
    });

    assert.instanceOf(radio.setConfig({
      url: 'http://online-kissfm.tavrmedia.ua/KissFM_deep'
    }), RadioParser);

    assert.deepEqual(radio.getConfig(), {
      url: 'http://online-kissfm.tavrmedia.ua/KissFM_deep',
      keepListen: true,
      autoUpdate: false,
      errorInterval: 1000,
      emptyInterval: 900,
      metadataInterval: 800
    });

    assert.ok(radio.getConfig('keepListen'));
  });

  it('Should properly emit metadata from Icecast', done => {
    const radio = new RadioParser('http://online-kissfm.tavrmedia.ua/KissFM_deep');
    radio.on('metadata', metadata => {
      assert.isObject(metadata);
      assert.isString(metadata.StreamTitle);
      done();
    });
  });
});
