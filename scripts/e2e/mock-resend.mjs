// Local stand-in for the Resend API: lets the app run "email enabled" with NO real send.
// Start the app with RESEND_BASE_URL=http://127.0.0.1:4010 (the Resend SDK honours it).
//   POST /emails -> records the message, returns { id }   GET /emails/:id -> the stored message (html, text, to, subject)
//   GET /__sent -> every recorded message (no bodies)       POST /__reset -> clear
import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.MOCK_RESEND_PORT ?? 4010);
const sent = new Map();
const json = (res, status, body) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
const readBody = (req) => new Promise((resolve) => { let data = ""; req.on("data", (c) => (data += c)); req.on("end", () => resolve(data)); });

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === "POST" && url.pathname === "/emails") {
    const p = JSON.parse((await readBody(req)) || "{}");
    const id = randomUUID();
    sent.set(id, { id, created_at: new Date().toISOString(), to: [].concat(p.to ?? []), from: p.from, subject: p.subject, html: p.html, text: p.text, headers: p.headers });
    return json(res, 200, { id });
  }
  if (req.method === "GET" && url.pathname.startsWith("/emails/")) {
    const m = sent.get(url.pathname.split("/").pop());
    return m ? json(res, 200, m) : json(res, 404, { message: "not found" });
  }
  if (req.method === "GET" && url.pathname === "/__sent") return json(res, 200, [...sent.values()].map(({ html, text, ...rest }) => rest));
  if (req.method === "POST" && url.pathname === "/__reset") { sent.clear(); return json(res, 200, { ok: true }); }
  json(res, 404, { message: "unknown route" });
}).listen(PORT, "127.0.0.1", () => console.log(`mock Resend listening on http://127.0.0.1:${PORT}`));
