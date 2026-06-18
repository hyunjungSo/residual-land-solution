"use client";

import { useState, useMemo } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  RefreshCw,
  Brain,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { SearchInput, RadioFilterGroup } from "@/components/admin/shared";
import { PaginationButton, PaginationNavButton } from "@/components/ui/pagination-button";
import { formatNumber } from "@/lib/format";

// 외부 시스템에서 적재되는 신규 필지 타입
interface IncomingParcel {
  id: string;
  address: string;
  businessUnit: string;
  originalArea: number;
  includedArea: number;
  remainingArea: number;
  remainingRatio: number;
  landType: string;
  loadedAt: string;
  areaAnalysisResult: "초과" | "이하" | "미분석";
  status: "신규" | "검토중" | "확정" | "제외";
  aiAnalysisStatus?: "대기" | "분석중" | "완료";
  aiResult?: "해당" | "미해당";
}

// 더미 데이터: 외부 시스템에서 적재된 신규 필지
const dummyIncomingParcels: IncomingParcel[] = [
  {
    id: "INC001",
    address: "경기도 화성시 봉담읍 동화리 123",
    businessUnit: "화성평택",
    originalArea: 1500,
    includedArea: 800,
    remainingArea: 700,
    remainingRatio: 46.7,
    landType: "농지",
    loadedAt: "2026-05-22T09:30:00",
    areaAnalysisResult: "초과",
    status: "신규"
  },
  {
    id: "INC002",
    address: "경기도 용인시 처인구 백암면 근삼리 456",
    businessUnit: "양평이천",
    originalArea: 2300,
    includedArea: 1200,
    remainingArea: 1100,
    remainingRatio: 47.8,
    landType: "택지",
    loadedAt: "2026-05-22T09:15:00",
    areaAnalysisResult: "초과",
    status: "신규"
  },
  {
    id: "INC003",
    address: "충청남도 천안시 서북구 성성동 789",
    businessUnit: "천안안성",
    originalArea: 850,
    includedArea: 500,
    remainingArea: 350,
    remainingRatio: 41.2,
    landType: "농지",
    loadedAt: "2026-05-22T08:45:00",
    areaAnalysisResult: "이하",
    status: "신규"
  },
  {
    id: "INC004",
    address: "전라남도 순천시 황전면 선도리 321",
    businessUnit: "강진광주",
    originalArea: 3200,
    includedArea: 2000,
    remainingArea: 1200,
    remainingRatio: 37.5,
    landType: "산지",
    loadedAt: "2026-05-22T08:30:00",
    areaAnalysisResult: "초과",
    status: "검토중"
  },
  {
    id: "INC005",
    address: "경상북도 포항시 북구 흥해읍 대련리 654",
    businessUnit: "부산울산",
    originalArea: 1800,
    includedArea: 1100,
    remainingArea: 700,
    remainingRatio: 38.9,
    landType: "농지",
    loadedAt: "2026-05-22T08:00:00",
    areaAnalysisResult: "초과",
    status: "신규"
  },
  {
    id: "INC006",
    address: "강원도 원주시 호저면 고산리 987",
    businessUnit: "강원원주",
    originalArea: 2100,
    includedArea: 1400,
    remainingArea: 700,
    remainingRatio: 33.3,
    landType: "택지",
    loadedAt: "2026-05-21T16:00:00",
    areaAnalysisResult: "초과",
    status: "신규"
  },
  {
    id: "INC008",
    address: "충청북도 청주시 흥덕구 복대동 654",
    businessUnit: "청주충주",
    originalArea: 1200,
    includedArea: 850,
    remainingArea: 350,
    remainingRatio: 29.2,
    landType: "택지",
    loadedAt: "2026-05-21T15:30:00",
    areaAnalysisResult: "이하",
    status: "신규"
  },
];

interface IncomingParcelListProps {
  onConfirmParcels?: (parcels: IncomingParcel[]) => void;
}

