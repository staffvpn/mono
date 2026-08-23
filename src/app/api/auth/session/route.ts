import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, readSession } from '@/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET — текущая сессия (или null). Секреты наружу не отдаём. */
export async function GET() {
  const jar = await cookies();
  const session = readSession(jar.get(SESSION_COOKIE)?.value);
  return NextResponse.json({ session });
}

/** DELETE — выход: кука удаляется на сервере, а не только в браузере. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
