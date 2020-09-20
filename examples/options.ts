import { Parser } from '..';

const radioStation = new Parser({
  autoUpdate: true,
  emptyInterval: 5 * 60,
  errorInterval: 10 * 60,
  keepListen: false,
  metadataInterval: 5,
  notifyOnChangeOnly: true,
  url: 'https://live.hunter.fm/80s_high',
  userAgent: 'Custom User Agent',
});

radioStation.on('metadata', (metadata) => process.stdout.write(`${metadata.get('StreamTitle') ?? 'unknown'}\n`));
