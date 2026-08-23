import { Suspense } from 'react';
import { AppShell } from '@/components/app/Shell';

export const metadata = { title: 'Приложение', robots: { index: false } };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
