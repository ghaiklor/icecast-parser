var assert = require('assert'),
    RadioParser = require('./../lib/index');

describe('RadioParser', function () {
    it('Should create new instance', function () {
        var radio = new RadioParser('http://streaming.radionomy.com/HammerHeadRadio');
        assert(radio instanceof RadioParser, 'Should be instance of RadioParser');
    });

    it('Should properly get/set config', function () {
        var radio = new RadioParser('http://streaming.radionomy.com/HammerHeadRadio');

        assert.deepEqual(radio.getConfig(), {
            url: 'http://streaming.radionomy.com/HammerHeadRadio',
            keepListen: false,
            autoUpdate: true,
            errorInterval: 10 * 60,
            emptyInterval: 5 * 60,
            metadataInterval: 5
        }, 'Should properly set default config');

        radio.setConfig({
            url: 'http://another-link.com',
            keepListen: true,
            autoUpdate: false,
            errorInterval: 1000,
            emptyInterval: 900,
            metadataInterval: 800
        });

        assert.deepEqual(radio.getConfig(), {
            url: 'http://another-link.com',
            keepListen: true,
            autoUpdate: false,
            errorInterval: 1000,
            emptyInterval: 900,
            metadataInterval: 800
        }, 'Should properly update config');

        radio.setConfig({
            url: 'http://streaming.radionomy.com/HammerHeadRadio'
        });

        assert.deepEqual(radio.getConfig(), {
            url: 'http://streaming.radionomy.com/HammerHeadRadio',
            keepListen: true,
            autoUpdate: false,
            errorInterval: 1000,
            emptyInterval: 900,
            metadataInterval: 800
        }, 'Should properly make particular update');

        assert.equal(radio.getConfig('keepListen'), true, 'Should properly get value from config by key');
    });

    it('Should properly emit metadata from Icecast', function (done) {
        this.timeout(5000);

        var radio = new RadioParser('http://streaming.radionomy.com/HammerHeadRadio');
        radio.on('metadata', function (metadata) {
            assert.equal(typeof metadata, 'object', 'Metadata should be object');
            assert.equal(typeof metadata.StreamTitle, 'string', 'StreamTitle should be string');
            console.log('Icecast -> ' + metadata.StreamTitle);
            done();
        });
    });

    it('Should properly emit metadata from ShoutCAST', function (done) {
        this.timeout(5000);

        var radio = new RadioParser('http://173.245.94.221/;?icy=http');
        radio.on('metadata', function (metadata) {
            assert.equal(typeof metadata, 'object', 'Metadata should be object');
            assert.equal(typeof metadata.StreamTitle, 'string', 'StreamTitle should be string');
            console.log('ShoutCAST -> ' + metadata.StreamTitle);
            done();
        });
    });
});
