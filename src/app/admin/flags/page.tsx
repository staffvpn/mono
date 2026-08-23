'use client';

import { useState } from 'react';
import { adminService } from '@/services/admin';
import { useMounted } from '@/hooks/useStore';
import { Badge, Card, Select, Skeleton, Toggle } from '@/components/ui';
import { PageHead } from '@/components/admin/Chrome';

export default function AdminFlags() {
  const mounted = useMounted();
  const [, force] = useState(0);
  if (!mounted) return <Skeleton className="h-96" />;
  const flags = adminService.getFeatureFlags();

  return (
    <div>
      <PageHead title="Feature flags" sub="Каждое изменение попадает в журнал действий." />
      <div className="grid gap-3 sm:grid-cols-2">
        {flags.map((f) => (
          <Card key={f.key} className="p-4" pop={false}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <code className="text-xs font-bold text-brand">{f.key}</code>
                <div className="text-base font-extrabold">{f.title}</div>
              </div>
              <Badge tone={f.enabled ? 'ok' : 'neutral'}>{f.enabled ? 'вкл' : 'выкл'}</Badge>
            </div>
            {f.description && <p className="mt-2 text-sm text-muted">{f.description}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <Toggle checked={f.enabled} label="Включён"
                onChange={(v) => { adminService.updateFeatureFlag(f.key, { enabled: v }); force((n) => n + 1); }} />
              <Select value={f.audience} className="!min-h-[36px] !w-auto !border-2 !py-1.5 text-sm"
                onChange={(e) => { adminService.updateFeatureFlag(f.key, { audience: e.target.value as 'all' | 'test' | 'off' }); force((n) => n + 1); }}>
                <option value="all">Все</option>
                <option value="test">Тестовая аудитория</option>
                <option value="off">Выключено</option>
              </Select>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
