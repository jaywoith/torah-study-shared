import { useCallback, useEffect, useState } from 'react';
import type { LanguageDisplay, PathOutlineResponse, PathOutlineSection, ProgressPath } from '@torah/core';
import { api } from '../api';
import { fmt, useText } from '../strings';
import { useFocus } from '../focus';
import { Icon } from '../components/Icon';
import { Reader, type ReaderUnit } from '../components/Reader';

/** What a sequential path endpoint returns (Siddur or Musar). */
export interface PathNext {
  unit: ReaderUnit;
  display: LanguageDisplay;
  position: number;
  total: number;
  completedCount: number;
}

export interface PathLabels {
  heading: string;
  subtitle: string;
  position: string;
  markComplete: string;
  complete: string;
  noInterest: string;
  resetProgress: string;
  resetConfirm: string;
  continue: string;
  unitsDone: string;
  showAll: string;
  showFewer: string;
  backToPath: string;
}

type PathId = Exclude<ProgressPath, 'daily'>;

/**
 * A sequential path. The overview shows overall and per-section progress and a
 * "Continue" card; continuing opens the reader on the next unit, where "Mark
 * complete" records it on the server and moves on. `fetchNext` resolves to null
 * when the path is finished.
 */
export function PathScreen({
  path,
  hasInterest,
  fetchNext,
  title,
  overline,
  labels,
}: {
  path: PathId;
  hasInterest: boolean;
  fetchNext: () => Promise<PathNext | null>;
  title: (next: PathNext) => string | undefined;
  overline: (next: PathNext, outline: PathOutlineResponse | null) => string;
  labels: PathLabels;
}) {
  const { strings } = useText();
  const { setFocus } = useFocus();
  const [next, setNext] = useState<PathNext | null | undefined>(undefined);
  const [outline, setOutline] = useState<PathOutlineResponse | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(null);
    // The outline is optional (section progress); the next unit is required.
    api.outline(path).then(setOutline, () => setOutline(null));
    return fetchNext()
      .then(setNext)
      .catch(() => setError(strings.common.errorGeneric));
  }, [fetchNext, path, strings]);

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

  if (!hasInterest) return <p className="muted empty">{labels.noInterest}</p>;

  const completedCount = outline?.completedCount ?? next?.completedCount ?? 0;
  const total = outline?.total ?? next?.total ?? 0;
  const anyCompleted = next === null || completedCount > 0;
  const back = () => {
    setReading(false);
    setFocus(false);
  };

  if (reading && next) {
    return (
      <div className="path-reading">
        <Reader
          key={next.unit.id}
          unit={{ ...next.unit, title: title(next) }}
          display={next.display}
          overline={overline(next, outline)}
          meta={
            <span data-testid={`${path}-position`}>{fmt(labels.position, { position: next.position, total: next.total })}</span>
          }
          progress={next.total ? next.completedCount / next.total : undefined}
          onBack={back}
          backLabel={labels.backToPath}
          backOnWide
          actions={
            <button
              type="button"
              className="btn primary block"
              disabled={busy}
              onClick={() => act(() => api.complete({ path, unitId: next.unit.id }))}
            >
              <Icon name="check" size={18} strokeWidth={2.5} />
              {labels.markComplete}
            </button>
          }
        />
        {error && <p className="error" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <section className="path" aria-labelledby={`${path}-heading`}>
      <div className="path-top">
        <div className="screen-head">
          <div>
            <span className="overline">{labels.subtitle}</span>
            <h1 id={`${path}-heading`}>{labels.heading}</h1>
            {total > 0 && (
              <div className="bar-row">
                <progress value={completedCount} max={total} aria-label={strings.common.progress} />
                <span className="muted small">{fmt(labels.unitsDone, { done: completedCount, total })}</span>
              </div>
            )}
          </div>
        </div>

        {error && <p className="error" role="alert">{error}</p>}
        {next === undefined && !error && <p className="muted">{strings.common.loading}</p>}
        {next === null && (
          <p className="complete-note" data-testid={`${path}-complete`}>
            {labels.complete}
          </p>
        )}
        {next && (
          <button type="button" className="continue-card" onClick={() => setReading(true)}>
            <span className="continue-text">
              <span className="overline">
                <span data-testid={`${path}-position`}>{fmt(labels.continue, { position: next.position, total: next.total })}</span>
              </span>
              <span className="continue-title">{title(next)}</span>
              <span className="continue-meta">
                {overline(next, outline)}
                {next.unit.estimatedMinutes !== undefined && ` · ${fmt(strings.study.minutes, { n: next.unit.estimatedMinutes })}`}
              </span>
            </span>
            <span className="continue-arrow">
              <Icon name="arrow" size={20} strokeWidth={2} />
            </span>
          </button>
        )}
      </div>

      {outline && (
        <div className="sections">
          {outline.sections.map((s) => (
            <SectionCard
              key={s.name}
              section={s}
              nextUnitId={outline.nextUnitId}
              defaultOpen={outline.sections.length <= 4 || s.units.some((u) => u.id === outline.nextUnitId)}
              labels={labels}
            />
          ))}
        </div>
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

const PREVIEW_ROWS = 7;

function SectionCard({
  section,
  nextUnitId,
  defaultOpen,
  labels,
}: {
  section: PathOutlineSection;
  nextUnitId: string | null;
  defaultOpen: boolean;
  labels: PathLabels;
}) {
  const { strings } = useText();
  const [open, setOpen] = useState(defaultOpen);
  const [all, setAll] = useState(false);
  const n = section.units.length;
  // Show a window around the next unit so it is visible without expanding.
  const nextIdx = section.units.findIndex((u) => u.id === nextUnitId);
  const start = all || n <= PREVIEW_ROWS ? 0 : Math.max(0, Math.min(n - PREVIEW_ROWS, nextIdx - 3));
  const shown = all ? section.units : section.units.slice(start, start + PREVIEW_ROWS);
  const pct = n ? (section.completedCount / n) * 100 : 0;
  const listId = `sec-${section.name.replace(/\W+/g, '-')}`;

  return (
    <section className="section-card">
      <button type="button" className="section-head" aria-expanded={open} aria-controls={listId} onClick={() => setOpen((o) => !o)}>
        <span className="section-info">
          <span className="section-name-row">
            <span className="section-name">{section.name}</span>
            <span className="muted small">
              {section.completedCount} / {n}
            </span>
          </span>
          <span className="mini-bar" aria-hidden="true">
            <span style={{ width: `${pct}%` }} />
          </span>
        </span>
        <span className={open ? 'chev open' : 'chev'}>
          <Icon name="down" size={18} />
        </span>
      </button>
      {open && (
        <>
          <ol className="unit-list" id={listId}>
            {shown.map((u) => {
              const isNext = u.id === nextUnitId;
              return (
                <li key={u.id} className={u.completed ? 'is-done' : isNext ? 'is-next' : undefined}>
                  <span className="unit-mark">
                    {u.completed ? (
                      <Icon name="check" size={16} strokeWidth={2.5} label={strings.study.done} />
                    ) : (
                      <span className="unit-dot" aria-hidden="true" />
                    )}
                  </span>
                  <span className="unit-title">{u.title}</span>
                  {u.estimatedMinutes !== undefined && (
                    <span className="unit-min">{fmt(strings.study.minutes, { n: u.estimatedMinutes })}</span>
                  )}
                </li>
              );
            })}
          </ol>
          {n > PREVIEW_ROWS && (
            <button type="button" className="btn soft small-btn" onClick={() => setAll((a) => !a)}>
              {all ? labels.showFewer : fmt(labels.showAll, { n })}
            </button>
          )}
        </>
      )}
    </section>
  );
}
