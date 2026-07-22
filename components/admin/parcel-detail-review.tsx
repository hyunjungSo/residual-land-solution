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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { LandMap } from "@/components/land-map";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Sparkles,
  Settings2,
  Scale,
  Bookmark,
  MapPin,
  LayoutGrid,
  Triangle,
} from "lucide-react";
import type {
  ProcessedParcel,
  AnalysisHistory,
  LandCategory,
  LandShape,
  AIJudgmentResult,
  AdminCheckItems,
  AIAnalysisResult,
  LandType,
  Application,
} from "@/lib/types";
import { ManualApplicationForm } from "@/components/admin/manual-application-form";
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
  onApplicationRegistered?: (application: Application) => void;
}

export function ParcelDetailReview({ parcel, onUpdate, onBack, onNavigateToApplication, onApplicationRegistered }: ParcelDetailReviewProps) {
  // 신청상세 화면으로 이동
  const handleNavigateToApplication = () => {
    if (parcel.citizenActivity?.applicationId && onNavigateToApplication) {
      onNavigateToApplication(parcel.citizenActivity.applicationId);
    }
  };
  
  const [showAppForm, setShowAppForm] = useState(false);

  // 분析 옵션 상태
  const { toast } = useToast();
  const [currentUsage, setCurrentUsage] = useState<LandCategory>(parcel.currentUsage);
  const [landShape, setLandShape] = useState<LandShape>(parcel.landShape);
  type NullableCheckItems = Record<keyof AdminCheckItems, boolean | null>;
  const initCheckItems = (): NullableCheckItems => parcel.confirmedAt
    ? { ...parcel.adminCheckItems }
    : { accessRoadLost: null, waterChannelLost: null, farmMachineDifficulty: null, farmMachineRotationDifficulty: null, livestockBuildingUnusable: null, adjacentSameOwnerLand: null };
  const [checkItems, setCheckItems] = useState<NullableCheckItems>(initCheckItems);
  const [aiCheckItems, setAiCheckItems] = useState<AdminCheckItems>(parcel.adminCheckItems);

  const [illandaItems, setIllandaItems] = useState({
    ownerIdentity: false,
    groundContinuity: false,
    purposeUnity: false,
  });

  // 담당자 확인항목 저장 이력
  type ConfirmEntry = {
    savedAt: string;
    currentUsage: LandCategory;
    landShape: LandShape;
    illandaConditions: { ownerIdentity: boolean; groundContinuity: boolean; purposeUnity: boolean };
    checkItems: AdminCheckItems;
  };
  type MemoEntry = { createdAt: string; text: string };
  const initConfirmEntries = (): ConfirmEntry[] => {
    if (!parcel.confirmedAt) return [];
    return [{
      savedAt: parcel.confirmedAt,
      currentUsage: parcel.currentUsage,
      landShape: parcel.landShape,
      illandaConditions: parcel.confirmedIllandaConditions ?? { ownerIdentity: false, groundContinuity: false, purposeUnity: false },
      checkItems: parcel.adminCheckItems,
    }];
  };
  const [confirmEntries, setConfirmEntries] = useState<ConfirmEntry[]>(initConfirmEntries);
  const [memoInput, setMemoInput] = useState("");
  const [cardMemoInput, setCardMemoInput] = useState("");
  const [cardMemos, setCardMemos] = useState<MemoEntry[]>([]);
  const [showAllCardMemos, setShowAllCardMemos] = useState(false);

  const handleAddCardMemo = () => {
    const text = cardMemoInput.trim();
    if (!text) return;
    setCardMemos(prev => [...prev, { createdAt: new Date().toISOString(), text }]);
    setCardMemoInput("");
  };

  const handleSaveConfirm = () => {
    const now = new Date().toISOString();
    const entry: ConfirmEntry = {
      savedAt: now,
      currentUsage,
      landShape,
      illandaConditions: { ...illandaItems },
      checkItems: { ...aiCheckItems },
    };
    setConfirmEntries(prev => [entry, ...prev]);
    const conditions = illandaItems;
    // 메모가 있으면 최신 분석 히스토리에 메모 첨부
    const updatedHistory = memoInput.trim()
      ? parcel.analysisHistory?.map((h, i, arr) =>
          i === arr.length - 1 ? { ...h, memo: [h.memo, memoInput.trim()].filter(Boolean).join("\n") } : h
        ) ?? []
      : parcel.analysisHistory ?? [];
    setMemoInput("");
    onUpdate({
      ...parcel,
      currentUsage,
      landShape,
      adminCheckItems: { ...aiCheckItems },
      confirmedIllandaConditions: conditions,
      confirmedAt: now,
      confirmedBy: "담당자",
      analysisHistory: updatedHistory,
    });
    toast({ title: "담당자 확인 항목 저장 완료", description: "확인 항목이 저장되었습니다." });
  };

  const savedAt = confirmEntries.length > 0 ? confirmEntries[0].savedAt : "";

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
      farmMachineRotationDifficulty: false,
      livestockBuildingUnusable: false,
      adjacentSameOwnerLand: false,
    });
  };

  // 분석 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // AI 분석 상세 다이얼로그
  const [showAIAnalysisDialog, setShowAIAnalysisDialog] = useState(false);
  // 토지정보 상세보기 모달
  const [showLandInfoModal, setShowLandInfoModal] = useState(false);

  // 2차 분석 (재분석) 실행
  const handleReanalyze = async () => {
    setIsAnalyzing(true);
    
    // 분석 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 옵션에 따른 결과 계산 (시뮬레이션)
    let newResult: AIJudgmentResult = "보상 가능성 낮음";
    
    // 확인항목 중 하나라도 체크되면 높음
    if (checkItems.farmMachineDifficulty || checkItems.accessRoadLost || checkItems.waterChannelLost || checkItems.farmMachineRotationDifficulty || checkItems.livestockBuildingUnusable || checkItems.adjacentSameOwnerLand) {
      newResult = "보상 가능성 높음";
    }
    
    // 토지 형상이 불규칙하면 높음
    const irregularShapes: LandShape[] = ["삼각형", "역삼각형", "부정형", "자루형"];
    if (irregularShapes.includes(landShape)) {
      newResult = "보상 가능성 높음";
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
      accessRoadLost: checkItems.accessRoadLost ?? false,
      waterChannelLost: checkItems.waterChannelLost ?? false,
      farmMachineDifficulty: checkItems.farmMachineDifficulty ?? false,
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
      previousResult: parcel.aiResult?.provisionalJudgment as AIJudgmentResult || "보상 가능성 낮음",
      newResult: newResult,
      previousShapeIndex: parcel.aiResult?.remainingShapeIndex || 0,
      newShapeIndex: newAiResult.remainingShapeIndex,
      changedOptions: {
        currentUsage,
        landShape,
        accessRoadLost: checkItems.accessRoadLost ?? false,
        waterChannelLost: checkItems.waterChannelLost ?? false,
        farmMachineDifficulty: checkItems.farmMachineDifficulty ?? false,
        farmMachineRotationDifficulty: checkItems.farmMachineRotationDifficulty ?? false,
        livestockBuildingUnusable: checkItems.livestockBuildingUnusable ?? false,
        adjacentSameOwnerLand: checkItems.adjacentSameOwnerLand ?? false,
      },
      aiResult: newAiResult,
      ...(memoInput.trim() ? { memo: memoInput.trim() } : {}),
    };
    setMemoInput("");

    const resolvedCheckItems: AdminCheckItems = {
      accessRoadLost: checkItems.accessRoadLost ?? false,
      waterChannelLost: checkItems.waterChannelLost ?? false,
      farmMachineDifficulty: checkItems.farmMachineDifficulty ?? false,
      farmMachineRotationDifficulty: checkItems.farmMachineRotationDifficulty ?? false,
      livestockBuildingUnusable: checkItems.livestockBuildingUnusable ?? false,
      adjacentSameOwnerLand: checkItems.adjacentSameOwnerLand ?? false,
    };
    const updatedParcel: ProcessedParcel = {
      ...parcel,
      currentUsage,
      landShape,
      adminCheckItems: resolvedCheckItems,
      aiResult: newAiResult,
      publishStatus: (parcel.analysisHistory?.length || 0) === 0 ? "1차분석완료" : "2차분석중",
      analysisHistory: [...(parcel.analysisHistory || []), newHistory],
      lastAnalyzedAt: new Date().toISOString(),
    };

    onUpdate(updatedParcel);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      {/* 필지상세 타이틀 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">필지상세</h1>
        </div>
        <Button variant="outline" onClick={() => setShowAppForm(true)} className="gap-2">
          <FileText className="h-4 w-4" />
          수기 신청 접수
        </Button>
      </div>

      {/* 수기 신청 접수 다이얼로그 */}
      <Dialog open={showAppForm} onOpenChange={setShowAppForm}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
            <DialogTitle className="text-lg font-semibold">수기 신청 접수</DialogTitle>
            <p className="text-sm text-muted-foreground">수기로 제출된 신청서를 시스템에 등록합니다.<br/>등록 완료 후 신청관리 목록에 자동으로 추가됩니다.</p>
          </DialogHeader>
          <ManualApplicationForm
            prefillLandInfo={parcel.landInfo}
            onComplete={(app) => {
              onApplicationRegistered?.(app);
              setShowAppForm(false);
              toast({ title: "수기 신청 접수 완료", description: "민원 목록에 등록되었습니다." });
            }}
            onCancel={() => setShowAppForm(false)}
          />
        </DialogContent>
      </Dialog>



      {/* 필지 기본 정보 + 담당자 확인 */}
      <div className="flex flex-col gap-5">
      <Card className="border-0 shadow-none px-6">
        <CardContent className="p-0">
          {/* 상단: 소재지 + 민원 신청 상태 */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <span className="text-lg font-semibold text-foreground">{parcel.landInfo.address}</span>
            {parcel.residualStatus === "잔여지 인정" && parcel.citizenActivity?.applicationSubmitted && (
              <Badge
                className="bg-transparent text-emerald-700 hover:bg-transparent cursor-pointer text-[15px]"
                onClick={handleNavigateToApplication}
              >
                신청상세 보기
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Badge>
            )}
          </div>
          {/* 하단: 정보 그리드 2행 3열 */}
          <div className="grid grid-cols-3 gap-x-8 gap-y-3 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-[16px] text-muted-foreground">사업명:</span>
              <span className="text-[16px] font-medium">{parcel.projectName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[16px] text-muted-foreground">잔여 면적 (비율):</span>
              <span className="text-[16px] font-medium">{parcel.landInfo.remainingArea.toLocaleString()} ㎡ ({parcel.landInfo.remainingRatio}%)</span>
            </div>
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

      {/* 담당자 확인항목 저장 이력 */}
      {confirmEntries.length > 0 && (
        <Card className="border-0 shadow-none px-6">
          <CardHeader className="px-0 pt-0 pb-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-[16px]">담당자 확인항목</CardTitle>
              <span className="text-[12px] text-muted-foreground">{formatDateTime(confirmEntries[0].savedAt)} 저장</span>
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            {(() => {
              const latest = confirmEntries[0];
              const allShapes = [...landShapes.regular, ...landShapes.irregular];
              const usageLabel = landCategories.find(c => c.value === latest.currentUsage)?.label ?? latest.currentUsage;
              const shapeLabel = allShapes.find(s => s.value === latest.landShape)?.label ?? latest.landShape;
              const CHECK_ITEM_CATEGORIES: Record<string, string[]> = {
                accessRoadLost: ["대", "전", "답", "임", "잡"],
                waterChannelLost: ["전", "답"],
                farmMachineDifficulty: ["전", "답"],
                farmMachineRotationDifficulty: ["전", "답"],
                livestockBuildingUnusable: ["잡"],
                adjacentSameOwnerLand: ["대", "전", "답", "임", "잡"],
              };
              const visibleCheckItems = adminCheckItemOptions.filter(
                opt => CHECK_ITEM_CATEGORIES[opt.value]?.includes(latest.currentUsage)
              );
              return (
                <div className="flex flex-row flex-wrap items-center gap-x-2 gap-y-1.5">
                  {/* 현재 활용지목 */}
                  <span className="text-[12px] text-muted-foreground shrink-0">현재 활용지목</span>
                  <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-medium bg-gray-900 border-gray-900 text-white">{usageLabel}</span>
                  <span className="text-muted-foreground/30 select-none px-0.5">|</span>
                  {/* 토지 형상 */}
                  <span className="text-[12px] text-muted-foreground shrink-0">토지 형상</span>
                  <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-medium bg-gray-900 border-gray-900 text-white">{shapeLabel}</span>
                  {/* 일단의 토지 요건 — 충족 항목만 */}
                  {(() => {
                    const met = [
                      { key: "ownerIdentity" as const, label: "소유자의 동일성" },
                      { key: "groundContinuity" as const, label: "지반의 연속성" },
                      { key: "purposeUnity" as const, label: "용도의 일체성" },
                    ].filter(({ key }) => latest.illandaConditions[key]);
                    if (met.length === 0) return null;
                    return (
                      <>
                        <span className="text-muted-foreground/30 select-none px-0.5">|</span>
                        <span className="text-[12px] text-muted-foreground shrink-0">일단의 토지 요건</span>
                        {met.map(({ key, label }) => (
                          <span key={key} className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium bg-gray-900 border-gray-900 text-white">
                            {label}: 충족
                          </span>
                        ))}
                      </>
                    );
                  })()}
                  {/* 담당자 확인항목 — 해당 항목만 */}
                  {(() => {
                    const matched = visibleCheckItems.filter(opt => latest.checkItems[opt.value as keyof AdminCheckItems]);
                    if (matched.length === 0) return null;
                    return (
                      <>
                        <span className="text-muted-foreground/30 select-none px-0.5">|</span>
                        <span className="text-[12px] text-muted-foreground shrink-0">확인항목</span>
                        {matched.map(opt => (
                          <span key={opt.value} className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium bg-gray-900 border-gray-900 text-white">
                            {opt.label}: 해당
                          </span>
                        ))}
                      </>
                    );
                  })()}
                </div>
              );
            })()}
            {/* 메모 — 좌: 입력, 우: 리스트 */}
            <div className="border-t border-slate-100 pt-3 flex gap-4 items-start">
              {/* 좌: 입력 */}
              <div className="flex flex-col gap-2 flex-1">
                <Textarea
                  placeholder="메모 입력"
                  value={cardMemoInput}
                  onChange={(e) => setCardMemoInput(e.target.value)}
                  rows={3}
                  className="text-[13px] resize-none"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddCardMemo(); } }}
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddCardMemo} className="w-full">
                  저장
                </Button>
              </div>
              {/* 우: 저장된 메모 리스트 */}
              <div className="flex-1 min-w-0">
                {cardMemos.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-center text-[12px] text-muted-foreground">
                    저장된 메모가 없습니다
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                      {(showAllCardMemos ? cardMemos : cardMemos.slice(0, 4)).map((m, i) => (
                        <div key={i} className="px-3 py-2.5" style={{ backgroundColor: "rgb(251,251,251)" }}>
                          <p className="text-[11px] text-muted-foreground mb-0.5">{formatDateTime(m.createdAt)}</p>
                          <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-snug">{m.text}</p>
                        </div>
                      ))}
                    </div>
                    {cardMemos.length > 4 && (
                      <button
                        type="button"
                        className="w-full text-[12px] text-muted-foreground hover:text-foreground hover:bg-gray-50 py-2 border-t border-gray-100 transition-colors"
                        onClick={() => setShowAllCardMemos(v => !v)}
                      >
                        {showAllCardMemos ? "접기" : `더보기 (+${cardMemos.length - 4}건)`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      </div>

      {/* AI 분석 영역 - 2컬럼 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* 왼쪽: AI 분析 */}
        <Card className="border-0 shadow-none sticky top-4">
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
              <LandMap
                landInfo={parcel.landInfo}
                showOverlay={true}
                interactive={false}
                sameOwnerParcels={dummyProcessedParcels
                  .filter(p => p.id !== parcel.id && p.landInfo.ownerName === parcel.landInfo.ownerName)
                  .map(p => p.landInfo)}
              />
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
                {(() => {
                  const LAND_TYPE_TO_CAT: Record<string, string> = { "택지": "대", "대지": "대", "농지": "전", "산지": "임", "그밖의토지": "잡" };
                  const aiCat = parcel.aiResult?.landTypePath ? LAND_TYPE_TO_CAT[parcel.aiResult.landTypePath] : undefined;
                  const aiLabel = aiCat ? (landCategories.find(c => c.value === aiCat)?.label ?? aiCat) : parcel.aiResult?.landTypePath;
                  const confirmedLabel = confirmEntries[0] ? (landCategories.find(c => c.value === confirmEntries[0].currentUsage)?.label ?? confirmEntries[0].currentUsage) : undefined;
                  if (!aiLabel && !confirmedLabel) return null;
                  return (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {aiLabel && (
                        <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium shrink-0 whitespace-nowrap bg-violet-50 border-violet-300 text-violet-700">
                          AI 판정: {aiLabel}
                        </span>
                      )}
                      {confirmedLabel && (
                        <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium shrink-0 whitespace-nowrap bg-gray-900 border-gray-900 text-white">
                          담당자 판정: {confirmedLabel}
                        </span>
                      )}
                    </div>
                  );
                })()}
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
                {(() => {
                  const allShapes = [...landShapes.regular, ...landShapes.irregular];
                  const latestHistory = parcel.analysisHistory?.slice(-1)[0];
                  const aiShape = latestHistory?.changedOptions?.landShape ?? parcel.landInfo.remainingShape;
                  const aiLabel = aiShape ? (allShapes.find(s => s.value === aiShape)?.label ?? aiShape) : undefined;
                  const confirmedLabel = confirmEntries[0] ? (allShapes.find(s => s.value === confirmEntries[0].landShape)?.label ?? confirmEntries[0].landShape) : undefined;
                  if (!aiLabel && !confirmedLabel) return null;
                  return (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {aiLabel && (
                        <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium shrink-0 whitespace-nowrap bg-violet-50 border-violet-300 text-violet-700">
                          AI 판정: {aiLabel}
                        </span>
                      )}
                      {confirmedLabel && (
                        <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium shrink-0 whitespace-nowrap bg-gray-900 border-gray-900 text-white">
                          담당자 판정: {confirmedLabel}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* 일단의 토지 요건 확인 */}
            <div className="space-y-2">
              <Label className="text-[16px]">일단의 토지 요건 확인</Label>
              <div className="grid grid-cols-3 gap-5">
                {[
                  { value: "ownerIdentity", label: "소유자의 동일성", aiKey: null },
                  { value: "groundContinuity", label: "지반의 연속성", aiKey: "continuous" as const },
                  { value: "purposeUnity", label: "용도의 일체성", aiKey: "sameUsage" as const },
                ].map((option) => {
                  const key = option.value as keyof typeof illandaItems;
                  const checked = illandaItems[key];
                  const unifiedConditions = parcel.aiResult?.unifiedParcelAnalysis?.conditions;
                  const aiUnitVal: boolean = option.aiKey ? (unifiedConditions?.[option.aiKey] ?? false) : false;
                  const confirmedIllandaVal = confirmEntries[0]?.illandaConditions?.[key];
                  const badgeVal = confirmEntries[0] !== undefined ? confirmedIllandaVal : undefined;
                  return (
                    <div
                      key={option.value}
                      className={cn(
                        "flex flex-col gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                        checked ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                      )}
                      onClick={() => setIllandaItems(prev => ({ ...prev, [key]: !prev[key] }))}
                    >
                      <div className="flex items-center gap-1.5">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => setIllandaItems(prev => ({ ...prev, [key]: !!v }))}
                        />
                        <span className="text-xs">{option.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 pl-5">
                        {option.aiKey && (
                          <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium shrink-0 whitespace-nowrap ${
                            aiUnitVal ? "bg-violet-600 border-violet-600 text-white" : "bg-muted border-border text-muted-foreground"
                          }`}>
                            {aiUnitVal ? "AI 판정: 충족" : "AI 판정: 미충족"}
                          </span>
                        )}
                        <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium shrink-0 whitespace-nowrap ${
                          badgeVal ? "bg-gray-900 border-gray-900 text-white" : "bg-muted border-border text-muted-foreground"
                        }`}>
                          {badgeVal ? "담당자 판정: 충족" : "담당자 판정: 미충족"}
                        </span>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

            {/* 담당자 확인항목 */}
            <div className="space-y-2">
              <Label className="text-[16px]">담당자 확인항목</Label>
              {(() => {
                const CHECK_ITEM_CATEGORIES: Record<string, string[]> = {
                  accessRoadLost: ["대", "전", "답", "임", "잡"],
                  waterChannelLost: ["전", "답"],
                  farmMachineDifficulty: ["전", "답"],
                  farmMachineRotationDifficulty: ["전", "답"],
                  livestockBuildingUnusable: ["잡"],
                  adjacentSameOwnerLand: ["대", "전", "답", "임", "잡"],
                };
                const visibleOptions = adminCheckItemOptions.filter(
                  (opt) => CHECK_ITEM_CATEGORIES[opt.value]?.includes(currentUsage)
                );
                return (
                  <div className="grid grid-cols-2 gap-2">
                    {visibleOptions.map((option) => {
                      const key = option.value as keyof AdminCheckItems;
                      const aiChecked = aiCheckItems[key];
                      const aiVal: boolean | undefined =
                        key === "accessRoadLost" ? parcel.aiResult?.accessRoadLost
                        : key === "waterChannelLost" ? parcel.aiResult?.waterChannelLost
                        : key === "farmMachineDifficulty" ? parcel.aiResult?.farmMachineDifficulty
                        : undefined;
                      const confirmedVal = confirmEntries[0] ? confirmEntries[0].checkItems[key] : undefined;
                      return (
                        <div
                          key={option.value}
                          className={cn(
                            "flex flex-col gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                            aiChecked ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                          )}
                          onClick={() => setAiCheckItems(prev => ({ ...prev, [key]: !prev[key] }))}
                        >
                          <div className="flex items-center gap-1.5">
                            <Checkbox
                              checked={aiChecked}
                              onCheckedChange={(v) => setAiCheckItems(prev => ({ ...prev, [key]: !!v }))}
                            />
                            <span className="text-xs">{option.label}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 pl-5">
                            {aiVal !== undefined && (
                              <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium shrink-0 whitespace-nowrap ${aiVal ? "bg-violet-600 border-violet-600 text-white" : "bg-muted border-border text-muted-foreground"}`}>
                                {aiVal ? "AI 판정: 해당" : "AI 판정: 미해당"}
                              </span>
                            )}
                            {confirmedVal !== undefined && (
                              <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium shrink-0 whitespace-nowrap ${confirmedVal ? "bg-gray-900 border-gray-900 text-white" : "bg-muted border-border text-muted-foreground"}`}>
                                {confirmedVal ? "담당자 판정: 해당" : "담당자 판정: 미해당"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* 메모 */}
            <div className="space-y-2">
              <Label className="text-[16px]">메모</Label>
              <Textarea
                placeholder="추가 메모 (선택)"
                value={memoInput}
                onChange={(e) => setMemoInput(e.target.value)}
                rows={3}
              />
            </div>

            {/* 버튼 행: 담당자 확인 항목 저장 (좌) + AI 분석 실행 (우) */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSaveConfirm}
                className="w-[160px] shrink-0 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
              >
                확인 항목 저장
              </Button>
              <Button
                onClick={handleReanalyze}
                disabled={isAnalyzing}
                className="flex-1"
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
            </div>
          </CardContent>
        </Card>

        {/* 오른쪽: 담당자 검토 + AI 분석결과 */}
        <div className="space-y-5">

        {/* AI 분析결과 검토 카드 */}
        <Card className="border-0 shadow-none sticky top-4">
          <CardHeader>
            <CardTitle>AI 분석결과 검토</CardTitle>
            <CardDescription>
              AI 분석 결과와 보상 가능성 판정을 확인합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(parcel.analysisHistory?.length || 0) > 0 ? (
              <Accordion
                type="single"
                collapsible
                defaultValue={`history-${parcel.analysisHistory[parcel.analysisHistory.length - 1]?.id}`}
                className="space-y-2"
              >
                {parcel.analysisHistory.slice().reverse().map((history) => {
                  const aiResult = history.aiResult;
                  const isChangeDriven = history.aiResult?.analysisSource === "auto-change";
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
                                history.newResult === "보상 가능성 높음" || history.newResult === "수용가능"
                                  ? "bg-emerald-700"
                                  : "bg-rose-600"
                              )}
                            >
                              {history.newResult === "수용가능" ? "보상 가능성 높음" :
                               history.newResult === "수용불가" ? "보상 가능성 낮음" :
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
                            if (history.aiResult?.accessRoadLost) checkItems.push("접면도로 상실");
                            if (history.aiResult?.waterChannelLost) checkItems.push("농업용 수로 상실");
                            if (history.aiResult?.farmMachineDifficulty) checkItems.push("농기계 진입 곤란");
                            return (
                              <div className="flex items-center gap-2 text-[15px]">
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
                      <AccordionContent className="pb-0">
                        {aiResult ? (() => {
                          const li = parcel.landInfo;
                          const includedArea = li.includedArea ?? (li.originalArea - li.remainingArea);
                          const siOriginal = aiResult.originalShapeIndex ?? li.originalShapeIndex ?? 1.0;
                          const siRemaining = aiResult.remainingShapeIndex ?? li.remainingShapeIndex ?? 5.0;

                          const regularShapes = ["정방형", "가로장방형", "세로장방형"];
                          const beforeIsRegular = regularShapes.some(s => (li.originalShape || "").includes(s));
                          const afterIsRegular = regularShapes.some(s => (li.remainingShape || "").includes(s));
                          const manualCheckItems = aiResult.judgmentRationale?.manualCheckItems ?? [];

                          const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
                            <div className="flex items-center gap-2 py-3">
                              <span className="text-muted-foreground">{icon}</span>
                              <span className="text-[15px] font-bold text-gray-800">{title}</span>
                            </div>
                          );
                          const InfoBox = ({ children }: { children: React.ReactNode }) => (
                            <div className="rounded-lg p-4 mb-3" style={{ backgroundColor: "rgb(251,251,251)" }}>{children}</div>
                          );
                          const MetricItem = ({ label, value }: { label: string; value: string }) => (
                            <div className="space-y-0.5">
                              <p className="text-[14px] text-muted-foreground">{label}</p>
                              <p className="text-[16px] font-semibold text-gray-900">{value}</p>
                            </div>
                          );
                          return (
                          <div className="divide-y divide-gray-100">
                            {/* 변동 감지 배너 */}
                            {isChangeDriven && (
                              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                <p className="text-[15px] text-amber-700 leading-relaxed">
                                  본 분석은 <strong>토지 정보 변동 감지</strong>에 따라 자동으로 재판독되었습니다.
                                </p>
                              </div>
                            )}

                            {/* 수동 분석 적용 옵션 */}
                            {history.changedOptions && (history.changedOptions.currentUsage || history.changedOptions.landShape) && (
                              <div className="py-1">
                                <SectionTitle icon={<Settings2 className="h-4 w-4" />} title="수동 분석 적용 옵션" />
                                <InfoBox>
                                  <div className="grid grid-cols-2 gap-4">
                                    {history.changedOptions.currentUsage && (
                                      <MetricItem label="현재 활용지목" value={landCategories.find(c => c.value === history.changedOptions?.currentUsage)?.label ?? history.changedOptions.currentUsage} />
                                    )}
                                    {history.changedOptions.landShape && (
                                      <MetricItem label="토지 형상" value={[...landShapes.regular, ...landShapes.irregular].find(s => s.value === history.changedOptions?.landShape)?.label ?? history.changedOptions.landShape} />
                                    )}
                                  </div>
                                </InfoBox>
                              </div>
                            )}
                            {history.memo && (
                              <div className="py-1">
                                <SectionTitle icon={<FileText className="h-4 w-4" />} title="메모" />
                                <InfoBox>
                                  <p className="text-[15px] text-gray-700 whitespace-pre-wrap leading-relaxed">{history.memo}</p>
                                </InfoBox>
                              </div>
                            )}

                            {/* 편입 정보 */}
                            <div className="py-1">
                              <SectionTitle icon={<LayoutGrid className="h-4 w-4" />} title="편입 정보" />
                              <InfoBox>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                  <MetricItem label="편입 전 면적" value={`${li.originalArea.toLocaleString()} m²`} />
                                  <MetricItem label="편입 면적" value={`${includedArea.toLocaleString()} m²`} />
                                  <MetricItem label="잔여 면적" value={`${li.remainingArea.toLocaleString()} m²`} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <MetricItem label="잔여 비율" value={li.remainingRatio != null ? `${li.remainingRatio}%` : "-"} />
                                  <MetricItem label="형상지수 변화" value={`${siOriginal.toFixed(3)} → ${siRemaining.toFixed(3)}`} />
                                </div>
                              </InfoBox>
                            </div>

                            {/* 형상 분석 */}
                            <div className="py-1">
                              <SectionTitle icon={<Triangle className="h-4 w-4" />} title="형상 분석" />
                              <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 mb-3">
                                <table className="w-full text-[14px]">
                                  <thead>
                                    <tr className="bg-gray-100 border-b border-gray-200">
                                      <th className="text-left px-4 py-2 font-semibold text-gray-600 w-1/3">항목</th>
                                      <th className="text-right px-4 py-2 font-semibold text-gray-600 w-1/3">편입 전</th>
                                      <th className="text-right px-4 py-2 font-semibold text-gray-600 w-1/3">편입 후</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 bg-white">
                                    {[
                                      { label: "형상", before: li.originalShape || "-", after: li.remainingShape || "-" },
                                      { label: "정형 여부", before: beforeIsRegular ? "정형" : "비정형", after: afterIsRegular ? "정형" : "비정형" },
                                      { label: "SI", before: siOriginal.toFixed(3), after: siRemaining.toFixed(3) },
                                      { label: "면적 (m²)", before: li.originalArea.toLocaleString(), after: li.remainingArea.toLocaleString() },
                                      { label: "최소폭 (m)", before: "-", after: "-" },
                                      { label: "직사각형도", before: "-", after: "-" },
                                      { label: "볼록성", before: "-", after: "-" },
                                      { label: "MBR장단비", before: "-", after: "-" },
                                      { label: "꼭짓점수", before: "-", after: "-" },
                                      { label: "둘레 (m)", before: "-", after: "-" },
                                    ].map((row) => (
                                      <tr key={row.label}>
                                        <td className="px-4 py-2 text-gray-500">{row.label}</td>
                                        <td className="px-4 py-2 text-right text-gray-700">{row.before}</td>
                                        <td className="px-4 py-2 text-right text-gray-700">{row.after}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* 판단 요약 */}
                            {aiResult.judgmentRationale?.summary && (
                              <div className="py-1">
                                <SectionTitle icon={<FileText className="h-4 w-4" />} title="판단 요약" />
                                <InfoBox>
                                  <p className="text-[15px] text-gray-700 leading-relaxed mb-3">{aiResult.judgmentRationale.summary}</p>
                                  {aiResult.judgmentRationale.appliedCriteria && aiResult.judgmentRationale.appliedCriteria.length > 0 && (
                                    <p className="text-[14px] text-muted-foreground">적용조문: {aiResult.judgmentRationale.appliedCriteria.join(", ")}</p>
                                  )}
                                </InfoBox>
                              </div>
                            )}

                            {/* 법적 근거 */}
                            {aiResult.judgmentRationale?.legalBasis && (
                              <div className="py-1">
                                <SectionTitle icon={<Scale className="h-4 w-4" />} title="법적 근거" />
                                <InfoBox>
                                  <p className="text-[15px] text-gray-700 leading-relaxed">{aiResult.judgmentRationale.legalBasis}</p>
                                </InfoBox>
                              </div>
                            )}

                            {/* 판정결과 적용조문 */}
                            {aiResult.judgmentRationale?.appliedCriteria && aiResult.judgmentRationale.appliedCriteria.length > 0 && (
                              <div className="py-1">
                                <SectionTitle icon={<Bookmark className="h-4 w-4" />} title="판정결과 적용조문" />
                                <InfoBox>
                                  <ul className="space-y-1.5">
                                    {aiResult.judgmentRationale.appliedCriteria.map((item, idx) => (
                                      <li key={idx} className="text-[15px] text-gray-700 flex items-start gap-2">
                                        <span className="mt-1 shrink-0 text-muted-foreground">•</span><span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </InfoBox>
                              </div>
                            )}

                            {/* 일단토지 */}
                            {aiResult.unifiedParcelAnalysis && (
                              <div className="py-1">
                                <SectionTitle icon={<MapPin className="h-4 w-4" />} title="일단토지" />
                                <InfoBox>
                                  <div className="grid grid-cols-3 gap-4">
                                    <MetricItem label="합산면적" value={`${(aiResult.unifiedParcelAnalysis.combinedArea ?? li.originalArea).toLocaleString()} m²`} />
                                    <MetricItem label="합산잔여면적" value={`${li.remainingArea.toLocaleString()} m²`} />
                                    <MetricItem label="합산편입면적" value={`${includedArea.toLocaleString()} m²`} />
                                  </div>
                                </InfoBox>
                              </div>
                            )}

                            {/* 수동 확인 항목 */}
                            {manualCheckItems.length > 0 && (
                              <div className="py-1 pb-3">
                                <SectionTitle icon={<AlertTriangle className="h-4 w-4" />} title="수동 확인 항목" />
                                <InfoBox>
                                  <ul className="space-y-1.5">
                                    {manualCheckItems.map((item: string, idx: number) => (
                                      <li key={idx} className="text-[15px] text-gray-700 flex items-start gap-2">
                                        <span className="mt-1 shrink-0 text-muted-foreground">•</span><span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </InfoBox>
                              </div>
                            )}
                          </div>
                          );
                        })() : (
                          <p className="text-[16px] text-muted-foreground py-2">상세 분석 결과가 없습니다.</p>
                        )}
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
