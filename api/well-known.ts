import type { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const host = req.headers.host || "todo.theorave.in";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const requestUrl = new URL(req.url || "/", baseUrl);
  const path = requestUrl.pathname.toLowerCase();
  const typeParam = requestUrl.searchParams.get("type") || "";
  const pathParam = requestUrl.searchParams.get("path") || "";

  const fullPathStr = `${path} ${typeParam} ${pathParam}`;

  const isProtectedResource = fullPathStr.includes("oauth-protected-resource");
  const isAuthServer = fullPathStr.includes("oauth-authorization-server");

  if (isProtectedResource) {
    const doc = {
      resource: `${baseUrl}/api/mcp`,
      authorization_servers: [baseUrl],
      scopes_supported: ["mcp:read", "mcp:write"]
    };
    res.writeHead(200);
    res.end(JSON.stringify(doc, null, 2));
    return;
  }

  if (isAuthServer) {
    const doc = {
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/api/oauth/authorize`,
      token_endpoint: `${baseUrl}/api/oauth/token`,
      registration_endpoint: `${baseUrl}/api/oauth/register`,
      jwks_uri: `${baseUrl}/api/oauth/jwks`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"]
    };
    res.writeHead(200);
    res.end(JSON.stringify(doc, null, 2));
    return;
  }

  // Fallback for any other .well-known endpoint
  res.writeHead(200);
  res.end(
    JSON.stringify({
      message: "Task Buddy Well-Known Service",
      endpoint: path,
    })
  );
}
