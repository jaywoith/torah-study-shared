/**
 * License policy for imported texts (ADR-010, ADR-012).
 *
 * - allowed: Public Domain, CC0, CC-BY, CC-BY-SA.
 * - flagged: CC-BY-NC. Fine while the app is personal and non-commercial; listed
 *   in the content report.
 * - personal-use only: "unknown" (or anything else) is rejected unless the
 *   manifest entry sets `personalUseOnly: true`. Such entries must be cleared
 *   before the app goes beyond personal use (owner decision 2026-11-21).
 */

export const ALLOWED_LICENSES = ['Public Domain', 'CC0', 'CC-BY', 'CC-BY-SA'] as const;
export const FLAGGED_LICENSES = ['CC-BY-NC'] as const;

export type LicenseStatus = 'allowed' | 'non_commercial' | 'personal_use_only' | 'rejected';

/** Sefaria spells some licenses inconsistently ("CC BY-SA", "Public domain"). */
export function normalizeLicense(license: string | undefined): string {
  const l = (license ?? '').trim();
  if (/^public domain$/i.test(l)) return 'Public Domain';
  if (/^cc[- ]?0$/i.test(l)) return 'CC0';
  const cc = /^cc[- ]by(?:[- ](sa|nc))?$/i.exec(l);
  if (cc) return cc[1] ? `CC-BY-${cc[1].toUpperCase()}` : 'CC-BY';
  return l || 'unknown';
}

export function licenseStatus(license: string, opts: { personalUseOnly?: boolean } = {}): LicenseStatus {
  const l = normalizeLicense(license);
  if ((ALLOWED_LICENSES as readonly string[]).includes(l)) return 'allowed';
  if ((FLAGGED_LICENSES as readonly string[]).includes(l)) return 'non_commercial';
  return opts.personalUseOnly ? 'personal_use_only' : 'rejected';
}

/** Licenses that require attribution in the app (Sources & licenses screen). */
export function requiresAttribution(license: string): boolean {
  return normalizeLicense(license).startsWith('CC-BY');
}
