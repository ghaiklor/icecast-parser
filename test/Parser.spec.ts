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
});
