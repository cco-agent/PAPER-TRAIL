/**
 * GENESIS 77 — delivery pipeline (scan -> validate -> manifest -> assign).
 *
 * This module does NOT touch the chain. On-chain minting is executed
 * separately (MINT_NFT tool) using metadata URIs produced by `manifest`.
 * Zero runtime dependencies; Node 22 `--experimental-strip-types` compatible.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

export interface CardTrait {
  trait_type: string;
  value: string;
}

export interface GenesisCard {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url: string;
  attributes: CardTrait[];
  properties: {
    files: { uri: string; type: string }[];
    category: string;
  };
}

export interface CardRecord {
  edition: number;
  file: string;
  card: GenesisCard;
}

export interface ManifestEntry {
  edition: number;
  name: string;
  uri: string;
  lane: string;
  type: string;
  power: number;
  fuel: number;
  volatility: number;
  rarity: string;
}

export interface BuyerEntry {
  wallet: string;
  editions: number[];
  paid_sol: number;
  received_at: string | null;
  tx_signature: string | null;
}

export interface SalesLedger {
  price_sol: number;
  max: number;
  filled: number;
  buyers: BuyerEntry[];
}

// Canonical naming is 2-digit zero-padded (01.json..77.json).
// Legacy 3-digit files (001.json..003.json) are history and are skipped.
export const CANONICAL_RE = /^(\d{2})\.json$/;

export const LANES = ["The Headline", "The Media", "The Underground"] as const;
export const REQUIRED_TRAITS = [
  "Edition",
  "Lane",
  "Type",
  "Power",
  "Fuel",
  "Volatility",
  "Rarity",
  "Era",
] as const;

export function defaultLedger(): SalesLedger {
  return { price_sol: 0.1, max: 77, filled: 0, buyers: [] };
}

export function scanCards(dir: string): CardRecord[] {
  const records: CardRecord[] = [];
  for (const f of fs.readdirSync(dir).sort()) {
    const m = CANONICAL_RE.exec(f);
    if (!m) continue;
    const raw = fs.readFileSync(path.join(dir, f), "utf8");
    const card = JSON.parse(raw) as GenesisCard;
    records.push({ edition: Number(m[1]), file: f, card });
  }
  return records.sort((a, b) => a.edition - b.edition);
}

export function traitMap(card: GenesisCard): Map<string, string> {
  return new Map(card.attributes.map((a) => [a.trait_type, String(a.value)]));
}

export function validateCard(card: GenesisCard): string[] {
  const errors: string[] = [];
  if (typeof card.name !== "string" || !card.name.startsWith("GENESIS 77")) {
    errors.push("name must start with 'GENESIS 77'");
  }
  if (card.symbol !== "PAPERTRAIL") errors.push("symbol must be 'PAPERTRAIL'");
  if (typeof card.description !== "string" || card.description.length === 0) {
    errors.push("description missing");
  }
  if (typeof card.image !== "string" || card.image.length === 0) {
    errors.push("image missing");
  }
  if (!Array.isArray(card.attributes)) errors.push("attributes must be an array");

  const a = traitMap(card);
  for (const t of REQUIRED_TRAITS) {
    if (!a.has(t)) errors.push(`attribute '${t}' missing`);
  }
  if (a.get("Era") !== "GENESIS") errors.push("Era must be 'GENESIS'");
  const lane = a.get("Lane") ?? "";
  if (!(LANES as readonly string[]).includes(lane)) errors.push(`Lane invalid: '${lane}'`);
  const ed = Number(a.get("Edition"));
  if (!Number.isInteger(ed) || ed < 1 || ed > 77) {
    errors.push(`Edition out of range: ${a.get("Edition")}`);
  }
  const p = Number(a.get("Power"));
  if (!Number.isInteger(p) || p < 1 || p > 10) errors.push(`Power out of range: ${a.get("Power")}`);
  const fu = Number(a.get("Fuel"));
  if (!Number.isInteger(fu) || fu < 0 || fu > 10) errors.push(`Fuel out of range: ${a.get("Fuel")}`);
  const v = Number(a.get("Volatility"));
  if (!Number.isInteger(v) || v < 0 || v > 100) errors.push(`Volatility out of range: ${a.get("Volatility")}`);
  return errors;
}

export function buildManifest(records: CardRecord[], baseUri: string): ManifestEntry[] {
  const base = baseUri.replace(/\/+$/, "");
  return records
    .map((r) => {
      const a = traitMap(r.card);
      return {
        edition: Number(a.get("Edition")),
        name: r.card.name,
        uri: `${base}/${r.file}`,
        lane: a.get("Lane") ?? "",
        type: a.get("Type") ?? "",
        power: Number(a.get("Power")),
        fuel: Number(a.get("Fuel")),
        volatility: Number(a.get("Volatility")),
        rarity: a.get("Rarity") ?? "",
      };
    })
    .sort((x, y) => x.edition - y.edition);
}

export function loadLedger(p: string): SalesLedger {
  if (!fs.existsSync(p)) return defaultLedger();
  return JSON.parse(fs.readFileSync(p, "utf8")) as SalesLedger;
}

export function takenEditions(ledger: SalesLedger): Set<number> {
  const s = new Set<number>();
  for (const b of ledger.buyers) for (const e of b.editions) s.add(e);
  return s;
}

export function availableEditions(ledger: SalesLedger): number[] {
  const taken = takenEditions(ledger);
  const out: number[] = [];
  for (let e = 1; e <= ledger.max; e++) if (!taken.has(e)) out.push(e);
  return out;
}

export interface AssignResult {
  buyer: BuyerEntry;
  allocated: number[];
  overflow: number;
}

/**
 * First come, first corrupted: allocate the lowest available editions.
 * Pure function — returns the new buyer entry; caller persists it.
 */
