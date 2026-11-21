/**
 * Content library and shared UI strings, loaded from JSON in ../data.
 * Content is data, not code: add or edit units in the JSON files; tests in
 * ../test/content.test.ts check every entry against the rules in docs/CONTENT.md.
 */

import type { ContentLibrary, ContentUnit, SiddurSection } from '@torah/core';
import siddurData from '../data/siddur.json';
import studyUnitsData from '../data/study-units.json';
import uiStringsData from '../data/ui-strings.json';

export const siddurSections = siddurData.sections as SiddurSection[];
export const studyUnits = studyUnitsData.units as ContentUnit[];

export const contentLibrary: ContentLibrary = {
  studyUnits,
  siddur: siddurSections,
};

export type UiStrings = typeof uiStringsData;
export const uiStrings: UiStrings = uiStringsData;
