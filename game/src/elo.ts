export type MatchOutcome = 0 | 0.5 | 1; // points for player A

export function expectedScore(a: number, b: number): number {
  return 1 / (1 + 10 ** ((b - a) / 400));
}

export function updateElo(a: number, b: number, outcome: MatchOutcome, k = 32): [number, number] {
  const ea = expectedScore(a, b);
  const eb = 1 - ea;
  const na = Math.round(a + k * (outcome - ea));
  const nb = Math.round(b + k * ((1 - outcome) - eb));
  return [na, nb];
}
