import { runSeries, type BotStrategy } from './sim.ts';
import { startServer } from './webui.ts';

const STRATEGIES: readonly BotStrategy[] = ['greedy', 'meta', 'hoarder'];

function parseArg(name: string, def: number): number {
  const i = process.argv.indexOf(name);
  if (i === -1) return def;
  const v = Number(process.argv[i + 1]);
  return Number.isFinite(v) ? v : def;
}

function grid(): void {
  const matches = parseArg('--matches', 120);
  const seed = parseArg('--seed', 20260804);
  const penalties = [1, 1.5, 2];
  const weightMaxes = [1.5, 2.0, 2.5];
  console.log('=== balance grid: offLanePenalty x weightMax (greedy vs meta) ===');
  console.log('matches per cell: ' + matches + ' | seed: ' + seed + ' | weightMin: 0.5');
  console.log('');
  console.log('penalty'.padEnd(9) + 'wMax'.padEnd(7) + 'gW%'.padEnd(6) + 'mW%'.padEnd(6) + 'draw%'.padEnd(7) + 'ELO(g->m)');
  for (const pen of penalties) {
    for (const wmax of weightMaxes) {
      const r = runSeries('greedy', 'meta', matches, { seed, offLanePenalty: pen, weightMax: wmax });
      const pct = (w: number) => ((w / matches) * 100).toFixed(0) + '%';
      console.log(
        String(pen).padEnd(9) + String(wmax).padEnd(7) +
        pct(r.wins0).padEnd(6) + pct(r.wins1).padEnd(6) + pct(r.draws).padEnd(7) +
        r.eloEnd[0] + ' -> ' + r.eloEnd[1]
      );
    }
    console.log('');
  }
  console.log('read: gW% = greedy wins, mW% = meta wins. Balance target ~50/50.');
}

function main(): void {
  const matches = parseArg('--matches', 100);
  const seed = parseArg('--seed', 20260804);
  const seconds = parseArg('--seconds', 180);
  console.log('=== PAPER TRAIL battle simulator ===');
  console.log('matches per pairing: ' + matches + ' | seed: ' + seed + ' | match length: ' + seconds + 's');
  console.log('');
  for (const s0 of STRATEGIES) {
    for (const s1 of STRATEGIES) {
      const r = runSeries(s0, s1, matches, { seed, matchSeconds: seconds });
      const pct = (w: number) => ((w / matches) * 100).toFixed(0) + '%';
      console.log(
        s0.padEnd(7) + ' vs ' + s1.padEnd(7) +
        '  W ' + pct(r.wins0) + ' / D ' + pct(r.draws) + ' / W ' + pct(r.wins1) +
        '  ELO ' + r.eloEnd[0] + ' / ' + r.eloEnd[1] +
        '  burn ' + r.totalBurned[0] + ':' + r.totalBurned[1] +
        '  lock ' + r.totalLocked[0] + ':' + r.totalLocked[1]
      );
    }
    console.log('');
  }
  console.log('Burn it. Feed the gauge.');
}

const args = process.argv.slice(2);
if (args[0] === 'web') {
  // `npm run web` — serve the zero-dependency battle simulator UI.
  startServer(parseArg('--port', 8787));
} else if (process.argv.includes('--grid')) {
  grid();
} else {
  main();
}
