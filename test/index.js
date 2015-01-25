var assert = require('assert'),
    RadioParser = require('./../lib/index');

describe('RadioParser', function () {
    it('Should create new instance', function () {
        var radio = new RadioParser('http://streaming.radionomy.com/HammerHeadRadio');
        assert(radio instanceof RadioParser, 'Should be instance of RadioParser');
    });

    it('Should properly get/set link', function () {
        var radio = new RadioParser('http://wrong-link.com');
        assert.equal(radio.getConfig('url'), 'http://wrong-link.com', 'Should properly set link');

        radio.setConfig('url', 'http://streaming.radionomy.com/HammerHeadRadio');
        assert.equal(radio.getConfig('url'), 'http://streaming.radionomy.com/HammerHeadRadio', 'Should properly set empty link');
    });

    it('Should properly get/set config', function () {
        var radio = new RadioParser('http://streaming.radionomy.com/HammerHeadRadio');

        assert.deepEqual(radio.getConfig(), {
            keepListen: false,
            autoUpdate: true,
            errorInterval: 5 * 60,
            emptyInterval: 3 * 60,
            metadataInterval: 10
        }, 'Should properly set default config');

        radio.setConfig({
            keepListen: true,
            autoUpdate: false,
            errorInterval: 1000,
            emptyInterval: 900,
            metadataInterval: 800
        });

        assert.deepEqual(radio.getConfig(), {
            keepListen: true,
            autoUpdate: false,
            errorInterval: 1000,
            emptyInterval: 900,
            metadataInterval: 800
        }, 'Should properly update config');

        assert.equal(radio.getConfig('keepListen'), true, 'Should properly get value from config by key');
    });

    it('Should properly emit metadata', function (done) {
        var radio = new RadioParser('http://streaming.radionomy.com/HammerHeadRadio');
        radio.on('metadata', function (metadata) {
            assert.equal(typeof metadata, 'object', 'Metadata should be object');
            assert.equal(typeof metadata.StreamTitle, 'string', 'StreamTitle should be string');
            done();
        });
    });
});
