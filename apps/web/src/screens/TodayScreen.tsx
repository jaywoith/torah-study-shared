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

  useEffect(() => {
    let cancelled = false;
    setError(null);
    api
      .dailyStudy(profile, date)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError(strings.common.errorGeneric));
    return () => {
      cancelled = true;
    };
  }, [profile, date, strings]);

  const study = data?.study;

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
          </p>
          {study.units.map((u) => (
            <UnitCard
              key={u.id}
              unit={{ ...u, typeLabel: strings.options.unitTypes[u.type] }}
              display={study.display}
            />
          ))}
        </>
      )}
    </section>
  );
}
