import type { Metadata, Viewport } from 'next';
import './globals.css';
import TabBar from '@/components/TabBar';

export const metadata: Metadata = {
  title: 'Vini',
  description: "L'app des amis qui organisent, partagent et profitent ensemble.",
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="shell">{children}</div>
        <TabBar />
      </body>
    </html>
  );
}
