import type { Metadata, Viewport } from 'next';
import './globals.css';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { InstallPrompt } from '@/components/InstallPrompt';

export const metadata: Metadata = {
  title: 'Well-Being Action Plan',
  description:
    'Open-source Progressive Web App for youth mental health support through digital Well-Being Action Plans',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WBAP',
    startupImage: [
      {
        url: '/splash-screens/apple-splash-640-1136.png',
        media: '(device-width: 320px) and (device-height: 568px)',
      },
      {
        url: '/splash-screens/apple-splash-750-1334.png',
        media: '(device-width: 375px) and (device-height: 667px)',
      },
      {
        url: '/splash-screens/apple-splash-1125-2436.png',
        media: '(device-width: 375px) and (device-height: 812px)',
      },
      {
        url: '/splash-screens/apple-splash-1242-2688.png',
        media: '(device-width: 414px) and (device-height: 896px)',
      },
      {
        url: '/splash-screens/apple-splash-828-1792.png',
        media: '(device-width: 414px) and (device-height: 896px)',
      },
      {
        url: '/splash-screens/apple-splash-1170-2532.png',
        media: '(device-width: 390px) and (device-height: 844px)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <OfflineIndicator />
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
