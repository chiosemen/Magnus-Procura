import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Magnus Procura — Enterprise Procurement Readiness & Intro Ledger',
  description: 'Anti-opaque-intermediary B2B supplier readiness and named-buyer introductions with an open scoreboard.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
