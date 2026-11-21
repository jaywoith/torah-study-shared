import { useEffect, useState } from 'react';
import type { SourcesResponse } from '@torah/core';
import { api } from '../api';
import { useText } from '../strings';
import { Icon } from '../components/Icon';

/** Attribution for every text version in use (required by CC-BY / CC-BY-SA). */
export function SourcesScreen() {
  const { strings } = useText();
  const t = strings.sources;
  const [data, setData] = useState<SourcesResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.sources().then(setData, () => setError(true));
  }, []);

  if (error) return <p className="error" role="alert">{strings.common.errorGeneric}</p>;
  if (!data) return <p aria-busy="true">{strings.common.loading}</p>;

  const [before, after] = t.intro.split('{provider}');
  return (
    <section className="sources-page">
      <a className="back-link" href="#/settings">
        <Icon name="left" size={16} strokeWidth={2} />
        {t.back}
      </a>
      <div className="screen-head">
        <h1>{t.title}</h1>
      </div>
      <p className="lede">
        {before}
        <a href={data.provider.url} target="_blank" rel="noreferrer">
          {data.provider.name}
        </a>
        {after}
      </p>
      {(['hebrew', 'english'] as const).map((lang) => (
        <div key={lang}>
          <h2 className="section-label">{t[lang]}</h2>
          <ul className="group sources">
            {data.versions
              .filter((v) => v.language === lang)
              .map((v) => (
                <li key={v.versionTitle}>
                  <strong>{v.versionTitle}</strong> · {v.license} · {t.entries.replace('{n}', String(v.units))}
                  {v.requiresAttribution && <div className="muted small">{t.attribution}</div>}
                  {v.nonCommercial && <div className="muted small">{t.nonCommercial}</div>}
                  {v.personalUseOnly && <div className="muted small">{t.personalUseOnly}</div>}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
