import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TYPES, type EventRow } from '@/lib/types';

export default async function ActivitiesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: memberships } = await supabase.from('group_members').select('group_id, groups(id, name, emoji)');
  const byId: Record<string, any> = {};
  (memberships || []).forEach((m: any) => m.groups && (byId[m.groups.id] = m.groups));
  const groupIds = Object.keys(byId);

  let events: EventRow[] = [];
  if (groupIds.length) {
    const { data } = await supabase.from('events').select('*').in('group_id', groupIds).order('event_date', { ascending: true });
    events = (data || []) as EventRow[];
  }

  return (
    <div>
      <div className="ghead">
        <div className="htop">
          <div style={{ flex: 1 }}>
            <h1>Activités</h1>
            <div className="hsub">Tout ce qui arrive</div>
          </div>
        </div>
      </div>
      <div className="wrap">
        {events.length === 0 ? (
          <div className="empty">
            <div className="big">🗓️</div>
            <h3>Aucune activité</h3>
            <p>Tes activités à venir apparaîtront ici.</p>
          </div>
        ) : (
          events.map((e) => {
            const t = TYPES[e.type];
            const g = byId[e.group_id];
            return (
              <Link key={e.id} href={`/event/${e.id}`} className="act">
                <div className="thumb" style={{ background: t.color }}>{t.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="a-title">{e.title}</div>
                  <div className="a-meta">
                    {e.event_date && <span>{e.event_date}{e.event_time ? ' · ' + e.event_time : ''}</span>}
                    {e.place && <span>📍 {e.place}</span>}
                  </div>
                  <div className="a-meta" style={{ marginTop: 4 }}>{g?.emoji} {g?.name}</div>
                </div>
                <div className="chev">›</div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
