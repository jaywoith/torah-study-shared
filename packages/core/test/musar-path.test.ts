import { describe, expect, it } from 'vitest';
import { ContentUnit, getMusarSequence, getNextMusarUnit } from '../src';

const unit = (id: string, type: ContentUnit['type'] = 'musar'): ContentUnit => ({
  id,
  type,
  english: id,
  source: id,
  estimatedMinutes: 3,
  interests: [type === 'musar' ? 'musar' : 'tanakh'],
  minLevel: 'beginner',
  verified: false,
});
const units = [unit('my-1'), unit('tanakh-x', 'tanakh'), unit('my-2'), unit('avot-1-1')];

describe('Musar path', () => {
  it('is every Musar unit in library order', () => {
    expect(getMusarSequence(units).map((u) => u.id)).toEqual(['my-1', 'my-2', 'avot-1-1']);
  });

  it('returns the first unit not completed, with position and counts', () => {
    expect(getNextMusarUnit(units, ['my-1'], ['musar'])).toMatchObject({
      unit: { id: 'my-2' },
      position: 2,
      total: 3,
      completedCount: 1,
    });
  });

  it('does not skip a unit left undone (completion is by id, not by date)', () => {
    expect(getNextMusarUnit(units, ['my-2'], ['musar'])?.unit.id).toBe('my-1');
  });

  it('is null when finished or without a Musar interest', () => {
    expect(getNextMusarUnit(units, ['my-1', 'my-2', 'avot-1-1'], ['musar'])).toBeNull();
    expect(getNextMusarUnit(units, [], ['siddur'])).toBeNull();
  });
});
