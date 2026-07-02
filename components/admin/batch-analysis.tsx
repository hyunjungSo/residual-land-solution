"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Play,
  Info,
} from "lucide-react";
import { 
  SearchInput, 
  RadioFilterGroup, 
  AIJudgmentBadge, 
  isHighPossibility 
} from "@/components/admin/shared";
import { PaginationButton, PaginationNavButton } from "@/components/ui/pagination-button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import type { 
  ProcessedParcel,
  AnalysisHistory,
  LandCategory,
  LandShape,
  ParcelPublishStatus,
  AIJudgmentResult,
  AIAnalysisResult,
  ResidualStatus
} from "@/lib/types";
import { 
  dummyProcessedParcels,
  landCategories, 
  landShapes, 
} from "@/lib/dummy-data";
import { formatDateTime } from "@/lib/format";
import * as XLSX from "xlsx";

interface BatchAnalysisProps {
  businessUnit?: string;
  onAnalysisComplete?: () => void;
  parcels?: ProcessedParcel[];
  onParcelsUpdate?: (parcels: ProcessedParcel[]) => void;
  onParcelSelect?: (parcel: ProcessedParcel) => void;
}

export function BatchAnalysis({ 
  businessUnit, 
  onAnalysisComplete,
  parcels: externalParcels,
  onParcelsUpdate,
  onParcelSelect
}: BatchAnalysisProps) {
  // 필지 목록
  const [parcels, setParcels] = useState<ProcessedParcel[]>(externalParcels || dummyProcessedParcels);
  
  // 외부 필지 데이터가 변경되면 내부 상태 동기화
  useEffect(() => {
    if (externalParcels) {
      setParcels(externalParcels);
      setCurrentPage(1); // 페이지 초기화
    }
  }, [externalParcels]);
  
  // 검색어
  const [searchQuery, setSearchQuery] = useState("");
  
  // 사업단 목록 추출
  const businessUnits = useMemo(() => {
    const units = new Set(parcels.map(p => p.businessUnit));
    return Array.from(units).sort();
  }, [parcels]);
  
  // 조회기간 필터 (민원인 신청일 기준)
  type PeriodFilterType = "all" | "year" | "today" | "week" | "month" | "custom";
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterType>("year");
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

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

  // 기간 필터링 함수 (민원인 신청일 기준, 신청일이 없으면 등록일 기준)
  const filterByPeriod = (parcel: ProcessedParcel) => {
    if (periodFilter === "all") return true;
    
    // 민원인 신청일 우선 사용, 없으면 등록일로 폴백 (민원인 활동이 없는 관리 대상 필지도 노출되도록)
    const referenceDate = parcel.citizenActivity?.applicationSubmittedAt ?? parcel.registeredAt;
    if (!referenceDate) return false; // 기준 날짜가 전혀 없으면 제외
    
    const parcelDate = new Date(referenceDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    switch (periodFilter) {
      case "year": {
        if (selectedYear === null) return true;
        const yearStart = new Date(selectedYear, 0, 1);
        const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
        return parcelDate >= yearStart && parcelDate <= yearEnd;
      }
      case "today":
        return parcelDate >= today && parcelDate < tomorrow;
      case "week": {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return parcelDate >= weekAgo && parcelDate < tomorrow;
      }
      case "month": {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return parcelDate >= monthStart && parcelDate < tomorrow;
      }
      case "custom": {
        if (!customDateRange.from) return true;
        const start = customDateRange.from;
        const end = customDateRange.to || start;
        const endOfDay = new Date(end);
        endOfDay.setHours(23, 59, 59, 999);
        return parcelDate >= start && parcelDate <= endOfDay;
      }
      default:
        return true;
    }
  };

  // 조회기간 변경 핸들러
  const handlePeriodChange = (newPeriod: PeriodFilterType, year?: number) => {
    if (newPeriod === "year" && year !== undefined) {
      setSelectedYear(year);
    }
    setPeriodFilter(newPeriod);
    setCurrentPage(1);
  };

  // 필터 (라디오 버튼)
  const [aiJudgmentFilter, setAiJudgmentFilter] = useState<"all" | "high" | "low" | "pending">("all");
  const [businessUnitFilter, setBusinessUnitFilter] = useState<string>("");
  // 편입 유형 필터 (기존 잔여지 판정)
  const [inclusionTypeFilter, setInclusionTypeFilter] = useState<"all" | "full" | "partial" | "pending">("partial");
  // 판독 유형 필터 (AI판독 / 수동판독 / 전체)
  const [analysisSourceFilter, setAnalysisSourceFilter] = useState<"all" | "ai" | "manual-select">("all");

  // 편입 유형 카드 클릭 핸들러 (필터 리셋 포함)
  const handleInclusionTypeClick = (value: "all" | "full" | "partial" | "pending") => {
    setInclusionTypeFilter(value);
    setAiJudgmentFilter("all");
    setAnalysisSourceFilter("all");
    setCurrentPage(1);
  };

  // AI 보상 가능성 카드 클릭 핸들러 — 항상 잔여지인정 필지 기준으로 필터
  const handleAiJudgmentClick = (value: "all" | "high" | "low" | "pending") => {
    setAiJudgmentFilter(value);
    setInclusionTypeFilter("partial");
    setCurrentPage(1);
  };

  // 판독 유형 카드 클릭 핸들러
  const handleAnalysisSourceClick = (source: "ai" | "manual-select", judgment: "all" | "high" | "low" = "all") => {
    setAnalysisSourceFilter(source);
    setAiJudgmentFilter(judgment);
    setInclusionTypeFilter("partial");
    setCurrentPage(1);
  };
  
  // 사업단 필터 기본값 설정 (첫 번째 사업단)
  useEffect(() => {
    if (businessUnits.length > 0 && !businessUnitFilter) {
      setBusinessUnitFilter(businessUnits[0]);
    }
  }, [businessUnits, businessUnitFilter]);
  
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // 토스트
  const { toast } = useToast();

  // 히스토리 다이얼로그
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedHistoryParcel, setSelectedHistoryParcel] = useState<ProcessedParcel | null>(null);
  const [analysisOptions, setAnalysisOptions] = useState({
    useCurrentUsage: true,
    useLandShape: true,
  });

  // 배치 분석을 위한 필지 선택
  const [selectedParcelIds, setSelectedParcelIds] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isInclusionAnalyzing, setIsInclusionAnalyzing] = useState(false);
  const [isPurchaseAnalyzing, setIsPurchaseAnalyzing] = useState(false);
  const [analyzingParcelId, setAnalyzingParcelId] = useState<string | null>(null);

  // 통합 판독 실행 단계 상태
  type IntegratedStep = "idle" | "step1" | "step2" | "success";
  const [integratedStep, setIntegratedStep] = useState<IntegratedStep>("idle");

  const handleIntegratedAnalysis = async () => {
    if (selectedParcelIds.size === 0) return;

    // 1단계: 편입 유형 분석
    setIntegratedStep("step1");
    setIsInclusionAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const updatedParcels = parcels.map(p => {
      if (!selectedParcelIds.has(p.id)) return p;
      const residualStatus = Math.random() > 0.3 ? "잔여지 인정" : "기준 미달" as const;
      return { ...p, residualStatus } as ProcessedParcel;
    });
    setParcels(updatedParcels);
    onParcelsUpdate?.(updatedParcels);
    setIsInclusionAnalyzing(false);

    // 잔여지 인정 필지만 2단계 진행
    const residualIds = new Set(
      updatedParcels.filter(p => selectedParcelIds.has(p.id) && p.residualStatus === "잔여지 인정").map(p => p.id)
    );

    if (residualIds.size > 0) {
      setIntegratedStep("step2");
      setIsPurchaseAnalyzing(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      await performAiAnalysis(residualIds, updatedParcels, "auto");
      setIsPurchaseAnalyzing(false);
    }

    setIntegratedStep("success");
    toast({
      title: "AI 통합 판독 완료",
      description: `${selectedParcelIds.size}건의 통합 판독이 완료되었습니다.`,
      duration: 3500,
    });
    setSelectedParcelIds(new Set());
    await new Promise(resolve => setTimeout(resolve, 500));
    setIntegratedStep("idle");
    onAnalysisComplete?.();
  };

  // 정렬 상태
  const [sortColumn, setSortColumn] = useState<"address" | "remainingArea" | "remainingRatio" | "includedArea" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: "address" | "remainingArea" | "remainingRatio" | "includedArea") => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleDownloadExcel = () => {
    const rows = filteredParcels.map((p, i) => ({
      "No.": i + 1,
      소재지: p.landInfo.address,
      소유자: p.landInfo.ownerName,
      "잔여면적(㎡)": p.landInfo.remainingArea,
      "편입면적(㎡)": p.landInfo.includedArea ?? "",
      "잔여비율(%)": p.landInfo.remainingRatio ?? "",
      편입유형: p.residualStatus === "잔여지 인정" ? "잔여지 발생" : !p.residualStatus ? "판독대기" : "-",
      매수가능성: p.residualStatus !== "잔여지 인정" ? "-" : p.aiResult ? (p.aiResult.provisionalJudgment === "보상 가능성 높음" ? "높음" : "낮음") : "검토필요",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "필지목록");
    XLSX.writeFile(wb, "필지관리목록.xlsx");
  };

  // 필지 선택/해제 토글
  const handleToggleParcelSelection = (parcelId: string) => {
    setSelectedParcelIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(parcelId)) {
        newSet.delete(parcelId);
      } else {
        newSet.add(parcelId);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const handleToggleSelectAll = () => {
    if (selectedParcelIds.size === filteredParcels.length) {
      setSelectedParcelIds(new Set());
    } else {
      setSelectedParcelIds(new Set(filteredParcels.map(p => p.id)));
    }
  };

  // 단일 필지 분석 실행
  const handleAnalyzeSingleParcel = async (parcelId: string) => {
    setAnalyzingParcelId(parcelId);
    try {
      const parcel = parcels.find(p => p.id === parcelId);
      if (!parcel) return;

      const judgment: AIJudgmentResult = Math.random() > 0.5 ? "보상 가능성 높음" : "보상 가능성 낮음";
      const newAiResult: AIAnalysisResult = {
        ...parcel.aiResult,
        provisionalJudgment: judgment,
        landTypePath: parcel.aiResult?.landTypePath || "농지",
        criteriaChecks: parcel.aiResult?.criteriaChecks || [],
        originalShapeIndex: parcel.aiResult?.originalShapeIndex || 0,
        remainingShapeIndex: parcel.aiResult?.remainingShapeIndex || 0,
        shapeIndexChange: parcel.aiResult?.shapeIndexChange || 0,
        isBlindLand: parcel.aiResult?.isBlindLand || false,
        accessRoadLost: parcel.aiResult?.accessRoadLost || false,
        waterChannelLost: parcel.aiResult?.waterChannelLost || false,
        farmMachineDifficulty: parcel.aiResult?.farmMachineDifficulty || false,
        judgmentRationale: parcel.aiResult?.judgmentRationale || { summary: "", legalBasis: "", appliedCriteria: [], detailedExplanation: "" },
      };

      const newHistory: AnalysisHistory = {
        id: `analysis_${Date.now()}_${Math.random()}`,
        parcelId,
        stage: parcel.analysisHistory?.length ? "2차분석" : "1차분석",
        analyzedAt: new Date().toISOString(),
        analyzedBy: "AI 자동 분석",
        newResult: judgment,
        previousResult: parcel.aiResult?.provisionalJudgment || undefined,
        changedOptions: {},
        aiResult: newAiResult,
      };

      const updatedParcel: ProcessedParcel = {
        ...parcel,
        aiResult: newAiResult,
        analysisHistory: [...(parcel.analysisHistory || []), newHistory],
        lastAnalyzedAt: new Date().toISOString(),
        isVisible: true,
      };

      setParcels(prev =>
        prev.map(p => p.id === parcelId ? updatedParcel : p)
      );

      onAnalysisComplete?.();
    } finally {
      setAnalyzingParcelId(null);
    }
  };

  // 단일 필지 분석 실행
  const handleSingleAnalysis = async (parcelId: string) => {
    setAnalyzingParcelId(parcelId);
    try {
      const parcel = parcels.find(p => p.id === parcelId);
      if (!parcel) return;

      // 분석 시뮬레이션 (1초 딜레이)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const judgment: AIJudgmentResult = Math.random() > 0.5 ? "보상 가능성 높음" : "보상 가능성 낮음";
      const newAiResult: AIAnalysisResult = { ...parcel.aiResult, provisionalJudgment: judgment, landTypePath: parcel.aiResult?.landTypePath || "농지", criteriaChecks: parcel.aiResult?.criteriaChecks || [], originalShapeIndex: parcel.aiResult?.originalShapeIndex || 0, remainingShapeIndex: parcel.aiResult?.remainingShapeIndex || 0, shapeIndexChange: 0, isBlindLand: false, accessRoadLost: parcel.aiResult?.accessRoadLost || false, waterChannelLost: parcel.aiResult?.waterChannelLost || false, farmMachineDifficulty: parcel.aiResult?.farmMachineDifficulty || false, judgmentRationale: parcel.aiResult?.judgmentRationale || { summary: "", legalBasis: "", appliedCriteria: [], detailedExplanation: "" } };
      const newHistory: AnalysisHistory = {
        id: `analysis_${Date.now()}_${Math.random()}`,
        parcelId,
        stage: parcel.analysisHistory?.length ? "2차분석" : "1차분석",
        analyzedAt: new Date().toISOString(),
        analyzedBy: "AI 자동 분석",
        newResult: judgment,
        previousResult: parcel.aiResult?.provisionalJudgment || undefined,
        changedOptions: {},
        aiResult: newAiResult,
      };

      setParcels(prev => prev.map(p =>
        p.id === parcelId
          ? { ...p, aiResult: newAiResult, analysisHistory: [...(p.analysisHistory || []), newHistory], lastAnalyzedAt: new Date().toISOString(), isVisible: true } as ProcessedParcel
          : p
      ));
    } finally {
      setAnalyzingParcelId(null);
    }
  };

  // AI 분석 공통 헬퍼 (선택 배치 및 자동 트리거 공용)
  const performAiAnalysis = async (targetIds: Set<string>, baseParcels: ProcessedParcel[], source: "auto" | "manual" = "manual") => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const parcelsToAnalyze = baseParcels.filter(p => targetIds.has(p.id));
    const analyzed = parcelsToAnalyze.map(parcel => {
      const judgment: AIJudgmentResult = Math.random() > 0.5 ? "보상 가능성 높음" : "보상 가능성 낮음";
      const newAiResult: AIAnalysisResult = { ...parcel.aiResult, provisionalJudgment: judgment, landTypePath: parcel.aiResult?.landTypePath || "농지", criteriaChecks: parcel.aiResult?.criteriaChecks || [], originalShapeIndex: parcel.aiResult?.originalShapeIndex || 0, remainingShapeIndex: parcel.aiResult?.remainingShapeIndex || 0, shapeIndexChange: 0, isBlindLand: false, accessRoadLost: parcel.aiResult?.accessRoadLost || false, waterChannelLost: parcel.aiResult?.waterChannelLost || false, farmMachineDifficulty: parcel.aiResult?.farmMachineDifficulty || false, judgmentRationale: parcel.aiResult?.judgmentRationale || { summary: "", legalBasis: "", appliedCriteria: [], detailedExplanation: "" }, analysisSource: source };
      const newHistory: AnalysisHistory = { id: `analysis_${Date.now()}_${Math.random()}`, parcelId: parcel.id, stage: parcel.analysisHistory?.length ? "2차분석" : "1차분석", analyzedAt: new Date().toISOString(), analyzedBy: source === "auto" ? "AI 자동 분석" : "수동 판독", newResult: judgment, previousResult: parcel.aiResult?.provisionalJudgment || undefined, changedOptions: {}, aiResult: newAiResult };
      return { ...parcel, aiResult: newAiResult, analysisHistory: [...(parcel.analysisHistory || []), newHistory], lastAnalyzedAt: new Date().toISOString(), isVisible: true } as ProcessedParcel;
    });
    setParcels(prev => {
      const updated = [...prev];
      analyzed.forEach(a => {
        const idx = updated.findIndex(p => p.id === a.id);
        if (idx !== -1) updated[idx] = a;
      });
      return updated;
    });
    return analyzed.length;
  };

  // AI 보상 가능성 분석 실행 (수동 선택)
  const handleBatchAnalysis = async () => {
    if (selectedParcelIds.size === 0) return;
    setIsPurchaseAnalyzing(true);
    try {
      const count = await performAiAnalysis(selectedParcelIds, parcels);
      toast({
        title: "AI 보상 가능성 분석 완료",
        description: `${count}건의 AI 보상 가능성 분석이 완료되었습니다.`,
        duration: 3500,
      });
      setSelectedParcelIds(new Set());
      onAnalysisComplete?.();
    } finally {
      setIsPurchaseAnalyzing(false);
    }
  };


  // 선택 필지 편입 유형 분석 실행 핸들러 (기존 잔여지 판정)
  const handleInclusionTypeAnalysis = async () => {
    if (selectedParcelIds.size === 0) return;

    setIsInclusionAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedParcels = parcels.map(p => {
        if (!selectedParcelIds.has(p.id)) return p;
        const residualStatus = Math.random() > 0.3 ? "잔여지 인정" : "기준 미달" as const;
        return { ...p, residualStatus } as ProcessedParcel;
      });

      setParcels(updatedParcels);
      onParcelsUpdate?.(updatedParcels);

      toast({
        title: "편입 유형 판독 완료",
        description: `${selectedParcelIds.size}건의 편입 유형 판독이 완료되었습니다.`,
        duration: 3500,
      });

      setSelectedParcelIds(new Set());

      // 잔여지 인정 필지에 대해 AI 보상 가능성 자동 분석
      const autoIds = new Set(updatedParcels.filter(p => selectedParcelIds.has(p.id) && p.residualStatus === "잔여지 인정").map(p => p.id));
      if (autoIds.size > 0) {
        setIsPurchaseAnalyzing(true);
        try {
          const count = await performAiAnalysis(autoIds, updatedParcels, "auto");
          toast({
            title: "AI 보상 가능성 자동 분석 완료",
            description: `잔여지 인정 ${count}건에 대한 AI 분석이 자동으로 완료되었습니다.`,
            duration: 3500,
          });
          onAnalysisComplete?.();
        } finally {
          setIsPurchaseAnalyzing(false);
        }
      }
    } finally {
      setIsInclusionAnalyzing(false);
    }
  };

  // 필터링된 필지 목록
  const filteredParcels = useMemo(() => {
    const result = parcels.filter(parcel => {
      // 면적이 0인 필지 제외
      if (parcel.landInfo.remainingArea === 0) return false;
      
      // 조회기간 필터 (민원인 신청일 기준)
      if (!filterByPeriod(parcel)) return false;
      
      // 사업단 필터 (props로 전달된 것 또는 Select로 선택된 것)
      if (businessUnit && parcel.businessUnit !== businessUnit) return false;
      if (businessUnitFilter && parcel.businessUnit !== businessUnitFilter) return false;
      
      // 검색어 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesAddress = parcel.landInfo.address.toLowerCase().includes(query);
        const matchesOwner = parcel.landInfo.ownerName.toLowerCase().includes(query);
        const matchesBusinessUnit = parcel.businessUnit.toLowerCase().includes(query);
        if (!matchesAddress && !matchesOwner && !matchesBusinessUnit) return false;
      }
      
      // AI판독결과 필터 (auto/auto-change/manual 소스만)
      if (aiJudgmentFilter !== "all") {
        const aiEntry = [...(parcel.analysisHistory ?? [])].reverse().find(
          h => h.aiResult?.analysisSource === "auto" || h.aiResult?.analysisSource === "auto-change" || h.aiResult?.analysisSource === "manual"
        );
        const aiJudgment = aiEntry?.aiResult?.provisionalJudgment
          ?? (parcel.aiResult?.analysisSource !== "manual-select" ? parcel.aiResult?.provisionalJudgment : undefined);
        if (aiJudgmentFilter === "pending") {
          if (aiJudgment) return false;
        } else {
          if (!aiJudgment) return false;
          const isHigh = isHighPossibility(aiJudgment);
          if (aiJudgmentFilter === "high" && !isHigh) return false;
          if (aiJudgmentFilter === "low" && isHigh) return false;
        }
      }

      // 편입 유형 필터 — "all"도 분석 완료(기준 미달 or 잔여지 인정)만 포함
      if (inclusionTypeFilter === "full") {
        if (parcel.residualStatus !== "기준 미달") return false;
      } else if (inclusionTypeFilter === "partial") {
        if (parcel.residualStatus !== "잔여지 인정") return false;
      } else if (inclusionTypeFilter === "pending") {
        if (parcel.residualStatus) return false;
      } else {
        // "all" — 기준 미달 + 잔여지 인정만 포함 (미분석 + 판정대기 제외)
        if (parcel.residualStatus !== "잔여지 인정" && parcel.residualStatus !== "기준 미달") return false;
      }

      // 판독 유형 필터
      if (analysisSourceFilter !== "all") {
        const src = parcel.aiResult?.analysisSource;
        if (analysisSourceFilter === "ai" && src !== "auto" && src !== "auto-change" && src !== "manual") return false;
        if (analysisSourceFilter === "manual-select" && src !== "manual-select") return false;
      }

      return true;
    });

    if (sortColumn) {
      result.sort((a: ProcessedParcel, b: ProcessedParcel) => {
        let valA: string | number;
        let valB: string | number;
        if (sortColumn === "address") { valA = a.landInfo.address; valB = b.landInfo.address; }
        else if (sortColumn === "remainingArea") { valA = a.landInfo.remainingArea; valB = b.landInfo.remainingArea; }
        else if (sortColumn === "remainingRatio") { valA = a.landInfo.remainingRatio ?? 0; valB = b.landInfo.remainingRatio ?? 0; }
        else { valA = a.landInfo.includedArea ?? 0; valB = b.landInfo.includedArea ?? 0; }
        if (typeof valA === "string") return sortDirection === "asc" ? valA.localeCompare(valB as string) : (valB as string).localeCompare(valA);
        return sortDirection === "asc" ? valA - (valB as number) : (valB as number) - valA;
      });
    }

    return result;
  }, [parcels, businessUnit, businessUnitFilter, searchQuery, aiJudgmentFilter, inclusionTypeFilter, analysisSourceFilter, periodFilter, selectedYear, customDateRange, sortColumn, sortDirection]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredParcels.length / itemsPerPage);
  const paginatedParcels = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredParcels.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredParcels, currentPage, itemsPerPage]);

  // 필터 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, aiJudgmentFilter, businessUnitFilter, inclusionTypeFilter, analysisSourceFilter, periodFilter, selectedYear]);

  // 통계 — 목록과 동일한 기준 필터 적용
  const stats = useMemo(() => {
    const relevantParcels = parcels.filter(parcel => {
      if (businessUnit && parcel.businessUnit !== businessUnit) return false;
      if (businessUnitFilter && parcel.businessUnit !== businessUnitFilter) return false;
      if (!filterByPeriod(parcel)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !parcel.landInfo.address.toLowerCase().includes(q) &&
          !parcel.landInfo.ownerName.toLowerCase().includes(q) &&
          !parcel.businessUnit.toLowerCase().includes(q)
        ) return false;
      }

      return true;
    });

    const total = relevantParcels.length;
    const pendingInclusion = relevantParcels.filter(p => !p.residualStatus).length;
    const fullInclusion = relevantParcels.filter(p => p.residualStatus === "기준 미달").length;
    const partialInclusion = relevantParcels.filter(p => p.residualStatus === "잔여지 인정").length;
    const pendingReview = relevantParcels.filter(p => p.residualStatus === "잔여지 인정" && !p.aiResult).length;
    const highPossibility = relevantParcels.filter(p =>
      p.residualStatus === "잔여지 인정" && p.aiResult && isHighPossibility(p.aiResult.provisionalJudgment)
    ).length;
    const lowPossibility = relevantParcels.filter(p =>
      p.residualStatus === "잔여지 인정" && p.aiResult && !isHighPossibility(p.aiResult.provisionalJudgment)
    ).length;

    // AI판독 통합 (auto + auto-change + manual AI재판독)
    const autoRegular = relevantParcels.filter(p =>
      p.residualStatus === "잔여지 인정" && p.aiResult?.analysisSource === "auto"
    ).length;
    const autoChange = relevantParcels.filter(p =>
      p.residualStatus === "잔여지 인정" && p.aiResult?.analysisSource === "auto-change"
    ).length;
    const aiReanalysis = relevantParcels.filter(p =>
      p.residualStatus === "잔여지 인정" && p.aiResult?.analysisSource === "manual"
    ).length;
    const aiCount = autoRegular + autoChange + aiReanalysis;

    // 담당자 직접 선택 (manual-select)
    const manualSelectCount = relevantParcels.filter(p =>
      p.residualStatus === "잔여지 인정" && p.aiResult?.analysisSource === "manual-select"
    ).length;

    // 결과별 분류
    const isAiSource = (src?: string) => src === "auto" || src === "auto-change" || src === "manual";
    const highAI = relevantParcels.filter(p =>
      p.residualStatus === "잔여지 인정" && p.aiResult && isHighPossibility(p.aiResult.provisionalJudgment) &&
      isAiSource(p.aiResult.analysisSource)
    ).length;
    const lowAI = relevantParcels.filter(p =>
      p.residualStatus === "잔여지 인정" && p.aiResult && !isHighPossibility(p.aiResult.provisionalJudgment) &&
      isAiSource(p.aiResult.analysisSource)
    ).length;
    const highManualSelect = relevantParcels.filter(p =>
      p.residualStatus === "잔여지 인정" && p.aiResult && isHighPossibility(p.aiResult.provisionalJudgment) &&
      p.aiResult.analysisSource === "manual-select"
    ).length;
    const lowManualSelect = relevantParcels.filter(p =>
      p.residualStatus === "잔여지 인정" && p.aiResult && !isHighPossibility(p.aiResult.provisionalJudgment) &&
      p.aiResult.analysisSource === "manual-select"
    ).length;

    const aiTotal = pendingReview + highAI + lowAI;
    const manualSelectPending = partialInclusion - manualSelectCount;

    return {
      total, pendingInclusion, fullInclusion, partialInclusion, pendingReview,
      highPossibility, lowPossibility,
      autoRegular, autoChange, aiReanalysis, aiCount, manualSelectCount,
      highAI, lowAI, highManualSelect, lowManualSelect, aiTotal, manualSelectPending,
    };
  }, [parcels, businessUnit, businessUnitFilter, periodFilter, selectedYear, customDateRange, searchQuery]);

  // 히스토리 보기
  const handleViewHistory = (parcel: ProcessedParcel) => {
    setSelectedHistoryParcel(parcel);
    setShowHistoryDialog(true);
  };

  // 필지 상세 보기 (테이블 행 클릭)
  const handleParcelClick = (parcel: ProcessedParcel) => {
    if (onParcelSelect) {
      onParcelSelect(parcel);
    }
  };

  return (
    <div className="space-y-6">
      {/* 타이틀 영역 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">필지 관리</h1>
      </div>
      
      <p className="text-muted-foreground -mt-4">편입 유형 분석 및 보상 가능성 심사를 관리합니다.</p>

      {/* 대시보드 요약 - 3카드 구조 */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* 편입 유형 현황 카드 */}
        <Card>
          <CardHeader style={{ paddingBottom: '6px' }}>
            <CardTitle className="text-base font-medium" style={{ fontSize: '18px', fontWeight: '600' }}>편입 유형 현황</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2" style={{ paddingTop: '0' }}>
            {/* 진행률 바 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[16px]">
                <span className="text-muted-foreground">잔여지 발생율</span>
                <span style={{ fontSize: '30px', fontWeight: '800', color: 'rgb(20, 113, 97)' }}>
                  {(stats.fullInclusion + stats.partialInclusion) > 0 ? Math.round((stats.partialInclusion / (stats.fullInclusion + stats.partialInclusion)) * 100) : 0}%
                </span>
              </div>
              <Progress
                value={(stats.fullInclusion + stats.partialInclusion) > 0 ? (stats.partialInclusion / (stats.fullInclusion + stats.partialInclusion)) * 100 : 0}
                className="h-[9px]"
                indicatorClassName="bg-[#2E8B57]"
                style={{ backgroundColor: '#e8f2f0' }}
              />
            </div>
            
            {/* 상태별 현황 그리드 - 3개 카드 */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {/* 전체: Black */}
              <div
                onClick={() => handleInclusionTypeClick("all")}
                className="flex cursor-pointer flex-col items-center rounded-lg bg-slate-50 p-4 transition-all hover:bg-slate-100"
              >
                <span className="text-[16px] font-medium text-black" style={{ order: 1 }}>전체</span>
                <div className="flex items-baseline gap-0.5" style={{ order: 2, marginTop: '8px' }}>
                  <span className="font-bold text-black" style={{ fontSize: '42px', lineHeight: '1em' }}>{stats.fullInclusion + stats.partialInclusion}</span>
                  <span className="text-xs font-medium ml-0.5" style={{ color: '#959595' }}>건</span>
                </div>
              </div>
              {/* 전체 편입: Gray */}
              <div
                onClick={() => handleInclusionTypeClick("full")}
                className="flex cursor-pointer flex-col items-center rounded-lg bg-gray-50 p-4 transition-all hover:bg-gray-100"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 text-[16px] font-medium text-gray-500 underline decoration-dotted underline-offset-2 cursor-help" style={{ order: 1 }}><Info className="h-3.5 w-3.5 flex-shrink-0" />전체 편입</span>
                  </TooltipTrigger>
                  <TooltipContent side="top">전체 편입으로 잔여지가 발생하지 않은 필지입니다.</TooltipContent>
                </Tooltip>
                <div className="flex items-baseline gap-0.5" style={{ order: 2, marginTop: '8px' }}>
                  <span className="font-bold text-gray-600" style={{ fontSize: '42px', lineHeight: '1em' }}>{stats.fullInclusion}</span>
                  <span className="text-xs font-medium ml-0.5" style={{ color: '#959595' }}>건</span>
                </div>
              </div>
              {/* 잔여지 발생: Emerald */}
              <div
                onClick={() => handleInclusionTypeClick("partial")}
                className="flex cursor-pointer flex-col items-center rounded-lg bg-emerald-50 p-4 transition-all hover:bg-emerald-100"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 text-[16px] font-medium text-emerald-600 underline decoration-dotted underline-offset-2 cursor-help" style={{ order: 1 }}><Info className="h-3.5 w-3.5 flex-shrink-0" />잔여지 발생</span>
                  </TooltipTrigger>
                  <TooltipContent side="top">편입 후 잔여지가 발생하여 AI 보상 가능성 분석 대상인 필지입니다.</TooltipContent>
                </Tooltip>
                <div className="flex items-baseline gap-0.5" style={{ order: 2, marginTop: '8px' }}>
                  <span className="font-bold text-emerald-700" style={{ fontSize: '42px', lineHeight: '1em' }}>{stats.partialInclusion}</span>
                  <span className="text-xs font-medium ml-0.5" style={{ color: '#959595' }}>건</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI판독현황 카드 (자동 + AI재판독 통합) */}
        <Card>
          <CardHeader style={{ paddingBottom: '6px' }}>
            <CardTitle className="text-base font-medium" style={{ fontSize: '18px', fontWeight: '600' }}>AI판독현황</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2" style={{ paddingTop: '0' }}>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[16px]">
                <span className="text-muted-foreground">AI 보상 가능성 높음 비율</span>
                <span style={{ fontSize: '30px', fontWeight: '800', color: 'rgb(20, 113, 97)' }}>
                  {stats.partialInclusion > 0 ? Math.round((stats.highAI / stats.partialInclusion) * 100) : 0}%
                </span>
              </div>
              <Progress
                value={stats.partialInclusion > 0 ? (stats.highAI / stats.partialInclusion) * 100 : 0}
                className="h-[9px]"
                indicatorClassName="bg-[#2E8B57]"
                style={{ backgroundColor: '#e8f2f0' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {/* 전체 */}
              <div
                onClick={() => handleAnalysisSourceClick("ai", "all")}
                className="flex cursor-pointer flex-col items-center rounded-lg bg-slate-50 p-4 transition-all hover:bg-slate-100"
              >
                <span className="text-[16px] font-medium text-black">전체</span>
                <div className="flex items-baseline gap-0.5 mt-2">
                  <span className="font-bold text-black" style={{ fontSize: '42px', lineHeight: '1em' }}>{stats.partialInclusion}</span>
                  <span className="text-xs font-medium ml-0.5" style={{ color: '#959595' }}>건</span>
                </div>
              </div>
              {/* 검토필요 */}
              <div
                onClick={() => { setAiJudgmentFilter("pending"); setInclusionTypeFilter("partial"); setAnalysisSourceFilter("all"); setCurrentPage(1); }}
                className="flex cursor-pointer flex-col items-center rounded-lg bg-amber-50 p-4 transition-all hover:bg-amber-100"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 text-[16px] font-medium text-amber-600 underline decoration-dotted underline-offset-2 cursor-help"><Info className="h-3.5 w-3.5 flex-shrink-0" />검토필요</span>
                  </TooltipTrigger>
                  <TooltipContent side="top">AI 분석 결과만으로 보상 가능성을 판정하기 어려워 담당자의 직접 확인이 필요한 건수입니다.</TooltipContent>
                </Tooltip>
                <div className="flex items-baseline gap-0.5 mt-2">
                  <span className="font-bold text-amber-600" style={{ fontSize: '42px', lineHeight: '1em' }}>{stats.pendingReview}</span>
                  <span className="text-xs font-medium ml-0.5" style={{ color: '#959595' }}>건</span>
                </div>
              </div>
              {/* 높음 */}
              <div
                onClick={() => handleAnalysisSourceClick("ai", "high")}
                className="flex cursor-pointer flex-col items-center rounded-lg bg-emerald-50 p-4 transition-all hover:bg-emerald-100"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 text-[16px] font-medium text-emerald-600 underline decoration-dotted underline-offset-2 cursor-help"><Info className="h-3.5 w-3.5 flex-shrink-0" />매수가능성 높음</span>
                  </TooltipTrigger>
                  <TooltipContent side="top">AI가 보상 가능성이 높다고 판단한 건수입니다.</TooltipContent>
                </Tooltip>
                <div className="flex items-baseline gap-0.5 mt-2">
                  <span className="font-bold text-emerald-700" style={{ fontSize: '42px', lineHeight: '1em' }}>{stats.highAI}</span>
                  <span className="text-xs font-medium ml-0.5" style={{ color: '#959595' }}>건</span>
                </div>
              </div>
              {/* 낮음 */}
              <div
                onClick={() => handleAnalysisSourceClick("ai", "low")}
                className="flex cursor-pointer flex-col items-center rounded-lg bg-rose-50 p-4 transition-all hover:bg-rose-100"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 text-[16px] font-medium text-rose-500 underline decoration-dotted underline-offset-2 cursor-help"><Info className="h-3.5 w-3.5 flex-shrink-0" />매수가능성 낮음</span>
                  </TooltipTrigger>
                  <TooltipContent side="top">AI가 보상 가능성이 낮다고 판단한 건수입니다.</TooltipContent>
                </Tooltip>
                <div className="flex items-baseline gap-0.5 mt-2">
                  <span className="font-bold text-rose-600" style={{ fontSize: '42px', lineHeight: '1em' }}>{stats.lowAI}</span>
                  <span className="text-xs font-medium ml-0.5" style={{ color: '#959595' }}>건</span>
                </div>
              </div>
            </div>
            <div className="mt-3 px-1 space-y-1.5">
              <p className="text-[15px] text-slate-600 flex items-start gap-2">
                <span className="mt-px shrink-0 text-slate-400">•</span>
                전체 건수는 <span className="font-medium text-slate-700">잔여지 발생</span> 필지를 대상으로 AI가 보상 가능성을 판독한 건수입니다.
              </p>
              <p className="text-[15px] text-slate-600 flex items-start gap-2">
                <span className="mt-px shrink-0 text-slate-400">•</span>
                AI 판독은 <span className="font-medium text-slate-700">7일에 한 번씩</span> 자동으로 업데이트됩니다.
              </p>
              <p className="text-[15px] text-slate-600 flex items-start gap-2">
                <span className="mt-px shrink-0 text-slate-400">•</span>
                토지정보 <span className="font-medium text-slate-700">변동 감지 시</span> 자동으로 재판독이 실행됩니다.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 필지 목록 테이블 */}
      <Card className="border-0 shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">필지 관리 목록</CardTitle>
            </div>
            {/* 엑셀 다운로드 + AI 통합 판독 버튼 */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownloadExcel}
                variant="outline"
                className="whitespace-nowrap"
                title="Excel 다운로드"
              >
                <Download className="h-4 w-4 mr-1.5" />
                엑셀 다운로드
              </Button>
              <Button
                onClick={handleIntegratedAnalysis}
                disabled={selectedParcelIds.size === 0 || integratedStep !== "idle"}
                variant="cta"
                className={`whitespace-nowrap min-w-[260px] ${integratedStep !== "idle" ? "pointer-events-none opacity-80" : ""}`}
              >
                {integratedStep === "idle" && (
                  <>AI 통합 판독 실행 ({selectedParcelIds.size}건)</>
                )}
                {integratedStep === "step1" && (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />1단계: 편입 유형 분석 중...</>
                )}
                {integratedStep === "step2" && (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />2단계: AI 보상 가능성 검토 중...</>
                )}
                {integratedStep === "success" && (
                  <>통합 판독 완료</>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 검색 및 필터 */}
          <div className="space-y-4">
            {/* 1행: 검색바 + 편입유형 + AI판독결과 */}
            <div className="flex flex-row items-center gap-[2.4rem]">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="소재지, 소유자명을 입력하세요"
                className="flex-1 min-w-0"
              />
              <div className="flex flex-wrap items-center gap-[2.4rem]">
                <RadioFilterGroup
                  label="편입 유형"
                  name="inclusion-type"
                  value={inclusionTypeFilter}
                  onChange={(v) => setInclusionTypeFilter(v as "all" | "full" | "partial" | "pending")}
                  options={[
                    { value: "all", label: "전체" },
                    { value: "full", label: "전체 편입" },
                    { value: "partial", label: "잔여지 발생" }
                  ]}
                />
                <RadioFilterGroup
                  label="AI판독결과"
                  name="ai-judgment"
                  value={aiJudgmentFilter}
                  onChange={(v) => setAiJudgmentFilter(v as "all" | "high" | "low" | "pending")}
                  options={[
                    { value: "all", label: "전체" },
                    { value: "pending", label: "검토필요" },
                    { value: "high", label: "매수가능성 높음" },
                    { value: "low", label: "매수가능성 낮음" }
                  ]}
                />
              </div>
            </div>

          </div>

          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedParcelIds.size === filteredParcels.length && filteredParcels.length > 0}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                      title="모두 선택"
                    />
                  </TableHead>
                  <TableHead className="w-12 text-center">No.</TableHead>
                  <TableHead
                    className="min-w-[400px] text-center cursor-pointer select-none"
                    onClick={() => handleSort("address")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      소재지
                      {sortColumn === "address" ? (sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />}
                    </div>
                  </TableHead>
                  <TableHead className="text-center">소유자</TableHead>
                  <TableHead
                    className="text-center cursor-pointer select-none"
                    onClick={() => handleSort("includedArea")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      편입면적(㎡)
                      {sortColumn === "includedArea" ? (sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-center cursor-pointer select-none"
                    onClick={() => handleSort("remainingArea")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      잔여면적(㎡)
                      {sortColumn === "remainingArea" ? (sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-center cursor-pointer select-none"
                    onClick={() => handleSort("remainingRatio")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      잔여비율(%)
                      {sortColumn === "remainingRatio" ? (sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />}
                    </div>
                  </TableHead>
                  <TableHead className="text-center">편입유형</TableHead>
                  <TableHead className="text-center">AI판독결과</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedParcels.map((parcel, index) => (
                  <TableRow
                    key={parcel.id}
                    className={`cursor-pointer hover:bg-muted/50 ${selectedParcelIds.has(parcel.id) ? 'bg-blue-50' : parcel.aiResult?.analysisSource === 'auto-change' ? 'bg-amber-50/20' : ''}`}
                    onClick={() => handleParcelClick(parcel)}
                  >
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={selectedParcelIds.has(parcel.id)}
                        onChange={() => handleToggleParcelSelection(parcel.id)}
                        className="w-4 h-4 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {filteredParcels.length - ((currentPage - 1) * itemsPerPage + index)}
                    </TableCell>
                    <TableCell
                      className="min-w-[400px] text-center font-medium underline hover:text-primary"
                      title={parcel.landInfo.address}
                    >
                      {parcel.landInfo.address}
                    </TableCell>
                    <TableCell className="text-center text-[16px]">
                      {parcel.landInfo.ownerName}
                    </TableCell>
                    <TableCell className="text-center">
                      {parcel.landInfo.includedArea != null ? parcel.landInfo.includedArea.toLocaleString() : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {parcel.landInfo.remainingArea.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {parcel.landInfo.remainingRatio != null ? `${parcel.landInfo.remainingRatio}%` : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {parcel.residualStatus === "잔여지 인정" ? (
                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-0">잔여지 발생</Badge>
                      ) : parcel.residualStatus === "기준 미달" ? (
                        <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-0">전체 편입</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {/* AI판독결과 컬럼 (auto + auto-change + manual 모두 포함) */}
                    <TableCell className="text-center">
                      {parcel.residualStatus !== "잔여지 인정" ? (
                        <span className="text-muted-foreground">-</span>
                      ) : isPurchaseAnalyzing && selectedParcelIds.has(parcel.id) ? (
                        <div className="flex items-center justify-center gap-1">
                          <Loader2 className="h-4 w-4 animate-spin text-[#2E8B57]" />
                          <span className="text-xs text-[#2E8B57]">분석중</span>
                        </div>
                      ) : (() => {
                        const aiEntry = [...(parcel.analysisHistory ?? [])].reverse().find(
                          h => h.aiResult?.analysisSource === "auto" || h.aiResult?.analysisSource === "auto-change" || h.aiResult?.analysisSource === "manual"
                        );
                        const judgment = aiEntry?.aiResult?.provisionalJudgment
                          ?? (parcel.aiResult?.analysisSource !== "manual-select" ? parcel.aiResult?.provisionalJudgment : undefined);
                        if (!judgment) return <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-0">검토필요</Badge>;
                        return isHighPossibility(judgment)
                          ? <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0">매수가능성 높음</Badge>
                          : <Badge className="bg-rose-50 text-rose-600 hover:bg-rose-100 border-0">매수가능성 낮음</Badge>;
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredParcels.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      조건에 맞는 필지가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* 페이지네이션 */}
          <div className="flex items-center justify-center gap-2 pt-4 mt-4">
            <PaginationNavButton
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || totalPages === 0}
            >
              처음
            </PaginationNavButton>
            <PaginationNavButton
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || totalPages === 0}
            >
              이전
            </PaginationNavButton>
            
            {/* 페이지 번호 */}
            <div className="flex items-center gap-1">
              {totalPages === 0 ? (
                <PaginationButton isActive={true}>1</PaginationButton>
              ) : (
                Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                })
              )}
            </div>
            
            <PaginationNavButton
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              다음
            </PaginationNavButton>
            <PaginationNavButton
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              마지막
            </PaginationNavButton>
            
            <span className="text-[16px] text-muted-foreground ml-2">
              {filteredParcels.length === 0 
                ? "(0건)" 
                : `(${filteredParcels.length}건 중 ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredParcels.length)}건)`
              }
            </span>
          </div>
        </CardContent>
      </Card>


      {/* 히스토리 다이얼로그 */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>분석 히스토리</DialogTitle>
            <DialogDescription>
              {selectedHistoryParcel?.landInfo.address}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {selectedHistoryParcel?.analysisHistory.map((history, index) => (
              <Card key={history.id} className={index === 0 ? "border-primary" : ""}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={history.stage === "1차분석" ? "default" : "secondary"}>
                          {history.stage}
                        </Badge>
                        {index === 0 && <Badge variant="outline">최신</Badge>}
                      </div>
                      <p className="text-[16px] text-muted-foreground">
                        {formatDateTime(history.analyzedAt)} | {history.analyzedBy}
                      </p>
                    </div>
                    <div className="text-right">
                      {history.previousResult && (
                        <div className="flex items-center gap-2 text-[16px]">
                          <span className={history.previousResult.includes("높음") || history.previousResult === "수용가능" ? "text-emerald-600" : "text-rose-600"}>
                            {history.previousResult}
                          </span>
                          <span>→</span>
                          <span className={history.newResult.includes("높음") || history.newResult === "수용가능" ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
                            {history.newResult}
                          </span>
                        </div>
                      )}
                      {!history.previousResult && (
                        <span className={history.newResult.includes("높음") || history.newResult === "수용가능" ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
                          {history.newResult}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {history.changeReason && (
                    <div className="mt-3 p-2 bg-muted rounded text-[16px]">
                      <strong>변경 사유:</strong> {history.changeReason}
                    </div>
                  )}
                  {history.memo && (
                    <div className="mt-2 text-[16px] text-muted-foreground">
                      <strong>메모:</strong> {history.memo}
                    </div>
                  )}
                  {history.changedOptions && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {history.changedOptions.currentUsage && (
                        <Badge variant="outline">활용지목: {history.changedOptions.currentUsage}</Badge>
                      )}
                      {history.changedOptions.landShape && (
                        <Badge variant="outline">토지형상: {history.changedOptions.landShape}</Badge>
                      )}
                      {history.changedOptions.farmMachineDifficulty && (
                        <Badge variant="outline">농기계 진입불가</Badge>
                      )}
                      {history.changedOptions.accessRoadLost && (
                        <Badge variant="outline">접면도로 상실</Badge>
                      )}
                      {history.changedOptions.waterChannelLost && (
                        <Badge variant="outline">관개수로 상실</Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {selectedHistoryParcel?.analysisHistory.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                분석 히스토리가 없습니다.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
