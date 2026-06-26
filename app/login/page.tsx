"use client";

// app/login/page.tsx
// 로그인 및 회원가입을 한 곳에서 처리하는 세련된 다크 테마 페이지입니다.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthContext";
import { ShieldCheck, UserPlus, LogIn, Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = isLoginMode ? "/api/auth/login" : "/api/auth/signup";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "요청에 실패했습니다.");
      } else {
        // 인증 성공 시 컨텍스트에 유저 정보 저장 후 메인 이동
        login(data.user);
        router.push("/");
      }
    } catch (err) {
      setError("서버와의 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 배경 네온 발광 효과 (장식용) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-3 bg-gradient-to-tr from-emerald-500 to-indigo-500 rounded-2xl shadow-lg shadow-emerald-500/20 mb-4 text-white">
            {isLoginMode ? <ShieldCheck className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isLoginMode ? "칸반 허브 로그인" : "새 계정 만들기"}
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {isLoginMode
              ? "우리 팀의 프로젝트 보드에 접속하세요."
              : "가입 시 이메일에 'admin'을 넣으면 자동으로 관리자가 됩니다!"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                조원 이름 (닉네임)
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="홍길동"
                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              이메일 주소
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@team.com"
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              비밀번호
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isLoginMode ? (
              <>
                <LogIn className="w-4 h-4" /> 입장하기
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> 가입 완료하기
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-800/80 pt-6">
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError("");
            }}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors font-medium cursor-pointer"
          >
            {isLoginMode
              ? "아직 계정이 없으신가요? (회원가입)"
              : "이미 계정이 있으신가요? (로그인)"}
          </button>
        </div>
      </div>
    </div>
  );
}
