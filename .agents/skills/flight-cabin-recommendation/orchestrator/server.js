#!/usr/bin/env node
/**
 * 本地演示：GET /api/stream?query=...&origin=HGH&dest=PKX&date=2025-04-06
 * 静态页：GET /
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runRecommendationPipeline, toSSESequence } from "./index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.CHAT_FLIGHT_PORT || 3847);

function sendSse(res, events) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  for (const ev of events) {
    res.write(`event: ${ev.event}\n`);
    res.write(`data: ${JSON.stringify(ev.data)}\n\n`);
  }
  res.end();
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1`);

  if (req.method === "GET" && url.pathname === "/api/stream") {
    const query = url.searchParams.get("query") || "帮我推荐到北京的机票";
    const origin = url.searchParams.get("origin") || "HGH";
    const dest = url.searchParams.get("dest") || "PKX";
    const date = url.searchParams.get("date") || "2025-04-06";
    try {
      const result = await runRecommendationPipeline({
        userText: query,
        origin,
        dest,
        date,
      });
      const events = toSSESequence(result);
      events.push({
        event: "analytics.beacon",
        data: {
          name: "flight_recommendation_complete",
          searchId: result.searchId,
          props: {
            attachBusinessUpsell: result.attachBusinessUpsell,
            cardCount: result.flightCards.length,
          },
        },
      });
      sendSse(res, events);
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: String(e?.message || e) }));
    }
    return;
  }

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/demo")) {
    const htmlPath = path.join(ROOT, "client", "chat-blocks-demo.html");
    const html = fs.readFileSync(htmlPath, "utf8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`chat-flight-recommendation server http://127.0.0.1:${PORT}/`);
});
