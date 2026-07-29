import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const host = req.headers.host || "todo.theorave.in";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  res.writeHead(200);
  res.end(
    JSON.stringify(
      {
        resource: `${baseUrl}/api/mcp`,
        authorization_servers: [baseUrl],
        scopes_supported: ["mcp:read", "mcp:write"]
      },
      null,
      2
    )
  );
}
