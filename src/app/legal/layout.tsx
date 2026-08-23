import Link from 'next/link';
import { SiteHeader, SiteFooter } from '@/components/site/Chrome';

const TABS = [
  { href: '/legal/terms', label: 'Соглашение' },
  { href: '/legal/privacy', label: 'Конфиденциальность' },
  { href: '/legal/rules', label: 'Правила площадки' },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <nav aria-label="Правовые документы" className="border-b-3 border-ink bg-surface">
          <div className="mx-auto flex w-full max-w-[1240px] flex-wrap gap-2 px-5 py-4 sm:px-8">
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="rounded-full border-2 border-ink bg-card px-4 py-2 text-sm font-bold hover:bg-sand"
              >
                {t.label}
              </Link>
            ))}
          </div>
        </nav>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
