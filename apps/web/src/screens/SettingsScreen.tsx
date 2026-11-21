import { useState } from 'react';
import type { Interest, UserProfile } from '@torah/core';
import { useText } from '../strings';

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

  const select = <K extends 'framework' | 'level' | 'studyLength' | 'languageMode' | 'divineName'>(
    key: K,
    label: string,
    list: { id: string; name: string }[]
  ) => (
    <label className="field">
      <span>{label}</span>
      <select value={draft[key]} onChange={(e) => set(key, e.target.value as UserProfile[K])}>
        {list.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <form
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
      <h1>{strings.settings.title}</h1>
      {select('framework', strings.common.framework, options.frameworks)}
      {select('level', strings.common.learningLevel, options.levels)}
      {select(
        'studyLength',
        strings.common.studyLength,
        options.studyLengths.map((o) => ({ id: o.id, name: `${o.name} (${o.minutes} min)` }))
      )}
      {select('languageMode', strings.common.languageMode, options.languageModes)}

      <fieldset className="field">
        <legend>{strings.common.interests}</legend>
        {options.interests.map((o) => (
          <label key={o.id} className="check">
            <input type="checkbox" checked={draft.interests.includes(o.id)} onChange={() => toggleInterest(o.id)} />
            {o.name}
          </label>
        ))}
      </fieldset>

      <fieldset className="field">
        <legend>{strings.settings.displayTitle}</legend>
        <label className="check">
          <input
            type="checkbox"
            checked={draft.showCantillation ?? false}
            onChange={(e) => set('showCantillation', e.target.checked)}
          />
          {strings.settings.showCantillation}
        </label>
        {select('divineName', strings.settings.divineName, options.divineNames)}
        <p className="muted small">{strings.settings.divineNameHint}</p>
      </fieldset>

      <label className="field">
        <span>{strings.settings.practiceContext}</span>
        <input
          type="text"
          value={draft.practiceContext ?? ''}
          placeholder={strings.settings.practiceContextHint}
          onChange={(e) => set('practiceContext', e.target.value || undefined)}
        />
      </label>

      <div className="actions">
        <button type="submit" className="primary">
          {strings.common.save}
        </button>
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
      </div>
      <p className="muted small">{strings.settings.unverifiedNote}</p>
      {onLogout && (
        <button type="button" className="link" onClick={onLogout}>
          {strings.auth.logout}
        </button>
      )}
    </form>
  );
}