export function IncomingParcelList({ onConfirmParcels }: IncomingParcelListProps) {
  const [parcels, setParcels] = useState<IncomingParcel[]>(dummyIncomingParcels);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [businessUnitFilter, setBusinessUnitFilter] = useState<string>("all");
  const [aiJudgmentFilter, setAiJudgmentFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const itemsPerPage = 10;

  // 사업단 목록 추출
  const businessUnits = useMemo(() => {
    const units = new Set(parcels.map(p => p.businessUnit));
    return Array.from(units).sort();
  }, [parcels]);

  // 필터링된 필지 목록
  const filteredParcels = useMemo(() => {
    return parcels.filter(parcel => {
      // 신규/검토중 상태만 표시
      if (parcel.status !== "신규" && parcel.status !== "검토중") return false;
      
      // 검색어 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesAddress = parcel.address.toLowerCase().includes(query);
        if (!matchesAddress) return false;
      }
      
      // 사업단 필터
      if (businessUnitFilter !== "all" && parcel.businessUnit !== businessUnitFilter) {
        return false;
      }
      
      // AI 판정 필터
      if (aiJudgmentFilter !== "all") {
        if (aiJudgmentFilter === "인정" && parcel.aiResult !== "해당") return false;
        if (aiJudgmentFilter === "미인정" && parcel.aiResult !== "미해당") return false;
      }
      
      return true;
    });
  }, [parcels, searchQuery, businessUnitFilter, aiJudgmentFilter]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredParcels.length / itemsPerPage);
  const paginatedParcels = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredParcels.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredParcels, currentPage, itemsPerPage]);

  // 통계 계산
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const newParcels = parcels.filter(p => p.status === "신규");
    const todayLoaded = parcels.filter(p => p.loadedAt.startsWith(today));
    
    return {
      totalNew: newParcels.length,
      todayLoaded: todayLoaded.length
    };
  }, [parcels]);

  // 선택 토글
  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredParcels.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredParcels.map(p => p.id)));
    }
  };

  // 선택 필지 잔여지 대상으로 확정
  const handleConfirmSelected = () => {
    if (selectedIds.size === 0) {
      alert("확정할 필지를 선택해주세요.");
      return;
    }

    const selectedParcels = parcels.filter(p => selectedIds.has(p.id));
    
    // 상태 업데이트
    setParcels(prev => prev.map(p => 
      selectedIds.has(p.id) ? { ...p, status: "확정" as const } : p
    ));
    
    // 선택 초기화
    setSelectedIds(new Set());
    
    // 콜백 호출
    if (onConfirmParcels) {
      onConfirmParcels(selectedParcels);
    }
    
    alert(`${selectedParcels.length}건의 필지가 잔여지 대상으로 확정되었습니다.`);
  };

  // AI 분석 실행 (단건)
  const handleAIAnalysis = async (parcelId: string) => {
    setAnalyzingIds(prev => new Set(prev).add(parcelId));
    
    // AI 분석 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 분석 결과 업데이트
    setParcels(prev => prev.map(p => {
      if (p.id === parcelId) {
        const results: Array<"해당" | "미해당"> = ["해당", "미해당"];
        const randomResult = results[Math.floor(Math.random() * results.length)];
        return { 
          ...p, 
          aiAnalysisStatus: "완료" as const,
          aiResult: randomResult
        };
      }
      return p;
    }));
    
    setAnalyzingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(parcelId);
      return newSet;
    });
  };

  // AI 분석 실행 (선택된 필지 일괄)
  const handleBatchAIAnalysis = async () => {
    if (selectedIds.size === 0) {
      alert("분석할 필지를 선택해주세요.");
      return;
    }
    
    const idsArray = Array.from(selectedIds);
    setAnalyzingIds(new Set(idsArray));
    
    // 순차적으로 분석 시뮬레이션
    for (const id of idsArray) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setParcels(prev => prev.map(p => {
        if (p.id === id) {
          const results: Array<"해당" | "미해당"> = ["해당", "미해당"];
          const randomResult = results[Math.floor(Math.random() * results.length)];
          return { 
            ...p, 
            aiAnalysisStatus: "완료" as const,
            aiResult: randomResult
          };
        }
        return p;
      }));
      
      setAnalyzingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
    
    alert(`${idsArray.length}건의 AI 판정이 완료되었습니다.`);
  };

  // 시간 포맷
  const formatLoadedTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 60) {
      return `${diffMins}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="space-y-6">
      {/* 타이틀 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">발생 잔여지 판정</h1>
        <p className="text-muted-foreground mt-1">신규 필지를 검토하여 잔여지 대상 여부를 확정해주세요.</p>
      </div>

      {/* 실시간 자동 적재 현황 요약 카드 */}
      <div className="grid grid-cols-2 gap-5">
        {/* 신규 적재: Blue */}
        <div 
          className="flex cursor-pointer flex-col items-center rounded-lg bg-blue-50 p-4 transition-all hover:bg-blue-100"
        >
          <span className="text-[15px] font-medium text-blue-600">신규 적재</span>
          <div className="flex items-baseline gap-0.5" style={{ marginTop: '8px' }}>
            <span className="font-bold text-blue-900" style={{ fontSize: '42px', lineHeight: '1em' }}>{stats.totalNew}</span>
            <span className="text-xs font-medium ml-0.5" style={{ color: '#959595' }}>건</span>
          </div>
        </div>
        
        {/* 오늘 적재: Emerald */}
        <div 
          className="flex cursor-pointer flex-col items-center rounded-lg bg-emerald-50 p-4 transition-all hover:bg-emerald-100"
        >
          <span className="text-[15px] font-medium text-emerald-600">오늘 적재</span>
          <div className="flex items-baseline gap-0.5" style={{ marginTop: '8px' }}>
            <span className="font-bold text-emerald-900" style={{ fontSize: '42px', lineHeight: '1em' }}>{stats.todayLoaded}</span>
            <span className="text-xs font-medium ml-0.5" style={{ color: '#959595' }}>건</span>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <Card className="border-0">
        <CardHeader>
          <CardTitle>검색 및 필터</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 검색바 */}
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="소재지를 입력하세요"
          />
          
          {/* 필터 영역 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* 사업단 선택 필터 */}
            <div className="flex items-center gap-3">
              <span className="text-[15px] font-medium whitespace-nowrap text-gray-700">사업단:</span>
              <Select value={businessUnitFilter} onValueChange={setBusinessUnitFilter}>
                <SelectTrigger className="w-[180px] h-[40px]">
                  <SelectValue placeholder="사업단 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 사업단</SelectItem>
                  {businessUnits.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* AI 판정 필터 */}
            <RadioFilterGroup
              label="AI 판정"
              name="ai-judgment"
              value={aiJudgmentFilter}
              onChange={(v) => setAiJudgmentFilter(v)}
              options={[
                { value: "all", label: "전체" },
                { value: "인정", label: "인정" },
                { value: "미인정", label: "미인정" }
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* 필지 목록 테이블 */}
      <Card className="border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>필지 목록</CardTitle>
              <span className="text-[15px] text-muted-foreground">
                총 {filteredParcels.length}건
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="border-[#2E8B57] text-[#2E8B57] hover:bg-[#2E8B57] hover:text-white gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                새로고침
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 액션 버튼 영역 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleBatchAIAnalysis}
                disabled={selectedIds.size === 0 || analyzingIds.size > 0}
                variant="cta"
              >
                <Brain className="h-4 w-4 mr-2" />
                선택 필지 AI 판정 ({selectedIds.size}건)
              </Button>
              <Button
                onClick={handleConfirmSelected}
                disabled={selectedIds.size === 0}
                variant="cta-outline"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                선택 필지 잔여지 대상으로 확정 ({selectedIds.size}건)
              </Button>
            </div>
          </div>

          {/* 테이블 */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredParcels.length && filteredParcels.length > 0}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </TableHead>
                  <TableHead className="w-12 text-center">No.</TableHead>
                  <TableHead>소재지</TableHead>
                  <TableHead>사업단</TableHead>
                  <TableHead className="text-right">잔여면적</TableHead>
                  <TableHead className="text-right">잔여비율</TableHead>
                  <TableHead className="text-center">AI 판정</TableHead>
                  <TableHead className="text-center">적재시간</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedParcels.map((parcel, index) => (
                  <TableRow 
                    key={parcel.id} 
                    className={`hover:bg-muted/50 ${selectedIds.has(parcel.id) ? 'bg-blue-50' : ''}`}
                  >
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(parcel.id)}
                        onChange={() => handleToggleSelection(parcel.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate" title={parcel.address}>
                      {parcel.address}
                    </TableCell>
                    <TableCell>{parcel.businessUnit}</TableCell>
                    <TableCell className="text-right">{formatNumber(parcel.remainingArea)}㎡</TableCell>
                    <TableCell className="text-right">{parcel.remainingRatio.toFixed(1)}%</TableCell>
                    <TableCell className="text-center">
                      {analyzingIds.has(parcel.id) ? (
                        <div className="flex items-center justify-center gap-1">
                          <Loader2 className="h-4 w-4 animate-spin text-[#2E8B57]" />
                          <span className="text-xs text-[#2E8B57]">분석중</span>
                        </div>
                      ) : parcel.aiResult ? (
                        <Badge 
                          className={
                            parcel.aiResult === "해당" 
                              ? "bg-success/10 text-success hover:bg-success/10"
                              : "bg-destructive/10 text-destructive hover:bg-destructive/10"
                          }
                        >
                          {parcel.aiResult === "해당" ? "잔여지 인정" : "잔여지 미인정"}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="cta-outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleAIAnalysis(parcel.id)}
                        >
                          분석
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-[15px] text-muted-foreground">
                      {formatLoadedTime(parcel.loadedAt)}
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedParcels.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      조건에 맞는 필지가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

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
              
              <span className="text-[15px] text-muted-foreground ml-2">
                ({filteredParcels.length}건 중 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredParcels.length)}건)
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
