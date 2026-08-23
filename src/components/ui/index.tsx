'use client';

import React from 'react';
import { twMerge } from 'tailwind-merge';

/* ============================================================
   Дизайн-система TEYDO.
   Одни и те же компоненты используются сайтом, Mini App и админкой.
   ============================================================ */

/** twMerge снимает конфликты утилит: bg-brand в className должен
 *  перебивать bg-card по умолчанию, а не зависеть от порядка в CSS. */
const cx = (...a: (string | false | null | undefined)[]) => twMerge(a.filter(Boolean).join(' '));
export { cx };

/* ---------- Button ---------- */
type BtnVariant = 'primary' | 'ink' | 'outline' | 'ghost' | 'danger' | 'soft';
type BtnSize = 'sm' | 'md' | 'lg';

export function Button({
  variant = 'primary', size = 'md', className, loading, children, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant; size?: BtnSize; loading?: boolean;
}) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={cx(btnBase(variant, size), className)}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function btnBase(variant: BtnVariant = 'primary', size: BtnSize = 'md') {
  const sizes: Record<BtnSize, string> = {
    sm: 'min-h-[38px] px-4 text-sm gap-1.5',
    md: 'min-h-[46px] px-6 text-[15px] gap-2',
    lg: 'min-h-[54px] px-8 text-base gap-2.5',
  };
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-brand text-white border-ink shadow-pop hover:bg-brand-soft active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
    ink: 'bg-ink text-paper border-ink shadow-pop hover:opacity-90 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
    outline: 'bg-card text-ink border-ink shadow-pop hover:bg-sand active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
    ghost: 'bg-transparent text-ink border-transparent shadow-none hover:bg-sand/60',
    danger: 'bg-danger text-white border-ink shadow-pop hover:opacity-90 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
    soft: 'bg-sand text-ink border-transparent shadow-none hover:brightness-95',
  };
  return cx(
    'inline-flex items-center justify-center rounded-full border-3 font-bold leading-none',
    'transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none select-none',
    sizes[size], variants[variant],
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Загрузка"
      className={cx('inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent', className)}
    />
  );
}

/* ---------- Card ---------- */
export function Card({
  className, children, pop = true, as: As = 'div', ...rest
}: React.HTMLAttributes<HTMLElement> & { pop?: boolean; as?: React.ElementType }) {
  return (
    <As
      {...rest}
      className={cx('rounded-xl border-3 border-ink bg-card', pop && 'shadow-pop', className)}
    >
      {children}
    </As>
  );
}

/* ---------- Badge ---------- */
type Tone = 'neutral' | 'brand' | 'ok' | 'warn' | 'danger' | 'sand';
export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  const tones: Record<Tone, string> = {
    neutral: 'bg-card text-ink border-ink',
    brand: 'bg-brand text-white border-ink',
    ok: 'bg-ok text-white border-ink',
    warn: 'bg-warn text-white border-ink',
    danger: 'bg-danger text-white border-ink',
    sand: 'bg-sand text-ink border-ink',
  };
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-xs font-bold whitespace-nowrap', tones[tone], className)}>
      {children}
    </span>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ src, name, size = 44, className }: { src?: string; name?: string; size?: number; className?: string }) {
  const letter = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, backgroundImage: src ? `url("${src}")` : undefined }}
      className={cx(
        'grid shrink-0 place-items-center rounded-full border-3 border-ink bg-sand bg-cover bg-center font-bold',
        className,
      )}
    >
      {!src && <span style={{ fontSize: size * 0.4 }}>{letter}</span>}
    </span>
  );
}

/* ---------- Поля ---------- */
/* min-w-0 обязателен: у input и select собственный content-size, из-за которого
   флекс-строка перестаёт сжиматься и страница уезжает вбок на узких экранах. */
const fieldCls = 'w-full min-w-0 max-w-full min-h-[48px] rounded-md border-3 border-ink bg-card px-4 py-3 text-[15px] font-medium outline-none placeholder:text-faint focus:border-brand';

export function Field({ label, hint, error, children, required }: {
  label?: string; hint?: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-bold">
          {label}{required && <span className="text-brand"> *</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1.5 block text-sm font-medium text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-sm text-faint">{hint}</span>
      ) : null}
    </label>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} {...rest} className={cx(fieldCls, className)} />;
  },
);

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={cx(fieldCls, 'min-h-[120px] resize-y leading-relaxed', className)} />;
}

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={cx(fieldCls, 'appearance-none pr-10', className)}>
      {children}
    </select>
  );
}

