import { useEffect, useState } from 'react';
import type { DailyStudyResponse, UserProfile } from '@torah/core';
import { api } from '../api';
import { addDays, formatLongDate, toLocalISODate } from '../dates';
import { fmt, useText } from '../strings';
import { UnitCard } from '../components/UnitCard';

export function TodayScreen({ profile }: { profile: UserProfile }) {
  const { strings } = useText();
  const today = toLocalISODate(new Date());
  const [date, setDate] = useState(today);
  const [data, setData] = useState<DailyStudyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([api.dailyStudy(profile, date), api.progress(date, date)])
      .then(([d, p]) => {
        if (cancelled) return;
        setData(d);
        setDone(new Set(p.daily.map((c) => c.unitId)));
      })
      .catch(() => !cancelled && setError(strings.common.errorGeneric));
    return () => {
      cancelled = true;
    };
  }, [profile, date, strings]);

  const study = data?.study;

  const toggleDone = async (contentId: string) => {
    const wasDone = done.has(contentId);
    const flip = (s: Set<string>) => {
      const n = new Set(s);
      if (n.has(contentId)) n.delete(contentId);
      else n.add(contentId);
      return n;
    };
    setDone(flip); // optimistic
    try {
      const body = { path: 'daily' as const, unitId: contentId, date };
      await (wasDone ? api.uncomplete(body) : api.complete(body));
    } catch {
      setDone(flip); // revert
      setError(strings.common.errorGeneric);
    }
  };

  return (
    <section aria-labelledby="today-heading">
      <div className="date-bar">
        <button type="button" onClick={() => setDate(addDays(date, -1))} aria-label={strings.study.previousDay}>
          ‹
        </button>
        <div className="date-center">
          <h1 id="today-heading" data-testid="study-date">
            {formatLongDate(date)}
          </h1>
          <div className="date-controls">
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              aria-label={strings.study.chooseDate}
            />
            {date !== today && (
              <button type="button" className="link" onClick={() => setDate(today)}>
                {strings.study.today}
              </button>
            )}
          </div>
        </div>
        <button type="button" onClick={() => setDate(addDays(date, 1))} aria-label={strings.study.nextDay}>
          ›
        </button>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {!study && !error && <p className="muted">{strings.common.loading}</p>}

      {study && (
        <>
          <p className="muted summary">
            {fmt(strings.study.sessionSummary, { n: study.totalEstimatedMinutes, budget: study.budgetMinutes })}
            {' · '}
            <span data-testid="done-summary">
              {fmt(strings.study.doneSummary, {
                done: study.units.filter((u) => done.has(u.contentId)).length,
                total: study.units.length,
              })}
            </span>
          </p>
          {study.units.map((u) => {
            const isDone = done.has(u.contentId);
            return (
              <UnitCard
                key={u.id}
                unit={{ ...u, typeLabel: strings.options.unitTypes[u.type] }}
                display={study.display}
                done={isDone}
              >
                <button
                  type="button"
                  className={isDone ? 'done-toggle is-done' : 'done-toggle'}
                  aria-pressed={isDone}
                  onClick={() => toggleDone(u.contentId)}
                >
                  {isDone ? `✓ ${strings.study.done}` : strings.study.markDone}
                </button>
              </UnitCard>
            );
          })}
        </>
      )}
    </section>
  );
}
