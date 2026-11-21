// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { uiStrings } from '@torah/content';
import { LoginScreen } from '../src/screens/LoginScreen';
import { SettingsScreen } from '../src/screens/SettingsScreen';
import { SiddurScreen } from '../src/screens/SiddurScreen';
import { SourcesScreen } from '../src/screens/SourcesScreen';
import { TodayScreen } from '../src/screens/TodayScreen';
import { DEFAULT_PROFILE, LEGACY_KEYS, readLegacyData } from '../src/storage';
import { renderWithText } from './helpers';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

type Handler = (url: URL, init: RequestInit) => { status?: number; body: unknown };
function mockFetch(handler: Handler) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const { status = 200, body } = handler(new URL(String(input), 'http://x'), init ?? {});
    return new Response(JSON.stringify(body), { status });
  });
}

describe('SettingsScreen', () => {
  it('uses option names from the API and saves the edited profile', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderWithText(<SettingsScreen profile={DEFAULT_PROFILE} onSave={onSave} />);
    expect(screen.getByRole('option', { name: 'Masorti / Conservative' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText(uiStrings.common.framework), { target: { value: 'reform' } });
    fireEvent.click(screen.getByLabelText('Musar')); // toggles musar off
    fireEvent.click(screen.getByRole('button', { name: uiStrings.common.save }));

    await screen.findByRole('status');
    const saved = onSave.mock.calls[0][0];
    expect(saved.framework).toBe('reform');
    expect(saved.interests).not.toContain('musar');
  });

  it('saves the cantillation toggle and Divine Name setting', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderWithText(<SettingsScreen profile={DEFAULT_PROFILE} onSave={onSave} />);
    const toggle = screen.getByLabelText(uiStrings.settings.showCantillation) as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    expect((screen.getByLabelText(uiStrings.settings.divineName) as HTMLSelectElement).value).toBe('abbreviated');

    fireEvent.click(toggle);
    fireEvent.change(screen.getByLabelText(uiStrings.settings.divineName), { target: { value: 'yud_yud' } });
    fireEvent.click(screen.getByRole('button', { name: uiStrings.common.save }));

    await screen.findByRole('status');
    expect(onSave.mock.calls[0][0]).toMatchObject({ showCantillation: true, divineName: 'yud_yud' });
  });

  it('shows an error when saving fails', async () => {
    renderWithText(<SettingsScreen profile={DEFAULT_PROFILE} onSave={vi.fn().mockRejectedValue(new Error('x'))} />);
    fireEvent.click(screen.getByRole('button', { name: uiStrings.common.save }));
    expect((await screen.findByRole('alert')).textContent).toBe(uiStrings.common.errorGeneric);
  });

  it('offers sign-out only when provided', () => {
    const { unmount } = renderWithText(<SettingsScreen profile={DEFAULT_PROFILE} onSave={vi.fn()} />);
    expect(screen.queryByRole('button', { name: uiStrings.auth.logout })).toBeNull();
    unmount();
    renderWithText(<SettingsScreen profile={DEFAULT_PROFILE} onSave={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.getByRole('button', { name: uiStrings.auth.logout })).toBeTruthy();
  });
});

describe('LoginScreen', () => {
  it('signs in with the passphrase', async () => {
    const fetchSpy = mockFetch(() => ({ body: { ok: true } }));
    const onLogin = vi.fn();
    renderWithText(<LoginScreen onLogin={onLogin} />);
    fireEvent.change(screen.getByLabelText(uiStrings.auth.passphrase), { target: { value: 'shalom' } });
    fireEvent.click(screen.getByRole('button', { name: uiStrings.auth.submit }));
    await waitFor(() => expect(onLogin).toHaveBeenCalled());
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]!.body))).toEqual({ passphrase: 'shalom' });
  });

  it.each([
    [401, uiStrings.auth.invalid],
    [429, uiStrings.auth.tooMany],
  ])('shows the right message for HTTP %i', async (status, message) => {
    mockFetch(() => ({ status, body: { error: 'x' } }));
    renderWithText(<LoginScreen onLogin={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(uiStrings.auth.passphrase), { target: { value: 'nope' } });
    fireEvent.click(screen.getByRole('button', { name: uiStrings.auth.submit }));
    expect((await screen.findByRole('alert')).textContent).toBe(message);
  });
});

