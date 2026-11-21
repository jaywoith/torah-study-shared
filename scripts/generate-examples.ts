/**
 * Regenerates docs/examples/*.json from the real generator and content.
 * Run: npx tsx scripts/generate-examples.ts
 * A test (packages/content/test/examples.test.ts) fails if the files are stale.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildExamples } from '../packages/content/test/examples';

for (const [file, data] of Object.entries(buildExamples())) {
  writeFileSync(join(__dirname, '..', 'docs', 'examples', file), JSON.stringify(data, null, 2) + '\n');
  console.log(`wrote docs/examples/${file}`);
}
