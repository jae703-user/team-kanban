// app/lib/prisma.ts
// 웹앱 전체에서 공유하는 싱글톤 데이터베이스 연결 클라이언트 파일입니다.
import { Pool } from 'pg'; // PostgreSQL 커넥션 풀 라이브러리 import
import { PrismaPg } from '@prisma/adapter-pg'; // Prisma 전용 PostgreSQL 통역사 어댑터 import
import { PrismaClient } from '@prisma/client';

// 환경변수에서 클라우드 DB 주소를 불러옵니다
const connectionString = process.env.DATABASE_URL;

// 풀링 객체와 통역사 어댑터를 생성합니다
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 통역사 어댑터가 장착된 PrismaClient를 전역 싱글톤으로 생성합니다 (Vercel 호환 필수)
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
