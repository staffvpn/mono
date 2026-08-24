import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader, SiteFooter, Section, PageHero } from '@/components/site/Chrome';
import { Button, Card, Badge } from '@/components/ui';
import {
  ArtSearching, ArtReply, ArtDeal, ArtDone, ArtMoney, ArtSupport,
} from '@/components/ui/art';
import { Reveal, Sparkle } from '@/components/site/motion';

export const metadata: Metadata = {
  title: 'Как это работает — TEYDO',
  description: 'Путь задачи от описания до оплаты: для заказчика и для исполнителя, шаг за шагом.',
};

const CUSTOMER = [
  { t: 'Опишите задачу', d: 'Обычными словами: «завтра к шести собрать шкаф на Ленина 5, тысячи три». Мы разложим это на категорию, дату, адрес и бюджет — вы только подтвердите.', art: <ArtSearching /> },
  { t: 'Выберите из откликов', d: 'Вместо ленты из сотен объявлений — люди, у которых совпала категория, район и цена. Рядом написано, почему совпало.', art: <ArtReply /> },
  { t: 'Зафиксируйте условия', d: 'Что, за сколько, когда и где. Условия вступают в силу, только когда их подтвердили обе стороны.', art: <ArtDeal /> },
  { t: 'Примите работу', d: 'Деньги резервируются заранее и уходят исполнителю после того, как вы приняли результат. Не приняли — открывается спор.', art: <ArtDone /> },
];

const EXECUTOR = [
  { t: 'Заполните профиль', d: 'Категории, район, ставка, примеры работ. Бесплатно: платных «премиум-аккаунтов ради показов» здесь нет.', art: <ArtSupport /> },
  { t: 'Найдите задачи рядом', d: 'Фильтр по расстоянию начинается с одного километра. У каждой задачи видно совпадение с вашим профилем.', art: <ArtSearching /> },
  { t: 'Откликнитесь', d: 'Отклик не стоит ничего — всегда, а не первые три. Цена, срок и короткое сообщение.', art: <ArtReply /> },
  { t: 'Сделайте и получите', d: 'Оплата уже зарезервирована. После приёмки она уходит вам за вычетом комиссии, которая видна до старта.', art: <ArtMoney /> },
];

