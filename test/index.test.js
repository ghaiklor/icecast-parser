const assert = require('chai').assert;
const RadioParser = require('../src');

describe('RadioParser', () => {
  it('Should properly create new instance', () => {
    const radio = new RadioParser('https://live.hunter.fm/80s_high');
    assert.instanceOf(radio, RadioParser);
  });

  it('Should properly create new instance with options', () => {
    const radio = new RadioParser({ url: 'https://live.hunter.fm/80s_high' });
    assert.instanceOf(radio, RadioParser);
  });

  it('Should properly get/set config', () => {
    const radio = new RadioParser('https://live.hunter.fm/80s_high');

    assert.deepEqual(radio.getConfig(), {
      url: 'https://live.hunter.fm/80s_high',
      keepListen: false,
      autoUpdate: true,
      notifyOnChangeOnly: false,
      errorInterval: 10 * 60,
      emptyInterval: 5 * 60,
      metadataInterval: 5,
      userAgent: 'Mozilla'
    });

    assert.instanceOf(radio.setConfig({
      url: 'http://another-link.com',
      userAgent: 'Not-Mozilla',
      keepListen: true,
      autoUpdate: false,
      notifyOnChangeOnly: true,
      errorInterval: 1000,
      emptyInterval: 900,
      metadataInterval: 800
    }), RadioParser);

    assert.deepEqual(radio.getConfig(), {
      url: 'http://another-link.com',
      userAgent: 'Not-Mozilla',
      keepListen: true,
      autoUpdate: false,
      notifyOnChangeOnly: true,
      errorInterval: 1000,
      emptyInterval: 900,
      metadataInterval: 800
    });

    assert.instanceOf(radio.setConfig({
      url: 'https://live.hunter.fm/80s_high'
    }), RadioParser);

    assert.deepEqual(radio.getConfig(), {
      url: 'https://live.hunter.fm/80s_high',
      userAgent: 'Not-Mozilla',
      keepListen: true,
      autoUpdate: false,
      notifyOnChangeOnly: true,
      errorInterval: 1000,
      emptyInterval: 900,
      metadataInterval: 800
    });

    assert.ok(radio.getConfig('keepListen'));
  });

  it('Should properly emit metadata from Icecast', done => {
    const radio = new RadioParser('https://live.hunter.fm/80s_high');
    radio.on('metadata', metadata => {
      assert.isObject(metadata);
      assert.isString(metadata.StreamTitle);
      done();
    });
  });

  it('Should properly emit metadata with notifyOnChangeOnly property', done => {
    const radio = new RadioParser({ url: 'https://live.hunter.fm/80s_high', notifyOnChangeOnly: true });
    let firstMetadata = {};
    let secondMetadata = {};
    setTimeout(function () {
      if (JSON.stringify(firstMetadata) !== JSON.stringify(secondMetadata))
        assert(true);
      done();
    }, 5000);

    radio.on('metadata', metadata => {
      if (JSON.stringify(firstMetadata) !== "{}") secondMetadata = metadata;
      if (JSON.stringify(firstMetadata) === "{}") firstMetadata = metadata;
    });
  });
});
