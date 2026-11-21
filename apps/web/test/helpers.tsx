import { render } from '@testing-library/react';
import { uiStrings } from '@torah/content';
import type { OptionsResponse } from '@torah/core';
import { TextContext } from '../src/strings';

export const options: OptionsResponse = {
  frameworks: [{ id: 'masorti_conservative', name: 'Masorti / Conservative' }, { id: 'reform', name: 'Reform' }],
  levels: [{ id: 'intermediate', name: 'Intermediate' }],
  interests: [{ id: 'siddur', name: 'Siddur' }, { id: 'musar', name: 'Musar' }],
  studyLengths: [{ id: 'medium', name: 'Medium', minutes: 20 }],
  languageModes: [{ id: 'mixed', name: 'Mixed' }, { id: 'english', name: 'English' }],
  divineNames: [
    { id: 'abbreviated', name: 'Abbreviated' },
    { id: 'full', name: 'Full' },
    { id: 'yud_yud', name: 'Yud-yud' },
  ],
};

export function renderWithText(ui: React.ReactElement) {
  return render(<TextContext.Provider value={{ strings: uiStrings, options }}>{ui}</TextContext.Provider>);
}
