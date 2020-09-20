import { Parser } from '../src/Parser';

describe('parser', () => {
  it('should properly emit metadata event from the radio', async () => await new Promise((resolve) => {
    expect.hasAssertions();

    const radio = new Parser({ autoUpdate: false, url: 'https://live.hunter.fm/80s_high' });
    radio.on('metadata', (metadata) => {
      expect(metadata.size).toBe(2);
      expect(metadata.get('StreamTitle')).toStrictEqual(expect.any(String));
      expect(metadata.get('StreamUrl')).toStrictEqual(expect.any(String));
      resolve();
    });
  }));

  it('should properly emit empty event from the radio when no support', async () => await new Promise((resolve) => {
    expect.hasAssertions();

    let isMetadataFired = false;

    const radio = new Parser({ autoUpdate: false, url: 'http://stream-dc1.radioparadise.com:80/ogg-96m' });

    radio.on('metadata', (_metadata) => {
      isMetadataFired = true;
    });

    radio.on('empty', () => {
      expect(isMetadataFired).toBe(false);
      resolve();
    });
  }));

  it('should properly emit error event if request has failed', async () => await new Promise((resolve) => {
    expect.hasAssertions();

    let isMetadataFired = false;
    let isEmptyFired = false;

    const radio = new Parser({ autoUpdate: false, url: 'http://non-existing-url.com' });

    radio.on('metadata', (_metadata) => {
      isMetadataFired = true;
    });

    radio.on('empty', () => {
      isEmptyFired = true;
    });

    radio.on('error', (error) => {
      expect(isMetadataFired).toBe(false);
      expect(isEmptyFired).toBe(false);
      expect(error).toMatchObject({ errno: -3008, hostname: 'non-existing-url.com', syscall: 'getaddrinfo' });
      resolve();
    });
  }));
});
