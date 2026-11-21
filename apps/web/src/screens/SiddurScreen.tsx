import { useCallback } from 'react';
import type { SiddurNextResponse, UserProfile } from '@torah/core';
import { api } from '../api';
import { useText } from '../strings';
import { PathScreen } from './PathScreen';

const SIDDUR_INTERESTS = ['siddur', 'kavannah', 'prayerbook_hebrew'];

export function SiddurScreen({ profile }: { profile: UserProfile }) {
  const { strings } = useText();
  const fetchNext = useCallback(() => api.siddurNext(profile), [profile]);
  return (
    <PathScreen
      path="siddur"
      hasInterest={profile.interests.some((i) => SIDDUR_INTERESTS.includes(i))}
      fetchNext={fetchNext}
      title={(next) => (next.unit as SiddurNextResponse['unit']).blessingOrLine}
      overline={(next) => `${strings.nav.siddur} · ${(next.unit as SiddurNextResponse['unit']).section}`}
      labels={{ heading: strings.nav.siddur, ...strings.siddur }}
    />
  );
}
