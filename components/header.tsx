"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X, LogOut, User, ExternalLink, ChevronDown, LogIn, UserPlus, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

const citizenNavigation = [
  { name: "잔여지 매수", href: "/citizen" },
];

const adminNavigation = [
  { name: "신청 목록", href: "/admin" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"citizen" | "admin">(
    pathname.startsWith("/admin") ? "admin" : "citizen"
  );

  // URL 변경 시 viewMode 동기화
  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      setViewMode("admin");
    } else if (pathname.startsWith("/citizen") || pathname === "/") {
      setViewMode("citizen");
    }
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleViewModeChange = (mode: "citizen" | "admin") => {
    setViewMode(mode);
    if (mode === "citizen") {
      router.push("/citizen");
    } else {
      router.push("/admin");
    }
  };

  const mainNavigation = viewMode === "citizen" ? citizenNavigation : adminNavigation;

  return (
    <header className="z-50 w-full bg-white">
      {/* 1. 최상단 유틸리티 바 (KRDS Header 배경) */}
      <div style={{ backgroundColor: '#23b59d' }}>
        <div className="mx-auto flex h-9 max-w-[1550px] items-center justify-between gap-1 px-4 text-sm text-white sm:px-6 lg:px-8">
          {/* 좌측: 화면 전환 토글 */}
          <div className="flex items-center gap-1 rounded-full bg-white/20 p-0.5">
            <button
              onClick={() => handleViewModeChange("citizen")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                viewMode === "citizen"
                  ? "bg-white text-primary"
                  : "text-white/90 hover:bg-white/10"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              <span>민원인</span>
            </button>
            <button
              onClick={() => handleViewModeChange("admin")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                viewMode === "admin"
                  ? "bg-white text-primary"
                  : "text-white/90 hover:bg-white/10"
              )}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>담당자</span>
            </button>
          </div>

          {/* 우측: 유틸리티 링크 */}
          <div className="flex items-center gap-1">
            <Link 
              href="https://exland.ex.co.kr/lc/main" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1 px-3 py-1 transition-colors hover:bg-white/10"
            >
              <span className="font-semibold">토지관리</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <span className="text-white/40">|</span>
            <Link 
              href="https://exland.ex.co.kr/lc/main" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1 px-3 py-1 transition-colors hover:bg-white/10"
            >
              <span className="font-semibold">누리집 안내지도</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <span className="text-white/40">|</span>
            <button className="flex items-center gap-1 px-3 py-1 transition-colors hover:bg-white/10">
              <span className="font-semibold">화면크기</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. 로고 및 유틸리티 링크 영역 (흰색 배경) */}
      <div className="border-b border-gray-200">
        <div className="mx-auto flex h-16 max-w-[1550px] items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* 로고 */}
          <Link href="/" className="flex cursor-pointer items-center py-2">
            <Image
              src="/images/logo-lc.png"
              alt="한국도로공사 토지정보"
              width={200}
              height={40}
              className="h-10 object-contain"
              style={{ width: "auto", height: "auto" }}
              priority
            />
          </Link>

          {/* 우측 유틸리티 링크 */}
          <div className="hidden items-center gap-4 md:flex">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4" />
                  <span>로그아웃</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-sm text-gray-700 transition-colors hover:text-primary"
                >
                  <LogIn className="h-4 w-4" />
                  <span>로그인</span>
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-1.5 text-sm text-gray-700 transition-colors hover:text-primary"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>회원가입</span>
                </Link>
              </>
            )}
            <span className="text-gray-300">|</span>
            <Link
              href="https://www.ex.co.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded bg-secondary px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-200"
            >
              <span>신고채널</span>
            </Link>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer text-gray-700 hover:bg-gray-100 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* 3. 메인 네비게이션 (KRDS Secondary 배경) */}
      <div className="hidden border-b border-border bg-secondary md:block">
        <div className="mx-auto max-w-[1550px] px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-0" role="navigation" aria-label="메인 메뉴">
            {mainNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-1 border-r border-gray-200 px-8 py-3.5 text-base font-medium transition-colors first:border-l",
                  pathname.startsWith(item.href)
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-primary"
                )}
                aria-current={pathname.startsWith(item.href) ? "page" : undefined}
              >
                {item.name}
                <ChevronDown className="h-4 w-4" />
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* 모바일 네비게이션 */}
      {mobileMenuOpen && (
        <div className="border-t bg-white md:hidden">
          <nav className="flex flex-col p-2" role="navigation" aria-label="모바일 메뉴">
            {mainNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "cursor-pointer rounded-md px-4 py-3 text-base font-medium transition-colors",
                  pathname.startsWith(item.href)
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                aria-current={pathname.startsWith(item.href) ? "page" : undefined}
              >
                {item.name}
              </Link>
            ))}
            <div className="my-2 border-t" />
            {user ? (
              <>
                <div className="flex items-center gap-2.5 px-4 py-2 text-base text-gray-600">
                  <User className="h-4 w-4 shrink-0" />
                  <span>{user.name}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2.5 rounded-md px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>로그아웃</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  <LogIn className="h-4 w-4 shrink-0" />
                  <span>로그인</span>
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  <UserPlus className="h-4 w-4 shrink-0" />
                  <span>회원가입</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
