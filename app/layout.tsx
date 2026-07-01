import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AuthProvider from '@/providers/AuthProvider';
import ThemeProvider from '@/providers/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Momento - Share Your Moments',
  description:
    'A modern social media platform to share your moments with the world.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Momento',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