/* ---------- Chip ---------- */
export function Chip({ active, children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      aria-pressed={active}
      className={cx(
        'inline-flex min-h-[40px] items-center gap-2 rounded-full border-2 px-4 text-sm font-bold transition-colors',
        active ? 'border-ink bg-brand text-white shadow-pop-sm' : 'border-ink bg-card text-ink hover:bg-sand',
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ---------- Rating ---------- */
export function Rating({ value, count, size = 'md' }: { value: number | null; count?: number; size?: 'sm' | 'md' }) {
  if (value === null) {
    return <span className="text-sm text-faint">Пока без оценок</span>;
  }
  return (
    <span className={cx('inline-flex items-center gap-1.5 font-bold', size === 'sm' ? 'text-sm' : 'text-[15px]')}>
      <span aria-hidden className="text-brand">★</span>
      {value.toFixed(1)}
      {typeof count === 'number' && <span className="font-medium text-faint">({count})</span>}
    </span>
  );
}

export function StarPicker({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-bold">{label}</span>
      <span className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n} type="button" onClick={() => onChange(n)}
            aria-label={`${label}: ${n} из 5`}
            className={cx('h-9 w-9 rounded-full border-2 border-ink text-lg leading-none transition-transform hover:scale-110',
              n <= value ? 'bg-brand text-white' : 'bg-card text-faint')}
          >★</button>
        ))}
      </span>
    </div>
  );
}

/* ---------- Состояния ---------- */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cx('relative overflow-hidden rounded-md border-3 border-ink/20 bg-sand/50', className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
    </div>
  );
}

export function EmptyState({ title, text, action, art }: {
  title: string; text?: string; action?: React.ReactNode; art?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border-3 border-dashed border-ink/40 px-6 py-12 text-center">
      {art}
      <div>
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        {text && <p className="mx-auto mt-2 max-w-[42ch] text-[15px] text-muted">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ title = 'Что-то пошло не так', text = 'Мы уже разбираемся. Попробуйте ещё раз.', action }: {
  title?: string; text?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border-3 border-danger bg-danger/10 px-6 py-10 text-center">
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      <p className="max-w-[42ch] text-[15px] text-muted">{text}</p>
      {action}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title?: string; children: React.ReactNode; wide?: boolean;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center p-4"
         style={{ paddingTop: 'calc(1rem + var(--tg-top))', paddingBottom: 'calc(1rem + var(--tg-bottom))' }}>
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className={cx('relative max-h-full w-full overflow-auto rounded-2xl border-3 border-ink bg-paper p-6 shadow-pop-lg animate-flyIn',
          wide ? 'max-w-3xl' : 'max-w-lg')}
      >
        <button
          onClick={onClose} aria-label="Закрыть"
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-card text-lg font-bold shadow-pop-sm hover:bg-brand hover:text-white"
        >✕</button>
        {title && <h2 className="mb-4 pr-12 text-2xl font-bold tracking-tight">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

/* ---------- Tabs ---------- */
export function Tabs<T extends string>({ tabs, value, onChange }: {
  tabs: { key: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div role="tablist" className="no-bar flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1">
      {tabs.map((t) => (
        <button
          key={t.key} role="tab" aria-selected={t.key === value} onClick={() => onChange(t.key)}
          className={cx('min-h-[42px] shrink-0 rounded-full border-2 border-ink px-4 text-sm font-bold transition-colors',
            t.key === value ? 'bg-ink text-paper' : 'bg-card hover:bg-sand')}
        >
          {t.label}
          {typeof t.count === 'number' && <span className="ml-1.5 opacity-70">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Toggle ---------- */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="flex items-center gap-3"
    >
      <span className={cx('relative h-7 w-12 shrink-0 rounded-full border-3 border-ink transition-colors', checked ? 'bg-brand' : 'bg-sand')}>
        <span className={cx('absolute top-[2px] h-4 w-4 rounded-full border-2 border-ink bg-card transition-all', checked ? 'left-[24px]' : 'left-[2px]')} />
      </span>
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}

/* ---------- Прочее ---------- */
export function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: Tone }) {
  return (
    <div className="rounded-lg border-2 border-ink bg-surface px-4 py-3">
      <div className={cx('text-2xl font-bold tracking-tight', tone === 'danger' && 'text-danger', tone === 'ok' && 'text-ok')}>{value}</div>
      <div className="mt-0.5 text-xs font-medium text-faint">{label}</div>
    </div>
  );
}

export function MockBanner({ text = 'Демо-режим: данные показательные, backend не подключён' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border-2 border-warn bg-warn/15 px-4 py-2 text-xs font-bold text-ink">
      <span aria-hidden>⚠️</span>{text}
    </div>
  );
}
