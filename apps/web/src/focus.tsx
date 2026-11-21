/** Focus mode: hides navigation and side panes so only the text remains. */
import { createContext, useContext } from 'react';

export interface FocusState {
  focus: boolean;
  setFocus: (on: boolean) => void;
}

export const FocusContext = createContext<FocusState>({ focus: false, setFocus: () => {} });
export const useFocus = () => useContext(FocusContext);
