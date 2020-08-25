import { Transform } from 'stream';

const METADATA_BLOCK_SIZE = 16;
const METADATA_REGEX = /(?<key>\w+)=['"](?<value>.+?)['"];/g;

const enum STATES {
  INIT_STATE,
  BUFFERING_STATE,
  PASSTHROUGH_STATE
}

type Trampoline<T> = T | ((...args: never[]) => Trampoline<T>);
type TransformCallback = (error: Error | null, data?: Buffer) => void;

const parseMetadata = (metadata: Buffer | string): Map<string, string> => {
  const map = new Map<string, string>();
  const data = Buffer.isBuffer(metadata) ? metadata.toString('utf8') : metadata || '';
  const parts = [...data.replace(/\0*$/u, '').matchAll(METADATA_REGEX)];

  parts.forEach((part) => map.set(part.groups?.key ?? '', part.groups?.value ?? ''));

  return map;
};

function trampoline <
  T,
  P extends never[],
  R extends Trampoline<T>,
  F extends (...args: P) => R
> (fn: F): (...args: Parameters<F>) => ReturnType<F> {
  return function executor (...args: Parameters<F>): ReturnType<F> {
    let result = fn(...args);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    while (typeof result === 'function') result = result();
    return result as ReturnType<F>;
  };
}

const processData = (stream: StreamReader, chunk: Buffer, done: TransformCallback): TransformCallback => {
  stream.bytesLeft -= chunk.length;

  if (stream.currentState === STATES.BUFFERING_STATE) {
    stream.buffers.push(chunk);
    stream.buffersLength += chunk.length;
  } else if (stream.currentState === STATES.PASSTHROUGH_STATE) {
    stream.push(chunk);
  }

  if (stream.bytesLeft === 0) {
    const cb = stream.callback;

    if (cb && stream.currentState === STATES.BUFFERING_STATE && stream.buffers.length > 1) {
      chunk = Buffer.concat(stream.buffers, stream.buffersLength);
    } else if (stream.currentState !== STATES.BUFFERING_STATE) {
      // @ts-expect-error
      chunk = null;
    }

    stream.currentState = STATES.INIT_STATE;
    stream.callback = null;
    stream.buffers.splice(0);
    stream.buffersLength = 0;

    cb?.call(stream, chunk);
  }

  return done;
};

const onData = trampoline((stream: StreamReader, chunk: Buffer, done: TransformCallback): () => TransformCallback => {
  if (chunk.length <= stream.bytesLeft) {
    return (): TransformCallback => processData(stream, chunk, done);
  }

  return (): TransformCallback => {
    const buffer = chunk.slice(0, stream.bytesLeft);

    // @ts-expect-error
    return processData(stream, buffer, (error): unknown => {
      if (error) return done(error);
      if (chunk.length > buffer.length) {
        return (): TransformCallback => onData(stream, chunk.slice(buffer.length), done);
      }
    });
  };
});

export class StreamReader extends Transform {
  public buffers: Buffer[] = [];
  public buffersLength = 0;
  public bytesLeft = 0;
  public callback: ((chunk: Buffer) => void) | null = null;
  public currentState = STATES.INIT_STATE;
  public readonly icyMetaInt: number = 0;

  public constructor (icyMetaInt: number) {
    super();

    this.icyMetaInt = icyMetaInt;
    this.passthrough(this.icyMetaInt, this.onMetaSectionStart.bind(this));
  }

  public _transform (chunk: Buffer, _encoding: string, done: TransformCallback): void {
    onData(this, chunk, done);
  }

  protected bytes (length: number, cb: (chunk: Buffer) => void): this {
    this.bytesLeft = length;
    this.currentState = STATES.BUFFERING_STATE;
    this.callback = cb;

    return this;
  }

  protected passthrough (length: number, cb: (chunk: Buffer) => void): this {
    this.bytesLeft = length;
    this.currentState = STATES.PASSTHROUGH_STATE;
    this.callback = cb;

    return this;
  }

  protected onMetaSectionStart (): void {
    this.bytes(1, this.onMetaSectionLengthByte.bind(this));
  }

  protected onMetaSectionLengthByte (chunk: Buffer): void {
    const length = chunk[0] * METADATA_BLOCK_SIZE;

    if (length > 0) {
      this.bytes(length, this.onMetaData.bind(this));
    } else {
      this.passthrough(this.icyMetaInt, this.onMetaSectionStart.bind(this));
    }
  }

  protected onMetaData (chunk: Buffer): void {
    this.emit('metadata', parseMetadata(chunk));
    this.passthrough(this.icyMetaInt, this.onMetaSectionStart.bind(this));
  }
}
