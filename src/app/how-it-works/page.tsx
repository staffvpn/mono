import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader, SiteFooter, Section, PageHero } from '@/components/site/Chrome';
import { Button, Card, Badge } from '@/components/ui';
import {
  ArtSearching, ArtReply, ArtDeal, ArtWork, ArtDone, ArtMoney,
} from '@/components/ui/art';

export const metadata: Metadata = {
  title: 'Как это работает — TEYDO',
  description: 'Путь задачи от описания до оплаты: для заказчика и для исполнителя, шаг за шагом.',
};

const CUSTOMER = [
  { t: 'Опишите задачу словами', d: 'Пишите как есть: «завтра к 18:00 собрать шкаф на Ленина 5, тысячи три». Мы разложим это на категорию, дату, время, адрес и бюджет и покажем на подтверждение — поля можно поправить вручную.', art: <ArtSearching /> },
  { t: 'Не знаете цену — не выдумывайте', d: 'Поставьте «цена договорная»: мы покажем ориентир по похожим задачам в вашем городе и предложим исполнителям назвать свою.', art: <ArtMoney /> },
  { t: 'Получите подходящих людей', d: 'Вместо ленты из сотен объявлений — исполнители, у которых совпала категория, район и цена. Рядом с каждым написано, почему он подходит.', art: <ArtReply /> },
  { t: 'Задайте вопросы в чате', d: 'Чат открывается после отклика. Уточните детали, попросите фото прошлых работ, договоритесь о времени.', art: <ArtDeal /> },
  { t: 'Зафиксируйте условия', d: 'Что, за сколько, когда и где. Условия становятся действующими только когда их подтвердили обе стороны. Любое изменение — новое согласие.', art: <ArtWork /> },
  { t: 'Примите работу и оплатите', d: 'Деньги резервируются заранее и уходят исполнителю после того, как вы приняли результат. Не приняли — открывается спор, средства удерживаются.', art: <ArtDone /> },
];

const EXECUTOR = [
  { t: 'Заполните профиль', d: 'Категории, район работы, ставка, примеры работ. Профиль бесплатный — платных «премиум-аккаунтов ради показов» нет.' },
  { t: 'Найдите задачи рядом', d: 'Фильтр по расстоянию начинается с 1 км. Рядом с задачей видно совпадение с вашим профилем и почему оно такое.' },
  { t: 'Откликнитесь бесплатно', d: 'Отклик не стоит ничего — всегда, а не первые три. Напишите цену, срок и короткое сообщение.' },
  { t: 'Посмотрите на заказчика', d: 'У заказчика тоже есть рейтинг: адекватность, точность описания, пунктуальность, оплата. Вы решаете, идти ли работать.' },
  { t: 'Согласуйте условия', d: 'Пока обе стороны не подтвердили условия, заказ не стартует. Это защищает от «мы же договаривались по-другому».' },
  { t: 'Сделайте работу и получите деньги', d: 'Оплата уже зарезервирована. После приёмки она уходит вам за вычетом комиссии платформы, которая видна до старта.' },
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

        <Section eyebrow="Заказчику" title="Шесть шагов, если вам нужно, чтобы дело сделали">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {CUSTOMER.map((c, i) => (
              <Card key={c.t} className={`flex flex-col gap-4 p-6 ${i % 3 === 1 ? '-rotate-1' : i % 3 === 2 ? 'rotate-1' : ''}`}>
                <div className="opacity-90">{c.art}</div>
                <div>
                  <div className="mb-1 text-sm font-bold text-brand">Шаг {i + 1}</div>
                  <h3 className="text-xl font-extrabold tracking-tight">{c.t}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{c.d}</p>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section eyebrow="Исполнителю" title="Шесть шагов, если вы хотите заработать" className="!pt-0">
          <Card className="bg-brand p-8 text-white sm:p-10">
            <ol className="grid gap-6 sm:grid-cols-2">
              {EXECUTOR.map((e, i) => (
                <li key={e.t} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-3 border-ink bg-white text-base font-extrabold text-ink">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight">{e.t}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-white/85">{e.d}</p>
                  </div>
                </li>
              ))}
            </ol>
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
                  className="absolute -left-[38px] top-3 grid h-6 w-6 place-items-center rounded-full border-3 border-ink bg-brand text-[10px] font-extrabold text-white sm:-left-[46px]"
                >
                  {i + 1}
                </span>
                <Card className="p-5">
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
              <Card key={x.t} className="p-6">
                <Badge tone="sand" className="mb-3">Важно</Badge>
                <h3 className="text-lg font-extrabold tracking-tight">{x.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{x.d}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section className="!pb-24 !pt-0">
          <Card className="bg-ink p-10 text-center text-paper shadow-pop-lg sm:p-14">
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
