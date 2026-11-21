// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { uiStrings } from '@torah/content';
import { SettingsScreen } from '../src/screens/SettingsScreen';
import { SiddurScreen } from '../src/screens/SiddurScreen';
import { DEFAULT_PROFILE, KEYS } from '../src/storage';
import { renderWithText } from './helpers';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('SettingsScreen', () => {
  it('uses option names from the API and saves the edited profile', () => {
    const onSave = vi.fn();
    renderWithText(<SettingsScreen profile={DEFAULT_PROFILE} onSave={onSave} />);
    expect(screen.getByRole('option', { name: 'Masorti / Conservative' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText(uiStrings.common.framework), { target: { value: 'reform' } });
    fireEvent.click(screen.getByLabelText('Musar')); // toggles musar off
    fireEvent.click(screen.getByRole('button', { name: uiStrings.common.save }));

    expect(onSave).toHaveBeenCalledOnce();
    const saved = onSave.mock.calls[0][0];
    expect(saved.framework).toBe('reform');
    expect(saved.interests).not.toContain('musar');
    expect(screen.getByRole('status').textContent).toBe(uiStrings.settings.saved);
  });
});

describe('SiddurScreen', () => {
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

  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input), 'http://x');
      const completed = url.searchParams.get('completed') ?? '';
      const body = completed === '' ? unitResponse('first', 1) : completed === 'first' ? unitResponse('second', 2) : null;
      return new Response(JSON.stringify(body ?? { error: 'done' }), { status: body ? 200 : 404 });
    });
  });

  it('marks a unit complete, persists it, and shows the next one', async () => {
    renderWithText(<SiddurScreen profile={DEFAULT_PROFILE} />);
    await screen.findByText('Unit 1 of 2');
    fireEvent.click(screen.getByRole('button', { name: uiStrings.siddur.markComplete }));
    await screen.findByText('Unit 2 of 2');
    expect(JSON.parse(localStorage.getItem(KEYS.siddurCompleted)!)).toEqual(['first']);
  });

  it('shows the completion message when the path is finished', async () => {
    localStorage.setItem(KEYS.siddurCompleted, JSON.stringify(['first', 'second']));
    renderWithText(<SiddurScreen profile={DEFAULT_PROFILE} />);
    await waitFor(() => expect(screen.getByTestId('siddur-complete').textContent).toBe(uiStrings.siddur.complete));
  });

  it('explains how to enable the path when no Siddur interest is selected', () => {
    renderWithText(<SiddurScreen profile={{ ...DEFAULT_PROFILE, interests: ['musar'] }} />);
    expect(screen.getByText(uiStrings.siddur.noInterest)).toBeTruthy();
  });
});
