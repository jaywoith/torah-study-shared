/**
 * All SQL lives here. Routes call these functions and never touch the db directly.
 */
import { parseUserProfile } from '@torah/core';
import type { DailyCompletion, ProgressPath, UserProfile } from '@torah/core';
import type { Db } from './index';

export type Repository = ReturnType<typeof createRepository>;

export function createRepository(db: Db, now: () => Date = () => new Date()) {
  const stmts = {
    getProfile: db.prepare('SELECT data FROM profile WHERE id = 1'),
    upsertProfile: db.prepare(
      `INSERT INTO profile (id, data, updated_at) VALUES (1, @data, @at)
       ON CONFLICT (id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
    ),
    complete: db.prepare(
      `INSERT OR IGNORE INTO completed_units (path, unit_id, study_date, completed_at)
       VALUES (@path, @unitId, @date, @at)`
    ),
    uncomplete: db.prepare('DELETE FROM completed_units WHERE path = @path AND unit_id = @unitId AND study_date = @date'),
    reset: db.prepare('DELETE FROM completed_units WHERE path = ?'),
    pathCompleted: db.prepare(
      "SELECT unit_id FROM completed_units WHERE path = ? AND study_date = '' ORDER BY completed_at, unit_id"
    ),
    dailyRange: db.prepare(
      `SELECT study_date AS date, unit_id AS unitId, completed_at AS completedAt FROM completed_units
       WHERE path = 'daily' AND study_date >= @from AND study_date <= @to
       ORDER BY study_date, completed_at`
    ),
  };

  return {
    getProfile(): UserProfile | null {
      const row = stmts.getProfile.get() as { data: string } | undefined;
      if (!row) return null;
      // Run stored data through the parser so profiles saved by older versions get
      // defaults for newer fields (e.g. v0.5 display settings).
      const parsed = parseUserProfile(JSON.parse(row.data));
      return parsed.ok ? parsed.profile : (JSON.parse(row.data) as UserProfile);
    },

    saveProfile(profile: UserProfile): void {
      stmts.upsertProfile.run({ data: JSON.stringify(profile), at: now().toISOString() });
    },

    markComplete(path: ProgressPath, unitId: string, date = ''): void {
      stmts.complete.run({ path, unitId, date, at: now().toISOString() });
    },

    unmarkComplete(path: ProgressPath, unitId: string, date = ''): void {
      stmts.uncomplete.run({ path, unitId, date });
    },

    resetPath(path: ProgressPath): number {
      return stmts.reset.run(path).changes;
    },

    /** Completed unit ids on a sequential path (siddur, musar), in completion order. */
    getPathCompleted(path: 'siddur' | 'musar'): string[] {
      return (stmts.pathCompleted.all(path) as { unit_id: string }[]).map((r) => r.unit_id);
    },

    getSiddurCompleted(): string[] {
      return (stmts.pathCompleted.all('siddur') as { unit_id: string }[]).map((r) => r.unit_id);
    },

    getDailyCompleted(from = '0000-00-00', to = '9999-99-99'): DailyCompletion[] {
      return stmts.dailyRange.all({ from, to }) as DailyCompletion[];
    },

    transaction<T>(fn: () => T): T {
      return db.transaction(fn)();
    },
  };
}
