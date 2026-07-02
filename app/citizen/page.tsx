"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CitizenSidebar } from "@/components/citizen/citizen-sidebar";
import { NewApplicationFlow } from "@/components/citizen/new-application-flow";
import { ApplicationStatusSection } from "@/components/citizen/application-status-section";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import type { Application } from "@/lib/types";

// 탭별 제목 및 브레드크럼
const tabConfig: Record<string, { title: string; breadcrumb: string }> = {
  new: { title: "신규 신청", breadcrumb: "신규 신청" },
  status: { title: "신청현황 조회", breadcrumb: "신청현황 조회" },
};

function CitizenPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") || "new";
  
  const [activeTab, setActiveTab] = useState<"new" | "status">(
    tabParam === "status" ? "status" : "new"
  );

  const currentConfig = tabConfig[activeTab] || tabConfig.new;

  // 탭 변경 핸들러
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "new" | "status");
  };

  // 신청 완료 핸들러
  const handleApplicationComplete = (_application: Application) => {
    // 신청 완료 후 신청현황 조회로 이동
    setActiveTab("status");
  };

  // 재신청 핸들러
  const handleReapply = (_application: Application) => {
    setActiveTab("new");
  };

  return (
    <div className="flex gap-8">
      {/* 좌측 사이드바 */}
      <CitizenSidebar activeTab={activeTab} onTabChange={handleTabChange} />
      
      {/* 우측 콘텐츠 영역 */}
      <div className="flex-1 min-w-0">
        {/* 타이틀 + 브레드크럼 한 줄 배치 */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <h1 className="text-2xl font-bold text-gray-900">
            {currentConfig.title}
          </h1>
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700 flex items-center gap-1">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>마이페이지</span>
            <ChevronRight className="h-4 w-4" />
            <span>잔여지 보상</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">{currentConfig.breadcrumb}</span>
          </nav>
        </div>

        {/* 콘텐츠 */}
        <div className="space-y-6">
          {/* 신규 신청 - 토스 스타일 플로우 */}
          {activeTab === "new" && (
            <NewApplicationFlow
              onComplete={handleApplicationComplete}
              onCancel={() => setActiveTab("status")}
            />
          )}

          {/* 신청 현황 조회 */}
          {activeTab === "status" && (
            <ApplicationStatusSection onReapply={handleReapply} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function CitizenPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">로딩 중...</div>}>
      <CitizenPageContent />
    </Suspense>
  );
}
