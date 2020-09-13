import { Parser } from '..';

const radioStation = new Parser({ url: 'https://live.hunter.fm/80s_high' });
radioStation.on('metadata', (metadata) => process.stdout.write(`${metadata.get('StreamTitle') ?? 'unknown'}\n`));
