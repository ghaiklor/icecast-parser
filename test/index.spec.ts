import { RadioParser } from '..';

describe('radioParser', () => {
  it('should properly emit metadata from Icecast', async () => {
    expect.hasAssertions();

    const radio = new RadioParser({ url: 'https://live.hunter.fm/80s_high' });

    await new Promise((resolve) => {
      radio.on('metadata', (metadata) => {
        expect(metadata).toMatchObject({ StreamTitle: expect.any(String) });
        resolve();
      });
    });
  });
});