export function assignEditions(ledger: SalesLedger, wallet: string, count: number): AssignResult {
  const pool = availableEditions(ledger);
  const allocated = pool.slice(0, Math.max(0, count));
  const overflow = Math.max(0, count - allocated.length);
  const existing = ledger.buyers.find((b) => b.wallet === wallet);
  const buyer: BuyerEntry = existing ?? {
    wallet,
    editions: [],
    paid_sol: 0,
    received_at: null,
    tx_signature: null,
  };
  buyer.editions = [...buyer.editions, ...allocated].sort((a, b) => a - b);
  buyer.paid_sol = Number((buyer.paid_sol + ledger.price_sol * allocated.length).toFixed(6));
  return { buyer, allocated, overflow };
}

// ---------------- CLI ----------------

function usage(): never {
  console.error(
    [
      "GENESIS 77 delivery pipeline",
      "usage: node mint.ts <command>",
      "  list                         — print all scanned editions with stats",
      "  validate                     — validate all canonical cards (exit 1 on errors)",
      "  manifest [--dir D] [--base U] [--out F] — build metadata-URI manifest",
      "  status  [--ledger F]         — presale ledger status (filled / remaining)",
      "  assign <wallet> <count> [--ledger F] [--apply] — assign editions (dry-run default)",
    ].join("\n"),
  );
  process.exit(2);
}

function flag(args: string[], name: string, fallback: string): string {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
}

const DEFAULT_BASE =
  "https://raw.githubusercontent.com/cco-agent/PAPER-TRAIL/main/genesis77/cards";

export function main(argv: string[]): void {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === "--help" || cmd === "-h") usage();
  const dir = flag(rest, "--dir", path.join(import.meta.dirname, "cards"));
  const ledgerPath = flag(rest, "--ledger", path.join(import.meta.dirname, "sales.json"));
  const base = flag(rest, "--base", DEFAULT_BASE);

  if (cmd === "list") {
    const recs = scanCards(dir);
    for (const r of recs) {
      const a = traitMap(r.card);
      console.log(
        `#${String(r.edition).padStart(2, "0")} | ${r.card.name} | lane=${a.get("Lane")} | type=${a.get("Type")} | P${a.get("Power")}/F${a.get("Fuel")}/V${a.get("Volatility")} | ${a.get("Rarity")}`,
      );
    }
    console.log(`total: ${recs.length} canonical cards (legacy 3-digit files skipped)`);
  } else if (cmd === "validate") {
    const recs = scanCards(dir);
    let bad = 0;
    for (const r of recs) {
      const errs = validateCard(r.card);
      if (errs.length) {
        bad += 1;
        console.error(`#${r.file}: ${errs.join("; ")}`);
      }
    }
    console.log(`validate: ${recs.length} scanned, ${recs.length - bad} OK, ${bad} failed`);
    process.exit(bad ? 1 : 0);
  } else if (cmd === "manifest") {
    const recs = scanCards(dir);
    const manifest = buildManifest(recs, base);
    const out = flag(rest, "--out", "manifest.json");
    fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`manifest: ${manifest.length} entries written to ${out}`);
  } else if (cmd === "status") {
    const ledger = loadLedger(ledgerPath);
    const avail = availableEditions(ledger);
    console.log(
      `price: ${ledger.price_sol} SOL/card | filled: ${ledger.filled}/${ledger.max} | remaining: ${avail.length}`,
    );
    if (avail.length) {
      const head = avail
        .slice(0, 10)
        .map((e) => String(e).padStart(2, "0"))
        .join(", ");
      console.log(`next available: #${head}${avail.length > 10 ? ", …" : ""}`);
    }
    for (const b of ledger.buyers) {
      console.log(
        `buyer ${b.wallet}: editions [${b.editions.map((e) => String(e).padStart(2, "0")).join(",")}] paid ${b.paid_sol} SOL`,
      );
    }
  } else if (cmd === "assign") {
    const wallet = rest[0];
    const count = Number(rest[1]);
    if (!wallet || !Number.isInteger(count) || count < 1) usage();
    const apply = rest.includes("--apply");
    const ledger = loadLedger(ledgerPath);
    const res = assignEditions(ledger, wallet, count);
    console.log(
      `wallet ${wallet}: allocated #${res.allocated.map((e) => String(e).padStart(2, "0")).join(", ") || "(none)"}${res.overflow ? ` | OVERFLOW: ${res.overflow} beyond 77` : ""}`,
    );
    if (apply) {
      const i = ledger.buyers.findIndex((b) => b.wallet === wallet);
      if (i >= 0) ledger.buyers[i] = res.buyer;
      else ledger.buyers.push(res.buyer);
      ledger.filled = takenEditions(ledger).size;
      fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
      console.log(`ledger updated: filled ${ledger.filled}/${ledger.max} -> ${ledgerPath}`);
    } else {
      console.log("dry-run (use --apply to persist)");
    }
  } else {
    usage();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
