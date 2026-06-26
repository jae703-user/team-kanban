// prisma.config.ts
// Prisma CLI가 데이터베이스에 접근할 때 사용하는 공식 환경 설정 파일입니다.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // 스키마 생성(push) 및 마이그레이션 시에는 풀러(6543)가 아닌 직통 포트(5432)를 써야 무한 대기하지 않습니다!
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
