'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { BRAND } from '@/lib/brand';
import { Button, cx } from '@/components/ui';

const NAV = [
  { href: '/tasks', label: 'Задачи' },
  { href: '/how-it-works', label: 'Как это работает' },
  { href: '/safety', label: 'Безопасность' },
  { href: '/payments', label: 'Оплата' },
  { href: '/pricing', label: 'Тарифы' },
  { href: '/help', label: 'Помощь' },
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label={BRAND.name} className={cx('inline-flex shrink-0 items-center', className)}>
      <Image src="/pic/logo.webp" alt={BRAND.name} width={675} height={439} priority
        className="h-11 w-auto sm:h-12" sizes="200px" />
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b-3 border-transparent bg-paper/90 backdrop-blur transition-colors [&.is-stuck]:border-ink">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <Logo />
        <nav aria-label="Основная навигация" className="hidden min-w-0 items-center gap-0.5 lg:flex xl:gap-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              className="whitespace-nowrap rounded-full border-2 border-transparent px-2.5 py-2 text-sm font-bold hover:border-ink hover:bg-sand xl:px-3.5 xl:text-[15px]">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <Link href="/app" className="hidden sm:inline-flex lg:hidden xl:inline-flex">
            <Button variant="outline" size="sm">Войти</Button>
          </Link>
          <Link href="/app/create" className="hidden sm:inline-flex">
            <Button size="sm">Создать задачу</Button>
          </Link>
          <button
            onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Меню"
            className="grid h-11 w-11 place-items-center rounded-full border-3 border-ink bg-card shadow-pop-sm lg:hidden"
          >
            <span className="text-lg leading-none">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t-3 border-ink bg-paper px-5 pb-7 pt-2 lg:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
              className="block border-b-2 border-ink/10 py-4 text-lg font-bold">
              {n.label}
            </Link>
          ))}
          <div className="mt-5 flex flex-col gap-3">
            <Link href="/app"><Button variant="outline" className="w-full">Войти</Button></Link>
            <Link href="/app/create"><Button className="w-full">Создать задачу</Button></Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const cols: { title: string; links: { href: string; label: string }[] }[] = [
    { title: 'Продукт', links: [
      { href: '/how-it-works', label: 'Как это работает' },
      { href: '/tasks', label: 'Задачи' },
      { href: '/pricing', label: 'Тарифы' },
      { href: '/app', label: 'Открыть приложение' },
    ]},
    { title: 'Доверие', links: [
      { href: '/safety', label: 'Безопасность' },
      { href: '/payments', label: 'Оплата и комиссия' },
      { href: '/help', label: 'Помощь и споры' },
    ]},
    { title: 'Правовое', links: [
      { href: '/legal/terms', label: 'Пользовательское соглашение' },
      { href: '/legal/privacy', label: 'Политика конфиденциальности' },
      { href: '/legal/rules', label: 'Правила площадки' },
    ]},
  ];

  return (
    <footer className="border-t-3 border-ink bg-ink text-paper">
      {/* Рисованная полоса-«двор» отделяет подвал от страницы. */}
      <div className="overflow-hidden border-b-3 border-ink bg-sand">
        <Image src="/pic/footer.webp" alt="" aria-hidden width={1600} height={800} sizes="100vw"
          className="h-28 w-full object-cover object-bottom sm:h-44" />
      </div>
      <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <Image src="/pic/logo.webp" alt={BRAND.name} width={675} height={439}
              className="h-16 w-auto" sizes="260px" />
            <p className="mt-4 max-w-[34ch] text-[15px] text-paper/70">{BRAND.slogan}</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {cols.map((c) => (
              <div key={c.title}>
                <div className="mb-3 text-xs font-bold uppercase tracking-wider text-brand">{c.title}</div>
                <div className="flex flex-col gap-2.5">
                  {c.links.map((l) => (
                    <Link key={l.href} href={l.href} className="text-[15px] text-paper/85 hover:text-brand">{l.label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t-2 border-paper/20 pt-6 text-sm text-paper/60">
          <span>© {new Date().getFullYear()} {BRAND.name}. Рабочее название, может измениться.</span>
          <a href={`https://t.me/${BRAND.botUsername}`} className="hover:text-brand">Telegram</a>
        </div>
      </div>
    </footer>
  );
}

export function Section({ id, eyebrow, title, sub, children, className }: {
  id?: string; eyebrow?: string; title?: string; sub?: string; children?: React.ReactNode; className?: string;
}) {
  return (
    <section id={id} className={cx('mx-auto w-full max-w-[1240px] px-5 py-16 sm:px-8 sm:py-24', className)}>
      {(eyebrow || title) && (
        <header className="mb-10 max-w-[46ch]">
          {eyebrow && (
            <span className="mb-4 inline-block -rotate-2 rounded-full border-2 border-ink bg-brand px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-pop-sm">
              {eyebrow}
            </span>
          )}
          {title && <h2 className="text-balance text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">{title}</h2>}
          {sub && <p className="mt-4 text-[17px] leading-relaxed text-muted">{sub}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

/** Шапка внутренней публичной страницы: заголовок + подзаголовок в одном стиле. */
export function PageHero({ eyebrow, title, sub, children }: {
  eyebrow: string; title: string; sub?: string; children?: React.ReactNode;
}) {
  return (
    <section className="border-b-3 border-ink bg-surface">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-14 sm:px-8 sm:py-20">
        <span className="mb-4 inline-block -rotate-2 rounded-full border-2 border-ink bg-brand px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-pop-sm">
          {eyebrow}
        </span>
        <h1 className="max-w-[20ch] text-balance text-[clamp(2.1rem,5.5vw,3.8rem)] font-extrabold leading-[1.02] tracking-tight">
          {title}
        </h1>
        {sub && <p className="mt-5 max-w-[62ch] text-[17px] leading-relaxed text-muted">{sub}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

/** Юридический / справочный текст: одна колонка, крупный межстрочный интервал. */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[76ch] break-words px-5 py-14 sm:px-8 sm:py-20 [&_a]:font-bold [&_a]:text-brand [&_a:hover]:underline [&_h2]:mb-3 [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-tight first:[&_h2]:mt-0 [&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-extrabold [&_li]:mb-2 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_p]:text-[16px] [&_p]:leading-relaxed [&_p]:text-muted [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-[16px] [&_li]:leading-relaxed [&_li]:text-muted">
      {children}
    </div>
  );
}
