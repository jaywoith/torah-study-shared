/**
 * Per-device reading preferences (browser storage, not the server profile):
 * text size. Storage can be unavailable (private mode), so every access is guarded.
 */
import { useCallback, useEffect, useState } from 'react';

export const TEXT_SCALES = [0.9, 1, 1.12, 1.25, 1.4] as const;
const KEY = 'torah-study.textScale';

function readScale(): number {
  try {
    const v = Number(localStorage.getItem(KEY));
    return (TEXT_SCALES as readonly number[]).includes(v) ? v : 1;
  } catch {
    return 1;
  }
}

/** The reading text scale, applied as --reading-scale on <html>. */
export function useTextScale() {
  const [scale, setScale] = useState<number>(readScale);
  useEffect(() => {
    document.documentElement.style.setProperty('--reading-scale', String(scale));
    try {
      localStorage.setItem(KEY, String(scale));
    } catch {
      /* not persisted; still applied for this visit */
    }
  }, [scale]);
  const step = useCallback((dir: 1 | -1) => {
    setScale((s) => {
      const i = TEXT_SCALES.indexOf(s as (typeof TEXT_SCALES)[number]);
      return TEXT_SCALES[Math.min(TEXT_SCALES.length - 1, Math.max(0, (i < 0 ? 1 : i) + dir))];
    });
  }, []);
  return {
    scale,
    smaller: () => step(-1),
    larger: () => step(1),
    atMin: scale === TEXT_SCALES[0],
    atMax: scale === TEXT_SCALES[TEXT_SCALES.length - 1],
  };
}

/** True while the media query matches (e.g. the two-pane desktop layout). */
export function useMediaQuery(query: string): boolean {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia(query);
    const on = () => setMatches(mql.matches);
    on();
    mql.addEventListener('change', on);
    return () => mql.removeEventListener('change', on);
  }, [query]);
  return matches;
}

/** Desktop layout breakpoint; keep in sync with styles.css (--wide). */
export const WIDE_QUERY = '(min-width: 1100px)';
