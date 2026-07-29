import type { IncomingMessage, ServerResponse } from "http";
import crypto from "crypto";

// ─── Inline AES-256-GCM decryption ────────────────────────
const CRYPTO_SECRET = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "task-buddy-mcp-fallback";

function deriveKey(): Buffer {
  return crypto.createHash("sha256").update(CRYPTO_SECRET).digest();
}

function decryptAuthCode(code: string): Record<string, any> | null {
  try {
    const parts = code.split(".");
    if (parts.length !== 3) return null;
    const [ivHex, tagHex, ciphertext] = parts;
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
// ───────────────────────────────────────────────────────────

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "method_not_allowed" }));
    return;
  }

  try {
    const body = await new Promise<string>((resolve) => {
      let data = "";
      req.on("data", (chunk: Buffer) => (data += chunk.toString()));
      req.on("end", () => resolve(data));
    });

    let grant_type = "";
    let code = "";
    let code_verifier = "";
    let refresh_token = "";

    const contentType = req.headers["content-type"] || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(body);
      grant_type = params.get("grant_type") || "";
      code = params.get("code") || "";
      code_verifier = params.get("code_verifier") || "";
      refresh_token = params.get("refresh_token") || "";
    } else {
      const parsed = JSON.parse(body || "{}");
      grant_type = parsed.grant_type || "";
      code = parsed.code || "";
      code_verifier = parsed.code_verifier || "";
      refresh_token = parsed.refresh_token || "";
    }

    // ─── Authorization Code Grant ────────────────────────────
    if (grant_type === "authorization_code") {
      if (!code) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid_request", error_description: "Missing authorization code" }));
        return;
      }

      const stored = decryptAuthCode(code);
      if (!stored) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid_grant", error_description: "Invalid or expired authorization code" }));
        return;
      }

      // Verify PKCE
      if (stored.code_challenge && code_verifier) {
        const expectedChallenge = crypto
          .createHash("sha256")
          .update(code_verifier)
          .digest("base64url");

        if (expectedChallenge !== stored.code_challenge) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "invalid_grant", error_description: "PKCE code_verifier mismatch" }));
          return;
        }
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        access_token: stored.access_token,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: stored.refresh_token || undefined,
        scope: "tasks:read tasks:write lists:read lists:write",
      }));
      return;
    }

    // ─── Refresh Token Grant ─────────────────────────────────
    if (grant_type === "refresh_token") {
      if (!refresh_token) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid_request", error_description: "Missing refresh_token" }));
        return;
      }

      const { createClient } = await import("@supabase/supabase-js");
      const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://gjduzipwtybvzvgefrza.supabase.co";
      const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
      });

      const { data, error } = await supabase.auth.refreshSession({ refresh_token });

      if (error || !data.session) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid_grant", error_description: error?.message || "Failed to refresh" }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        access_token: data.session.access_token,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: data.session.refresh_token,
        scope: "tasks:read tasks:write lists:read lists:write",
      }));
      return;
    }

    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "unsupported_grant_type" }));
  } catch (err: any) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "server_error", error_description: err.message || "Internal server error" }));
  }
}
