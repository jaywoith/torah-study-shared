/**
 * Shared UI strings (from GET /v1/ui-strings) and profile options (GET /v1/options),
 * provided to the whole app. Components never hard-code shared labels.
 */
import { createContext, useContext } from 'react';
import type { OptionsResponse } from '@torah/core';
import type { UiStrings } from '@torah/content';

export interface AppText {
  strings: UiStrings;
  options: OptionsResponse;
}

export const TextContext = createContext<AppText | null>(null);

export function useText(): AppText {
  const ctx = useContext(TextContext);
  if (!ctx) throw new Error('useText must be used inside <TextContext.Provider>');
  return ctx;
}

/** Replaces {name} placeholders: fmt('Unit {n}', { n: 2 }) -> 'Unit 2'. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
