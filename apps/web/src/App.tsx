import { useCallback, useEffect, useState } from 'react';
import type { UserProfile } from '@torah/core';
import { api, setUnauthorizedHandler } from './api';
import { DEFAULT_PROFILE, LEGACY_KEYS, readLegacyData, removeKeys } from './storage';
import { AppText, TextContext } from './strings';
import { LoginScreen } from './screens/LoginScreen';
import { TodayScreen } from './screens/TodayScreen';
import { SiddurScreen } from './screens/SiddurScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SourcesScreen } from './screens/SourcesScreen';
import { MusarScreen } from './screens/MusarScreen';
import { Icon } from './components/Icon';
import { FocusContext } from './focus';
import { useTextScale } from './prefs';

type Route = 'today' | 'siddur' | 'musar' | 'settings' | 'sources';
/** Routes shown as tabs. "sources" is reached from Settings. */
type TabRoute = Exclude<Route, 'sources'>;
const TABS: TabRoute[] = ['today', 'siddur', 'musar', 'settings'];
const ROUTES: Route[] = [...TABS, 'sources'];

function routeFromHash(): Route {
  const r = window.location.hash.replace(/^#\/?/, '') as Route;
  return ROUTES.includes(r) ? r : 'today';
}

type Auth = { required: boolean; authenticated: boolean };

/** Moves profile/progress saved in this browser by v0.3 to the server, once. */
async function importLegacyData(): Promise<void> {
  const legacy = readLegacyData();
  if (!legacy) return;
  await api.importLocal(legacy);
  removeKeys(Object.values(LEGACY_KEYS));
}

export function App() {
  const [text, setText] = useState<AppText | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [route, setRoute] = useState<Route>(routeFromHash);
  const [focus, setFocus] = useState(false);
  useTextScale(); // applies the saved reading size on load

  // Public data (labels for every screen, including login) and session state.
  useEffect(() => {
    setUnauthorizedHandler(() => setAuth((a) => (a ? { ...a, authenticated: false } : a)));
    Promise.all([api.uiStrings(), api.options(), api.session()])
      .then(([strings, options, session]) => {
        setText({ strings, options });
        setAuth({ required: session.authRequired, authenticated: session.authenticated });
      })
      .catch(() => setLoadError(true));
  }, []);

  // Once signed in: import any v0.3 browser data, then load the saved profile.
  const loadProfile = useCallback(async () => {
    try {
      await importLegacyData();
    } catch {
      /* keep the browser copy and retry next time */
    }
    try {
      const res = await api.getProfile();
      setProfile(res.profile ?? DEFAULT_PROFILE);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    if (auth?.authenticated) loadProfile();
  }, [auth?.authenticated, loadProfile]);

  useEffect(() => {
    const onHash = () => {
      setRoute(routeFromHash());
      setFocus(false);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (loadError) {
    // Shared strings may have failed to load, so this one message cannot come from them.
    return (
      <main className="container">
        <p className="error" role="alert">
          Could not reach the Torah Study API. Is it running?
        </p>
      </main>
    );
  }
  if (!text || !auth) return <main className="container" aria-busy="true" />;

  if (!auth.authenticated) {
    return (
      <TextContext.Provider value={text}>
        <main className="login-page">
          <LoginScreen onLogin={() => setAuth({ ...auth, authenticated: true })} />
        </main>
      </TextContext.Provider>
    );
  }

  if (!profile) return <main className="container" aria-busy="true" />;

  const saveProfile = async (p: UserProfile) => {
    const res = await api.saveProfile(p);
    setProfile(res.profile ?? p);
  };

  const logout = async () => {
    await api.logout().catch(() => {});
    setProfile(null);
    setAuth({ ...auth, authenticated: false });
  };

  const labels: Record<TabRoute, string> = {
    today: text.strings.nav.today,
    siddur: text.strings.nav.siddur,
    musar: text.strings.nav.musar,
    settings: text.strings.nav.settings,
  };

  return (
    <TextContext.Provider value={text}>
      <FocusContext.Provider value={{ focus, setFocus }}>
        <div className="app" data-focus={focus ? 'true' : undefined} data-route={route}>
          <nav className="nav" aria-label="Main">
            <span className="brand">{text.strings.common.appName}</span>
            {TABS.map((r) => (
              <a key={r} href={`#/${r}`} aria-current={route === r || (r === 'settings' && route === 'sources') ? 'page' : undefined}>
                <span className="nav-icon">
                  <Icon name={r} size={22} />
                </span>
                <span className="nav-label">{labels[r]}</span>
              </a>
            ))}
          </nav>
          <main className="main">
            {route === 'today' && <TodayScreen profile={profile} />}
            {route === 'siddur' && <SiddurScreen profile={profile} />}
            {route === 'musar' && <MusarScreen profile={profile} />}
            {route === 'sources' && <SourcesScreen />}
            {route === 'settings' && (
              <SettingsScreen profile={profile} onSave={saveProfile} onLogout={auth.required ? logout : undefined} />
            )}
          </main>
        </div>
      </FocusContext.Provider>
    </TextContext.Provider>
  );
}
