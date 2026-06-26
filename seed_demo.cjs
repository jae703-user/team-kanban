// seed_demo.cjs
// 발표 시연용 리얼한 프로젝트 데이터 및 계정을 Supabase 온라인 금고에 세팅하는 스크립트입니다.
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 비밀번호 SHA-256 암호화 함수
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'kanban_secret_salt').digest('hex');
}

async function main() {
  console.log("🧹 온라인 DB 금고 청소 중...");
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  console.log("👥 발표 시연용 팀원 계정 5개 생성 중...");
  // 1. 재영 팀장 (관리자)
  await prisma.user.create({
    data: {
      email: "jaeyoung_admin@test.com",
      password: hashPassword("1234"),
      name: "재영",
      isAdmin: true,
    }
  });

  // 2. 조원들
  const members = [
    { email: "cheolsu@test.com", name: "김철수" },
    { email: "younghee@test.com", name: "이영희" },
    { email: "minsu@test.com", name: "박민수" },
    { email: "jia@test.com", name: "최지아" },
  ];

  for (const m of members) {
    await prisma.user.create({
      data: {
        email: m.email,
        password: hashPassword("1234"),
        name: m.name,
        isAdmin: false,
      }
    });
  }

  console.log("📋 황금 비율 업무 포스트잇 7개 및 실시간 댓글 피드 배치 중...");

  const tasksData = [
    // --- [ 할 일 (TODO) : 2개 ] ---
    {
      title: "경쟁사 B2B SaaS 벤치마크 조사 및 쟁점 도출",
      desc: "국내외 주요 협업 툴(지라, 노션, 슬랙 등)의 마일스톤 시각화 아키텍처 비교 분석",
      assignee: "김철수",
      roleTag: "👑팀장,💻기획",
      status: "TODO",
      deadline: "D-7",
      comments: JSON.stringify([
        { id: "101", author: "재영", text: "철수야 벤치마크 조사할 때 그래프 렌더링 속도 부분도 엑셀에 꼭 비교해줘!", time: "09:30" }
      ])
    },
    {
      title: "메인 대시보드 피그마 UI 스토리보드 설계",
      desc: "다크 모드 기반 직관적인 글래스모피즘 카드 레이아웃 초안 제작",
      assignee: "이영희",
      roleTag: "🎨디자인,🚀프론트",
      status: "TODO",
      deadline: "D-4",
      comments: JSON.stringify([
        { id: "102", author: "이영희", text: "현재 눈이 편안한 슬레이트 네이비 계열 톤으로 컬러 팔레트 후보 선정 중입니다.", time: "10:15" }
      ])
    },

    // --- [ 진행 중 (IN_PROGRESS) : 3개 -> 50% 가중치 적용 구간 ] ---
    {
      title: "Supabase DB 스키마 마이그레이션 및 Prisma 연결",
      desc: "PostgreSQL 클라우드 금고 개설 및 Task-User 엔티티 규격 세팅",
      assignee: "박민수",
      roleTag: "⚙️백엔드",
      status: "IN_PROGRESS",
      deadline: "D-2",
      comments: JSON.stringify([
        { id: "103", author: "박민수", text: "@재영 팀장님, Task 테이블에 실시간 피드 박제용 comments 컬럼 추가 완료했습니다!", time: "11:00" },
        { id: "104", author: "재영", text: "오 확인했다 고생 많았어! 즉시 클라우드 반영 승인함", time: "11:05" }
      ])
    },
    {
      title: "포스트잇 실시간 댓글 대화창 UI 퍼블리싱",
      desc: "인스타그램 피드 스타일의 모달 하단 대화창 및 구글드라이브 링크 첨부 폼",
      assignee: "최지아",
      roleTag: "🎨디자인,🚀프론트",
      status: "IN_PROGRESS",
      deadline: "D-1",
      comments: JSON.stringify([
        { id: "105", author: "최지아", text: "프라이빗 락 자물쇠 조건부 렌더링 테스트 완료. 산출물 드라이브 링크: [https://drive.google.com/file/d/...]", time: "13:20" }
      ])
    },
    {
      title: "비전공자 상사 방어용 발표 스크립트 대본 구성",
      desc: "가볍고 스마트한 실습 썰 풀기 톤의 3단계 발표 구조 대본 작성",
      assignee: "재영",
      roleTag: "👑팀장,💻기획",
      status: "IN_PROGRESS",
      deadline: "오늘까지",
      comments: JSON.stringify([
        { id: "106", author: "재영", text: "상사 기습 질문 방어용 '진척도 50% 연산 알고리즘 답변' 대본에 주입 완료!", time: "14:00" }
      ])
    },

    // --- [ 완료됨 (DONE) : 2개 ] ---
    {
      title: "프로젝트 핵심 주제 선정 및 요구사항 기획 확정",
      desc: "기존 카톡 협업의 한계를 뚫는 '24시간 디지털 화이트보드' 컨셉 도출",
      assignee: "재영",
      roleTag: "👑팀장,💻기획",
      status: "DONE",
      deadline: "완료(6/20)",
      comments: JSON.stringify([
        { id: "107", author: "재영", text: "기획안 정식 제출 완료. 조원 전원 만장일치 통과함!", time: "18:00" }
      ])
    },
    {
      title: "깃허브 원격 레포지토리 생성 및 Vercel 배포 자동화",
      desc: "main 브랜치 푸시 시 단 40초 만에 라이브 서버가 갱신되는 CI/CD 가동",
      assignee: "박민수",
      roleTag: "⚙️백엔드,🚀프론트",
      status: "DONE",
      deadline: "완료(6/21)",
      comments: JSON.stringify([
        { id: "108", author: "박민수", text: "전 세계 라이브 도메인 연결 성공: https://team-kanban-r4il.vercel.app/", time: "20:00" }
      ])
    }
  ];

  for (const t of tasksData) {
    await prisma.task.create({ data: t });
  }

  console.log("🎉 세팅 완료! 전체 7개 중 완료 인정 3.5개 -> 프로젝트 전체 달성률 정확히 50% 가동 끝!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
