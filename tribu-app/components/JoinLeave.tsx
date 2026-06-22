'use client';

import { useTransition } from 'react';
import { joinEvent, leaveEvent } from '@/app/actions';

export default function JoinLeave({
  eventId,
  groupId,
  joined,
}: {
  eventId: string;
  groupId: string;
  joined: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      className="btn ghost small"
      disabled={pending}
      onClick={() => start(() => (joined ? leaveEvent(eventId) : joinEvent(eventId, groupId)))}
    >
      {pending ? '…' : joined ? "Quitter l'événement" : "Rejoindre l'événement"}
    </button>
  );
}
