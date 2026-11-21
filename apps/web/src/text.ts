/**
 * Splits a text into sentence-level segments (on . ; ? ! followed by space).
 * Used by the interleaved (mixed) layout to align Hebrew, transliteration and English.
 */
export function segment(text: string): string[] {
  return text
    .split(/(?<=[.;?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface InterleavedLine {
  hebrew?: string;
  transliteration?: string;
  english?: string;
}

/**
 * Line-by-line alignment when every present field splits into the same number
 * of segments. Returns null when they don't line up (caller falls back to stacked).
 */
export function interleave(fields: InterleavedLine): InterleavedLine[] | null {
  const present = (Object.entries(fields) as [keyof InterleavedLine, string | undefined][]).filter(
    (e): e is [keyof InterleavedLine, string] => Boolean(e[1])
  );
  if (present.length < 2) return null;
  const split = present.map(([k, v]) => [k, segment(v)] as const);
  const n = split[0][1].length;
  if (n < 2 || split.some(([, s]) => s.length !== n)) return null;
  return Array.from({ length: n }, (_, i) => Object.fromEntries(split.map(([k, s]) => [k, s[i]])));
}
