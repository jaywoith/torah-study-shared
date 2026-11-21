/**
 * Language mode handlers.
 * Supports English, Hebrew, split, and mixed (English + transliteration + pointed key Hebrew).
 */

import { LanguageMode } from './models';

export interface LanguageRenderOptions {
  mode: LanguageMode;
  includeTransliteration: boolean;
  pointedKeyWords: boolean;
}

export function getLanguageOptions(mode: LanguageMode): LanguageRenderOptions {
  switch (mode) {
    case 'english':
      return { mode, includeTransliteration: false, pointedKeyWords: false };
    case 'hebrew':
      return { mode, includeTransliteration: false, pointedKeyWords: true };
    case 'split':
      return { mode, includeTransliteration: true, pointedKeyWords: true };
    case 'mixed':
    default:
      return { mode: 'mixed', includeTransliteration: true, pointedKeyWords: true };
  }
}

// Helper for shoresh (root) extraction – stub for intermediate level
export function extractShorest(hebrewWord: string): string | null {
  // In production this would use a proper morphological analyzer.
  // For intermediate Conservative: return a simple root if known.
  const common: Record<string, string> = {
    'בָּרַךְ': 'ברך',
    'שָׁמַע': 'שמע',
    'יָדַע': 'ידע',
  };
  return common[hebrewWord] || null;
}

export function getPartOfSpeech(hebrewWord: string): string | null {
  // Stub
  return 'verb'; // placeholder
}
