import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

function Tile({ href, emoji, title, sub }: { href: string; emoji: string; title: string; sub: string }) {
  return (
    <Link href={href} className="act">
      <div className="thumb" style={{ background: 'var(--soft)', color: 'var(--purple)' }}>{emoji}</div>
      <div style={{ flex: 1 }}>
        <div className="a-title">{title}</div>
        <div className="a-meta"><span>{sub}</span></div>
      </div>
      <div className="chev">›</div>
    </Link>
  );
}

export default async function NewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div>
      <div className="ghead">
        <div className="htop">
          <Link href="/" className="back">‹</Link>
          <div style={{ flex: 1 }}><h1>Créer</h1><div className="hsub">Que veux-tu lancer ?</div></div>
        </div>
      </div>
      <div className="wrap">
        <Tile href="/dinner/new" emoji="🍝" title="Organiser un dîner" sub="Invite par email, le groupe se crée" />
        <Tile href="/groups" emoji="👥" title="Créer / rejoindre un groupe" sub="Un cercle d'amis réutilisable" />
        <div className="banner" style={{ marginTop: 8 }}>
          💡 Activités, sondages, cagnottes et commandes de vin se créent <b>&nbsp;à l'intérieur d'un groupe</b>.
        </div>
      </div>
    </div>
  );
}
