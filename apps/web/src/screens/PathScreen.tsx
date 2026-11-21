import { useCallback, useEffect, useState } from 'react';
import type { LanguageDisplay, ProgressPath, TextFields } from '@torah/core';
import { api } from '../api';
import { fmt, useText } from '../strings';
import { UnitCard } from '../components/UnitCard';

/** What a sequential path endpoint returns (Siddur or Musar). */
export interface PathNext {
  unit: TextFields & { id: string; commentary?: string; kavannahPrompt?: string; source?: string; estimatedMinutes?: number };
  display: LanguageDisplay;
  position: number;
  total: number;
  completedCount: number;
}

export interface PathLabels {
  heading: string;
  position: string;
  markComplete: string;
  complete: string;
  noInterest: string;
  resetProgress: string;
  resetConfirm: string;
}

/**
 * A sequential path: shows the next unit, "Unit n of N", mark complete, reset.
 * `fetchNext` resolves to null when the path is finished.
 */
export function PathScreen({
  path,
  hasInterest,
  fetchNext,
  title,
  labels,
}: {
  path: Exclude<ProgressPath, 'daily'>;
  hasInterest: boolean;
  fetchNext: () => Promise<PathNext | null>;
  title: (next: PathNext) => string | undefined;
  labels: PathLabels;
}) {
  const { strings } = useText();
  const [next, setNext] = useState<PathNext | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(null);
    return fetchNext()
      .then(setNext)
      .catch(() => setError(strings.common.errorGeneric));
  }, [fetchNext, strings]);

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

  if (!hasInterest) return <p className="muted">{labels.noInterest}</p>;

  const anyCompleted = next === null || (next?.completedCount ?? 0) > 0;

  return (
    <section aria-labelledby={`${path}-heading`}>
      <h1 id={`${path}-heading`}>{labels.heading}</h1>
      {error && <p className="error" role="alert">{error}</p>}
      {next === undefined && !error && <p className="muted">{strings.common.loading}</p>}
      {next === null && <p data-testid={`${path}-complete`}>{labels.complete}</p>}
      {next && (
        <>
          <p className="muted" data-testid={`${path}-position`}>
            {fmt(labels.position, { position: next.position, total: next.total })}
          </p>
          <progress value={next.completedCount} max={next.total} aria-label={strings.common.progress} />
          <UnitCard unit={{ ...next.unit, title: title(next) }} display={next.display}>
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={() => act(() => api.complete({ path, unitId: next.unit.id }))}
            >
              {labels.markComplete}
            </button>
          </UnitCard>
        </>
      )}
      {anyCompleted && (
        <button
          type="button"
          className="link danger"
          disabled={busy}
          onClick={() => window.confirm(labels.resetConfirm) && act(() => api.resetPath(path))}
        >
          {labels.resetProgress}
        </button>
      )}
    </section>
  );
}
