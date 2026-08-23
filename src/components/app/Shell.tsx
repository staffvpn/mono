'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authService } from '@/services/auth';
import { notificationService } from '@/services/comms';
import { useDB, useMounted } from '@/hooks/useStore';
import { initMiniApp, inTelegram, startParamRoute, haptic } from '@/lib/telegram';
import { Avatar, Badge, Button, Skeleton, cx } from '@/components/ui';
import { AuthGate, RolePicker } from './AuthGate';
import { Logo } from '@/components/site/Chrome';
import type { UserRole } from '@/types';

const TOP = [
  { href: '/app/tasks', label: 'Задачи' },
  { href: '/app/messages', label: 'Сообщения' },
  { href: '/app/orders', label: 'Мои заказы' },
  { href: '/app/favorites', label: 'Избранное' },
];

const BOTTOM = [
  { href: '/app', label: 'Главная', icon: '◆' },
  { href: '/app/tasks', label: 'Задачи', icon: '≡' },
  { href: '/app/create', label: 'Создать', icon: '+', accent: true },
  { href: '/app/messages', label: 'Чаты', icon: '✉' },
  { href: '/app/profile', label: 'Профиль', icon: '☺' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const db = useDB();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [ready, setReady] = useState(false);

  const user = mounted ? authService.getCurrentUser() : null;

  useEffect(() => {
    if (initMiniApp()) {
      const route = startParamRoute();
      // Deeplink запоминаем: после входа вернём человека именно туда.
      if (route) sessionStorage.setItem('teydo.next', route);
    }
    setReady(true);
  }, []);

  if (!mounted || !ready) return <ShellSkeleton />;

  if (!user) {
    return (
      <main id="main" className="min-h-dvh" style={{ paddingTop: 'var(--tg-top)' }}>
        <AuthGate onDone={() => {
          const next = sessionStorage.getItem('teydo.next');
          const intent = params.get('intent');
          if (intent === 'executor' || intent === 'customer') authService.setRole(intent);
          if (next) { sessionStorage.removeItem('teydo.next'); router.replace(next); }
          else router.refresh();
        }} />
      </main>
    );
  }

  if (!db.onboarded) {
    return (
      <main id="main" className="min-h-dvh" style={{ paddingTop: 'var(--tg-top)' }}>
        <RolePicker onPick={(role: UserRole) => {
          authService.setRole(role);
          authService.markOnboarded();
          haptic('success');
          router.replace(role === 'customer' ? '/app/create' : '/app/tasks');
        }} />
      </main>
    );
  }

  const unread = notificationService.unread(user.id);

  return (
    <div className="min-h-dvh pb-[calc(78px+var(--tg-bottom))] lg:pb-0" style={{ paddingTop: 'var(--tg-top)' }}>
      {/* верхняя навигация — прячем внутри Telegram, там своя */}
      <header className={cx('sticky top-0 z-40 border-b-3 border-ink bg-paper/95 backdrop-blur', inTelegram() && 'lg:block hidden')}>
        <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-5 py-3 sm:px-8">
          <Logo className="!text-xl" />
          <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Разделы">
            {TOP.map((n) => (
              <Link key={n.href} href={n.href}
                className={cx('rounded-full px-3.5 py-2 text-[15px] font-bold',
                  pathname.startsWith(n.href) ? 'bg-ink text-paper' : 'hover:bg-sand')}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <RoleSwitch />
            <Link href="/app/notifications" aria-label="Уведомления"
              className="relative grid h-11 w-11 place-items-center rounded-full border-3 border-ink bg-card shadow-pop-sm">
              <span aria-hidden>🔔</span>
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full border-2 border-ink bg-brand px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Link>
            <Link href="/app/profile" aria-label="Профиль">
              <Avatar src={user.avatar} name={user.name} size={44} />
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[1240px] px-5 py-6 sm:px-8">{children}</main>

      {/* нижняя навигация — телефон и Telegram */}
      <nav aria-label="Навигация" className="fixed inset-x-0 bottom-0 z-40 border-t-3 border-ink bg-paper lg:hidden"
        style={{ paddingBottom: 'var(--tg-bottom)' }}>
        <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-2 py-2">
          {BOTTOM.map((n) => {
            const active = n.href === '/app' ? pathname === '/app' : pathname.startsWith(n.href);
            if (n.accent) {
              return (
                <Link key={n.href} href={n.href} className="flex flex-col items-center gap-1" aria-label={n.label}>
                  <span className="grid h-14 w-14 -translate-y-3 place-items-center rounded-full border-3 border-ink bg-brand text-2xl font-bold text-white shadow-pop">
                    {n.icon}
                  </span>
                  <span className="-mt-2 text-[11px] font-bold">{n.label}</span>
                </Link>
              );
            }
            return (
              <Link key={n.href} href={n.href}
                className={cx('flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-bold',
                  active ? 'text-brand' : 'text-faint')}>
                <span aria-hidden className="text-lg leading-none">{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function RoleSwitch() {
  const db = useDB();
  const user = authService.getCurrentUser();
  if (!user) return null;
  return (
    <div className="hidden items-center rounded-full border-3 border-ink bg-card p-1 sm:flex" role="group" aria-label="Режим">
      {(['customer', 'executor'] as const).map((r) => (
        <button key={r} onClick={() => { authService.setRole(r); haptic('select'); }}
          aria-pressed={user.activeRole === r}
          className={cx('rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
            user.activeRole === r ? 'bg-brand text-white' : 'text-muted hover:bg-sand')}>
          {r === 'customer' ? 'Заказчик' : 'Исполнитель'}
        </button>
      ))}
      <span className="sr-only">{db.onboarded ? '' : ''}</span>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8">
      <Skeleton className="h-12 w-48" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-44" />)}
      </div>
    </div>
  );
}

export { Badge, Button };
