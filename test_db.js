const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { PrismaClient } = require('@prisma/client');

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.task.create({
    data: {
      title: "기획안 작성 및 공유",
      desc: "제주도 여행 일정 초안 작성",
      assignee: "김팀장",
      roleTag: "👑팀장",
      status: "TODO",
      deadline: "D-5"
    }
  });
  const tasks = await prisma.task.findMany();
  console.log("Tasks successfully fetched:", tasks);
}

main().catch(console.error);
