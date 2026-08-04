import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  CANONICAL_RE,
  assignEditions,
  availableEditions,
  buildManifest,
  defaultLedger,
  loadLedger,
  scanCards,
  validateCard,
  type GenesisCard,
} from "./mint.ts";

function makeCard(edition: number, overrides: Partial<GenesisCard> = {}): GenesisCard {
  return {
    name: `GENESIS 77 #${String(edition).padStart(2, "0")} — Test Card`,
    symbol: "PAPERTRAIL",
    description: "Test card for the delivery pipeline.",
    image: "https://example.com/img.svg",
    external_url: "https://github.com/cco-agent/PAPER-TRAIL",
    attributes: [
      { trait_type: "Edition", value: String(edition) },
      { trait_type: "Lane", value: "The Headline" },
      { trait_type: "Type", value: "news" },
      { trait_type: "Power", value: "5" },
      { trait_type: "Fuel", value: "3" },
      { trait_type: "Volatility", value: "70" },
      { trait_type: "Rarity", value: "rare" },
      { trait_type: "Era", value: "GENESIS" },
    ],
    properties: {
      files: [{ uri: "https://example.com/img.svg", type: "image/svg+xml" }],
      category: "image",
    },
    ...overrides,
  };
}

function tempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "pt-mint-"));
}

test("scanCards: canonical 2-digit included, legacy 3-digit skipped", () => {
  const d = tempDir();
  fs.writeFileSync(path.join(d, "01.json"), JSON.stringify(makeCard(1)));
  fs.writeFileSync(path.join(d, "02.json"), JSON.stringify(makeCard(2)));
  fs.writeFileSync(path.join(d, "001.json"), JSON.stringify(makeCard(1))); // legacy
  const recs = scanCards(d);
  assert.equal(recs.length, 2);
  assert.deepEqual(recs.map((r) => r.edition), [1, 2]);
});

test("CANONICAL_RE: 01/77 match, legacy and odd widths do not", () => {
  assert.ok(CANONICAL_RE.test("01.json"));
  assert.ok(CANONICAL_RE.test("77.json"));
  assert.ok(!CANONICAL_RE.test("001.json"));
  assert.ok(!CANONICAL_RE.test("1.json"));
  assert.ok(!CANONICAL_RE.test("0010.json"));
});

test("validateCard: valid card passes clean", () => {
  assert.deepEqual(validateCard(makeCard(1)), []);
});

test("validateCard: rejects missing Lane, bad Power, wrong Era", () => {
  const c1 = makeCard(3);
  c1.attributes = c1.attributes.filter((a) => a.trait_type !== "Lane");
  assert.ok(validateCard(c1).some((e) => e.includes("Lane")));

  const c2 = makeCard(4);
  c2.attributes = c2.attributes.map((a) => (a.trait_type === "Power" ? { ...a, value: "99" } : a));
  assert.ok(validateCard(c2).some((e) => e.includes("Power")));

  const c3 = makeCard(5);
  c3.attributes = c3.attributes.map((a) => (a.trait_type === "Era" ? { ...a, value: "POST" } : a));
  assert.ok(validateCard(c3).some((e) => e.includes("Era")));
});

test("buildManifest: URIs from base + file, sorted by edition", () => {
  const d = tempDir();
  fs.writeFileSync(path.join(d, "02.json"), JSON.stringify(makeCard(2)));
  fs.writeFileSync(path.join(d, "01.json"), JSON.stringify(makeCard(1)));
  const m = buildManifest(
    scanCards(d),
    "https://raw.githubusercontent.com/cco-agent/PAPER-TRAIL/main/genesis77/cards",
  );
  assert.equal(m.length, 2);
  assert.equal(m[0].edition, 1);
  assert.equal(m[1].edition, 2);
  assert.ok(m[0].uri.endsWith("/01.json"));
  assert.equal(m[0].power, 5);
});

test("assignEditions: first come first corrupted + per-buyer paid_sol", () => {
  const ledger = defaultLedger();
  const a = assignEditions(ledger, "walletA", 3);
  assert.deepEqual(a.allocated, [1, 2, 3]);
  assert.equal(a.overflow, 0);
  assert.equal(a.buyer.paid_sol, 0.3);
  ledger.buyers.push(a.buyer); // persist (mirrors CLI --apply flow)
  const b = assignEditions(ledger, "walletB", 1);
  assert.deepEqual(b.allocated, [4]);
  assert.equal(b.buyer.paid_sol, 0.1);
});

test("assignEditions: cap at 77 with overflow detection", () => {
  const ledger = defaultLedger();
  const r = assignEditions(ledger, "whale", 80);
  assert.equal(r.allocated.length, 77);
  assert.equal(r.overflow, 3);
  assert.equal(r.buyer.paid_sol, 7.7);
  ledger.buyers.push(r.buyer); // persist before checking availability
  assert.equal(availableEditions(ledger).length, 0);
});

test("loadLedger: missing file returns default seed", () => {
  const l = loadLedger(path.join(os.tmpdir(), "nope-" + Date.now() + ".json"));
  assert.equal(l.max, 77);
  assert.equal(l.price_sol, 0.1);
  assert.equal(l.filled, 0);
});
