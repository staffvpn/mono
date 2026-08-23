# Схема базы данных

Модель повторяет `src/types/index.ts`: когда появится настоящий backend, слой
сервисов переключается на HTTP, а UI не меняется.

Диалект — PostgreSQL. Идентификаторы — `uuid`, время — `timestamptz` в UTC.

Общие правила:

* **Мягкое удаление.** Ничего не удаляется физически: у сущностей, которые может
  «удалить» пользователь или модератор, есть `deleted_at`. Реальное удаление —
  только по истечении сроков хранения и отдельным регламентом.
* **Деньги — в копейках**, целыми числами. `numeric` для сумм не используем.
* **Считает сервер.** Цена, комиссия, рейтинг, статус платежа приходят с клиента
  только как пожелание и всегда пересчитываются.
* **Журнал действий администраторов дописывается, но не правится.**

---

## users

| Поле | Тип | Примечание |
|---|---|---|
| id | uuid pk | |
| name | text not null | |
| username | text | Telegram, без `@` |
| phone | text unique | E.164 |
| telegram_id | bigint unique | |
| avatar_url | text | |
| city | text | |
| district | text | |
| status | text not null | `active` / `limited` / `blocked` / `pending_review` |
| active_role | text not null | `customer` / `executor` — роль, а не отдельный аккаунт |
| created_at | timestamptz not null | |
| last_seen_at | timestamptz | |
| deleted_at | timestamptz | мягкое удаление |

Индексы: `telegram_id`, `phone`, `(city, status)`.

## verifications

| Поле | Тип | Примечание |
|---|---|---|
| id | uuid pk | |
| user_id | uuid fk → users | |
| kind | text | `phone` / `telegram` / `identity` / `documents` |
| status | text | `none` / `pending` / `approved` / `rejected` / `more_info` |
| note | text | причина отказа |
| updated_at | timestamptz | |

Уникальность: `(user_id, kind)`.

## reputations

Считается фоновой задачей, а не на лету при отрисовке.

| Поле | Тип | Примечание |
|---|---|---|
| user_id | uuid pk fk → users | |
| rating | numeric(3,2) | **null = оценок не было.** Ноль — это оценка «ноль» |
| reviews_count | int not null default 0 | |
| orders_completed | int not null default 0 | |
| orders_cancelled | int not null default 0 | |
| success_rate | numeric(4,3) | null, пока заказов нет |
| response_minutes | int | null, пока нет переписки |
| repeat_customers | int not null default 0 | |
| trust_index | int | 0..100, внутренний, наружу не отдаётся |

## executor_profiles

| Поле | Тип |
|---|---|
| user_id | uuid pk fk → users |
| headline | text |
| about | text |
| experience_years | int |
| rate_from | int (копейки) |
| district | text |
| availability | jsonb (`today`/`tomorrow`/`this_week`/`by_agreement`) |

Связь категорий — таблица `executor_categories(user_id, category_id)`.
Портфолио — `portfolio_items(id, user_id, title, image_url, created_at)`.

## categories

| Поле | Тип | Примечание |
|---|---|---|
| id | uuid pk | |
| slug | text unique | |
| name | text | |
| emoji | text | |
| parent_id | uuid fk → categories | null для корневых |
| sort_order | int | |
| enabled | bool | выключенная категория скрыта из создания задач |
| requires_identity | bool | категории повышенного риска |

## tasks

| Поле | Тип | Примечание |
|---|---|---|
| id | uuid pk | |
| author_id | uuid fk → users | |
| title | text not null | |
| description | text not null | |
| category_id | uuid fk → categories | |
| subcategory_id | uuid fk → categories | |
| address | text | точный адрес виден только выбранному исполнителю |
| district | text | |
| city | text | |
| lat, lon | double precision | для расчёта расстояния |
| date | date | null = «когда удобно» |
| time_window | text | |
| urgency | text | `now` / `today` / `date` / `flexible` |
| budget_amount | int | копейки; null при договорной цене |
| budget_min, budget_max | int | ориентир, если сумма не указана |
| budget_unknown | bool | |
| pay_method | text | |
| extra_terms | text | |
| relevance | text | `active` / `comparing` / `needs_confirm` / `inactive` / `done` |
| moderation | text | `draft` / `published` / `hidden` / `rejected` |
| moderation_reason | text | |
| applications_count | int | денормализация ради списков |
| views_count | int | |
| reports_count | int | |
| created_at, updated_at | timestamptz | |
| deleted_at | timestamptz | |

Индексы: `(moderation, relevance, created_at desc)`, `(category_id)`, `(author_id)`,
геоиндекс по `(lat, lon)`.

Фото задач — `task_photos(id, task_id, url, sort_order)`.

## applications

| Поле | Тип | Примечание |
|---|---|---|
| id | uuid pk | |
| task_id | uuid fk → tasks | |
| executor_id | uuid fk → users | |
| price | int | копейки |
| message | text | |
| can_start | text | когда готов приступить |
| status | text | `sent` / `viewed` / `chosen` / `declined` / `withdrawn` |
| created_at | timestamptz | |

