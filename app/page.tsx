"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/components/AuthContext"; // 로그인 상태 훅 import
import { useRouter } from "next/navigation"; // 라우터 import
import { 
  CheckCircle2, Clock, PlayCircle, Plus, 
  ArrowRight, ArrowLeft, User, Calendar, Tag, Layers, Sparkles,
  Trash2, Edit3, X, Save, Search, Filter, Flame, Move,
  BarChart3, Printer, FileText, Check, LogIn, LogOut
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  desc?: string;
  assignee: string;
  roleTag: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  deadline: string;
  comments?: string; // 카드 내 실시간 피드 댓글 대화 목록 (JSON 문자열)
}

const COLUMNS = [
  { id: "TODO", title: "할 일 (To-Do)", icon: <Clock className="w-5 h-5 text-amber-400 animate-pulse" />, color: "border-amber-500/30 bg-amber-500/5 shadow-amber-500/5", badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30" },
  { id: "IN_PROGRESS", title: "진행 중 (In Progress)", icon: <PlayCircle className="w-5 h-5 text-indigo-400 animate-spin-slow" />, color: "border-indigo-500/30 bg-indigo-500/5 shadow-indigo-500/5", badge: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" },
  { id: "DONE", title: "완료됨 (Done)", icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, color: "border-emerald-500/30 bg-emerald-500/5 shadow-emerald-500/5", badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" },
];

const ROLES = ["ALL", "👑팀장", "💻기획", "🎨디자인", "⚙️백엔드", "🚀프론트"];

export default function KanbanBoard() {
  const { user, logout } = useAuth(); // 로그인 유저 정보 및 로그아웃 함수
  const router = useRouter(); // 페이지 이동 함수
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // [피드백 #2] 검색 및 역할 필터 상태
  const [filterRole, setFilterRole] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // [사용 편의성 피드백] HTML5 드래그 앤 드롭 상태 변수
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  // 생성 모달 상태
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAssignee, setFormAssignee] = useState("");
  const [formRole, setFormRole] = useState("👑팀장");
  const [formDeadline, setFormDeadline] = useState("D-5");

  // [피드백 #1] 상세 보기 및 수정/삭제 모달 상태
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

  // [피드백 #4] 최종 성과 증빙 종합 보고서 모달 상태
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState(""); // 피드 댓글 입력창 텍스트 상태

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // 긴급 업무 판별 로직
  const isUrgent = (deadline: string, status: string) => {
    if (status === "DONE") return false;
    const d = deadline.toLowerCase();
    return d.includes("d-1") || d.includes("d-2") || d.includes("d-3") || d.includes("d-day") || d.includes("오늘") || d.includes("내일") || d.includes("긴급") || d.includes("급");
  };

  // 상태 동기화 이동
  const moveStatus = async (taskId: string, newStatus: string) => {
    if (!user) {
      alert("🔐 로그인한 팀원만 포스트잇 상태를 변경할 수 있습니다!");
      router.push("/login");
      return;
    }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus })
      });
    } catch (err) {
      alert("상태 변경 실패");
      fetchTasks();
    }
  };

  // --- 드래그 앤 드롭 이벤트 핸들러 ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("text/plain", taskId);
    setTimeout(() => {}, 0);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (dragOverColId !== colId) setDragOverColId(colId);
  };

  const handleDragLeave = () => setDragOverColId(null);

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColId(null);
    if (!user) {
      alert("🔐 로그인 후 마우스로 끌어다 놓기(Drag & Drop)를 할 수 있습니다!");
      router.push("/login");
      return;
    }
    const taskId = draggedTaskId || e.dataTransfer.getData("text/plain");
    if (!taskId) return;

    const targetTask = tasks.find(t => t.id === taskId);
    if (targetTask && targetTask.status !== colId) {
      moveStatus(taskId, colId);
    }
    setDraggedTaskId(null);
  };

  // 신규 업무 카드 생성
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("🔐 로그인한 팀원만 새 업무를 등록할 수 있습니다!");
      router.push("/login");
      return;
    }
    if (!formTitle || !formAssignee) return alert("제목과 담당자를 입력하세요.");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          desc: formDesc,
          assignee: formAssignee,
          roleTag: formRole,
          deadline: formDeadline
        })
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setFormTitle("");
        setFormDesc("");
        setFormAssignee("");
        fetchTasks();
      }
    } catch (err) {
      alert("생성 에러");
    }
  };

  // 카드 클릭 시 상세 모달 열기
  const openDetailModal = (task: Task) => {
    setSelectedTask(task);
    setIsEditMode(false);
    setEditTitle(task.title);
    setEditDesc(task.desc || "");
    setEditAssignee(task.assignee);
    setEditRole(task.roleTag);
    setEditDeadline(task.deadline);
  };

  // 업무 내용 수정 저장
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTask.id,
          title: editTitle,
          desc: editDesc,
          assignee: editAssignee,
          roleTag: editRole,
          deadline: editDeadline
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        setSelectedTask(updated);
        setIsEditMode(false);
      }
    } catch (err) {
      alert("수정 에러가 발생했습니다.");
    }
  };

  // 업무 영구 삭제
  const handleDelete = async () => {
    if (!selectedTask) return;
    if (!user) {
      alert("🔐 로그인한 사용자만 업무 카드를 삭제할 수 있습니다!");
      router.push("/login");
      return;
    }
    if (!confirm(`"${selectedTask.title}" 업무 포스트잇을 정말로 영구 삭제하시겠습니까? (복구 불가능)`)) return;

    try {
      const res = await fetch(`/api/tasks?id=${selectedTask.id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
        setSelectedTask(null);
      }
    } catch (err) {
      alert("삭제 실패");
    }
  };

  // 피드 댓글 및 파일 링크 등록 핸들러
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newCommentText.trim()) return;
    if (!user) {
      alert("🔐 로그인한 팀원만 실시간 피드 댓글을 작성할 수 있습니다!");
      router.push("/login");
      return;
    }
    const currentList = selectedTask.comments ? JSON.parse(selectedTask.comments) : [];
    const newObj = {
      id: Date.now().toString(),
      author: user.name,
      text: newCommentText.trim(),
      time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    };
    const updatedStr = JSON.stringify([...currentList, newObj]);

    // 화면 낙관적 업데이트 (로딩 없이 즉시 렌더링)
    setSelectedTask({ ...selectedTask, comments: updatedStr });
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, comments: updatedStr } : t));
    setNewCommentText("");

    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedTask.id, comments: updatedStr })
      });
    } catch (err) {
      alert("댓글 서버 전송 실패");
    }
  };

  // 실시간 하이브리드 필터링 연산
  const filteredTasks = tasks.filter(t => {
    const matchRole = filterRole === "ALL" || t.roleTag === filterRole;
    const q = searchQuery.toLowerCase();
    const matchSearch = q === "" || t.title.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q) || (t.desc && t.desc.toLowerCase().includes(q));
    return matchRole && matchSearch;
  });

  // 진척도 통계 연산 (진행 중 카드 50% 가중치 반영 규칙)
  const totalCount = tasks.length;
  const doneCount = tasks.filter(t => t.status === "DONE").length;
  const inProgressCount = tasks.filter(t => t.status === "IN_PROGRESS").length;
  const progressPercent = totalCount === 0 ? 0 : Math.round(((doneCount + inProgressCount * 0.5) / totalCount) * 100);

  // [피드백 #4] 조원별 기여도 집계 연산 (보고서 출력용)
  const allAssignees = Array.from(new Set(tasks.map(t => t.assignee)));
  const memberStats = allAssignees.map(name => {
    const mTasks = tasks.filter(t => t.assignee === name);
    const mTotal = mTasks.length;
    const mDone = mTasks.filter(t => t.status === "DONE").length;
    const mInProgress = mTasks.filter(t => t.status === "IN_PROGRESS").length;
    const mRate = mTotal === 0 ? 0 : Math.round(((mDone + mInProgress * 0.5) / mTotal) * 100);
    const role = mTasks[0]?.roleTag || "팀원";
    return { name, role, total: mTotal, done: mDone, rate: mRate };
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* 브라우저 인쇄 전용 CSS 규칙 (인쇄 버튼 클릭 시 보고서 영역만 깨끗한 흰색 종이로 출력) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          #printable-report, #printable-report * { visibility: visible !important; }
          #printable-report {
            position: absolute !important;
            left: 0 !important; top: 0 !important; width: 100% !important;
            background: white !important; color: #0f172a !important;
            padding: 30px !important; box-shadow: none !important; border: none !important;
          }
          .no-print { display: none !important; }
        }
      `}} />

      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-600/10 via-purple-600/10 to-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header & Progress Bar */}
      <header className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 bg-slate-900/60 backdrop-blur-2xl p-8 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-500">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-black tracking-widest uppercase mb-2">
              <Sparkles className="w-4 h-4 animate-bounce" /> Next-Gen Collaboration Hub
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3">
              팀 프로젝트 진행 상황 보드
            </h1>
            <p className="text-slate-400 text-sm mt-2 font-medium flex items-center gap-1.5">
              <Move className="w-4 h-4 text-indigo-400 animate-pulse" /> 카드를 마우스로 꾹 집어서 원하는 칸에 툭 떨어뜨려(Drag & Drop) 보세요!
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* 로그인한 사용자 뱃지 혹은 로그인 버튼 */}
            {user ? (
              <div className="flex items-center gap-3 px-5 py-3.5 bg-slate-950/80 border border-emerald-500/40 rounded-2xl shadow-lg">
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  {user.isAdmin && "👑 "}
                  {user.name}님 접속 중
                </span>
                <button
                  onClick={logout}
                  className="text-xs font-bold text-slate-400 hover:text-rose-400 flex items-center gap-1 underline ml-1 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> 로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-black rounded-2xl border border-emerald-500/40 shadow-lg transition hover:scale-105 active:scale-95 text-sm cursor-pointer"
              >
                <LogIn className="w-4 h-4 font-bold" /> 로그인
              </button>
            )}

            {/* [피드백 #4] 성과 보고서 모달 열기 버튼 */}
            <button 
              onClick={() => setIsReportModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold rounded-2xl shadow-lg border border-slate-700/60 transition hover:scale-105 active:scale-95 text-sm cursor-pointer"
            >
              <BarChart3 className="w-5 h-5 text-emerald-400 font-bold" /> 성과 보고서 출력
            </button>

            <button 
              onClick={() => {
                if (!user) {
                  alert("🔐 로그인 후 새 업무를 추가할 수 있습니다!");
                  router.push("/login");
                  return;
                }
                setIsCreateModalOpen(true);
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-7 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 transition-all duration-300 hover:scale-105 active:scale-95 border border-indigo-400/30 text-sm cursor-pointer"
            >
              <Plus className="w-5 h-5 font-bold" /> 새 업무 추가
            </button>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="bg-slate-900/70 backdrop-blur-xl p-7 rounded-3xl border border-slate-800/80 shadow-xl mb-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-3.5">
            <span className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400 animate-pulse" /> 전체 프로젝트 마일스톤 달성률
            </span>
            <span className="text-3xl font-black bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">{progressPercent}%</span>
          </div>
          <div className="w-full h-4 bg-slate-950/80 rounded-full overflow-hidden p-1 border border-slate-800 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-indigo-500/50 relative overflow-hidden"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] -skew-x-12" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-2.5 font-bold">
            <span>진행 중인 총 {totalCount}개 포스트잇</span>
            <span className="text-emerald-400 font-extrabold">{doneCount}개 완벽히 종료됨!</span>
          </div>
        </div>

        {/* 하이브리드 필터 바 */}
        <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800/80 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-xl backdrop-blur-xl">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="🔍 담당자 이름이나 업무 제목 검색..." 
              className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-3.5 text-xs bg-slate-800 hover:bg-slate-700 p-1 rounded-full text-slate-300">✕</button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-black text-slate-400 mr-2 flex items-center gap-1 hidden sm:flex"><Filter className="w-3.5 h-3.5 text-indigo-400" /> 파트:</span>
            {ROLES.map(role => {
              const isActive = filterRole === role;
              return (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all duration-300 flex items-center gap-1 ${
                    isActive 
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 scale-105 border border-indigo-400/30" 
                      : "bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {role === "ALL" ? "🌟 전체 보기" : role}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Kanban Board Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {COLUMNS.map(col => {
          const colTasks = filteredTasks
            .filter(t => t.status === col.id)
            .sort((a, b) => {
              const uA = isUrgent(a.deadline, a.status) ? 1 : 0;
              const uB = isUrgent(b.deadline, b.status) ? 1 : 0;
              return uB - uA;
            });

          const isBeingDraggedOver = dragOverColId === col.id;

          return (
            <div 
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`rounded-3xl p-5 border backdrop-blur-xl min-h-[640px] flex flex-col shadow-2xl transition-all duration-300 relative overflow-hidden ${
                isBeingDraggedOver
                  ? "border-indigo-400 border-dashed bg-indigo-500/15 scale-[1.02] shadow-indigo-500/30"
                  : col.color
              }`}
            >
              {isBeingDraggedOver && (
                <div className="absolute inset-0 bg-indigo-950/60 backdrop-blur-sm flex items-center justify-center z-20 pointer-events-none animate-pulse">
                  <span className="text-xl font-black text-indigo-300 border-2 border-dashed border-indigo-400 px-6 py-4 rounded-3xl bg-slate-950/80 flex items-center gap-2 shadow-2xl">
                    📥 여기에 포스트잇을 놓으세요!
                  </span>
                </div>
              )}

              <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none scale-[4]">
                {col.icon}
              </div>

              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800/80 px-2 relative z-10">
                <div className="flex items-center gap-2.5 font-black text-lg text-slate-200">
                  {col.icon} {col.title}
                </div>
                <span className={`px-3.5 py-1 rounded-full text-xs font-black shadow-inner ${col.badge}`}>
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-4 flex-1 relative z-10">
                {isLoading ? (
                  <div className="text-center py-10 text-slate-500 text-sm animate-pulse">로딩 중...</div>
                ) : colTasks.length === 0 ? (
                  <div className="h-44 flex items-center justify-center text-slate-600 text-sm border border-slate-800/60 border-dashed rounded-3xl bg-slate-950/20 font-bold">
                    {searchQuery || filterRole !== "ALL" ? "검색 조건에 일치하는 카드가 없습니다." : "이곳에 카드를 드래그해 놓으세요."}
                  </div>
                ) : colTasks.map(t => {
                  const urgent = isUrgent(t.deadline, t.status);
                  const isBeingDragged = draggedTaskId === t.id;

                  return (
                    <div 
                      key={t.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      onClick={() => openDetailModal(t)}
                      className={`relative p-6 rounded-3xl border cursor-grab active:cursor-grabbing transition-all duration-300 ease-out flex flex-col justify-between group select-none ${
                        isBeingDragged ? "opacity-30 scale-95 border-dashed border-indigo-400" :
                        urgent
                          ? "bg-gradient-to-br from-rose-950/40 via-slate-900/90 to-slate-900/90 border-rose-500/70 shadow-xl shadow-rose-500/10 animate-pulse hover:animate-none hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-rose-500/30 hover:border-rose-400"
                          : "bg-slate-900/70 backdrop-blur-md border-slate-800/80 hover:bg-slate-900 hover:border-indigo-500/50 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/20"
                      }`}
                    >
                      <div className={`absolute top-0 left-6 right-6 h-[2px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity ${
                        urgent ? "bg-rose-500 shadow-lg shadow-rose-500" : "bg-indigo-500"
                      }`} />

                      <div>
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <span className="px-3 py-1 bg-slate-950/80 text-slate-300 rounded-xl text-xs font-extrabold border border-slate-800 shadow-sm">
                            {t.roleTag}
                          </span>
                          
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow-sm ${
                            t.status === "DONE" || t.deadline.includes("완료") 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : urgent
                              ? "bg-rose-500 text-white font-extrabold shadow-md shadow-rose-500/50 animate-bounce"
                              : "bg-indigo-950 text-indigo-300 border border-indigo-800/50"
                          }`}>
                            {urgent && <Flame className="w-3.5 h-3.5 fill-white" />}
                            ⏳ {t.deadline}
                          </span>
                        </div>
                        
                        <h3 className="font-extrabold text-base text-slate-100 group-hover:text-indigo-300 transition-colors mb-2 leading-snug flex items-center justify-between">
                          <span>{t.title}</span>
                          <Move className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                        {t.desc && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-5 font-medium">
                            {t.desc}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-800/80 flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2 text-xs text-slate-300 font-bold">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-md ${
                            urgent ? "bg-rose-500 text-white" : "bg-indigo-600 text-white"
                          }`}>
                            {t.assignee[0]}
                          </div>
                          {t.assignee}
                        </div>

                        <div className="flex gap-1.5">
                          {t.status !== "TODO" && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); moveStatus(t.id, t.status === "DONE" ? "IN_PROGRESS" : "TODO"); }}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition text-xs flex items-center gap-1 shadow"
                              title="이전 단계로 이동"
                            >
                              <ArrowLeft className="w-3.5 h-3.5 font-bold" />
                            </button>
                          )}
                          {t.status !== "DONE" && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); moveStatus(t.id, t.status === "TODO" ? "IN_PROGRESS" : "DONE"); }}
                              className={`px-3 py-2 text-white font-extrabold rounded-xl transition text-xs flex items-center gap-1 shadow-md hover:scale-105 active:scale-95 ${
                                urgent ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30" : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
                              }`}
                              title="다음 단계로 이동"
                            >
                              이동 <ArrowRight className="w-3.5 h-3.5 font-bold" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>

      {/* --- [피드백 #4] 교수님 제출용 프로젝트 성과 종합 보고서 모달창 --- */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-lg flex items-center justify-center z-50 p-4 md:p-8 overflow-y-auto">
          <div id="printable-report" className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 max-w-4xl w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-slate-100 my-auto">
            {/* 닫기 및 인쇄 버튼 액션 바 (인쇄 시에는 안 나오도록 no-print 클래스 적용) */}
            <div className="no-print flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
                <FileText className="w-5 h-5" /> A4 규격 증빙 서류 프리뷰 모드
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => window.print()}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 text-sm"
                >
                  <Printer className="w-4 h-4 font-bold" /> PDF 저장 / 보고서 인쇄하기
                </button>
                <button onClick={() => setIsReportModalOpen(false)} className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition"><X className="w-5 h-5" /></button>
              </div>
            </div>

            {/* 정식 보고서 헤더 타이틀 */}
            <div className="text-center mb-10">
              <span className="px-3.5 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-black uppercase tracking-widest">
                Team Project Milestone Summary
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white mt-3 tracking-tight">
                팀 프로젝트 최종 성과 종합 보고서
              </h2>
              <p className="text-slate-400 text-sm mt-2 font-medium">제출 일자: {new Date().toLocaleDateString("ko-KR")} · 전체 프로젝트 달성도: <strong className="text-emerald-400">{progressPercent}% 완료</strong></p>
            </div>

            {/* 핵심 통계 요약 카드 3개 */}
            <div className="grid grid-cols-3 gap-4 mb-10 text-center">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80">
                <div className="text-xs font-bold text-slate-400 mb-1">총 등록 업무</div>
                <div className="text-2xl font-black text-white">{totalCount}개</div>
              </div>
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80">
                <div className="text-xs font-bold text-slate-400 mb-1">최종 완료 업무</div>
                <div className="text-2xl font-black text-emerald-400">{doneCount}개</div>
              </div>
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80">
                <div className="text-xs font-bold text-slate-400 mb-1">참여 조원 수</div>
                <div className="text-2xl font-black text-indigo-400">{memberStats.length}명</div>
              </div>
            </div>

            {/* 1. 조원별 업무 달성 현황 통계 표 (Table) */}
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              🧑‍🤝‍🧑 조원별 업무 담당 및 달성률 현황 표
            </h3>
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden mb-10">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-extrabold text-xs">
                    <th className="p-4">담당 조원명</th>
                    <th className="p-4">파트 (역할)</th>
                    <th className="p-4">맡은 업무</th>
                    <th className="p-4">완료 수</th>
                    <th className="p-4 w-1/3">개인 기여 달성률</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                  {memberStats.map(stat => (
                    <tr key={stat.name} className="hover:bg-slate-900/40 transition">
                      <td className="p-4 font-extrabold text-white flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-900 text-indigo-200 flex items-center justify-center text-xs font-black">
                          {stat.name[0]}
                        </div>
                        {stat.name}
                      </td>
                      <td className="p-4"><span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold">{stat.role}</span></td>
                      <td className="p-4 font-bold text-white">{stat.total}개</td>
                      <td className="p-4 font-bold text-emerald-400">{stat.done}개</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${stat.rate}%` }} />
                          </div>
                          <span className="text-xs font-black text-emerald-400 w-10 text-right">{stat.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 2. 최종 완료된 마일스톤 명세 리스트 */}
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              ✅ 최종 완료된 핵심 업무 명세서
            </h3>
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-3 mb-8">
              {tasks.filter(t => t.status === "DONE").length === 0 ? (
                <div className="text-slate-500 text-xs py-4 text-center font-bold">아직 완료된 업무가 없습니다.</div>
              ) : tasks.filter(t => t.status === "DONE").map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-none text-sm">
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-400 font-bold flex-shrink-0" />
                    <strong className="text-white font-bold">{t.title}</strong>
                    <span className="text-xs text-slate-400 font-medium hidden sm:inline">({t.desc?.slice(0, 30) || "내용 없음"})</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-slate-900 text-slate-300 rounded-lg font-bold border border-slate-800">
                    담당: {t.assignee}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-center pt-6 border-t border-slate-800 text-xs text-slate-500 font-bold">
              본 증빙 서류는 팀 협업 칸반 보드 시스템에서 정식으로 집계 및 인쇄되었습니다.
            </div>
          </div>
        </div>
      )}

      {/* 1. 신규 생성 모달 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-400" /> 새 업무 포스트잇 작성</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">업무 제목 *</label>
                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="예: API 명세서 작성" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">상세 설명 (선택)</label>
                <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="업무 세부 내용을 적어주세요." className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">담당자명 *</label>
                  <input type="text" value={formAssignee} onChange={e => setFormAssignee(e.target.value)} placeholder="홍길동" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">역할 태그</label>
                  <select value={formRole} onChange={e => setFormRole(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="👑팀장">👑 팀장</option>
                    <option value="💻기획">💻 기획</option>
                    <option value="🎨디자인">🎨 디자인</option>
                    <option value="⚙️백엔드">⚙️ 백엔드</option>
                    <option value="🚀프론트">🚀 프론트</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">마감일</label>
                <input type="text" value={formDeadline} onChange={e => setFormDeadline(e.target.value)} placeholder="예: D-1, 오늘까지" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition text-sm">취소</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition text-sm shadow-lg shadow-indigo-600/30">등록하기</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. 상세 보기 및 수정/삭제 모달창 */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedTask(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            {!isEditMode ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-extrabold">{selectedTask.roleTag}</span>
                  <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold">⏳ {selectedTask.deadline}</span>
                </div>
                <h2 className="text-2xl font-black text-white leading-snug">{selectedTask.title}</h2>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 min-h-[100px] text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">{selectedTask.desc || "상세 설명이 작성되지 않았습니다."}</div>
                <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950 p-4 rounded-2xl border border-slate-800/60">
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-indigo-400" /> 담당자: <strong className="text-white text-sm">{selectedTask.assignee}</strong></span>
                  <span>현재 위치: <strong className="text-amber-400 font-extrabold text-sm">{selectedTask.status}</strong></span>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={handleDelete} className="px-6 py-3.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 hover:border-transparent font-bold rounded-2xl transition text-sm flex items-center justify-center gap-1.5"><Trash2 className="w-4 h-4" /> 삭제</button>
                  <button onClick={() => setIsEditMode(true)} className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl transition text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"><Edit3 className="w-4 h-4" /> 내용 수정하기</button>
                </div>

                {/* --- [실전 피드 댓글 대화창 및 파일 링크 산출물 박제 영역] --- */}
                <div className="border-t border-slate-800 pt-5 mt-6">
                  <h3 className="text-sm font-black text-slate-200 mb-3 flex items-center gap-1.5">
                    💬 실시간 업무 피드 & 링크 박제 ({selectedTask.comments ? JSON.parse(selectedTask.comments).length : 0})
                  </h3>
                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 max-h-44 overflow-y-auto space-y-2.5 mb-3.5 shadow-inner">
                    {(!selectedTask.comments || JSON.parse(selectedTask.comments).length === 0) ? (
                      <p className="text-xs text-slate-500 text-center py-5 font-medium">아직 대화 내역이 없습니다. 구글 드라이브 링크나 지시사항을 남겨보세요!</p>
                    ) : (
                      JSON.parse(selectedTask.comments).map((cmt: any) => (
                        <div key={cmt.id} className="text-xs space-y-1 bg-slate-900/80 p-3 rounded-xl border border-slate-800/60 animate-in fade-in duration-200">
                          <div className="flex justify-between items-center text-slate-400 font-bold">
                            <span className="text-indigo-300 font-black">@{cmt.author}</span>
                            <span className="text-[10px] text-slate-500">{cmt.time}</span>
                          </div>
                          <p className="text-slate-100 font-medium whitespace-pre-wrap leading-relaxed">{cmt.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={e => setNewCommentText(e.target.value)}
                      placeholder="💬 @팀원 멘션하거나 구글드라이브 URL 입력..."
                      className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                    />
                    <button type="submit" className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-xl text-xs transition shadow-lg shadow-indigo-600/30 cursor-pointer">
                      전송
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdate} className="space-y-4">
                <h2 className="text-xl font-black text-indigo-400 mb-4 flex items-center gap-2"><Edit3 className="w-5 h-5" /> 포스트잇 내용 수정</h2>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">업무 제목</label>
                  <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">상세 설명</label>
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none h-28 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">담당자명</label>
                    <input type="text" value={editAssignee} onChange={e => setEditAssignee(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">역할 태그</label>
                    <select value={editRole} onChange={e => setEditRole(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="👑팀장">👑 팀장</option>
                      <option value="💻기획">💻 기획</option>
                      <option value="🎨디자인">🎨 디자인</option>
                      <option value="⚙️백엔드">⚙️ 백엔드</option>
                      <option value="🚀프론트">🚀 프론트</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">마감일</label>
                  <input type="text" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditMode(false)} className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition text-sm">취소</button>
                  <button type="submit" className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl transition text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5"><Save className="w-4 h-4" /> 수정 완료 저장</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
