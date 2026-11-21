import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildExamples } from './examples';

describe('docs/examples', () => {
  it.each(Object.entries(buildExamples()))('%s matches generator output (run: npx tsx scripts/generate-examples.ts)', (file, data) => {
    const onDisk = JSON.parse(readFileSync(join(__dirname, '..', '..', '..', 'docs', 'examples', file), 'utf-8'));
    expect(onDisk).toEqual(JSON.parse(JSON.stringify(data)));
  });
});
