// app/api/auth/logout/route.ts
// 로그아웃 요청 시 쿠키를 삭제하는 API 라우트입니다.
import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });

  // auth_user 쿠키를 즉시 만료시켜 로그아웃 처리
  res.cookies.set('auth_user', '', {
    path: '/',
    maxAge: 0,
  });

  return res;
}
