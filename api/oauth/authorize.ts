import type { IncomingMessage, ServerResponse } from "http";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { URL } from "url";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://gjduzipwtybvzvgefrza.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

// ─── Inline AES-256-GCM encryption ────────────────────────
const CRYPTO_SECRET = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "task-buddy-mcp-fallback";

function deriveKey(): Buffer {
  return crypto.createHash("sha256").update(CRYPTO_SECRET).digest();
}

function encryptAuthCode(data: Record<string, any>): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  // Use dots as separators (URL-safe, no encoding issues)
  return `${iv.toString("hex")}.${tag}.${encrypted}`;
}
// ───────────────────────────────────────────────────────────

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `https://${req.headers.host || "todo.theorave.in"}`);
  const client_id = url.searchParams.get("client_id") || "";
  const redirect_uri = url.searchParams.get("redirect_uri") || "";
  const state = url.searchParams.get("state") || "";
  const code_challenge = url.searchParams.get("code_challenge") || "";
  const code_challenge_method = url.searchParams.get("code_challenge_method") || "S256";

  // GET → Show login form
  if (req.method === "GET") {
    const errorMsg = url.searchParams.get("error") || "";

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Buddy — Authorize AI Agent</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #E0E5EC;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #E0E5EC;
      border-radius: 24px;
      padding: 40px 36px;
      max-width: 420px;
      width: 100%;
      box-shadow: 8px 8px 16px #b8bec7, -8px -8px 16px #ffffff;
    }
    .logo { text-align: center; margin-bottom: 24px; }
    .logo h1 { font-size: 24px; font-weight: 800; color: #333; }
    .logo p { font-size: 14px; color: #666; margin-top: 8px; }
    .badge {
      display: inline-block; background: #6C63FF20; color: #6C63FF;
      font-size: 11px; font-weight: 700; padding: 4px 10px;
      border-radius: 12px; margin-top: 12px;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .error {
      background: #fee2e2; color: #dc2626; padding: 12px 16px;
      border-radius: 12px; font-size: 13px; margin-bottom: 16px; text-align: center;
    }
    label { display: block; font-size: 13px; font-weight: 600; color: #555; margin-bottom: 6px; margin-top: 16px; }
    input[type="email"], input[type="password"] {
      width: 100%; padding: 12px 16px; border: none; border-radius: 14px;
      font-size: 15px; background: #E0E5EC; color: #333;
      box-shadow: inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff;
      outline: none; transition: box-shadow 0.2s;
    }
    input:focus { box-shadow: inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff, 0 0 0 2px #6C63FF40; }
    button {
      width: 100%; margin-top: 24px; padding: 14px; border: none; border-radius: 14px;
      font-size: 15px; font-weight: 700; color: white;
      background: linear-gradient(135deg, #6C63FF, #5a52d5); cursor: pointer;
      box-shadow: 4px 4px 8px #b8bec7, -2px -2px 4px #ffffff;
      transition: transform 0.1s, box-shadow 0.2s;
    }
    button:active { transform: scale(0.98); box-shadow: 2px 2px 4px #b8bec7, -1px -1px 2px #ffffff; }
    .info { text-align: center; margin-top: 20px; font-size: 12px; color: #888; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <h1>☑️ Task Buddy</h1>
      <p>An AI agent wants to manage your tasks</p>
      <span class="badge">🔒 Secure OAuth Login</span>
    </div>
    ${errorMsg ? `<div class="error">${errorMsg}</div>` : ""}
    <form method="POST" action="/api/oauth/authorize">
      <input type="hidden" name="client_id" value="${client_id}" />
      <input type="hidden" name="redirect_uri" value="${redirect_uri}" />
      <input type="hidden" name="state" value="${state}" />
      <input type="hidden" name="code_challenge" value="${code_challenge}" />
      <input type="hidden" name="code_challenge_method" value="${code_challenge_method}" />
      <label for="email">Email Address</label>
      <input type="email" id="email" name="email" placeholder="your@email.com" required />
      <label for="password">Password</label>
      <input type="password" id="password" name="password" placeholder="••••••••" required />
      <button type="submit">Authorize & Connect</button>
    </form>
    <p class="info">Sign in with your Task Buddy account to grant<br/>this AI agent access to your tasks and lists.</p>
  </div>
</body>
</html>`);
    return;
  }

  // POST → Authenticate, encrypt tokens into auth code, redirect
  if (req.method === "POST") {
    try {
      const body = await new Promise<string>((resolve) => {
        let data = "";
        req.on("data", (chunk: Buffer) => (data += chunk.toString()));
        req.on("end", () => resolve(data));
      });

      const params = new URLSearchParams(body);
      const email = params.get("email") || "";
      const password = params.get("password") || "";
      const formRedirectUri = params.get("redirect_uri") || redirect_uri;
      const formState = params.get("state") || state;
      const formClientId = params.get("client_id") || client_id;
      const formCodeChallenge = params.get("code_challenge") || code_challenge;
      const formCodeChallengeMethod = params.get("code_challenge_method") || code_challenge_method;

      if (!email || !password) {
        const qs = new URLSearchParams({
          client_id: formClientId, redirect_uri: formRedirectUri, state: formState,
          code_challenge: formCodeChallenge, code_challenge_method: formCodeChallengeMethod,
          error: "Email and password are required.",
        });
        res.writeHead(302, { Location: `/api/oauth/authorize?${qs.toString()}` });
        res.end();
        return;
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
      });

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError || !authData.session) {
        const qs = new URLSearchParams({
          client_id: formClientId, redirect_uri: formRedirectUri, state: formState,
          code_challenge: formCodeChallenge, code_challenge_method: formCodeChallengeMethod,
          error: authError?.message || "Invalid email or password.",
        });
        res.writeHead(302, { Location: `/api/oauth/authorize?${qs.toString()}` });
        res.end();
        return;
      }

      // Encrypt tokens into self-contained auth code
      const authCode = encryptAuthCode({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        code_challenge: formCodeChallenge,
        code_challenge_method: formCodeChallengeMethod,
      });

      const redirectUrl = new URL(formRedirectUri);
      redirectUrl.searchParams.set("code", authCode);
      if (formState) redirectUrl.searchParams.set("state", formState);

      res.writeHead(302, { Location: redirectUrl.toString() });
      res.end();
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message || "Internal server error" }));
    }
    return;
  }

  res.writeHead(405, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "method_not_allowed" }));
}
