'use client';

import { useState } from 'react';
import { authService } from '@/services/auth';
import { initMiniApp, tg, haptic } from '@/lib/telegram';
import { Button, Card, Field, Input, MockBanner } from '@/components/ui';
import { ArtSearching } from '@/components/ui/art';
import { BRAND } from '@/lib/brand';
import { CONFIG } from '@/lib/config';

/* ============================================================
   Вход. Два способа: Telegram и номер телефона — аккаунт один.
   Подпись Telegram и SMS-код проверяются на backend; здесь только UI.
   ============================================================ */

type Mode = 'choose' | 'phone-number' | 'phone-code';

export function AuthGate({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<Mode>('choose');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function loginTelegram() {
    setBusy(true); setError('');
    try {
      const w = tg();
      if (w) initMiniApp();
      await authService.loginTelegram(w?.initData ?? '', w?.initDataUnsafe?.user ?? null);
      haptic('success');
      onDone();
    } catch {
      setError('Не получилось войти через Telegram. Попробуйте по номеру телефона.');
    } finally { setBusy(false); }
  }

  async function sendCode() {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 11) { setError('Похоже, в номере не хватает цифр'); return; }
    setBusy(true); setError('');
    try {
      await authService.sendPhoneCode(digits);
      setMode('phone-code');
    } catch {
      setError('Не удалось отправить код. Попробуйте ещё раз.');
    } finally { setBusy(false); }
  }

  async function verify() {
    setBusy(true); setError('');
    try {
      await authService.verifyPhoneCode(phone.replace(/\D/g, ''), code);
      haptic('success');
      onDone();
    } catch {
      setError('Код не подошёл. Проверьте цифры или запросите новый.');
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-5 py-10 text-center">
      <ArtSearching className="h-28 w-auto" />
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Ну привет!</h1>
      <p className="mt-2 max-w-[36ch] text-[15px] text-muted">
        Один вход — и задачи, отклики и переписка в одном месте. Без паролей.
      </p>

      {CONFIG.useMock && <div className="mt-5"><MockBanner /></div>}

      <Card className="mt-6 w-full p-6 text-left">
        {mode === 'choose' && (
          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={loginTelegram} loading={busy} className="w-full">
              Продолжить через Telegram
            </Button>
            <Button size="lg" variant="outline" onClick={() => setMode('phone-number')} className="w-full">
              Войти по номеру
            </Button>
            <p className="mt-1 text-center text-xs text-faint">
              Нажимая, вы соглашаетесь с правилами {BRAND.name} и политикой конфиденциальности.
            </p>
          </div>
        )}

        {mode === 'phone-number' && (
          <div className="flex flex-col gap-4">
            <Field label="Номер телефона" hint="Пришлём короткий код в SMS">
              <Input
                type="tel" inputMode="tel" autoFocus placeholder="+7 999 123 45 67"
                value={phone} onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Button onClick={sendCode} loading={busy}>Прислать код</Button>
            <button onClick={() => setMode('choose')} className="text-sm font-bold text-brand">Назад</button>
          </div>
        )}

        {mode === 'phone-code' && (
          <div className="flex flex-col gap-4">
            <Field label="Код из SMS" hint={CONFIG.useMock ? 'Демо: подойдёт любой код из 4 цифр' : `Отправили на ${phone}`}>
              <Input
                inputMode="numeric" maxLength={4} autoFocus placeholder="1234"
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-[0.5em]"
              />
            </Field>
            <Button onClick={verify} loading={busy}>Войти</Button>
            <button onClick={() => setMode('phone-number')} className="text-sm font-bold text-brand">
              Изменить номер
            </button>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-md border-2 border-danger bg-danger/10 px-3 py-2 text-sm font-bold text-danger">
            {error}
          </p>
        )}
      </Card>
    </div>
  );
}

/* ---------- Выбор роли при первом входе ---------- */
export function RolePicker({ onPick }: { onPick: (role: 'customer' | 'executor') => void }) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-5 py-12 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight">Кем сегодня будем?</h1>
      <div className="mt-8 flex w-full flex-col gap-4">
        <button onClick={() => onPick('customer')}
          className="rounded-xl border-3 border-ink bg-card p-6 text-left shadow-pop transition-transform hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-pop-sm">
          <div className="text-xl font-extrabold">Мне нужна помощь</div>
          <p className="mt-1.5 text-[15px] text-muted">Создам задачу и найду человека, который её закроет.</p>
        </button>
        <button onClick={() => onPick('executor')}
          className="rounded-xl border-3 border-ink bg-brand p-6 text-left text-white shadow-pop transition-transform hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-pop-sm">
          <div className="text-xl font-extrabold">Хочу заработать</div>
          <p className="mt-1.5 text-[15px]">Найду задачи рядом и буду откликаться. Бесплатно.</p>
        </button>
      </div>
      <p className="mt-6 text-sm text-faint">Не переживай, роль можно поменять в любой момент.</p>
    </div>
  );
}
