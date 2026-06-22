import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Ouvre /join/<code> pour rejoindre un groupe via un lien d'invitation.
export default async function JoinPage({ params }: { params: { code: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: group } = await supabase
    .from('groups')
    .select('id')
    .eq('invite_code', params.code.toLowerCase())
    .single();

  if (!group) {
    return (
      <div className="pt center" style={{ paddingTop: 80 }}>
        <div className="big" style={{ fontSize: '3rem' }}>🤷</div>
        <h2 style={{ marginTop: 12 }}>Code invalide</h2>
        <p className="muted" style={{ marginTop: 6 }}>Ce lien d&apos;invitation ne correspond à aucun groupe.</p>
        <a href="/" className="btn ghost small" style={{ margin: '18px auto 0' }}>Retour à l&apos;accueil</a>
      </div>
    );
  }

  await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id });
  redirect(`/group/${group.id}`);
}
