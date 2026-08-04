import { createServer } from 'node:http';
import type { LaneId } from './types.ts';
import { LANES, LANE_LABELS } from './types.ts';
import {
  createMatch, deploy, burn, lock, advance, endMatch, applyElo, matchScore,
  type MatchState,
} from './game.ts';
import { starterHand } from './cards.ts';
import { GENESIS_CARDS, GENESIS_RARITY_COUNTS, GENESIS_SET_SIZE } from './genesis-cards.ts';
import { chooseAction, mulberry32, runSeries, type BotStrategy, type SimOptions } from './sim.ts';

export interface WebRequest {
  method: string;
  url: string;
  body?: string;
}

export interface WebResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

const STRATEGIES: readonly BotStrategy[] = ['greedy', 'meta', 'hoarder'];

function json(status: number, data: unknown): WebResponse {
  return { status, headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(data) };
}

function text(status: number, body: string): WebResponse {
  return { status, headers: { 'content-type': 'text/plain; charset=utf-8' }, body };
}

function isStrategy(v: unknown): v is BotStrategy {
  return typeof v === 'string' && (STRATEGIES as readonly string[]).includes(v);
}

function num(v: unknown, def: number, min: number, max: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : def;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/* ------------------------------------------------------------------ */
/* Match trace — one full match with per-action snapshots              */
/* ------------------------------------------------------------------ */

export interface TraceEvent {
  t: number;
  weights: Record<LaneId, number>;
  player: 0 | 1;
  action: string;
  detail: string;
  lanes: Record<LaneId, { base: [number, number]; charge: [number, number]; locked: [number, number] }>;
  fuel: [number, number];
}

export interface MatchTrace {
  strategy0: BotStrategy;
  strategy1: BotStrategy;
  winner: 0 | 1 | null;
  draw: boolean;
  score: [number, number];
  elo: [number, number];
  deployed: [number, number];
  burned: [number, number];
  locked: [number, number];
  turns: number;
  seconds: number;
  events: TraceEvent[];
}

function laneSnap(m: MatchState): TraceEvent['lanes'] {
  const out = {} as TraceEvent['lanes'];
  for (const lane of LANES) {
    out[lane] = {
      base: [m.lanes[lane].base[0], m.lanes[lane].base[1]],
      charge: [m.lanes[lane].charge[0], m.lanes[lane].charge[1]],
      locked: [m.lanes[lane].locked[0], m.lanes[lane].locked[1]],
    };
  }
  return out;
}

export function traceMatch(
  strategy0: BotStrategy,
  strategy1: BotStrategy,
  opts: SimOptions & { seed?: number } = {}
): MatchTrace {
  const rng = opts.rng ?? mulberry32(opts.seed ?? 1);
  const handSize = opts.handSize ?? 6;
  const m = createMatch(starterHand(handSize, rng), starterHand(handSize, rng), {
    matchSeconds: opts.matchSeconds ?? 180,
    volatilityInterval: opts.volatilityInterval ?? 5,
    rng,
  });
  const interval = opts.decisionInterval ?? 3;
  const strategies: [BotStrategy, BotStrategy] = [strategy0, strategy1];
  const events: TraceEvent[] = [];
  const deployed: [number, number] = [0, 0];
  const burned: [number, number] = [0, 0];
  const locked: [number, number] = [0, 0];
  let turns = 0;
  while (m.phase === 'playing') {
    const step = Math.min(interval, m.opts.matchSeconds - m.seconds);
    advance(m, step);
    if (m.phase !== 'playing') break;
    for (const idx of [0, 1] as const) {
      const act = chooseAction(m, idx, strategies[idx]);
      let detail: string;
      if (act.kind === 'lock') {
        const r = lock(m, idx, act.lane);
        if (r.ok) {
          locked[idx]++;
          detail = 'lock ' + act.lane + ' (+' + r.locked + ' locked)';
        } else {
          detail = 'lock ' + act.lane + ' (' + r.reason + ')';
        }
      } else if (act.kind === 'deploy') {
        const r = deploy(m, idx, act.cardId, act.lane);
        if (r.ok) {
          deployed[idx]++;
          detail = 'deploy ' + act.cardId + ' -> ' + act.lane + ' (' + r.power + ' power)';
        } else {
          detail = 'deploy ' + act.cardId + ' (' + r.reason + ')';
        }
      } else if (act.kind === 'burn') {
        const r = burn(m, idx, act.cardId);
        if (r.ok) {
          burned[idx]++;
          detail = 'burn ' + act.cardId + ' (+' + r.fuel + ' fuel)';
        } else {
          detail = 'burn ' + act.cardId + ' (' + r.reason + ')';
        }
      } else {
        detail = 'pass';
      }
      events.push({
        t: m.seconds,
        weights: { ...m.weights },
        player: idx,
        action: act.kind,
        detail,
        lanes: laneSnap(m),
        fuel: [m.players[0].fuel, m.players[1].fuel],
      });
    }
    turns++;
  }
  const { winner, draw, score } = endMatch(m);
  const elo = applyElo(m);
  return {
    strategy0, strategy1, winner, draw, score, elo,
    deployed, burned, locked,
    turns, seconds: m.seconds, events,
  };
}

/* ------------------------------------------------------------------ */
/* HTTP handling (pure — no port binding, fully testable)              */
/* ------------------------------------------------------------------ */

function deckSummary(): WebResponse {
  const lanes: Record<LaneId, number> = { headline: 0, media: 0, underground: 0 };
  for (const c of GENESIS_CARDS) lanes[c.lane]++;
  return json(200, {
    setSize: GENESIS_SET_SIZE,
    lanes,
    rarityCounts: GENESIS_RARITY_COUNTS,
    cards: GENESIS_CARDS.map((c) => ({
      edition: c.edition,
      id: c.id,
      name: c.name,
      lane: c.lane,
      type: c.type,
      power: c.power,
      fuel: c.fuel,
      volatility: c.volatility,
      rarity: c.rarity,
      flavor: c.flavor,
    })),
  });
}

function parseBody(raw: string | undefined): { ok: true; data: Record<string, unknown> } | { ok: false; reason: string } {
  if (!raw) return { ok: false, reason: 'missing body' };
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    return { ok: true, data };
  } catch {
    return { ok: false, reason: 'invalid JSON' };
  }
}

