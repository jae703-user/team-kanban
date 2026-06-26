// app/api/auth/login/route.ts
// 로그인 요청을 처리하고 브라우저 쿠키를 발급하는 API 라우트입니다.
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import crypto from 'crypto';

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password + 'kanban_secret_salt').digest('hex');
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    // DB에서 이메일로 사용자 조회
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== hashPassword(password)) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }

    // 쿠키에 담을 사용자 정보 객체 생성 (비밀번호 제외)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    };

    // 응답 객체 생성
    const res = NextResponse.json({ success: true, user: userData });

    // 로그인 상태를 브라우저 쿠키에 저장 (24시간 유지)
    res.cookies.set('auth_user', JSON.stringify(userData), {
      path: '/',
      maxAge: 86400,
      sameSite: 'lax',
    });

    return res;
  } catch (error) {
    return NextResponse.json({ error: '로그인 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
