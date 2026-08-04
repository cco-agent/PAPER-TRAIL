/**
 * Shredder Sentinel — Web UI demo.
 *
 * A zero-dependency HTTP server (node:http, no npm deps) that exposes the
 * x402 paid endpoint as a browsable demo:
 *
 *   GET  /             → static demo page (paywall card + pay-and-run flow)
 *   GET  /api/paywall  → current paywall as JSON
 *   POST /api/run      → x402 endpoint (no proof → HTTP 402 + x402-paywall
 *                        header; valid proof → HTTP 200 + audit record JSON)
 *
 * The request logic lives in WebUI.handle() so tests exercise every route
 * without binding a port. startServer() is the thin node:http wrapper the CLI
 * `web` command uses. Production swaps the injected X402Handler's verifier for
 * an on-chain one (RPC / KeeperHub) — same seam as the CLI `pay` demo.
 */

import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import {
  X402Handler,
  X402_PAYWALL_HEADER,
  encodePaywall,
  parseProofFromHeaders
} from "./x402.ts";

export interface WebUIResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface WebUIRequest {
  method: string;
  url?: string;
  headers: Record<string, string>;
}

const DEMO_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Shredder Sentinel — x402 Paid Agent Endpoint</title>
<style>
  :root { color-scheme: dark; }
  body { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: #0d1117; color: #e6edf3; margin: 0; padding: 24px; }
  .wrap { max-width: 860px; margin: 0 auto; }
  h1 { font-size: 20px; letter-spacing: 0.5px; }
  h3 { margin: 0 0 10px; font-size: 14px; }
  .tag { color: #f0883e; font-size: 13px; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px; margin: 12px 0; }
  .row { display: flex; gap: 12px; flex-wrap: wrap; }
  button { background: #238636; color: #fff; border: 0; border-radius: 6px; padding: 10px 14px; font: inherit; cursor: pointer; }
  button.ghost { background: #21262d; border: 1px solid #30363d; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  pre { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 12px; overflow-x: auto; font-size: 12px; white-space: pre-wrap; word-break: break-all; }
  dl { display: grid; grid-template-columns: 120px 1fr; gap: 6px 12px; margin: 0; font-size: 13px; }
  dt { color: #8b949e; }
  dd { margin: 0; word-break: break-all; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Shredder Sentinel <span class="tag">x402 paid agent endpoint — web demo</span></h1>
  <p>Pay once, get exactly one guarded agent run (observe &rarr; decide &rarr; policy &rarr; execute &rarr; audit). No proof &rarr; HTTP 402. The proof below is a deterministic demo proof (in-memory verifier) — production uses an on-chain verifier via RPC / KeeperHub.</p>
  <div class="card">
    <h3>Paywall</h3>
    <dl id="paywall"></dl>
  </div>
  <div class="row">
    <button id="unpaid" class="ghost">Call without proof (expect 402)</button>
    <button id="paid">Pay &amp; run (with proof)</button>
  </div>
  <div class="card"><pre id="out">Waiting for a call…</pre></div>
</div>
<script>
var $ = function (id) { return document.getElementById(id); };
var PAYER = "0x1111111111111111111111111111111111111111";
function b64u(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
async function init() {
  var r = await fetch("/api/paywall");
  var paywall = await r.json();
  var dl = $("paywall");
  for (var k in paywall) {
    var dt = document.createElement("dt"); dt.textContent = k;
    var dd = document.createElement("dd"); dd.textContent = String(paywall[k]);
    dl.appendChild(dt); dl.appendChild(dd);
  }
  window.__paywall = paywall;
}
$("unpaid").onclick = async function () {
  $("unpaid").disabled = true;
  var r = await fetch("/api/run", { method: "POST" });
  var body = await r.text();
  var pwh = r.headers.get("x402-paywall");
  $("out").textContent = "HTTP " + r.status + (pwh ? "\nx402-paywall: " + pwh : "") + "\n\n" + body;
  $("unpaid").disabled = false;
};
$("paid").onclick = async function () {
  $("paid").disabled = true;
  var p = window.__paywall;
  var proof = { requestId: p.requestId, payer: PAYER, amountWei: p.amountWei, txHash: "0x" + new Array(65).join("ab") };
  var r = await fetch("/api/run", { method: "POST", headers: { "x402-proof": b64u(JSON.stringify(proof)) } });
  var body = await r.text();
  $("out").textContent = "HTTP " + r.status + "\n\n" + body;
  $("paid").disabled = false;
};
init();
</script>
</body>
</html>`;

/**
 * Route table + x402 wiring, isolated from node:http so it can be tested
 * directly. A malformed x402-proof header is treated as "no proof" → 402
 * (the handler already refuses to run without a verified payment).
 */
export class WebUI {
  private readonly handler: X402Handler;

  constructor(handler: X402Handler) {
    this.handler = handler;
  }

  async handle(req: WebUIRequest): Promise<WebUIResponse> {
    const method = req.method.toUpperCase();
    const path = (req.url ?? "/").split("?")[0] ?? "/";

    if (method === "GET" && path === "/") {
      return {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
        body: DEMO_HTML
      };
    }

    if (method === "GET" && path === "/api/paywall") {
      return {
        status: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(this.handler.paywall, null, 2)
      };
    }

    if (method === "POST" && path === "/api/run") {
      let proof;
      try {
        proof = parseProofFromHeaders(req.headers);
      } catch {
        proof = undefined; // malformed proof → unpaid
      }
      const res = await this.handler.handle(proof);
      if (res.status === 402) {
        return {
          status: 402,
          headers: {
            "content-type": "application/json",
            [X402_PAYWALL_HEADER]: encodePaywall(res.paywall)
          },
          body: JSON.stringify({ status: 402, message: "payment required", paywall: res.paywall }, null, 2)
        };
      }
      return {
        status: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(res.record, null, 2)
      };
    }

    return {
      status: 404,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: "not found" })
    };
  }
}

/** Thin node:http wrapper — the CLI `web` command binds this and serves. */
export function startServer(handler: X402Handler, port = 8787): Server {
  const ui = new WebUI(handler);
  return createServer((req: IncomingMessage, res: ServerResponse) => {
    void (async () => {
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (typeof v === "string") headers[k] = v;
        else if (Array.isArray(v)) headers[k] = v[0] ?? "";
      }
      const out = await ui.handle({ method: req.method ?? "GET", url: req.url ?? "/", headers });
      res.writeHead(out.status, out.headers);
      res.end(out.body);
    })().catch((err: unknown) => {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: String(err) }));
    });
  });
}
