var assert = require('assert'),
    StreamReader = require('./../lib/StreamReader');

describe('StreamReader', function () {
    it('Should instantiate reader', function () {
        var reader = new StreamReader(1);
        assert(reader instanceof StreamReader, 'Should be instance of StreamReader');
    });

    it('Should properly parse stream data', function (done) {
        var reader = new StreamReader(1),
            data = "f\0a\0k\0e\u0001metadata\0\0\0\0\0\0\0\0 \0d\0a\0t\0a",
            output = '',
            calledMetadata = false;

        reader.on('metadata', function (metadata) {
            assert(Buffer.isBuffer(metadata), 'Metadata should be buffer');
            assert.equal(metadata.length, 16, 'Length of metadata should be 16');
            assert.equal(metadata.toString('utf8'), 'metadata\0\0\0\0\0\0\0\0', 'Metadata should get successfully');
            calledMetadata = true;
        });

        reader.on('data', function (data) {
            output += data;
        });

        reader.on('end', function () {
            assert(calledMetadata, 'Metadata event should triggering');
            assert.equal(output, 'fake data', 'Output should be equal to source fake data');
            done();
        });

        reader.end(data);
    });
});
