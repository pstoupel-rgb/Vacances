import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import PollVote from '@/components/PollVote';
import { deletePoll } from '@/app/actions';

export default async function PollPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: poll } = await supabase.from('polls').select('*').eq('id', params.id).single();
  if (!poll) notFound();

  const { data: opts } = await supabase.from('poll_options').select('id, label').eq('poll_id', poll.id).order('created_at');
  const { data: votes } = await supabase.from('poll_votes').select('option_id, user_id').eq('poll_id', poll.id);

  const byOption: Record<string, number> = {};
  let myOption = '';
  (votes || []).forEach((v: any) => {
    byOption[v.option_id] = (byOption[v.option_id] || 0) + 1;
    if (v.user_id === user.id) myOption = v.option_id;
  });
  const options = (opts || []).map((o: any) => ({ id: o.id, label: o.label, votes: byOption[o.id] || 0, mine: o.id === myOption }));
  const total = (votes || []).length;

  return (
    <div>
      <div className="ghead">
        <div className="htop">
          <Link href={`/group/${poll.group_id}?tab=acts`} className="back">‹</Link>
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 700 }} className="ff">Sondage</div>
          <div style={{ width: 40 }} />
        </div>
      </div>
      <div className="wrap">
        <div className="center" style={{ margin: '6px 0 18px' }}>
          <div style={{ fontSize: '2.2rem' }}>🗳️</div>
          <h2 style={{ fontSize: '1.3rem', marginTop: 6 }}>{poll.question}</h2>
        </div>

        <PollVote pollId={poll.id} options={options} total={total} />

        <div className="muted center" style={{ fontSize: '.8rem', marginTop: 14 }}>{total} vote{total > 1 ? 's' : ''} au sondage</div>

        {poll.author_id === user.id && (
          <>
            <div style={{ height: 12 }} />
            <form action={deletePoll.bind(null, poll.id, poll.group_id)}>
              <button className="btn danger">Supprimer le sondage</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
