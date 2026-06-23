"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { JUDGMENT_COLORS } from "@/components/ui/judgment-badge";
import { LandMap } from "@/components/land-map";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shapes,
  FileText,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Sparkles,
  Settings2,
  AlignJustify,
  Scale,
  Bookmark,
  MapPin,
  LayoutGrid,
  Bell,
  Lightbulb,
} from "lucide-react";
import type { 
  ProcessedParcel, 
  AnalysisHistory,
  LandCategory, 
  LandShape,
  AIJudgmentResult,
  AdminCheckItems,
  AIAnalysisResult,
  LandType
} from "@/lib/types";
import {
  landCategories,
  landShapes,
  adminCheckItemOptions,
  dummyProcessedParcels,
} from "@/lib/dummy-data";
import { formatDateTime } from "@/lib/format";
import { AIAnalysisFlowDialog } from "@/components/admin/ai-analysis-flow-dialog";

interface ParcelDetailReviewProps {
  parcel: ProcessedParcel;
  onUpdate: (updatedParcel: ProcessedParcel) => void;
  onBack: () => void;
  onNavigateToApplication?: (applicationId: string) => void;
}

export function ParcelDetailReview({ parcel, onUpdate, onBack, onNavigateToApplication }: ParcelDetailReviewProps) {
  // 신청상세 화면으로 이동
  const handleNavigateToApplication = () => {
    if (parcel.citizenActivity?.applicationId && onNavigateToApplication) {
      onNavigateToApplication(parcel.citizenActivity.applicationId);
    }
  };
  
  // 분석 옵션 상태
  const [currentUsage, setCurrentUsage] = useState<LandCategory>(parcel.currentUsage);
  const [landShape, setLandShape] = useState<LandShape>(parcel.landShape);
  const [checkItems, setCheckItems] = useState<AdminCheckItems>(parcel.adminCheckItems);
  
  const [memo, setMemo] = useState("");

  // 분석이력 클릭 시 좌측 옵션 불러오기
  const handleLoadHistoryOptions = (history: AnalysisHistory) => {
    const opts = history.changedOptions;
    if (!opts) return;
    if (opts.currentUsage) setCurrentUsage(opts.currentUsage as LandCategory);
    if (opts.landShape) setLandShape(opts.landShape as LandShape);
    setCheckItems({
      accessRoadLost: opts.accessRoadLost ?? false,
      waterChannelLost: opts.waterChannelLost ?? false,
      farmMachineDifficulty: opts.farmMachineDifficulty ?? false,
    });
  };

  // 담당자 직접 선택 (manual-select) 상태
  const initialManualJudgment: AIJudgmentResult | null =
    parcel.aiResult?.analysisSource === "manual-select"
      ? parcel.aiResult.provisionalJudgment
      : (parcel.analysisHistory?.slice().reverse().find(h => h.aiResult?.analysisSource === "manual-select")?.aiResult?.provisionalJudgment ?? null);
  const [manualJudgment, setManualJudgment] = useState<AIJudgmentResult | null>(initialManualJudgment);

  // 분석 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // AI 분석 상세 다이얼로그
  const [showAIAnalysisDialog, setShowAIAnalysisDialog] = useState(false);
  // 토지정보 상세보기 모달
  const [showLandInfoModal, setShowLandInfoModal] = useState(false);
  // 검토 확인 컨펌 다이얼로그
  const { toast } = useToast();

  // 2차 분석 (재분석) 실행
  const handleReanalyze = async () => {
    setIsAnalyzing(true);
    
    // 분석 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 옵션에 따른 결과 계산 (시뮬레이션)
    let newResult: AIJudgmentResult = "매수 가능성 낮음";
    
    // 농기계 진입불가, 접면도로 상실, 관개수로 상실 중 하나라도 체크되면 높음
    if (checkItems.farmMachineDifficulty || checkItems.accessRoadLost || checkItems.waterChannelLost) {
      newResult = "매수 가능성 높음";
    }
    
    // 토지 형상이 불규칙하면 높음
    const irregularShapes: LandShape[] = ["삼각형", "역삼각형", "부정형", "자루형"];
    if (irregularShapes.includes(landShape)) {
      newResult = "매수 가능성 높음";
    }
    
    // 새 AI 분석 결과 생성
    const newAiResult: AIAnalysisResult = {
      landTypePath: parcel.landInfo.landType as LandType,
      criteriaChecks: [
        { criteriaName: "잔여지 면적 기준", criteriaDescription: "잔여지 면적이 기준 이하", isMet: true, autoDetected: true },
        { criteriaName: "형상지수 변화", criteriaDescription: "형상지수 악화 확인", isMet: true, autoDetected: true },
      ],
      provisionalJudgment: newResult,
      originalShapeIndex: parcel.landInfo.originalShapeIndex || 3.5,
      remainingShapeIndex: Math.random() * 0.5 + 0.2,
      shapeIndexChange: -0.3,
      isBlindLand: false,
      accessRoadLost: checkItems.accessRoadLost,
      waterChannelLost: checkItems.waterChannelLost,
      farmMachineDifficulty: checkItems.farmMachineDifficulty,
      judgmentRationale: {
        summary: "재분석 결과",
        legalBasis: "「공익사업을 위한 토지 등의 취득 및 보상에 관한 법률」 제74조",
        appliedCriteria: [],
        detailedExplanation: "",
      },
      analysisSource: "manual",
    };

    // 히스토리에 바로 추가
    const newHistory: AnalysisHistory = {
      id: `history-${Date.now()}`,
      parcelId: parcel.id,
      stage: `${(parcel.analysisHistory?.length || 0) + 1}차분석`,
      analyzedAt: new Date().toISOString(),
      analyzedBy: "현재 담당자",
      previousResult: parcel.aiResult?.provisionalJudgment as AIJudgmentResult || "매수 가능성 낮음",
      newResult: newResult,
      previousShapeIndex: parcel.aiResult?.remainingShapeIndex || 0,
      newShapeIndex: newAiResult.remainingShapeIndex,
      changedOptions: {
        currentUsage,
        landShape,
        ...checkItems,
      },
      memo: memo || undefined,
      aiResult: newAiResult,
    };
    
    const updatedParcel: ProcessedParcel = {
      ...parcel,
      currentUsage,
      landShape,
      adminCheckItems: checkItems,
      aiResult: newAiResult,
      publishStatus: (parcel.analysisHistory?.length || 0) === 0 ? "1차분석완료" : "2차분석중",
      analysisHistory: [...(parcel.analysisHistory || []), newHistory],
      lastAnalyzedAt: new Date().toISOString(),
    };

    onUpdate(updatedParcel);
    setIsAnalyzing(false);
    setMemo("");
  };

  // 담당자 직접 판단 저장
  const handleManualJudgmentSave = (judgment: AIJudgmentResult) => {
    const newAiResult: AIAnalysisResult = {
      landTypePath: parcel.landInfo.landType as LandType,
      criteriaChecks: [],
      provisionalJudgment: judgment,
      originalShapeIndex: parcel.aiResult?.originalShapeIndex ?? 0,
      remainingShapeIndex: parcel.aiResult?.remainingShapeIndex ?? 0,
      shapeIndexChange: 0,
      isBlindLand: false,
      accessRoadLost: false,
      waterChannelLost: false,
      farmMachineDifficulty: false,
      judgmentRationale: {
        summary: "담당자 직접 판단",
        legalBasis: "",
        appliedCriteria: [],
        detailedExplanation: "",
      },
      analysisSource: "manual-select",
    };
    setManualJudgment(judgment);
    // analysisHistory는 건드리지 않고 aiResult만 업데이트
    onUpdate({
      ...parcel,
      aiResult: newAiResult,
    });
    toast({ title: "담당자 검토 결과가 저장되었습니다.", duration: 3000 });
  };

  return (
    <div className="space-y-6">
      {/* 필지상세 타이틀 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">필지상세</h1>
        </div>

      </div>



      {/* 필지 기본 정보 - 통합 헤더 레이아웃 */}
        <Card className="border-0 shadow-none px-6">
          <CardContent className="p-0">
          {/* 상단: 소재지 + 민원 신청 상태 */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <span className="text-lg font-semibold text-foreground">{parcel.landInfo.address}</span>
            {/* 편입 유형이 확정된 경우(부분 편입)에만 신청상세 보기 버튼 노출 */}
            {parcel.residualStatus === "잔여지 인정" && parcel.citizenActivity?.applicationSubmitted && (
              <Badge 
                className="bg-transparent text-emerald-700 hover:bg-transparent cursor-pointer"
                onClick={handleNavigateToApplication}
              >
                신청상세 보기
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Badge>
            )}
          </div>
          
          {/* 하단: 정보 그리드 2행 3열 */}
          <div className="grid grid-cols-3 gap-x-8 gap-y-3 pt-4">
            {/* 1행 */}
            <div className="flex items-center gap-2">
              <span className="text-[16px] text-muted-foreground">사업명:</span>
              <span className="text-[16px] font-medium">{parcel.projectName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[16px] text-muted-foreground">잔여 면적 (비율):</span>
              <span className="text-[16px] font-medium">{parcel.landInfo.remainingArea.toLocaleString()} ㎡ ({parcel.landInfo.remainingRatio}%)</span>
            </div>
            
            {/* 2행 */}
            <div className="flex items-center gap-2">
              <span className="text-[16px] text-muted-foreground">소유자:</span>
              <span className="text-[16px] font-medium">{parcel.landInfo.ownerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[16px] text-muted-foreground">공부상 지목:</span>
              <span className="text-[16px] font-medium">
                {landCategories.find(c => c.value === parcel.landInfo.landCategory)?.label ?? parcel.landInfo.landCategory ?? "-"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[16px] text-muted-foreground">토지정보:</span>
              <button
                type="button"
                onClick={() => setShowLandInfoModal(true)}
                className="inline-flex items-center gap-1 rounded-md border border-[#00875a]/30 bg-[#00875a]/5 px-2.5 py-1 text-[16px] font-medium text-[#00875a] underline-offset-2 transition-all hover:border-[#00875a]/60 hover:bg-[#00875a]/10 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00875a]/40 focus-visible:ring-offset-1"
              >
                <FileText className="h-3.5 w-3.5" />
                상세보기
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI 분석 영역 - 2컬럼 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 왼쪽: AI 분석 */}
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle>AI 분석</CardTitle>
            <CardDescription>
            토지 속성 및 담당자 확인 조건을 설정하여 AI 분석을 실행합니다.<br />판독 결과는 우측 섹션에 차수별 이력으로 누적 보존되며, 현장 상황에 맞춰 언제든지 조건을 변경하여<br />횟수 제한 없이 여러 번 반복해서 재분석을 실행할 수 있습니다. 조건이 바뀔 때마다 그에 따른 최신 AI 결과가 실시간으로 화면에 반영됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 지적도 */}
            <div className="space-y-2">
              <Label className="font-medium">지적도</Label>
              <div className="h-[460px] rounded-lg overflow-hidden border bg-muted">
                <LandMap
                  landInfo={parcel.landInfo}
                  showOverlay={true}
                  interactive={false}
                  sameOwnerParcels={dummyProcessedParcels
                    .filter(p => p.id !== parcel.id && p.landInfo.ownerName === parcel.landInfo.ownerName)
                    .map(p => p.landInfo)}
                />
              </div>
            </div>

            {/* 현재 활용지목 및 토지 형상 */}
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-[16px]">현재 활용지목</Label>
                <Select value={currentUsage} onValueChange={(v) => setCurrentUsage(v as LandCategory)}>
                  <SelectTrigger className="h-[40px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {landCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[16px]">토지 형상</Label>
                <Select value={landShape} onValueChange={(v) => setLandShape(v as LandShape)}>
                  <SelectTrigger className="h-[40px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-xs text-muted-foreground">정형</div>
                    {landShapes.regular.map((shape) => (
                      <SelectItem key={shape.value} value={shape.value}>{shape.label}</SelectItem>
                    ))}
                    <div className="px-2 py-1 text-xs text-muted-foreground border-t mt-1 pt-1">부정형</div>
                    {landShapes.irregular.map((shape) => (
                      <SelectItem key={shape.value} value={shape.value}>{shape.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 담당자 확인항목 */}
            <div className="space-y-2">
              <Label className="text-[16px]">담당자 확인항목</Label>
              <div className="grid grid-cols-3 gap-5">
                {adminCheckItemOptions.map((option) => (
                  <div 
                    key={option.value}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      checkItems[option.value as keyof AdminCheckItems] 
                        ? "bg-primary/10 border-primary" 
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setCheckItems(prev => ({
                      ...prev,
                      [option.value]: !prev[option.value as keyof AdminCheckItems]
                    }))}
                  >
                    <Checkbox 
                      checked={checkItems[option.value as keyof AdminCheckItems]}
                      onCheckedChange={(checked) => setCheckItems(prev => ({
                        ...prev,
                        [option.value]: !!checked
                      }))}
                    />
                    <span className="text-xs">{option.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 메모 */}
            <div className="space-y-2">
              <Label className="text-[16px]">메모</Label>
              <Textarea
                placeholder="추가 메모 (선택)"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
              />
            </div>

            {/* AI 분석 실행 버튼 */}
            <Button 
              onClick={handleReanalyze}
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI 분석 실행
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 오른쪽: 담당자 검토 + AI 분析결과 */}
        <div className="space-y-5">

        {/* 담당자 검토 카드 */}
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle>담당자 매수 가능성 판독</CardTitle>
            <CardDescription>현장 확인 후 매수 가능성을 직접 선택하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <button
                onClick={() => handleManualJudgmentSave("매수 가능성 높음")}
                className={cn(
                  "flex-1 rounded-lg border-2 py-4 text-[16px] font-semibold transition-all",
                  manualJudgment === "매수 가능성 높음"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-muted-foreground/20 text-muted-foreground hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-600"
                )}
              >
                매수가능성 높음
              </button>
              <button
                onClick={() => handleManualJudgmentSave("매수 가능성 낮음")}
                className={cn(
                  "flex-1 rounded-lg border-2 py-4 text-[16px] font-semibold transition-all",
                  manualJudgment === "매수 가능성 낮음"
                    ? "border-rose-500 bg-rose-50 text-rose-700"
                    : "border-muted-foreground/20 text-muted-foreground hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-600"
                )}
              >
                매수가능성 낮음
              </button>
            </div>
          </CardContent>
        </Card>

        {/* AI 분析결과 검토 카드 */}
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle>AI 분석결과 검토</CardTitle>
            <CardDescription>
              AI 분석 결과와 매수 가능성 판정을 확인합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(parcel.analysisHistory?.length || 0) > 0 ? (
              <Accordion
                type="multiple"
                defaultValue={parcel.analysisHistory.map(h => `history-${h.id}`)}
                className="space-y-2"
              >
                {parcel.analysisHistory.slice().reverse().map((history) => {
                  const aiResult = history.aiResult;
                  const originalHistory = parcel.analysisHistory;
                  const currentIndex = originalHistory.findIndex(h => h.id === history.id);
                  const prevHistory = currentIndex > 0 ? originalHistory[currentIndex - 1] : null;
                  const isChangeDriven = history.aiResult?.analysisSource === "auto-change";
                  const shapeIndexChanged = isChangeDriven && prevHistory != null &&
                    prevHistory.aiResult?.remainingShapeIndex !== history.aiResult?.remainingShapeIndex;
                  const accessRoadChanged = isChangeDriven && prevHistory != null &&
                    prevHistory.aiResult?.accessRoadLost !== history.aiResult?.accessRoadLost;
                  return (
                    <AccordionItem 
                      key={history.id} 
                      value={`history-${history.id}`}
                      className="border border-gray-200 rounded-lg px-4"
                      style={{ borderBottomWidth: '1px' }}
                    >
                      <AccordionTrigger className="hover:no-underline py-3" onClick={() => handleLoadHistoryOptions(history)}>
                        <div className="flex flex-col gap-1.5 w-full mr-2">
                          {/* 상단: 마스터 판정 정보 */}
                          <div className="flex items-center gap-2">
                            {/* 회차 — 위계 최하: 아웃라인만 (4.5:1 이상 확보) */}
                            <span className="inline-flex items-center rounded border border-slate-300 bg-white px-2 py-1 text-[15px] font-normal text-slate-600">
                              {history.stage}
                            </span>
                            {/* 판독 유형 — 위계 2 */}
                            {history.aiResult?.analysisSource === "manual" ? (
                              <span className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[15px] font-medium text-blue-700">
                                수동판독
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded bg-slate-100 px-2 py-1 text-[15px] font-medium text-slate-700">
                                자동판독
                              </span>
                            )}
                            {/* AI 판정 — 위계 3 */}
                            <span
                              className={cn(
                                "inline-flex items-center rounded px-2 py-1 text-[15px] font-semibold text-white",
                                history.newResult === "매수 가능성 높음" || history.newResult === "수용가능"
                                  ? "bg-emerald-700"
                                  : "bg-rose-600"
                              )}
                            >
                              {history.newResult === "수용가능" ? "매수 가능성 높음" :
                               history.newResult === "수용불가" ? "매수 가능성 낮음" :
                               history.newResult}
                            </span>
                            {/* 변동 감지 — 위계 최상: amber-700로 white 대비 5:1 확보 */}
                            {history.aiResult?.analysisSource === "auto-change" && (
                              <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-[15px] font-bold bg-amber-700 text-white">
                                ⚠ 변동 감지
                              </span>
                            )}
                            {/* 분석 일시 */}
                            <span className="text-[15px] text-muted-foreground ml-auto">
                              {formatDateTime(history.analyzedAt)}
                            </span>
                          </div>
                          {/* 하단: 선택한 옵션 */}
                          {(() => {
                            const effectiveUsage = history.changedOptions?.currentUsage ?? parcel.currentUsage;
                            const effectiveShape = history.changedOptions?.landShape ?? parcel.landShape;
                            const usageLabel = landCategories.find(c => c.value === effectiveUsage)?.label ?? effectiveUsage;
                            const shapeLabel = [...landShapes.regular, ...landShapes.irregular].find(s => s.value === effectiveShape)?.label ?? effectiveShape;
                            const checkItems: string[] = [];
                            if (history.aiResult?.farmMachineDifficulty) checkItems.push("농기계 진입불가");
                            if (history.aiResult?.accessRoadLost) checkItems.push("접면도로 상실");
                            if (history.aiResult?.waterChannelLost) checkItems.push("관개수로 상실");
                            return (
                              <div className="flex items-center gap-2 flex-wrap text-[15px]">
                                <span className="shrink-0 font-medium text-slate-400">선택한 옵션:</span>
                                <div className="flex items-center gap-2 flex-wrap text-slate-600">
                                  {usageLabel && (
                                    <span>지목 <span className="font-semibold text-slate-800">{usageLabel}</span></span>
                                  )}
                                  {shapeLabel && (
                                    <><span className="text-slate-300">|</span><span>형상 <span className="font-semibold text-slate-800">{shapeLabel}</span></span></>
                                  )}
                                  {checkItems.map((opt, i) => (
                                    <><span key={`sep-${i}`} className="text-slate-300">|</span><span key={i} className="font-semibold text-slate-800">{opt}</span></>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        {aiResult ? (
                          <div className="space-y-4 pt-2">
                            {/* 변동 감지 배너 */}
                            {isChangeDriven && (
                              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                <p className="text-[16px] text-amber-700 leading-relaxed">
                                  본 분석은 <strong>토지 정보 변동 감지</strong>에 따라 자동으로 재판독되었습니다. 변동된 데이터 항목은 강조 표시됩니다.
                                </p>
                              </div>
                            )}
                            {/* 1. 분석 적용 옵션 */}
                            {history.changedOptions && (
                              <div className="space-y-2">
                                <h5 className="text-[16px] font-semibold flex items-center gap-2">
                                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                                  분석 적용 옵션
                                </h5>
                                <div className="rounded-lg p-3 space-y-3" style={{ backgroundColor: "rgb(251, 251, 251)" }}>
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-0.5">
                                      <p className="text-[16px] text-muted-foreground">현재 활용지목</p>
                                      <p className="text-[16px] font-medium">
                                        {landCategories.find(c => c.value === history.changedOptions?.currentUsage)?.label ?? history.changedOptions?.currentUsage ?? "-"}
                                      </p>
                                    </div>
                                    <div className="space-y-0.5">
                                      <p className="text-[16px] text-muted-foreground">토지 형상</p>
                                      <p className="text-[16px] font-medium">
                                        {[...landShapes.regular, ...landShapes.irregular].find(s => s.value === history.changedOptions?.landShape)?.label ?? history.changedOptions?.landShape ?? "-"}
                                      </p>
                                    </div>
                                    <div className="space-y-0.5">
                                      <p className="text-[16px] text-muted-foreground">담당자 확인항목</p>
                                      <p className="text-[16px] font-medium">
                                        {[
                                          history.changedOptions.farmMachineDifficulty && "농기계 진입 불가",
                                          history.changedOptions.accessRoadLost && "접면도로 상실",
                                          history.changedOptions.waterChannelLost && "관개수로 상실",
                                        ].filter(Boolean).join(", ") || "-"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="space-y-0.5 border-t border-slate-200 pt-3">
                                    <p className="text-[16px] text-muted-foreground">메모</p>
                                    <p className="text-[16px] font-medium whitespace-pre-wrap break-words">{history.memo || "-"}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 2. 편입 정보 */}
                            <div className="space-y-2">
                              <h5 className="text-[16px] font-semibold flex items-center gap-2">
                                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                                편입 정보
                              </h5>
                              <div className="rounded-lg p-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3" style={{ backgroundColor: "rgb(251, 251, 251)" }}>
                                <div className="space-y-0.5">
                                  <p className="text-[16px] text-muted-foreground">편입 전 면적</p>
                                  <p className="text-[16px] font-semibold">{parcel.landInfo.originalArea.toLocaleString()}m²</p>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[16px] text-muted-foreground">편입 면적</p>
                                  <p className="text-[16px] font-semibold">{(parcel.landInfo.includedArea ?? (parcel.landInfo.originalArea - parcel.landInfo.remainingArea)).toLocaleString()}m²</p>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[16px] text-muted-foreground">잔여 면적</p>
                                  <p className="text-[16px] font-semibold">{parcel.landInfo.remainingArea.toLocaleString()}m²</p>
                                </div>
                                {parcel.landInfo.remainingRatio != null && (
                                  <div className="space-y-0.5">
                                    <p className="text-[16px] text-muted-foreground">잔여 비율</p>
                                    <p className="text-[16px] font-semibold">{parcel.landInfo.remainingRatio}%</p>
                                  </div>
                                )}
                                {parcel.landInfo.originalShapeIndex != null && parcel.landInfo.remainingShapeIndex != null && (
                                  <div className={cn("space-y-0.5 rounded-md transition-colors", shapeIndexChanged && "bg-amber-50 px-2 py-1 -mx-2")}>
                                    <p className="text-[16px] text-muted-foreground">형상지수 변화</p>
                                    <p className={cn("text-[16px] font-semibold", shapeIndexChanged && "text-amber-700")}>
                                      {(aiResult.originalShapeIndex ?? parcel.landInfo.originalShapeIndex).toFixed(3)} → <strong className={cn(shapeIndexChanged ? "font-bold" : "")}>{(aiResult.remainingShapeIndex ?? parcel.landInfo.remainingShapeIndex).toFixed(3)}</strong>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 3. 형상 분석 */}
                            <div className="space-y-2">
                              <h5 className="text-[16px] font-semibold flex items-center gap-2">
                                <Shapes className="h-4 w-4 text-muted-foreground" />
                                형상 분석
                              </h5>
                              <div className="overflow-hidden rounded-lg border">
                                <table className="w-full text-[16px]">
                                  <thead>
                                    <tr className="bg-muted/50">
                                      <th className="px-3 py-2 text-left font-medium text-muted-foreground text-[16px]">항목</th>
                                      <th className="px-3 py-2 text-center font-medium text-muted-foreground text-[16px]">편입 전</th>
                                      <th className="px-3 py-2 text-center font-medium text-muted-foreground text-[16px]">편입 후</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border">
                                    <tr>
                                      <td className="px-3 py-2 text-[16px] text-muted-foreground">형상</td>
                                      <td className="px-3 py-2 text-center text-[16px]">{parcel.landInfo.originalShape || "-"}</td>
                                      <td className="px-3 py-2 text-center text-[16px] font-semibold">{parcel.landInfo.remainingShape || "-"}</td>
                                    </tr>
                                    <tr className={shapeIndexChanged ? "bg-amber-50" : ""}>
                                      <td className="px-3 py-2 text-[16px] text-muted-foreground">형상지수 (SI)</td>
                                      <td className="px-3 py-2 text-center text-[16px]">{(aiResult.originalShapeIndex ?? parcel.landInfo.originalShapeIndex)?.toFixed(3) ?? "-"}</td>
                                      <td className={cn("px-3 py-2 text-center text-[16px] font-semibold", shapeIndexChanged && "text-amber-700 font-bold")}>{(aiResult.remainingShapeIndex ?? parcel.landInfo.remainingShapeIndex)?.toFixed(3) ?? "-"}</td>
                                    </tr>
                                    <tr>
                                      <td className="px-3 py-2 text-[16px] text-muted-foreground">면적</td>
                                      <td className="px-3 py-2 text-center text-[16px]">{parcel.landInfo.originalArea.toLocaleString()}</td>
                                      <td className="px-3 py-2 text-center text-[16px] font-semibold">{parcel.landInfo.remainingArea.toLocaleString()}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* 4. 판단 요약 */}
                            {aiResult.judgmentRationale?.summary && (
                              <div className="space-y-2">
                                <h5 className="text-[16px] font-semibold flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  판단 요약
                                </h5>
                                <p className="text-[16px] text-muted-foreground rounded-lg p-3 leading-relaxed" style={{ backgroundColor: "rgb(251, 251, 251)" }}>
                                  {aiResult.judgmentRationale.summary}
                                </p>
                              </div>
                            )}

                            {/* 5. 법적 근거 */}
                            {aiResult.judgmentRationale?.legalBasis && (
                              <div className="space-y-2">
                                <h5 className="text-[16px] font-semibold flex items-center gap-2">
                                  <Scale className="h-4 w-4 text-muted-foreground" />
                                  법적 근거
                                </h5>
                                <p className="text-[16px] text-muted-foreground rounded-lg p-3 leading-relaxed" style={{ backgroundColor: "rgb(251, 251, 251)" }}>
                                  {aiResult.judgmentRationale.legalBasis}
                                </p>
                              </div>
                            )}

                            {/* 6. 판정결과 적용조문 */}
                            {aiResult.judgmentRationale?.appliedCriteria && aiResult.judgmentRationale.appliedCriteria.length > 0 && (
                              <div className="space-y-2">
                                <h5 className="text-[16px] font-semibold flex items-center gap-2">
                                  <Bookmark className="h-4 w-4 text-muted-foreground" />
                                  판정결과 적용조문
                                </h5>
                                <ul className="rounded-lg p-3 space-y-1" style={{ backgroundColor: "rgb(251, 251, 251)" }}>
                                  {aiResult.judgmentRationale.appliedCriteria.map((item, idx) => (
                                    <li key={idx} className="text-[16px] text-muted-foreground flex items-start gap-1.5">
                                      <span className="mt-1 shrink-0">•</span><span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* 7. 일단토지 */}
                            {aiResult.unifiedParcelAnalysis && (
                              <div className="space-y-2">
                                <h5 className="text-[16px] font-semibold flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  일단토지
                                </h5>
                                <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: "rgb(251, 251, 251)" }}>
                                  <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                                    <div className="space-y-0.5">
                                      <p className="text-[16px] text-muted-foreground">합산 면적</p>
                                      <p className="text-[16px] font-semibold">{aiResult.unifiedParcelAnalysis.combinedArea?.toLocaleString() ?? "-"}m²</p>
                                    </div>
                                    <div className="space-y-0.5">
                                      <p className="text-[16px] text-muted-foreground">합산 잔여 면적</p>
                                      <p className="text-[16px] font-semibold">{parcel.landInfo.remainingArea.toLocaleString()}m²</p>
                                    </div>
                                    <div className="space-y-0.5">
                                      <p className="text-[16px] text-muted-foreground">합산 편입 면적</p>
                                      <p className="text-[16px] font-semibold">{(parcel.landInfo.originalArea - parcel.landInfo.remainingArea).toLocaleString()}m²</p>
                                    </div>
                                  </div>
                                  {aiResult.unifiedParcelAnalysis.explanation && (
                                    <p className="text-[16px] text-muted-foreground pt-2 border-t border-slate-200">{aiResult.unifiedParcelAnalysis.explanation}</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* 8. 프로세스 */}
                            <div className="space-y-2">
                              <h5 className="text-[16px] font-semibold flex items-center gap-1.5">
                                <AlignJustify className="h-4 w-4 text-muted-foreground" />
                                프로세스
                              </h5>
                              <div className="space-y-1.5">

                                {/* 1단계: 잔여지 발생여부 */}
                                {(() => {
                                  const isMet1 = parcel.landInfo.remainingArea > 0;
                                  const includedArea1 = parcel.landInfo.includedArea ?? (parcel.landInfo.originalArea - parcel.landInfo.remainingArea);
                                  return (
                                    <div className="rounded-lg border overflow-hidden">
                                      <div className="flex items-center justify-between px-3 py-2 bg-muted/40">
                                        <div className="flex items-center gap-2">
                                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-foreground/10 text-foreground text-[14px] font-bold leading-none">1</span>
                                          <span className="text-[16px] font-semibold">잔여지 발생여부</span>
                                        </div>
                                        <span className={cn("text-[16px] font-semibold px-2.5 py-1 rounded-full", isMet1 ? `${JUDGMENT_COLORS.충족.bgLight} ${JUDGMENT_COLORS.충족.textDark}` : `${JUDGMENT_COLORS.미충족.bgLight} ${JUDGMENT_COLORS.미충족.textDark}`)}>
                                          {isMet1 ? "충족" : "미충족"}
                                        </span>
                                      </div>
                                      <div className="px-3 py-2 space-y-1.5 divide-y divide-border/50">
                                        <div className="flex items-center gap-3 pb-1.5">
                                          <span className="text-[16px] text-[#666666] shrink-0 w-8">기준</span>
                                          <p className="text-[16px] text-[#666666]">토지편입으로 인해 잔여토지가 발생 (면적 0㎡ 이상)</p>
                                        </div>
                                        <div className="flex items-center gap-3 pt-1.5">
                                          <span className="text-[16px] text-[#1a1a1a] shrink-0 w-8">결과</span>
                                          <div className="flex items-center gap-2 flex-wrap text-[16px] text-[#1a1a1a]">
                                            <span className={"font-semibold text-[#1a1a1a]"}>
                                              {isMet1 ? "잔여지 발생" : "잔여지 미발생"}
                                            </span>
                                            <span className="text-[#1a1a1a]/20">|</span>
                                            <span>원면적 <strong className="font-bold">{parcel.landInfo.originalArea.toLocaleString()}m²</strong></span>
                                            <span className="text-[#1a1a1a]/20">·</span>
                                            <span>편입 <strong className="font-bold">{includedArea1.toLocaleString()}m²</strong></span>
                                            <span className="text-[#1a1a1a]/20">·</span>
                                            <span>잔여 <strong className="font-bold">{parcel.landInfo.remainingArea.toLocaleString()}m²</strong></span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* 2단계: 단독필지 여부 */}
                                {(() => {
                                  const isUnified = aiResult.unifiedParcelAnalysis?.isUnifiedParcel ?? false;
                                  const isMet2 = !isUnified;
                                  const explanation2 = aiResult.unifiedParcelAnalysis?.explanation
                                    ?? `동일소유자·인접·동일용도(${landCategories.find(c => c.value === parcel.landInfo.landCategory)?.label ?? parcel.landInfo.landCategory}) 필지 없음`;
                                  return (
                                    <div className="rounded-lg border overflow-hidden">
                                      <div className="flex items-center justify-between px-3 py-2 bg-muted/40">
                                        <div className="flex items-center gap-2">
                                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-foreground/10 text-foreground text-[14px] font-bold leading-none">2</span>
                                          <span className="text-[16px] font-semibold">단독필지 여부 (일단의 토지 여부)</span>
                                        </div>
                                        <span className={cn("text-[16px] font-semibold px-2.5 py-1 rounded-full", isMet2 ? `${JUDGMENT_COLORS.충족.bgLight} ${JUDGMENT_COLORS.충족.textDark}` : `${JUDGMENT_COLORS.미충족.bgLight} ${JUDGMENT_COLORS.미충족.textDark}`)}>
                                          {isMet2 ? "충족" : "미충족"}
                                        </span>
                                      </div>
                                      <div className="px-3 py-2 space-y-1.5 divide-y divide-border/50">
                                        <div className="flex items-center gap-3 pb-1.5">
                                          <span className="text-[16px] text-[#666666] shrink-0 w-8">기준</span>
                                          <p className="text-[16px] text-[#666666]">편입토지와 동일소유자이며, 인접한 동일용도 필지 없음</p>
                                        </div>
                                        <div className="flex items-start gap-3 pt-1.5">
                                          <span className="text-[16px] text-[#1a1a1a] shrink-0 w-8">결과</span>
                                          <div className="text-[16px] text-[#1a1a1a] space-y-1">
                                            <span className={"font-semibold text-[#1a1a1a]"}>
                                              {isUnified ? "일단의 토지" : "단독필지"}
                                            </span>
                                            <p>· 사유 : {explanation2}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* 3단계: 소규모 토지 여부 */}
                                {(() => {
                                  const threshold3 = aiResult.landTypePath === "택지" ? 90 : 330;
                                  const originalArea3 = parcel.landInfo.originalArea;
                                  const isMet3 = originalArea3 <= threshold3;
                                  return (
                                    <div className="rounded-lg border overflow-hidden">
                                      <div className="flex items-center justify-between px-3 py-2 bg-muted/40">
                                        <div className="flex items-center gap-2">
                                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-foreground/10 text-foreground text-[14px] font-bold leading-none">3</span>
                                          <span className="text-[16px] font-semibold">소규모 토지 여부</span>
                                        </div>
                                        <span className={cn("text-[16px] font-semibold px-2.5 py-1 rounded-full", isMet3 ? `${JUDGMENT_COLORS.충족.bgLight} ${JUDGMENT_COLORS.충족.textDark}` : `${JUDGMENT_COLORS.미충족.bgLight} ${JUDGMENT_COLORS.미충족.textDark}`)}>
                                          {isMet3 ? "충족" : "미충족"}
                                        </span>
                                      </div>
                                      <div className="px-3 py-2 space-y-1.5 divide-y divide-border/50">
                                        <div className="flex items-center gap-3 pb-1.5">
                                          <span className="text-[16px] text-[#666666] shrink-0 w-8">기준</span>
                                          <p className="text-[16px] text-[#666666]">원면적이 기준면적(<strong className="font-bold">{threshold3.toLocaleString()}m²</strong>) 이하</p>
                                        </div>
                                        <div className="flex items-start gap-3 pt-1.5">
                                          <span className="text-[16px] text-[#1a1a1a] shrink-0 w-8">결과</span>
                                          <div className="text-[16px] text-[#1a1a1a] space-y-1">
                                            <span className={"font-semibold text-[#1a1a1a]"}>
                                              {isMet3 ? "부합" : "부합하지 않음"}
                                            </span>
                                            <p>· 사유 : 잔여지 면적이 <strong className="font-bold">{originalArea3.toLocaleString()}m²</strong></p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* 5단계: 면적미달 여부 */}
                                {(() => {
                                  const threshold5 = aiResult.landTypePath === "택지" ? 90 : 330;
                                  const areaCheck = aiResult.criteriaChecks?.find(c => c.criteriaName.includes("면적"));
                                  const isMet5 = areaCheck?.isMet ?? false;
                                  return (
                                    <div className="rounded-lg border overflow-hidden">
                                      <div className="flex items-center justify-between px-3 py-2 bg-muted/40">
                                        <div className="flex items-center gap-2">
                                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-foreground/10 text-foreground text-[14px] font-bold leading-none">5</span>
                                          <span className="text-[16px] font-semibold">면적미달 여부</span>
                                        </div>
                                        <span className={cn("text-[16px] font-semibold px-2.5 py-1 rounded-full", isMet5 ? `${JUDGMENT_COLORS.충족.bgLight} ${JUDGMENT_COLORS.충족.textDark}` : `${JUDGMENT_COLORS.미충족.bgLight} ${JUDGMENT_COLORS.미충족.textDark}`)}>
                                          {isMet5 ? "충족" : "미충족"}
                                        </span>
                                      </div>
                                      <div className="px-3 py-2 space-y-1.5 divide-y divide-border/50">
                                        <div className="flex items-center gap-3 pb-1.5">
                                          <span className="text-[16px] text-[#666666] shrink-0 w-8">기준</span>
                                          <p className="text-[16px] text-[#666666]"><strong className="font-bold">{threshold5.toLocaleString()}m²</strong></p>
                                        </div>
                                        <div className="flex items-center gap-3 pt-1.5">
                                          <span className="text-[16px] text-[#1a1a1a] shrink-0 w-8">결과</span>
                                          <p className="text-[16px] text-[#1a1a1a]"><strong className="font-bold">{parcel.landInfo.remainingArea.toLocaleString()}m²</strong></p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* 6단계: 접근도로 상실 여부 */}
                                {(() => {
                                  const isMet6 = aiResult.accessRoadLost ?? false;
                                  const roadDesc = aiResult.criteriaChecks?.find(c => c.criteriaName.includes("도로") || c.criteriaName.includes("접면"))?.criteriaDescription;
                                  return (
                                    <div className="rounded-lg border overflow-hidden">
                                      <div className="flex items-center justify-between px-3 py-2 bg-muted/40">
                                        <div className="flex items-center gap-2">
                                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-foreground/10 text-foreground text-[14px] font-bold leading-none">6</span>
                                          <span className="text-[16px] font-semibold">접근도로 상실 여부</span>
                                        </div>
                                        <span className={cn("text-[16px] font-semibold px-2.5 py-1 rounded-full", isMet6 ? `${JUDGMENT_COLORS.충족.bgLight} ${JUDGMENT_COLORS.충족.textDark}` : `${JUDGMENT_COLORS.미충족.bgLight} ${JUDGMENT_COLORS.미충족.textDark}`)}>
                                          {isMet6 ? "충족" : "미충족"}
                                        </span>
                                      </div>
                                      <div className="px-3 py-2 space-y-1.5 divide-y divide-border/50">
                                        <div className="flex items-center gap-3 pb-1.5">
                                          <span className="text-[16px] text-[#666666] shrink-0 w-8">기준</span>
                                          <p className="text-[16px] text-[#666666]">{roadDesc ?? ""}</p>
                                        </div>
                                        <div className="flex items-start gap-3 pt-1.5">
                                          <span className="text-[16px] text-[#1a1a1a] shrink-0 w-8">결과</span>
                                          <div className={cn("text-[16px] text-[#1a1a1a] space-y-1 rounded-md transition-colors", accessRoadChanged && "bg-amber-50 px-2 py-1 -mx-2")}>
                                            <span className={cn("font-semibold text-[#1a1a1a]", accessRoadChanged && "text-amber-700")}>
                                              {isMet6 ? "접근도로 상실" : "접근도로 유지"}
                                            </span>
                                            {isMet6 && (
                                              <p>· 근거) 영상AI분석 결과, 민원인 주장</p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* 7단계: 잔여지 형상에 따른 폭 */}
                                {(() => {
                                  const shapeCheck = aiResult.criteriaChecks?.find(c =>
                                    c.criteriaName.includes("형상") || c.criteriaName.includes("내접") || c.criteriaName.includes("폭") || c.criteriaName.includes("삼각")
                                  );
                                  const isMet7 = shapeCheck?.isMet ?? false;
                                  return (
                                    <div className="rounded-lg border overflow-hidden">
                                      <div className="flex items-center justify-between px-3 py-2 bg-muted/40">
                                        <div className="flex items-center gap-2">
                                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-foreground/10 text-foreground text-[14px] font-bold leading-none">7</span>
                                          <span className="text-[16px] font-semibold">잔여지 형상에 따른 폭</span>
                                        </div>
                                        <span className={cn("text-[16px] font-semibold px-2.5 py-1 rounded-full", isMet7 ? `${JUDGMENT_COLORS.충족.bgLight} ${JUDGMENT_COLORS.충족.textDark}` : `${JUDGMENT_COLORS.미충족.bgLight} ${JUDGMENT_COLORS.미충족.textDark}`)}>
                                          {isMet7 ? "충족" : "미충족"}
                                        </span>
                                      </div>
                                      <div className="px-3 py-2 space-y-1.5 divide-y divide-border/50">
                                        <div className="flex items-center gap-3 pb-1.5">
                                          <span className="text-[16px] text-[#666666] shrink-0 w-8">기준</span>
                                          <p className="text-[16px] text-[#666666]">내접사각형 폭 5m 이하 또는 삼각형 한 변 11m 이하</p>
                                        </div>
                                        <div className="flex items-center gap-3 pt-1.5">
                                          <span className="text-[16px] text-[#1a1a1a] shrink-0 w-8">결과</span>
                                          {shapeCheck?.criteriaDescription && (
                                            <p className="text-[16px] text-[#1a1a1a]">
                                              {shapeCheck.criteriaDescription.split(/(비정형)/).map((part, i) =>
                                                part === "비정형"
                                                  ? <strong key={i} className="font-bold">{part}</strong>
                                                  : part
                                              )}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}

                              </div>
                            </div>

                            {/* 9. 수동 확인 항목 */}
                            {aiResult.judgmentRationale?.manualCheckItems && aiResult.judgmentRationale.manualCheckItems.length > 0 && (
                              <div className="space-y-2">
                                <h5 className="text-[16px] font-semibold flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-blue-500" />
                                  수동 확인 항목
                                </h5>
                                <ul className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 space-y-1">
                                  {aiResult.judgmentRationale.manualCheckItems.map((item, idx) => (
                                    <li key={idx} className="text-[16px] text-blue-700 flex items-start gap-1.5">
                                      <span className="mt-0.5 shrink-0">•</span><span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-[16px] text-muted-foreground py-2">상세 분석 결과가 없습니다.</p>
                        )}

                        {/* 담당자 확인 알림 */}
                        {aiResult && (() => {
                          const tips: { message: string; tip: string }[] = [];

                          if (aiResult.accessRoadLost)
                            tips.push({
                              message: "접면 도로의 단절이 발생했습니다.",
                              tip: "도로 편입으로 인해 기존 접면 도로가 사라지면서 해당 토지의 진출입이 막힌 상태입니다. 우회 도로나 인접 사도를 통한 접근이 가능한지, 실제 차량 통행이 가능한 폭원이 확보되는지 현장에서 직접 확인해 보세요.",
                            });

                          if (aiResult.waterChannelLost)
                            tips.push({
                              message: "관개수로가 상실된 것으로 확인됩니다.",
                              tip: "편입 공사로 인해 기존 농업용 수로가 단절되어 해당 필지의 용수 공급이 어려워진 상태입니다. 인근 수리시설 또는 대체 수로 연결 가능 여부를 확인하고, 영농 지속이 실질적으로 가능한지 판단해 보세요.",
                            });

                          if (aiResult.farmMachineDifficulty)
                            tips.push({
                              message: "농기계 진입·회전이 곤란한 상태입니다.",
                              tip: "잔여지의 폭이나 형상이 변경되어 트랙터 등 농기계가 진입하거나 회전하기 어려운 구조가 되었습니다. 현장에서 진입로 폭원, 회전 가능 반경 등을 직접 측정하고, 실제 영농 작업이 가능한 상태인지 확인해 보세요.",
                            });

                          if (aiResult.isBlindLand)
                            tips.push({
                              message: "맹지(도로 접근 불가) 상태가 감지되었습니다.",
                              tip: "편입 이후 잔여지가 어떤 도로와도 접하지 않는 맹지 상태가 된 것으로 판단됩니다. 인근 공도 또는 타인 소유 사도를 통한 통행 가능 여부를 확인하고, 사실상 토지 이용이 불가능한 상태인지 현장에서 검토해 보세요.",
                            });

                          if (tips.length === 0) return null;

                          return (
                            <div className="mt-4 pt-4 border-t border-amber-200 space-y-2">
                              <h5 className="text-[15px] font-semibold flex items-center gap-2 text-amber-700">
                                <Bell className="h-4 w-4 shrink-0" />
                                담당자 확인 알림
                              </h5>
                              <div className="space-y-2">
                                {tips.map((tip, idx) => (
                                  <div key={idx} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                                    <p className="text-[14px] font-semibold text-amber-800">⚠ {tip.message}</p>
                                    <p className="text-[14px] text-amber-700 mt-1.5 flex items-start gap-1.5">
                                      <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                                      <span><span className="font-medium">업무 TIP:</span> {tip.tip}</span>
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            ) : (
              <div className="p-8 text-center text-muted-foreground border rounded-lg bg-muted/30">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>아직 분석 결과가 없습니다.</p>
                <p className="text-[16px] mt-1">왼쪽에서 분석을 실행하세요.</p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* 하단 액션 버튼 */}
      <div className="flex items-center justify-start mt-6 pb-6">
        <Button variant="outline" className="w-[80px] text-foreground border-foreground hover:bg-foreground/5" onClick={onBack}>
          목록
        </Button>
      </div>

      {/* AI 분석 상세 다이얼로그 */}
      <AIAnalysisFlowDialog
        open={showAIAnalysisDialog}
        onOpenChange={setShowAIAnalysisDialog}
        aiResult={parcel.aiResult ?? null}
        landInfo={parcel.landInfo}
      />

      {/* 토지정보 상세보기 모달 */}
      <Dialog open={showLandInfoModal} onOpenChange={setShowLandInfoModal}>
        <DialogContent className="z-[10000] bg-white sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900">토지정보 상세보기</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">

            {/* 1. 토지이용계획 */}
            <div>
              <h4 className="mb-2 text-[16px] font-semibold">토지이용계획 (7개 항목)</h4>
              <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-[16px]">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="w-[160px] bg-slate-50 px-4 py-2.5 font-medium text-slate-600">용도구역 명칭</td>
                    <td className="px-4 py-2.5 text-slate-800">토지구획정리사업지구 / 도로구역 / 전통상업보존구역 / 상대보호구역 / 중로1류 (폭 20~25m) / 교통광장 / 제2종일반주거지역</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 px-4 py-2.5 font-medium text-slate-600">저촉 여부</td>
                    <td className="px-4 py-2.5 text-slate-800">포함 (구역 안에 있음) / 접함 (경계에 닿음)</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 px-4 py-2.5 font-medium text-slate-600">등록일</td>
                    <td className="px-4 py-2.5 text-slate-800">2024-08-23</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 px-4 py-2.5 font-medium text-slate-600">최종 수정일</td>
                    <td className="px-4 py-2.5 text-slate-800">2026-05-06</td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>

            {/* 2. 소유 정보 */}
            <div>
              <h4 className="mb-2 text-[16px] font-semibold">소유 정보</h4>
              <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-[16px]">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="w-[160px] bg-slate-50 px-4 py-2.5 font-medium text-slate-600">소유 구분</td>
                    <td className="px-4 py-2.5 text-slate-800">개인</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 px-4 py-2.5 font-medium text-slate-600">소유자 거주지</td>
                    <td className="px-4 py-2.5 text-slate-800">관외 — 부산</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 px-4 py-2.5 font-medium text-slate-600">공유자 수</td>
                    <td className="px-4 py-2.5 text-slate-800">5명</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 px-4 py-2.5 font-medium text-slate-600">이 소유자 지분 면적</td>
                    <td className="px-4 py-2.5 text-slate-800">24.33 m&sup2;</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 px-4 py-2.5 font-medium text-slate-600">소유권 변동 원인</td>
                    <td className="px-4 py-2.5 text-slate-800">{"소유권이전 (매매\u00B7증여\u00B7상속 등)"}</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 px-4 py-2.5 font-medium text-slate-600">소유권 취득일</td>
                    <td className="px-4 py-2.5 text-slate-800">2019-06-04</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 px-4 py-2.5 font-medium text-slate-600">공시지가 (소유자 기준)</td>
                    <td className="px-4 py-2.5 text-slate-800">{parcel.landInfo.officialLandPrice ? `${parcel.landInfo.officialLandPrice.toLocaleString()} 원/m\u00B2` : "601,300 원/m\u00B2"}</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 px-4 py-2.5 font-medium text-slate-600">정보 기준 연월</td>
                    <td className="px-4 py-2.5 text-slate-800">{parcel.landInfo.officialLandPriceYear ? `${parcel.landInfo.officialLandPriceYear}년 12월` : "2024년 12월"}</td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>

            {/* 3. 토지이동 이력 */}
            <div>
              <h4 className="mb-2 text-[16px] font-semibold">{"토지이동 이력 (5건)"}</h4>
              <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-[16px]">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="w-[160px] bg-slate-50 px-4 py-2.5 font-medium text-slate-600">이력 순번</td>
                    <td className="px-4 py-2.5 text-slate-800">{"01 \u2192 05"}</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 px-4 py-2.5 font-medium text-slate-600">이동 발생일 / 소멸일</td>
                    <td className="px-4 py-2.5 text-slate-800">{"1995-11-28 ~ (현재 유효: 9999-12-31)"}</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 px-4 py-2.5 font-medium text-slate-600">이동 사유</td>
                    <td className="px-4 py-2.5 text-slate-800">구획정리 시행 / 분할 / 구획정리 시행신고 폐지</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 px-4 py-2.5 font-medium text-slate-600">이동 당시 면적</td>
                    <td className="px-4 py-2.5 text-slate-800">{"944 m\u00B2 \u2192 828 m\u00B2 \u2192 146 m\u00B2"}</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 px-4 py-2.5 font-medium text-slate-600">이동 당시 지목</td>
                    <td className="px-4 py-2.5 text-slate-800">{"답 (논)"}</td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>

            {/* 4. 연도별 공시지가 이력 */}
            <div>
              <h4 className="mb-2 text-[16px] font-semibold">{"연도별 공시지가 이력 (10건)"}</h4>
              <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-[16px]">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="w-[160px] bg-slate-50 px-4 py-2.5 font-medium text-slate-600">공시 기준 연도</td>
                    <td className="px-4 py-2.5 text-slate-800">1999 ~ 2008</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 px-4 py-2.5 font-medium text-slate-600">공시 일자</td>
                    <td className="px-4 py-2.5 text-slate-800">1999-06-30 / 2008-05-31 등</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 px-4 py-2.5 font-medium text-slate-600">개별공시지가</td>
                    <td className="px-4 py-2.5 text-slate-800">{"223,000원 (1999) \u2192 254,000원 (2008) 원/m\u00B2"}</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 px-4 py-2.5 font-medium text-slate-600">표준지 여부</td>
                    <td className="px-4 py-2.5 text-slate-800">{"N \u2014 개별지 (표준지 아님)"}</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 px-4 py-2.5 font-medium text-slate-600">기준 월</td>
                    <td className="px-4 py-2.5 text-slate-800">{"1월 (매년 1월 1일 기준 산정)"}</td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
