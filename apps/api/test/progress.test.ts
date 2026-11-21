import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { testApp } from './helpers';

const profile = {
  framework: 'masorti_conservative',
  level: 'intermediate',
  interests: ['siddur', 'musar'],
  studyLength: 'medium',
  languageMode: 'mixed',
};

describe('/v1/profile', () => {
  it('is null until saved, then returns the saved profile', async () => {
    const { app } = testApp();
    expect((await request(app).get('/v1/profile')).body).toEqual({ profile: null });
    const put = await request(app).put('/v1/profile').send(profile);
    expect(put.status).toBe(200);
    // Display settings added in v0.5 are filled with defaults when omitted.
    const saved = { ...profile, showCantillation: false, divineName: 'abbreviated' };
    expect(put.body).toEqual({ profile: saved });
    expect((await request(app).get('/v1/profile')).body).toEqual({ profile: saved });
  });

  it('rejects an invalid profile', async () => {
    const { app } = testApp();
    const res = await request(app).put('/v1/profile').send({ ...profile, level: 'expert' });
    expect(res.status).toBe(400);
    expect(res.body.issues[0]).toMatch(/level/);
  });
});

describe('/v1/progress', () => {
  it('records Siddur completion and /v1/siddur/next reads it from the database', async () => {
    const { app } = testApp();
    expect((await request(app).get('/v1/siddur/next')).body.unit.id).toBe('baruch_sheamar');
    const res = await request(app).post('/v1/progress/complete').send({ path: 'siddur', unitId: 'baruch_sheamar' });
    expect(res.status).toBe(201);
    const next = await request(app).get('/v1/siddur/next');
    expect(next.body.unit.id).toBe('ashrei_opening');
    expect(next.body.completedCount).toBe(1);
    expect((await request(app).get('/v1/progress')).body.siddur.completed).toEqual(['baruch_sheamar']);
  });

  it('an explicit completed= parameter still overrides the database', async () => {
    const { app } = testApp();
    await request(app).post('/v1/progress/complete').send({ path: 'siddur', unitId: 'baruch_sheamar' });
    expect((await request(app).get('/v1/siddur/next?completed=')).body.unit.id).toBe('baruch_sheamar');
  });

  it('records, lists by date range, and removes daily completions', async () => {
    const { app } = testApp();
    const body = { path: 'daily', unitId: 'musar-avot-1-2', date: '2026-11-21' };
    await request(app).post('/v1/progress/complete').send(body);
    await request(app).post('/v1/progress/complete').send({ ...body, date: '2026-11-25' });
    const res = await request(app).get('/v1/progress?from=2026-11-21&to=2026-11-21');
    expect(res.body.daily).toHaveLength(1);
    expect(res.body.daily[0]).toMatchObject({ date: '2026-11-21', unitId: 'musar-avot-1-2' });

    await request(app).delete('/v1/progress/complete').send(body);
    expect((await request(app).get('/v1/progress?from=2026-11-21&to=2026-11-21')).body.daily).toEqual([]);
  });

  it('accepts Siddur unit ids as daily units (the daily Siddur slot)', async () => {
    const { app } = testApp();
    const res = await request(app)
      .post('/v1/progress/complete')
      .send({ path: 'daily', unitId: 'baruch_sheamar', date: '2026-11-21' });
    expect(res.status).toBe(201);
  });

  it('validates path, unit id and date', async () => {
    const { app } = testApp();
    const bad = [
      { path: 'other', unitId: 'baruch_sheamar' },
      { path: 'siddur', unitId: 'not-a-unit' },
      { path: 'siddur', unitId: 'musar-avot-1-2' }, // exists, but not a Siddur unit
      { path: 'daily', unitId: 'musar-avot-1-2' }, // missing date
      { path: 'daily', unitId: 'musar-avot-1-2', date: '21/11/2026' },
    ];
    for (const b of bad) expect((await request(app).post('/v1/progress/complete').send(b)).status).toBe(400);
    expect((await request(app).get('/v1/progress?from=yesterday')).status).toBe(400);
  });

  it('resets the Siddur path', async () => {
    const { app } = testApp();
    await request(app).post('/v1/progress/complete').send({ path: 'siddur', unitId: 'baruch_sheamar' });
    const res = await request(app).post('/v1/progress/reset').send({ path: 'siddur' });
    expect(res.body).toEqual({ ok: true, removed: 1 });
    expect((await request(app).get('/v1/siddur/next')).body.position).toBe(1);
  });

  it('imports browser data once: profile only if none saved, known Siddur ids only, no duplicates', async () => {
    const { app } = testApp();
    const first = await request(app)
      .post('/v1/progress/import')
      .send({ profile, siddurCompleted: ['baruch_sheamar', 'bogus'] });
    expect(first.body).toEqual({ importedProfile: true, importedSiddur: 1 });

    const second = await request(app)
      .post('/v1/progress/import')
      .send({ profile: { ...profile, level: 'scholar' }, siddurCompleted: ['baruch_sheamar'] });
    expect(second.body).toEqual({ importedProfile: false, importedSiddur: 0 });
    expect((await request(app).get('/v1/profile')).body.profile.level).toBe('intermediate');
  });
});
