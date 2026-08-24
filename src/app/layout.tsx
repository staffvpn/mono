import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BRAND } from '@/lib/brand';

export const metadata: Metadata = {
  metadataBase: new URL('https://teydo.app'),
  title: { default: `${BRAND.name} — ${BRAND.slogan}`, template: `%s · ${BRAND.name}` },
  description:
    'Площадка задач и исполнителей. Создать задачу, найти людей рядом и откликнуться — бесплатно. Платформа зарабатывает только на успешной сделке.',
  openGraph: {
    title: `${BRAND.name} — ${BRAND.slogan}`,
    description: 'Создать задачу, найти людей рядом и откликнуться — бесплатно.',
    type: 'website', locale: 'ru_RU',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#E4CFBE',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* SDK Telegram: на обычном сайте просто ничего не делает */}
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[300] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
          К содержимому
        </a>
        {children}
      </body>
    </html>
  );
}
