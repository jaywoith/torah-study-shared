import { describe, expect, it } from 'vitest';
import { migrate, openDatabase } from '../src/db';
import { createRepository } from '../src/db/repository';
import { MIGRATIONS } from '../src/db/migrations';

const profile = {
  framework: 'masorti_conservative' as const,
  level: 'intermediate' as const,
  interests: ['siddur' as const],
  studyLength: 'medium' as const,
  languageMode: 'mixed' as const,
  showCantillation: false,
  divineName: 'abbreviated' as const,
};

describe('migrations', () => {
  it('apply from empty and are recorded', () => {
    const db = openDatabase(':memory:');
    const rows = db.prepare('SELECT id, name FROM schema_migrations ORDER BY id').all();
    expect(rows).toEqual(MIGRATIONS.map(({ id, name }) => ({ id, name })));
  });

  it('are idempotent', () => {
    const db = openDatabase(':memory:');
    expect(migrate(db)).toEqual([]);
  });

  it('have unique, increasing ids', () => {
    const ids = MIGRATIONS.map((m) => m.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('repository', () => {
  const repo = () => createRepository(openDatabase(':memory:'), () => new Date('2026-11-21T12:00:00Z'));

  it('stores a single profile and overwrites it', () => {
    const r = repo();
    expect(r.getProfile()).toBeNull();
    r.saveProfile(profile);
    r.saveProfile({ ...profile, level: 'advanced' });
    expect(r.getProfile()).toEqual({ ...profile, level: 'advanced' });
  });

  it('defaults v0.5 display settings on a profile saved by v0.4', () => {
    const db = openDatabase(':memory:');
    const { showCantillation, divineName, ...v04 } = profile;
    db.prepare("INSERT INTO profile (id, data, updated_at) VALUES (1, ?, ?)").run(JSON.stringify(v04), '2026-11-01T00:00:00Z');
    expect(createRepository(db).getProfile()).toEqual({ ...v04, showCantillation: false, divineName: 'abbreviated' });
  });

  it('records Siddur completion idempotently, in completion order', () => {
    const r = repo();
    r.markComplete('siddur', 'b');
    r.markComplete('siddur', 'a');
    r.markComplete('siddur', 'b');
    expect(r.getSiddurCompleted().sort()).toEqual(['a', 'b']);
    r.unmarkComplete('siddur', 'a');
    expect(r.getSiddurCompleted()).toEqual(['b']);
  });

  it('keeps daily completions per date and filters by range', () => {
    const r = repo();
    r.markComplete('daily', 'u1', '2026-11-20');
    r.markComplete('daily', 'u1', '2026-11-21');
    r.markComplete('daily', 'u2', '2026-11-22');
    expect(r.getDailyCompleted('2026-11-21', '2026-11-22').map((d) => d.date)).toEqual(['2026-11-21', '2026-11-22']);
    expect(r.getDailyCompleted()).toHaveLength(3);
    expect(r.getSiddurCompleted()).toEqual([]);
  });

  it('resets one path without touching the other', () => {
    const r = repo();
    r.markComplete('siddur', 'a');
    r.markComplete('daily', 'u1', '2026-11-21');
    expect(r.resetPath('siddur')).toBe(1);
    expect(r.getSiddurCompleted()).toEqual([]);
    expect(r.getDailyCompleted()).toHaveLength(1);
  });

  it('rejects unknown paths at the schema level', () => {
    const db = openDatabase(':memory:');
    expect(() =>
      db.prepare("INSERT INTO completed_units (path, unit_id, completed_at) VALUES ('other', 'x', 'now')").run()
    ).toThrow();
  });
});
