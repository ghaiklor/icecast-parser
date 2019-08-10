const assert = require('chai').assert;
const StreamReader = require('../../src/StreamReader');

describe('StreamReader', () => {
  it('Should properly instantiate reader', () => {
    const reader = new StreamReader(1);
    assert.instanceOf(reader, StreamReader);
  });

  it('Should properly parse stream data', done => {
    const reader = new StreamReader(1);
    const data = "f\0a\0k\0e\x02StreamTitle='fake metadata';\0\0\0\0 \0d\0a\0t\0a";

    let output = '';
    let calledMetadata = false;

    reader.on('metadata', metadata => {
      assert.isObject(metadata);
      assert.equal(metadata.StreamTitle, 'fake metadata');
      calledMetadata = true;
    });

    reader.on('data', data => (output += data));
    reader.on('end', () => {
      assert.ok(calledMetadata);
      assert.equal(output, 'fake data');
      done();
    });

    reader.end(data);
  });

  it('Should properly parse stream data with several semicolons', done => {
    const reader = new StreamReader(1);
    const data = "f\0a\0k\0e\x02StreamTitle='fake; meta;data';\0\0 \0d\0a\0t\0a";

    let output = '';
    let calledMetadata = false;

    reader.on('metadata', metadata => {
      assert.isObject(metadata);
      assert.equal(metadata.StreamTitle, 'fake; meta;data');
      calledMetadata = true;
    });

    reader.on('data', data => (output += data));
    reader.on('end', () => {
      assert.ok(calledMetadata);
      assert.equal(output, 'fake data');
      done();
    });

    reader.end(data);
  });

  it('Should properly parse stream data with several semicolons and parts', done => {
    const reader = new StreamReader(1);
    const data = "f\0a\0k\0e\x08StreamTitle='Kurtis; Blow; - Basketball; (1984)';StreamUrl='&artist=Kurtis%20Blow&title=Basketball%20(1984)&idthumb=538';\0\0\0\0\0\0\0 \0d\0a\0t\0a";

    let output = '';
    let calledMetadata = false;

    reader.on('metadata', metadata => {
      assert.isObject(metadata);
      assert.equal(metadata.StreamTitle, 'Kurtis; Blow; - Basketball; (1984)');
      assert.equal(metadata.StreamUrl, '&artist=Kurtis%20Blow&title=Basketball%20(1984)&idthumb=538');
      calledMetadata = true;
    });

    reader.on('data', data => (output += data));
    reader.on('end', () => {
      assert.ok(calledMetadata);
      assert.equal(output, 'fake data');
      done();
    });

    reader.end(data);
  });

  it('Should properly parse stream data with several quotes inside', done => {
    const reader = new StreamReader(1);
    const data = "f\0a\0k\0e\x08StreamTitle='Talk Talk - It's My Life (1984)';StreamUrl='&artist=Talk%20Talk&title=It%27s%20My%20Life%20(1984)&idthumb=765';\0\0\0\0 \0d\0a\0t\0a";

    let output = '';
    let calledMetadata = false;

    reader.on('metadata', metadata => {
      assert.isObject(metadata);
      assert.equal(metadata.StreamTitle, "Talk Talk - It's My Life (1984)");
      assert.equal(metadata.StreamUrl, '&artist=Talk%20Talk&title=It%27s%20My%20Life%20(1984)&idthumb=765');
      calledMetadata = true;
    });

    reader.on('data', data => (output += data));
    reader.on('end', () => {
      assert.ok(calledMetadata);
      assert.equal(output, 'fake data');
      done();
    });

    reader.end(data);
  });
});
