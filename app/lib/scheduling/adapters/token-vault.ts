import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Encrypts secrets (the Google refresh token, OAuth PKCE verifiers) before they reach the database, so a database dump, a backup or a
 * leaked read-only credential reveals nothing usable. AES-256-GCM: confidentiality AND tamper detection. The key lives only in the
 * environment (SCHEDULING_TOKEN_KEY), never in the database or the repository.
 *
 * Format:  v<keyVersion>.<iv>.<authTag>.<ciphertext>   (each part base64url)
 * `purpose` is bound in as additional authenticated data, so a ciphertext cannot be copied into a different column and decrypted there.
 * Key rotation: set the new key as current (new version) and keep the old one as `previous`; old values still decrypt, new writes use the new key.
 */
export class VaultError extends Error {
  constructor(message: string) { super(message); this.name = "VaultError"; }
}

export type VaultKey = { version: number; key: Buffer };
const ALGORITHM = "aes-256-gcm";

function parseKey(value: string, name: string): Buffer {
  const buf = Buffer.from(value, "base64");
  if (buf.length !== 32) throw new VaultError(`${name} must be 32 random bytes, base64-encoded (generate with: openssl rand -base64 32).`);
  return buf;
}

export class TokenVault {
  private keys = new Map<number, Buffer>();
  constructor(private current: VaultKey, ...previous: VaultKey[]) {
    for (const k of [current, ...previous]) {
      if (k.key.length !== 32) throw new VaultError("Vault keys must be 32 bytes.");
      this.keys.set(k.version, k.key);
    }
  }

  /** SCHEDULING_TOKEN_KEY (+ _VERSION, default 1) and optionally SCHEDULING_TOKEN_KEY_PREVIOUS (+ _PREVIOUS_VERSION). Throws a clear error if missing. */
  static fromEnv(env: Record<string, string | undefined> = process.env): TokenVault {
    if (!env.SCHEDULING_TOKEN_KEY) throw new VaultError("SCHEDULING_TOKEN_KEY is not set.");
    const current = { version: Number(env.SCHEDULING_TOKEN_KEY_VERSION ?? 1), key: parseKey(env.SCHEDULING_TOKEN_KEY, "SCHEDULING_TOKEN_KEY") };
    const previous = env.SCHEDULING_TOKEN_KEY_PREVIOUS ? [{ version: Number(env.SCHEDULING_TOKEN_KEY_PREVIOUS_VERSION ?? current.version - 1), key: parseKey(env.SCHEDULING_TOKEN_KEY_PREVIOUS, "SCHEDULING_TOKEN_KEY_PREVIOUS") }] : [];
    return new TokenVault(current, ...previous);
  }

  get keyVersion() { return this.current.version; }

  encrypt(plaintext: string, purpose: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, this.current.key, iv);
    cipher.setAAD(Buffer.from(purpose));
    const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    return `v${this.current.version}.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ct.toString("base64url")}`;
  }

  decrypt(token: string, purpose: string): string {
    const m = token.match(/^v(\d+)\.([\w-]+)\.([\w-]+)\.([\w-]*)$/);
    if (!m) throw new VaultError("Not an encrypted value.");
    const key = this.keys.get(Number(m[1]));
    if (!key) throw new VaultError(`No key for version ${m[1]}.`);
    try {
      const d = createDecipheriv(ALGORITHM, key, Buffer.from(m[2], "base64url"));
      d.setAAD(Buffer.from(purpose));
      d.setAuthTag(Buffer.from(m[3], "base64url"));
      return Buffer.concat([d.update(Buffer.from(m[4], "base64url")), d.final()]).toString("utf8");
    } catch { throw new VaultError("The value could not be decrypted (wrong key, wrong purpose, or it was altered)."); }
  }

  /** True if the value was written with an older key and should be re-encrypted. */
  needsRotation(token: string): boolean { return !token.startsWith(`v${this.current.version}.`); }
}
