import type { LanguageDisplay, ReviewItem, TextFields } from '@torah/core';
import { fmt, useText } from '../strings';
import { UnitText } from './UnitText';

export interface CardUnit extends TextFields {
  id: string;
  title?: string;
  typeLabel?: string;
  commentary?: string;
  kavannahPrompt?: string;
  source?: string;
  estimatedMinutes?: number;
  reviewItems?: ReviewItem[];
}

export function UnitCard({ unit, display, children }: { unit: CardUnit; display: LanguageDisplay; children?: React.ReactNode }) {
  const { strings } = useText();
  return (
    <article className="card" data-testid="unit-card" data-unit-id={unit.id}>
      <header className="card-head">
        {unit.typeLabel && <span className="badge">{unit.typeLabel}</span>}
        {unit.estimatedMinutes !== undefined && (
          <span className="minutes">{fmt(strings.study.minutes, { n: unit.estimatedMinutes })}</span>
        )}
      </header>
      {unit.title && <h2 className="card-title">{unit.title}</h2>}
      <UnitText unit={unit} display={display} />
      {unit.commentary && (
        <section className="commentary">
          <h3>{strings.study.commentary}</h3>
          <p>{unit.commentary}</p>
        </section>
      )}
      {unit.kavannahPrompt && (
        <section className="kavannah">
          <h3>{strings.study.kavannah}</h3>
          <p>{unit.kavannahPrompt}</p>
        </section>
      )}
      {unit.reviewItems && unit.reviewItems.length > 0 && (
        <details className="review">
          <summary>{strings.study.reviewPrompt}</summary>
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
      {unit.source && (
        <footer className="source">
          {strings.study.source}: {unit.source}
        </footer>
      )}
      {children}
    </article>
  );
}
