import { useCallback } from 'react';
import type { MusarNextResponse, UserProfile } from '@torah/core';
import { api } from '../api';
import { useText } from '../strings';
import { PathScreen } from './PathScreen';

export function MusarScreen({ profile }: { profile: UserProfile }) {
  const { strings } = useText();
  const fetchNext = useCallback(() => api.musarNext(profile), [profile]);
  return (
    <PathScreen
      path="musar"
      hasInterest={profile.interests.includes('musar')}
      fetchNext={fetchNext}
      title={(next) => (next.unit as MusarNextResponse['unit']).title}
      overline={(next, outline) => {
        const section = outline?.sections.find((s) => s.units.some((u) => u.id === next.unit.id));
        return section ? `${strings.nav.musar} · ${section.name}` : strings.nav.musar;
      }}
      labels={{ heading: strings.nav.musar, ...strings.musar }}
    />
  );
}
