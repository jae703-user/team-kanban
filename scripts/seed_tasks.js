const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { PrismaClient } = require('@prisma/client');

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding initial tasks...");
  await prisma.task.deleteMany(); // 기존 테스트 데이터 초기화

  const tasks = [
    { title: "시장 조사 및 경쟁사 분석", desc: "타사 유사 협업 툴 리서치 보고서", assignee: "박리서치", roleTag: "💻기획", status: "DONE", deadline: "완료됨" },
    { title: "와이어프레임 및 피그마 초안", desc: "주요 페이지 UI 디자인 설계", assignee: "이디자인", roleTag: "🎨디자인", status: "DONE", deadline: "완료됨" },
    { title: "DB 스키마 설계 및 테이블 생성", desc: "Prisma ORM 기반 모델링", assignee: "최백엔드", roleTag: "⚙️개발", status: "DONE", deadline: "완료됨" },
    { title: "칸반 보드 메인 UI 마크업", desc: "3칸 레이아웃 및 카드 스타일링", assignee: "정프론트", roleTag: "💻개발", status: "IN_PROGRESS", deadline: "D-1" },
    { title: "상태 변경 API 연동 로직", desc: "카드 좌우 이동 화살표 연동", assignee: "최백엔드", roleTag: "⚙️개발", status: "IN_PROGRESS", deadline: "D-2" },
    { title: "발표용 PPT 제작 스켈레톤", desc: "목차 및 발표 스토리보드 작성", assignee: "김팀장", roleTag: "👑팀장", status: "IN_PROGRESS", deadline: "D-3" },
    { title: "신규 업무 추가 모달 폼 구현", desc: "제목, 담당자, 마감일 입력 폼", assignee: "정프론트", roleTag: "💻개발", status: "TODO", deadline: "D-4" },
    { title: "전체 진척도(%) 바 계산 함수", desc: "완료된 태스크 비율 동적 출력", assignee: "정프론트", roleTag: "💻개발", status: "TODO", deadline: "D-5" },
    { title: "빌드 테스트 및 에러 디버깅", desc: "실제 배포 전 최종 에러 점검", assignee: "최백엔드", roleTag: "⚙️개발", status: "TODO", deadline: "D-6" },
    { title: "최종 발표 리허설 및 시연 녹화", desc: "대본 숙지 및 시간 체크", assignee: "김팀장", roleTag: "👑팀장", status: "TODO", deadline: "D-7" }
  ];

  for (const t of tasks) {
    await prisma.task.create({ data: t });
  }

  console.log("Successfully seeded 10 sample tasks!");
}

main().catch(console.error);