Уникальность: `(task_id, executor_id)` — один отклик на задачу.
Отклик всегда бесплатный: платы за создание записи нет ни в каком виде.

## orders

| Поле | Тип | Примечание |
|---|---|---|
| id | uuid pk | |
| task_id | uuid fk → tasks | |
| customer_id | uuid fk → users | |
| executor_id | uuid fk → users | |
| status | text | `created` / `terms_pending` / `terms_agreed` / `paid` / `in_progress` / `review` / `done` / `cancelled` / `disputed` |
| commission_percent | numeric(4,2) | зафиксирован на момент сделки |
| created_at, updated_at | timestamptz | |

## order_changes

Условия сделки — **история, а не поле**. Действующими считаются условия, у которых
обе стороны проставили согласие.

| Поле | Тип |
|---|---|
| id | uuid pk |
| order_id | uuid fk → orders |
| by_user_id | uuid fk → users |
| terms | jsonb (предмет, сумма, срок, место) |
| accepted_by_customer | bool |
| accepted_by_executor | bool |
| created_at | timestamptz |

## payments

| Поле | Тип | Примечание |
|---|---|---|
| id | uuid pk | |
| order_id | uuid fk → orders | |
| provider | text | |
| provider_payment_id | text | идентификатор на стороне провайдера |
| amount | int | копейки |
| commission | int | копейки |
| status | text | `pending` / `held` / `released` / `refunded` / `failed` |
| created_at, updated_at | timestamptz | |

**Статус меняется только по подтверждению провайдера.** Запрос клиента
«платёж прошёл» не является основанием. Уникальность `(provider, provider_payment_id)`
защищает от повторной обработки вебхука.

## threads / messages

`threads(id, task_id, order_id, customer_id, executor_id, created_at, last_message_at)`

`messages(id, thread_id, author_id, text, attachments jsonb, created_at, read_at, deleted_at)`

Индекс: `(thread_id, created_at)`.

## reviews

| Поле | Тип | Примечание |
|---|---|---|
| id | uuid pk | |
| order_id | uuid fk → orders | |
| author_id | uuid fk → users | |
| target_id | uuid fk → users | |
| role | text | кем был автор в этом заказе |
| criteria | jsonb | оценки по критериям |
| overall | numeric(3,2) | |
| text | text | |
| created_at | timestamptz | |
| hidden_at | timestamptz | снят модератором |

Уникальность: `(order_id, author_id)` — один отзыв на заказ от каждой стороны.
Отзыв возможен только по завершённому заказу — проверяется ограничением и триггером.

## disputes

`disputes(id, order_id, opened_by, reason, description, status, resolution, resolved_by, created_at, resolved_at)`

Открытый спор блокирует переход платежа в `released` — проверяется на сервере,
а не в интерфейсе.

## reports / moderation_queue

`reports(id, target_type, target_id, author_id, reason, comment, status, created_at)`

`moderation_queue(id, target_type, target_id, priority, assigned_to, status, created_at)`

## support_tickets

`support_tickets(id, user_id, order_id, topic, message, status, assigned_to, created_at, closed_at)`

## notifications

`notifications(id, user_id, kind, title, body, link, read_at, created_at)`

Настройки — `notification_settings(user_id, channel, kind, enabled)`,
где `channel` = `push` / `telegram` / `email`.

## favorites

`favorites(user_id, target_type, target_id, created_at)`, pk по всем трём полям.

## referrals

`referrals(id, inviter_id, invited_id, code, status, reward, created_at)`

## admins

| Поле | Тип | Примечание |
|---|---|---|
| user_id | uuid pk fk → users | |
| role | text | `OWNER` / `SUPER_ADMIN` / `MODERATOR` / `SUPPORT` / `FINANCE` / `ANALYST` |
| created_at | timestamptz | |

## audit_log

Только вставка. Обновление и удаление запрещены правами роли БД.

| Поле | Тип |
|---|---|
| id | uuid pk |
| admin_id | uuid fk → users |
| action | text |
| target_type | text |
| target_id | text |
| reason | text (обязателен для опасных действий) |
| before, after | jsonb |
| ip | inet |
| created_at | timestamptz |

## risk_events

`risk_events(id, user_id, kind, severity, details jsonb, created_at, resolved_at)`

Виды: всплеск однотипных откликов, серия отмен, попытка увести оплату мимо площадки,
множественные аккаунты с одного устройства.

## feature_flags / platform_settings

`feature_flags(key pk, enabled, description, updated_by, updated_at)`

`platform_settings(key pk, value jsonb, updated_by, updated_at)` — комиссия, лимиты,
режим обслуживания. Настройки читает сервер; клиент получает только те, что можно показывать.

---

## Что должно проверяться на сервере, а не в интерфейсе

1. Право пользователя на действие с объектом (владелец задачи, участник заказа, роль админа).
2. Сумма заказа и комиссия — пересчитываются из действующих условий.
3. Переход статуса заказа и платежа — по конечному автомату, а не по значению из запроса.
4. Возможность оставить отзыв — только участник завершённого заказа.
5. Лимиты: количество задач в сутки, откликов в час, сообщений в минуту.
6. Подпись Telegram `initData` и одноразовый код из СМС.
