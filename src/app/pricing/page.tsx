import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader, SiteFooter, Section, PageHero } from '@/components/site/Chrome';
import { Reveal } from '@/components/site/motion';
import { Button, Card, Badge } from '@/components/ui';
import { COMMISSION_PERCENT } from '@/lib/pricing';

export const metadata: Metadata = {
  title: 'Тарифы — TEYDO',
  description: 'Создание задачи, поиск и отклики бесплатны. Платформа берёт комиссию только с успешной сделки.',
};

const FREE = [
  'Регистрация и профиль',
  'Создание задачи',
  'Поиск задач и исполнителей',
  'Отклик на задачу',
  'Переписка в чате',
  'Отзывы и рейтинг',
  'Уведомления',
  'Обращение в поддержку',
];

const PAID: { t: string; price: string; d: string }[] = [
  {
    t: 'Комиссия с успешной сделки',
    price: `${COMMISSION_PERCENT}%`,
    d: 'Списывается один раз, из суммы заказа, в момент когда заказчик принял работу. Не состоялась сделка — не списывается ничего.',
  },
  {
    t: 'Отменённый заказ',
    price: '0 ₽',
    d: 'Отмена до начала работы возвращает заказчику всю сумму. Комиссия не удерживается.',
  },
  {
    t: 'Спор в пользу заказчика',
    price: '0 ₽',
    d: 'Если спор решён в пользу заказчика, деньги возвращаются ему целиком, вместе с комиссией.',
  },
];

const EXAMPLES = [
  { sum: 2000 }, { sum: 5000 }, { sum: 12000 }, { sum: 30000 },
];

const rub = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHero
          eyebrow="Тарифы"
          title="Мы зарабатываем, когда вы зарабатываете"
          sub={`Один тариф для всех. Всё, что нужно для сделки, — бесплатно. Платформа берёт ${COMMISSION_PERCENT}% только тогда, когда работа принята и деньги переходят исполнителю.`}
        >
          <div className="flex flex-wrap gap-3">
            <Link href="/app/create"><Button size="lg">Создать задачу — 0 ₽</Button></Link>
            <Link href="/app?intent=executor"><Button size="lg" variant="outline">Откликнуться — 0 ₽</Button></Link>
          </div>
        </PageHero>

        <Section>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <Card className="toon p-8">
              <Badge tone="sand" className="mb-4">Бесплатно навсегда</Badge>
              <div className="flex items-end gap-2">
                <span className="text-[clamp(3rem,9vw,5rem)] font-extrabold leading-none tracking-tight">0</span>
                <span className="mb-2 text-2xl font-extrabold">₽</span>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                Ни подписок, ни платных откликов, ни «пакетов показов». Это не акция и не пробный период.
              </p>
              <ul className="mt-6 space-y-2.5">
                {FREE.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[15px]">
                    <span aria-hidden className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-ink bg-brand text-[11px] leading-none text-white">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </Card>

            <div className="flex flex-col gap-5">
              <Card className="toon bg-brand p-8 text-white">
                <Badge tone="neutral" className="mb-4">Платно только это</Badge>
                <div className="flex items-end gap-2">
                  <span className="text-[clamp(3rem,9vw,5rem)] font-extrabold leading-none tracking-tight">{COMMISSION_PERCENT}</span>
                  <span className="mb-2 text-2xl font-extrabold">%</span>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-white/90">
                  Комиссия с суммы успешной сделки. Показывается отдельной строкой до оплаты — вы видите её заранее, а не находите в чеке.
                </p>
              </Card>

              {PAID.map((p) => (
                <Reveal key={p.t}><Card className="toon h-full flex items-start justify-between gap-5 p-6">
                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight">{p.t}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{p.d}</p>
                  </div>
                  <span className="shrink-0 rounded-full border-3 border-ink bg-sand px-4 py-1.5 text-base font-extrabold">
                    {p.price}
                  </span>
                </Card></Reveal>
              ))}
            </div>
          </div>
        </Section>

        <Section
          eyebrow="Считаем вслух"
          title="Сколько останется исполнителю"
          sub={`Комиссия ${COMMISSION_PERCENT}% удерживается из суммы заказа. Ниже — та же арифметика на конкретных цифрах.`}
          className="!pt-0"
        >
          <Card className="toon overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b-3 border-ink bg-surface">
                    <th className="p-4 text-sm font-bold">Сумма заказа</th>
                    <th className="p-4 text-sm font-bold">Платит заказчик</th>
                    <th className="p-4 text-sm font-bold text-muted">Комиссия {COMMISSION_PERCENT}%</th>
                    <th className="p-4 text-sm font-extrabold text-brand">Получит исполнитель</th>
                  </tr>
                </thead>
                <tbody>
                  {EXAMPLES.map((e) => {
                    const fee = Math.round((e.sum * COMMISSION_PERCENT) / 100);
                    return (
                      <tr key={e.sum} className="border-b-2 border-ink/10 last:border-0">
                        <td className="p-4 text-[15px] font-bold">{rub(e.sum)}</td>
                        <td className="p-4 text-[15px]">{rub(e.sum)}</td>
                        <td className="p-4 text-[15px] text-muted">−{rub(fee)}</td>
                        <td className="p-4 text-[15px] font-extrabold">{rub(e.sum - fee)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-faint">
            Значение комиссии задаётся в настройках платформы и может отличаться по категориям. Итоговая сумма
            всегда показывается в заказе до оплаты — ориентируйтесь на неё, а не на эту таблицу.
          </p>
        </Section>

        <Section eyebrow="Почему так" title="Что мы этим покупаем" className="!pt-0">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { t: 'Отклик не должен стоить денег', d: 'Платный отклик — это налог на попытку. Он бьёт по новичкам и по тем, у кого сегодня нет заказов.' },
              { t: 'Интересы совпадают', d: 'Если платформа зарабатывает только на состоявшихся сделках, ей выгодно, чтобы сделки состоялись и обе стороны вернулись.' },
              { t: 'Нет мёртвых задач', d: 'Никто не платит за размещение, поэтому мы можем спокойно убирать вниз задачи, актуальность которых не подтвердили.' },
              { t: 'Понятная цена', d: 'Одна цифра вместо тарифной сетки из пяти планов, где нужное всегда в самом дорогом.' },
              { t: 'Деньги под защитой', d: 'Комиссия оплачивает работу платёжного контура: резерв средств, возвраты, разбор споров.' },
              { t: 'Нет платных мест в выдаче', d: 'Позиция в выдаче определяется совпадением с задачей. Купить верх списка нельзя.' },
            ].map((x) => (
              <Reveal key={x.t}><Card className="toon h-full p-6">
                <h3 className="text-lg font-extrabold tracking-tight">{x.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{x.d}</p>
              </Card></Reveal>
            ))}
          </div>
        </Section>

        <Section className="!pb-24 !pt-0">
          <Card className="toon bg-ink p-10 text-center text-paper shadow-pop-lg sm:p-14">
            <h2 className="text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Начать ничего не стоит
            </h2>
            <p className="mx-auto mt-4 max-w-[46ch] text-[16px] text-paper/80">
              Проверьте сами: создайте задачу или откликнитесь. Деньги появятся в разговоре только когда появится сделка.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/app"><Button size="lg">Открыть приложение</Button></Link>
              <Link href="/payments"><Button size="lg" variant="outline">Как проходит оплата</Button></Link>
            </div>
          </Card>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
