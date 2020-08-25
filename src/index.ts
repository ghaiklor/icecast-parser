import { EventEmitter } from 'events';
import { StreamReader } from './StreamReader';
import http from 'http';
import https from 'https';

export interface Options {
  autoUpdate: boolean;
  emptyInterval: number;
  errorInterval: number;
  keepListen: boolean;
  metadataInterval: number;
  notifyOnChangeOnly: boolean;
  url: string;
  userAgent: string;
}

export class RadioParser extends EventEmitter {
  private previousMetadata = '';
  private readonly options: Options = {
    autoUpdate: true,
    emptyInterval: 5 * 60,
    errorInterval: 10 * 60,
    keepListen: false,
    metadataInterval: 5,
    notifyOnChangeOnly: false,
    url: '',
    userAgent: 'icecast-parser'
  };

  public constructor (options: Partial<Options>) {
    super();

    this.options = { ...this.options, ...options };
    this.queueRequest();
  }

  protected onRequestResponse (response: http.IncomingMessage): void {
    const icyMetaInt = response.headers['icy-metaint'];

    if (typeof icyMetaInt === 'undefined') {
      this.destroyResponse(response);
      this.queueNextRequest(this.options.emptyInterval);
      this.emit('empty');
    } else {
      const reader = new StreamReader(Array.isArray(icyMetaInt) ? Number(icyMetaInt[0]) : Number(icyMetaInt));

      reader.on('metadata', (metadata: Map<string, string>) => {
        this.destroyResponse(response);
        this.queueNextRequest(this.options.metadataInterval);

        const newMetadata = JSON.stringify(metadata);
        if (this.options.notifyOnChangeOnly && newMetadata !== this.previousMetadata) {
          this.emit('metadata', metadata);
          this.previousMetadata = newMetadata;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (!this.options.notifyOnChangeOnly) {
          this.emit('metadata', metadata);
        }
      });

      response.pipe(reader);
      this.emit('stream', reader);
    }
  }

  protected onRequestError (error: Error): void {
    this.queueNextRequest(this.options.errorInterval);
    this.emit('error', error);
  }

  protected onSocketEnd (): void {
    if (this.options.keepListen) {
      this.emit('end');
    }
  }

  protected makeRequest (): void {
    const request = this.options.url.startsWith('https://')
      ? https.request(this.options.url)
      : http.request(this.options.url);

    request.setHeader('Icy-MetaData', '1');
    request.setHeader('User-Agent', this.options.userAgent);
    request.once('socket', (socket) => socket.once('end', this.onSocketEnd.bind(this)));
    request.once('response', this.onRequestResponse.bind(this));
    request.once('error', this.onRequestError.bind(this));
    request.end();
  }

  protected destroyResponse (response: http.IncomingMessage): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!this.options.keepListen) {
      response.destroy();
    }
  }

  protected queueNextRequest (timeout: number): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this.options.autoUpdate && !this.options.keepListen) {
      this.queueRequest(timeout);
    }
  }

  protected queueRequest (timeout = 0): void {
    setTimeout(this.makeRequest.bind(this), timeout * 1000);
  }
}
