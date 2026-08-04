import { runSeries, type BotStrategy } from './sim.ts';

const STRATEGIES: readonly BotStrategy[] = ['greedy', 'meta', 'hoarder'];

function parseArg(name: string, def: number): number {
  const i = process.argv.indexOf(name);
  if (i === -1) return def;
  const v = Number(process.argv[i + 1]);
  return Number.isFinite(v) ? v : def;
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

main();
