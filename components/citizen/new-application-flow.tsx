"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FormLabel } from "@/components/ui/form-label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronLeft, ChevronDown, MapPin, Search, FileText, Sparkles, ClipboardCheck, XCircle, X, Trash2, ClipboardList, ShoppingCart, AlertCircle } from "lucide-react";
import type { LandInfo, AIAnalysisResult, Application } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import Script from "next/script";

// 더미 잔여지 데이터 (사용자 소유)
const myParcels = [
  {
    id: "parcel-1",
    address: "경기도 성남시 분당구 정자동 123-45",
    area: 150,
    remainingArea: 45,
    landCategory: "대" as const,
    landUse: "제2종일반주거지역",
    roadContact: "8m 도로" as const,
    ownerName: "홍길동",
    projectName: "분당-수서 고속도로",
    applicationStatus: null as string | null, // 미신청
  },
  {
    id: "parcel-2", 
    address: "경기도 용인시 수지구 동천동 456-78",
    area: 280,
    remainingArea: 120,
    landCategory: "전" as const,
    landUse: "자연녹지지역",
    roadContact: "비접도" as const,
    ownerName: "홍길동",
    projectName: "용인-서울 고속도로",
    applicationStatus: "신청완료" as string | null, // 신청 완료
  },
  {
    id: "parcel-3",
    address: "서울시 강남구 삼성동 789-12",
    area: 95,
    remainingArea: 30,
    landCategory: "대" as const,
    landUse: "제3종일반주거지역", 
    roadContact: "12m 도로" as const,
    ownerName: "홍길동",
    projectName: "강남순환도로",
    applicationStatus: null as string | null,
  },
  {
    id: "parcel-4",
    address: "경기도 화성시 동탄면 석우동 234-56",
    area: 320,
    remainingArea: 85,
    landCategory: "답" as const,
    landUse: "계획관리지역",
    roadContact: "4m 도로" as const,
    ownerName: "홍길동",
    projectName: "동탄-오산 연결도로",
    applicationStatus: "신청완료" as string | null, // 신청 완료
  },
  {
    id: "parcel-5",
    address: "경기도 수원시 영통구 원천동 567-89",
    area: 180,
    remainingArea: 55,
    landCategory: "대" as const,
    landUse: "제1종일반주거지역",
    roadContact: "6m 도로" as const,
    ownerName: "홍길동",
    projectName: "수원-용인 고속도로",
    applicationStatus: null as string | null,
  },
  {
    id: "parcel-6",
    address: "인천시 연수구 송도동 123-99",
    area: 420,
    remainingArea: 150,
    landCategory: "잡" as const,
    landUse: "일반상업지역",
    roadContact: "20m 도로" as const,
    ownerName: "홍길동",
    projectName: "송도국제도시 2단계",
    applicationStatus: null as string | null,
  },
  // 복수필지 케이스 1: 안성-천안 국도확장 (농지 3필지)
  {
    id: "parcel-multi-1-1",
    address: "경기도 안성시 미양면 계륵리 501-1",
    area: 800,
    remainingArea: 250,
    landCategory: "전" as const,
    landUse: "농림지역",
    roadContact: "비접도" as const,
    ownerName: "홍길동",
    projectName: "안성-천안 국도확장",
    applicationStatus: null as string | null,
  },
  {
    id: "parcel-multi-1-2",
    address: "경기도 안성시 미양면 계륵리 501-2",
    area: 650,
    remainingArea: 170,
    landCategory: "답" as const,
    landUse: "농림지역",
    roadContact: "4m 도로" as const,
    ownerName: "홍길동",
    projectName: "안성-천안 국도확장",
    applicationStatus: null as string | null,
  },
  {
    id: "parcel-multi-1-3",
    address: "경기도 안성시 미양면 계륵리 501-3",
    area: 550,
    remainingArea: 150,
    landCategory: "전" as const,
    landUse: "농림지역",
    roadContact: "비접도" as const,
    ownerName: "홍길동",
    projectName: "안성-천안 국도확장",
    applicationStatus: null as string | null,
  },
  // 복수필지 케이스 2: 천안 도시개발 (혼합 4필지: 대지+농지+잡종지)
  {
    id: "parcel-multi-2-1",
    address: "충청남도 천안시 서북구 성정동 777-1",
    area: 200,
    remainingArea: 65,
    landCategory: "대" as const,
    landUse: "제2종일반주거지역",
    roadContact: "6m 도로" as const,
    ownerName: "홍길동",
    projectName: "천안 도시개발사업",
    applicationStatus: null as string | null,
  },
  {
    id: "parcel-multi-2-2",
    address: "충청남도 천안시 서북구 성정동 777-2",
    area: 350,
    remainingArea: 120,
    landCategory: "전" as const,
    landUse: "계획관리지역",
    roadContact: "비접도" as const,
    ownerName: "홍길동",
    projectName: "천안 도시개발사업",
    applicationStatus: null as string | null,
  },
  {
    id: "parcel-multi-2-3",
    address: "충청남도 천안시 서북구 성정동 777-3",
    area: 280,
    remainingArea: 95,
    landCategory: "답" as const,
    landUse: "계획관리지역",
    roadContact: "4m 도로" as const,
    ownerName: "홍길동",
    projectName: "천안 도시개발사업",
    applicationStatus: null as string | null,
  },
  {
    id: "parcel-multi-2-4",
    address: "충청남도 천안시 서북구 성정동 777-4",
    area: 180,
    remainingArea: 70,
    landCategory: "잡" as const,
    landUse: "계획관리지역",
    roadContact: "6m 도로" as const,
    ownerName: "홍길동",
    projectName: "천안 도시개발사업",
    applicationStatus: null as string | null,
  },
  // 복수필지 케이스 3: 원주-제천 고속도로 (산지 2필지)
  {
    id: "parcel-multi-3-1",
    address: "강원도 원주시 지정면 신평리 산 104",
    area: 3500,
    remainingArea: 980,
    landCategory: "임" as const,
    landUse: "보전산지",
    roadContact: "비접도" as const,
    ownerName: "홍길동",
    projectName: "원주-제천 고속도로",
    applicationStatus: null as string | null,
  },
  {
    id: "parcel-multi-3-2",
    address: "강원도 원주시 지정면 신평리 산 105",
    area: 2800,
    remainingArea: 750,
    landCategory: "임" as const,
    landUse: "보전산지",
    roadContact: "비접도" as const,
    ownerName: "홍길동",
    projectName: "원주-제천 고속도로",
    applicationStatus: null as string | null,
  },
];

