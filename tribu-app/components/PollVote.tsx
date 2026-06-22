'use client';

import { useState, useTransition } from 'react';
import { votePoll, addPollOption } from '@/app/actions';

type Opt = { id: string; label: string; votes: number; mine: boolean };

export default function PollVote({ pollId, options, total }: { pollId: string; options: Opt[]; total: number }) {
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const max = Math.max(0, ...options.map((o) => o.votes));

  return (
    <div>
      {options.map((o) => {
        const pct = total ? Math.round((o.votes / total) * 100) : 0;
        return (
          <div
            key={o.id}
            className={`poll-opt ${o.mine ? 'mine' : ''} ${o.votes === max && max > 0 ? 'win' : ''}`}
            onClick={() => start(() => votePoll(pollId, o.id))}
            style={{ opacity: pending ? 0.7 : 1 }}
          >
            <div className="bar" style={{ width: pct + '%' }} />
            <span>{o.label}</span>
            <span className="v">{o.votes} vote{o.votes > 1 ? 's' : ''}</span>
          </div>
        );
      })}

      {adding ? (
        <div className="row" style={{ marginTop: 4 }}>
          <input className="input" placeholder="Ta proposition" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} />
          <button
            className="btn small"
            onClick={() => {
              if (label.trim()) start(() => addPollOption(pollId, label));
              setLabel('');
              setAdding(false);
            }}
          >
            OK
          </button>
        </div>
      ) : (
        <button className="btn ghost" style={{ marginTop: 6 }} onClick={() => setAdding(true)}>
          + Ajouter une option
        </button>
      )}
    </div>
  );
}
