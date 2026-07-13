import bcrypt from "bcryptjs";

const BCRYPT_PREFIX = /^\$2[aby]\$/;
const SALT_ROUNDS = 10;

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, SALT_ROUNDS);
}

/**
 * Verifies a password against a stored value that may be either a bcrypt
 * hash or a legacy plaintext record. Legacy matches report needsRehash so
 * callers can lazily migrate the stored value.
 */
export function verifyPassword(
  plain: string,
  stored: string | undefined,
): { ok: boolean; needsRehash: boolean } {
  if (!plain || !stored) {
    return { ok: false, needsRehash: false };
  }

  if (BCRYPT_PREFIX.test(stored)) {
    return { ok: bcrypt.compareSync(plain, stored), needsRehash: false };
  }

  const ok = stored === plain;
  return { ok, needsRehash: ok };
}
