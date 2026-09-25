import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'SAAR — Personal Growth Intelligence',
    template: '%s | SAAR',
  },
  description:
    'Know how you live. Understand where you\'re going. Become who you want to be.',
  robots: { index: false, follow: false }, // private app — no indexing
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <body className="overflow-x-hidden min-h-screen">
        {children}
      </body>
    </html>
  );
}
