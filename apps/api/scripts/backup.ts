/**
 * Online backup of the SQLite database (safe while the server is running).
 *   npm run db:backup                 -> backups/torah-study-<timestamp>.db
 *   BACKUP_DIR=/mnt/nas npm run db:backup
 * Keeps the newest BACKUP_KEEP files (default 30) in the backup directory.
 */
import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { REPO_ROOT, databasePath, loadEnvFile } from '../src/config';

async function main() {
  loadEnvFile();
  const source = databasePath();
  if (!existsSync(source)) throw new Error(`No database at ${source}`);
  const dir = resolve(process.env.BACKUP_DIR || join(REPO_ROOT, 'backups'));
  const keep = Number(process.env.BACKUP_KEEP) || 30;
  mkdirSync(dir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = join(dir, `torah-study-${stamp}.db`);
  const db = new Database(source, { readonly: true });
  await db.backup(target);
  db.close();
  console.log(`Backed up ${source} -> ${target}`);

  const old = readdirSync(dir).filter((f) => /^torah-study-.*\.db$/.test(f)).sort().reverse().slice(keep);
  for (const f of old) unlinkSync(join(dir, f));
  if (old.length) console.log(`Removed ${old.length} old backup(s)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