// AI 분석을 위한 정보수집 질문들 (판독 일부 지원 항목만)
const questions = [
  // 0. 인접 토지 보유 여부 (공통 질문)
  {
    id: "hasAdjacentLand",
    title: "잔여지에 인접해서 소유하신 땅이 또 있나요?",
    subtitle: "같은 사업구역 내 인접하여 소유하신 토지가 있는지 확인해 주세요.",
    type: "radio" as const,
    layout: "segment" as const,
    options: [
      { value: "yes", label: "네, 있습니다" },
      { value: "no", label: "아니요, 없습니다" },
    ],
  },
  // 1. 토지 유형 선택
  {
    id: "landType",
    title: "남은 땅을 주로 어떤 용도로 쓰고 계시나요?",
    subtitle: "남은 땅의 주된 용도에 해당하는 유형을 선택해 주세요.",
    type: "radio" as const,
    options: [
      { value: "택지", label: "집이나 상가, 공장 등이 있는 땅 (택지)" },
      { value: "농지", label: "밭, 논, 과수원 등 농사를 짓는 땅 (농지)" },
      { value: "산지", label: "산이나 숲 (임야/산지)" },
      { value: "기타", label: "그 외 다른 용도의 땅" },
    ],
  },
  // 2. 택지 유형 선택 (택지인 경우)
  {
    id: "buildingType",
    title: "지어져 있는 건물의 종류는 무엇인가요?",
    subtitle: "건축물의 용도를 선택해 주세요.",
    type: "radio" as const,
    showWhen: { questionId: "landType", value: "택지" },
    options: [
      { value: "주거용", label: "살림집 (주거용)" },
      { value: "상업용", label: "상가나 사무실 (상업용)" },
      { value: "공업용", label: "공장이나 창고 (공업용)" },
    ],
  },
  // 3. 주거용 세부 유형 (주거용인 경우)
  {
    id: "residentialType",
    title: "주거용 건물의 유형은 무엇인가요?",
    subtitle: "해당하는 주거 유형을 선택해 주세요.",
    type: "radio" as const,
    showWhen: { questionId: "buildingType", value: "주거용" },
    options: [
      { value: "단독다세대", label: "단독주택 / 다세대주택" },
      { value: "연립", label: "연립주택" },
      { value: "아파트", label: "아파트" },
    ],
  },
  // ===== 택지 확인 항목 (판독 일부 지원) =====
  {
    id: "roadStatusChange",
    title: "공사(사업) 때문에 도로 상황이 바뀌어, 앞으로 건물을 새로 짓거나 고치는 일(건축허가)이 불가능해졌나요?",
    subtitle: "도로 상태 변경으로 인해 향후 건축이 불가능해졌는지 확인해 주세요.",
    type: "radio" as const,
    showWhen: { questionId: "landType", value: "택지" },
    options: [
      { value: "yes", label: "네, 도로가 바뀌어서 건물 허가를 받을 수 없게 되었습니다." },
      { value: "no", label: "아니요, 여전히 건물 허가를 받을 수 있습니다." },
    ],
  },
  // ===== 농지 확인 항목 (판독 일부 지원) =====
  {
    id: "roadOrCanalLoss",
    title: "공사(사업) 때문에 밭이나 논으로 드나들던 '진입로'나 농사지을 때 쓰던 '물길(수로)'이 없어졌나요?",
    subtitle: "사업으로 인해 도로나 수로가 없어져 농지로서 사용이 불가한지 확인해 주세요.",
    type: "radio" as const,
    showWhen: { questionId: "landType", value: "농지" },
    options: [
      { value: "road", label: "사람이나 농기계가 다니던 길이 없어졌습니다." },
      { value: "canal", label: "농사지을 물을 대던 물길(수로)이 없어졌습니다." },
      { value: "both", label: "길과 물길이 모두 없어졌습니다." },
      { value: "no", label: "아니요, 길과 물길 모두 잘 남아있습니다." },
    ],
  },
  {
    id: "farmMachineDifficulty",
    title: "남은 땅의 모양이 비뚤어지거나 너무 작아져서, 트랙터나 경운기 같은 농기계가 들어가고 돌리기 어려워졌나요?",
    subtitle: "잔여지 형태나 면적으로 인해 농기계 진입 및 회전이 어려운지 확인해 주세요.",
    type: "radio" as const,
    showWhen: { questionId: "landType", value: "농지" },
    options: [
      { value: "yes", label: "네, 땅이 좁거나 꺾여서 농기계를 움직이기 어렵습니다." },
      { value: "no", label: "아니요, 농기계를 사용하는 데 문제없습니다." },
    ],
  },
  // ===== 산지 확인 항목 (판독 일부 지원) =====
  {
    id: "forestRoadLoss",
    title: "원래는 도로와 바로 연결되어 있던 산(임야)이었는데, 공사(사업) 이후 산으로 들어가는 길이 끊어지거나 없어졌나요?",
    subtitle: "산지가 도로와 접하였다가 사업으로 인해 접한 도로가 없어졌는지 확인해 주세요.",
    type: "radio" as const,
    showWhen: { questionId: "landType", value: "산지" },
    options: [
      { value: "yes", label: "네, 산으로 연결되던 길이 없어졌습니다." },
      { value: "no", label: "아니요, 산으로 들어가는 길이 그대로 있습니다." },
    ],
  },
  // ===== 그 밖의 토지 확인 항목 (판독 일부 지원) =====
  {
    id: "otherRoadLoss",
    title: "사업으로 인해 접면도로가 상실되었나요?",
    subtitle: "기존에 접해 있던 도로가 사업으로 인해 없어졌는지 확인해 주세요.",
    type: "radio" as const,
    showWhen: { questionId: "landType", value: "기타" },
    options: [
      { value: "yes", label: "네, 접면도로가 상실되었습니다." },
      { value: "no", label: "아니요, 접면도로 유지" },
    ],
  },
  {
    id: "otherLandUseDifficult",
    title: "종래의 목적대로 사용이 곤란한가요?",
    subtitle: "잔여지의 위치, 형상, 접근 상태를 고려하여 기존 용도 사용이 어려운지 확인해 주세요.",
    type: "radio" as const,
    showWhen: { questionId: "landType", value: "기타" },
    options: [
      { value: "yes", label: "네, 종래 목적 사용이 곤란합니다." },
      { value: "no", label: "아니요, 기존 용도 사용 가능" },
    ],
  },
];

interface NewApplicationFlowProps {
  onComplete: (application: Application) => void;
  onCancel: () => void;
}

// 장바구니 아이템 타입
interface CartItem {
  id: string;
  parcel: typeof myParcels[0];
  answers: Record<string, string>;
  aiResult: { judgment: string; score: number; reasoning: string };
  addedAt: Date;
  reason?: string; // 필지별 신청사유
  attachments?: File[]; // 필지별 첨부서류
}

type FlowStep = "select" | "questions" | "analysis" | "decision" | "application" | "complete";

