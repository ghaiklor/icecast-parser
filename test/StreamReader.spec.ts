/* eslint-disable no-return-assign */
/* eslint-disable jest/no-test-callback */

import { StreamReader } from '../src/StreamReader';

describe('streamReader', () => {
  it('should properly instantiate reader', () => {
    expect.hasAssertions();

    const reader = new StreamReader(1);
    expect(reader).toBeInstanceOf(StreamReader);
  });

  it('should properly parse stream data', (done) => {
    expect.hasAssertions();

    const reader = new StreamReader(1);
    const data = 'f\0a\0k\0e\x02StreamTitle=\'fake metadata\';\0\0\0\0 \0d\0a\0t\0a';

    let output = '';
    let calledMetadata = false;

    reader.on('metadata', (metadata: Map<string, string>) => {
      expect(metadata.get('StreamTitle')).toBe('fake metadata');
      calledMetadata = true;
    });

    reader.on('data', (data) => output += data);
    reader.on('end', () => {
      expect(calledMetadata).toBe(true);
      expect(output).toBe('fake data');
      done();
    });

    reader.end(data);
  });

  it('should properly parse stream data with several semicolons', (done) => {
    expect.hasAssertions();

    const reader = new StreamReader(1);
    const data = 'f\0a\0k\0e\x02StreamTitle=\'fake; meta;data\';\0\0 \0d\0a\0t\0a';

    let output = '';
    let calledMetadata = false;

    reader.on('metadata', (metadata: Map<string, string>) => {
      expect(metadata.get('StreamTitle')).toBe('fake; meta;data');
      calledMetadata = true;
    });

    reader.on('data', (data) => output += data);
    reader.on('end', () => {
      expect(calledMetadata).toBe(true);
      expect(output).toBe('fake data');
      done();
    });

    reader.end(data);
  });

  it('should properly parse stream data with several semicolons and parts', (done) => {
    expect.hasAssertions();

    // eslint-disable-next-line max-len
    const data = 'f\0a\0k\0e\x08StreamTitle=\'Kurtis; Blow; - Basketball; (1984)\';StreamUrl=\'&artist=Kurtis%20Blow&title=Basketball%20(1984)&idthumb=538\';\0\0\0\0\0\0\0 \0d\0a\0t\0a';
    const reader = new StreamReader(1);

    let output = '';
    let calledMetadata = false;

    reader.on('metadata', (metadata: Map<string, string>) => {
      expect(metadata.get('StreamTitle')).toBe('Kurtis; Blow; - Basketball; (1984)');
      expect(metadata.get('StreamUrl')).toBe('&artist=Kurtis%20Blow&title=Basketball%20(1984)&idthumb=538');
      calledMetadata = true;
    });

    reader.on('data', (data) => output += data);
    reader.on('end', () => {
      expect(calledMetadata).toBe(true);
      expect(output).toBe('fake data');
      done();
    });

    reader.end(data);
  });

  it('should properly parse stream data with several quotes inside', (done) => {
    expect.hasAssertions();

    // eslint-disable-next-line max-len
    const data = 'f\0a\0k\0e\x08StreamTitle=\'Talk Talk - It\'s My Life (1984)\';StreamUrl=\'&artist=Talk%20Talk&title=It%27s%20My%20Life%20(1984)&idthumb=765\';\0\0\0\0 \0d\0a\0t\0a';
    const reader = new StreamReader(1);

    let output = '';
    let calledMetadata = false;

    reader.on('metadata', (metadata: Map<string, string>) => {
      expect(metadata.get('StreamTitle')).toBe('Talk Talk - It\'s My Life (1984)');
      expect(metadata.get('StreamUrl')).toBe('&artist=Talk%20Talk&title=It%27s%20My%20Life%20(1984)&idthumb=765');
      calledMetadata = true;
    });

    reader.on('data', (data) => output += data);
    reader.on('end', () => {
      expect(calledMetadata).toBe(true);
      expect(output).toBe('fake data');
      done();
    });

    reader.end(data);
  });
});
