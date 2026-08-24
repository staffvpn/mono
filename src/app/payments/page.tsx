import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader, SiteFooter, Section, PageHero } from '@/components/site/Chrome';
import { Reveal } from '@/components/site/motion';
import { Button, Card, Badge } from '@/components/ui';
import { ArtMoney, ArtDispute, ArtDone } from '@/components/ui/art';
import { COMMISSION_PERCENT } from '@/lib/pricing';

export const metadata: Metadata = {
  title: 'Оплата и комиссия — TEYDO',
  description: 'Как проходит оплата: резерв средств, приёмка работы, перевод исполнителю, возвраты и споры.',
};

const FLOW = [
  { t: 'Условия согласованы', d: 'Сумма, срок и объём зафиксированы обеими сторонами. До этого момента оплата невозможна — платить не за что.' },
  { t: 'Заказчик оплачивает', d: 'Средства списываются и резервируются. Исполнитель видит, что деньги на месте, но получить их пока не может.' },
  { t: 'Исполнитель работает', d: 'Переписка, фото, изменения условий — всё это сохраняется и в случае спора станет материалом дела.' },
  { t: 'Заказчик принимает работу', d: 'Приёмка — отдельное осознанное действие. Не приняли — деньги остаются в резерве.' },
  { t: 'Перевод исполнителю', d: `Сумма уходит исполнителю за вычетом комиссии платформы (${COMMISSION_PERCENT}%). Обе стороны получают возможность оставить отзыв.` },
];

const CASES = [
  { t: 'Исполнитель не вышел на связь', d: 'Откройте «Помощь с заказом». Заказ уходит на рассмотрение, деньги остаются в резерве и не переводятся исполнителю.', tone: 'warn' as const },
  { t: 'Работа сделана плохо', d: 'Не подтверждайте приёмку и откройте спор с описанием и фото. Пока идёт разбирательство, средства удерживаются.', tone: 'warn' as const },
  { t: 'Заказчик передумал до старта', d: 'Отмена до начала работы возвращает всю сумму, комиссия не удерживается.', tone: 'ok' as const },
  { t: 'Изменился объём работы', d: 'Новые условия оформляются как изменение заказа и требуют согласия обеих сторон. Доплата проходит тем же путём: резерв → приёмка → перевод.', tone: 'ok' as const },
  { t: 'Договорились мимо площадки', d: 'Тогда резерв, история условий и разбор спора не действуют: защищать нечего, платёж вне системы мы не видим.', tone: 'danger' as const },
];

export default function PaymentsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHero
          eyebrow="Оплата"
          title="Деньги ждут, пока работа не принята"
          sub="Заказчик платит заранее, но исполнитель получает после приёмки. Это защищает обоих: один не остаётся без работы, другой — без оплаты."
        >
          <div className="flex flex-wrap gap-3">
            <Link href="/pricing"><Button size="lg">Тарифы и комиссия</Button></Link>
            <Link href="/safety"><Button size="lg" variant="outline">Безопасность сделки</Button></Link>
          </div>
        </PageHero>

        <Section eyebrow="Путь денег" title="Пять состояний платежа">
          <ol className="grid gap-4 lg:grid-cols-5">
            {FLOW.map((f, i) => (
              <li key={f.t}>
                <Card className="toon flex h-full flex-col p-6">
                  <span className="mb-3 grid h-10 w-10 place-items-center rounded-full border-3 border-ink bg-brand text-base font-extrabold text-white shadow-pop-sm">
                    {i + 1}
                  </span>
                  <h3 className="text-[17px] font-extrabold leading-tight tracking-tight">{f.t}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.d}</p>
                </Card>
              </li>
            ))}
          </ol>
        </Section>

        <Section className="!pt-0">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="toon p-8">
              <ArtMoney className="h-20 w-auto" />
              <h3 className="mt-4 text-2xl font-extrabold tracking-tight">Комиссия видна заранее</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                В заказе комиссия показана отдельной строкой до того, как вы нажмёте «Оплатить».
                Сумма к оплате и сумма к получению написаны рядом — считать в уме не нужно.
              </p>
            </Card>
            <Card className="toon p-8">
              <ArtDone className="h-20 w-auto" />
              <h3 className="mt-4 text-2xl font-extrabold tracking-tight">Приёмка — это действие</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                Деньги не уходят «сами через три дня» без вашего ведома. Пока заказчик не принял работу,
                платёж остаётся зарезервированным.
              </p>
            </Card>
            <Card className="toon p-8">
              <ArtDispute className="h-20 w-auto" />
              <h3 className="mt-4 text-2xl font-extrabold tracking-tight">Спор замораживает платёж</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                Открытый спор блокирует перевод до решения. Ни одна из сторон не может утащить деньги,
                пока разбирательство идёт.
              </p>
            </Card>
          </div>
        </Section>

        <Section eyebrow="Что если" title="Разбор пяти неприятных ситуаций" className="!pt-0">
          <div className="grid gap-4 md:grid-cols-2">
            {CASES.map((c) => (
              <Reveal key={c.t}><Card className="toon h-full p-6">
                <Badge tone={c.tone === 'ok' ? 'sand' : c.tone === 'warn' ? 'brand' : 'neutral'} className="mb-3">
                  {c.tone === 'ok' ? 'Решается штатно' : c.tone === 'warn' ? 'Через спор' : 'Вне защиты'}
                </Badge>
                <h3 className="text-lg font-extrabold tracking-tight">{c.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{c.d}</p>
              </Card></Reveal>
            ))}
          </div>
        </Section>

        <Section eyebrow="Без иллюзий" title="Что мы говорим честно" className="!pt-0">
          <Card className="toon bg-surface p-8 sm:p-10">
            <ul className="grid gap-5 md:grid-cols-2">
              {[
                ['Платёжный провайдер подключается отдельно', 'Приём платежей выполняет лицензированный провайдер. Пока он не подключён к аккаунту площадки, экраны оплаты работают в демонстрационном режиме и настоящих списаний не происходит.'],
                ['Мы не храним данные карт', 'Реквизиты вводятся на стороне платёжного провайдера. Платформе достаточно знать статус платежа.'],
                ['Статус платежа считает сервер', 'Клиент не может объявить платёж успешным. Итоговое состояние приходит от провайдера на сервер.'],
                ['Возврат идёт тем же путём', 'Деньги возвращаются на тот же способ оплаты. Сроки зависят от банка, а не от площадки.'],
              ].map(([t, d]) => (
                <li key={t}>
                  <h3 className="text-lg font-extrabold tracking-tight">{t}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{d}</p>
                </li>
              ))}
            </ul>
          </Card>
        </Section>

        <Section className="!pb-24 !pt-0">
          <Card className="toon bg-brand p-10 text-center text-white shadow-pop-lg sm:p-14">
            <h2 className="text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Оплата после результата
            </h2>
            <p className="mx-auto mt-4 max-w-[46ch] text-[16px] text-white/90">
              Создайте задачу — платить придётся только тогда, когда будет за что.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/app/create"><Button size="lg" variant="ink">Создать задачу</Button></Link>
              <Link href="/help"><Button size="lg" variant="outline">Помощь и споры</Button></Link>
            </div>
          </Card>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
