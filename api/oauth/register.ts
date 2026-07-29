import type { IncomingMessage, ServerResponse } from "http";
import crypto from "crypto";

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

    let parsed: any = {};
    try {
      parsed = JSON.parse(body || "{}");
    } catch {
      // empty body is fine for registration
    }

    const client_id = crypto.randomUUID();
    const client_secret = crypto.randomBytes(32).toString("hex");
    const redirect_uris = parsed.redirect_uris || [];
    const client_name = parsed.client_name || "MCP Client";

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      client_id,
      client_secret,
      client_name,
      redirect_uris,
      token_endpoint_auth_method: "client_secret_post",
    }));
  } catch (err: any) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "server_error", error_description: err.message || "Internal server error" }));
  }
}
