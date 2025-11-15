import { constants, publicEncrypt, randomBytes } from 'node:crypto';
import { getAppConfig } from './config';

type EncryptResult = {
  ciphertext: Buffer;
  iv: Buffer;
  tag: Buffer;
};

type DecryptPayload = {
  ciphertext: Buffer;
  iv: Buffer;
  tag: Buffer;
};

type KmsResponse<T> = { data: T };

class KmsRequestError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'KmsRequestError';
    this.statusCode = statusCode;
  }
}

export const KMS_MAX_CHUNK_BYTES = 98_000; // Keep under the 131072 base64 char limit

class KmsClient {
  private baseUrl: string;
  private token: string;
  private timeoutMs: number;
  private sessionId?: string;
  private pending?: Promise<void>;

  constructor() {
    const cfg = getAppConfig();
    this.baseUrl = cfg.kmsBaseUrl.replace(/\/$/, '');
    this.token = cfg.kmsClientToken;
    this.timeoutMs = cfg.kmsRequestTimeoutMs;
  }

  async encrypt(plaintext: Buffer): Promise<EncryptResult> {
    if (!plaintext.length) throw new Error('Plaintext cannot be empty');
    if (plaintext.length > KMS_MAX_CHUNK_BYTES) {
      throw new Error(`Chunk too large for KMS (max ${KMS_MAX_CHUNK_BYTES} bytes, got ${plaintext.length})`);
    }
    const payload = {
      algorithm: 'AES-256-GCM',
      plaintext: plaintext.toString('base64'),
    };
    const result = await this.callCrypto<{
      ciphertext: string;
      iv: string;
      tag: string;
    }>('encrypt', payload);
    return {
      ciphertext: Buffer.from(result.ciphertext, 'base64'),
      iv: Buffer.from(result.iv, 'base64'),
      tag: Buffer.from(result.tag, 'base64'),
    };
  }

  async decrypt(payload: DecryptPayload): Promise<Buffer> {
    const body = {
      algorithm: 'AES-256-GCM',
      ciphertext: payload.ciphertext.toString('base64'),
      iv: payload.iv.toString('base64'),
      tag: payload.tag.toString('base64'),
    };
    const result = await this.callCrypto<{ plaintext: string }>('decrypt', body);
    return Buffer.from(result.plaintext, 'base64');
  }

  private async callCrypto<T>(endpoint: 'encrypt' | 'decrypt', body: Record<string, any>, retry = true): Promise<T> {
    await this.ensureSession();
    const res = await this.fetchJson<KmsResponse<T>>(`/crypto/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Token': this.token,
      },
      body: JSON.stringify(body),
    });
    if ('error' in res) {
      throw new KmsRequestError(res.error?.message || 'KMS error', res.error?.status || 502);
    }
    return res.data;
  }

  private async ensureSession() {
    if (this.sessionId) return;
    if (this.pending) {
      await this.pending;
      return;
    }
    this.pending = this.initSession().finally(() => {
      this.pending = undefined;
    });
    await this.pending;
  }

  private async initSession() {
    const init = await this.fetchJson<KmsResponse<{ sessionId: string; rsaPublicKeyPem: string }>>('/session/init', { method: 'GET' });
    if ('error' in init || !init.data) {
      throw new Error('Unable to initialize KMS session');
    }
    const { sessionId, rsaPublicKeyPem } = init.data;
    const aesKey = randomBytes(32);
    const wrappedKey = this.wrapKey(rsaPublicKeyPem, aesKey, sessionId);
    const exchange = await this.fetchJson<KmsResponse<{ expiresAt: number }>>('/session/key-exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Token': this.token,
      },
      body: JSON.stringify({ sessionId, wrappedKey }),
    });
    if ('error' in exchange) {
      throw new Error('KMS key exchange failed');
    }
    this.sessionId = sessionId;
  }

  private wrapKey(publicKeyPem: string, aesKey: Buffer, sessionId: string) {
    const label = Buffer.from(`${sessionId}:${this.token}`);
    const wrapped = publicEncrypt(
      {
        key: publicKeyPem,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
        oaepLabel: label,
      },
      aesKey
    );
    return wrapped.toString('base64');
  }

  private async fetchJson<T>(path: string, init: RequestInit = {}): Promise<T | { error: any }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
      });
      if (res.status === 401 || res.status === 403) {
        this.sessionId = undefined;
        if (!path.startsWith('/session')) {
          await this.ensureSession();
          return this.fetchJson<T>(path, init);
        }
      }
      if (!res.ok) {
        let message = res.statusText;
        try {
          const body = await res.text();
          if (body) {
            const parsed = JSON.parse(body);
            if (typeof parsed === 'string') {
              message = parsed;
            } else if (parsed && typeof parsed === 'object') {
              message = parsed.message || parsed.error || message;
            }
          }
        } catch (_error) {
          // ignore body parse errors
        }
        return { error: { status: res.status, message } };
      }
      const json = (await res.json()) as T;
      return json;
    } catch (error) {
      console.error('[KMS] request failed', { path, error });
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const kmsClient = new KmsClient();
