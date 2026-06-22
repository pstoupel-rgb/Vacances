'use client';

import { useState } from 'react';

export default function ShareInvite({ code, groupName }: { code: string; groupName: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/join/${code}`;
    const text = `Rejoins « ${groupName} » sur Vini 🍷`;
    const nav = navigator as any;
    if (nav.share) {
      try {
        await nav.share({ title: 'Vini', text, url });
        return;
      } catch {
        /* annulé */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <button className="btn" onClick={share}>
      {copied ? '✓ Lien copié' : '🔗 Inviter des amis'}
    </button>
  );
}
