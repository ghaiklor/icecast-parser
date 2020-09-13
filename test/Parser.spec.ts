import { Parser } from '../src/Parser';

describe('parser', () => {
  it('should properly emit metadata from icecast', async () => await new Promise((resolve) => {
    expect.hasAssertions();

    const radio = new Parser({ autoUpdate: false, url: 'https://live.hunter.fm/80s_high' });
    radio.on('metadata', (metadata) => {
      expect(metadata.get('StreamTitle')).toStrictEqual(expect.any(String));
      resolve();
    });
  }));
});
