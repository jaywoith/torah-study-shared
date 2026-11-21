import { useEffect, useState } from 'react';
import type { UserProfile } from '@torah/core';
import { api } from './api';
import { DEFAULT_PROFILE, KEYS, readJson, writeJson } from './storage';
import { AppText, TextContext } from './strings';
import { TodayScreen } from './screens/TodayScreen';
import { SiddurScreen } from './screens/SiddurScreen';
import { SettingsScreen } from './screens/SettingsScreen';

type Route = 'today' | 'siddur' | 'settings';
const ROUTES: Route[] = ['today', 'siddur', 'settings'];

function routeFromHash(): Route {
  const r = window.location.hash.replace(/^#\/?/, '') as Route;
  return ROUTES.includes(r) ? r : 'today';
}

export function App() {
  const [text, setText] = useState<AppText | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(() => readJson(KEYS.profile, DEFAULT_PROFILE));
  const [route, setRoute] = useState<Route>(routeFromHash);

  useEffect(() => {
    Promise.all([api.uiStrings(), api.options()])
      .then(([strings, options]) => setText({ strings, options }))
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (loadError) {
    // Shared strings failed to load, so this one message cannot come from them.
    return (
      <main className="container">
        <p className="error" role="alert">
          Could not reach the Torah Study API. Is it running?
        </p>
      </main>
    );
  }
  if (!text) return <main className="container" aria-busy="true" />;

  const saveProfile = (p: UserProfile) => {
    writeJson(KEYS.profile, p);
    setProfile(p);
  };

  const labels: Record<Route, string> = {
    today: text.strings.nav.today,
    siddur: text.strings.nav.siddur,
    settings: text.strings.nav.settings,
  };

  return (
    <TextContext.Provider value={text}>
      <header className="app-header">
        <span className="app-name">{text.strings.common.appName}</span>
      </header>
      <main className="container">
        {route === 'today' && <TodayScreen profile={profile} />}
        {route === 'siddur' && <SiddurScreen profile={profile} />}
        {route === 'settings' && <SettingsScreen profile={profile} onSave={saveProfile} />}
      </main>
      <nav className="tabs" aria-label="Main">
        {ROUTES.map((r) => (
          <a key={r} href={`#/${r}`} aria-current={route === r ? 'page' : undefined}>
            {labels[r]}
          </a>
        ))}
      </nav>
    </TextContext.Provider>
  );
}
