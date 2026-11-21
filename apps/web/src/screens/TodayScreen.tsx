import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DailyStudyResponse, StudyUnit, UserProfile } from '@torah/core';
import { api } from '../api';
import { addDays, formatLongDate, toLocalISODate, weekOf, weekdayShort } from '../dates';
import { fmt, useText } from '../strings';
import { useFocus } from '../focus';
import { useMediaQuery, WIDE_QUERY } from '../prefs';
import { Icon } from '../components/Icon';
import { ProgressRing } from '../components/ProgressRing';
import { Reader } from '../components/Reader';

/** Keys typed into form fields never trigger shortcuts. */
const isTyping = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement | null;
  return !!t && (t.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(t.tagName));
};

export function TodayScreen({ profile }: { profile: UserProfile }) {
  const { strings } = useText();
  const { focus, setFocus } = useFocus();
  const wide = useMediaQuery(WIDE_QUERY);
  const today = toLocalISODate(new Date());
  const [date, setDate] = useState(today);
  const [data, setData] = useState<DailyStudyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [studiedDays, setStudiedDays] = useState<Set<string>>(new Set());
  /** The unit open in the reader (narrow screens: null shows the plan). */
  const [openId, setOpenId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const week = useMemo(() => weekOf(date), [date]);
  const rangeFrom = week[0] < addDays(date, -6) ? week[0] : addDays(date, -6);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setOpenId(null);
    Promise.all([api.dailyStudy(profile, date), api.progress(rangeFrom, week[6])])
      .then(([d, p]) => {
        if (cancelled) return;
        setData(d);
        setDone(new Set(p.daily.filter((c) => c.date === date).map((c) => c.unitId)));
        setStudiedDays(new Set(p.daily.map((c) => c.date)));
      })
      .catch(() => !cancelled && setError(strings.common.errorGeneric));
    return () => {
      cancelled = true;
    };
  }, [profile, date, rangeFrom, week, strings]);

  const study = data?.study;
  const units = study?.units ?? [];
  const firstOpen = units.find((u) => !done.has(u.contentId));
  const allDone = units.length > 0 && !firstOpen;
  const selected: StudyUnit | undefined =
    units.find((u) => u.contentId === openId) ?? (wide ? firstOpen ?? units[0] : undefined);
  const nextAfter = (id: string) => units.find((u) => u.contentId !== id && !done.has(u.contentId));

  const toggleDone = useCallback(
    async (contentId: string) => {
      const wasDone = done.has(contentId);
      const flip = (s: Set<string>) => {
        const n = new Set(s);
        if (n.has(contentId)) n.delete(contentId);
        else n.add(contentId);
        return n;
      };
      setDone(flip); // optimistic
      setStudiedDays((s) => new Set(s).add(date));
      try {
        const body = { path: 'daily' as const, unitId: contentId, date };
        await (wasDone ? api.uncomplete(body) : api.complete(body));
      } catch {
        setDone(flip); // revert
        setError(strings.common.errorGeneric);
      }
    },
    [done, date, strings]
  );

  /** Mark done, then open the next unfinished unit (or return to the plan). */
  const doneAndNext = (u: StudyUnit) => {
    const next = nextAfter(u.contentId);
    toggleDone(u.contentId);
    setOpenId(next ? next.contentId : null);
    if (!next) setFocus(false);
    (document.scrollingElement ?? document.documentElement).scrollTop = 0;
  };

  // Keyboard shortcuts (desktop): ← → day, D done, F focus, Esc back.
  const keyState = useRef({ selected, toggleDone, focus });
  keyState.current = { selected, toggleDone, focus };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      const s = keyState.current;
      if (e.key === 'ArrowLeft') setDate((d) => addDays(d, -1));
      else if (e.key === 'ArrowRight') setDate((d) => addDays(d, 1));
      else if ((e.key === 'd' || e.key === 'D') && s.selected) s.toggleDone(s.selected.contentId);
      else if ((e.key === 'f' || e.key === 'F') && s.selected) setFocus(!s.focus);
      else if (e.key === 'Escape') {
        if (s.focus) setFocus(false);
        else setOpenId(null);
      } else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setFocus]);

  const typeLabel = (u: StudyUnit) => strings.options.unitTypes[u.type];
  const titleOf = (u: StudyUnit) => u.title ?? typeLabel(u);
  const doneCount = units.filter((u) => done.has(u.contentId)).length;
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(date, i - 6)).filter((d) => studiedDays.has(d)).length;

  const plan = (
    <section className="plan" aria-labelledby="today-heading">
      <div className="screen-head">
        <div>
          <span className="overline" data-testid="study-date">
            {formatLongDate(date)}
          </span>
          <h1 id="today-heading">{strings.study.todaysLearning}</h1>
        </div>
        {study && <ProgressRing done={doneCount} total={units.length} />}
      </div>

      <div className="day-nav">
        <button type="button" className="round-btn" onClick={() => setDate(addDays(date, -1))} aria-label={strings.study.previousDay}>
          <Icon name="left" size={18} strokeWidth={2} />
        </button>
        <ol className="week" aria-label={fmt(strings.study.daysStudied, { n: last7 })}>
          {week.map((d) => (
            <li key={d}>
              <button
                type="button"
                className="day"
                aria-current={d === date ? 'date' : undefined}
                aria-label={formatLongDate(d)}
                onClick={() => setDate(d)}
              >
                <span className="dow">{weekdayShort(d)}</span>
                <span className="dom">{Number(d.slice(8))}</span>
                <span className={studiedDays.has(d) ? 'dot on' : 'dot'} />
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className="round-btn" onClick={() => setDate(addDays(date, 1))} aria-label={strings.study.nextDay}>
          <Icon name="right" size={18} strokeWidth={2} />
        </button>
      </div>
      <div className="day-tools">
        <button type="button" className="chip-btn" onClick={() => setPicking(true)}>
          <Icon name="calendar" size={16} />
          {strings.study.pickDate}
        </button>
        {date !== today && (
          <button type="button" className="chip-btn" onClick={() => setDate(today)}>
            {strings.study.today}
          </button>
        )}
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {!study && !error && <p className="muted">{strings.common.loading}</p>}

      {study && (
        <>
          <p className="muted summary">
            {fmt(strings.study.sessionSummary, { n: study.totalEstimatedMinutes, budget: study.budgetMinutes })}
            {' · '}
            <span data-testid="done-summary">{fmt(strings.study.doneSummary, { done: doneCount, total: units.length })}</span>
          </p>

          {allDone ? (
            <div className="complete-card" data-testid="day-complete">
              <ProgressRing done={1} total={1} size={72} />
              <h2>{strings.study.dayComplete}</h2>
              <p className="muted">
                {fmt(strings.study.dayCompleteSummary, { n: units.length, minutes: study.totalEstimatedMinutes })}
                {' · '}
                {fmt(strings.study.daysStudied, { n: last7 })}
              </p>
              {profile.interests.includes('musar') && (
                <a className="btn primary" href="#/musar">
                  {strings.study.continueMusar}
                </a>
              )}
            </div>
          ) : (
            firstOpen && (
              <div className="upnext-card narrow-only">
                <div className="upnext-top">
                  <span className="overline accent">
                    {strings.study.upNext} · {typeLabel(firstOpen)}
                  </span>
                  {firstOpen.estimatedMinutes !== undefined && (
                    <span className="muted small">{fmt(strings.study.minutes, { n: firstOpen.estimatedMinutes })}</span>
                  )}
                </div>
                <h2 className="upnext-title">{titleOf(firstOpen)}</h2>
                {firstOpen.hebrew ? (
                  <p className="hebrew preview" lang="he" dir="rtl">
                    {firstOpen.hebrew}
                  </p>
                ) : (
                  firstOpen.english && <p className="english preview">{firstOpen.english}</p>
                )}
                <button type="button" className="btn primary block" onClick={() => setOpenId(firstOpen.contentId)}>
                  {strings.study.continueReading}
                  <Icon name="arrow" size={18} strokeWidth={2} />
                </button>
              </div>
            )
          )}

          <h2 className="section-label">{strings.study.plan}</h2>
          <ul className="plan-list">
            {units.map((u) => {
              const isDone = done.has(u.contentId);
              const isSel = selected?.contentId === u.contentId;
              return (
                <li
                  key={u.id}
                  className={`plan-row${isDone ? ' is-done' : ''}${isSel ? ' is-selected' : ''}`}
                  data-testid="unit-card"
                  data-unit-id={u.id}
                  data-done={isDone ? 'true' : undefined}
                >
                  <button
                    type="button"
                    className={isDone ? 'status is-done' : u === firstOpen ? 'status is-next' : 'status'}
                    aria-pressed={isDone}
                    aria-label={isDone ? strings.study.done : strings.study.markDone}
                    onClick={() => toggleDone(u.contentId)}
                  >
                    {isDone ? <Icon name="check" size={15} strokeWidth={2.5} /> : <span className="status-dot" />}
                  </button>
                  <button type="button" className="row-main" aria-current={isSel ? 'true' : undefined} onClick={() => setOpenId(u.contentId)}>
                    <span className="row-meta">
                      {typeLabel(u)}
                      {u.estimatedMinutes !== undefined && ` · ${fmt(strings.study.minutes, { n: u.estimatedMinutes })}`}
                      {isSel && wide && ` · ${strings.study.reading}`}
                    </span>
                    <span className="row-title">{titleOf(u)}</span>
                  </button>
                  <Icon name="right" size={18} />
                </li>
              );
            })}
          </ul>
          <p className="kbd-hint wide-only">{strings.study.keyboardHint}</p>
        </>
      )}

      {picking && (
        <DatePickerSheet
          date={date}
          onPick={(d) => {
            setDate(d);
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </section>
  );

  const reader =
    study && selected ? (
      <section className="reader-pane" aria-label={titleOf(selected)}>
        <Reader
          key={selected.id}
          unit={{ ...selected, title: titleOf(selected) }}
          display={study.display}
          overline={typeLabel(selected)}
          meta={
            <>
              {fmt(strings.study.ofToday, { position: units.indexOf(selected) + 1, total: units.length })}
              {selected.estimatedMinutes !== undefined && ` · ${fmt(strings.study.minutes, { n: selected.estimatedMinutes })}`}
            </>
          }
          progress={units.length ? doneCount / units.length : undefined}
          onBack={() => setOpenId(null)}
          backLabel={strings.study.backToToday}
          actions={
            done.has(selected.contentId) ? (
              <button type="button" className="btn soft block" aria-pressed="true" onClick={() => toggleDone(selected.contentId)}>
                <Icon name="check" size={18} strokeWidth={2.5} />
                {strings.study.done}
              </button>
            ) : !wide && nextAfter(selected.contentId) ? (
              <button type="button" className="btn primary block" onClick={() => doneAndNext(selected)}>
                <Icon name="check" size={18} strokeWidth={2.5} />
                {fmt(strings.study.markDoneNext, { title: typeLabel(nextAfter(selected.contentId)!) })}
              </button>
            ) : (
              <button type="button" className="btn primary block" onClick={() => (wide ? toggleDone(selected.contentId) : doneAndNext(selected))}>
                <Icon name="check" size={18} strokeWidth={2.5} />
                {strings.study.markDone}
              </button>
            )
          }
        />
      </section>
    ) : null;

  return (
    <div className="today" data-reading={selected && !wide ? 'true' : 'false'}>
      {plan}
      {reader}
    </div>
  );
}

/** A sheet (modal dialog) with the native date input, instead of an inline date field. */
function DatePickerSheet({ date, onPick, onClose }: { date: string; onPick: (d: string) => void; onClose: () => void }) {
  const { strings } = useText();
  const ref = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState(date);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open && typeof d.showModal === 'function') d.showModal();
  }, []);
  return (
    <dialog ref={ref} className="sheet" onClose={onClose} aria-labelledby="pick-date-title">
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          if (value) onPick(value);
        }}
      >
        <div className="sheet-head">
          <h2 id="pick-date-title">{strings.study.pickDate}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={strings.study.close}>
            <Icon name="close" size={20} />
          </button>
        </div>
        <input type="date" value={value} onChange={(e) => setValue(e.target.value)} aria-label={strings.study.chooseDate} autoFocus />
        <div className="sheet-actions">
          <button type="button" className="btn soft" onClick={() => onPick(toLocalISODate(new Date()))}>
            {strings.study.today}
          </button>
          <button type="submit" className="btn primary">
            {strings.common.done}
          </button>
        </div>
      </form>
    </dialog>
  );
}
