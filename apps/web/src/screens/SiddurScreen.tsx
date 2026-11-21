import { useEffect, useState } from 'react';
import type { SiddurNextResponse, UserProfile } from '@torah/core';
import { api } from '../api';
import { KEYS, readJson, writeJson } from '../storage';
import { fmt, useText } from '../strings';
import { UnitCard } from '../components/UnitCard';

const SIDDUR_INTERESTS = ['siddur', 'kavannah', 'prayerbook_hebrew'];

export function SiddurScreen({ profile }: { profile: UserProfile }) {
  const { strings } = useText();
  const [completed, setCompleted] = useState<string[]>(() => readJson<string[]>(KEYS.siddurCompleted, []));
  const [next, setNext] = useState<SiddurNextResponse | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const hasInterest = profile.interests.some((i) => SIDDUR_INTERESTS.includes(i));

  useEffect(() => {
    if (!hasInterest) return;
    let cancelled = false;
    setError(null);
    api
      .siddurNext(profile, completed)
      .then((n) => !cancelled && setNext(n))
      .catch(() => !cancelled && setError(strings.common.errorGeneric));
    return () => {
      cancelled = true;
    };
  }, [profile, completed, hasInterest, strings]);

  const update = (ids: string[]) => {
    writeJson(KEYS.siddurCompleted, ids);
    setCompleted(ids);
  };

  if (!hasInterest) return <p className="muted">{strings.siddur.noInterest}</p>;

  return (
    <section aria-labelledby="siddur-heading">
      <h1 id="siddur-heading">{strings.common.siddurPath}</h1>
      {error && <p className="error" role="alert">{error}</p>}
      {next === undefined && !error && <p className="muted">{strings.common.loading}</p>}
      {next === null && <p data-testid="siddur-complete">{strings.siddur.complete}</p>}
      {next && (
        <>
          <p className="muted" data-testid="siddur-position">
            {fmt(strings.siddur.position, { position: next.position, total: next.total })}
          </p>
          <progress value={next.completedCount} max={next.total} aria-label={strings.common.progress} />
          <UnitCard
            unit={{ ...next.unit, title: `${next.unit.section} – ${next.unit.blessingOrLine}` }}
            display={next.display}
          >
            <button type="button" className="primary" onClick={() => update([...completed, next.unit.id])}>
              {strings.siddur.markComplete}
            </button>
          </UnitCard>
        </>
      )}
      {completed.length > 0 && (
        <button
          type="button"
          className="link danger"
          onClick={() => window.confirm(strings.siddur.resetConfirm) && update([])}
        >
          {strings.siddur.resetProgress}
        </button>
      )}
    </section>
  );
}