export function NewApplicationFlow({ onComplete, onCancel }: NewApplicationFlowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<FlowStep>("select");
  const [selectedParcel, setSelectedParcel] = useState<typeof myParcels[0] | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiResult, setAiResult] = useState<{ judgment: string; score: number; reasoning: string } | null>(null);
  const [applicationForm, setApplicationForm] = useState({
    contact: user?.contact || "",
    postalCode: "",
    address: "",
    addressDetail: "",
    reason: "",
    attachments: [] as File[],
  });
  
  // 장바구니 상태
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCartItems, setSelectedCartItems] = useState<Set<string>>(new Set());
  const [expandedCartItem, setExpandedCartItem] = useState<string | null>(null); // 펼쳐진 필지 ID
  const [isTransitioning, setIsTransitioning] = useState(false); // 페이드 트랜지션 상태

  // 검색 필터링된 잔여지 목록
  const filteredParcels = useMemo(() => {
    if (!searchQuery.trim()) return myParcels;
    const query = searchQuery.toLowerCase();
    return myParcels.filter(
      parcel => parcel.address.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // 다음 주소 검색 API 호출
  const openAddressSearch = () => {
    if (typeof window !== "undefined" && (window as any).daum?.Postcode) {
      new (window as any).daum.Postcode({
        oncomplete: function(data: any) {
          // 도로명 주소 또는 지번 주소 사용
          const fullAddress = data.roadAddress || data.jibunAddress;
          const zonecode = data.zonecode;
          
          setApplicationForm(prev => ({
            ...prev,
            zipCode: zonecode,
            address: fullAddress,
            addressDetail: ""
          }));
        }
      }).open();
    } else {
      toast({
        title: "주소 검색 서비스 로딩 중",
        description: "잠시 후 다시 시도해 주세요.",
        variant: "destructive"
      });
    }
  };

  // 조건부 질문 필터링 (showWhen 조건에 맞는 질문만 표시)
  const activeQuestions = useMemo(() => {
    return questions.filter(q => {
      if (!q.showWhen) return true;
      return answers[q.showWhen.questionId] === q.showWhen.value;
    });
  }, [answers]);

  // 잔여지 선택
  const handleSelectParcel = (parcel: typeof myParcels[0]) => {
    setSelectedParcel(parcel);
  };

  // 다음 단계로
  const handleNext = async () => {
    if (step === "select" && selectedParcel) {
      setStep("questions");
    } else if (step === "questions") {
      if (currentQuestion < activeQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        // 모든 질문 완료 -> AI 분석 시작
        setStep("analysis");
        setIsAnalyzing(true);
        
        // AI 분석 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // 랜덤하게 결과 생성 (데모용)
        const isPositive = Math.random() > 0.3;
        setAiResult({
          judgment: isPositive ? "매수 가능성 높음" : "매수 가능성 낮음",
          score: isPositive ? Math.floor(Math.random() * 20) + 75 : Math.floor(Math.random() * 30) + 30,
          reasoning: isPositive 
            ? "잔여지 면적이 최소 기준을 충족하며, 도로 접근성 저하로 인한 활용도 감소가 인정됩니다. 주변 유사 사례와 비교 시 매수 가능성이 높은 것으로 분석됩니다."
            : "잔여지 면적이 독립 활용 가능한 수준으로 판단되며, 현재 용도로 계속 활용 가능한 것으로 보입니다. 다만, 추가 서류 제출 시 재검토가 가능합니다.",
        });
        setIsAnalyzing(false);
      }
    } else if (step === "decision") {
      setStep("application");
    } else if (step === "application") {
      handleSubmit();
    }
  };

  // 이전 단계로
  const handleBack = () => {
    if (step === "questions") {
      if (currentQuestion > 0) {
        setCurrentQuestion(prev => prev - 1);
      } else {
        setStep("select");
      }
    } else if (step === "analysis" && !isAnalyzing) {
        setCurrentQuestion(activeQuestions.length - 1);
      setStep("questions");
    } else if (step === "decision") {
      setStep("analysis");
    } else if (step === "application") {
      setStep("decision");
    }
  };

  // 답변 저장 (해당 질문에 종속된 하위 질문 답변 초기화)
  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: value };
      
      // 해당 질문에 종속된 질문들의 답변 초기화
      questions.forEach(q => {
        if (q.showWhen?.questionId === questionId) {
          delete newAnswers[q.id];
          // 2단계 종속 질문도 초기화 (예: residentialType은 buildingType에 종속)
          questions.forEach(subQ => {
            if (subQ.showWhen?.questionId === q.id) {
              delete newAnswers[subQ.id];
            }
          });
        }
      });
      
      return newAnswers;
    });
  };

  // 초기 화면으로 이동 (No 선택 시)
  const handleDeclineAndReset = () => {
    setStep("select");
    setSelectedParcel(null);
    setCurrentQuestion(0);
    setAnswers({});
    setAiResult(null);
    setApplicationForm({ contact: user?.contact || "", postalCode: "", address: "", addressDetail: "", reason: "", attachments: [] });
  };

  // 신청 제출
  const handleSubmit = () => {
    // 장바구니에서 일괄 신청하는 경우
    if (selectedCartItems.size > 0) {
      const selectedItems = cartItems.filter(item => selectedCartItems.has(item.id));
      const firstItem = selectedItems[0];
      
      const _area = firstItem.parcel.area ?? 0;
      const _remaining = firstItem.parcel.remainingArea ?? 0;
      const landInfo: LandInfo = {
        id: firstItem.parcel.id,
        address: firstItem.parcel.address,
        originalArea: _area,
        includedArea: _area - _remaining,
        remainingArea: _remaining,
        remainingRatio: _area > 0 ? Math.round((_remaining / _area) * 1000) / 10 : 0,
        landType: "택지",
        landCategory: firstItem.parcel.landCategory,
        originalShape: "정방형",
        remainingShape: "부정형",
        originalShapeIndex: 1.0,
        remainingShapeIndex: 5.0,
        ownerName: firstItem.parcel.ownerName,
        hasIncludedLand: true,
        projectName: firstItem.parcel.projectName,
      };

      const aiResultData: AIAnalysisResult = {
        landTypePath: "택지",
        criteriaChecks: [],
        provisionalJudgment: firstItem.aiResult.judgment === "매수 가능성 높음" ? "수용가능" : "수용불가",
        originalShapeIndex: 1.0,
        remainingShapeIndex: 5.0,
        shapeIndexChange: 4.0,
        isBlindLand: false,
        accessRoadLost: false,
        waterChannelLost: false,
        farmMachineDifficulty: false,
        judgmentRationale: {
          summary: firstItem.aiResult.reasoning || "",
          legalBasis: "",
          appliedCriteria: [],
          detailedExplanation: firstItem.aiResult.reasoning || "",
        },
      };

      const application: Application = {
        id: `APP-${Date.now()}`,
        applicationNumber: `2026-${Date.now().toString().slice(-6)}`,
        applicationType: "단일",
        applicantName: user?.name || firstItem.parcel.ownerName,
        applicantContact: applicationForm.contact,
        applicantAddress: applicationForm.address || "",
        landInfo,
        actualUsage: "대",
        reportedShape: "정방형",
        reason: `[${selectedItems.length}건 일괄 신청]\n${selectedItems.map(item => item.parcel.address).join('\n')}\n\n${applicationForm.reason}`,
        attachments: [],
        status: "검토중",
        adminStatus: "신청접수",
        appliedAt: new Date().toISOString(),
        aiResult: aiResultData,
      };

      // 신청한 항목 장바구니에서 제거
      setCartItems(prev => prev.filter(item => !selectedCartItems.has(item.id)));
      setSelectedCartItems(new Set());
      
      setStep("complete");
      return;
    }

    // 단일 분석에서 신청하는 경우
    if (!selectedParcel || !aiResult) return;

    const _area2 = selectedParcel.area ?? 0;
    const _remaining2 = selectedParcel.remainingArea ?? 0;
    const landInfo: LandInfo = {
      id: selectedParcel.id,
      address: selectedParcel.address,
      originalArea: _area2,
      includedArea: _area2 - _remaining2,
      remainingArea: _remaining2,
      remainingRatio: _area2 > 0 ? Math.round((_remaining2 / _area2) * 1000) / 10 : 0,
      landType: "택지",
      landCategory: selectedParcel.landCategory,
      originalShape: "정방형",
      remainingShape: "부정형",
      originalShapeIndex: 1.0,
      remainingShapeIndex: 5.0,
      ownerName: selectedParcel.ownerName,
      hasIncludedLand: true,
      projectName: selectedParcel.projectName,
    };

    const aiResultData: AIAnalysisResult = {
      provisionalJudgment: aiResult.judgment === "매수 가능성 높음" ? "수용가능" : "수용불가",
      confidenceScore: aiResult.score,
      reasoning: aiResult.reasoning,
      comparisonCases: [],
      reviewDate: new Date().toISOString(),
      reviewerId: "AI-SYSTEM",
    };

    const application: Application = {
      id: `APP-${Date.now()}`,
      applicantName: user?.name || selectedParcel.ownerName,
      applicantContact: applicationForm.contact,
      applicantEmail: "",
      applicationDate: new Date().toISOString(),
      status: "검토중",
      landInfo,
      aiResult: aiResultData,
      documents: [],
      additionalNotes: applicationForm.reason,
    };

    setStep("complete");
  };

  // 다른 잔여지 분석을 위해 초기화 (장바구니 유지)
  const handleReset = () => {
    setStep("select");
    setSelectedParcel(null);
    setCurrentQuestion(0);
    setAnswers({});
    setAiResult(null);
    setApplicationForm({ contact: user?.contact || "", postalCode: "", address: "", addressDetail: "", reason: "", attachments: [] });
  };

  // 매수신청 목록에 추가
  const handleAddToCart = () => {
    if (!selectedParcel || !aiResult) return;
    
    const newItem: CartItem = {
      id: `cart-${Date.now()}`,
      parcel: selectedParcel,
      answers: { ...answers },
      aiResult: { ...aiResult },
      addedAt: new Date(),
    };
    
    setCartItems(prev => [...prev, newItem]);
    
    toast({
      title: "매수신청 목록에 추가되었습니다",
      description: `${selectedParcel.address.split(' ').slice(0, 3).join(' ')} 외 잔여지가 신청 목록에 담겼습니다.`,
      duration: 3500,
    });
    
    // 페이드아웃 -> 초기화 -> 페이드인 트랜지션
    setIsTransitioning(true);
    setTimeout(() => {
      handleReset();
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 300);
  };

  // 장바구니에서 삭제
  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    setSelectedCartItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  // 장바구니 선택 항목 일괄 신청
  const handleSubmitFromCart = () => {
    const selectedItems = cartItems.filter(item => selectedCartItems.has(item.id));
    if (selectedItems.length === 0) return;
    
    // 신청서 작성 단계로 이동 (장바구니에서)
    setStep("application");
    setIsCartOpen(false);
  };

  // 현재 질문에 대한 답변이 있는지 확인
  const currentQuestionData = activeQuestions[currentQuestion];
  const hasAnswer = currentQuestionData ? !!answers[currentQuestionData.id] : false;

  // 스텝 정보 정의
  const steps = [
    { id: "select", label: "잔여지 선택", icon: MapPin },
    { id: "questions", label: "정보 입력", icon: FileText },
    { id: "analysis", label: "AI 분석", icon: Sparkles },
    { id: "application", label: "신청서 작성", icon: ClipboardCheck },
  ];

  // 현재 스텝 인덱스 계산
  const getCurrentStepIndex = () => {
    switch (step) {
      case "select": return 0;
      case "questions": return 1;
      case "analysis": 
      case "decision": return 2;
      case "application": return 3;
      case "complete": return 4;
      default: return 0;
    }
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <>
      {/* 다음 주소 검색 API 스크립트 */}
      <Script 
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" 
        strategy="lazyOnload"
      />
      <div className="max-w-2xl mx-auto pt-10">
      {/* 스텝 인디케이터 */}
      {step !== "complete" && step !== "decision" && (
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.id} className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}>
                {/* 스텝 원형 + 라벨 */}
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      index < currentStepIndex
                        ? "bg-[#2E8B57] text-white"
                        : index === currentStepIndex
                        ? "bg-[#2E8B57] text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <s.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium whitespace-nowrap ${
                    index <= currentStepIndex ? "text-[#2E8B57]" : "text-gray-400"
                  }`}>
                    {s.label}
                  </span>
                </div>
                
                {/* 연결선 (마지막 아이템 제외) */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-3 mt-[-20px]">
                    <div className={`h-1 rounded-full transition-all ${
                      index < currentStepIndex ? "bg-[#2E8B57]" : "bg-gray-200"
                    }`} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 질문 진행 상황 (질문 단계일 때만) */}
          {step === "questions" && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 font-medium">질문 {currentQuestion + 1} / {activeQuestions.length}</span>
                <span className="text-[#2E8B57] font-medium">{Math.round(((currentQuestion + 1) / activeQuestions.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#2E8B57] transition-all duration-300 ease-out"
                  style={{ width: `${((currentQuestion + 1) / activeQuestions.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 1: 잔여지 선택 */}
      {step === "select" && (
        <div className={`space-y-6 transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              매수 신청할 잔여지를 선택해 주세요
            </h2>
            <p className="text-gray-500">
              본인 소유의 잔여지 목록입니다. 신청할 토지를 선택해 주세요.
            </p>
          </div>

          {/* 검색바 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="주소로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          {/* 잔여지 개수 표시 */}
          <div className="text-sm text-gray-500">
            <span>총 {filteredParcels.length}개의 잔여지</span>
          </div>

          {/* 잔여지 카드 그리드 */}
          <div className="max-h-[400px] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredParcels.map((parcel) => {
                const isApplied = parcel.applicationStatus === "신청완료";
                const isInCart = cartItems.some(item => item.parcel.id === parcel.id);
                const isSelected = selectedParcel?.id === parcel.id;
                return (
                  <Card
                    key={parcel.id}
                    className={`p-4 transition-all border ${
                      isApplied
                        ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-70"
                        : isSelected
                    ? "border-[#2E8B57] bg-green-50 cursor-pointer"
                    : "border-gray-200 hover:border-gray-300 cursor-pointer"
                    }`}
                    onClick={() => !isApplied && handleSelectParcel(parcel)}
                  >
                    <div className="flex items-start gap-3">
                      {/* 선택 인디케이터 (라디오 스타일) */}
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isApplied
                          ? "border-gray-300 bg-gray-200"
                          : isSelected
                            ? "border-[#2E8B57] bg-[#2E8B57]"
                            : "border-gray-300"
                      }`}>
                        {!isApplied && isSelected && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>

                      {/* 토지 정보 */}
                      <div className="flex-1 min-w-0">
                        {/* 상단: 프로젝트명(좌), 신청완료/목록담김(우) */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs text-gray-600 truncate max-w-[180px]">
                            {parcel.projectName}
                          </span>
                          {isApplied ? (
                            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium flex-shrink-0">
                              신청완료
                            </span>
                          ) : isInCart ? (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium flex-shrink-0">
                              목록담김
                            </span>
                          ) : null}
                        </div>
                        {/* 중단: 주소 */}
                        <h3 className={`font-medium text-sm mb-2 line-clamp-2 ${isApplied ? "text-gray-500" : "text-gray-900"}`}>
                          {parcel.address}
                        </h3>
                        {/* 하단: 잔여 면적 + 지목 배지 */}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>잔여 {parcel.remainingArea}m<sup>2</sup></span>
                          <span className="w-px h-2 bg-gray-200"></span>
                          <span className="text-gray-500">
                            {parcel.landCategory}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {filteredParcels.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">검색 결과가 없습니다</p>
              <p className="text-sm mt-1">다른 검색어로 시도해 보세요</p>
            </div>
          )}

          <div className="flex justify-end pt-6">
            <Button
              onClick={handleNext}
              disabled={!selectedParcel}
              className="bg-[#2E8B57] hover:bg-[#256b45] text-white px-8 py-6 text-lg rounded-xl"
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: 질문 단계 */}
      {step === "questions" && currentQuestionData && (
        <div className="space-y-8">
          {/* 뒤로가기 */}
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>이전</span>
          </button>

          {/* 질문 */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentQuestionData.title}
            </h2>
            <p className="text-gray-500">
              {currentQuestionData.subtitle}
            </p>
          </div>

          {/* 답변 옵션 */}
          <div className="space-y-3">
            {currentQuestionData.type === "radio" && currentQuestionData.options && (
              (currentQuestionData as any).layout === "segment" ? (
                <div className="flex gap-3">
                  {currentQuestionData.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAnswer(currentQuestionData.id, option.value)}
                      className={`flex-1 py-4 px-6 rounded-xl border-2 text-base font-medium transition-all ${
                        answers[currentQuestionData.id] === option.value
                          ? "border-[#2E8B57] bg-[#2E8B57] text-white"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : (
                <RadioGroup
                  value={answers[currentQuestionData.id] || ""}
                  onValueChange={(value) => handleAnswer(currentQuestionData.id, value)}
                  className="grid gap-3"
                >
                  {currentQuestionData.options.map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={option.value}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        answers[currentQuestionData.id] === option.value
                          ? "border-[#2E8B57] bg-green-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        answers[currentQuestionData.id] === option.value
                          ? "border-[#2E8B57] bg-[#2E8B57]"
                          : "border-gray-300"
                      }`}>
                        {answers[currentQuestionData.id] === option.value && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="text-gray-900">{option.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              )
            )}

            {currentQuestionData.type === "textarea" && (
              <Textarea
                value={answers[currentQuestionData.id] || ""}
                onChange={(e) => handleAnswer(currentQuestionData.id, e.target.value)}
                placeholder={currentQuestionData.placeholder}
                className="min-h-[150px] text-lg p-4 rounded-xl border border-gray-200 focus:border-[#2E8B57] focus:ring-[#2E8B57]"
              />
            )}
          </div>

          <div className="flex justify-end pt-6">
            <Button
              onClick={handleNext}
              disabled={!hasAnswer}
              className="bg-[#2E8B57] hover:bg-[#256b45] text-white px-8 py-6 text-lg rounded-xl"
            >
                {currentQuestion === activeQuestions.length - 1 && hasAnswer ? "AI 분석 시작" : "다음"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: AI 분석 결과 */}
      {step === "analysis" && (
        <div className="space-y-8">
          {isAnalyzing ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
                <div className="absolute inset-0 border-4 border-[#2E8B57] rounded-full border-t-transparent animate-spin" />
                <Sparkles className="w-8 h-8 text-[#2E8B57] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                AI가 분석 중입니다
              </h2>
              <p className="text-gray-500">
                입력하신 정보를 바탕으로 매수 가능성을 분석하고 있어요.<br />
                잠시만 기다려 주세요.
              </p>
            </div>
          ) : aiResult && (
            <div className={`space-y-6 transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
              {/* 뒤로가기 */}
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>이전</span>
              </button>

              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  AI 분석 결과
                </h2>
                <p className="text-gray-500">
                  입력하신 정보를 바탕으로 분석한 결과입니다
                </p>
              </div>

              {/* 통합된 분석 결과 카드 */}
              {selectedParcel && (
                <Card className="p-6 border border-gray-200">
                  {/* 토지 정보 헤더 */}
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">분석 대상 토지</h3>
                      <Badge className={`px-2 py-1 text-sm font-medium ${
                        aiResult.judgment === "매수 가능성 높음"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-rose-100 text-rose-700 border border-rose-200"
                      }`}>
                        {aiResult.judgment === "매수 가능성 높음" ? (
                          <Check className="w-4 h-4 mr-1 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-1 inline" />
                        )}
                        {aiResult.judgment}
                      </Badge>
                    </div>
                    <p className="text-gray-700 font-medium">{selectedParcel.address}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      잔여 면적: {selectedParcel.remainingArea}m<sup>2</sup> | {selectedParcel.landCategory} | {selectedParcel.roadContact}
                    </p>
                  </div>

                  {/* 상세 분석 정보 */}
                  <div className="mb-4 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">분석 세부 내용</h4>
                    
                    {/* 토지 유형 및 면적 기준 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">토지 유형</p>
                        <p className="text-sm font-medium text-gray-900">{selectedParcel.landCategory}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">잔여 면적</p>
                        <p className="text-sm font-medium text-gray-900">{selectedParcel.remainingArea}m<sup>2</sup></p>
                      </div>
                    </div>

                    {/* 면적 기준 충족 여부 */}
                    <div className={`rounded-lg p-3 border ${
                      aiResult.judgment === "매수 가능성 높음" 
                        ? "bg-emerald-50 border-emerald-200" 
                        : "bg-gray-50 border-gray-200"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">면적 기준 충족 여부</p>
                          <p className="text-sm text-gray-700">
                            {selectedParcel.landCategory === "대" ? "택지 기준: 90m² 이하" : 
                             selectedParcel.landCategory === "전" || selectedParcel.landCategory === "답" ? "농지 기준: 330m² 이하" :
                             selectedParcel.landCategory === "임" ? "산지 기준: 330m² 이하" : "기준: 330m² 이하"}
                          </p>
                        </div>
                        {aiResult.judgment === "매수 가능성 높음" ? (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">충족</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 text-xs">미충족</Badge>
                        )}
                      </div>
                    </div>

                    {/* 물리적 조건 검토 */}
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">물리적 조건 검토</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={`rounded-lg p-2 border text-xs ${
                          answers.roadStatusChange === "yes" 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                            : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}>
                          <div className="flex items-center gap-1">
                            {answers.roadStatusChange === "yes" ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            <span>도로 변경으로 건축 불가</span>
                          </div>
                        </div>
                        <div className={`rounded-lg p-2 border text-xs ${
                          answers.shapeChange === "yes" 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                            : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}>
                          <div className="flex items-center gap-1">
                            {answers.shapeChange === "yes" ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            <span>형상 부정형 변경</span>
                          </div>
                        </div>
                        {(selectedParcel.landCategory === "전" || selectedParcel.landCategory === "답") && (
                          <>
                            <div className={`rounded-lg p-2 border text-xs ${
                              answers.waterChannelLost === "yes" 
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                                : "bg-gray-50 border-gray-200 text-gray-600"
                            }`}>
                              <div className="flex items-center gap-1">
                                {answers.waterChannelLost === "yes" ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                <span>물길(수로) 상실</span>
                              </div>
                            </div>
                            <div className={`rounded-lg p-2 border text-xs ${
                              answers.farmMachineDifficulty === "yes" 
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                                : "bg-gray-50 border-gray-200 text-gray-600"
                            }`}>
                              <div className="flex items-center gap-1">
                                {answers.farmMachineDifficulty === "yes" ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                <span>농기계 사용 어려움</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI 종합 의견 */}
                  {aiResult.judgment === "매수 가능성 높음" ? (
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">AI 종합 의견</p>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {aiResult.reasoning}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-rose-50 border border-rose-100">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">AI 종합 의견</p>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {aiResult.reasoning}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* AI 분석 활용 안내 */}
              <div className="flex items-start gap-2.5 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
                <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  ※ 본 분석 결과는 AI를 활용한 기초 판정으로, 담당자의 실제 현장 심사 및 관련 법규 검토 결과와는 다를 수 있으며, 신청 참고용으로 법적 효력을 가지지 않습니다.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 h-12 text-base rounded-xl flex-1"
                >
                  다른 잔여지 분석하기
                </Button>
                <Button
                  onClick={handleAddToCart}
                  className="bg-[#2E8B57] hover:bg-[#256b45] text-white h-12 text-base rounded-xl flex-1"
                >
                  <ClipboardList className="w-5 h-5 mr-2" />
                  매수신청 목록에 추가
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: 진행 여부 확인 */}
      {step === "decision" && (
        <div className="space-y-8">
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              매수 신청을 진행하시겠습니까?
            </h2>
            <p className="text-gray-500">
              AI 분석 결과를 확인하셨습니다.<br />
              매수 신청서를 작성하시겠습니까?
            </p>
          </div>

          {/* AI 결과 요약 */}
          {aiResult && (
            <Card className={`p-4 border ${
              aiResult.judgment === "매수 가능성 높음" 
                ? "border-emerald-200 bg-emerald-50" 
                : "border-rose-200 bg-rose-50"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  aiResult.judgment === "매수 가능성 높음"
                    ? "bg-emerald-500"
                    : "bg-rose-500"
                }`}>
                  {aiResult.judgment === "매수 가능성 높음" ? (
                    <Check className="w-5 h-5 text-white font-bold" />
                  ) : (
                    <XCircle className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <p className={`font-semibold ${
                    aiResult.judgment === "매수 가능성 높음"
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}>
                    {aiResult.judgment}
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleDeclineAndReset}
              variant="outline"
              className="flex-1 py-6 text-lg rounded-xl border"
            >
              아니오, 다시 선택할게요
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 bg-[#2E8B57] hover:bg-[#256b45] text-white py-6 text-lg rounded-xl"
            >
              네, 신청할게요
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: 신청서 양식 */}
      {step === "application" && (selectedParcel || selectedCartItems.size > 0) && (
        <div className="space-y-8">
          {/* 뒤로가기 */}
          <button
            onClick={() => {
              if (selectedCartItems.size > 0) {
                setIsCartOpen(true);
                setStep("select");
              } else {
                handleBack();
              }
            }}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>이전</span>
          </button>

          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              신청서를 작성해 주세요
            </h2>
            <p className="text-gray-500">
              {selectedCartItems.size > 0 
                ? `${selectedCartItems.size}건의 잔여지를 일괄 신청합니다.`
                : "마지막 단계입니다. 연락처 정보를 입력해 주세요."
              }
            </p>
          </div>

          {/* 신청자 정보 */}
          <Card className="p-5 border border-gray-200 mb-[18px]">
            <h3 className="font-semibold text-gray-900 mb-4">신청자 정보</h3>
            <div className="space-y-4">
              <div>
                <FormLabel className="text-gray-600 mb-1.5 block">신청자명</FormLabel>
                <Input
                  value={user?.name || selectedParcel?.ownerName || cartItems[0]?.parcel.ownerName || ""}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <FormLabel className="text-gray-600 mb-1.5 block">연락처 *</FormLabel>
                <Input
                  placeholder="010-0000-0000"
                  value={applicationForm.contact}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, contact: e.target.value }))}
                />
              </div>
              <div>
                <FormLabel className="text-gray-600 mb-1.5 block">주소 <span className="text-orange-500">*</span></FormLabel>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="우편번호"
                      value={applicationForm.postalCode || ""}
                      disabled
                      className="w-32 bg-gray-50"
                    />
                    <Button
                      type="button"
                      onClick={openAddressSearch}
                      className="bg-gray-900 hover:bg-gray-800 text-white px-4"
                    >
                      주소 검색
                    </Button>
                  </div>
                  <Input
                    placeholder="기본주소"
                    value={applicationForm.address}
                    disabled
                    className="bg-gray-50"
                  />
                  <Input
                    placeholder="상세주소를 입력해주세요"
                    value={applicationForm.addressDetail || ""}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, addressDetail: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* 토지 정보 */}
          <Card className="p-5 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">
              필지 정보 
              {selectedCartItems.size > 0 && (
                <span className="ml-2 text-[#2E8B57] font-normal">({selectedCartItems.size}건)</span>
              )}
            </h3>
            <div className="space-y-4">
              {/* 장바구니에서 신청하는 경우 - 각 필��별로 토지��보 작성 */}
              {selectedCartItems.size > 0 ? (
                <div className="space-y-3">
                  {cartItems
                    .filter(item => selectedCartItems.has(item.id))
                    .map((item, index) => {
                      const isPositive = item.aiResult.judgment === "매수 가능성 높음";
                      const isExpanded = expandedCartItem === item.id;
                      const landType = item.answers.landType || "택지";
                      
                      return (
                        <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* 필지 헤더 - 클릭하면 펼침/접힘 */}
                          <div 
                            className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => setExpandedCartItem(isExpanded ? null : item.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded">
                                  필지 {index + 1}
                                </span>
                                <p className="text-sm font-medium text-gray-900 truncate max-w-[300px]">
                                  {item.parcel.address}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs text-white ${isPositive ? "bg-emerald-500" : "bg-rose-500"}`}>
                                  {isPositive ? "매수 가능" : "매수 불가"}
                                </Badge>
                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <span>잔여: {item.parcel.remainingArea}m<sup>2</sup></span>
                              <span className="w-px h-2 bg-gray-300"></span>
                              <span>{item.parcel.landCategory}</span>
                              <span className="w-px h-2 bg-gray-300"></span>
                              <span>{item.parcel.roadContact}</span>
                            </div>
                          </div>
                          
                          {/* 필지 상세 정보 - 펼쳐진 경우에만 표시 */}
                          {isExpanded && (
                            <div className="p-4 space-y-4 border-t border-gray-200">
                              {/* AI 자동 입력 안내 */}
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                                <p className="text-xs text-blue-700">
                                  💡 해당 항목들은 AI 분석 결과로 자동 입력되어 있으며, 필요시 수정 가능합니다.
                                </p>
                              </div>
                              
                              {/* 활용 지목 + 공부상 지목 */}
                              <div className="flex gap-4">
                                <div className="flex-1">
                                  <FormLabel className="text-gray-600 mb-1.5 block">활용 지목 <span className="text-orange-500">*</span></FormLabel>
                                  <select
                                    value={landType}
                                    onChange={(e) => {
                                      setCartItems(prev => prev.map(ci => 
                                        ci.id === item.id 
                                          ? { ...ci, answers: { ...ci.answers, landType: e.target.value } }
                                          : ci
                                      ));
                                    }}
                                    className="w-full h-12 px-3 py-2 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2E8B57] focus:border-transparent"
                                  >
                                    <option value="택지">대(택지)</option>
                                    <option value="농지">답(논)</option>
                                    <option value="산지">임(산지)</option>
                                    <option value="기타">그 밖의 토지</option>
                                  </select>
                                  <p className="text-xs text-gray-500 mt-1">AI 판단: {item.parcel.landCategory}({landType})</p>
                                </div>
                                <div className="flex-1">
                                  <FormLabel className="text-gray-600 mb-1.5 block">공부상 지목</FormLabel>
                                  <Input
                                    value={`${item.parcel.landCategory}(택지)`}
                                    disabled
                                    className="bg-gray-100 text-gray-500"
                                  />
                                </div>
                              </div>
                              
                              {/* 확인 항목 - 체크박스 가로 배치 */}
                              <div>
                                <FormLabel className="text-gray-900 mb-1 block">확인 항목</FormLabel>
                                <p className="text-xs text-gray-500 mb-3">AI가 자동 판독할 수 없는 사항입니다. 해당되는 경우 체크해 주세요.</p>
                                <div className="flex flex-wrap gap-6">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={item.answers.roadLoss === "yes"}
                                      onChange={(e) => {
                                        setCartItems(prev => prev.map(ci => 
                                          ci.id === item.id 
                                            ? { ...ci, answers: { ...ci.answers, roadLoss: e.target.checked ? "yes" : "no" } }
                                            : ci
                                        ));
                                      }}
                                      className="w-5 h-5 rounded border-gray-300 text-[#2E8B57] focus:ring-[#2E8B57]"
                                    />
                                    <span className="text-sm text-gray-700">접면도로 상실</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={item.answers.waterChannelLost === "yes"}
                                      onChange={(e) => {
                                        setCartItems(prev => prev.map(ci => 
                                          ci.id === item.id 
                                            ? { ...ci, answers: { ...ci.answers, waterChannelLost: e.target.checked ? "yes" : "no" } }
                                            : ci
                                        ));
                                      }}
                                      className="w-5 h-5 rounded border-gray-300 text-[#2E8B57] focus:ring-[#2E8B57]"
                                    />
                                    <span className="text-sm text-gray-700">관개수로 상실</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={item.answers.farmMachineDifficulty === "yes"}
                                      onChange={(e) => {
                                        setCartItems(prev => prev.map(ci => 
                                          ci.id === item.id 
                                            ? { ...ci, answers: { ...ci.answers, farmMachineDifficulty: e.target.checked ? "yes" : "no" } }
                                            : ci
                                        ));
                                      }}
                                      className="w-5 h-5 rounded border-gray-300 text-[#2E8B57] focus:ring-[#2E8B57]"
                                    />
                                    <span className="text-sm text-gray-700">농기계 사용 어려움</span>
                                  </label>
                                </div>
                              </div>
                              
                              {/* 필지별 신청 사유 */}
                              <div>
                                <FormLabel className="text-gray-600 mb-1.5 block">신청 사유</FormLabel>
                                <Textarea
                                  placeholder="이 필지의 매수 신청 사유를 작성해 주세요."
                                  value={item.reason || ""}
                                  onChange={(e) => {
                                    setCartItems(prev => prev.map(ci => 
                                      ci.id === item.id 
                                        ? { ...ci, reason: e.target.value }
                                        : ci
                                    ));
                                  }}
                                  className="min-h-[80px]"
                                />
                              </div>
                              
                              {/* 필지별 첨부서류 */}
                              <div>
                                <FormLabel className="text-gray-600 mb-1.5 block">첨부서류</FormLabel>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                                  <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    id={`file-upload-${item.id}`}
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files || []);
                                      setCartItems(prev => prev.map(ci => 
                                        ci.id === item.id 
                                          ? { ...ci, attachments: [...(ci.attachments || []), ...files] }
                                          : ci
                                      ));
                                    }}
                                  />
                                  <label htmlFor={`file-upload-${item.id}`} className="cursor-pointer">
                                    <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-600">클릭하여 파일 업로드</p>
                                    <p className="text-xs text-gray-400 mt-1">토지대장, 등기부등본 등</p>
                                  </label>
                                </div>
                                {/* 업로드된 파일 목록 */}
                                {item.attachments && item.attachments.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {item.attachments.map((file, fileIndex) => (
                                      <div key={fileIndex} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                                        <span className="truncate flex-1">{file.name}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCartItems(prev => prev.map(ci => 
                                              ci.id === item.id 
                                                ? { ...ci, attachments: ci.attachments?.filter((_, i) => i !== fileIndex) }
                                                : ci
                                            ));
                                          }}
                                          className="text-gray-400 hover:text-red-500 ml-2"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                /* 단일 분석에서 신청하는 경우 */
                <>
                  <div>
                    <FormLabel className="text-gray-600 mb-1.5 block">대상 토지</FormLabel>
                    <Input
                      value={selectedParcel?.address || ""}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      잔여 면적: {selectedParcel?.remainingArea}m<sup>2</sup> | {selectedParcel?.landCategory} | {selectedParcel?.roadContact}
                    </p>
                  </div>
                  
                  {/* AI 자동 입력 안내 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                    <p className="text-xs text-blue-700">
                      💡 해당 항목들은 AI 분석 결과로 자동 입력되어 있으며, 필요시 수정 가능합니다.
                    </p>
                  </div>
                  
                  {/* 활용 지목 + 공부상 지목 */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <FormLabel className="text-gray-600 mb-1.5 block">활용 지목 <span className="text-orange-500">*</span></FormLabel>
                      <select
                        value={answers.landType || "택지"}
                        onChange={(e) => setAnswers(prev => ({ ...prev, landType: e.target.value }))}
                        className="w-full h-12 px-3 py-2 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2E8B57] focus:border-transparent"
                      >
                        <option value="택지">대(택지)</option>
                        <option value="농지">답(논)</option>
                        <option value="산지">임(산지)</option>
                        <option value="기타">그 밖의 토지</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">AI 판단: {selectedParcel?.landCategory}({answers.landType || "택지"})</p>
                    </div>
                    <div className="flex-1">
                      <FormLabel className="text-gray-600 mb-1.5 block">공부상 지목</FormLabel>
                      <Input
                        value={`${selectedParcel?.landCategory}(택지)`}
                        disabled
                        className="bg-gray-100 text-gray-500"
                      />
                    </div>
                  </div>
                  
                  {/* 확인 항목 - 체크박스 가로 배치 */}
                  <div>
                    <FormLabel className="text-gray-900 mb-1 block">확인 항목</FormLabel>
                    <p className="text-xs text-gray-500 mb-3">AI가 자동 판독할 수 없는 사항입니다. 해당되는 경우 체크해 주세요.</p>
                    <div className="flex flex-wrap gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={answers.roadLoss === "yes"}
                          onChange={(e) => setAnswers(prev => ({ ...prev, roadLoss: e.target.checked ? "yes" : "no" }))}
                          className="w-5 h-5 rounded border-gray-300 text-[#2E8B57] focus:ring-[#2E8B57]"
                        />
                        <span className="text-sm text-gray-700">접면도로 상실</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={answers.waterChannelLost === "yes"}
                          onChange={(e) => setAnswers(prev => ({ ...prev, waterChannelLost: e.target.checked ? "yes" : "no" }))}
                          className="w-5 h-5 rounded border-gray-300 text-[#2E8B57] focus:ring-[#2E8B57]"
                        />
                        <span className="text-sm text-gray-700">관개수로 상실</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={answers.farmMachineDifficulty === "yes"}
                          onChange={(e) => setAnswers(prev => ({ ...prev, farmMachineDifficulty: e.target.checked ? "yes" : "no" }))}
                          className="w-5 h-5 rounded border-gray-300 text-[#2E8B57] focus:ring-[#2E8B57]"
                        />
                        <span className="text-sm text-gray-700">농기계 사용 어려움</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* 신청 사유 */}
                  <div>
                    <FormLabel className="text-gray-600 mb-1.5 block">신청 사유</FormLabel>
                    <Textarea
                      placeholder="잔여지 매수를 신청하시는 사유를 상세히 작성해 주세요."
                      value={applicationForm.reason}
                      onChange={(e) => setApplicationForm(prev => ({ ...prev, reason: e.target.value }))}
                      className="min-h-[120px]"
                    />
                  </div>
                  
                  {/* 단일 필지 첨부서류 */}
                  <div>
                    <FormLabel className="text-gray-600 mb-1.5 block">첨부서류</FormLabel>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        id="file-upload-single"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setApplicationForm(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
                        }}
                      />
                      <label htmlFor="file-upload-single" className="cursor-pointer">
                        <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">클릭하여 파일 업로드</p>
                        <p className="text-xs text-gray-400 mt-1">토지대장, 등기부등본 등</p>
                      </label>
                    </div>
                    {applicationForm.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {applicationForm.attachments.map((file, fileIndex) => (
                          <div key={fileIndex} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                            <span className="truncate flex-1">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => setApplicationForm(prev => ({
                                ...prev,
                                attachments: prev.attachments.filter((_, i) => i !== fileIndex)
                              }))}
                              className="text-gray-400 hover:text-red-500 ml-2"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>

          <div className="flex justify-center">
            <Button
              onClick={handleNext}
              disabled={
                !applicationForm.contact || 
                !applicationForm.address
              }
              className="w-full bg-[#2E8B57] hover:bg-[#256b45] text-white px-8 py-6 text-lg rounded-xl"
            >
              신청 완료
            </Button>
          </div>
        </div>
      )}

      {/* Step 6: 완료 */}
      {step === "complete" && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-[#2E8B57] rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            신청이 완료되었습니다.
          </h2>
          <p className="text-gray-500 mb-8">
            담당자 검토 후 결과를 안내드리겠습니다.<br />
            신청 현황에서 진행 상태를 확인하실 수 있습니다.
          </p>
          <Button
            onClick={onCancel}
            className="bg-[#2E8B57] hover:bg-[#256b45] text-white px-8 py-3 rounded-xl"
          >
            신청현황 조회하기
          </Button>
        </div>
      )}
    </div>

    {/* 매수신청 목록 플로팅 버튼 (신규 신청서 작성 단계에서는 미노출) */}
    {cartItems.length > 0 && !isCartOpen && step !== "application" && (
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 items-center gap-2 rounded-full bg-[#2E8B57] px-5 text-white shadow-lg transition-all hover:bg-[#256b45] hover:shadow-xl animate-float"
      >
        <ClipboardList className="h-5 w-5" />
        <span className="font-medium">매수신청 목록</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-[#2E8B57]">
          {cartItems.length}
        </span>
      </button>
    )}

    {/* 플로팅 버튼 애니메이션 */}
    <style jsx>{`
      @keyframes float {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-6px);
        }
      }
      .animate-float {
        animation: float 3s ease-in-out infinite;
      }
    `}</style>

    {/* 매수신청 목록 슬라이드 패널 */}
    {isCartOpen && (
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* 오버레이 */}
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={() => setIsCartOpen(false)}
        />
        
        {/* 패널 */}
        <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b px-4 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">매수신청 목록</h2>
              <Badge className="bg-[#2E8B57]">{cartItems.length}건</Badge>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 목록 */}
          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-gray-400">
                <ShoppingCart className="mb-2 h-12 w-12 opacity-30" />
                <p>신청 목록이 비어 있습니다</p>
                <p className="mt-1 text-sm">분석 완료 후 담아주세요</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 사업단별로 그룹화 */}
                {(() => {
                  // 사업단별로 그룹화
                  const groupedByProject = cartItems.reduce((acc, item) => {
                    const projectName = item.parcel.projectName;
                    if (!acc[projectName]) {
                      acc[projectName] = [];
                    }
                    acc[projectName].push(item);
                    return acc;
                  }, {} as Record<string, CartItem[]>);

                  // 현재 선택된 사업단 (선택된 항목이 있으면 해당 사업단)
                  const selectedProject = selectedCartItems.size > 0
                    ? cartItems.find(item => selectedCartItems.has(item.id))?.parcel.projectName
                    : null;

                  return Object.entries(groupedByProject).map(([projectName, items]) => {
                    const isProjectDisabled = selectedProject !== null && selectedProject !== projectName;
                    const projectSelectedCount = items.filter(item => selectedCartItems.has(item.id)).length;
                    const allProjectSelected = projectSelectedCount === items.length;
                    
                    return (
                      <div key={projectName} className={`rounded-xl border ${isProjectDisabled ? "border-gray-200 opacity-50" : "border-gray-300"}`}>
                        {/* 사업단 헤더 */}
                        <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl ${isProjectDisabled ? "bg-gray-50" : "bg-gray-100"}`}>
                          <div className="flex items-center gap-3">
                            {!isProjectDisabled && (
                              <Checkbox
                                checked={allProjectSelected}
                                onCheckedChange={(checked) => {
                                  const projectItemIds = items.map(item => item.id);
                                  const newSelected = new Set(selectedCartItems);
                                  if (checked) {
                                    projectItemIds.forEach(id => newSelected.add(id));
                                  } else {
                                    projectItemIds.forEach(id => newSelected.delete(id));
                                  }
                                  setSelectedCartItems(newSelected);
                                }}
                                className="h-5 w-5 border-gray-400 data-[state=checked]:bg-[#2E8B57] data-[state=checked]:border-[#2E8B57]"
                              />
                            )}
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${isProjectDisabled ? "text-gray-400" : "text-gray-900"}`}>{projectName}</span>
                              <Badge variant="outline" className={`text-xs ${isProjectDisabled ? "border-gray-200 text-gray-400" : ""}`}>{items.length}건</Badge>
                            </div>
                          </div>
                          {!isProjectDisabled && items.length > 1 && (
                            <span className="text-xs text-gray-500">
                              {allProjectSelected ? "전체 선택됨" : "일괄 선택 가능"}
                            </span>
                          )}
                        </div>
                        
                        {/* 사업단 내 필지 목록 */}
                        <div className="p-2 space-y-2">
                          {items.map((item) => {
                            const isSelected = selectedCartItems.has(item.id);
                            const isPositive = item.aiResult.judgment === "매수 가능성 높음";
                            return (
                              <div 
                                key={item.id}
                                className={`rounded-lg border p-3 transition-colors ${
                                  isProjectDisabled 
                                    ? "border-gray-100 bg-gray-50 cursor-not-allowed" 
                                    : isSelected 
                                      ? "border-[#2E8B57] bg-green-50" 
                                      : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    checked={isSelected}
                                    disabled={isProjectDisabled}
                                    onCheckedChange={(checked) => {
                                      if (isProjectDisabled) return;
                                      const newSelected = new Set(selectedCartItems);
                                      if (checked) {
                                        newSelected.add(item.id);
                                      } else {
                                        newSelected.delete(item.id);
                                      }
                                      setSelectedCartItems(newSelected);
                                    }}
                                    className="mt-0.5 h-5 w-5 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium line-clamp-2 ${isProjectDisabled ? "text-gray-400" : "text-gray-900"}`}>
                                      {item.parcel.address}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                      <span>잔여: {item.parcel.remainingArea}m<sup>2</sup></span>
                                      <span>|</span>
                                      <span>{item.parcel.landCategory}</span>
                                      <Badge 
                                        className={`text-xs text-white ${isPositive ? "bg-emerald-500" : "bg-rose-500"}`}
                                      >
                                        {isPositive ? "매수 가능성 높음" : "매수 가능성 낮음"}
                                      </Badge>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveFromCart(item.id)}
                                    className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
                
                {/* 안내 메시지 */}
                {selectedCartItems.size > 0 && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                    복수 필지 신청은 같은 사업단 내에서만 가능합니다.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 하단 버튼 */}
          {cartItems.length > 0 && (
            <div className="border-t p-4 space-y-2">
              <Button
                onClick={handleSubmitFromCart}
                disabled={selectedCartItems.size === 0}
                className="w-full bg-[#2E8B57] hover:bg-[#256b45] text-white py-6 text-lg"
              >
                {selectedCartItems.size > 0 
                    ? `선택한 ${selectedCartItems.size}건 신청하기`
                    : "항목을 선택해 주세요"}
              </Button>
            </div>
          )}
        </div>
      </div>
    )}
  </>
  );
}
