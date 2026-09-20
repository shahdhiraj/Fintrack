import type { Metadata } from 'next';
import { Bricolage_Grotesque, Manrope, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { ClientLayout } from './client-layout';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FinTrack',
  description: 'See where your money goes and stay inside your budget, one month at a time.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full ${manrope.variable} ${bricolage.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-body antialiased h-full" suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
