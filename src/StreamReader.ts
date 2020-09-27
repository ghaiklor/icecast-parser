import { Transform } from 'stream';

export type Trampoline<T> = T | ((...args: never[]) => Trampoline<T>);
export type TransformCallback = (error: Error | null | undefined, data?: Buffer) => void;

const METADATA_BLOCK_SIZE = 16;
const METADATA_REGEX = /(?<key>\w+)=['"](?<value>.+?)['"];/gu;

const enum STATES {
  INIT_STATE,
  BUFFERING_STATE,
  PASSTHROUGH_STATE,
}

function parseMetadata (metadata: Buffer): Map<string, string> {
  const map = new Map<string, string>();
  const data = metadata.toString('utf8');
  const parts = [...data.replace(/\0*$/u, '').matchAll(METADATA_REGEX)];

  parts.forEach((part) => map.set(part.groups?.key ?? '', part.groups?.value ?? ''));

  return map;
}

function trampoline <
  T,
  P extends never[],
  R extends Trampoline<T>,
  F extends (...args: P) => R,
> (fn: F): (...args: Parameters<F>) => ReturnType<F> {
  return function executor (...args: Parameters<F>): ReturnType<F> {
    let result = fn(...args);

    while (typeof result === 'function') {
      result = result() as ReturnType<F>;
    }

    return result as ReturnType<F>;
  };
}

function processData (stream: StreamReader, chunk: Buffer, done: TransformCallback): TransformCallback {
  stream.bytesLeft -= chunk.length;

  if (stream.currentState === STATES.BUFFERING_STATE) {
    stream.buffers.push(chunk);
    stream.buffersLength += chunk.length;
  } else if (stream.currentState === STATES.PASSTHROUGH_STATE) {
    stream.push(chunk);
  }

  if (stream.bytesLeft === 0) {
    const { callback } = stream;
    const chunkToPass = stream.currentState === STATES.BUFFERING_STATE && stream.buffers.length > 1
      ? Buffer.concat(stream.buffers, stream.buffersLength)
      : chunk;

    stream.currentState = STATES.INIT_STATE;
    stream.callback = null;
    stream.buffers.splice(0);
    stream.buffersLength = 0;

    callback?.call(stream, chunkToPass);
  }

  return done;
}

const onData = trampoline((stream: StreamReader, chunk: Buffer, done: TransformCallback): () => TransformCallback => {
  if (chunk.length <= stream.bytesLeft) {
    return (): TransformCallback => processData(stream, chunk, done);
  }

  return (): TransformCallback => {
    const buffer = chunk.slice(0, stream.bytesLeft);

    return processData(stream, buffer, (error) => {
      if (error !== null && typeof error !== 'undefined') return done(error);
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

  protected bytes (length: number, cb: (chunk: Buffer) => void): void {
    this.bytesLeft = length;
    this.currentState = STATES.BUFFERING_STATE;
    this.callback = cb;
  }

  protected passthrough (length: number, cb: (chunk: Buffer) => void): void {
    this.bytesLeft = length;
    this.currentState = STATES.PASSTHROUGH_STATE;
    this.callback = cb;
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
