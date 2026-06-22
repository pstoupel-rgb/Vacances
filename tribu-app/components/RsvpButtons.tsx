'use client';

import { useTransition } from 'react';
import { setRsvp } from '@/app/actions';

export default function RsvpButtons({ eventId, current }: { eventId: string; current?: 'yes' | 'maybe' | 'no' }) {
  const [pending, start] = useTransition();
  const set = (s: 'yes' | 'maybe' | 'no') => start(() => setRsvp(eventId, s));
  return (
    <div className="rsvp" style={{ opacity: pending ? 0.6 : 1 }}>
      <button className={`yes ${current === 'yes' ? 'on' : ''}`} onClick={() => set('yes')}>Je participe</button>
      <button className={`maybe ${current === 'maybe' ? 'on' : ''}`} onClick={() => set('maybe')}>Peut-être</button>
      <button className={`no ${current === 'no' ? 'on' : ''}`} onClick={() => set('no')}>Non</button>
    </div>
  );
}
