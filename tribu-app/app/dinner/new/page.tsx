import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DinnerForm from '@/components/DinnerForm';

export default async function NewDinnerPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div>
      <div className="ghead orange">
        <div className="htop">
          <Link href="/" className="back">‹</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.4rem' }}>Organiser un dîner 🍝</h1>
            <div className="hsub">Invite tes amis, le groupe se crée tout seul</div>
          </div>
        </div>
      </div>
      <div className="wrap">
        <DinnerForm />
      </div>
    </div>
  );
}
