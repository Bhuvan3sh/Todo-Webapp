import crypto from "crypto";

// Derive a stable encryption key from the Supabase anon key (available in all functions)
const SECRET = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "task-buddy-mcp-default-secret";

function deriveKey(): Buffer {
  return crypto.createHash("sha256").update(SECRET).digest();
}

/**
 * Encrypt data into a self-contained auth code.
 * Format: iv:tag:ciphertext (all hex-encoded)
 */
export function encryptAuthCode(data: {
  access_token: string;
  refresh_token: string;
  code_challenge?: string;
  code_challenge_method?: string;
  redirect_uri?: string;
}): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const plaintext = JSON.stringify(data);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

/**
 * Decrypt an auth code back into its original data.
 * Returns null if decryption fails (invalid/tampered code).
 */
export function decryptAuthCode(code: string): {
  access_token: string;
  refresh_token: string;
  code_challenge?: string;
  code_challenge_method?: string;
  redirect_uri?: string;
} | null {
  try {
    const [ivHex, tagHex, ciphertext] = code.split(":");
    if (!ivHex || !tagHex || !ciphertext) return null;

    const key = deriveKey();
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}
