/**
 * Outlines of the sequential paths (Siddur, Musar): every unit grouped into
 * sections, with completion. Used by clients to show section progress. Pure.
 */

import type { ContentUnit, SiddurSection } from './models';
import { getMusarSequence } from './musar-path';

export interface PathOutlineUnit {
  id: string;
  title: string;
  estimatedMinutes?: number;
  completed: boolean;
}

export interface PathOutlineSection {
  name: string;
  units: PathOutlineUnit[];
  completedCount: number;
}

export interface PathOutline {
  sections: PathOutlineSection[];
  total: number;
  completedCount: number;
  /** The first unit in path order not yet completed; null when the path is finished. */
  nextUnitId: string | null;
}

function buildOutline(groups: { name: string; units: Omit<PathOutlineUnit, 'completed'>[] }[], completedIds: string[]): PathOutline {
  const done = new Set(completedIds);
  const sections = groups
    .filter((g) => g.units.length > 0)
    .map((g) => {
      const units = g.units.map((u) => ({ ...u, completed: done.has(u.id) }));
      return { name: g.name, units, completedCount: units.filter((u) => u.completed).length };
    });
  const all = sections.flatMap((s) => s.units);
  return {
    sections,
    total: all.length,
    completedCount: all.filter((u) => u.completed).length,
    nextUnitId: all.find((u) => !u.completed)?.id ?? null,
  };
}

/** Siddur outline: one section per Siddur section, in path order. */
export function buildSiddurOutline(sections: SiddurSection[], completedIds: string[]): PathOutline {
  // Same order as getSiddurSequence (section order, then unit order), grouped by section.
  const groups = [...sections]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      name: s.name,
      units: s.units.map((u) => ({ id: u.id, title: u.blessingOrLine, estimatedMinutes: u.estimatedMinutes })),
    }));
  return buildOutline(groups, completedIds);
}

/**
 * The section a Musar unit belongs to, from its source citation with the
 * verse/paragraph range removed: "Mesillat Yesharim 4:6-9" -> "Mesillat Yesharim 4",
 * "Mesillat Yesharim, Introduction 1-2" -> "Mesillat Yesharim, Introduction",
 * "Pirkei Avot 6:11" -> "Pirkei Avot 6". Units without a source fall under "Musar".
 */
export function musarSectionName(source: string | undefined): string {
  if (!source) return 'Musar';
  const s = source.trim();
  const chapter = s.match(/^(.*\S)\s+(\d+):[\d\-–]+$/);
  if (chapter) return `${chapter[1]} ${chapter[2]}`;
  const range = s.match(/^(.*\S)\s+[\d\-–]+$/);
  return range ? range[1] : s;
}

/** Musar outline: consecutive units with the same section name form one section. */
export function buildMusarOutline(units: ContentUnit[], completedIds: string[]): PathOutline {
  const groups: { name: string; units: Omit<PathOutlineUnit, 'completed'>[] }[] = [];
  for (const u of getMusarSequence(units)) {
    const name = musarSectionName(u.source);
    const last = groups[groups.length - 1];
    const entry = { id: u.id, title: u.title ?? u.source ?? u.id, estimatedMinutes: u.estimatedMinutes };
    if (last && last.name === name) last.units.push(entry);
    else groups.push({ name, units: [entry] });
  }
  return buildOutline(groups, completedIds);
}
