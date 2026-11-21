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
    return (
      <div className="text side-by-side" data-layout="side-by-side">
        {english}
        {hebrew}
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
