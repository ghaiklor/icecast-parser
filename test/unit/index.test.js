import { assert } from 'chai';
import RadioParser from '../../src/index';

describe('RadioParser', () => {
  it('Should create new instance', () => {
    const radio = new RadioParser('http://streaming.radionomy.com/HammerHeadRadio');
    assert.instanceOf(radio, RadioParser);
  });

  it('Should properly get/set config', () => {
    const radio = new RadioParser('http://streaming.radionomy.com/HammerHeadRadio');

    assert.deepEqual(radio.getConfig(), {
      url: 'http://streaming.radionomy.com/HammerHeadRadio',
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
      url: 'http://streaming.radionomy.com/HammerHeadRadio'
    }), RadioParser);

    assert.deepEqual(radio.getConfig(), {
      url: 'http://streaming.radionomy.com/HammerHeadRadio',
      keepListen: true,
      autoUpdate: false,
      errorInterval: 1000,
      emptyInterval: 900,
      metadataInterval: 800
    });

    assert.ok(radio.getConfig('keepListen'));
  });

  it('Should properly emit metadata from Icecast', done => {
    this.timeout(5000);

    const radio = new RadioParser('http://streaming.radionomy.com/HammerHeadRadio');
    radio.on('metadata', metadata => {
      assert.isObject(metadata);
      assert.isString(metadata.StreamTitle);
      done();
    });
  });

  it('Should properly emit metadata from ShoutCAST', done => {
    this.timeout(5000);

    const radio = new RadioParser('http://173.245.94.221/;?icy=http');
    radio.on('metadata', metadata => {
      assert.isObject(metadata);
      assert.isString(metadata.StreamTitle);
      done();
    });
  });
});
