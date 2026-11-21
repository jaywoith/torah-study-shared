import { useState } from 'react';
import type { LanguageDisplay, Provenance, ReviewItem, TextFields } from '@torah/core';
import { useText } from '../strings';
import { useFocus } from '../focus';
import { useTextScale } from '../prefs';
import { Icon } from './Icon';
import { UnitText } from './UnitText';

export interface ReaderUnit extends TextFields {
  id: string;
  title?: string;
  commentary?: string;
  kavannahPrompt?: string;
  source?: string;
  estimatedMinutes?: number;
  reviewItems?: ReviewItem[];
  verified?: boolean;
  provenance?: Provenance;
}

/** "Metsudah Siddur, 1981 · CC-BY" for each distinct version the unit's text came from. */
export function attributionOf(p: Provenance | undefined): string[] {
  if (!p) return [];
  const seen = new Set<string>();
  for (const v of [p.hebrew, p.english]) if (v) seen.add(`${v.versionTitle} · ${v.license}`);
  return [...seen];
}

function DraftLabel({ show }: { show: boolean }) {
  const { strings } = useText();
  return show ? <span className="draft-label">{strings.study.draft}</span> : null;
}

/** Text-size control: the "Aa" button opens smaller/larger buttons. Stored per device. */
export function TextSizeControl() {
  const { strings } = useText();
  const { smaller, larger, atMin, atMax } = useTextScale();
  const [open, setOpen] = useState(false);
  return (
    <div className="text-size">
      <button type="button" className="icon-btn aa" aria-label={strings.study.textSize} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Aa
      </button>
      {open && (
        <div className="text-size-pop" role="group" aria-label={strings.study.textSize}>
          <button type="button" onClick={smaller} disabled={atMin} aria-label={strings.study.smaller}>
            <span aria-hidden="true" style={{ fontSize: '0.85em' }}>A</span>
          </button>
          <button type="button" onClick={larger} disabled={atMax} aria-label={strings.study.larger}>
            <span aria-hidden="true" style={{ fontSize: '1.25em' }}>A</span>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * The reading view for one unit: header, text in the profile's language layout,
 * commentary and kavannah (labelled as drafts until verified), attribution, and
 * the caller's actions (mark done / mark complete).
 */
export function Reader({
  unit,
  display,
  overline,
  meta,
  progress,
  onBack,
  backLabel,
  actions,
  testId,
  backOnWide,
}: {
  unit: ReaderUnit;
  display: LanguageDisplay;
  overline?: string;
  /** Small text in the top bar, e.g. "2 of 3 today · 9 min". */
  meta?: React.ReactNode;
  /** 0..1, shown as a thin bar under the top bar. */
  progress?: number;
  /** Shown on narrow screens (and in focus mode on wide ones). */
  onBack?: () => void;
  backLabel?: string;
  actions?: React.ReactNode;
  testId?: string;
  /** Keep the back button on wide screens too (path screens, where there is no side-by-side plan). */
  backOnWide?: boolean;
}) {
  const { strings } = useText();
  const { focus, setFocus } = useFocus();
  const unverified = unit.verified === false;
  const attribution = attributionOf(unit.provenance);

  return (
    <article className="reader" data-testid={testId} data-unit-id={unit.id} aria-labelledby={`reader-title-${unit.id}`}>
      <div className="reader-bar">
        {focus ? (
          <button type="button" className="ghost-btn" onClick={() => setFocus(false)}>
            <Icon name="left" size={18} strokeWidth={2} />
            {strings.study.exitFocus}
          </button>
        ) : (
          onBack && (
            <button type="button" className={backOnWide ? 'icon-btn' : 'icon-btn narrow-only'} onClick={onBack} aria-label={backLabel ?? strings.study.back}>
              <Icon name="left" size={22} strokeWidth={2} />
            </button>
          )
        )}
        <span className="reader-meta">{meta}</span>
        <TextSizeControl />
        {!focus && (
          <button type="button" className="ghost-btn wide-only" onClick={() => setFocus(true)}>
            <Icon name="focus" size={16} />
            {strings.study.focus}
          </button>
        )}
      </div>
      {progress !== undefined && (
        <div className="reader-progress" aria-hidden="true">
          <span style={{ width: `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%` }} />
        </div>
      )}

      <header className="reader-head">
        {overline && <span className="overline accent">{overline}</span>}
        {unit.title && (
          <h2 className="reader-title" id={`reader-title-${unit.id}`}>
            {unit.title}
          </h2>
        )}
      </header>

      <div className="reader-text">
        <UnitText unit={unit} display={display} />
      </div>

      {(unit.commentary || unit.kavannahPrompt) && (
        <div className="panels">
          {unit.commentary && (
            <details className="panel commentary" open>
              <summary>
                <span className="panel-title">{strings.study.commentary}</span>
                <DraftLabel show={unverified} />
                <Icon name="down" size={18} />
              </summary>
              <p>{unit.commentary}</p>
            </details>
          )}
          {unit.kavannahPrompt && (
            <details className="panel kavannah" open>
              <summary>
                <span className="panel-title">{strings.study.kavannah}</span>
                <DraftLabel show={unverified} />
                <Icon name="down" size={18} />
              </summary>
              <p>{unit.kavannahPrompt}</p>
            </details>
          )}
        </div>
      )}

      {unit.reviewItems && unit.reviewItems.length > 0 && (
        <details className="panel review">
          <summary>
            <span className="panel-title">{strings.study.reviewPrompt}</span>
            <Icon name="down" size={18} />
          </summary>
          <ul>
            {unit.reviewItems.map((item, i) => (
              <li key={i}>
                <span lang={/[֐-׿]/.test(item.text) ? 'he' : undefined} dir="auto">
                  {item.text}
                </span>
                {item.expected && (
                  <>
                    {' → '}
                    <span dir="auto">{item.expected}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}

      <footer className="reader-source">
        {unit.source && (
          <span>
            {strings.study.source}: {unit.source}
          </span>
        )}
        {attribution.length > 0 && (
          <span>
            {attribution.join(' · ')} · {strings.study.importedVia}
          </span>
        )}
        {unverified && <span className="unverified">{strings.study.textUnverified}</span>}
      </footer>

      {actions && <div className="reader-actions">{actions}</div>}
    </article>
  );
}
