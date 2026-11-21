/**
 * Schema migrations. Append only: never edit or reorder a migration that has
 * shipped; add a new one. Each runs once, inside a transaction.
 */
export interface Migration {
  id: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    id: 1,
    name: '001_profile_and_progress',
    sql: `
      -- Single-user app: exactly one profile row (id = 1). data is a JSON UserProfile.
      CREATE TABLE profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- Completed units. path 'siddur': study_date is ''. path 'daily': study_date is YYYY-MM-DD.
      -- unit_id is a stable content-library id.
      CREATE TABLE completed_units (
        path TEXT NOT NULL CHECK (path IN ('siddur', 'daily')),
        unit_id TEXT NOT NULL,
        study_date TEXT NOT NULL DEFAULT '',
        completed_at TEXT NOT NULL,
        PRIMARY KEY (path, unit_id, study_date)
      );
      CREATE INDEX completed_units_daily ON completed_units (path, study_date);
    `,
  },
];
