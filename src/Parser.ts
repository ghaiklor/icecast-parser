import { EventEmitter } from 'events';
import { StreamReader } from './StreamReader';
import http from 'http';
import https from 'https';

export interface ParserOptions {
  autoUpdate: boolean
  emptyInterval: number
  errorInterval: number
  keepListen: boolean
  metadataInterval: number
  notifyOnChangeOnly: string[]
  url: string
  userAgent: string
}

export interface ParserEvents {
  'empty': () => void
  'end': () => void
  'error': (error: Error) => void
  'metadata': (metadata: Map<string, string>) => void
  'stream': (stream: StreamReader) => void
}

export declare interface Parser {
  emit: <T extends keyof ParserEvents>(event: T, ...args: Parameters<ParserEvents[T]>) => boolean
  on: <T extends keyof ParserEvents>(event: T, listener: ParserEvents[T]) => this
}

export class Parser extends EventEmitter {
  private previousMetadata: Map<string, string> = new Map<string, string>();
  private readonly options: ParserOptions = {
    autoUpdate: true,
    emptyInterval: 5 * 60,
    errorInterval: 10 * 60,
    keepListen: false,
    metadataInterval: 5,
    notifyOnChangeOnly: [],
    url: '',
    userAgent: 'icecast-parser',
  };

  public constructor (options: Partial<ParserOptions>) {
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

        if (this.options.notifyOnChangeOnly && this.isMetadataChanged(metadata)) {
          this.previousMetadata = metadata;
          this.emit('metadata', metadata);
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
    if (!this.options.keepListen) {
      response.destroy();
    }
  }

  protected queueNextRequest (timeout: number): void {
    if (this.options.autoUpdate && !this.options.keepListen) {
      this.queueRequest(timeout);
    }
  }

  protected queueRequest (timeout = 0): void {
    setTimeout(this.makeRequest.bind(this), timeout * 1000);
  }

  protected isMetadataChanged (metadata: Map<string, string>): boolean {
    if (this.options.notifyOnChangeOnly.length > 0) {
      for (const key of this.options.notifyOnChangeOnly) {
        const data = metadata.get(key)
        if (data) {
          if (this.previousMetadata.get(key) !== data) {
            return true;
          }
        }
      }
    } else {
      for (const [key, value] of metadata.entries()) {
        if (this.previousMetadata.get(key) !== value) {
          return true;
        }
      }      
    }
    return false;
  }
}
