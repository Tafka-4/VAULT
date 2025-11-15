import { Worker } from 'node:worker_threads';
import os from 'node:os';

type WorkerMessage =
  | { id: number; iv: Buffer; tag: Buffer; ciphertext: Buffer }
  | { id: number; error: string };

type TaskCallbacks = {
  resolve: (value: { iv: Buffer; tag: Buffer; ciphertext: Buffer }) => void;
  reject: (reason?: unknown) => void;
};

type WorkerState = {
  worker: Worker;
  tasks: Map<number, TaskCallbacks>;
};

const WORKER_SOURCE = `
  const { parentPort } = require('worker_threads');
  const { randomBytes, createCipheriv } = require('crypto');

  if (!parentPort) {
    throw new Error('Encryption worker requires parentPort');
  }

  parentPort.on('message', (message) => {
    const { id, buffer, key } = message;
    try {
      const plaintext = Buffer.from(buffer);
      const dataKey = Buffer.from(key);
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', dataKey, iv);
      const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
      const tag = cipher.getAuthTag();
      parentPort.postMessage({ id, iv, tag, ciphertext });
    } catch (error) {
      parentPort.postMessage({ id, error: error && error.message ? error.message : String(error) });
    }
  });
`;

let taskCounter = 0;

class EncryptionWorkerPool {
  private workers: WorkerState[];

  constructor(size: number) {
    this.workers = Array.from({ length: size }, () => this.createWorker());
  }

  encrypt(plaintext: Buffer, key: Buffer) {
    const worker = this.selectWorker();
    const id = ++taskCounter;
    return new Promise<{ iv: Buffer; tag: Buffer; ciphertext: Buffer }>((resolve, reject) => {
      worker.tasks.set(id, { resolve, reject });
      const transferPlain = plaintext.buffer.slice(plaintext.byteOffset, plaintext.byteOffset + plaintext.byteLength);
      const transferKey = key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength);
      worker.worker.postMessage({ id, buffer: transferPlain, key: transferKey }, [transferPlain, transferKey]);
    });
  }

  private selectWorker(): WorkerState {
    // simple round-robin based on task counter
    const index = taskCounter % this.workers.length;
    return this.workers[index];
  }

  private createWorker(): WorkerState {
    const worker = new Worker(WORKER_SOURCE, { eval: true });
    const tasks = new Map<number, TaskCallbacks>();
    worker.on('message', (message: WorkerMessage) => {
      const callbacks = tasks.get(message.id);
      if (!callbacks) {
        return;
      }
      tasks.delete(message.id);
      if ('error' in message) {
        callbacks.reject(new Error(message.error));
        return;
      }
      callbacks.resolve({
        iv: Buffer.from(message.iv),
        tag: Buffer.from(message.tag),
        ciphertext: Buffer.from(message.ciphertext),
      });
    });
    worker.on('error', (error) => {
      // reject all pending tasks
      for (const [, cb] of tasks) {
        cb.reject(error);
      }
      tasks.clear();
      // replace crashed worker
      const idx = this.workers.findIndex(entry => entry.worker === worker);
      if (idx >= 0) {
        this.workers[idx] = this.createWorker();
      }
    });
    return { worker, tasks };
  }
}

const defaultSize = Number(process.env.ENCRYPTION_WORKERS) || Math.max(1, Math.min(os.cpus().length, 8));

export const encryptionPool = new EncryptionWorkerPool(defaultSize);
