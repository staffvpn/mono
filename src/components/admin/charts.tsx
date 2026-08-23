'use client';

import { useState, useId } from 'react';
import { cx } from '@/components/ui';

/* ============================================================
   Графики админки.
   Одна серия на график с переключателем метрики: две шкалы на одной
   оси искажают сравнение, поэтому вторую ось не рисуем никогда.
   Цвет — один фирменный оттенок, идентичность несёт заголовок,
   поэтому легенда для одной серии не нужна.
   ============================================================ */

export interface Point { label: string; value: number }

const fmt = (n: number) => n.toLocaleString('ru-RU');

export function LineChart({ data, title, unit = '', height = 220 }: {
  data: Point[]; title: string; unit?: string; height?: number;
}) {
  const uid = useId();
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);

  if (data.length === 0) return <Empty title={title} />;

  const w = 640;
  const h = height;
  const pad = { l: 44, r: 16, t: 16, b: 26 };
  const max = Math.max(...data.map((d) => d.value)) || 1;
  const min = 0;
  const x = (i: number) => pad.l + (i * (w - pad.l - pad.r)) / Math.max(1, data.length - 1);
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)},${y(min)} L${x(0).toFixed(1)},${y(min)} Z`;
  const ticks = [0, 0.5, 1].map((t) => Math.round(min + t * (max - min)));
  const last = data[data.length - 1];

  return (
    <figure className="rounded-lg border-2 border-ink bg-card p-4">
      <figcaption className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold">{title}</span>
        <span className="text-2xl font-extrabold tabular-nums tracking-tight">{fmt(last.value)}{unit}</span>
      </figcaption>

      {!table ? (
        <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${title}: последнее значение ${fmt(last.value)}${unit}`}
          className="w-full" onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id={`g${uid}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--c-brand))" stopOpacity="0.28" />
              <stop offset="100%" stopColor="rgb(var(--c-brand))" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* сетка держится в фоне, чтобы не спорить с данными */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke="rgb(var(--c-ink))" strokeOpacity="0.12" strokeWidth="1" />
              <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11"
                fill="rgb(var(--c-faint))" className="tabular-nums">{fmt(t)}</text>
            </g>
          ))}

          <path d={area} fill={`url(#g${uid})`} />
          <path d={line} fill="none" stroke="rgb(var(--c-brand))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* последняя точка подписана — числа на каждой точке только мешают */}
          <circle cx={x(data.length - 1)} cy={y(last.value)} r="5"
            fill="rgb(var(--c-brand))" stroke="rgb(var(--c-card))" strokeWidth="2" />

          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={h - pad.b}
                stroke="rgb(var(--c-ink))" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(data[hover].value)} r="6"
                fill="rgb(var(--c-brand))" stroke="rgb(var(--c-card))" strokeWidth="2" />
            </g>
          )}

          {/* зоны наведения шире отметок, иначе в них не попасть */}
          {data.map((d, i) => (
            <rect key={i} x={x(i) - (w / data.length) / 2} y={0} width={w / data.length} height={h}
              fill="transparent" onMouseEnter={() => setHover(i)}>
              <title>{`${d.label}: ${fmt(d.value)}${unit}`}</title>
            </rect>
          ))}

          <text x={pad.l} y={h - 6} fontSize="11" fill="rgb(var(--c-faint))">{data[0].label}</text>
          <text x={w - pad.r} y={h - 6} fontSize="11" textAnchor="end" fill="rgb(var(--c-faint))">{last.label}</text>
        </svg>
      ) : (
        <div className="max-h-56 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b-2 border-ink"><th className="py-1">Дата</th><th className="py-1 text-right">Значение</th></tr></thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.label} className="border-b border-ink/10">
                  <td className="py-1">{d.label}</td>
                  <td className="py-1 text-right tabular-nums">{fmt(d.value)}{unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button onClick={() => setTable((v) => !v)} className="mt-2 text-xs font-bold text-brand">
        {table ? 'Показать график' : 'Показать таблицей'}
      </button>
    </figure>
  );
}

export function Funnel({ steps, title }: { steps: { label: string; value: number; share: number }[]; title: string }) {
  const max = Math.max(...steps.map((s) => s.value)) || 1;
  return (
    <figure className="rounded-lg border-2 border-ink bg-card p-4">
      <figcaption className="mb-3 text-sm font-bold">{title}</figcaption>
      <div className="flex flex-col gap-2">
        {steps.map((s, i) => {
          const prev = i === 0 ? null : steps[i - 1];
          const drop = prev ? Math.round((1 - s.value / prev.value) * 100) : 0;
          return (
            <div key={s.label} className="flex items-center gap-2 sm:gap-3">
              <span className="w-24 shrink-0 truncate text-sm sm:w-40">{s.label}</span>
              <span className="relative h-7 min-w-0 flex-1 overflow-hidden rounded-sm bg-surface">
                <span className="absolute inset-y-0 left-0 rounded-sm bg-brand"
                  style={{ width: `${(s.value / max) * 100}%` }} />
              </span>
              <span className="w-12 shrink-0 text-right text-sm font-bold tabular-nums sm:w-16">{fmt(s.value)}</span>
              <span className={cx('w-11 shrink-0 text-right text-xs tabular-nums sm:w-14',
                drop > 40 ? 'font-bold text-danger' : 'text-faint')}>
                {i === 0 ? '100%' : `−${drop}%`}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-faint">
        Красным отмечены переходы, где теряется больше 40% — там стоит искать проблему.
      </p>
    </figure>
  );
}

function Empty({ title }: { title: string }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-ink/40 p-6 text-center">
      <div className="text-sm font-bold">{title}</div>
      <p className="mt-1 text-xs text-faint">Данных пока нет</p>
    </div>
  );
}
