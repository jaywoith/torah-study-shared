import { useState } from 'react';
import type { Interest, UserProfile } from '@torah/core';
import { useText } from '../strings';

export function SettingsScreen({ profile, onSave }: { profile: UserProfile; onSave: (p: UserProfile) => void }) {
  const { strings, options } = useText();
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setSaved(false);
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const toggleInterest = (id: Interest) =>
    set('interests', draft.interests.includes(id) ? draft.interests.filter((i) => i !== id) : [...draft.interests, id]);

  const select = <K extends 'framework' | 'level' | 'studyLength' | 'languageMode'>(
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
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
        setSaved(true);
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
      </div>
      <p className="muted small">{strings.settings.unverifiedNote}</p>
    </form>
  );
}
