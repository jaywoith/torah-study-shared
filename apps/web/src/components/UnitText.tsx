import type { LanguageDisplay, TextFields } from '@torah/core';
import { interleave } from '../text';

/**
 * Renders the Hebrew / transliteration / English fields according to the
 * language display contract from the API. Only fields present are shown
 * (the API already removed the rest).
 */
export function UnitText({ unit, display }: { unit: TextFields; display: LanguageDisplay }) {
  const hebrew = unit.hebrew ? (
    <p className="hebrew" lang="he" dir="rtl">
      {unit.hebrew}
    </p>
  ) : null;
  const translit = unit.transliteration ? <p className="translit">{unit.transliteration}</p> : null;
  const english = unit.english ? <p className="english">{unit.english}</p> : null;

  if (display.layout === 'side-by-side' && unit.hebrew && unit.english) {
    // Row by row when the sentences line up, otherwise two whole columns.
    const rows = interleave({ hebrew: unit.hebrew, english: unit.english });
    return (
      <div className="text side-by-side" data-layout="side-by-side">
        {(rows ?? [{ hebrew: unit.hebrew, english: unit.english }]).map((row, i) => (
          <div className="sbs-row" key={i}>
            <p className="english">{row.english}</p>
            <p className="hebrew" lang="he" dir="rtl">
              {row.hebrew}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (display.layout === 'interleaved') {
    const lines = interleave({ hebrew: unit.hebrew, transliteration: unit.transliteration, english: unit.english });
    if (lines) {
      return (
        <div className="text interleaved" data-layout="interleaved">
          {lines.map((line, i) => (
            <div className="line" key={i}>
              {line.hebrew && (
                <p className="hebrew" lang="he" dir="rtl">
                  {line.hebrew}
                </p>
              )}
              {line.transliteration && <p className="translit">{line.transliteration}</p>}
              {line.english && <p className="english">{line.english}</p>}
            </div>
          ))}
        </div>
      );
    }
  }

  return (
    <div className="text stacked" data-layout="stacked">
      {hebrew}
      {translit}
      {english}
    </div>
  );
}
