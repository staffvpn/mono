import type { Metadata } from 'next';
import { SiteHeader, SiteFooter } from '@/components/site/Chrome';
import { PublicTasks } from './PublicTasks';

export const metadata: Metadata = {
  title: 'Задачи — TEYDO',
  description: 'Витрина опубликованных задач. Чтобы откликнуться, войдите — отклик бесплатный.',
};

export default function PublicTasksPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PublicTasks />
      </main>
      <SiteFooter />
    </>
  );
}
