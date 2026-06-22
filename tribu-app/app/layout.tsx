import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tribu',
  description: 'Organise tes sorties entre amis et réglez ensemble.',
};

export const viewport: Viewport = {
  themeColor: '#0f1020',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="shell">{children}</div>
      </body>
    </html>
  );
}
