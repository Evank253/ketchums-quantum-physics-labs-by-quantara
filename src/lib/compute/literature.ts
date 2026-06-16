// Published-literature benchmark values (with citations) used as a second
// cross-check on engine output. Pure data, no network.

export type LiteratureValue = {
  symbol: string;
  value: number;
  uncertainty: number;
  citation: string;
  doi?: string;
};

export const LITERATURE: Record<string, LiteratureValue> = {
  a_e: {
    symbol: "a_e",
    value: 1.15965218161e-3,
    uncertainty: 2.3e-13,
    citation: "Aoyama, Hayakawa, Kinoshita, Nio — Phys. Rep. 887 (2020)",
    doi: "10.1016/j.physrep.2020.07.006",
  },
};

export function literatureFor(symbol: string): LiteratureValue | null {
  return LITERATURE[symbol] ?? null;
}
