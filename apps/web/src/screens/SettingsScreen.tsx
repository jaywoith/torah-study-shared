import { useEffect, useState } from 'react';
import type { DailyStudyResponse, Interest, UserProfile } from '@torah/core';
import { api } from '../api';
import { toLocalISODate } from '../dates';
import { isolateHebrew, useText } from '../strings';
import { Icon } from '../components/Icon';
import { UnitText } from '../components/UnitText';

export function SettingsScreen({
  profile,
  onSave,
  onLogout,
}: {
  profile: UserProfile;
  onSave: (p: UserProfile) => Promise<void> | void;
  /** Shown only when the server requires sign-in. */
  onLogout?: () => void;
}) {
  const { strings, options } = useText();
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const set = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setSaved(false);
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const toggleInterest = (id: Interest) =>
    set('interests', draft.interests.includes(id) ? draft.interests.filter((i) => i !== id) : [...draft.interests, id]);

  const select = <K extends 'framework' | 'level' | 'divineName'>(key: K, label: string, list: { id: string; name: string }[]) => (
    <label className="row-field">
      <span>{label}</span>
      <select value={draft[key]} onChange={(e) => set(key, e.target.value as UserProfile[K])}>
        {list.map((o) => (
          <option key={o.id} value={o.id}>
            {isolateHebrew(o.name)}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <form
      className="settings"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(false);
        try {
          await onSave(draft);
          setSaved(true);
        } catch {
          setError(true);
        }
      }}
    >
      <div className="screen-head">
        <h1>{strings.nav.settings}</h1>
      </div>

      <div className="settings-grid">
        <div className="settings-col">
          <h2 className="section-label">{strings.settings.displayTitle}</h2>
          <div className="group">
            <fieldset className="radio-cards">
              <legend>{strings.common.languageMode}</legend>
              {options.languageModes.map((o) => (
                <label key={o.id} className={draft.languageMode === o.id ? 'radio-card is-checked' : 'radio-card'}>
                  <input
                    type="radio"
                    name="languageMode"
                    value={o.id}
                    checked={draft.languageMode === o.id}
                    onChange={() => set('languageMode', o.id)}
                  />
                  <span>{o.name}</span>
                </label>
              ))}
            </fieldset>
            <Preview profile={draft} />
            <label className="row-field switch-row">
              <span>{strings.settings.showCantillation}</span>
              <input
                type="checkbox"
                role="switch"
                checked={draft.showCantillation ?? false}
                onChange={(e) => set('showCantillation', e.target.checked)}
              />
            </label>
            {select('divineName', strings.settings.divineName, options.divineNames)}
            <p className="muted small hint">{strings.settings.divineNameHint}</p>
          </div>
        </div>

        <div className="settings-col">
          <h2 className="section-label">{strings.settings.title}</h2>
          <div className="group">
            {select('framework', strings.common.framework, options.frameworks)}
            {select('level', strings.common.learningLevel, options.levels)}
            <fieldset className="segmented-field">
              <legend>{strings.common.studyLength}</legend>
              <div className="segmented">
                {options.studyLengths.map((o) => (
                  <label key={o.id} className={draft.studyLength === o.id ? 'is-checked' : undefined}>
                    <input
                      type="radio"
                      name="studyLength"
                      value={o.id}
                      checked={draft.studyLength === o.id}
                      onChange={() => set('studyLength', o.id)}
                    />
                    <span>
                      {o.name} · {o.minutes}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="chips-field">
              <legend>{strings.common.interests}</legend>
              <div className="chips">
                {options.interests.map((o) => (
                  <label key={o.id} className={draft.interests.includes(o.id) ? 'chip is-checked' : 'chip'}>
                    <input type="checkbox" checked={draft.interests.includes(o.id)} onChange={() => toggleInterest(o.id)} />
                    {o.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="stack-field">
              <span>{strings.settings.practiceContext}</span>
              <input
                type="text"
                value={draft.practiceContext ?? ''}
                placeholder={strings.settings.practiceContextHint}
                onChange={(e) => set('practiceContext', e.target.value || undefined)}
              />
            </label>
          </div>

          <h2 className="section-label">{strings.settings.aboutTitle}</h2>
          <div className="group">
            <p className="muted small">{strings.settings.unverifiedNote}</p>
            <a className="row-link" href="#/sources">
              <span>{strings.settings.sourcesLink}</span>
              <Icon name="right" size={16} />
            </a>
            {onLogout && (
              <button type="button" className="row-link as-button" onClick={onLogout}>
                <span>{strings.auth.logout}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="save-bar">
        {saved && (
          <span className="muted" role="status">
            {strings.settings.saved}
          </span>
        )}
        {error && (
          <span className="error" role="alert">
            {strings.common.errorGeneric}
          </span>
        )}
        <button type="submit" className="btn primary">
          {strings.common.save}
        </button>
      </div>
    </form>
  );
}

/** Today's first text, rendered by the API in the draft's language mode and display settings. */
function Preview({ profile }: { profile: UserProfile }) {
  const { strings } = useText();
  const [data, setData] = useState<DailyStudyResponse | null>(null);
  const { languageMode, showCantillation, divineName } = profile;

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      api
        .dailyStudy({ ...profile, languageMode, showCantillation, divineName }, toLocalISODate(new Date()))
        .then((d) => !cancelled && setData(d))
        .catch(() => !cancelled && setData(null));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // Only display settings change the preview; the rest of the profile is read at call time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageMode, showCantillation, divineName]);

  const unit = data?.study.units[0];
  if (!unit || !data) return null;
  return (
    <div className="preview-box" aria-label={strings.settings.preview}>
      <span className="overline">
        {strings.settings.preview} · {unit.source ?? unit.title}
      </span>
      <div className="preview-text">
        <UnitText unit={unit} display={data.study.display} />
      </div>
    </div>
  );
}
