'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Icon = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11l9-8 9 8M5 10v10h14V10" />
    </svg>
  ),
  groups: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5M15 20c0-2 1-3.4 3-3.4" />
    </svg>
  ),
  acts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
};

export default function TabBar() {
  const path = usePathname();
  if (path === '/login' || path.startsWith('/auth')) return null;
  const on = (p: string) => (p === '/' ? path === '/' : path.startsWith(p));
  return (
    <nav id="tabbar">
      <Link href="/" className={on('/') ? 'on' : ''}>
        {Icon.home}
        <span>Accueil</span>
      </Link>
      <Link href="/groups" className={on('/groups') ? 'on' : ''}>
        {Icon.groups}
        <span>Groupes</span>
      </Link>
      <Link href="/new" className="plus" aria-label="Créer">
        +
      </Link>
      <Link href="/activities" className={on('/activities') ? 'on' : ''}>
        {Icon.acts}
        <span>Activités</span>
      </Link>
      <Link href="/profile" className={on('/profile') ? 'on' : ''}>
        {Icon.profile}
        <span>Profil</span>
      </Link>
    </nav>
  );
}