function runSim(req: WebRequest): WebResponse {
  const parsed = parseBody(req.body);
  if (!parsed.ok) return json(400, { error: parsed.reason });
  const { data } = parsed;
  if (!isStrategy(data.strategy0) || !isStrategy(data.strategy1)) {
    return json(400, { error: 'strategy must be one of: greedy, meta, hoarder' });
  }
  const matches = num(data.matches, 100, 1, 10000);
  const seed = num(data.seed, 20260804, 0, 2 ** 31);
  const seconds = num(data.seconds, 180, 10, 600);
  const result = runSeries(data.strategy0, data.strategy1, matches, { seed, matchSeconds: seconds });
  return json(200, result);
}

function runMatch(req: WebRequest): WebResponse {
  const parsed = parseBody(req.body);
  if (!parsed.ok) return json(400, { error: parsed.reason });
  const { data } = parsed;
  if (!isStrategy(data.strategy0) || !isStrategy(data.strategy1)) {
    return json(400, { error: 'strategy must be one of: greedy, meta, hoarder' });
  }
  const seed = num(data.seed, 20260804, 0, 2 ** 31);
  const seconds = num(data.seconds, 180, 10, 600);
  const trace = traceMatch(data.strategy0, data.strategy1, { seed, matchSeconds: seconds });
  return json(200, trace);
}

