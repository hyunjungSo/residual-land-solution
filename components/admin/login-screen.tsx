"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Lock, User } from "lucide-react";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = id.length > 0 && pw.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsLoading(true);
    setError("");
    setTimeout(() => {
      setIsLoading(false);
      if (id === "admin" && pw === "1234") {
        onLogin();
      } else {
        setError("아이디 또는 비밀번호가 일치하지 않습니다. 다시 시도해주세요.");
      }
    }, 600);
  }

  return (
    <div className="flex h-screen w-screen">
      {/* 좌측 브랜드 섹션 */}
      <div className="relative hidden w-1/2 lg:block">
        <Image src="/images/login-bg.png" alt="배경" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a365d]/90 via-[#1e4a5f]/85 to-[#2E8B57]/80" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <Image src="/images/logo-lc.png" alt="로고" width={240} height={53} style={{ width: '240px', height: 'auto' }} className="brightness-0 invert opacity-80" />
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white leading-snug">
              AI 잔여지 매수 판독<br />관리자
            </h1>
            <div className="h-1 w-24 rounded-full bg-[#2E8B57]" />
          </div>
          <p className="text-[15px] text-white/50">&copy; 2026 Korea Expressway Corporation. All rights reserved.</p>
        </div>
      </div>

      {/* 우측 로그인 폼 */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <h1 className="text-center text-2xl font-bold text-gray-900">로그인</h1>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* 아이디 */}
            <div className="space-y-1.5">
              <label htmlFor="login-id" className="text-[15px] font-medium text-gray-700">아이디</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="login-id"
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  autoComplete="username"
                  className="w-full h-12 rounded-md border border-gray-300 bg-white pl-10 pr-4 text-base outline-none placeholder:text-gray-400 hover:border-gray-400 focus:border-[#2E8B57] focus:ring-2 focus:ring-[#2E8B57]/20"
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div className="space-y-1.5">
              <label htmlFor="login-pw" className="text-[15px] font-medium text-gray-700">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="login-pw"
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  autoComplete="current-password"
                  className="w-full h-12 rounded-md border border-gray-300 bg-white pl-10 pr-10 text-base outline-none placeholder:text-gray-400 hover:border-gray-400 focus:border-[#2E8B57] focus:ring-2 focus:ring-[#2E8B57]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && <p className="text-[15px] text-red-500 text-center">{error}</p>}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={!canSubmit || isLoading}
              className="w-full h-12 rounded-md bg-[#2E8B57] text-base font-semibold text-white transition-colors hover:bg-[#256b45] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  로그인 중...
                </span>
              ) : "로그인"}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-[15px] text-gray-400 lg:hidden">&copy; 2026 한국도로공사</p>
      </div>
    </div>
  );
}
