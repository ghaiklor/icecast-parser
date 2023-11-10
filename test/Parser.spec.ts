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

  it('should properly emit metadata event when metadata has been updated', async () => await new Promise((resolve) => {
    expect.hasAssertions();

    const radio = new Parser({ autoUpdate: false, notifyOnChangeOnly: [], url: 'https://live.hunter.fm/80s_high' });
    radio.on('metadata', (metadata) => {
      // @ts-expect-error I want to check that metadata was stored in the private property to later comparsion
      expect(radio.previousMetadata).toStrictEqual(metadata);
      resolve();
    });
  }));

  it('should properly emit metadata event when notifyOnChangeOnly is used and when metadata has been updated', async () => await new Promise((resolve) => {
    expect.hasAssertions()

    const radio = new Parser({ autoUpdate: false, notifyOnChangeOnly: ['StreamTitle'], url: 'https://live.hunter.fm/80s_high' });
    radio.on('metadata', (metadata) => {
      // @ts-expect-error I want to check that metadata was stored in the private property to later comparsion
      expect(radio.previousMetadata).toStrictEqual(metadata);
      resolve();
    });
  }))

  it('should not emmit metadata event if notifyOnChangeOnly is incorrect', async () => await new Promise(async (resolve) => {
    let triggered = false
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    const radio = new Parser({ autoUpdate: false, notifyOnChangeOnly: ['a'], url: 'https://live.hunter.fm/80s_high' });
    radio.on('metadata', () => {
      triggered = true
    });

    await delay(1000)

    if(!triggered) {
      resolve()
    } else {
      throw new Error('metadata event was triggered - Check that the notifyOnChangeOnly data does not exist in the metadata')
    }
  }))
});
