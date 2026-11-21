/**
 * Theological frameworks.
 * Differences are configuration, not hard-coded branches in generation logic.
 */

import { FrameworkId, KabbalahDepth } from './models';

export interface FrameworkConfig {
  id: FrameworkId;
  name: string;
  description: string;
  allowedSourceTypes: string[];
  defaultCommentaryStyle: string;
  halachahStance: string;
  /** Deepest Kabbalah this framework presents (further capped by learning level). */
  kabbalahDepth: KabbalahDepth;
  musarEmphasis: 'high' | 'medium' | 'low';
  aiPersonaNotes: string;
  /**
   * Whether progressive / historical-critical readings may be presented as the default.
   * False for traditional frameworks; validation enforces it.
   */
  progressiveDefaultAllowed: boolean;
}

export const frameworks: Record<FrameworkId, FrameworkConfig> = {
  hasidic: {
    id: 'hasidic',
    name: 'Hasidic',
    description: 'Emphasizes Chassidic sources, deeper Kabbalah earlier, and emotional/devotional framing.',
    allowedSourceTypes: ['chassidic', 'kabbalah', 'tanakh', 'midrash'],
    defaultCommentaryStyle: 'devotional and emotional',
    halachahStance: 'traditional with Hasidic emphasis',
    kabbalahDepth: 'advanced',
    musarEmphasis: 'medium',
    aiPersonaNotes: 'Draws on Hasidic masters; warm, encouraging, mystical.',
    progressiveDefaultAllowed: false,
  },
  orthodox: {
    id: 'orthodox',
    name: 'Orthodox',
    description: 'Strict traditional sources and Halachah. Limited use of academic or historical-critical material.',
    allowedSourceTypes: ['rishonim', 'acharonim', 'traditional', 'tanakh'],
    defaultCommentaryStyle: 'traditional and precise',
    halachahStance: 'binding traditional Halachah',
    kabbalahDepth: 'symbolic',
    musarEmphasis: 'high',
    aiPersonaNotes: 'Conservative in interpretation; cites classic sources carefully.',
    progressiveDefaultAllowed: false,
  },
  modern_orthodox: {
    id: 'modern_orthodox',
    name: 'Modern Orthodox',
    description: 'Traditional Halachah with engagement of broader sources and contemporary application.',
    allowedSourceTypes: ['traditional', 'modern_orthodox', 'tanakh', 'selected_academic'],
    defaultCommentaryStyle: 'traditional with contemporary application',
    halachahStance: 'binding traditional Halachah with modern engagement',
    kabbalahDepth: 'intermediate',
    musarEmphasis: 'medium',
    aiPersonaNotes: 'Balances tradition with thoughtful modern context.',
    progressiveDefaultAllowed: false,
  },
  masorti_conservative: {
    id: 'masorti_conservative',
    name: 'Masorti / Conservative',
    description: 'Treats Halachah as binding, values the traditional Siddur and sources, open to Musar and Kabbalah without adopting a purely historical-critical or progressive lens as the default.',
    allowedSourceTypes: ['traditional', 'conservative_commentaries', 'midrash', 'musar', 'light_kabbalah', 'tanakh'],
    defaultCommentaryStyle: 'traditional Conservative; kavannah-focused',
    halachahStance: 'Halachah as binding with Conservative interpretations',
    kabbalahDepth: 'symbolic',
    musarEmphasis: 'high',
    aiPersonaNotes: 'Respectful of traditional sources, emphasizes kavannah and practical application, cites sources, does not default to progressive reinterpretations.',
    progressiveDefaultAllowed: false,
  },
  reform: {
    id: 'reform',
    name: 'Reform',
    description: 'Ethical and historical emphasis; traditional sources presented as valuable but not binding in the same way.',
    allowedSourceTypes: ['ethical', 'historical', 'traditional_as_resource', 'tanakh'],
    defaultCommentaryStyle: 'ethical and historical',
    halachahStance: 'guidelines rather than binding in the traditional sense',
    kabbalahDepth: 'symbolic',
    musarEmphasis: 'medium',
    aiPersonaNotes: 'Focuses on ethics, personal meaning, and historical context.',
    progressiveDefaultAllowed: true,
  },
};

export function getFramework(id: FrameworkId): FrameworkConfig {
  return frameworks[id];
}
