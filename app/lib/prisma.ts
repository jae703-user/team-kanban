// app/lib/prisma.ts
// 웹앱 전체에서 공유하는 싱글톤 데이터베이스 연결 클라이언트 파일입니다.
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 기존에 켜져 있던 DB 연결이 있으면 재사용하고 없으면 새로 생성합니다 (Vercel 호환 표준 방식)
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
