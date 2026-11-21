import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { testApp } from './helpers';
import pkg from '../package.json';

const { app } = testApp();

const profile = {
  framework: 'masorti_conservative',
  level: 'intermediate',
  interests: ['siddur', 'musar', 'kabbalah', 'kavannah'],
  studyLength: 'medium',
  languageMode: 'mixed',
};

describe('GET /health', () => {
  it('reports the package version', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'torah-study-api', version: pkg.version });
  });
});

describe('POST /v1/study/daily', () => {
  it('returns a valid study', async () => {
    const res = await request(app).post('/v1/study/daily').send({ profile, date: '2026-11-11' });
    expect(res.status).toBe(200);
    expect(res.body.validation).toEqual({ valid: true, issues: [] });
    expect(res.body.study.date).toBe('2026-11-11');
    expect(res.body.study.units.length).toBeGreaterThan(0);
  });

  it('defaults the date to today', async () => {
    const res = await request(app).post('/v1/study/daily').send({ profile });
    expect(res.status).toBe(200);
    expect(res.body.study.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('rejects an invalid profile with issues', async () => {
    const res = await request(app).post('/v1/study/daily').send({ profile: { ...profile, level: 'expert' } });
    expect(res.status).toBe(400);
    expect(res.body.issues[0]).toMatch(/level/);
  });

  it('rejects a missing body', async () => {
    const res = await request(app).post('/v1/study/daily');
    expect(res.status).toBe(400);
  });

  it('rejects a malformed date', async () => {
    const res = await request(app).post('/v1/study/daily').send({ profile, date: '11/11/2026' });
    expect(res.status).toBe(400);
  });
});

describe('display settings (ADR-011)', () => {
  const lettersOnly = (t: string) => t.replace(/[\u0591-\u05C7]/g, '');
  const hebrewOf = async (extra: Record<string, unknown>, date: string) => {
    const res = await request(app).post('/v1/study/daily').send({ profile: { ...profile, interests: ['tanakh'], ...extra }, date });
    expect(res.status).toBe(200);
    return res.body.study.units as { hebrew?: string; transliteration?: string }[];
  };
  const dates = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'];

  it('abbreviates the Divine Name and hides cantillation by default', async () => {
    for (const date of dates) {
      for (const u of await hebrewOf({}, date)) {
        if (u.hebrew) expect(lettersOnly(u.hebrew)).not.toMatch(/יהוה/);
        if (u.hebrew) expect(u.hebrew).not.toMatch(/[\u0591-\u05AF]/);
        if (u.transliteration) expect(u.transliteration).not.toMatch(/\bAdonai\b/);
      }
    }
  });

  it('shows the Name as in the source when divineName is full', async () => {
    const all = (await Promise.all(dates.map((d) => hebrewOf({ divineName: 'full' }, d)))).flat();
    expect(all.some((u) => u.hebrew && lettersOnly(u.hebrew).includes('יהוה'))).toBe(true);
  });

  it('echoes the settings in study.profile', async () => {
    const res = await request(app)
      .post('/v1/study/daily')
      .send({ profile: { ...profile, divineName: 'yud_yud', showCantillation: true }, date: '2026-11-11' });
    expect(res.body.study.profile).toMatchObject({ divineName: 'yud_yud', showCantillation: true });
  });

  it('rejects invalid settings', async () => {
    const res = await request(app).post('/v1/study/daily').send({ profile: { ...profile, divineName: 'hashem' } });
    expect(res.status).toBe(400);
    expect((await request(app).get('/v1/siddur/next?divineName=hashem')).status).toBe(400);
    expect((await request(app).get('/v1/siddur/next?showCantillation=yes')).status).toBe(400);
  });

  it('accepts the settings on /v1/siddur/next', async () => {
    const res = await request(app).get('/v1/siddur/next?showCantillation=true&divineName=full');
    expect(res.status).toBe(200);
  });
});

describe('GET /v1/siddur/next', () => {
  it('starts at the first unit', async () => {
    const res = await request(app).get('/v1/siddur/next');
    expect(res.status).toBe(200);
    expect(res.body.unit.id).toBe('baruch_sheamar');
    expect(res.body.position).toBe(1);
  });

  it('advances past completed units', async () => {
    const res = await request(app).get('/v1/siddur/next?completed=baruch_sheamar');
    expect(res.status).toBe(200);
    expect(res.body.unit.id).not.toBe('baruch_sheamar');
    expect(res.body.position).toBe(2);
  });

  it('applies the language mode', async () => {
    const res = await request(app).get('/v1/siddur/next?languageMode=english');
    expect(res.body.unit.hebrew).toBeUndefined();
    expect(res.body.unit.english).toBeTruthy();
  });

  it('rejects unknown interests', async () => {
    const res = await request(app).get('/v1/siddur/next?interests=astrology');
    expect(res.status).toBe(400);
  });

  it('404s without a Siddur interest', async () => {
    const res = await request(app).get('/v1/siddur/next?interests=musar');
    expect(res.status).toBe(404);
  });
});

describe('GET /v1/ui-strings', () => {
  it('serves shared labels', async () => {
    const res = await request(app).get('/v1/ui-strings');
    expect(res.status).toBe(200);
    expect(res.body.common.startDailyStudy).toBe('Start Daily Study');
  });
});

describe('POST /v1/coach/message', () => {
  it('returns persona and constraints', async () => {
    const res = await request(app).post('/v1/coach/message').send({ message: 'How can I improve kavannah?' });
    expect(res.status).toBe(200);
    expect(res.body.persona.name).toBe('Conservative Rabbi Coach');
    expect(res.body.constraints).toContain('Always cite sources.');
  });

  it('rejects unknown frameworks and missing messages', async () => {
    expect((await request(app).post('/v1/coach/message').send({ message: 'x', framework: 'nope' })).status).toBe(400);
    expect((await request(app).post('/v1/coach/message').send({})).status).toBe(400);
  });
});

describe('errors', () => {
  it('404s unknown routes as JSON', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });

  it('does not leak internal error messages (bug: err.message was returned)', async () => {
    const res = await request(app).post('/v1/study/daily').set('Content-Type', 'application/json').send('{bad json');
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(JSON.stringify(res.body)).not.toMatch(/Unexpected token|JSON at position/);
  });
});

describe('GET /v1/options', () => {
  it('lists every profile option with a display name', async () => {
    const res = await request(app).get('/v1/options');
    expect(res.status).toBe(200);
    expect(res.body.frameworks).toHaveLength(5);
    expect(res.body.levels.map((l: { id: string }) => l.id)).toEqual(['beginner', 'intermediate', 'advanced', 'scholar']);
    expect(res.body.studyLengths).toContainEqual({ id: 'medium', name: 'Medium', minutes: 20 });
    expect(res.body.divineNames.map((o: { id: string }) => o.id)).toEqual(['abbreviated', 'full', 'yud_yud']);
    for (const group of Object.values(res.body) as { name: string }[][]) {
      for (const option of group) expect(option.name).toBeTruthy();
    }
  });
});

describe('serving the built web app', () => {
  it('serves index.html at / when webDist exists, and API routes still work', async () => {
    const { mkdtempSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const { createApp } = await import('../src/app');
    const { openDatabase } = await import('../src/db');
    const { authConfig } = await import('./helpers');
    const dir = mkdtempSync(join(tmpdir(), 'web-dist-'));
    writeFileSync(join(dir, 'index.html'), '<!doctype html><title>Torah Study</title>');
    const served = createApp({ db: openDatabase(':memory:'), auth: authConfig(), webDist: dir });
    const res = await request(served).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Torah Study');
    expect((await request(served).get('/health')).body.status).toBe('ok');
  });
});
