"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LandMap } from "@/components/land-map";
import { LeafletMap } from "@/components/leaflet-map";
import { AIAnalysisFlowDialog } from "@/components/admin/ai-analysis-flow-dialog";
import { CitizenBadge } from "@/components/admin/shared";
import { AIIcon } from "@/components/ui/ai-icon";
import { JudgmentStatus } from "@/components/ui/judgment-status";
import { JUDGMENT_COLORS, JudgmentBadge } from "@/components/ui/judgment-badge";
import { cn } from "@/lib/utils";
import { landShapes, landCategories, dummyProcessedParcels, adminCheckItemOptions } from "@/lib/dummy-data";
import type { Application, JudgmentResult, FinalJudgmentResult, LandShape, LandCategory, AdminStatus, LandSpecificData, LandInfo, AIAnalysisResult, ProcessedParcel } from "@/lib/types";
import {
  ArrowLeft,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  PlayCircle,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Map as MapIcon,
  Loader2,
  RotateCcw,
  X,
  Maximize2,
  Image as ImageIcon,
  Split,
  Edit3,
  History,
  ArrowRight,
  Scale,
  Shield,
  Brain,
  ListChecks,
  Locate,
  Download,
  Eye,
  RefreshCw,
  Sparkles,
  LayoutGrid,
  Bookmark,
  AlignJustify,
  Settings2,
  Triangle,
  MapPin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface ApplicationDetailProps {
  application: Application;
  onBack: () => void;
  onSave: (application: Application) => void;
  onNavigateToList?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onOpenReview?: (application: Application) => void;
  processedParcels?: ProcessedParcel[];
}

// 담당자 판정 (보상/기각/이관) - JUDGMENT_COLORS 기반
const judgmentConfig = {
  보상: { 
    label: "보상", 
    icon: CheckCircle2, 
    borderColor: JUDGMENT_COLORS.보상.border, 
    textColor: JUDGMENT_COLORS.보상.text, 
    color: JUDGMENT_COLORS.보상.text 
  },
  기각: { 
    label: "기각", 
    icon: XCircle, 
    borderColor: JUDGMENT_COLORS.기각.border, 
    textColor: JUDGMENT_COLORS.기각.text, 
    color: JUDGMENT_COLORS.기각.text 
  },
  "심의위원회 이관": {
    label: "심의위원회 회부",
    icon: AlertTriangle, 
    borderColor: JUDGMENT_COLORS.이관.border, 
    textColor: JUDGMENT_COLORS.이관.text, 
    color: JUDGMENT_COLORS.이관.text 
  },
};

const adminStatusConfig: Record<AdminStatus, { label: string; icon: typeof Clock; variant: string }> = {
  접수완료: { label: "접수 완료", icon: Clock, variant: "outline-slate" },
  담당자검토중: { label: "담당자 검토 중", icon: PlayCircle, variant: "outline-sky" },
  담당자검토완료: { label: "담당자 검토 완료", icon: CheckCircle2, variant: "outline-sky" },
  심의위원회회부: { label: "심의위원회 회부", icon: AlertTriangle, variant: "outline-purple" },
  심의위원회검토중: { label: "심의위원회 검토 중", icon: PlayCircle, variant: "outline-purple" },
  심의위원회검토완료: { label: "심의위원회 검토 완료", icon: CheckCircle2, variant: "outline-purple" },
  심사완료: { label: "담당자 검토 완료", icon: CheckCircle2, variant: "outline-slate-deep" },
};

// 담당자 목록 (실제로는 API에서 가져옴)
const assigneeList = [
  { id: "admin-001", name: "홍길동", department: "토지보상과" },
  { id: "admin-002", name: "김철수", department: "토지보상과" },
  { id: "admin-003", name: "이영희", department: "토지보상과" },
  { id: "admin-004", name: "박민수", department: "보상심의팀" },
  { id: "admin-005", name: "정수연", department: "보상심의팀" },
];

// 필지별 검토 데이터 타입
interface LandReviewData {
  actualUsage: LandCategory;
  landShape: LandShape;
  farmMachineDifficulty: "미입력" | "해당" | "해당없음";
  accessRoadLost: boolean;
  waterChannelLost: boolean;
  landJudgment: JudgmentResult | null;       // 1차: 보상/기각/심의위원회 이관
  committeeStatus: "검토중" | "검토완료" | null; // 2차: 심의위원회 진행 상태
  committeeResult: "보상" | "기각" | null;       // 3차: 심의위원회 검토 결과
  landComment: string;
}

export function ApplicationDetail({ application, onBack, onSave, onNavigateToList, onDirtyChange, onOpenReview, processedParcels: externalParcels }: ApplicationDetailProps) {
// 복수 필지 여부 확인
  const isMultipleLands = application.additionalLands && application.additionalLands.length > 0;
  
  // 신청 필지
  const applicationLands = isMultipleLands
    ? [application.landInfo, ...(application.additionalLands ?? [])]
    : [application.landInfo];
  
  // 인접 필지 데이터
  const adjacentLands: typeof applicationLands = [
    {
      id: "adjacent-001",
      address: "경기도 용인시 처인구 포곡읍 마성리 101",
      landType: "농지",
      landCategory: "전",
      originalArea: 856,
      includedArea: 0,
      remainingArea: 856,
      remainingRatio: 100,
      originalShape: "정방형",
      remainingShape: "정방형",
      originalShapeIndex: 1.0,
      remainingShapeIndex: 1.0,
      ownerName: "",
      hasIncludedLand: false,
    },
    {
      id: "adjacent-002",
      address: "경기도 용인시 처인구 포곡읍 마성리 102",
      landType: "농지",
      landCategory: "답",
      originalArea: 1234,
      includedArea: 0,
      remainingArea: 1234,
      remainingRatio: 100,
      originalShape: "정방형",
      remainingShape: "정방형",
      originalShapeIndex: 1.0,
      remainingShapeIndex: 1.0,
      ownerName: "",
      hasIncludedLand: false,
    },
  ];

  // 전체 필지 (신청 필지 + 인접 필지)
  const allLands = [...applicationLands, ...adjacentLands] as LandInfo[];
  
  // 신청 유형 초기값 결정 - 일단지 판정 제거됨, 개별 필지 분석만 지원
  const initialApplicationType = application.applicationType || (isMultipleLands ? "multiple" : "single");
  
  // 신청유형 상태 (담당자가 변경 가능)
  const [applicationType, setApplicationType] = useState<"multiple" | "single">(initialApplicationType as "multiple" | "single");

  // 필지별 검토 데이터 초기화
  const initializeLandReviewData = (): LandReviewData[] => {
    const isCommitteeStatus = (s: string) =>
      ["심의위원회회부", "심의위원회검토중", "심의위원회검토완료"].includes(s);

    return allLands.map((land, index) => {
      const landData = application.landDataList?.[index];

      let savedJudgment: JudgmentResult | null = null;
      let savedCommitteeStatus: "검토중" | "검토완료" | null = null;
      let savedCommitteeResult: "보상" | "기각" | null = null;
      let savedComment = "";

      const st = application.adminStatus;
      // landId 매칭 우선, 없으면 순서(index) 기반 fallback
      const lj = application.landJudgmentsForReview?.find(j => j.landId === land.id)
        ?? application.landJudgmentsForReview?.[index];

      if (application.isCommitteeCase) {
        // 심의위원회 경유 건: 담당자 판정은 항상 "심의위원회 이관"
        // lj.purchaseDecision(O/X)과 lj.judgment는 심의위원회 결과
        savedJudgment = "심의위원회 이관";
      } else if (lj) {
        if (lj.purchaseDecision === "O") savedJudgment = "보상";
        else if (lj.purchaseDecision === "X") savedJudgment = "기각";
        else if (lj.purchaseDecision === "-") savedJudgment = "심의위원회 이관";
      } else if (application.finalJudgment) {
        savedJudgment = application.finalJudgment;
      }

      if (application.isCommitteeCase) {
        if (st === "심의위원회검토중") savedCommitteeStatus = "검토중";
        else if (st === "심의위원회검토완료" || st === "심사완료") {
          savedCommitteeStatus = "검토완료";
          if (lj) {
            // 복수필지: 필지별 심의위원회 결과
            if (lj.judgment === "보상") savedCommitteeResult = "보상";
            else if (lj.judgment === "기각") savedCommitteeResult = "기각";
          } else if (application.finalJudgment === "보상" || application.finalJudgment === "기각") {
            // 단일필지: 최종판정에서 심의위원회 결과 복원
            savedCommitteeResult = application.finalJudgment;
          }
        }
      }

      if (application.reviewerComment) savedComment = application.reviewerComment;

      return {
        actualUsage: (landData?.actualUsage || land.landCategory) as LandCategory,
        landShape: (landData?.reportedShape || land.remainingShape) as LandShape,
        farmMachineDifficulty: landData?.farmMachineDifficulty ? "해당" : "미입력",
        accessRoadLost: landData?.accessRoadLost || false,
        waterChannelLost: landData?.waterChannelLost || false,
        landJudgment: savedJudgment,
        committeeStatus: savedCommitteeStatus,
        committeeResult: savedCommitteeResult,
        landComment: savedComment,
      };
    });
  };

  const [landReviewDataList, setLandReviewDataList] = useState<LandReviewData[]>(initializeLandReviewData);
  
  // 변경사항 추적 (이탈 방지)
  const [isDirty, setIsDirty] = useState(false);
  const markDirty = useCallback(() => {
    setIsDirty(prev => {
      if (!prev) onDirtyChange?.(true);
      return true;
    });
  }, [onDirtyChange]);
  const clearDirty = useCallback(() => {
    setIsDirty(false);
    onDirtyChange?.(false);
  }, [onDirtyChange]);

  // 브라우저 탭 닫기/새로고침 시 경고
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // 선택된 필지 인덱스 (복수 필지용)
  const [selectedLandIndex, setSelectedLandIndex] = useState(0);
  
  // \uD638\uBC84\uB41C \uD544\uC9C0 ID (\uC9C0\uB3C4-\uB9AC\uC2A4\uD2B8 \uC5F0\uB3D9)
  const [hoveredLandId, setHoveredLandId] = useState<string | null>(null);
  
  // 포커스된 필지 ID (지도 중심 이동용) - 초기값은 첫 번째 신청 필지
  const [focusedLandId, setFocusedLandId] = useState<string | null>(applicationLands[0]?.id || null);
  
  // 선택된 인접 필지 정보 표시용
  const [selectedAdjacentParcel, setSelectedAdjacentParcel] = useState<{
    id: string;
    address: string;
    landCategory: string;
    landType: string;
    area: number;
    owner: string;
    parcelNumber?: number;
  } | null>(null);
  
  
  
  // 관리자 수치 수정 (면적, 폭 등)
  const [adminEditedValues, setAdminEditedValues] = useState<Record<string, {
    remainingArea?: number;
    width?: number;
    originalArea?: number;
  }>>({});
  
  // AI 결과와 다른 최종 판정 시 사유 필수
  const [adminOverrideReason, setAdminOverrideReason] = useState("");
  
  // \uD544\uC9C0\uBCC4 \uAC80\uD1A0 \uB370\uC774\uD130 \uC5C5\uB370\uC774\uD2B8 \uD568\uC218
  const updateLandReviewData = (index: number, field: keyof LandReviewData, value: LandReviewData[keyof LandReviewData]) => {
    markDirty();
    setLandReviewDataList(prev => {
      const newList = [...prev];
      newList[index] = { ...newList[index], [field]: value };
      return newList;
    });
  };

  const [reviewData, setReviewData] = useState({
    actualUsage: application.actualUsage as LandCategory,
    landShape: application.reportedShape as LandShape,
    farmMachineDifficulty: application.farmMachineDifficulty ? "해당" : "미입력" as "미입력" | "해당" | "해당없음",
    accessRoadLost: application.aiResult?.accessRoadLost || false,
    waterChannelLost: application.aiResult?.waterChannelLost || false,
    reviewerComment: application.reviewerComment || application.finalReviewOpinion || "o 진출입 여건(교통) : \no 토지 모양 : \no 실제 이용상황 :\no 농기계 진입, 회전 : \no 검토 의견\n - \n\n\n * 잔여지 보상액 : ",
    finalReviewOpinion: application.finalReviewOpinion || "", // 최종 검토 의견 (복수 필지용)
    finalJudgment: application.finalJudgment || (null as unknown as JudgmentResult),
    adminStatus: application.adminStatus || ("접수완료" as AdminStatus),
    assigneeId: application.adminName ? assigneeList.find(a => a.name === application.adminName)?.id || "" : "",
    isCommitteeCase: application.isCommitteeCase ?? false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showAnalysisFlow, setShowAnalysisFlow] = useState(false);
  const [showCompleteAlert, setShowCompleteAlert] = useState(false);
  const [pendingJudgmentState, setPendingJudgmentState] = useState<{ judgment: "보상" | "기각"; isCommittee: boolean } | null>(null);
  const [committeeResultErrors, setCommitteeResultErrors] = useState<boolean[]>([]);
  const { toast } = useToast();
  
  const [isLockedAfterSave, setIsLockedAfterSave] = useState(false);

  // 진행상황: 담당자가 수동으로 설정 (접수완료 / 담당자검토중 / 담당자검토완료)
  const toThreeStateStatus = (status: AdminStatus): "접수완료" | "담당자검토중" | "담당자검토완료" => {
    if (status === "접수완료") return "접수완료";
    if (status === "담당자검토완료" || status === "심의위원회검토완료" || status === "심사완료") return "담당자검토완료";
    if (status === "담당자검토중" || status === "심의위원회회부" || status === "심의위원회검토중") return "담당자검토중";
    return "접수완료";
  };
  const [progressStatus, setProgressStatus] = useState<"접수완료" | "담당자검토중" | "담당자검토완료">(
    toThreeStateStatus(application.adminStatus)
  );

  // 최종 판정(보상/기각) 저장 완료 후 또는 이미 완료된 케이스는 편집 불가
  const isViewOnly =
    isLockedAfterSave ||
    application.adminStatus === "심사완료" ||
    application.adminStatus === "담당자검토완료" ||
    (application.adminStatus === "심의위원회검토완료" && !!application.finalJudgment && application.finalJudgment !== "심의위원회 이관");
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  
  // 필지별 분석 진행 상태: 'pending' | 'analyzing' | 'done'
  const [landAnalysisStatus, setLandAnalysisStatus] = useState<Record<string, 'pending' | 'analyzing' | 'done'>>({});
  
  // 필지별 분석 단계 상세 (0: 대기, 1: 형상지수 계산, 2: 면적 비율 분석, 3: 법적 기준 검토, 4: 종합 판정, 5: 완료)
  const [landAnalysisStep, setLandAnalysisStep] = useState<Record<string, number>>({});
  
  // 관리자용 AI 판독 추가 옵션 (현장 상황) - 필지별 관리
  const [adminAIOptionsPerLand, setAdminAIOptionsPerLand] = useState<Record<string, {
    accessRoadLost: boolean;
    waterChannelLost: boolean;
    farmMachineDifficulty: boolean;
    farmMachineRotationDifficulty: boolean;
    livestockBuildingUnusable: boolean;
    adjacentSameOwnerLand: boolean;
  }>>({});

  // 필지별 옵션 업데이트 헬퍼
  const updateLandOption = (landId: string, option: string, value: boolean) => {
    setAdminAIOptionsPerLand(prev => ({
      ...prev,
      [landId]: {
        accessRoadLost: prev[landId]?.accessRoadLost || false,
        waterChannelLost: prev[landId]?.waterChannelLost || false,
        farmMachineDifficulty: prev[landId]?.farmMachineDifficulty || false,
        farmMachineRotationDifficulty: prev[landId]?.farmMachineRotationDifficulty || false,
        livestockBuildingUnusable: prev[landId]?.livestockBuildingUnusable || false,
        adjacentSameOwnerLand: prev[landId]?.adjacentSameOwnerLand || false,
        [option]: value
      }
    }));
  };
  
  // 필지별 현재 활용 지목 상태
  const [adminCurrentUsagePerLand, setAdminCurrentUsagePerLand] = useState<Record<string, string>>({});
  
  // 필지별 건축물 용도 상태
  const [adminLandSubTypePerLand, setAdminLandSubTypePerLand] = useState<Record<string, string>>({});
  
  // 필지별 토지 모양 상태
  const [adminLandShapePerLand, setAdminLandShapePerLand] = useState<Record<string, string>>({});
  
  // AI 결과 뷰 모드: "citizen" (민원인 신청 결과) | "admin" (관리자 재판독 결과)
  const [aiResultViewMode, setAiResultViewMode] = useState<"citizen" | "admin">("citizen");
  
  // 상세 판독 결과 확장 패널 상태
  const [isDetailPanelExpanded, setIsDetailPanelExpanded] = useState(false);
  const [expandedLandIndex, setExpandedLandIndex] = useState<number | null>(null);
  
  // 관리자 재판독 결과 (별도 저장)
  const [adminLandAIResults, setAdminLandAIResults] = useState<Record<string, {
    provisionalJudgment: string;
    landTypePath: string;
    accessRoadLost: boolean;
    waterChannelLost: boolean;
    farmMachineDifficulty: boolean;
    confidence: number;
    analysisDate: string;
    reason?: string;
    adminOptions: typeof adminAIOptions; // 관리자가 선택한 옵션 기록
    adminCurrentUsage?: string;  // 담당자가 선택한 현재 활용지목
    adminLandSubType?: string;   // 담당자가 선택한 건축물 용도
    shapeIndexChange?: number; // 형상지수 변화
    criteriaChecks?: Array<{ criteriaName: string; criteriaDescription?: string; isMet: boolean; autoDetected?: boolean }>; // 판정 기준
    judgmentRationale?: { // 판단 근거 설명
      summary: string;
      legalBasis: string;
      appliedCriteria: string[];
      detailedExplanation: string;
      manualCheckItems?: string[];
    };
    unifiedParcelAnalysis?: {
      conditions: { sameOwner: boolean; continuous: boolean; sameUsage: boolean };
    };
  }>>({});
  

  
  // 민원인이 신청한 필지 ID 목록 (application에서 가져옴, 읽기 전용)
  const citizenSelectedLandIds = allLands.map(l => l.id);
  
  // 담당자가 선택한 필지 ID 목록 (수정 가능, 초기값: 민원인 신청 필지와 동일)
  const [adminCheckedLandIds, setAdminCheckedLandIds] = useState<string[]>(() => allLands.map(l => l.id));
  
  // 기존 호환성을 위한 adminAIOptions (선택된 필지들의 옵션 합산)
  const adminAIOptions = {
    accessRoadLost: adminCheckedLandIds.some(id => adminAIOptionsPerLand[id]?.accessRoadLost),
    waterChannelLost: adminCheckedLandIds.some(id => adminAIOptionsPerLand[id]?.waterChannelLost),
    farmMachineDifficulty: adminCheckedLandIds.some(id => adminAIOptionsPerLand[id]?.farmMachineDifficulty),
    farmMachineRotationDifficulty: adminCheckedLandIds.some(id => adminAIOptionsPerLand[id]?.farmMachineRotationDifficulty),
    livestockBuildingUnusable: adminCheckedLandIds.some(id => adminAIOptionsPerLand[id]?.livestockBuildingUnusable),
    adjacentSameOwnerLand: adminCheckedLandIds.some(id => adminAIOptionsPerLand[id]?.adjacentSameOwnerLand),
  };
  
  // 현재 탭에 따른 선택된 필지 ID (지도 표시용)
  const currentSelectedLandIds = aiResultViewMode === "citizen" ? citizenSelectedLandIds : adminCheckedLandIds;
  
  // 담당자 탭 체크박스 선택 변경 핸들러
  const handleAdminCheckLand = (landId: string, checked: boolean) => {
    if (checked) {
      setAdminCheckedLandIds(prev => [...prev, landId]);
    } else {
      setAdminCheckedLandIds(prev => prev.filter(id => id !== landId));
    }
  };
  
  // 담당자 탭 전체 선택 핸들러
  const handleAdminCheckAll = (checked: boolean) => {
    if (checked) {
      setAdminCheckedLandIds(allLands.map(l => l.id));
    } else {
      setAdminCheckedLandIds([]);
    }
  };
  
  // 기존 호환용 (일부 로직에서 사용)
  const checkedLandIds = aiResultViewMode === "admin" ? adminCheckedLandIds : citizenSelectedLandIds;
  
  // 담당자 탭 필터 토글 핸들러
  const handleLandCheckToggle = (landId: string) => {
    setAdminCheckedLandIds(prev => 
      prev.includes(landId) 
        ? prev.filter(id => id !== landId)
        : [...prev, landId]
    );
  };
  
  // 필지별 AI 판독 결과 상태 (landId -> AIResult) - 개별 필지 분석만 지원
  const [landAIResults, setLandAIResults] = useState<Record<string, {
    provisionalJudgment: string;
    landTypePath: string;
    accessRoadLost: boolean;
    waterChannelLost: boolean;
    confidence: number;
    analysisDate: string;
    reason?: string; // 판정 사유
    shapeIndexChange?: number; // 형상지수 변화
    criteriaChecks?: Array<{ criteriaName: string; isMet: boolean }>; // 판정 기준
    judgmentRationale?: { // 판단 근거 설명
      summary: string;
      legalBasis: string;
      appliedCriteria: string[];
      detailedExplanation: string;
      manualCheckItems?: string[];
    };
  }>>(() => {
    // 기존 application.aiResult가 있으면 초기값으로 설정
    if (application.aiResult) {
      const initial: Record<string, {
        provisionalJudgment: string;
        landTypePath: string;
        accessRoadLost: boolean;
        waterChannelLost: boolean;
        confidence: number;
        analysisDate: string;
        reason?: string;
        shapeIndexChange?: number;
        criteriaChecks?: Array<{ criteriaName: string; isMet: boolean }>;
        judgmentRationale?: {
          summary: string;
          legalBasis: string;
          appliedCriteria: string[];
          detailedExplanation: string;
          manualCheckItems?: string[];
        };
      }> = {};
      
      // landJudgments가 있으면 필지별 판정 정보 사용
      if (application.aiResult.landJudgments && application.aiResult.landJudgments.length > 0) {
        application.aiResult.landJudgments.forEach(lj => {
          const land = allLands.find(l => l.id === lj.landId);
          if (land) {
            initial[lj.landId] = {
              provisionalJudgment: lj.judgment,
              landTypePath: land.landType,
              accessRoadLost: application.aiResult!.accessRoadLost,
              waterChannelLost: application.aiResult!.waterChannelLost,
              confidence: 0.9,
              analysisDate: new Date().toISOString().split("T")[0],
              reason: lj.reason,
              shapeIndexChange: application.aiResult!.shapeIndexChange,
              criteriaChecks: application.aiResult!.criteriaChecks?.map(c => ({ criteriaName: c.criteriaName, isMet: c.isMet })),
              judgmentRationale: application.aiResult!.judgmentRationale,
            };
          }
        });
      } else {
        // 개별 필지 분석
        allLands.forEach(land => {
          initial[land.id] = {
            provisionalJudgment: application.aiResult!.provisionalJudgment,
            landTypePath: land.landType,
            accessRoadLost: application.aiResult!.accessRoadLost,
            waterChannelLost: application.aiResult!.waterChannelLost,
            confidence: 0.9,
            analysisDate: new Date().toISOString().split("T")[0],
            shapeIndexChange: application.aiResult!.shapeIndexChange,
            criteriaChecks: application.aiResult!.criteriaChecks?.map(c => ({ criteriaName: c.criteriaName, isMet: c.isMet })),
            judgmentRationale: application.aiResult!.judgmentRationale,
          };
        });
      }
      return initial;
    }
    return {};
  });
  
  // 현재 선택된 필지의 AI 결과
  const currentAIResult = landAIResults[allLands[selectedLandIndex]?.id] || null;

// ===== 대상 토지 상세 분석 (중앙토지수용위원회 기준) =====
  
  // 편입 전 면적 기준 (㎡) - 초과 시 토지유형별 경로, 이하 시 소규모 토지 경로
  const AREA_THRESHOLD = {
    residential: { detached: 90, apartment: 330, commercial: 150, industrial: 330 },
    agricultural: 330,
    forest: 330,
    other: 330,
  };
  
  // 토지 유형별 면적 기준 (㎡)
  const getAreaCriteria = (land: typeof allLands[0], landData?: LandSpecificData, adminLandSubType?: string) => {
    const landType = land.landType;
    // 담당자가 선택한 건축물 용도 우선 적용, 없으면 신청 시 입력된 값 사용
    const subType = adminLandSubType || landData?.landSubType || "";
    const remainingRatio = land.remainingRatio;
    
    if (landType === "택지") {
      // 택지 경로: 세부 유형별 기준
      switch (subType) {
        case "residential-detached": // 단독·다세대주택
          return { base: 90, relaxed: remainingRatio <= 25 ? 112.5 : 90 }; // 25% 이하 시 1.25배 완화
        case "residential-apartment": // 아파트 (1,000㎡ 이하)
          return { base: 330, relaxed: remainingRatio <= 25 ? 412.5 : 330 };
        case "commercial": // 상업용
          return { base: 150, relaxed: remainingRatio <= 25 ? 187.5 : 150 };
        case "industrial": // 공업용
          return { base: 330, relaxed: remainingRatio <= 25 ? 412.5 : 330 };
        default:
          return { base: 330, relaxed: remainingRatio <= 25 ? 412.5 : 330 };
      }
    } else if (landType === "농지") {
      // 농지 경로: 기본 330㎡, 잔여비율 25% 이하 시 495㎡ (완화)
      return { base: 330, relaxed: remainingRatio <= 25 ? 495 : 330 };
    } else if (landType === "산지") {
      // 산지 경로: 기본 330㎡, 잔여비율 25% 이하 시 495㎡ (완화)
      return { base: 330, relaxed: remainingRatio <= 25 ? 495 : 330 };
    } else {
      // 그 밖의 토지: 택지/농지/산지 중 유사 용도 기준 적용, 기본 330㎡
      return { base: 330, relaxed: remainingRatio <= 25 ? 412.5 : 330 };
    }
  };
  
  // 소규모 토지 여부 판단 (편입 전 면적 330㎡ 이하 또는 잔여비율 50% 이하)
  const isSmallScaleLand = (land: typeof allLands[0]) => {
    return land.originalArea <= 330 || land.remainingRatio <= 50;
  };
  
  // 형상 기준 충족 여부 (폭 기준)
  const checkShapeCriteria = (land: typeof allLands[0]) => {
    const shape = land.remainingShape;
    // 사각형 폭: 5m 이하, 삼각형 한 변: 11m 이하
    // 형상지수 변화로 간접 판단 (실제 현장 데이터 없음)
    const shapeIndexChange = land.remainingShapeIndex - land.originalShapeIndex;
    
    if (shape === "삼각형" || shape === "역삼각형") {
      return { met: shapeIndexChange >= 0.5, description: "삼각형 형상 (한 변 11m 이하 기준)" };
    } else if (shape === "부정형" || shape === "자루형") {
      return { met: shapeIndexChange >= 0.3, description: "부정형 형상 (폭 5m 이하 기준)" };
    } else {
      return { met: shapeIndexChange >= 0.8, description: "형상 변경 (사각형 폭 5m 이하 기준)" };
    }
  };
  
  // 개별 필지 AI 분석 (관리자 옵션 반영)
  const analyzeSingleLand = (
    land: typeof allLands[0],
    landData?: LandSpecificData,
    adminOptions?: typeof adminAIOptions,
    adminCurrentUsage?: string, // 담당자가 선택한 현재 활용지목
    adminLandSubType?: string   // 담당자가 선택한 건축물 용도
  ) => {
    // 담당자가 선택한 현재 활용지목 우선 적용, 없으면 원래 지목 사용
    const effectiveLandType = adminCurrentUsage 
      ? (adminCurrentUsage === "대" ? "택지" : adminCurrentUsage === "전" || adminCurrentUsage === "답" ? "농지" : adminCurrentUsage === "임" ? "임야" : "기타")
      : land.landType;
    
    const criteria = getAreaCriteria(land, landData, adminLandSubType);
    const isSmall = isSmallScaleLand(land);
    const shapeCriteria = checkShapeCriteria(land);
    
    const criteriaChecks: Array<{ name: string; met: boolean; description: string }> = [];
    let judgment: "수용가능" | "수용불가" = "수용불가";
    let reasons: string[] = [];
    
    // 1. 면적 기준 미달 여부
    const effectiveLimit = criteria.relaxed;
    const areaCheckMet = land.remainingArea <= effectiveLimit;
    criteriaChecks.push({
      name: "면적 기준",
      met: areaCheckMet,
      description: `잔여 ${land.remainingArea}㎡ ${areaCheckMet ? "≤" : ">"} ${effectiveLimit}㎡`
    });
    
    if (effectiveLandType === "택지") {
      // 택지 경로 + 관리자 옵션 반영
      // 2. 접면도로 상태 변경
      const roadLost = adminOptions?.accessRoadLost || landData?.accessRoadLost || land.remainingRatio < 30;
      criteriaChecks.push({
        name: "접면도로 상태",
        met: roadLost,
        description: roadLost ? "접면도로 상실로 건축 불가" + (adminOptions?.accessRoadLost ? " (관리자 확인)" : "") : "접면도로 유지"
      });
      
      // 3. 형상 부정형 변경
      criteriaChecks.push({
        name: "형상 변경",
        met: shapeCriteria.met,
        description: shapeCriteria.description
      });
      
      // \uD558\uB098\uB77C\uB3C4 \uD574\uB2F9 \uC2DC \u2192 \uCDA9\uC871(\uB9E4\uC218), \uC804\uCCB4 \uBBF8\uD574\uB2F9 \uC2DC \u2192 \uBBF8\uCDA9\uC871(\uAE30\uAC01)
      if (areaCheckMet || roadLost || shapeCriteria.met) {
        judgment = "\uC218\uC6A9\uAC00\uB2A5";
        if (areaCheckMet) reasons.push("\uBA74\uC801 \uAE30\uC900 \uCDA9\uC871");
        if (roadLost) reasons.push("\uC811\uBA74\uB3C4\uB85C \uC0C1\uC2E4" + (adminOptions?.accessRoadLost ? " (\uAD00\uB9AC\uC790 \uD655\uC778)" : ""));
        if (shapeCriteria.met) reasons.push("\uD615\uC0C1 \uBD80\uC815\uD615 \uBCC0\uACBD");
      } else {
        judgment = "\uC218\uC6A9\uBD88\uAC00";
        reasons.push("\uBA74\uC801 \uAE30\uC900 \uBBF8\uCDA9\uC871");
      }
      
    } else if (effectiveLandType === "\uB18D\uC9C0") {
      // \uB18D\uC9C0 \uACBD\uB85C + \uAD00\uB9AC\uC790 \uC635\uC158 \uBC18\uC601
      // 2. \uC811\uBA74 \uB3C4\uB85C/\uC218\uB85C \uC0C1\uC2E4 \uC5EC\uBD80
      const waterLost = adminOptions?.waterChannelLost || landData?.waterChannelLost || false;
      const roadLost = adminOptions?.accessRoadLost || landData?.accessRoadLost || false;
      criteriaChecks.push({
        name: "\uB3C4\uB85C/\uC218\uB85C \uC0C1\uC2E4",
        met: waterLost || roadLost,
        description: waterLost 
          ? "\uAD00\uAC1C\uC218\uB85C \uC0C1\uC2E4\uB85C \uB18D\uC9C0 \uD65C\uC6A9 \uBD88\uAC00" + (adminOptions?.waterChannelLost ? " (\uAD00\uB9AC\uC790 \uD655\uC778)" : "")
          : (roadLost ? "\uC811\uBA74\uB3C4\uB85C \uC0C1\uC2E4" + (adminOptions?.accessRoadLost ? " (\uAD00\uB9AC\uC790 \uD655\uC778)" : "") : "\uB3C4\uB85C/\uC218\uB85C \uC720\uC9C0")
      });
      
      // 3. \uB18D\uAE30\uACC4 \uD68C\uC804 \uACE4\uB780, \uD615\uC0C1 \uBD80\uC815\uD615 \uBCC0\uACBD
      const farmDifficulty = adminOptions?.farmMachineDifficulty || landData?.farmMachineDifficulty || land.remainingArea < 200;
      criteriaChecks.push({
        name: "농기계 회전",
        met: farmDifficulty,
        description: farmDifficulty ? "농기계 회전 곤란" + (adminOptions?.farmMachineDifficulty ? " (관리자 확인)" : "") : "농기계 사용 가능"
      });
      
      criteriaChecks.push({
        name: "형상 변경",
        met: shapeCriteria.met,
        description: shapeCriteria.description
      });
      
      if (areaCheckMet || waterLost || roadLost || farmDifficulty || shapeCriteria.met) {
        judgment = "수용가능";
        if (areaCheckMet) reasons.push("면적 기준 충족");
        if (waterLost) reasons.push("관개수로 상실" + (adminOptions?.waterChannelLost ? " (관리자 확인)" : ""));
        if (roadLost) reasons.push("접면도로 상실" + (adminOptions?.accessRoadLost ? " (관리자 확인)" : ""));
        if (farmDifficulty) reasons.push("농기계 회전 곤란" + (adminOptions?.farmMachineDifficulty ? " (관리자 확인)" : ""));
        if (shapeCriteria.met) reasons.push("형상 부정형 변경");
      } else {
        judgment = "수용불가";
        reasons.push("모든 기준 미충족");
      }
      
    } else if (land.landType === "\uC0B0\uC9C0") {
      // \uC0B0\uC9C0 \uACBD\uB85C + \uAD00\uB9AC\uC790 \uC635\uC158 \uBC18\uC601
      // 2. \uC811\uBA74 \uB3C4\uB85C \uC0C1\uC2E4 \uC5EC\uBD80
      const roadLost = adminOptions?.accessRoadLost || landData?.accessRoadLost || land.remainingRatio < 25;
      criteriaChecks.push({
        name: "\uC811\uBA74\uB3C4\uB85C \uC0C1\uC2E4",
        met: roadLost,
        description: roadLost ? "\uB3C4\uB85C \uC811\uD558\uC9C0 \uC54A\uC544 \uC811\uADFC \uBD88\uAC00" + (adminOptions?.accessRoadLost ? " (\uAD00\uB9AC\uC790 \uD655\uC778)" : "") : "\uC811\uBA74\uB3C4\uB85C \uC720\uC9C0"
      });
      
      if (areaCheckMet || roadLost) {
        judgment = "\uC218\uC6A9\uAC00\uB2A5";
        if (areaCheckMet) reasons.push("\uBA74\uC801 \uAE30\uC900 \uCDA9\uC871");
        if (roadLost) reasons.push("\uC811\uBA74\uB3C4\uB85C \uC0C1\uC2E4" + (adminOptions?.accessRoadLost ? " (\uAD00\uB9AC\uC790 \uD655\uC778)" : ""));
      } else {
        judgment = "\uC218\uC6A9\uBD88\uAC00";
        reasons.push("\uBAA8\uB4E0 \uAE30\uC900 \uBBF8\uCDA9\uC871");
      }
      
    } else {
      // 그 밖의 토지 + 관리자 옵션 반영
      // 종래 목적 사용 곤란 여부 (위치, 형상, 접근 상태 고려)
      const usageDifficulty = adminOptions?.accessRoadLost || adminOptions?.farmMachineDifficulty || land.remainingRatio < 40 || shapeCriteria.met;
      criteriaChecks.push({
        name: "종래 사용 곤란",
        met: usageDifficulty,
        description: usageDifficulty ? "위치/형상/접근 상태로 종래 사용 곤란" : "종래 사용 가능"
      });
      
      if (areaCheckMet || usageDifficulty) {
        judgment = "수용가능";
        if (areaCheckMet) reasons.push("면적 기준 충족");
        if (usageDifficulty) reasons.push("종래 사용 곤란");
      } else {
        judgment = "수용불가";
        reasons.push("모든 기준 미충족");
      }
    }
    
    // 소규모 토지 추가 검토
    if (isSmall) {
      criteriaChecks.push({
        name: "소규모 토지",
        met: true,
        description: `편입전 ${land.originalArea}㎡ 또는 잔여비율 ${land.remainingRatio}% (소규모 해당)`
      });
      if (judgment === "수용불가") {
        judgment = "수용불가";
        reasons.push("소규모 토지로 심의위원회 검토 필요");
      }
    }
    
    return {
      judgment,
      criteriaChecks,
      reasons,
      landTypePath: land.landType,
      accessRoadLost: landData?.accessRoadLost || land.remainingRatio < 30,
      waterChannelLost: landData?.waterChannelLost || false,
      confidence: 0.85 + Math.random() * 0.1,
    };
  };

  // AI 판독 실행 핸들러 (2단계 프로세스) - 담당자가 선택한 필지만 분석
  const handleRunAIAnalysis = () => {
    // 선택된 필지가 없으면 알림
    if (adminCheckedLandIds.length === 0) {
      alert("AI 판독할 필지를 선택해주세요.");
      return;
    }
    
    setIsAIAnalyzing(true);
    setAdminLandAIResults({});
    
    // 필지별 분석 상태 초기화 (모두 pending)
    const initialStatus: Record<string, 'pending' | 'analyzing' | 'done'> = {};
    const initialStep: Record<string, number> = {};
    adminCheckedLandIds.forEach(id => {
      initialStatus[id] = 'pending';
      initialStep[id] = 0;
    });
    setLandAnalysisStatus(initialStatus);
    setLandAnalysisStep(initialStep);
    
    // 분석 진행 (최대 5초 이내 완료 보장)
    const runAnalysis = async () => {
      const totalLands = adminCheckedLandIds.length;
      const stepDelay = Math.min(80, Math.floor(800 / totalLands)); // 필지 수에 따라 동적 조절
      
      // 모든 필지를 병렬로 분석
      const analysisPromises = adminCheckedLandIds.map(async (landId) => {
        setLandAnalysisStatus(prev => ({ ...prev, [landId]: 'analyzing' }));
        
        for (let step = 1; step <= 5; step++) {
          setLandAnalysisStep(prev => ({ ...prev, [landId]: step }));
          await new Promise(resolve => setTimeout(resolve, stepDelay));
        }
        
        setLandAnalysisStatus(prev => ({ ...prev, [landId]: 'done' }));
      });
      
      await Promise.all(analysisPromises);
      
      try {
        // 분석 결과 생성
        const newResults: typeof adminLandAIResults = {};
        const selectedLands = allLands.filter(l => adminCheckedLandIds.includes(l.id));
        
        selectedLands.forEach((land) => {
          try {
            const landId = land.id;
            const landIndex = allLands.findIndex(l => l.id === landId);
            const landData = application.landDataList?.[landIndex];
            
            const landOptions = adminAIOptionsPerLand[landId] || { accessRoadLost: false, waterChannelLost: false, farmMachineDifficulty: false, farmMachineRotationDifficulty: false, livestockBuildingUnusable: false, adjacentSameOwnerLand: false };
            const adminCurrentUsage = adminCurrentUsagePerLand[landId];
            const adminLandSubType = adminLandSubTypePerLand[landId];
            const analysis = analyzeSingleLand(land, landData, landOptions, adminCurrentUsage, adminLandSubType);
            
            const finalJudgment = analysis.judgment;
            
            const judgmentRationale = {
              summary: `${land.landType} 잔여면적 ${land.remainingArea.toLocaleString()}㎡(잔여비율 ${land.remainingRatio}%), ${analysis.reasons.join(", ")}으로 「${finalJudgment}」 판정`,
              legalBasis: "「공익사업을 위한 토지 등의 취득 및 보상에 관한 법률」 제74조 및 동법 시행규칙 제34조",
              appliedCriteria: analysis.criteriaChecks.map(check => 
                `${check.name}: ${check.description} ${check.met ? "✓" : "✗"}`
              ),
              detailedExplanation: `[\uD544\uC9C0 \uC815\uBCF4]\n\uC8FC\uC18C: ${land.address}\n\uC9C0\uBAA9: ${land.landType} (${land.landCategory})\n\uD3B8\uC785 \uC804 \uBA74\uC801: ${land.originalArea.toLocaleString()}\u33A1\n\uC794\uC5EC \uBA74\uC801: ${land.remainingArea.toLocaleString()}\u33A1 (${land.remainingRatio}%)\n\n[\uBD84\uC11D \uACB0\uACFC]\n${analysis.reasons.map(r => `\u2022 ${r}`).join("\n")}`,
              manualCheckItems: analysis.criteriaChecks.filter(c => !c.met).map(c => `${c.name} 재확인 필요`),
            };
            
            const criteriaChecks = analysis.criteriaChecks.map(check => ({
              criteriaName: check.name,
              criteriaDescription: check.description,
              isMet: check.met,
              autoDetected: true,
            }));
            
            newResults[landId] = {
              provisionalJudgment: finalJudgment,
              landTypePath: analysis.landTypePath,
              accessRoadLost: analysis.accessRoadLost,
              waterChannelLost: analysis.waterChannelLost,
              farmMachineDifficulty: false,
              confidence: analysis.confidence,
              analysisDate: new Date().toISOString().split("T")[0],
              reason: analysis.reasons.join(", "),
              adminCurrentUsage: adminCurrentUsage,
              adminLandSubType: adminLandSubType,
              adminOptions: adminAIOptions,
              judgmentRationale: judgmentRationale,
              criteriaChecks: criteriaChecks,
              shapeIndexChange: (land.remainingRatio < 50) ? 1.5 + Math.random() * 1.5 : 0.5 + Math.random() * 0.5,
            };
          } catch (landError) {
            // 필지 분석 오류 처리
          }
        });
        
        const adminResults: typeof adminLandAIResults = {};
        Object.entries(newResults).forEach(([landId, result]) => {
          adminResults[landId] = {
            ...result,
            farmMachineDifficulty: adminAIOptions.farmMachineDifficulty,
            adminOptions: { ...adminAIOptions }
          };
        });
        
        // 기존 결과에 새 결과를 누적 (같은 필지는 최신 결과로 덮어씀)
        setAdminLandAIResults(prev => ({ ...prev, ...adminResults }));
        setAiResultViewMode("admin");
        setIsAIAnalyzing(false);
      } catch (error) {
        // 분석 결과 생성 오류 처리
        setIsAIAnalyzing(false);
      }
    };
    
    runAnalysis().catch(() => {
      setIsAIAnalyzing(false);
    });
  };
  
  
  
  // 판독 결과 초기화 (관리자 재판독 결과만)
  const handleResetAdminAIResults = () => {
    setAdminLandAIResults({});
    setAdminAIOptionsPerLand({});
    setAiResultViewMode("citizen");
  };
  
  // 필지 포함/제외 상태 (민원인 소유 확인용)
  const [excludedLands, setExcludedLands] = useState<Set<string>>(new Set());
  
  // PDF 미리보기 상태
  const [selectedAttachment, setSelectedAttachment] = useState<{ name: string; url: string } | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // 민원인 입력 vs AI 분석 비교 모달
  const [compareModalItem, setCompareModalItem] = useState<{
    key: string;
    label: string;
    citizenValue: string;
    aiValue: string;
    isMismatch: boolean;
    procedures: string[];
  } | null>(null);

  // AI 분석결과 상세보기 모달
  const [showCitizenAIModal, setShowCitizenAIModal] = useState(false);
  const [showAdminAIModal, setShowAdminAIModal] = useState(false);

  // 페이지네이션
  const [recordsPage, setRecordsPage] = useState(1);
  const recordsItemsPerPage = 12;
  
  // 첨부파일 클릭 핸들러
  const handleAttachmentClick = (fileName: string) => {
    // 실제 환경에서는 서버에서 파일 URL을 받아옴
    const fileUrl = `/attachments/${fileName}`;
    setSelectedAttachment({ name: fileName, url: fileUrl });
    setShowPdfPreview(true);
  };
  
  // 필지 포함/제외 토글
  const toggleLandInclusion = (landId: string) => {
    setExcludedLands(prev => {
      const newSet = new Set(prev);
      if (newSet.has(landId)) {
        newSet.delete(landId);
      } else {
        newSet.add(landId);
      }
      return newSet;
    });
  };
  
  // 포함된 필지만 필터링
  const includedLands = allLands.filter(land => !excludedLands.has(land.id));
  const includedLandsArea = includedLands.reduce((sum, l) => sum + l.remainingArea, 0);
  
  // AI 분석 결과
  const aiResult = application.aiResult;

  const doSave = () => {
    setIsSaving(true);

    const selectedAssignee = assigneeList.find(a => a.id === reviewData.assigneeId);

    // 필지별 판정 결과 생성 (심의서 연동용)
    const landJudgmentsForReview = allLands.map((land, idx) => {
      const review = landReviewDataList[idx];
      const lj = review?.landJudgment;
      const cr = review?.committeeResult;

      let judgment = "분석중";
      let purchaseDecision: "O" | "X" | "-" = "-";

      if (lj === "보상") { judgment = "보상"; purchaseDecision = "O"; }
      else if (lj === "기각") { judgment = "기각"; purchaseDecision = "X"; }
      else if (lj === "심의위원회 이관") {
        if (cr === "보상") { judgment = "보상"; purchaseDecision = "O"; }
        else if (cr === "기각") { judgment = "기각"; purchaseDecision = "X"; }
        else { judgment = "심의위원회 이관"; purchaseDecision = "-"; }
      }

      return {
        landId: land.id,
        landIndex: idx,
        address: land.address,
        landType: land.landType,
        landCategory: land.landCategory,
        originalArea: land.originalArea,
        remainingArea: land.remainingArea,
        remainingRatio: land.remainingRatio,
        judgment,
        purchaseDecision,
      };
    });

    // 심의위원회 결과 finalJudgment 도출 (per-parcel 참조용)
    const hasCommittee = landReviewDataList.some(r => r.landJudgment === "심의위원회 이관");
    let derivedFinalJudgment = reviewData.finalJudgment;
    if (hasCommittee) {
      const committeeParcel = landReviewDataList.find(r => r.landJudgment === "심의위원회 이관");
      if (committeeParcel?.committeeResult) derivedFinalJudgment = committeeParcel.committeeResult as JudgmentResult;
      else derivedFinalJudgment = "심의위원회 이관" as unknown as JudgmentResult;
    } else if (landReviewDataList.length === 1 && landReviewDataList[0].landJudgment) {
      derivedFinalJudgment = (landReviewDataList[0].landJudgment ?? null) as JudgmentResult;
    }

    const updatedApplication: Application = {
      ...application,
      actualUsage: reviewData.actualUsage,
      reportedShape: reviewData.landShape,
      farmMachineDifficulty: reviewData.farmMachineDifficulty === "해당",
      reviewerComment: reviewData.reviewerComment,
      finalJudgment: derivedFinalJudgment,
      adminStatus: progressStatus,
      status: progressStatus === "담당자검토완료" ? "처리완료" : progressStatus === "담당자검토중" ? "검토중" : application.status,
      adminName: selectedAssignee?.name || application.adminName,
      statusUpdatedAt: new Date().toISOString().split("T")[0],
      isCommitteeCase: hasCommittee,
      landJudgmentsForReview,
    };

    // 저장 완료 토스트 메시지 즉시 노출 (3초 후 사라짐)
    toast({
      title: "저장 완료",
      description: "저장이 완료되었습니다.",
      duration: 3000,
    });

    const shouldLockAfterSave = progressStatus === "담당자검토완료";

    setTimeout(() => {
      setIsSaving(false);
      clearDirty();
      if (shouldLockAfterSave) setIsLockedAfterSave(true);
      onSave(updatedApplication);
    }, 1000);
  };

  // 담당자 검토 완료 선택 후 저장 시 컨펌
  const handleSave = () => {
    // 심의위원회 검토완료인데 결과 미선택 필지 검증
    const errors = landReviewDataList.map(
      (r) => r.landJudgment === "심의위원회 이관" && r.committeeStatus === "검토완료" && !r.committeeResult
    );
    if (errors.some(Boolean)) {
      setCommitteeResultErrors(errors);
      const firstErrorIdx = errors.findIndex(Boolean);
      if (firstErrorIdx !== -1) setSelectedLandIndex(firstErrorIdx);
      return;
    }
    setCommitteeResultErrors([]);

    if (progressStatus === "담당자검토완료" && !isViewOnly) {
      setShowCompleteAlert(true);
    } else {
      doSave();
    }
  };

  // handleSave를 ref에 저장하여 이벤트 리스너가 항상 최신 함수 참조
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  // 외부에서 저장 이벤트 수신
  useEffect(() => {
    const handleExternalSave = () => {
      handleSaveRef.current();
    };
    
    window.addEventListener('application-detail-save', handleExternalSave);
    return () => {
      window.removeEventListener('application-detail-save', handleExternalSave);
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* 신청 상세 타이틀 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">신청 상세</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => onOpenReview?.(application)}>
            <FileText className="mr-2 h-4 w-4" />
            심의서 작성
          </Button>
        </div>
      </div>

      {/* Section 01. 신청인 정보 */}
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">신청인 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div>
              <span className="text-[16px] text-muted-foreground">접수번호</span>
              <p className="font-medium">2026-05-001</p>
            </div>
            <div>
              <span className="text-[16px] text-muted-foreground">신청인</span>
              <p className="font-medium">{application.applicantName}</p>
            </div>
            <div>
              <span className="text-[16px] text-muted-foreground">주소</span>
              <p className="font-medium">{application.applicantAddress || "-"}</p>
            </div>
            <div>
              <span className="text-[16px] text-muted-foreground">신청일시</span>
              <p className="font-medium">{application.appliedAt || "2026-05-01"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 02. 필지선택 */}
      <Card className="border-0 shadow-none">
        {/* 필지 선택 컨트롤러 */}
        <CardHeader className="pb-2 bg-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">대상 필지 분석 및 검토</CardTitle>
            {/* 필지 선택 - 강조된 UI */}
            <div className="flex items-center gap-3 bg-blue-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-[16px]">
                  {String.fromCharCode(65 + selectedLandIndex)}
                </div>
                <span className="text-[16px] font-medium text-blue-900">필지 선택</span>
              </div>
              <Select
                value={selectedLandIndex.toString()}
                onValueChange={(value) => {
                  setSelectedLandIndex(parseInt(value));
                }}
              >
                <SelectTrigger className="w-[320px] h-10 bg-white border-blue-300 focus:ring-blue-500 font-medium">
                  <SelectValue placeholder="필지를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {applicationLands.map((land, index) => (
                    <SelectItem key={land.id} value={index.toString()}>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">{String.fromCharCode(65 + index)}</span>
                        <span className="font-medium">{land.address.split(" ").slice(-2).join(" ")}</span>
                        <span className="text-muted-foreground text-xs">| {land.landCategory} | {land.remainingArea.toLocaleString()}㎡</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-blue-300 hover:bg-blue-100"
                  onClick={() => {
                    setSelectedLandIndex(Math.max(0, selectedLandIndex - 1));
                  }}
                  disabled={selectedLandIndex === 0}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-[16px] font-medium text-blue-700 whitespace-nowrap px-1">{selectedLandIndex + 1} / {applicationLands.length}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-blue-300 hover:bg-blue-100"
                  onClick={() => {
                    setSelectedLandIndex(Math.min(applicationLands.length - 1, selectedLandIndex + 1));
                  }}
                  disabled={selectedLandIndex === applicationLands.length - 1}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          {/* 선택된 필지 연결 표시 */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'lab(91.6229 -0.159115 -2.26791)' }}>
            <div className="flex items-center gap-2 bg-blue-100 rounded-full px-3 py-1">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-xs">
                {String.fromCharCode(65 + selectedLandIndex)}
              </span>
              <span className="text-[16px] font-medium text-blue-800">
                {applicationLands[selectedLandIndex]?.address.split(" ").slice(-2).join(" ")}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">아래정보는 선택한 필지에 대한 내용입니다.</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-14">
          {/* 2-1. 신청정보 */}
          <div id="land-info-section" className="space-y-5 scroll-mt-40">
            <h3 className="text-lg font-semibold">신청정보</h3>
            {applicationLands[selectedLandIndex] && (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-[16px]">
                  <tbody className="divide-y">
                    <tr>
                      <td className="bg-muted/50 px-4 py-3 font-medium text-muted-foreground w-32">토지유형</td>
                      <td className="px-4 py-3">{applicationLands[selectedLandIndex].landType || "-"}</td>
                      <td className="bg-muted/50 px-4 py-3 font-medium text-muted-foreground w-32">대상 지번</td>
                      <td className="px-4 py-3">{applicationLands[selectedLandIndex].address}</td>
                    </tr>
                    <tr>
                      <td className="bg-muted/50 px-4 py-3 font-medium text-muted-foreground">잔여면적</td>
                      <td className="px-4 py-3">{applicationLands[selectedLandIndex].remainingArea.toLocaleString()}㎡</td>
                      <td className="bg-muted/50 px-4 py-3 font-medium text-muted-foreground">토지 모양</td>
                      <td className="px-4 py-3">사다리꼴</td>
                    </tr>
                    <tr>
                      <td className="bg-muted/50 px-4 py-3 font-medium text-muted-foreground">실제용도</td>
                      <td className="px-4 py-3">전</td>
                      <td className="bg-muted/50 px-4 py-3 font-medium text-muted-foreground">공부상 지목</td>
                      <td className="px-4 py-3">{landCategories.find(c => c.value === applicationLands[selectedLandIndex].landCategory)?.label || applicationLands[selectedLandIndex].landCategory}</td>
                    </tr>
                    <tr>
                      <td className="bg-muted/50 px-4 py-3 font-medium text-muted-foreground align-top">확인항목</td>
                      <td className="px-4 py-3" colSpan={3}>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">농기계 진입 곤란</Badge>
                          <Badge variant="secondary">접면도로 상실</Badge>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-muted/50 px-4 py-3 font-medium text-muted-foreground">인접 토지 소유</td>
                      <td className="px-4 py-3" colSpan={3}>
                        {application.hasAdjacentLand ? "있음" : "없음"}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-muted/50 px-4 py-3 font-medium text-muted-foreground align-top">신청 사유</td>
                      <td className="px-4 py-3" colSpan={3}>
                        <p className="text-[16px] leading-relaxed">도로 개설로 인해 토지가 분할되어 잔여지의 형상이 불규칙하고, 농기계 진입이 어려워 농업 활용이 곤란합니다. 또한 기존 접면도로가 상실되어 토지 이용에 심각한 제한이 발생하였습니다.</p>
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-muted/50 px-4 py-3 font-medium text-muted-foreground align-top">첨부서류</td>
                      <td className="px-4 py-3" colSpan={3}>
                        <ul className="flex flex-row flex-wrap gap-2">
                          <li
                            onClick={() => handleAttachmentClick("토지대장_용인시_포곡읍_200-1.pdf")}
                            className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                            title="파일 보기"
                          >
                            <span className="text-xs text-foreground">토지대장_용인시_포곡읍_200-1.pdf</span>
                            <Eye className="size-4 shrink-0 text-muted-foreground" />
                          </li>
                          <li
                            onClick={() => handleAttachmentClick("지적도_용인시_포곡읍_200-1.pdf")}
                            className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                            title="파일 보기"
                          >
                            <span className="text-xs text-foreground">지적도_용인시_포곡읍_200-1.pdf</span>
                            <Eye className="size-4 shrink-0 text-muted-foreground" />
                          </li>
                          <li
                            onClick={() => handleAttachmentClick("현장사진_20260501.jpg")}
                            className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                            title="파일 보기"
                          >
                            <span className="text-xs text-foreground">현장사진_20260501.jpg</span>
                            <Eye className="size-4 shrink-0 text-muted-foreground" />
                          </li>
                        </ul>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 민원인이 선택한 옵션 */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">민원인이 선택한 옵션</h3>
              <Button
                variant="outline"
                size="sm"
                className="text-[14px] gap-1.5"
                onClick={() => setShowCitizenAIModal(true)}
              >
                <Eye className="h-3.5 w-3.5" />
                민원인의 분석결과
              </Button>
            </div>
            {(() => {
              const landData = application.landDataList?.[selectedLandIndex];
              const ai = application.aiResult;
              const land = applicationLands[selectedLandIndex];

              const b = (val: boolean | null | undefined) =>
                val == null ? "해당없음" : val ? "해당" : "해당없음";

              type ColDef = { label: string; citizenVal: string; aiVal: string; mismatch: boolean };
              const cols: ColDef[] = [
                {
                  label: "실제용도",
                  citizenVal: landData?.currentUsage ?? "-",
                  aiVal: land?.landCategory ?? "-",
                  mismatch: !!(landData?.currentUsage && land?.landCategory && landData.currentUsage !== land.landCategory),
                },
                {
                  label: "인접토지 소유",
                  citizenVal: application.hasAdjacentLand == null ? "해당없음" : application.hasAdjacentLand ? "있음" : "없음",
                  aiVal: "-",
                  mismatch: false,
                },
                {
                  label: "접면도로 상실",
                  citizenVal: b(landData?.accessRoadLost),
                  aiVal: ai ? b(ai.accessRoadLost) : "-",
                  mismatch: !!(ai && landData?.accessRoadLost != null && landData.accessRoadLost !== ai.accessRoadLost),
                },
                {
                  label: "농업용 수로 상실",
                  citizenVal: b(landData?.waterChannelLost),
                  aiVal: ai ? b(ai.waterChannelLost) : "-",
                  mismatch: !!(ai && landData?.waterChannelLost != null && landData.waterChannelLost !== ai.waterChannelLost),
                },
                {
                  label: "농기계\n진입곤란",
                  citizenVal: b(landData?.farmMachineDifficulty),
                  aiVal: ai ? b(ai.farmMachineDifficulty) : "-",
                  mismatch: !!(ai && landData?.farmMachineDifficulty != null && landData.farmMachineDifficulty !== ai.farmMachineDifficulty),
                },
                {
                  label: "농기계\n회전곤란",
                  citizenVal: b(landData?.farmMachineRotationDifficulty),
                  aiVal: "-",
                  mismatch: false,
                },
                {
                  label: "축사부지\n사용불가",
                  citizenVal: b(landData?.livestockBuildingUnusable),
                  aiVal: "-",
                  mismatch: false,
                },
                {
                  label: "진입곤란",
                  citizenVal: b(landData?.entryDifficult),
                  aiVal: ai ? b(ai.isBlindLand) : "-",
                  mismatch: !!(ai && landData?.entryDifficult != null && landData.entryDifficult !== ai.isBlindLand),
                },
                {
                  label: "종래 목적대로\n사용 곤란",
                  citizenVal: b(landData?.cannotUseOriginalPurpose),
                  aiVal: "-",
                  mismatch: false,
                },
              ];

              const rows = [
                { label: "민원인의 판정", getValue: (c: ColDef) => c.citizenVal },
                { label: "AI 판정",       getValue: (c: ColDef) => c.aiVal },
              ];

              return (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-[15px] border-collapse" style={{ minWidth: 860 }}>
                    <thead>
                      <tr className="bg-muted/40 border-b border-border">
                        <th className="px-4 py-2.5 text-left text-[15px] font-medium text-muted-foreground w-28 whitespace-nowrap sticky left-0 bg-muted/40 border-r border-border" />
                        {cols.map(col => (
                          <th
                            key={col.label}
                            className={[
                              "px-3 py-2.5 text-center text-[15px] font-semibold whitespace-pre-line leading-snug border-l border-border/60 min-w-[90px]",
                              col.mismatch ? "text-amber-700 bg-amber-50" : "text-gray-700",
                            ].join(" ")}
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, ri) => (
                        <tr key={row.label} className={ri === 0 ? "border-b border-border/60" : ""}>
                          <td className="px-4 py-2.5 text-[15px] font-semibold text-muted-foreground whitespace-nowrap sticky left-0 bg-white border-r border-border">
                            {row.label}
                          </td>
                          {cols.map(col => {
                            const val = row.getValue(col);
                            return (
                              <td
                                key={col.label}
                                className={[
                                  "text-center px-3 py-2.5 border-l border-border/60 font-medium text-[15px]",
                                  col.mismatch ? "bg-amber-50 text-amber-700" : val === "해당" ? "text-gray-900" : "text-muted-foreground",
                                ].join(" ")}
                              >
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

          {/* AI 분석 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* 왼쪽: AI 분석 */}
            <Card className="border-0 shadow-none sticky top-4">
              <CardHeader className="px-0">
                <CardTitle>AI 분석</CardTitle>
                <CardDescription>
                  민원인 입력값과 AI 분석 결과가 다른 항목은 붉은색으로 표시됩니다. 설정을 확인·수정한 후 재분석을 실행하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-0">
                {/* 지적도 */}
                <div className="space-y-2">
                  <Label className="font-medium">지적도</Label>
                  <div className="h-[460px] rounded-lg overflow-hidden border bg-muted">
                    {applicationLands[selectedLandIndex] && (
                      <LandMap
                        landInfo={applicationLands[selectedLandIndex]}
                        showOverlay={false}
                        interactive={false}
                      />
                    )}
                  </div>
                </div>
                {/* 선택 옵션 + 실행 버튼 */}
                {(() => {
                  const currentLand = applicationLands[selectedLandIndex];
                  if (!currentLand) return null;
                  const landData = application.landDataList?.[selectedLandIndex];
                  const landOpts = adminAIOptionsPerLand[currentLand.id];
                  const citizenUsage = landData?.currentUsage;
                  const citizenShape = landData?.reportedShape;
                  const curUsage = adminCurrentUsagePerLand[currentLand.id] ?? citizenUsage ?? "";
                  const adminResult = adminLandAIResults[currentLand.id];
                  const citizenAIResult = landAIResults[currentLand.id];
                  const effectiveAIResult = adminResult ?? citizenAIResult;
                  const allParcels = externalParcels ?? dummyProcessedParcels;
                  const matchedParcel = allParcels.find(p => p.landInfo.id === currentLand.id);
                  const confirmedCheckItems = matchedParcel?.confirmedAt ? matchedParcel.adminCheckItems : undefined;
                  const confirmedShape = matchedParcel?.confirmedAt ? matchedParcel.landShape : undefined;
                  const curShape = adminLandShapePerLand[currentLand.id] ?? confirmedShape ?? "";
                  return (
                    <>
                      {/* 현재 활용지목 및 토지 형상 */}
                      {(() => {
                        const LAND_TYPE_TO_CAT: Record<string, string> = { "택지": "대", "대지": "대", "농지": "전", "산지": "임", "그밖의토지": "잡" };
                        const aiCategory = effectiveAIResult?.landTypePath ? LAND_TYPE_TO_CAT[effectiveAIResult.landTypePath] : undefined;
                        const aiCategoryLabel = aiCategory
                          ? (landCategories.find(c => c.value === aiCategory)?.label ?? aiCategory)
                          : adminResult?.landTypePath;
                        const citizenUsageLabel = citizenUsage
                          ? (landCategories.find(c => c.value === citizenUsage)?.label ?? citizenUsage)
                          : undefined;
                        return (
                          <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <Label className="text-[16px]">현재 활용지목</Label>
                              <Select
                                value={curUsage}
                                onValueChange={(v) => setAdminCurrentUsagePerLand(prev => ({ ...prev, [currentLand.id]: v }))}
                              >
                                <SelectTrigger className="h-[40px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {landCategories.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex flex-wrap gap-1">
                                {citizenUsageLabel && (
                                  <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium shrink-0 whitespace-nowrap bg-blue-50 border-blue-200 text-blue-700">
                                    민원인 선택: {citizenUsageLabel}
                                  </span>
                                )}
                                <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium shrink-0 whitespace-nowrap bg-violet-50 border-violet-300 text-violet-700">
                                  AI 판정: {aiCategoryLabel}
                                </span>
                                {matchedParcel?.confirmedAt && matchedParcel.currentUsage && (() => {
                                  const confirmedLabel = landCategories.find(c => c.value === matchedParcel.currentUsage)?.label ?? matchedParcel.currentUsage;
                                  return (
                                    <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium shrink-0 whitespace-nowrap bg-gray-900 border-gray-900 text-white">
                                      담당자 판정: {confirmedLabel}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[16px]">토지 형상</Label>
                              <Select
                                value={curShape}
                                onValueChange={(v) => setAdminLandShapePerLand(prev => ({ ...prev, [currentLand.id]: v }))}
                              >
                                <SelectTrigger className="h-[40px]"><SelectValue /></SelectTrigger>
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
                                const latestHistory = matchedParcel?.analysisHistory?.slice(-1)[0];
                                const aiShape = latestHistory?.changedOptions?.landShape ?? matchedParcel?.landShape;
                                const citizenShapeLabel = citizenShape ? (allShapes.find(s => s.value === citizenShape)?.label ?? citizenShape) : undefined;
                                const aiShapeLabel = aiShape ? (allShapes.find(s => s.value === aiShape)?.label ?? aiShape) : undefined;
                                const confirmedShapeLabel = (matchedParcel?.confirmedAt && matchedParcel.landShape)
                                  ? (allShapes.find(s => s.value === matchedParcel.landShape)?.label ?? matchedParcel.landShape)
                                  : undefined;
                                if (!citizenShapeLabel && !aiShapeLabel && !confirmedShapeLabel) return null;
                                return (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {citizenShapeLabel && (
                                      <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium shrink-0 whitespace-nowrap bg-blue-50 border-blue-200 text-blue-700">
                                        민원인 선택: {citizenShapeLabel}
                                      </span>
                                    )}
                                    {aiShapeLabel && (
                                      <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium shrink-0 whitespace-nowrap bg-violet-50 border-violet-300 text-violet-700">
                                        AI 판정: {aiShapeLabel}
                                      </span>
                                    )}
                                    {confirmedShapeLabel && (
                                      <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium shrink-0 whitespace-nowrap bg-gray-900 border-gray-900 text-white">
                                        담당자 판정: {confirmedShapeLabel}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })()}
                      {/* 일단의 토지 요건 확인 */}
                      <div className="space-y-2">
                        <Label className="text-[16px]">일단의 토지 요건 확인</Label>
                        <div className="grid grid-cols-3 gap-5">
                          {[
                            { value: "ownerIdentity", label: "소유자의 동일성", aiKey: null },
                            { value: "groundContinuity", label: "지반의 연속성", aiKey: "continuous" as const },
                            { value: "purposeUnity", label: "용도의 일체성", aiKey: "sameUsage" as const },
                          ].map((option) => {
                            const unifiedConditions =
                              adminResult?.unifiedParcelAnalysis?.conditions ??
                              (application.aiResult?.unifiedParcelAnalysis as any)?.conditions;
                            const aiUnitVal: boolean = option.aiKey
                              ? (unifiedConditions?.[option.aiKey] ?? false)
                              : false;
                            const illandaKey = option.value as "ownerIdentity" | "groundContinuity" | "purposeUnity";
                            const confirmedIllandaVal = matchedParcel?.confirmedIllandaConditions?.[illandaKey];
                            // 체크박스 상태: 담당자 선택 > 확인저장 > AI
                            const checked = landOpts?.[option.value as keyof typeof landOpts] ?? confirmedIllandaVal ?? aiUnitVal;
                            // 배지 값: 확인저장 > AI (체크박스 선택과 무관하게 고정)
                            const illandaBadgeVal = confirmedIllandaVal ?? aiUnitVal;
                            return (
                              <div
                                key={option.value}
                                className={cn(
                                  "flex flex-col gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                                  checked ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                                )}
                                onClick={() => updateLandOption(currentLand.id, option.value, !checked)}
                              >
                                <div className="flex items-center gap-1.5">
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(c) => updateLandOption(currentLand.id, option.value, !!c)}
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
                                    illandaBadgeVal ? "bg-gray-900 border-gray-900 text-white" : "bg-muted border-border text-muted-foreground"
                                  }`}>
                                    {illandaBadgeVal ? "담당자 판정: 충족" : "담당자 판정: 미충족"}
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
                          const LAND_TYPE_TO_CAT: Record<string, string> = { "택지": "대", "대지": "대", "농지": "전", "산지": "임", "그밖의토지": "잡" };
                          const aiCat = adminResult?.landTypePath ? LAND_TYPE_TO_CAT[adminResult.landTypePath] : undefined;
                          const parcelConfirmedUsage = matchedParcel?.confirmedAt ? matchedParcel.currentUsage : undefined;
                          const relevantCategories = curUsage
                            ? [curUsage]
                            : Array.from(new Set([citizenUsage, aiCat, parcelConfirmedUsage].filter(Boolean) as string[]));
                          return (
                            <div className="grid grid-cols-2 gap-2">
                              {adminCheckItemOptions.filter((option) => {
                                const allowedCats = CHECK_ITEM_CATEGORIES[option.value] ?? [];
                                return relevantCategories.some(cat => allowedCats.includes(cat));
                              }).map((option) => {
                                const key = option.value as "accessRoadLost" | "waterChannelLost" | "farmMachineDifficulty" | "farmMachineRotationDifficulty" | "livestockBuildingUnusable" | "adjacentSameOwnerLand";
                                const allowedCats = CHECK_ITEM_CATEGORIES[key] ?? [];
                                const showBadges = relevantCategories.some(cat => allowedCats.includes(cat));
                                const citizenVal: boolean | undefined =
                                  key === "accessRoadLost" ? landData?.accessRoadLost
                                  : key === "waterChannelLost" ? landData?.waterChannelLost
                                  : key === "farmMachineDifficulty" ? landData?.farmMachineDifficulty
                                  : key === "farmMachineRotationDifficulty" ? landData?.farmMachineRotationDifficulty
                                  : key === "livestockBuildingUnusable" ? landData?.livestockBuildingUnusable
                                  : undefined;
                                const aiVal: boolean = (
                                  key === "accessRoadLost" ? adminResult?.accessRoadLost
                                  : key === "waterChannelLost" ? adminResult?.waterChannelLost
                                  : key === "farmMachineDifficulty" ? adminResult?.farmMachineDifficulty
                                  : undefined
                                ) ?? false;
                                // 체크박스 상태: 담당자 > 민원인 > AI
                                const checked = landOpts?.[key] ?? citizenVal ?? aiVal;
                                // 배지 값: 확인저장 > 민원인 > AI (체크박스 선택과 무관하게 고정)
                                const badgeVal = confirmedCheckItems?.[key] ?? citizenVal ?? aiVal;
                                const citizenFlagged = showBadges && citizenVal != null && citizenVal !== aiVal;
                                return (
                                  <div
                                    key={option.value}
                                    className={cn(
                                      "flex flex-col gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                                      citizenFlagged
                                        ? "bg-red-50 border-red-300"
                                        : checked
                                          ? "bg-primary/10 border-primary"
                                          : "hover:bg-muted/50"
                                    )}
                                    onClick={() => updateLandOption(currentLand.id, key, !checked)}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <Checkbox
                                        checked={checked}
                                        onCheckedChange={(c) => updateLandOption(currentLand.id, key, !!c)}
                                        className="shrink-0"
                                      />
                                      <span className="text-xs">{option.label}</span>
                                    </div>
                                    {showBadges && (
                                      <div className="flex flex-wrap gap-1 pl-5">
                                        {citizenVal != null && <CitizenBadge value={citizenVal} />}
                                        <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium shrink-0 whitespace-nowrap ${
                                          aiVal ? "bg-violet-600 border-violet-600 text-white" : "bg-muted border-border text-muted-foreground"
                                        }`}>
                                          {aiVal ? "AI 판정: 해당" : "AI 판정: 미해당"}
                                        </span>
                                        <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium shrink-0 whitespace-nowrap ${
                                          badgeVal ? "bg-gray-900 border-gray-900 text-white" : "bg-muted border-border text-muted-foreground"
                                        }`}>
                                          {badgeVal ? "담당자 판정: 해당" : "담당자 판정: 미해당"}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>

                      {/* AI 분석 실행 버튼 */}
                      <Button
                        onClick={() => {
                          setAdminCheckedLandIds(prev =>
                            prev.includes(currentLand.id) ? prev : [...prev, currentLand.id]
                          );
                          handleRunAIAnalysis();
                        }}
                        disabled={isViewOnly || isAIAnalyzing}
                        className="w-full"
                      >
                        {isAIAnalyzing ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />분석 중...</>
                        ) : (
                          <><Sparkles className="h-4 w-4 mr-2" />AI 분석 실행</>
                        )}
                      </Button>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* 우측: AI 분석결과 검토 */}
            <Card className="border-0 shadow-none sticky top-4">
              <CardHeader className="px-0">
                <CardTitle>AI 분석결과 검토</CardTitle>
                <CardDescription>AI 분석 결과와 보상 가능성 판정을 확인합니다.</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                {(() => {
                  const land = applicationLands[selectedLandIndex];
                  if (!land) return null;
                  const initialResult = application.aiResult;
                  const adminResult = adminLandAIResults[land.id];
                  type HistEntry = {
                    id: string; stage: string; isAdmin: boolean;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    result: any;
                    judgment: string;
                    analyzedAt?: string;
                    options?: { currentUsage?: string; landShape?: string; accessRoadLost?: boolean; waterChannelLost?: boolean; farmMachineDifficulty?: boolean; farmMachineRotationDifficulty?: boolean; livestockBuildingUnusable?: boolean; adjacentSameOwnerLand?: boolean };
                  };
                  const entries: HistEntry[] = [
                    ...(initialResult ? [{
                      id: "initial", stage: "최초 판독", isAdmin: false,
                      result: initialResult, judgment: initialResult.provisionalJudgment || "분석中",
                      analyzedAt: application.appliedAt,
                      options: undefined,
                    }] : []),
                    ...(adminResult ? [{
                      id: "admin-1", stage: "재분석 1회", isAdmin: true,
                      result: adminResult, judgment: adminResult.provisionalJudgment || "분석中",
                      analyzedAt: adminResult.analysisDate,
                      options: {
                        currentUsage: adminCurrentUsagePerLand[land.id],
                        landShape: adminLandShapePerLand[land.id],
                        ...(adminAIOptionsPerLand[land.id] || {}),
                      },
                    }] : []),
                  ];
                  if (entries.length === 0) return (
                    <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border bg-muted/20">
                      <p className="text-sm text-muted-foreground">분석결과 없음</p>
                      <p className="text-xs text-muted-foreground mt-1">좌측에서 AI 분석을 실행하세요.</p>
                    </div>
                  );
                  return (
                    <Accordion type="multiple" defaultValue={entries.map(e => e.id)} className="space-y-2">
                      {entries.slice().reverse().map((entry, rIdx) => {
                        const aiResult = entry.result;
                        const analysisN = entries.length - rIdx;
                        const isPositive = entry.judgment === "수용가능" || entry.judgment === "보상 가능성 높음";
                        return (
                          <AccordionItem
                            key={entry.id}
                            value={entry.id}
                            className="border border-gray-200 rounded-lg px-4"
                            style={{ borderBottomWidth: "1px" }}
                          >
                            <AccordionTrigger className="hover:no-underline py-3">
                              <div className="flex flex-col gap-1.5 w-full mr-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="inline-flex items-center rounded border border-slate-300 bg-white px-2 py-1 text-[15px] font-normal text-slate-600">
                                    {analysisN}차 분석
                                  </span>
                                  {entry.isAdmin ? (
                                    <span className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[15px] font-medium text-blue-700">수동판독</span>
                                  ) : (
                                    <span className="inline-flex items-center rounded bg-slate-100 px-2 py-1 text-[15px] font-medium text-slate-700">자동판독</span>
                                  )}
                                  <span className={cn(
                                    "inline-flex items-center rounded px-2 py-1 text-[15px] font-semibold text-white",
                                    isPositive ? "bg-emerald-700" : "bg-rose-600"
                                  )}>
                                    {entry.judgment === "수용가능" ? "보상 가능성 높음"
                                      : entry.judgment === "수용불가" ? "보상 가능성 낮음"
                                      : entry.judgment}
                                  </span>
                                  {entry.analyzedAt && (
                                    <span className="text-[14px] text-muted-foreground ml-auto">
                                      {entry.analyzedAt}
                                    </span>
                                  )}
                                </div>
                                {entry.options && (
                                  <div className="flex items-center gap-2 flex-wrap text-[15px]">
                                    <span className="shrink-0 font-medium text-slate-400">선택한 옵션:</span>
                                    <div className="flex items-center gap-2 flex-wrap text-slate-600">
                                      {entry.options.currentUsage && (
                                        <span>지목 <span className="font-semibold text-slate-800">{landCategories.find(c => c.value === entry.options?.currentUsage)?.label ?? entry.options.currentUsage}</span></span>
                                      )}
                                      {entry.options.landShape && (
                                        <><span className="text-slate-300">|</span><span>형상 <span className="font-semibold text-slate-800">{[...landShapes.regular, ...landShapes.irregular].find(s => s.value === entry.options?.landShape)?.label ?? entry.options.landShape}</span></span></>
                                      )}
                                      {entry.options.farmMachineDifficulty && <><span className="text-slate-300">|</span><span className="font-semibold text-slate-800">농기계 진입불가</span></>}
                                      {entry.options.accessRoadLost && <><span className="text-slate-300">|</span><span className="font-semibold text-slate-800">접면도로 상실</span></>}
                                      {entry.options.waterChannelLost && <><span className="text-slate-300">|</span><span className="font-semibold text-slate-800">관개수로 상실</span></>}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                              {aiResult ? (() => {
                                const includedArea = land.includedArea ?? (land.originalArea - land.remainingArea);
                                const siOriginal = aiResult.originalShapeIndex ?? land.originalShapeIndex ?? 1.0;
                                const siRemaining = aiResult.remainingShapeIndex ?? land.remainingShapeIndex ?? 5.0;
                                const siChange = aiResult.shapeIndexChange != null ? aiResult.shapeIndexChange : (siRemaining - siOriginal);
                                const beforeShape = (land.originalShape as string) || "정방형";
                                const afterShape = (land.remainingShape as string) || "부정형";
                                const regularShapes = ["정방형", "가로장방형", "세로장방형"];
                                const beforeIsRegular = regularShapes.some(s => beforeShape.includes(s) || beforeShape === "정형");
                                const afterIsRegular = regularShapes.some(s => afterShape.includes(s) || afterShape === "정형");
                                const manualCheckLabels: Record<string, string> = {
                                  accessRoadLost: "접면도로 상실",
                                  waterChannelLost: "농업용 수로 상실",
                                  farmMachineDifficulty: "농기계 진입 곤란",
                                  farmMachineRotationDifficulty: "농기계 회전 곤란",
                                  livestockBuildingUnusable: "축사 부지 사용불가",
                                  adjacentSameOwnerLand: "인접 동일소유자 토지",
                                };
                                const activeManualChecks = entry.options
                                  ? Object.entries(entry.options)
                                      .filter(([k, v]) => k in manualCheckLabels && v === true)
                                      .map(([k]) => manualCheckLabels[k])
                                  : [];

                                const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
                                  <div className="flex items-center gap-2 py-3">
                                    <span className="text-muted-foreground">{icon}</span>
                                    <span className="text-[15px] font-bold text-gray-800">{title}</span>
                                  </div>
                                );
                                const InfoBox = ({ children }: { children: React.ReactNode }) => (
                                  <div className="rounded-lg p-4 mt-3" style={{ backgroundColor: "rgb(251,251,251)" }}>{children}</div>
                                );
                                const MetricItem = ({ label, value }: { label: string; value: string }) => (
                                  <div className="space-y-0.5">
                                    <p className="text-[14px] text-muted-foreground">{label}</p>
                                    <p className="text-[16px] font-semibold text-gray-900">{value}</p>
                                  </div>
                                );

                                return (
                                  <div>
                                    {/* 수동 분석 적용 옵션 */}
                                    {entry.options && (entry.options.currentUsage || entry.options.landShape) && (
                                      <div className="py-1">
                                        <SectionTitle icon={<Settings2 className="h-4 w-4" />} title="수동 분석 적용 옵션" />
                                        <InfoBox>
                                          <div className="grid grid-cols-2 gap-4">
                                            {entry.options.currentUsage && (
                                              <MetricItem label="현재 활용지목" value={landCategories.find(c => c.value === entry.options?.currentUsage)?.label ?? entry.options.currentUsage} />
                                            )}
                                            {entry.options.landShape && (
                                              <MetricItem label="토지 형상" value={[...landShapes.regular, ...landShapes.irregular].find(s => s.value === entry.options?.landShape)?.label ?? entry.options.landShape} />
                                            )}
                                          </div>
                                        </InfoBox>
                                      </div>
                                    )}

                                    {/* 편입 정보 */}
                                    <div className="py-1">
                                      <SectionTitle icon={<LayoutGrid className="h-4 w-4" />} title="편입 정보" />
                                      <InfoBox>
                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                          <MetricItem label="편입 전 면적" value={`${land.originalArea.toLocaleString()} m²`} />
                                          <MetricItem label="편입 면적" value={`${includedArea.toLocaleString()} m²`} />
                                          <MetricItem label="잔여 면적" value={`${land.remainingArea.toLocaleString()} m²`} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <MetricItem label="잔여 비율" value={land.remainingRatio != null ? `${land.remainingRatio}%` : "-"} />
                                          <MetricItem label="형상지수 변화" value={siChange != null ? `${Math.round(siChange * 1000) / 1000}` : "-"} />
                                        </div>
                                      </InfoBox>
                                    </div>

                                    {/* 형상 분석 */}
                                    <div className="py-1">
                                      <SectionTitle icon={<Triangle className="h-4 w-4" />} title="형상 분석" />
                                      <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
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
                                              { label: "형상", before: beforeShape, after: afterShape },
                                              { label: "정형 여부", before: beforeIsRegular ? "정형" : "비정형", after: afterIsRegular ? "정형" : "비정형" },
                                              { label: "SI", before: siOriginal.toString(), after: siRemaining.toString() },
                                              { label: "면적 (m²)", before: land.originalArea.toLocaleString(), after: land.remainingArea.toLocaleString() },
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
                                            <>
                                              <p className="text-[14px] text-muted-foreground mb-1">적용조문: {(aiResult.judgmentRationale.appliedCriteria as string[]).join(", ")}</p>
                                            </>
                                          )}
                                          {aiResult.judgmentRationale.detailedExplanation && (
                                            <div className="mt-2 space-y-1">
                                              <p className="text-[14px] text-muted-foreground">해당 항목:</p>
                                              {aiResult.judgmentRationale.detailedExplanation.split("\n").filter(Boolean).map((line: string, i: number) => (
                                                <p key={i} className="text-[14px] text-gray-600 pl-2">• {line.replace(/^-\s*/, "")}</p>
                                              ))}
                                            </div>
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
                                            {(aiResult.judgmentRationale.appliedCriteria as string[]).map((item: string, idx: number) => (
                                              <li key={idx} className="text-[15px] text-gray-700 flex items-start gap-2">
                                                <span className="mt-1 shrink-0 text-muted-foreground">•</span>
                                                <span>{item}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </InfoBox>
                                      </div>
                                    )}

                                    {/* 일단토지 */}
                                    {land.hasIncludedLand && (
                                      <div className="py-1">
                                        <SectionTitle icon={<MapPin className="h-4 w-4" />} title="일단토지" />
                                        <InfoBox>
                                          <div className="grid grid-cols-3 gap-4">
                                            <MetricItem label="합산면적" value={`${land.originalArea.toLocaleString()} m²`} />
                                            <MetricItem label="합산잔여면적" value={`${land.remainingArea.toLocaleString()} m²`} />
                                            <MetricItem label="합산편입면적" value={`${includedArea.toLocaleString()} m²`} />
                                          </div>
                                        </InfoBox>
                                      </div>
                                    )}

                                    {/* 수동 확인 항목 */}
                                    {activeManualChecks.length > 0 && (
                                      <div className="py-1 pb-3">
                                        <SectionTitle icon={<AlertTriangle className="h-4 w-4" />} title="수동 확인 항목" />
                                        <InfoBox>
                                          <ul className="space-y-1.5">
                                            {activeManualChecks.map((label) => (
                                              <li key={label} className="text-[15px] text-gray-700 flex items-start gap-2">
                                                <span className="mt-1 shrink-0 text-muted-foreground">•</span>
                                                <span>{label}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </InfoBox>
                                      </div>
                                    )}
                                  </div>
                                );
                              })() : (
                                <p className="text-sm text-muted-foreground py-4">결과 데이터 없음</p>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* 2-3. 담당자 검토 */}
          <div className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">담당자 검토</h3>
              <p className="text-[16px] text-muted-foreground">선택된 필지의 판정과 검토 의견을 입력하세요</p>
            </div>
            {(() => {
              const landReview = landReviewDataList[selectedLandIndex];
              const land = applicationLands[selectedLandIndex];
              if (!land || !landReview) return null;
              
              // 담당자 AI 분석 결과 우선, 없으면 민원인 AI 분석 결과 사용
              const adminResult = adminLandAIResults[land.id];
              const citizenResult = landAIResults[land.id] || application.aiResult;
              const aiResult = adminResult || citizenResult;
              
              // 민원인 신고 vs AI 분석 불일치 항목 계산
              const citizenFarm = landReview.farmMachineDifficulty === "해당";
              const citizenRoad = landReview.accessRoadLost;
              const citizenWater = landReview.waterChannelLost;
              const aiFarm = aiResult?.farmMachineDifficulty ?? false;
              const aiRoad = aiResult?.accessRoadLost ?? false;
              const aiWater = aiResult?.waterChannelLost ?? false;

              type MismatchItem = { title: string; description: string; checkPoint: string; priority: string };
              const mismatchItems: MismatchItem[] = [];

              if (citizenFarm && !aiFarm)
                mismatchItems.push({
                  title: "농기계 진입·회전 곤란",
                  description: "민원인은 농기계 진입·회전이 곤란하다고 신고했으나, AI 분석에서는 기준 미충족으로 판단했습니다.",
                  checkPoint: "잔여지 단변 폭과 회전 가능 반경을 현장에서 측정하고, 실제 농기계 작업 가능 여부를 확인하세요.",
                  priority: "최신 지적도·측량 성과를 먼저 확보한 뒤 현장 실사 또는 드론 촬영 자료와 대조하세요.",
                });
              else if (!citizenFarm && aiFarm)
                mismatchItems.push({
                  title: "농기계 진입·회전 곤란",
                  description: "AI가 농기계 진입·회전 곤란으로 분석했으나, 민원인 신고에는 해당 사항이 없습니다.",
                  checkPoint: "AI가 형상지수 변화를 근거로 곤란 판정을 내렸습니다. 잔여지 형상이 실제로 불리하게 변했는지, 민원인이 현황을 과소 신고했을 가능성을 검토하세요.",
                  priority: "편입 전후 지적도를 비교하고, 필요 시 농업인 영농 현황을 추가 청취하세요.",
                });

              if (citizenRoad && !aiRoad)
                mismatchItems.push({
                  title: "접면도로 상실",
                  description: "민원인은 접면도로가 상실되었다고 신고했으나, AI 분석에서는 도로 접근이 가능한 것으로 판단했습니다.",
                  checkPoint: "편입 후 잔여지와 공도가 실제로 접하고 있는지 지적도상 경계선과 현장을 대조하세요.",
                  priority: "도로대장 조회로 공도 접면 여부를 먼저 확인하고, 사도 경유 접근 가능성도 함께 검토하세요.",
                });
              else if (!citizenRoad && aiRoad)
                mismatchItems.push({
                  title: "접면도로 상실",
                  description: "AI가 맹지(접면도로 상실)로 분석했으나, 민원인 신고에는 해당 사항이 없습니다.",
                  checkPoint: "인접 사도나 우회 접근로가 실제로 존재하는지 지적도·위성사진으로 확인하세요.",
                  priority: "항공사진으로 인접 통행로 현황을 먼저 파악한 뒤 현장 확인 여부를 결정하세요.",
                });

              if (citizenWater && !aiWater)
                mismatchItems.push({
                  title: "관개수로 상실",
                  description: "민원인은 관개수로가 상실되었다고 신고했으나, AI 분석에서는 수로 단절이 확인되지 않았습니다.",
                  checkPoint: "취수구·배수로를 포함한 농업용 수로가 공사로 실제 단절되었는지, 대체 용수원이 확보 가능한지 확인하세요.",
                  priority: "농어촌공사 수리시설 현황도와 현장 사진을 먼저 비교하세요.",
                });
              else if (!citizenWater && aiWater)
                mismatchItems.push({
                  title: "관개수로 상실",
                  description: "AI가 관개수로 상실로 분석했으나, 민원인 신고에는 해당 사항이 없습니다.",
                  checkPoint: "민원인이 인지하지 못한 수로 영향이 있는지 수리시설 도면을 재확인하고, 인근 농가 의견을 수집하세요.",
                  priority: "현장 사진 또는 인근 농가 의견을 수집한 뒤 수리시설 도면과 대조하세요.",
                });

              return (
                <div className="space-y-5">

                  {/* 민원인 신고 vs AI 분석 불일치 가이드 */}
                  {mismatchItems.length > 0 && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-600 shrink-0" />
                        <h4 className="text-[15px] font-semibold text-blue-800">민원인 신고와 AI 분석이 다른 항목이 있습니다</h4>
                      </div>
                      <p className="text-[14px] text-blue-700">
                        아래 항목은 민원인이 입력한 내용과 AI 분석 결과가 일치하지 않습니다. 판정 전 현장 확인 또는 추가 자료 검토를 권장합니다.
                      </p>
                      <div className="space-y-2">
                        {mismatchItems.map((item, idx) => (
                          <div key={idx} className="rounded-md bg-white border border-blue-100 px-4 py-3 space-y-2">
                            <p className="text-[14px] font-semibold text-slate-800">{item.title}</p>
                            <p className="text-[14px] text-slate-600">{item.description}</p>
                            <div className="space-y-1 pt-0.5">
                              <p className="text-[13px] text-slate-600">
                                <span className="font-bold text-slate-700">확인 포인트 </span>{item.checkPoint}
                              </p>
                              <p className="text-[13px] text-slate-600">
                                <span className="font-bold text-slate-700">우선 처리 </span>{item.priority}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 1차: 담당자 판정 */}
                  <div className="space-y-3">
                    <Label className="text-[16px] font-medium">담당자 판정</Label>
                    <div className="flex flex-wrap gap-2">
                      {(["보상", "기각", "심의위원회 이관"] as const).map((judgment) => {
                        const config = judgmentConfig[judgment];
                        const Icon = config.icon;
                        const isSelected = landReview.landJudgment === judgment;
                        return (
                          <Button
                            key={judgment}
                            type="button"
                            variant="outline"
                            disabled={isViewOnly}
                            onClick={() => {
                              const next = landReview.landJudgment === judgment ? null : judgment;
                              setLandReviewDataList(prev => {
                                const updated = [...prev];
                                updated[selectedLandIndex] = {
                                  ...updated[selectedLandIndex],
                                  landJudgment: next,
                                  // 심의위원회 회부 선택 시 진행 상태 기본값 = 검토중
                                  committeeStatus: null,
                                  committeeResult: null,
                                };
                                return updated;
                              });
                              markDirty();
                            }}
                            className={`cursor-pointer border-2 ${isSelected ? `${config.borderColor} ${config.textColor}` : "border-[#E1E4E7] text-foreground"} ${isViewOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            {config.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI 판정 불일치 안내 */}
                  {landReview.landJudgment && aiResult?.provisionalJudgment && (
                    (aiResult.provisionalJudgment === "수용가능" && landReview.landJudgment !== "보상") ||
                    (aiResult.provisionalJudgment === "수용불가" && landReview.landJudgment === "보상")
                  ) && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[16px] text-amber-700">
                        AI 판정({aiResult.provisionalJudgment})과 다른 결정입니다. 검토 의견에 사유를 작성해주세요.
                      </p>
                    </div>
                  )}

                  {/* 2차: 심의위원회 진행 상태 (심의위원회 회부 선택 시) */}
                  {landReview.landJudgment === "심의위원회 이관" && (
                    <div className="space-y-3">
                      <Label className="text-[16px] font-medium">심의위원회 진행 상태</Label>
                      <div className="flex flex-wrap gap-2">
                        {(["검토중", "검토완료"] as const).map((status) => {
                          const isSelected = landReview.committeeStatus === status;
                          const Icon = status === "검토중" ? PlayCircle : CheckCircle2;
                          const borderColor = status === "검토중" ? "border-sky-500" : "border-violet-500";
                          const textColor = status === "검토중" ? "text-sky-600" : "text-violet-700";
                          return (
                            <Button
                              key={status}
                              type="button"
                              variant="outline"
                              disabled={isViewOnly}
                              onClick={() => {
                                const next = landReview.committeeStatus === status ? null : status;
                                setLandReviewDataList(prev => {
                                  const updated = [...prev];
                                  updated[selectedLandIndex] = {
                                    ...updated[selectedLandIndex],
                                    committeeStatus: next,
                                    committeeResult: null,
                                  };
                                  return updated;
                                });
                                markDirty();
                              }}
                              className={`cursor-pointer border-2 ${isSelected ? `${borderColor} ${textColor}` : "border-[#E1E4E7] text-foreground"} ${isViewOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                              <Icon className="mr-2 h-4 w-4" />{status}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3차: 심의위원회 검토 결과 (검토완료 선택 시) */}
                  {landReview.landJudgment === "심의위원회 이관" && landReview.committeeStatus === "검토완료" && (
                    <div className="space-y-3">
                      <Label className={`text-[16px] font-medium ${committeeResultErrors[selectedLandIndex] ? "text-destructive" : ""}`}>
                        심의위원회 검토 결과
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {(["보상", "기각"] as const).map((result) => {
                          const config = judgmentConfig[result];
                          const Icon = config.icon;
                          const isSelected = landReview.committeeResult === result;
                          const hasError = committeeResultErrors[selectedLandIndex];
                          return (
                            <Button
                              key={result}
                              type="button"
                              variant="outline"
                              disabled={isViewOnly}
                              onClick={() => {
                                const next = landReview.committeeResult === result ? null : result;
                                updateLandReviewData(selectedLandIndex, 'committeeResult', next);
                                if (next) {
                                  setCommitteeResultErrors(prev => {
                                    const updated = [...prev];
                                    updated[selectedLandIndex] = false;
                                    return updated;
                                  });
                                }
                                markDirty();
                              }}
                              className={`cursor-pointer border-2 ${
                                isSelected
                                  ? `${config.borderColor} ${config.textColor}`
                                  : hasError
                                  ? "border-destructive text-destructive"
                                  : "border-[#E1E4E7] text-foreground"
                              } ${isViewOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                              <Icon className="mr-2 h-4 w-4" />{config.label}
                            </Button>
                          );
                        })}
                      </div>
                      {committeeResultErrors[selectedLandIndex] && (
                        <p className="text-[14px] text-destructive flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          심의위원회 검토 결과를 선택해야 저장할 수 있습니다.
                        </p>
                      )}
                    </div>
                  )}

                  {/* 검토 의견 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-[16px] font-medium">검토 의견 <span className="font-normal text-muted-foreground">(선택)</span></Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isViewOnly}
                        onClick={() => {
                          const template = [
                            "현장 확인 및 관계 서류 검토 결과, 아래 사유로 보상 기준을 충족하지 않아 기각합니다.",
                            "",
                            "• 잔여면적: [    ]㎡로 기준 초과",
                            "• 형상 변화: 편입 전후 형상 유사, 건축·영농 가능 상태 유지",
                            "• 기타: [추가 사유 입력]",
                          ].join("\n");
                          updateLandReviewData(selectedLandIndex, 'landComment', template);
                        }}
                        className="shrink-0 gap-1.5 text-[13px]"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        기각의견 양식 불러오기
                      </Button>
                    </div>
                    <Textarea
                      placeholder="해당 필지에 대한 검토 의견을 입력하세요."
                      value={landReview.landComment}
                      onChange={(e) => updateLandReviewData(selectedLandIndex, 'landComment', e.target.value)}
                      className="min-h-[200px] resize-none"
                      disabled={isViewOnly}
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 섹션 하단 페이지네이션 */}
          <div className="flex items-center justify-center gap-3 pt-6 border-t mt-6">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-blue-300 hover:bg-blue-100"
              onClick={() => {
                setSelectedLandIndex(Math.max(0, selectedLandIndex - 1));
              }}
              disabled={selectedLandIndex === 0}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-[16px] font-medium text-blue-700 whitespace-nowrap px-2">{selectedLandIndex + 1} / {applicationLands.length}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-blue-300 hover:bg-blue-100"
              onClick={() => {
                setSelectedLandIndex(Math.min(applicationLands.length - 1, selectedLandIndex + 1));
              }}
              disabled={selectedLandIndex === applicationLands.length - 1}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* 진행상황 수동 설정 */}
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold">진행상황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(["접수완료", "담당자검토중", "담당자검토완료"] as const).map((status) => {
              const isSelected = progressStatus === status;
              const labelMap: Record<string, string> = {
                접수완료: "접수 완료",
                담당자검토중: "담당자 검토 중",
                담당자검토완료: "민원 종결처리",
              };
              return (
                <Button
                  key={status}
                  type="button"
                  variant="outline"
                  disabled={isViewOnly}
                  onClick={() => {
                    setProgressStatus(status);
                    markDirty();
                  }}
                  className={`cursor-pointer border-2 ${isSelected ? "border-primary text-primary bg-primary/5" : "border-[#E1E4E7] text-foreground"} ${isViewOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {labelMap[status]}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 심사완료 뷰어모드 안내 배너 */}
      {isViewOnly && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            {application.adminStatus === "담당자검토완료" ? (
              <>
                <p className="font-medium text-amber-800">민원 종결처리 건입니다</p>
                <p className="text-[16px] text-amber-700">민원 종결처리되어 수정이 불가능합니다. 조회만 가능합니다.</p>
              </>
            ) : (
              <>
                <p className="font-medium text-amber-800">심사완료 건입니다</p>
                <p className="text-[16px] text-amber-700">심사가 완료되어 편집이 불가능합니다. 조회만 가능합니다.</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Section 03. 최종 검토 의견 */}
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">최종 검토 의견 <span className="text-base font-normal text-muted-foreground">(선택)</span></CardTitle>
          <CardDescription>
            모든 필지에 대한 종합적인 검토 의견을 작성해주세요. 이 내용은 심의서에 자동 입력됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 필지별 검토 현황 요약 */}
          <div className="flex items-center gap-3">
            <span className="text-[16px] font-medium text-muted-foreground shrink-0">필지별 검토 현황</span>
            <div className="flex flex-wrap gap-2">
              {applicationLands.map((land, idx) => {
                const review = landReviewDataList[idx];
                const judgment = review?.landJudgment;
                const isReviewed = judgment !== null && judgment !== undefined;
                
                // 판정 결과에 따른 JudgmentBadge 타입 매핑
                const getJudgmentType = (j: string | null | undefined): "보상" | "기각" | "심의위원회 이관" | null => {
                  if (j === "보상") return "보상";
                  if (j === "기각") return "기각";
                  if (j === "심의위원회 이관") return "심의위원회 이관";
                  return null;
                };
                
                const judgmentType = getJudgmentType(judgment);
                
                return isReviewed && judgmentType ? (
                  <JudgmentBadge 
                    key={land.id}
                    type={judgmentType} 
                    showLabel={true}
                    prefix={String.fromCharCode(65 + idx)}
                  />
                ) : (
                  <span 
                    key={land.id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground"
                  >
                    <span className="font-medium">{String.fromCharCode(65 + idx)}</span>
                    <span>미검토</span>
                  </span>
                );
              })}
            </div>
          </div>
          <Textarea
            rows={8}
            value={reviewData.reviewerComment || ""}
            onChange={(e) => { markDirty(); setReviewData((prev) => ({ ...prev, reviewerComment: e.target.value })); }}
            className="resize-none bg-background font-mono text-[16px] leading-relaxed"
            disabled={isViewOnly}
          />
        </CardContent>
      </Card>

      {/* AI 분석 프로세스 다이얼로그 - 관리자 재판독 결과 우선 표시 */}
      <AIAnalysisFlowDialog
        open={showAnalysisFlow}
        onOpenChange={setShowAnalysisFlow}
        aiResult={(() => {
          const selectedLandId = allLands[selectedLandIndex]?.id;
          if (selectedLandId && adminLandAIResults[selectedLandId]) {
            return adminLandAIResults[selectedLandId] as unknown as AIAnalysisResult;
          }
          if (selectedLandId && landAIResults[selectedLandId]) {
            return landAIResults[selectedLandId] as unknown as AIAnalysisResult;
          }
          return aiResult ?? null;
        })()}
        landInfo={allLands[selectedLandIndex]}
        isAdminResult={!!adminLandAIResults[allLands[selectedLandIndex]?.id]}
      />

      {/* 상세 판독 결과 확장 패널 (Drawer) */}
      {isDetailPanelExpanded && expandedLandIndex !== null && (
        <div className="fixed inset-0 z-50 flex">
          {/* 배경 오버레이 */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsDetailPanelExpanded(false)}
          />
          
          {/* 확장 패널 */}
          <div className="relative flex w-full max-w-6xl bg-background animate-in slide-in-from-left duration-300">
            {/* 닫기 버튼 */}
            <Button
              variant="ghost"
              className="absolute right-4 top-4 z-10 h-10 w-10 p-0"
              onClick={() => setIsDetailPanelExpanded(false)}
            >
              <X className="h-8 w-8" />
            </Button>
            
            {/* 패널 내용 - 2단 레이아웃 */}
            <div className="flex flex-1 overflow-hidden">
              {/* 왼쪽: 텍스트 정보 (판단 요약, 법적 근거) */}
              <div className="w-3/4 border-r overflow-y-auto p-6">
                <div className="space-y-5">
                  {/* 헤더 */}
                  <div>
                    <h2 className="text-xl font-bold text-foreground">상세 판독 결과</h2>
                    <p className="text-[16px] text-muted-foreground mt-1">
                      {allLands[expandedLandIndex]?.address}
                    </p>
                  </div>

                  {/* 판단 요약 */}
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <h3 className="text-[16px] font-semibold text-foreground mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      판단 요약
                    </h3>
                    <p className="text-[16px] text-muted-foreground leading-relaxed">
                      {(() => {
                        const land = allLands[expandedLandIndex];
                        const result = landAIResults[land?.id];
                        return result?.judgmentRationale?.summary || 
                          `본 필지는 ${land?.landType} 유형으로, 잔여면적 ${land?.remainingArea?.toLocaleString()}㎡ (${land?.remainingRatio}%)입니다.`;
                      })()}
                    </p>
                  </div>

                  {/* 법적 근거 */}
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <h3 className="text-[16px] font-semibold text-foreground mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      법적 근거
                    </h3>
                    <p className="text-[16px] text-muted-foreground leading-relaxed">
                      {(() => {
                        const land = allLands[expandedLandIndex];
                        const result = landAIResults[land?.id];
                        return result?.judgmentRationale?.legalBasis || 
                          "「공익사업을 위한 토지 등의 취득 및 보상에 관한 법률」 제74조 및 동법 시행규칙 제34조";
                      })()}
                    </p>
                  </div>

                  {/* 적용 기준 */}
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <h3 className="text-[16px] font-semibold text-foreground mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      적용 기준
                    </h3>
                    <ul className="space-y-2">
                      {(() => {
                        const land = allLands[expandedLandIndex];
                        const result = landAIResults[land?.id];
                        const criteria = result?.judgmentRationale?.appliedCriteria || [
                          "잔여지 면적 기준 미달 여부",
                          "잔여지 형상 변화 (정형 → 부정형)",
                          "접면도로 상태 변경 여부"
                        ];
                        return criteria.map((c: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-[16px] text-muted-foreground">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            {c}
                          </li>
                        ));
                      })()}
                    </ul>
                  </div>

                  {/* 판정 결과 */}
                  <div className="rounded-lg border p-4">
                    <h3 className="text-[16px] font-semibold text-foreground mb-3">AI 판정 결과</h3>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const land = allLands[expandedLandIndex];
                        const result = landAIResults[land?.id];
                        const judgment = result?.provisionalJudgment || "분석 필요";
                        return (
                          <JudgmentStatus 
                            judgment={judgment} 
                            variant="badge" 
                            size="md"
                          />
                        );
                      })()}
                      <span className="text-[16px] text-muted-foreground">
                        신뢰도: {(() => {
                          const land = allLands[expandedLandIndex];
                          const result = landAIResults[land?.id];
                          return result?.confidence ? `${result.confidence}%` : "-";
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* 상세 설명 */}
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <h3 className="text-[16px] font-semibold text-foreground mb-3">상세 분석 내용</h3>
                    <pre className="whitespace-pre-wrap text-[16px] text-muted-foreground leading-relaxed">
                      {(() => {
                        const land = allLands[expandedLandIndex];
                        const result = landAIResults[land?.id];
                        return result?.judgmentRationale?.detailedExplanation || 
                          `[필지 정보]\n주소: ${land?.address}\n지목: ${land?.landType} (${land?.landCategory})\n편입 전 면적: ${land?.originalArea?.toLocaleString()}㎡\n잔여 면적: ${land?.remainingArea?.toLocaleString()}㎡ (${land?.remainingRatio}%)`;
                      })()}
                    </pre>
                  </div>
                </div>
              </div>

              {/* 오른쪽: AI 판독 분석 이미지 */}
              <div className="w-1/4 bg-muted/20 p-6 overflow-y-auto">
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    AI 판독 분석 이미지
                  </h3>
                  
                  {/* 지적도 이미지 */}
                  <div className="rounded-lg border bg-background overflow-hidden">
                    <div className="aspect-square relative z-0">
                      <LeafletMap
                        parcels={allLands.map((l, i) => ({
                          id: l.id,
                          coordinates: [
                            { lat: 37.5665 + (i * 0.001), lng: 126.9780 },
                            { lat: 37.5665 + (i * 0.001), lng: 126.9790 },
                            { lat: 37.5675 + (i * 0.001), lng: 126.9790 },
                            { lat: 37.5675 + (i * 0.001), lng: 126.9780 },
                          ],
                          address: l.address,
                          isOwned: true,
                          isIncluded: true,
                        }))}
                        selectedParcelIds={new Set([allLands[expandedLandIndex]?.id])}
                        sameOwnerParcels={dummyProcessedParcels
                          .filter((p) => p.landInfo.ownerName === application.applicantName)
                          .map((p) => ({
                            id: p.id,
                            address: p.landInfo.address,
                            coordinates: p.landInfo.coordinates ?? [],
                          }))}
                      />
                    </div>
                    <div className="p-3 border-t bg-muted/30">
                      <p className="text-xs text-muted-foreground text-center">
                        편입 전후 토지 형상 분석
                      </p>
                    </div>
                  </div>

                  {/* 분석 시각화 */}
                  <div className="grid grid-cols-2 gap-5">
                    <div className="rounded-lg border bg-background p-4">
                      <p className="text-xs text-muted-foreground mb-2">잔여 면적</p>
                      <p className="text-2xl font-bold text-foreground">
                        {allLands[expandedLandIndex]?.remainingArea?.toLocaleString()}
                        <span className="text-[16px] font-normal text-muted-foreground ml-1">㎡</span>
                      </p>
                      <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${allLands[expandedLandIndex]?.remainingRatio || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        원래 면적의 {allLands[expandedLandIndex]?.remainingRatio}%
                      </p>
                    </div>
                    
                    <div className="rounded-lg border bg-background p-4">
                      <p className="text-xs text-muted-foreground mb-2">형상지수 변화</p>
                      <p className="text-2xl font-bold text-foreground">
                        {(() => {
                          const land = allLands[expandedLandIndex];
                          const result = landAIResults[land?.id];
                          return result?.shapeIndexChange != null ? `+${result.shapeIndexChange.toFixed(1)}` : "-";
                        })()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {allLands[expandedLandIndex]?.remainingShape === "부정형" ? "정형 → 부정형 변화" : "형상 유지"}
                      </p>
                    </div>
                  </div>

                  {/* 참고 안내 */}
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700">
                      AI 판독 분석 이미지는 참고용이며, 실제 측량 결과와 다를 수 있습니다.
                      최종 판정은 담당자의 현장 확인 및 검토에 따라 결정됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 하단 저장 버튼은 page.tsx에서 목록 버튼과 함께 렌더링됨 */}

      {/* 민원인 입력 vs AI 분석 비교 상세 모달 */}
      {compareModalItem && (
        <Dialog open={!!compareModalItem} onOpenChange={() => setCompareModalItem(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg">{compareModalItem.label} — 상세 비교</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-1">
              {/* 비교 카드 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">민원인 입력</p>
                  <p className="text-xl font-bold text-gray-900">{compareModalItem.citizenValue}</p>
                </div>
                <div className={`rounded-lg border p-4 ${compareModalItem.isMismatch ? "bg-primary/5 border-primary/20" : "bg-emerald-50 border-emerald-200"}`}>
                  <p className={`text-xs font-medium mb-1.5 ${compareModalItem.isMismatch ? "text-primary/70" : "text-emerald-600"}`}>AI 분석 결과</p>
                  <p className={`text-xl font-bold ${compareModalItem.isMismatch ? "text-primary" : "text-emerald-700"}`}>{compareModalItem.aiValue}</p>
                </div>
              </div>

              {/* 요약 문구 */}
              <div className={`rounded-lg px-4 py-3 ${compareModalItem.isMismatch ? "bg-amber-50 border border-amber-200" : "bg-emerald-50 border border-emerald-200"}`}>
                <p className={`text-sm font-medium ${compareModalItem.isMismatch ? "text-amber-800" : "text-emerald-800"}`}>
                  {compareModalItem.isMismatch
                    ? `민원인은 '${compareModalItem.citizenValue}'으로 입력했으나, AI 분석 결과 '${compareModalItem.aiValue}'(으)로 판정되었습니다. 두 값이 다르므로 우선적으로 검토해 주세요.`
                    : `민원인이 입력한 값과 AI 분석 결과가 일치합니다.`}
                </p>
              </div>

              {/* 검토 절차 안내 */}
              {compareModalItem.procedures.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-3">
                    {compareModalItem.isMismatch ? "검토 절차 안내" : "확인 사항"}
                  </p>
                  <div className="space-y-2.5">
                    {compareModalItem.procedures.map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 민원인 AI 분석결과 상세 모달 */}
      {(() => {
        const land = applicationLands[selectedLandIndex];
        const citizenAIResult = (land && landAIResults[land.id]) ? landAIResults[land.id] : null;

        if (!land) return null;

        const aiResult = (citizenAIResult ?? application.aiResult)!;
        const includedArea = land.includedArea ?? (land.originalArea - land.remainingArea);
        const siOriginal = land.originalShapeIndex ?? 1.0;
        const siRemaining = land.remainingShapeIndex ?? 5.0;
        const siChange = aiResult?.shapeIndexChange != null ? aiResult.shapeIndexChange : (siRemaining - siOriginal);
        const beforeShape = (land.originalShape as string) || "정방형";
        const afterShape = (land.remainingShape as string) || "부정형";
        const regularShapes = ["정방형", "가로장방형", "세로장방형"];
        const beforeIsRegular = regularShapes.some(s => beforeShape.includes(s) || beforeShape === "정형");
        const afterIsRegular = regularShapes.some(s => afterShape.includes(s) || afterShape === "정형");

        const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
          <div className="flex items-center gap-2 py-3">
            <span className="text-muted-foreground">{icon}</span>
            <span className="text-[15px] font-bold text-gray-800">{title}</span>
          </div>
        );
        const InfoBox = ({ children }: { children: React.ReactNode }) => (
          <div className="rounded-lg p-4 mt-3" style={{ backgroundColor: "rgb(251,251,251)" }}>{children}</div>
        );
        const MetricItem = ({ label, value }: { label: string; value: string }) => (
          <div className="space-y-0.5">
            <p className="text-[14px] text-muted-foreground">{label}</p>
            <p className="text-[16px] font-semibold text-gray-900">{value}</p>
          </div>
        );

        return (
          <Dialog open={showCitizenAIModal} onOpenChange={setShowCitizenAIModal}>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg">민원인의 분석결과</DialogTitle>
              </DialogHeader>
              <div>
                  {/* 편입 정보 */}
                  <div className="py-1">
                    <SectionTitle icon={<LayoutGrid className="h-4 w-4" />} title="편입 정보" />
                    <InfoBox>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <MetricItem label="편입 전 면적" value={`${land.originalArea.toLocaleString()} m²`} />
                        <MetricItem label="편입 면적" value={`${includedArea.toLocaleString()} m²`} />
                        <MetricItem label="잔여 면적" value={`${land.remainingArea.toLocaleString()} m²`} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <MetricItem label="잔여 비율" value={land.remainingRatio != null ? `${land.remainingRatio}%` : "-"} />
                        <MetricItem label="형상지수 변화" value={siChange != null ? `${Math.round(siChange * 1000) / 1000}` : "-"} />
                      </div>
                    </InfoBox>
                  </div>

                  {/* 형상 분석 */}
                  <div className="py-1">
                    <SectionTitle icon={<Triangle className="h-4 w-4" />} title="형상 분석" />
                    <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
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
                            { label: "형상", before: beforeShape, after: afterShape },
                            { label: "정형 여부", before: beforeIsRegular ? "정형" : "비정형", after: afterIsRegular ? "정형" : "비정형" },
                            { label: "SI", before: siOriginal.toString(), after: siRemaining.toString() },
                            { label: "면적 (m²)", before: land.originalArea.toLocaleString(), after: land.remainingArea.toLocaleString() },
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
                          <>
                            <p className="text-[14px] text-muted-foreground mb-1">적용조문: {(aiResult.judgmentRationale.appliedCriteria as string[]).join(", ")}</p>
                          </>
                        )}
                        {aiResult.judgmentRationale.detailedExplanation && (
                          <div className="mt-2 space-y-1">
                            <p className="text-[14px] text-muted-foreground">해당 항목:</p>
                            {aiResult.judgmentRationale.detailedExplanation.split("\n").filter(Boolean).map((line: string, i: number) => (
                              <p key={i} className="text-[14px] text-gray-600 pl-2">• {line.replace(/^-\s*/, "")}</p>
                            ))}
                          </div>
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
                          {(aiResult.judgmentRationale.appliedCriteria as string[]).map((item: string, idx: number) => (
                            <li key={idx} className="text-[15px] text-gray-700 flex items-start gap-2">
                              <span className="mt-1 shrink-0 text-muted-foreground">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </InfoBox>
                    </div>
                  )}

                  {/* 일단토지 */}
                  {land.hasIncludedLand && (
                    <div className="py-1">
                      <SectionTitle icon={<MapPin className="h-4 w-4" />} title="일단토지" />
                      <InfoBox>
                        <div className="grid grid-cols-3 gap-4">
                          <MetricItem label="합산면적" value={`${land.originalArea.toLocaleString()} m²`} />
                          <MetricItem label="합산잔여면적" value={`${land.remainingArea.toLocaleString()} m²`} />
                          <MetricItem label="합산편입면적" value={`${includedArea.toLocaleString()} m²`} />
                        </div>
                      </InfoBox>
                    </div>
                  )}
                </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* 담당자 AI 분석결과 상세 모달 */}
      {(() => {
        const currentLand = applicationLands[selectedLandIndex];
        const adminResult = currentLand ? adminLandAIResults[currentLand.id] : null;
        return (
          <Dialog open={showAdminAIModal} onOpenChange={setShowAdminAIModal}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-lg">담당자 AI 판독 결과 상세</DialogTitle>
              </DialogHeader>
              {adminResult ? (
                <div className="space-y-4 pt-1">
                  <div className={`rounded-lg border px-4 py-3 ${adminResult.provisionalJudgment === "수용가능" || adminResult.provisionalJudgment === "보상 가능성 높음" ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">최종 판독</p>
                    <p className={`text-xl font-bold ${adminResult.provisionalJudgment === "수용가능" || adminResult.provisionalJudgment === "보상 가능성 높음" ? "text-emerald-700" : "text-rose-700"}`}>
                      {adminResult.provisionalJudgment}
                    </p>
                    {adminResult.analysisDate && (
                      <p className="text-xs text-muted-foreground mt-1">분석일시: {adminResult.analysisDate}</p>
                    )}
                  </div>
                  {adminResult.criteriaChecks && adminResult.criteriaChecks.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">항목별 판정</p>
                      {adminResult.criteriaChecks.map((check, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                          <div>
                            <p className="text-[16px] font-medium text-foreground">{check.criteriaName}</p>
                            {check.criteriaDescription && (
                              <p className="text-sm text-muted-foreground">{check.criteriaDescription}</p>
                            )}
                          </div>
                          <span className={`shrink-0 ml-3 text-sm font-semibold ${check.isMet ? "text-emerald-600" : "text-rose-600"}`}>
                            {check.autoDetected ? (check.isMet ? "충족" : "미충족") : (check.isMet ? "해당" : "해당없음")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button className="flex-1 gap-2" variant="outline"
                      onClick={() => {
                        setShowAdminAIModal(false);
                        if (currentLand && !adminCheckedLandIds.includes(currentLand.id)) {
                          setAdminCheckedLandIds(prev => [...prev, currentLand.id]);
                        }
                        handleRunAIAnalysis();
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                      AI 재분석 실행
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-[16px] text-muted-foreground">담당자 AI 분석 결과가 없습니다. 아래 버튼으로 분석을 실행하세요.</p>
                  </div>
                  <Button className="w-full gap-2"
                    onClick={() => {
                      setShowAdminAIModal(false);
                      if (currentLand && !adminCheckedLandIds.includes(currentLand.id)) {
                        setAdminCheckedLandIds(prev => [...prev, currentLand.id]);
                      }
                      handleRunAIAnalysis();
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    AI 분석 실행
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* 파일 미리보기 Dialog - 풀페이지 */}
      <Dialog open={showPdfPreview} onOpenChange={setShowPdfPreview}>
        <DialogContent
          className="fixed inset-0 w-[100vw] h-[100vh] !max-w-none rounded-none border-none overflow-hidden flex flex-col p-0 translate-x-0 translate-y-0 top-0 left-0"
          style={{ maxHeight: '100vh', overflowY: 'hidden' }}
        >
          <DialogHeader className="shrink-0 px-6 py-4 border-b bg-background pr-16">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base">
                첨부파일 미리보기
              </DialogTitle>
              <div className="flex items-center gap-3">
                <span className="text-[16px] text-muted-foreground">{selectedAttachment?.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    if (selectedAttachment) {
                      const link = document.createElement('a');
                      link.href = selectedAttachment.url;
                      link.download = selectedAttachment.name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                >
                  <Download className="size-4" />
                  다운로드
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/30 w-full">
            {selectedAttachment && (
              <div className="w-full h-full flex items-center justify-center">
                {selectedAttachment.name.toLowerCase().endsWith('.jpg') || 
                 selectedAttachment.name.toLowerCase().endsWith('.jpeg') || 
                 selectedAttachment.name.toLowerCase().endsWith('.png') || 
                 selectedAttachment.name.toLowerCase().endsWith('.gif') ? (
                  <div className="relative w-full h-full flex items-center justify-center p-8">
                    <img 
                      src={`https://picsum.photos/seed/${encodeURIComponent(selectedAttachment.name)}/800/600`}
                      alt={selectedAttachment.name}
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                      데모용 샘플 이미지입니다
                    </div>
                  </div>
                ) : selectedAttachment.name.toLowerCase().endsWith('.pdf') ? (
                  <div className="relative w-full h-full flex flex-col">
                    <iframe 
                      src="https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf"
                      className="w-full h-full border-0"
                      title={selectedAttachment.name}
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                      데모용 샘플 PDF입니다
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground w-full h-full">
                    <FileText className="size-24 text-muted-foreground/50" />
                    <p className="text-base">미리보기를 지원하지 않는 파일 형식입니다.</p>
                    <p className="text-[16px]">파일을 다운로드하여 확인해 주세요.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 저장 전 최종 판정 확인 알럿 */}
      <AlertDialog open={showCompleteAlert} onOpenChange={setShowCompleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>검토 완료 저장</AlertDialogTitle>
            <AlertDialogDescription className="space-y-1">
              <span className="block">저장 후에는 수정이 불가합니다.</span>
              <span className="block text-muted-foreground">민원 종결처리로 저장하시겠습니까?</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCompleteAlert(false)}>재확인</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowCompleteAlert(false);
                doSave();
              }}
              className="bg-primary text-white hover:bg-primary/90"
            >
              저장
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
