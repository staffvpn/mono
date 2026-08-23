'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { subscribe, getDB } from '@/services/store';

/** Перерисовка при любой записи в мок-хранилище. */
export function useDB() {
  const [, force] = useState(0);
  useEffect(() => {
    const off = subscribe(() => force((n) => n + 1));
    return () => { off(); };
  }, []);
  return getDB();
}

/** Дожидаемся клиента, чтобы не рассинхронить SSR и localStorage. */
export function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
