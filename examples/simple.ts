import { RadioParser } from '..';
const radioStation = new RadioParser({ url: 'https://live.hunter.fm/80s_high' });

// It will notify you every time when new metadata accepted
radioStation.on('metadata', (metadata: Map<string, string>) => process.stdout.write(metadata.get('StreamTitle')));
