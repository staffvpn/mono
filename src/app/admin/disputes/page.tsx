'use client';

import Link from 'next/link';
import { adminService } from '@/services/admin';
import { useDB, useMounted } from '@/hooks/useStore';
import { Badge, Card, Skeleton } from '@/components/ui';
import { DangerAction, PageHead } from '@/components/admin/Chrome';

const REASON: Record<string, string> = {
  executor_no_show: 'Исполнитель не пришёл', customer_no_show: 'Заказчик не пришёл',
  bad_work: 'Работа выполнена плохо', no_payment: 'Не оплатили',
  terms_changed: 'Изменились условия', description_mismatch: 'Описание не соответствовало', other: 'Другое',
};

export default function AdminDisputes() {
  const mounted = useMounted();
  const db = useDB();
  if (!mounted) return <Skeleton className="h-96" />;
  const disputes = adminService.getDisputes();

  return (
    <div>
      <PageHead title="Споры" sub={`Открытых: ${disputes.filter((d) => d.status !== 'resolved' && d.status !== 'closed').length}`} />

      {disputes.length === 0 ? (
        <Card className="p-8 text-center text-sm text-faint" pop={false}>
          Споров пока нет. Они появятся, когда стороны не смогут договориться по заказу.
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {disputes.map((d) => {
            const order = db.orders.find((o) => o.id === d.orderId);
            const opener = db.users.find((u) => u.id === d.openedBy);
            const payment = db.payments.find((p) => p.id === order?.paymentId);
            return (
              <Card key={d.id} className="p-5" pop={false}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Badge tone={d.status === 'resolved' ? 'ok' : 'danger'}>{d.status}</Badge>
                    <h2 className="mt-2 text-lg font-extrabold">{REASON[d.reason]}</h2>
                    <p className="text-sm text-muted">
                      Заказ {d.orderId} · открыл {opener?.name ?? d.openedBy} · {new Date(d.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <DangerAction section="disputes" label="В пользу заказчика" question="Решить спор в пользу заказчика?"
                      reasons={['Работа не выполнена', 'Существенные недостатки', 'Исполнитель не вышел на связь', 'Другое']}
                      onConfirm={() => {}} />
                    <DangerAction section="disputes" label="В пользу исполнителя" question="Решить спор в пользу исполнителя?"
                      reasons={['Работа выполнена', 'Заказчик недоступен', 'Претензия не подтвердилась', 'Другое']}
                      onConfirm={() => {}} />
                    <DangerAction section="disputes" label="Возврат" question="Оформить возврат средств?"
                      reasons={['Полный возврат', 'Частичный возврат', 'Другое']}
                      onConfirm={() => {}} />
                  </div>
                </div>

                <p className="mt-3 rounded-md border-2 border-ink bg-surface p-3 text-sm">{d.comment}</p>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div><div className="text-faint">Сумма заказа</div><div className="font-bold">{order?.terms.price.toLocaleString('ru-RU')} ₽</div></div>
                  <div><div className="text-faint">Платёж</div><div className="font-bold">{payment?.status ?? 'нет'}</div></div>
                  <div><div className="text-faint">Материалы</div>
                    <Link href={`/app/orders/${d.orderId}`} className="font-bold text-brand">Заказ, условия, переписка</Link></div>
                </div>

                <p className="mt-3 text-xs text-faint">
                  Пока спор открыт, средства удерживаются. Решение требует причины и комментария и попадает в журнал.
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
