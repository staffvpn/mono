'use client';

/* ============================================================
   Микро-иллюстрации. Единая система: толстый контур, плоская
   заливка, простые формы. Никаких защищённых персонажей —
   собственные обобщённые фигуры.
   ============================================================ */

const S = { stroke: 'rgb(var(--c-ink))', strokeWidth: 5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const brand = 'rgb(var(--c-brand))';
const sand = 'rgb(var(--c-sand))';

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" role="img" aria-hidden className={className ?? 'h-28 w-28'}>
      {children}
    </svg>
  );
}

/** Персонаж ищет исполнителя */
export function ArtSearching({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <circle cx="52" cy="50" r="26" {...S} fill={sand}  />
      <path d="M71 69l22 22" {...S} fill="none" />
      <circle cx="46" cy="45" r="4" fill="rgb(var(--c-ink))" />
      <circle cx="60" cy="45" r="4" fill="rgb(var(--c-ink))" />
      <path d="M44 58c5 5 13 5 18 0" {...S} fill="none" strokeWidth={4} />
    </Frame>
  );
}

/** Пришёл отклик */
export function ArtReply({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <rect x="18" y="30" width="84" height="54" rx="12" {...S} fill={brand}  />
      <path d="M18 40l42 26 42-26" {...S} fill="none" stroke="rgb(var(--c-paper))" strokeWidth={5} />
      <circle cx="96" cy="30" r="14" {...S} fill={sand}  />
      <path d="M91 30l4 4 7-8" {...S} fill="none" strokeWidth={4} />
    </Frame>
  );
}

/** Договорились */
export function ArtDeal({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M22 66l18-16 16 12 14-14 12 10" {...S} fill="none"  />
      <circle cx="34" cy="40" r="12" {...S} fill={sand}  />
      <circle cx="86" cy="40" r="12" {...S} fill={brand}  />
      <path d="M40 78h40" {...S} fill="none" />
      <path d="M52 92h16" {...S} fill="none" />
    </Frame>
  );
}

/** Работа в процессе */
export function ArtWork({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <rect x="24" y="46" width="72" height="46" rx="10" {...S} fill={sand}  />
      <path d="M44 46V34a16 16 0 0132 0v12" {...S} fill="none" />
      <circle cx="60" cy="68" r="8" {...S} fill={brand}  strokeWidth={4} />
    </Frame>
  );
}

/** Заказ завершён */
export function ArtDone({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <circle cx="60" cy="60" r="38" {...S} fill={brand}  />
      <path d="M44 62l12 12 22-26" stroke="rgb(var(--c-paper))" fill="none" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

/** Деньги получены */
export function ArtMoney({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <rect x="16" y="36" width="88" height="52" rx="10" {...S} fill={sand}  />
      <circle cx="60" cy="62" r="15" {...S} fill={brand}  strokeWidth={4} />
      <path d="M60 54v16M55 60h10" stroke="rgb(var(--c-paper))" strokeWidth={4} strokeLinecap="round" />
    </Frame>
  );
}

/** Спор */
export function ArtDispute({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M60 22l38 66H22z" {...S} fill={sand}  />
      <path d="M60 48v18" {...S} fill="none" strokeWidth={6} />
      <circle cx="60" cy="76" r="3.5" fill="rgb(var(--c-ink))" />
    </Frame>
  );
}

/** Поддержка */
export function ArtSupport({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <rect x="20" y="30" width="80" height="52" rx="14" {...S} fill={sand}  />
      <path d="M44 82l-8 16 22-16" {...S} fill={sand}  />
      <path d="M50 50a10 10 0 1116 8c-3 2-6 4-6 8" {...S} fill="none" strokeWidth={4} />
      <circle cx="60" cy="72" r="3" fill="rgb(var(--c-ink))" />
    </Frame>
  );
}

/** Пусто */
export function ArtEmpty({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <rect x="22" y="40" width="76" height="54" rx="12" {...S} fill={sand}  />
      <path d="M22 56h76" {...S} fill="none" />
      <path d="M46 74h28" {...S} fill="none" strokeWidth={4} />
    </Frame>
  );
}

/** Ошибка */
export function ArtError({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <circle cx="60" cy="60" r="36" {...S} fill={sand}  />
      <path d="M46 48l28 28M74 48L46 76" {...S} fill="none" strokeWidth={6} />
    </Frame>
  );
}

/** Уведомление */
export function ArtBell({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M60 24a22 22 0 0122 22v20l8 12H30l8-12V46a22 22 0 0122-22z" {...S} fill={sand}  />
      <path d="M52 90a8 8 0 0016 0" {...S} fill="none" strokeWidth={4} />
      <circle cx="86" cy="32" r="9" {...S} fill={brand}  strokeWidth={4} />
    </Frame>
  );
}

/** Безопасная сделка */
export function ArtShield({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M60 20l32 12v26c0 22-14 34-32 42-18-8-32-20-32-42V32z" {...S} fill={brand}  />
      <path d="M46 60l10 10 20-22" stroke="rgb(var(--c-paper))" fill="none" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}