function pageHtml(): WebResponse {
  const lanesHtml = LANES.map(
    (lane) =>
      '<div class="lane"><h3>' + LANE_LABELS[lane] + '</h3><div id="deck-' + lane + '" class="deck"></div></div>'
  ).join('\n');
  const body = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PAPER TRAIL — Battle Simulator</title>
<style>
:root { color-scheme: dark; }
body { background: #0d0f14; color: #e8e6e3; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; margin: 0; padding: 24px; }
h1 { font-size: 22px; letter-spacing: 2px; margin: 0 0 4px; }
h1 .cc { color: #ff4d4d; }
h2 { font-size: 14px; letter-spacing: 1px; color: #9aa0a6; text-transform: uppercase; margin: 32px 0 12px; }
.tagline { color: #9aa0a6; font-size: 13px; margin: 0 0 24px; }
.panel { background: #161a22; border: 1px solid #262c38; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
label { font-size: 12px; color: #9aa0a6; margin-right: 6px; }
select, input, button { background: #0d0f14; color: #e8e6e3; border: 1px solid #333b49; border-radius: 6px; padding: 6px 8px; font: inherit; font-size: 12px; }
button { background: #ff4d4d; color: #0d0f14; border: none; font-weight: 700; cursor: pointer; }
button:hover { background: #ff7a5c; }
.row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.lanes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
@media (max-width: 800px) { .lanes { grid-template-columns: 1fr; } }
.lane { background: #161a22; border: 1px solid #262c38; border-radius: 8px; padding: 12px; }
.lane h3 { margin: 0 0 10px; font-size: 13px; letter-spacing: 1px; color: #ff4d4d; }
.card { border: 1px solid #262c38; border-left: 4px solid #6c6c6c; border-radius: 6px; padding: 8px; margin-bottom: 8px; font-size: 12px; }
.card .name { font-weight: 700; }
.card .meta { color: #9aa0a6; font-size: 11px; margin-top: 4px; }
.card .flavor { color: #6f7680; font-size: 11px; margin-top: 4px; font-style: italic; }
.common { border-left-color: #8a8f98; }
.uncommon { border-left-color: #3ddc84; }
.rare { border-left-color: #3d9cdc; }
.epic { border-left-color: #b06bff; }
.legendary { border-left-color: #ffb020; }
table { border-collapse: collapse; width: 100%; font-size: 12px; }
td, th { border: 1px solid #262c38; padding: 6px 8px; text-align: left; }
th { color: #9aa0a6; font-weight: 600; }
#trace { max-height: 420px; overflow-y: auto; }
#trace div { font-size: 12px; padding: 3px 0; border-bottom: 1px solid #1c2129; }
.w0 { color: #ff4d4d; }
.w1 { color: #3ddc84; }
.muted { color: #6f7680; }
footer { margin-top: 32px; color: #6f7680; font-size: 11px; }
</style>
</head>
<body>
<h1>PAPER <span class="cc">TRAIL</span></h1>
<p class="tagline">3 lanes &middot; 5-second volatility &middot; 3-minute tug-of-war &middot; hold to charge, burn to fuel. Bots fight. You watch. The gauge is always hungry.</p>

<div class="panel">
<h2>Battle Simulator</h2>
<div class="row">
  <label>Bot A</label><select id="s0"><option>greedy</option><option>meta</option><option>hoarder</option></select>
  <label>Bot B</label><select id="s1"><option>greedy</option><option selected>meta</option><option>hoarder</option></select>
  <label>Matches</label><input id="matches" type="number" value="100" min="1" max="10000">
  <label>Seed</label><input id="seed" type="number" value="20260804">
  <button onclick="runSeries()">Run series</button>
  <button onclick="watchMatch()">Watch one match</button>
</div>
<div id="series" class="muted" style="margin-top:12px"></div>
</div>

<div class="panel">
<h2>Match Trace <span class="muted">(Bot A vs Bot B, one match)</span></h2>
<div id="trace" class="muted">Press &ldquo;Watch one match&rdquo; to replay the tug-of-war.</div>
</div>

<h2>GENESIS 77 Card Gallery <span class="muted">(0.1 SOL per edition &middot; <span id="deckstat"></span>)</span></h2>
<div class="lanes">${lanesHtml}</div>

<footer>PAPER TRAIL &mdash; run by CCO, the Chief Corruption Officer. 77,777,777 $PAPERTRAIL. Burn it. Feed the gauge.</footer>

<script>
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function post(path, data, cb) {
  fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) })
    .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
    .then(function (x) { cb(x.ok, x.j); })
    .catch(function (e) { cb(false, { error: String(e) }); });
}
function readStrategy(id) { return document.getElementById(id).value; }
function runSeries() {
  var el = document.getElementById('series');
  el.className = 'muted'; el.textContent = 'Simulating ' + document.getElementById('matches').value + ' matches...';
  post('/api/sim', { strategy0: readStrategy('s0'), strategy1: readStrategy('s1'), matches: Number(document.getElementById('matches').value), seed: Number(document.getElementById('seed').value) }, function (ok, r) {
    if (!ok) { el.className = ''; el.innerHTML = '<span class="w0">Error: ' + esc(r.error) + '</span>'; return; }
    var pct = function (w) { return Math.round((w / r.matches) * 100) + '%'; };
    el.className = '';
    el.innerHTML =
      '<table><tr><th>Bot A</th><th>Wins</th><th>Draws</th><th>Bot B</th><th>ELO drift</th><th>Burn</th><th>Lock</th></tr>' +
      '<tr><td>' + esc(r.strategy0) + '</td><td>' + pct(r.wins0) + '</td><td>' + pct(r.draws) + '</td><td>' + esc(r.strategy1) + '</td>' +
      '<td>' + Math.round(r.eloEnd[0] - r.eloStart[0]) + ' / ' + Math.round(r.eloEnd[1] - r.eloStart[1]) + '</td>' +
      '<td>' + r.totalBurned[0] + ':' + r.totalBurned[1] + '</td><td>' + r.totalLocked[0] + ':' + r.totalLocked[1] + '</td></tr></table>';
  });
}
function watchMatch() {
  var el = document.getElementById('trace');
  el.className = 'muted'; el.textContent = 'Running one match...';
  post('/api/match', { strategy0: readStrategy('s0'), strategy1: readStrategy('s1'), seed: Number(document.getElementById('seed').value) }, function (ok, r) {
    if (!ok) { el.className = ''; el.innerHTML = '<span class="w0">Error: ' + esc(r.error) + '</span>'; return; }
    var out = ['<div class="muted">t=' + r.seconds + 's &middot; score ' + r.score[0] + ':' + r.score[1] + ' &middot; winner: ' + (r.draw ? 'draw' : 'Bot ' + r.winner) + ' &middot; ELO &rarr; ' + Math.round(r.elo[0]) + ' / ' + Math.round(r.elo[1]) + ' &middot; ' + r.turns + ' decision rounds</div>'];
    for (var i = 0; i < r.events.length; i++) {
      var e = r.events[i];
      var w = 'w=' + e.weights.headline + '/' + e.weights.media + '/' + e.weights.underground;
      out.push('<div class="' + (e.player === 0 ? 'w0' : 'w1') + '">t' + e.t + ' p' + e.player + ' &middot; ' + esc(e.detail) + ' &middot; <span class="muted">' + w + '</span></div>');
    }
    el.className = '';
    el.innerHTML = out.join('');
  });
}
function rarityClass(r) { return { common: 'common', uncommon: 'uncommon', rare: 'rare', epic: 'epic', legendary: 'legendary' }[r] || 'common'; }
function loadDeck() {
  fetch('/api/deck').then(function (r) { return r.json(); }).then(function (d) {
    document.getElementById('deckstat').textContent = d.setSize + ' editions &middot; rarity: ' + d.rarityCounts.legendary + ' legendary / ' + d.rarityCounts.epic + ' epic / ' + d.rarityCounts.rare + ' rare / ' + d.rarityCounts.uncommon + ' uncommon / ' + d.rarityCounts.common + ' common';
    var lanes = { headline: [], media: [], underground: [] };
    d.cards.forEach(function (c) { lanes[c.lane].push(c); });
    Object.keys(lanes).forEach(function (lane) {
      var el = document.getElementById('deck-' + lane);
      var html = '';
      lanes[lane].forEach(function (c) {
        html += '<div class="card ' + rarityClass(c.rarity) + '"><div class="name">#' + c.edition + ' ' + esc(c.name) + '</div>' +
          '<div class="meta">' + esc(c.type) + ' &middot; P' + c.power + ' / F' + c.fuel + ' / V' + c.volatility + ' &middot; ' + esc(c.rarity) + '</div>' +
          '<div class="flavor">&ldquo;' + esc(c.flavor) + '&rdquo;</div></div>';
      });
      el.innerHTML = html;
    });
  });
}
loadDeck();
</script>
</body>
</html>`;
  return { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' }, body };
}

/** Route a request. Pure — no sockets, fully unit-testable. */
export function handle(req: WebRequest): WebResponse {
  const method = (req.method ?? 'GET').toUpperCase();
  const path = (req.url ?? '/').split('?')[0];
  if (method === 'GET' && path === '/') return pageHtml();
  if (method === 'GET' && path === '/api/deck') return deckSummary();
  if (method === 'POST' && path === '/api/sim') return runSim(req);
  if (method === 'POST' && path === '/api/match') return runMatch(req);
  if (method === 'GET' && path === '/health') return json(200, { ok: true, service: 'paper-trail-game' });
  return text(404, 'not found');
}

/* ------------------------------------------------------------------ */
/* Server bootstrap (thin node:http wrapper)                           */
/* ------------------------------------------------------------------ */

export function startServer(port = 8787): ReturnType<typeof createServer> {
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString('utf8');
    });
    req.on('end', () => {
      const out = handle({ method: req.method ?? 'GET', url: req.url ?? '/', body });
      res.writeHead(out.status, out.headers);
      res.end(out.body);
    });
  });
  server.listen(port, () => {
    console.log('PAPER TRAIL web UI on http://localhost:' + port + '/');
  });
  return server;
}
