"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import type { Application, AdminStatus } from "@/lib/types";
import { Search, ChevronRight, Clock, CheckCircle2, FileCheck, Layers, RefreshCw, CalendarIcon, Loader2, ArrowUpDown } from "lucide-react";
import { AdminStatusBadge, ProcessStatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { JudgmentSummaryBadge, PARCEL_COUNT_COLORS } from "@/components/ui/judgment-badge";
import { PaginationButton, PaginationNavButton } from "@/components/ui/pagination-button";
import { cn } from "@/lib/utils";
import { AIIcon } from "@/components/ui/ai-icon";
import { RadioFilterGroup, SearchInput } from "@/components/admin/shared";

function toListStatus(status: AdminStatus): AdminStatus {
  if (status === "접수완료") return "접수완료";
  if (status === "담당자검토중" || status === "심의위원회회부" || status === "심의위원회검토중") return "담당자검토중";
  return "담당자검토완료";
}

interface ApplicationListProps {
  applications: Application[];
  onSelect: (application: Application) => void;
}

type PeriodFilter = "year" | "today" | "week" | "month" | "custom";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const currentYear = new Date().getFullYear();
const availableYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

export function ApplicationList({ applications, onSelect }: ApplicationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminStatus | "all">("all");
  const [projectUnitFilter] = useState<"all" | "gangjin-gwangju">("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("year");
  const [dateCriteriaType, setDateCriteriaType] = useState<"appliedAt" | "statusUpdatedAt">("appliedAt");
  const [selectedYear, setSelectedYear] = useState<number | null>(currentYear);
  const [aiMismatchFilter] = useState(false);
  const [appealFilter, setAppealFilter] = useState<"all" | "중토위" | "한국도로공사">("all");
  const [customDateRange, setCustomDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // 클라이언트 마운트 후 날짜 설정 (hydration mismatch 방지)
  useEffect(() => {
    setIsMounted(true);
    setLastUpdated(new Date());
  }, []);

  // 필터 변경 시 로딩 효과
  const handlePeriodChange = (newPeriod: PeriodFilter, year?: number) => {
    setIsLoading(true);
    startTransition(() => {
      setPeriodFilter(newPeriod);
      // 연도 필터가 아닌 다른 필터 선택 시 연도 초기화
      if (newPeriod !== "year") {
        setSelectedYear(null);
      } else if (year !== undefined) {
        setSelectedYear(year);
      }
      setTimeout(() => setIsLoading(false), 300);
    });
  };

  // 현재 조회 기간 계산
  const currentDateRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (periodFilter) {
      case "year": {
        if (selectedYear === null) return { from: undefined, to: undefined };
        const yearStart = new Date(selectedYear, 0, 1);
        const yearEnd = new Date(selectedYear, 11, 31);
        return { from: yearStart, to: yearEnd };
      }
      case "today":
        return { from: today, to: today };
      case "week": {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { from: weekAgo, to: today };
      }
      case "month": {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from: monthStart, to: today };
      }
      case "custom":
        return customDateRange;
      default:
        return { from: undefined, to: undefined };
    }
  }, [periodFilter, customDateRange, selectedYear]);

  // 조회 기간 텍스트
  const dateRangeText = useMemo(() => {
    if (!currentDateRange.from) return "전체 기간";
    
    const formatDate = (date: Date) => {
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };
    
    if (periodFilter === "year" && selectedYear !== null) {
      return `${selectedYear}년 (${selectedYear}.01.01 ~ ${selectedYear}.12.31)`;
    }
    
    if (periodFilter === "today") {
      return formatDate(currentDateRange.from);
    }
    
    if (currentDateRange.to && currentDateRange.from.getTime() !== currentDateRange.to.getTime()) {
      return `${formatDate(currentDateRange.from)} ~ ${formatDate(currentDateRange.to)}`;
    }
    
    return formatDate(currentDateRange.from);
  }, [periodFilter, currentDateRange, selectedYear]);

  // 기간 필터링된 데이터
  const periodFilteredApplications = useMemo(() => {
    if (!periodFilter) return applications;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return applications.filter((app) => {
      // 선택된 기준에 따라 날짜 결정 (민원 신청일 또는 관리자 상태 변경일)
      const dateSource = dateCriteriaType === "appliedAt" ? app.appliedAt : (app.statusUpdatedAt || app.appliedAt);
      const appDate = new Date(dateSource);
      
      switch (periodFilter) {
        case "year": {
          if (selectedYear === null) return true;
          const yearStart = new Date(selectedYear, 0, 1);
          const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
          return appDate >= yearStart && appDate <= yearEnd;
        }
        case "today":
          return appDate >= today && appDate < tomorrow;
        case "week": {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return appDate >= weekAgo && appDate < tomorrow;
        }
        case "month": {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          return appDate >= monthStart && appDate < tomorrow;
        }
        case "custom": {
          if (!customDateRange.from) return true;
          const fromDate = new Date(customDateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          if (customDateRange.to) {
            const toDate = new Date(customDateRange.to);
            toDate.setHours(23, 59, 59, 999);
            return appDate >= fromDate && appDate <= toDate;
          }
          return appDate >= fromDate;
        }
        default:
          return true;
      }
    });
  }, [applications, periodFilter, customDateRange, selectedYear, dateCriteriaType]);

  const handleRefresh = () => {
    setLastUpdated(new Date());
  };

  const filteredApplications = useMemo(() => {
    return periodFilteredApplications
      .filter((app) => {
        const matchesSearch =
          app.applicationNumber.includes(searchQuery) ||
          app.applicantName.includes(searchQuery) ||
          app.landInfo.address.includes(searchQuery);
      const matchesStatus = statusFilter === "all" || toListStatus(app.adminStatus) === statusFilter;
      const matchesProjectUnit = projectUnitFilter === "all" || app.businessUnit === "강진광주";
      // AI 불일치 필터 (시뮬레이션: 접수번호가 특정 패턴일 때 불일치로 간주)
      const matchesAiMismatch = !aiMismatchFilter || (app.adminStatus === "심사완료" && app.applicationNumber.endsWith("2"));
      const isCommitteeRejected =
        app.isCommitteeCase === true &&
        (app.finalJudgment === "기각" ||
          app.landJudgmentsForReview?.some(j => j.judgment === "기각" && j.citizenAppealChoice));
      const appAppealChoice = isCommitteeRejected
        ? (app.landJudgmentsForReview?.find(j => j.citizenAppealChoice)?.citizenAppealChoice
            ?? app.citizenAppealChoice
            ?? null)
        : null;
      const matchesAppeal = appealFilter === "all" || appAppealChoice === appealFilter;
      return matchesSearch && matchesStatus && matchesProjectUnit && matchesAiMismatch && matchesAppeal;
      })
      .sort((a, b) => {
        const dateA = new Date(a.appliedAt).getTime();
        const dateB = new Date(b.appliedAt).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
    }, [periodFilteredApplications, searchQuery, statusFilter, projectUnitFilter, sortOrder, aiMismatchFilter, appealFilter]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredApplications.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredApplications, currentPage, itemsPerPage]);

  // 필터 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, projectUnitFilter, aiMismatchFilter, appealFilter, periodFilter, selectedYear, dateCriteriaType]);

  // 상태별 통계 (기간 필터 적용)
  const stats = useMemo(() => {
    const total = periodFilteredApplications.length;
    const 접수완료 = periodFilteredApplications.filter((a) => a.adminStatus === "접수완료").length;
    const 진행중 = periodFilteredApplications.filter((a) =>
      a.adminStatus === "담당자검토중" ||
      a.adminStatus === "담당자검토완료" ||
      a.adminStatus === "심의위원회회부" ||
      a.adminStatus === "심의위원회검토중" ||
      a.adminStatus === "심의위원회검토완료"
    ).length;
    const 심사완료 = periodFilteredApplications.filter((a) => a.adminStatus === "심사완료").length;
    
    // 심사완료된 건만 기준으로 비교
    const finalCompleted = periodFilteredApplications.filter((a) => a.adminStatus === "심사완료");
    const completedCount = finalCompleted.length;
    
    // AI 초기 판정: 매수가능/매수불가/추가검토필요 (3가지)
    const aiPurchasable = Math.round(completedCount * 0.60);    // 매수가능 60%
    const aiAdditionalReview = Math.max(1, Math.floor(completedCount * 0.08)); // 추가 검토 필요 8%
    const aiNotPurchasable = completedCount - aiPurchasable - aiAdditionalReview; // 매수불가 32%
    const aiAnalyzed = completedCount;
    
    // AI 신뢰도 계산 로직:
    // - AI(매수가능) -> 담당자(매수) = 일치
    // - AI(매수가능) -> 담당자(기각) = 불일치 (반대 결정)
    // - AI(매수가능) -> 담당자(이관) = 불일치 (판단 보류)
    // - AI(매수불가) -> 담당자(기각) = 일치
    // - AI(매수불가) -> 담당자(이관) = 불일치 (판단 보류)
    
    // 시뮬레이션: 불일치 유형 구분
    const mismatchOpposite = Math.max(1, Math.floor(completedCount * 0.05)); // 반대 결정: AI(매수가능)->담당자(기각)
    const mismatchDeferred = Math.max(1, Math.floor(completedCount * 0.05)); // 판단 보류: AI 판정과 무관하게 담당자가 이관
    const aiMismatchCount = mismatchOpposite + mismatchDeferred;
    const aiMatchCount = completedCount - aiMismatchCount;
    const aiReliability = completedCount > 0 ? Math.round((aiMatchCount / completedCount) * 100) : 0;
    
    // 담당자 최종 심사 통계: 매수/기각/이관 (3가지)
    // 전체 건수 = aiAnalyzed와 동일해야 함
    // 이관 건수 = 판단 보류 건수
    const finalTransfer = mismatchDeferred;
    // 매수 건수 = AI 매수가능 - 반대결정(기각으로 변경) - 일부 이관
    const deferredFromPurchasable = Math.floor(mismatchDeferred * 0.6); // 매수가능에서 이관된 건
    // const deferredFromNotPurchasable = mismatchDeferred - deferredFromPurchasable;
    const finalPurchase = aiPurchasable - mismatchOpposite - deferredFromPurchasable;
    // 기각 건수 = AI 매수불가 - 이관 + 반대결정(매수가능->기각)
    // const finalRejectBase = aiNotPurchasable - deferredFromNotPurchasable + mismatchOpposite;
    // 검증: finalPurchase + finalReject + finalTransfer = aiAnalyzed
    // 합이 맞지 않으면 기각 건수를 조정하여 총합이 aiAnalyzed가 되도록 함
    const finalReject = aiAnalyzed - finalPurchase - finalTransfer;
    
    // 처리 완료율
    const completionRate = total > 0 ? Math.round((심사완료 / total) * 100) : 0;
    
    // 오늘 접수된 민원
    const today = new Date().toISOString().split('T')[0];
    const todayCount = periodFilteredApplications.filter((a) => a.appliedAt === today).length;
    
    return {
      total,
      접수완료,
      진행중,
      심사완료,
      aiAnalyzed,
      aiPurchasable,        // AI 초기 판정: 매수가능
      aiAdditionalReview,   // AI 초기 판정: 추가 검토 필요
      aiNotPurchasable,     // AI 초기 판정: 매수불가
      finalPurchase,        // 담당자 최종: 매수
      finalReject,      // 담당자 최종: 기각
      finalTransfer,    // 담당자 최종: 이관
      aiReliability,
      aiMatchCount,
      aiMismatchCount,
      mismatchOpposite, // 반대 결정 건수
      mismatchDeferred, // 판단 보류(이관) 건수
      completionRate,
      todayCount,
    };
  }, [periodFilteredApplications]);

  return (
    <div className="space-y-6">
      {/* 글로벌 필터 바 */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* 좌측: 업데이트 정보 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>업데이트: {isMounted && lastUpdated ? lastUpdated.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '--'}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleRefresh}
                title="새로고침"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
          
          {/* 우측: 기간 필터 */}
          <div className="flex items-center gap-4">
            {/* 조회 기준 선택 */}
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-medium text-muted-foreground">조회 기준:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDateCriteriaType("appliedAt")}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
                    dateCriteriaType === "appliedAt"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                  )}
                >
                  민원 신청일
                </button>
                <button
                  onClick={() => setDateCriteriaType("statusUpdatedAt")}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
                    dateCriteriaType === "statusUpdatedAt"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                  )}
                >
                  상태 변경일
                </button>
              </div>
            </div>

            {/* 조회 기간 */}
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-medium text-muted-foreground">조회 기간:</span>
              <div className="flex items-center gap-1">
                {/* 연도 피커 */}
                <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
                      periodFilter === "year" && selectedYear !== null
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                    )}
                  >
                    {selectedYear !== null ? `${selectedYear}년` : "년도선택"}
                    <ChevronRight className="h-3 w-3 rotate-90" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-1" align="start">
                  <div className="max-h-48 overflow-y-auto">
                    {availableYears.map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          handlePeriodChange("year", year);
                        }}
                        className={cn(
                          "w-full rounded-md px-3 py-1.5 text-left text-[16px] transition-colors",
                          selectedYear === year && periodFilter === "year"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        {year}년
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* 기간 버튼들 */}
              {[
                { value: "today", label: "오늘" },
                { value: "week", label: "이번 주" },
                { value: "month", label: "이번 달" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePeriodChange(option.value as PeriodFilter)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
                    periodFilter === option.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
              
              {/* 직접선택 */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
                      periodFilter === "custom"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    직접선택
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={{ from: customDateRange.from, to: customDateRange.to }}
                    onSelect={(range) => {
                      setCustomDateRange({ from: range?.from, to: range?.to });
                      if (range?.from) {
                        handlePeriodChange("custom");
                      }
                    }}
                    numberOfMonths={2}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* 현재 조회 기준 표시 */}
      <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-4 py-2">
        <CalendarIcon className="h-4 w-4 text-primary" />
        <span className="text-[16px] font-medium text-primary">현재 조회 기준: {dateRangeText}</span>
      </div>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-[16px] font-medium">데이터를 불러오는 중...</span>
          </div>
        </div>
      )}

      {/* 대시보드 요약 */}
      <div className="grid gap-5 lg:grid-cols-11">
        {/* 민원 진행 현황 카드 */}
        <Card className="lg:col-span-6">
          <CardHeader style={{ paddingBottom: '6px' }}>
            <CardTitle className="text-base font-medium" style={{ fontSize: '18px', fontWeight: '600' }}>민원 진행 현황</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" style={{ paddingTop: '0' }}>
            {/* 진행률 바 - Teal 계열로 심사완료와 동기화 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[16px]">
                <span className="text-muted-foreground">전체 처리 완료율</span>
                <span style={{ fontSize: '30px', fontWeight: '800', color: 'rgb(20, 113, 97)' }}>{stats.completionRate}%</span>
              </div>
              <Progress 
                value={stats.completionRate} 
                className="h-[9px]" 
                indicatorClassName="bg-[#2E8B57]"
                style={{ backgroundColor: '#e8f2f0' }}
              />
            </div>
            
            {/* 상태별 현황 그리드 - 카드별 포인트 컬러 적용 */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {/* 전체: Slate 계열 */}
              <div 
                onClick={() => setStatusFilter("all")}
                className="flex cursor-pointer flex-col items-center rounded-lg bg-slate-50 p-4 transition-all hover:bg-slate-100"
              >
                <span className="text-[16px] font-medium text-slate-600" style={{ order: 1 }}>전체</span>
                <div className="flex items-baseline gap-0.5" style={{ order: 2, marginTop: '8px' }}>
                  <span className="font-bold text-slate-900" style={{ fontSize: '42px', lineHeight: '1em' }}>{stats.total}</span>
                  <span className="text-xs font-medium ml-0.5" style={{ color: '#959595' }}>건</span>
                </div>
              </div>
              {/* 접수완료: Indigo #6366F1 (신규 접수 강조) */}
              <div 
                onClick={() => setStatusFilter("접수완료")}
                className="flex cursor-pointer flex-col items-center rounded-lg bg-indigo-50 p-4 transition-all hover:bg-indigo-100"
              >
                <span className="text-[16px] font-medium text-indigo-500" style={{ order: 1 }}>접수완료</span>
                <div className="flex items-baseline gap-0.5" style={{ order: 2, marginTop: '8px' }}>
                  <span className="font-bold text-indigo-500" style={{ fontSize: '42px', lineHeight: '1em' }}>{stats.접수완료}</span>
                  <span className="text-xs font-medium ml-0.5" style={{ color: '#959595' }}>건</span>
                </div>
              </div>
              {/* 진행중: #0091fd (활동 상태 강조) */}
              <div
                onClick={() => setStatusFilter("담당자검토중")}
                className="flex cursor-pointer flex-col items-center rounded-lg p-4 transition-all"
                style={{ backgroundColor: '#e6f4ff' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cce8ff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e6f4ff'}
              >
                <span className="text-[16px] font-medium" style={{ order: 1, color: '#0091fd' }}>진행중</span>
                <div className="flex items-baseline gap-0.5" style={{ order: 2, marginTop: '8px' }}>
                  <span className="font-bold" style={{ fontSize: '42px', lineHeight: '1em', color: '#0091fd' }}>{stats.진행중}</span>
                  <span className="text-xs font-medium ml-0.5" style={{ color: '#959595' }}>건</span>
                </div>
              </div>
              {/* 심사완료: Teal 계열 (완료 상태 강조) */}
              <div 
                onClick={() => setStatusFilter("심사완료")}
                className="flex cursor-pointer flex-col items-center rounded-lg p-4 transition-all"
                style={{ backgroundColor: '#e8f2f0' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(20, 113, 97, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e8f2f0'}
              >
                <span className="text-[16px] font-medium" style={{ order: 1, color: 'rgb(20, 113, 97)' }}>심사완료</span>
                <div className="flex items-baseline gap-0.5" style={{ order: 2, marginTop: '8px' }}>
                  <span className="font-bold" style={{ fontSize: '42px', lineHeight: '1em', color: 'rgb(20, 113, 97)' }}>{stats.심사완료}</span>
                  <span className="text-xs font-medium ml-0.5" style={{ color: '#959595' }}>건</span>
                </div>
              </div>
            </div>
            {/* 기준 안내 문구 */}
            <p className="pt-2 text-xs text-muted-foreground/70">
              ※ 본 통계는 선택된 기간 내 접수된 민원을 기준으로 산출되었습니다.
            </p>
          </CardContent>
        </Card>

        {/* 최근 작업내역 카드 */}
        <Card className="lg:col-span-5 border-0 shadow-none">
          <CardHeader style={{ paddingBottom: '6px' }}>
            <CardTitle className="text-base font-medium flex items-center justify-between">
              <span style={{ fontSize: '18px', fontWeight: '600' }}>최근 작업내역</span>
              <span className="text-[16px] text-muted-foreground">최근 7일</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1" style={{ paddingTop: '0' }}>
            {/* 액티비티 로그 리스트 - 신청관리 화면에서 발생한 활동만 표시 */}
            <TooltipProvider delayDuration={200}>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {[
                  { action: "심사완료 처리", target: "김철수 외 2건", actor: "홍길동", relativeTime: "10분 전", absoluteTime: "2026-05-28 10:47:21", type: "status" },
                  { action: "AI 재분석 실행", target: "김철수 (민원번호: 2026-0525)", actor: "홍길동", relativeTime: "25분 전", absoluteTime: "2026-05-28 10:32:15", type: "ai" },
                  { action: "검토 의견 등록", target: "박영희 (민원번호: 2026-0523)", actor: "김담당", relativeTime: "1시간 전", absoluteTime: "2026-05-28 09:57:33", type: "comment" },
                  { action: "진행중 상태 전환", target: "이민수 (민원번호: 2026-0521)", actor: "홍길동", relativeTime: "2시간 전", absoluteTime: "2026-05-28 08:45:12", type: "status" },
                  { action: "심사완료 처리", target: "정미영 외 1건", actor: "홍길동", relativeTime: "어제", absoluteTime: "2026-05-27 17:23:45", type: "status" },
                  { action: "보완 요청 메모", target: "최동훈 (민원번호: 2026-0518)", actor: "김담당", relativeTime: "어제", absoluteTime: "2026-05-27 14:11:29", type: "comment" },
                  { action: "AI 재분석 실행", target: "강민호 (민원번호: 2026-0517)", actor: "홍길동", relativeTime: "어제", absoluteTime: "2026-05-27 11:05:17", type: "ai" },
                  { action: "신청 접수 확인", target: "윤지현 (민원번호: 2026-0516)", actor: "김담당", relativeTime: "2일 전", absoluteTime: "2026-05-26 15:32:41", type: "status" },
                ].map((activity, index) => (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <div 
                        className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors cursor-default"
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.type === "status" ? "bg-emerald-50" :
                          activity.type === "ai" ? "bg-blue-50" :
                          activity.type === "comment" ? "bg-purple-50" :
                          activity.type === "toggle" ? "bg-amber-50" :
                          "bg-gray-50"
                        }`}>
                          {activity.type === "status" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : activity.type === "ai" ? (
                            <AIIcon className="h-4 w-4 text-blue-600" />
                          ) : activity.type === "comment" ? (
                            <Layers className="h-4 w-4 text-purple-600" />
                          ) : activity.type === "toggle" ? (
                            <FileCheck className="h-4 w-4 text-amber-600" />
                          ) : (
                            <Search className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[16px] font-medium text-foreground truncate">{activity.action}</p>
                          <p className="text-xs text-muted-foreground truncate">{activity.target}</p>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{activity.relativeTime}</span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-medium">{activity.absoluteTime}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
            
            {/* 하단 안내 문구 */}
            <p className="pt-3 text-xs text-muted-foreground/70 text-center border-t mt-2">
              ※ 신청관리 화면에서의 상태 변경, 의견 등록, AI 재분석 내역만 표시됩니다.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 민원 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>민원 목록</CardTitle>
          <CardDescription>
            접수된 잔여지 매수 신청 민원을 관리합니다. 민원을 클릭하여 상세 분석을 진행하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 필터 및 검색 */}
          <div className="mb-6 flex flex-wrap items-center gap-6">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="접수번호, 신청인명, 지번"
            />
            <RadioFilterGroup
              label="진행상황"
              name="status-filter"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as AdminStatus | "all")}
              options={[
                { value: "all", label: "전체" },
                { value: "접수완료", label: "접수 완료" },
                { value: "담당자검토중", label: "담당자 검토 중" },
                { value: "담당자검토완료", label: "민원 종결처리" },
              ]}
            />
            <RadioFilterGroup
              label="수용신청 방법"
              name="appeal-filter"
              value={appealFilter}
              onChange={(v) => setAppealFilter(v as "all" | "중토위" | "한국도로공사")}
              options={[
                { value: "all", label: "전체" },
                { value: "중토위", label: "중토위 신청" },
                { value: "한국도로공사", label: "도로공사 신청" },
              ]}
            />
          </div>

          {/* 테이블 (데스크톱) */}
          <div className="hidden rounded-lg border border-border md:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px] text-center">접수번호</TableHead>
                  <TableHead className="w-[100px] text-center">신청인</TableHead>
                  <TableHead className="w-[150px] text-center">
                    <button
                      onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                      className="flex items-center justify-center gap-1 w-full font-medium hover:text-foreground transition-colors"
                    >
                      신청일시
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[240px] text-center">대상 지번</TableHead>
                  <TableHead className="w-[130px] text-center">진행상황</TableHead>
                  <TableHead className="w-[120px] text-center">심사결과</TableHead>
                  <TableHead className="w-[140px] text-center">수용신청 방법</TableHead>
                  <TableHead className="w-[48px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedApplications.map((app) => (
                  <TableRow
                    key={app.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelect(app)}
                  >
                    <TableCell className="w-[120px] text-center font-medium">
                      <div className="flex items-center justify-center gap-2">
                        {app.applicationNumber}
                        {aiMismatchFilter && app.adminStatus === "심사완료" && (
                          app.applicationNumber.endsWith("2") ? (
                            <span className="rounded bg-rose-100 px-2 py-1 text-[14px] font-medium text-rose-700">반대 결정</span>
                          ) : app.applicationNumber.endsWith("5") ? (
                            <span className="rounded bg-amber-100 px-2 py-1 text-[14px] font-medium text-amber-700">판단 보류</span>
                          ) : null
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-[100px] text-center">{app.applicantName}</TableCell>
                    <TableCell className="w-[150px] text-center">
                      {(() => {
                        const date = new Date(app.appliedAt);
                        const dateStr = date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '');
                        const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
                        return `${dateStr} ${timeStr}`;
                      })()}
                    </TableCell>
                    <TableCell className="w-[240px] text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span>{app.landInfo.address}</span>
                        {(app.additionalLands?.length || 0) >= 1 && (
                          <span className={`inline-flex items-center gap-1 whitespace-nowrap ${PARCEL_COUNT_COLORS.text}`}>
                            <Layers className="h-4 w-4" />
                            <span className="text-[16px] font-medium">{(app.additionalLands?.length || 0) + 1}</span>
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-[130px] text-center">
                      <div className="flex justify-center">
                        <AdminStatusBadge status={toListStatus(app.adminStatus)} />
                      </div>
                    </TableCell>
                    <TableCell className="w-[120px] text-center">
                      <div className="flex justify-center">
                        {app.adminStatus !== "접수완료" ? (
                          <JudgmentSummaryBadge
                            lands={[app.landInfo, ...(app.additionalLands || [])]}
                          />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-[140px] text-center">
                      <div className="flex justify-center">
                        {(() => {
                          const isAppCommitteeRejected =
                            app.isCommitteeCase === true &&
                            (app.finalJudgment === "기각" ||
                              app.landJudgmentsForReview?.some(j => j.judgment === "기각" && j.citizenAppealChoice));
                          if (!isAppCommitteeRejected) return <span className="text-muted-foreground text-[15px]">-</span>;
                          const choices = app.landJudgmentsForReview
                            ?.map(j => j.citizenAppealChoice)
                            .filter(Boolean) as ("중토위" | "한국도로공사")[] | undefined;
                          const primary = choices?.length ? choices[0] : (app.citizenAppealChoice ?? null);
                          if (!primary) return <span className="text-muted-foreground text-[15px]">-</span>;
                          return (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[13px] font-medium ${
                              primary === "중토위"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}>
                              {primary === "중토위" ? "중토위 신청" : "도로공사 신청"}
                            </span>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell className="w-[48px] text-center">
                      <ChevronRight className="h-4 w-4 text-muted-foreground mx-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 카드 목록 (모바일) */}
          <div className="space-y-3 md:hidden">
            {paginatedApplications.map((app) => (
              <button
                key={app.id}
                onClick={() => onSelect(app)}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">
                      {app.applicationNumber}
                    </span>
                    {aiMismatchFilter && app.adminStatus === "심사완료" && (
                      app.applicationNumber.endsWith("2") ? (
                        <span className="rounded bg-rose-100 px-2 py-1 text-[14px] font-medium text-rose-700">반대 결정</span>
                      ) : app.applicationNumber.endsWith("5") ? (
                        <span className="rounded bg-amber-100 px-2 py-1 text-[14px] font-medium text-amber-700">판단 보류</span>
                      ) : null
                    )}
                    {(() => {
                      const isMultiple = app.additionalLands && app.additionalLands.length > 0;
                      
                      if (isMultiple) {
                        return <span className="text-[16px] text-foreground">복수필지 ({app.additionalLands!.length + 1})</span>;
                      } else {
                        return <span className="text-[16px] text-foreground">단일필지</span>;
                      }
                    })()}
                    <ProcessStatusBadge status={app.status} />
                  </div>
                  <p className="text-base text-muted-foreground">
                    {app.applicantName} | {(() => {
                      const date = new Date(app.appliedAt);
                      const dateStr = date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '');
                      const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
                      return `${dateStr} ${timeStr}`;
                    })()}
                  </p>
                  <p className="text-base text-muted-foreground">
                    {app.landInfo.address}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>

          {filteredApplications.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          )}
          
          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 mt-4">
              <PaginationNavButton
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                처음
              </PaginationNavButton>
              <PaginationNavButton
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                이전
              </PaginationNavButton>
              
              {/* 페이지 번호 */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <PaginationButton
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationButton>
                  );
                })}
              </div>
              
              <PaginationNavButton
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                다음
              </PaginationNavButton>
              <PaginationNavButton
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                마지막
              </PaginationNavButton>
              
              <span className="text-[16px] text-muted-foreground ml-2">
                ({filteredApplications.length}건 중 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredApplications.length)}건)
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
