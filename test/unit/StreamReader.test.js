const assert = require('chai').assert;
const StreamReader = require('../../src/StreamReader');

describe('StreamReader', () => {
  it('Should properly instantiate reader', () => {
    const reader = new StreamReader(1);
    assert.instanceOf(reader, StreamReader);
  });

  it('Should properly parse stream data', done => {
    const reader = new StreamReader(1);
    const data = "f\0a\0k\0e\u0002StreamTitle='fake metadata'\0\0\0\0\0 \0d\0a\0t\0a";

    let output = '';
    let calledMetadata = false;

    reader.on('metadata', metadata => {
      assert.isObject(metadata);
      assert.equal(metadata.StreamTitle, 'fake metadata');
      calledMetadata = true;
    });

    reader.on('data', data => output += data);
    reader.on('end', () => {
      assert.ok(calledMetadata);
      assert.equal(output, 'fake data');
      done();
    });

    reader.end(data);
  });
});
