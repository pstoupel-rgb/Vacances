import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GroupForms from '@/components/GroupForms';

const GRADS = ['var(--gp)', 'var(--gpk)', 'var(--gtl)', 'var(--gor)', 'var(--gbl)'];

export default async function GroupsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name, emoji, invite_code)')
    .order('joined_at', { ascending: false });
  const groups = (memberships || []).map((m: any) => m.groups).filter(Boolean);

  return (
    <div>
      <div className="ghead">
        <div className="htop">
          <div style={{ flex: 1 }}>
            <h1>Mes groupes</h1>
            <div className="hsub">{groups.length} groupe{groups.length > 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>
      <div className="wrap">
        {groups.length === 0 ? (
          <div className="empty">
            <div className="big">👥</div>
            <h3>Aucun groupe</h3>
            <p>Crée ton premier cercle d&apos;amis ou rejoins-en un avec un code.</p>
          </div>
        ) : (
          groups.map((g: any, i: number) => (
            <Link key={g.id} href={`/group/${g.id}`} className="act">
              <div className="thumb" style={{ background: GRADS[i % GRADS.length], fontSize: '1.7rem' }}>{g.emoji}</div>
              <div style={{ flex: 1 }}>
                <div className="a-title">{g.name}</div>
                <div className="a-meta"><span>code : {g.invite_code}</span></div>
              </div>
              <div className="chev">›</div>
            </Link>
          ))
        )}
        <GroupForms />
      </div>
    </div>
  );
}
