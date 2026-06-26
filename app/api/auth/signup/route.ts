// app/api/auth/signup/route.ts
// 회원가입 요청을 처리하는 API 라우트입니다.
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import crypto from 'crypto';

// 비밀번호를 안전하게 암호화(해시)하는 함수
function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password + 'kanban_secret_salt').digest('hex');
}

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    // 필수 입력값 검증
    if (!email || !password || !name) {
      return NextResponse.json({ error: '모든 칸을 입력해주세요.' }, { status: 400 });
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: '이미 가입된 이메일입니다.' }, { status: 409 });
    }

    // 관리자 권한 자동 부여 조건: 이메일에 'admin' 단어가 포함되어 있으면 관리자 처리
    const isAdmin = email.includes('admin');

    // DB에 새 사용자 생성
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashPassword(password),
        name,
        isAdmin,
      },
    });

    return NextResponse.json({
      success: true,
      user: { id: newUser.id, email: newUser.email, name: newUser.name, isAdmin: newUser.isAdmin }
    });
  } catch (error) {
    return NextResponse.json({ error: '회원가입 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
