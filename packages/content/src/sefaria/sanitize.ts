/**
 * Sanitizing Sefaria text (ADR-010). Pure: string in, string out.
 *
 * Sefaria texts carry HTML: footnotes, small caps (L<small>ORD</small>), large
 * letters (<big>), poetry spans, line breaks, and in Miqra according to the
 * Masorah also parasha markers ({פ} / {ס}). We keep the words and te'amim and
 * drop everything else.
 */

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  thinsp: ' ',
  ensp: ' ',
  emsp: ' ',
  zwj: '‍',
  zwnj: '',
  mdash: '—',
  ndash: '–',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  hellip: '…',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[code.toLowerCase()] ?? m;
  });
}

interface Tag {
  name: string;
  closing: boolean;
  selfClosing: boolean;
  attrs: string;
}

function parseTag(raw: string): Tag | null {
  const m = /^<\s*(\/)?\s*([a-z0-9]+)([^>]*?)(\/)?\s*>$/i.exec(raw);
  if (!m) return null;
  return { closing: !!m[1], name: m[2].toLowerCase(), attrs: m[3] ?? '', selfClosing: !!m[4] };
}

/** Elements removed together with their content. */
function dropsContent(tag: Tag): boolean {
  if (tag.name === 'sup') return true; // footnote markers, endFootnote markers
  if (/class\s*=\s*["'][^"']*\bfootnote\b/i.test(tag.attrs)) return true; // <i class="footnote">
  if (/class\s*=\s*["'][^"']*\bmam-spi-/i.test(tag.attrs)) return true; // parasha markers {פ} {ס}
  return false;
}

const BLOCK_BREAKS = new Set(['br', 'p', 'div', 'li']);

/**
 * Removes HTML. Footnotes, <sup> markers and parasha markers are removed with
 * their content (nested tags handled); every other tag is unwrapped. <br> and
 * block tags become spaces.
 */
export function stripHtml(html: string): string {
  let out = '';
  // Stack of open elements; depth > 0 inside a dropped element.
  const stack: { name: string; drop: boolean }[] = [];
  let dropDepth = 0;
  const parts = html.split(/(<[^>]*>)/);
  for (const part of parts) {
    if (part.startsWith('<') && part.endsWith('>')) {
      const tag = parseTag(part);
      if (!tag) continue;
      if (tag.closing) {
        // Pop to the matching element (tolerates sloppy nesting).
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i].name === tag.name) {
            for (let j = stack.length - 1; j >= i; j--) if (stack[j].drop) dropDepth--;
            stack.length = i;
            break;
          }
        }
        if (dropDepth === 0 && BLOCK_BREAKS.has(tag.name)) out += ' ';
        continue;
      }
      if (tag.selfClosing || tag.name === 'br' || tag.name === 'img' || tag.name === 'hr') {
        if (dropDepth === 0) out += ' ';
        continue;
      }
      const drop = dropDepth > 0 || dropsContent(tag);
      if (drop) dropDepth++;
      stack.push({ name: tag.name, drop });
      if (dropDepth === 0 && BLOCK_BREAKS.has(tag.name)) out += ' ';
      continue;
    }
    if (dropDepth === 0) out += part;
  }
  return out;
}

/** Collapses all whitespace (including thin and no-break spaces) to single spaces and trims. */
export function normalizeWhitespace(text: string): string {
  return text.replace(/[\s  -   　]+/g, ' ').trim();
}

/** Full pipeline for one segment. */
export function sanitizeSegment(html: string): string {
  return normalizeWhitespace(decodeEntities(stripHtml(html)));
}

/**
 * True when a whole segment is an editorial note rather than the text itself:
 * Metsudah Siddur writes halachic notes as a segment wrapped in <small> (Hebrew)
 * or <i> (English intro notes).
 */
export function isEditorialNote(html: string): boolean {
  const t = html.trim();
  return /^<small>[\s\S]*<\/small>$/i.test(t) || /^<i>[\s\S]*<\/i>$/i.test(t);
}

/** Sefaria returns a string for one segment, or (nested) arrays for ranges. */
export function flattenSegments(text: unknown): string[] {
  if (typeof text === 'string') return [text];
  if (Array.isArray(text)) return text.flatMap(flattenSegments);
  return [];
}

/** Sanitizes and joins a version's segments, skipping editorial notes and empty segments. */
export function sanitizeText(text: unknown): string {
  return flattenSegments(text)
    .filter((s) => !isEditorialNote(s))
    .map(sanitizeSegment)
    .filter((s) => s.length > 0)
    .join(' ');
}
