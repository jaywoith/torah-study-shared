/**
 * npm run content:report — what the content library holds and what still needs work.
 * Add --json for machine-readable output.
 */
import { buildContentReport } from '@torah/core';
import { contentLibrary } from '@torah/content';

const report = buildContentReport(contentLibrary);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const t = report.totals;
  const line = (label: string, n: number | string) => console.log(`  ${label.padEnd(34)} ${n}`);
  console.log('Content report\n');
  line('Entries', t.entries);
  line('  imported from Sefaria', t.imported);
  line('  hand-written', t.handWritten);
  line('Verified by the owner', t.verified);
  line('Unverified', t.unverified);

  console.log('\nBy kind');
  for (const [kind, n] of Object.entries(report.byKind)) line(kind, n);

  console.log('\nText versions');
  for (const s of report.sources) {
    const flags = [
      s.requiresAttribution && 'attribution required',
      s.nonCommercial && 'NON-COMMERCIAL',
      s.personalUseOnly && 'PERSONAL USE ONLY: clear before go-live',
    ].filter(Boolean);
    console.log(`  [${s.language}] ${s.versionTitle} — ${s.license}, ${s.units} entries${flags.length ? ` (${flags.join('; ')})` : ''}`);
  }

  console.log('\nLicensing flags');
  line('Entries using CC-BY-NC versions', report.nonCommercial.length);
  line('Entries with uncleared licenses', report.personalUseOnly.length);
  report.personalUseOnly.forEach((id) => console.log(`    - ${id}`));

  console.log('\nMissing hand-written fields');
  for (const [field, list] of Object.entries(report.missing)) line(field, list.length);
}