const TIMELINE = [
  { s: 'Черновик', d: 'Задача создана, но ещё не опубликована. Видна только вам.' },
  { s: 'Опубликована', d: 'Задача в поиске, исполнители могут откликаться.' },
  { s: 'Идут отклики', d: 'Пришли предложения, открылись чаты. Можно сравнивать.' },
  { s: 'Исполнитель выбран', d: 'Создан заказ. Условия ждут подтверждения обеих сторон.' },
  { s: 'Условия согласованы', d: 'Обе стороны нажали «Подтверждаю». Можно оплачивать.' },
  { s: 'Оплата зарезервирована', d: 'Деньги списаны у заказчика, но исполнителю ещё не переданы.' },
  { s: 'В работе', d: 'Исполнитель делает задачу. Переписка и материалы сохраняются.' },
  { s: 'На приёмке', d: 'Исполнитель отметил выполнение, заказчик проверяет.' },
  { s: 'Завершён', d: 'Работа принята, деньги переведены, обе стороны ставят оценку.' },
];

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHero
          eyebrow="Как это работает"
          title="Путь задачи — от одной фразы до перевода денег"
          sub="Ниже — весь процесс без сокращений: что делает заказчик, что делает исполнитель и что в это время делает платформа."
        >
          <div className="flex flex-wrap gap-3">
            <Link href="/app?intent=customer"><Button size="lg">Мне нужна помощь</Button></Link>
            <Link href="/app?intent=executor"><Button size="lg" variant="outline">Хочу заработать</Button></Link>
          </div>
        </PageHero>

        <Section eyebrow="Заказчику" title="Если нужно, чтобы дело сделали">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CUSTOMER.map((c, i) => (
              <Reveal key={c.t}>
                <Card className={`toon relative h-full overflow-visible p-6 pt-9 ${i % 2 ? 'rotate-1' : '-rotate-1'}`}>
                  <span className="absolute -left-3 -top-4 grid h-11 w-11 place-items-center rounded-full border-3 border-ink bg-brand text-lg font-extrabold leading-none text-white shadow-pop-sm">
                    {i + 1}
                  </span>
                  <div className="mb-4 grid h-24 place-items-center rounded-lg border-2 border-ink/15 bg-surface">
                    {c.art}
                  </div>
                  <h3 className="text-lg font-extrabold leading-tight tracking-tight">{c.t}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{c.d}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section eyebrow="Исполнителю" title="Если хотите заработать" className="!pt-0">
          <Card className="toon relative overflow-hidden bg-brand p-6 sm:p-9">
            <Sparkle aria-hidden className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 animate-twinkle opacity-70" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {EXECUTOR.map((e, i) => (
                <Reveal key={e.t}>
                  <div className="toon relative h-full rounded-xl border-3 border-ink bg-card p-6 pt-9 shadow-pop-sm">
                    <span className="absolute -left-3 -top-4 grid h-11 w-11 place-items-center rounded-full border-3 border-ink bg-ink text-lg font-extrabold leading-none text-paper shadow-pop-sm">
                      {i + 1}
                    </span>
                    <div className="mb-4 grid h-24 place-items-center rounded-lg border-2 border-ink/15 bg-surface">
                      {e.art}
                    </div>
                    <h3 className="text-lg font-extrabold leading-tight tracking-tight">{e.t}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted">{e.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Card>
        </Section>

        <Section
          eyebrow="Статусы"
          title="Что происходит с задачей на каждом шаге"
          sub="Статус виден обеим сторонам одинаково — никто не гадает, на чьей стороне мяч."
        >
          <ol className="relative grid gap-4 border-l-3 border-ink pl-7 sm:pl-9">
            {TIMELINE.map((t, i) => (
              <li key={t.s} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[38px] top-3 grid h-6 w-6 place-items-center rounded-full border-3 border-ink bg-brand text-[10px] font-extrabold leading-none text-white sm:-left-[46px]"
                >
                  {i + 1}
                </span>
                <Card className="toon p-5">
                  <h3 className="text-[17px] font-extrabold tracking-tight">{t.s}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-muted">{t.d}</p>
                </Card>
              </li>
            ))}
          </ol>
        </Section>

        <Section eyebrow="Честно" title="Что платформа НЕ делает" className="!pt-0">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { t: 'Не выполняет работу', d: 'Задачи выполняют люди. Платформа отвечает за площадку, правила и сделку, а не за руки исполнителя.' },
              { t: 'Не гарантирует результат', d: 'Мы фиксируем условия и удерживаем деньги до приёмки. Это не то же самое, что обещание идеального ремонта.' },
              { t: 'Не берёт деньги за отклик', d: 'Ни разово, ни подпиской, ни «пакетом откликов». Заработок платформы привязан к успешной сделке.' },
              { t: 'Не рисует отзывы', d: 'Отзыв может оставить только участник завершённого заказа. Пока таких заказов нет — раздел пуст, а не заполнен придуманными.' },
              { t: 'Не показывает выдуманную статистику', d: 'Если цифры нет — мы пишем «нет данных». Ноль и «нет данных» — разные вещи.' },
              { t: 'Не продаёт места в выдаче', d: 'Порядок выдачи определяется совпадением с задачей, а не оплатой за показы.' },
            ].map((x) => (
              <Reveal key={x.t}><Card className="toon h-full p-6">
                <Badge tone="sand" className="mb-3">Важно</Badge>
                <h3 className="text-lg font-extrabold tracking-tight">{x.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{x.d}</p>
              </Card></Reveal>
            ))}
          </div>
        </Section>

        <Section className="!pb-24 !pt-0">
          <Card className="toon bg-ink p-10 text-center text-paper shadow-pop-lg sm:p-14">
            <h2 className="text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Понятно? Тогда попробуйте
            </h2>
            <p className="mx-auto mt-4 max-w-[46ch] text-[16px] text-paper/80">
              Создать задачу и откликнуться — бесплатно. Комиссия появляется только при успешной сделке.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/app/create"><Button size="lg">Создать задачу</Button></Link>
              <Link href="/pricing"><Button size="lg" variant="outline">Сколько это стоит</Button></Link>
            </div>
          </Card>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
