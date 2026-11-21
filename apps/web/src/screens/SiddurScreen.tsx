import { useCallback, useEffect, useState } from 'react';
import type { SiddurNextResponse, UserProfile } from '@torah/core';
import { api } from '../api';
import { fmt, useText } from '../strings';
import { UnitCard } from '../components/UnitCard';

const SIDDUR_INTERESTS = ['siddur', 'kavannah', 'prayerbook_hebrew'];

export function SiddurScreen({ profile }: { profile: UserProfile }) {
  const { strings } = useText();
  const [next, setNext] = useState<SiddurNextResponse | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hasInterest = profile.interests.some((i) => SIDDUR_INTERESTS.includes(i));

  const load = useCallback(() => {
    setError(null);
    return api
      .siddurNext(profile)
      .then(setNext)
      .catch(() => setError(strings.common.errorGeneric));
  }, [profile, strings]);

  useEffect(() => {
    if (hasInterest) load();
  }, [hasInterest, load]);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await load();
    } catch {
      setError(strings.common.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  if (!hasInterest) return <p className="muted">{strings.siddur.noInterest}</p>;

  const anyCompleted = next === null || (next?.completedCount ?? 0) > 0;

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
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={() => act(() => api.complete({ path: 'siddur', unitId: next.unit.id }))}
            >
              {strings.siddur.markComplete}
            </button>
          </UnitCard>
        </>
      )}
      {anyCompleted && (
        <button
          type="button"
          className="link danger"
          disabled={busy}
          onClick={() => window.confirm(strings.siddur.resetConfirm) && act(() => api.resetPath('siddur'))}
        >
          {strings.siddur.resetProgress}
        </button>
      )}
    </section>
  );
}
