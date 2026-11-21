import { describe, expect, it } from 'vitest';
import { parseUserProfile } from '../src';
import { modelUser } from './fixtures';

describe('parseUserProfile', () => {
  it('accepts a valid profile', () => {
    expect(parseUserProfile(modelUser)).toEqual({ ok: true, profile: modelUser });
  });

  it('rejects non-objects', () => {
    expect(parseUserProfile(null).ok).toBe(false);
  });

  it('rejects unknown enum values with a helpful message', () => {
    const r = parseUserProfile({ ...modelUser, framework: 'karaite', languageMode: 'yiddish' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors).toHaveLength(2);
      expect(r.errors[0]).toMatch(/framework must be one of/);
    }
  });

  it('rejects bad interests', () => {
    expect(parseUserProfile({ ...modelUser, interests: ['siddur', 'astrology'] }).ok).toBe(false);
    expect(parseUserProfile({ ...modelUser, interests: 'siddur' }).ok).toBe(false);
  });
});