describe('SiddurScreen (server-backed)', () => {
  const unitResponse = (id: string, position: number) => ({
    unit: {
      id,
      section: 'Pesukei Dezimra',
      blessingOrLine: id,
      hebrew: 'בָּרוּךְ',
      english: 'Blessed',
      commentary: 'c',
      kavannahPrompt: 'k',
      verified: false,
    },
    display: { mode: 'split', showHebrew: true, showTransliteration: false, showEnglish: true, layout: 'side-by-side' },
    position,
    total: 2,
    completedCount: position - 1,
  });

  /** A tiny fake server: completion state lives here, like the real database. */
  function fakeServer(completed: string[] = []) {
    return mockFetch((url, init) => {
      if (url.pathname === '/v1/progress/complete') {
        completed.push(JSON.parse(String(init.body)).unitId);
        return { status: 201, body: { ok: true } };
      }
      if (url.pathname === '/v1/progress/reset') {
        completed.length = 0;
        return { body: { ok: true, removed: 1 } };
      }
      const next = ['first', 'second'].find((id) => !completed.includes(id));
      return next ? { body: unitResponse(next, completed.length + 1) } : { status: 404, body: { error: 'done' } };
    });
  }

  it('marks a unit complete on the server and shows the next one', async () => {
    const spy = fakeServer();
    renderWithText(<SiddurScreen profile={DEFAULT_PROFILE} />);
    await screen.findByText('Unit 1 of 2');
    fireEvent.click(screen.getByRole('button', { name: uiStrings.siddur.markComplete }));
    await screen.findByText('Unit 2 of 2');
    const post = spy.mock.calls.find(([u]) => String(u).includes('/v1/progress/complete'))!;
    expect(JSON.parse(String(post[1]!.body))).toEqual({ path: 'siddur', unitId: 'first' });
    expect(String(spy.mock.calls[0][0])).not.toContain('completed='); // server owns completion state
  });

  it('shows the completion message and can reset', async () => {
    fakeServer(['first', 'second']);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderWithText(<SiddurScreen profile={DEFAULT_PROFILE} />);
    await waitFor(() => expect(screen.getByTestId('siddur-complete').textContent).toBe(uiStrings.siddur.complete));
    fireEvent.click(screen.getByRole('button', { name: uiStrings.siddur.resetProgress }));
    await screen.findByText('Unit 1 of 2');
  });

  it('explains how to enable the path when no Siddur interest is selected', () => {
    renderWithText(<SiddurScreen profile={{ ...DEFAULT_PROFILE, interests: ['musar'] }} />);
    expect(screen.getByText(uiStrings.siddur.noInterest)).toBeTruthy();
  });
});

describe('TodayScreen done toggles', () => {
  const study = {
    study: {
      date: '2026-11-21',
      profile: DEFAULT_PROFILE,
      display: { mode: 'english', showHebrew: false, showTransliteration: false, showEnglish: true, layout: 'stacked' },
      units: [
        { id: '2026-11-21-musar-a', contentId: 'musar-a', type: 'musar', english: 'A', estimatedMinutes: 4 },
        { id: '2026-11-21-tanakh-b', contentId: 'tanakh-b', type: 'tanakh', english: 'B', estimatedMinutes: 6 },
      ],
      totalEstimatedMinutes: 10,
      budgetMinutes: 20,
    },
    validation: { valid: true, issues: [] },
  };

  it('shows saved completions and records a new one by content id', async () => {
    const spy = mockFetch((url) => {
      if (url.pathname === '/v1/study/daily') return { body: study };
      if (url.pathname === '/v1/progress') {
        return { body: { siddur: { completed: [] }, daily: [{ date: '2026-11-21', unitId: 'tanakh-b', completedAt: 'x' }] } };
      }
      return { status: 201, body: { ok: true } };
    });
    renderWithText(<TodayScreen profile={DEFAULT_PROFILE} />);
    await screen.findByText('1 of 2 done');

    fireEvent.click(screen.getByRole('button', { name: uiStrings.study.markDone }));
    await screen.findByText('2 of 2 done');
    const post = spy.mock.calls.find(([u, i]) => String(u).includes('/v1/progress/complete') && i?.method === 'POST')!;
    expect(JSON.parse(String(post[1]!.body))).toMatchObject({ path: 'daily', unitId: 'musar-a' });
  });
});

describe('legacy browser data (v0.3 → server import)', () => {
  it('returns null when there is nothing to import', () => {
    expect(readLegacyData()).toBeNull();
  });
  it('reads the v0.3 profile and Siddur progress', () => {
    localStorage.setItem(LEGACY_KEYS.profile, JSON.stringify(DEFAULT_PROFILE));
    localStorage.setItem(LEGACY_KEYS.siddurCompleted, JSON.stringify(['baruch_sheamar']));
    expect(readLegacyData()).toEqual({ profile: DEFAULT_PROFILE, siddurCompleted: ['baruch_sheamar'] });
  });
});

describe('SourcesScreen', () => {
  it('lists versions with their licenses and flags', async () => {
    mockFetch(() => ({
      body: {
        provider: { name: 'Sefaria', url: 'https://www.sefaria.org' },
        versions: [
          { language: 'hebrew', versionTitle: 'Miqra according to the Masorah', license: 'CC-BY-SA', units: 70, requiresAttribution: true, nonCommercial: false, personalUseOnly: false },
          { language: 'english', versionTitle: 'NJPS', license: 'CC-BY-NC', units: 70, requiresAttribution: true, nonCommercial: true, personalUseOnly: false },
        ],
      },
    }));
    renderWithText(<SourcesScreen />);
    expect(await screen.findByText('Miqra according to the Masorah')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sefaria' }).getAttribute('href')).toBe('https://www.sefaria.org');
    expect(screen.getByText(uiStrings.sources.nonCommercial)).toBeTruthy();
    expect(screen.getAllByText(uiStrings.sources.attribution)).toHaveLength(2);
  });
});
