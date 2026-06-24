"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { dummyApplications, landCategories } from "@/lib/dummy-data";
import { formatDateTime } from "@/lib/format";
import type { Application, AdminStatus } from "@/lib/types";
import { PARCEL_COUNT_COLORS } from "@/components/ui/judgment-badge";
import {
  FileText,
  MapPin,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  Pencil,
  Save,
  X,
  Upload,
  Trash2,
  Search,
  Download,
  Eye,
  FileImage,
  PlayCircle,
  Clock
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AdminStatusBadge } from "@/components/ui/status-badge";
import { JudgmentStatus } from "@/components/ui/judgment-status";

// 샘플 주소 데이터 (실제로는 API에서 가져옴)
const sampleAddresses = [
  { postalCode: "31110", address: "충청남도 천안시 동남구 신부동 810" },
  { postalCode: "31120", address: "충청남도 천안시 동남구 신방동 123-45" },
  { postalCode: "31130", address: "충청남도 천안시 서북구 불당동 1234" },
  { postalCode: "31140", address: "충청남도 천안시 서북구 쌍용동 567-8" },
  { postalCode: "31200", address: "충청남도 아산시 배방읍 세출리 100" },
  { postalCode: "31300", address: "충청남도 논산시 내동 150" },
];

// 파일 타입 정의
interface FileItem {
  name: string;
  size: string;
  status: "uploading" | "complete" | "error";
}

// 주소 검색 모달 컴포넌트
function AddressSearchModal({
  onSelect,
  onClose,
}: {
  onSelect: (address: { postalCode: string; address: string }) => void;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof sampleAddresses>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    const results = sampleAddresses.filter(
      (addr) =>
        addr.address.includes(searchQuery) || addr.postalCode.includes(searchQuery)
    );
    setSearchResults(results);
    setHasSearched(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg rounded-lg bg-background shadow-xl">
        <div className="flex items-center justify-between py-2 px-4">
          <h3 className="text-lg font-semibold">주소 검색</h3>
          <Button variant="ghost" className="h-10 w-10 p-0" onClick={onClose}>
            <X className="size-6" />
          </Button>
        </div>
        
        <div className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="도로명, 건물명 또는 지번 입력"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSearch();
                }
              }}
              autoFocus
            />
            <Button 
              type="button"
              onClick={handleSearch}
              className="h-10 shrink-0 bg-[#222222] hover:bg-[#333333] py-3"
            >
              검색
            </Button>
          </div>
          
          <div className="mt-4 max-h-64 overflow-y-auto">
            {hasSearched && searchResults.length === 0 ? (
              <p className="py-8 text-center text-base text-muted-foreground">
                검색 결과가 없습니다.
              </p>
            ) : searchResults.length > 0 ? (
              <ul className="space-y-1">
                {searchResults.map((addr, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      className="w-full rounded-md px-3 py-2 text-left text-base transition-colors hover:bg-muted"
                      onClick={() => onSelect(addr)}
                    >
                      <span className="mr-2 text-base text-muted-foreground">
                        [{addr.postalCode}]
                      </span>
                      <span>{addr.address}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-2 py-4 text-center text-base text-muted-foreground">
                <p>도로명, 건물명 또는 지번을 입력하세요.</p>
                <p className="text-base">예: 천안시 동남구, 신부동 100</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t bg-muted/30 p-3">
          <p className="text-[15px] text-muted-foreground">
            * 정확한 주소를 찾을 수 없는 경우, 가까운 건물명이나 도로명으로 검색해 보세요.
          </p>
        </div>
      </div>
    </div>
  );
}

// 현재 활용 지목 옵션
const LAND_USAGE_OPTIONS = [
  { value: "대", label: "대(택지)" },
  { value: "전", label: "전(밭)" },
  { value: "답", label: "답(논)" },
  { value: "임", label: "임(임야)" },
  { value: "잡", label: "그밖의 토지" },
] as const;

// 값으로 라벨 가져오기 유틸 함수
function getLandUsageLabel(value: string | undefined): string {
  if (!value) return "-";
  const option = LAND_USAGE_OPTIONS.find((opt) => opt.value === value);
  return option?.label || value;
}

// 토지 활용 지목 선택 컴포넌트
function LandUsageSelect({ 
  value, 
  onValueChange, 
  triggerClassName 
}: { 
  value: string; 
  onValueChange: (value: string) => void; 
  triggerClassName?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={triggerClassName || "h-10 w-full bg-background"}>
        <SelectValue placeholder="현재 활용 지목을 선택해 주세요" />
      </SelectTrigger>
      <SelectContent>
        {LAND_USAGE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// 토지 정보 섹션 컴포넌트 (고용24 스타일 테이블 형태)
interface LandEditData {
  landUseCategory: string;
  landShape: string;
  siteType: string;
  roadFrontageLoss: boolean;
  irrigationCanalLoss: boolean;
  farmEquipmentTurnImpossible: boolean;
}

function LandInfoSection({
  application,
  isEditMode = false,
  selectedLandIndex = 0,
  onSelectedLandIndexChange,
  editData,
  onEditDataChange,
  onFileChange,
  onRemoveFile,
  onSave,
  MAX_FILES = 10
}: {
  application: Application;
  isEditMode?: boolean;
  selectedLandIndex?: number;
  onSelectedLandIndexChange?: (index: number) => void;
  editData?: LandEditData;
  onEditDataChange?: (data: Partial<LandEditData>) => void;
  onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile?: (index: number) => void;
  onSave?: (updatedApp: Application) => void;
  MAX_FILES?: number;
}) {
  const isMultipleLands = application.additionalLands && application.additionalLands.length > 0;
  const allLands = isMultipleLands 
    ? [application.landInfo, ...application.additionalLands] 
    : [application.landInfo];
  
  // 파일 뷰어 상태
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // 파일 확장자로 파일 타입 확인
  const getFileType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '')) return 'image';
    if (ext === 'pdf') return 'pdf';
    return 'other';
  };

  // 파일 뷰어 열기
  const openFileViewer = (fileName: string) => {
    setSelectedFile(fileName);
    setFileViewerOpen(true);
  };

  // 인덱스 범위 안전 처리
  const safeIndex = Math.min(selectedLandIndex, allLands.length - 1);
  const selectedLand = allLands[safeIndex];
  
  // 필지 선택 핸들러
  const handleLandIndexChange = (index: number) => {
    if (onSelectedLandIndexChange) {
      onSelectedLandIndexChange(index);
    }
  };
  
  // selectedLand가 없으면 렌더링 안함
  if (!selectedLand) return null;

  return (
    <div className={`overflow-hidden rounded-lg border transition-colors duration-300 ${isEditMode ? "border-primary/50 bg-primary/5" : "border-border"}`}>
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5">
        <h4 className="font-semibold text-foreground">심사 대상 필지</h4>
        {isMultipleLands && (
          <span className={`flex items-center gap-1 rounded px-2 py-0.5 text-[15px] font-medium ${PARCEL_COUNT_COLORS.bg} ${PARCEL_COUNT_COLORS.text}`}>
            <Layers className="h-3 w-3" />
            {allLands.length}필지
          </span>
        )}
      </div>
      
      {/* 복수 필지일 경우 셀렉트박스로 표시 */}
      {isMultipleLands && (
        <div className="flex border-b border-border">
          <div className="flex w-36 shrink-0 whitespace-nowrap items-center bg-muted/30 px-4 py-3">
            <span className="text-[15px] font-medium">필지 선택</span>
          </div>
          <div className="flex flex-1 items-center px-4 py-3">
            <Select
              value={selectedLandIndex.toString()}
              onValueChange={(value) => handleLandIndexChange(parseInt(value))}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allLands.map((land, index) => (
                  <SelectItem key={land.id} value={index.toString()}>
                    필지 {index + 1} - {land.address.split(" ").slice(-2).join(" ")} ({land.remainingArea.toLocaleString()}m²)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      {/* 필지 주소 행 */}
      <div className="flex border-b border-border">
        <div className="flex w-36 shrink-0 whitespace-nowrap items-center bg-muted/30 px-4 py-3">
          <span className="text-[15px] font-medium">필지 주소</span>
        </div>
        <div className="flex flex-1 items-center px-4 py-3">
          <span className="text-[15px]">{selectedLand.address}</span>
        </div>
      </div>
      
      {/* 토지 유형 행 */}
      <div className="flex border-b border-border">
        <div className="flex w-36 shrink-0 whitespace-nowrap items-center bg-muted/30 px-4 py-3">
          <span className="text-[15px] font-medium">토지 유형</span>
        </div>
        <div className="flex flex-1 items-center px-4 py-3">
          <span className="text-[15px]">{selectedLand.landType}</span>
        </div>
      </div>
      
      {/* 잔여 면적 행 */}
      <div className="flex border-b border-border">
        <div className="flex w-36 shrink-0 whitespace-nowrap items-center bg-muted/30 px-4 py-3">
          <span className="text-[15px] font-medium">잔여 면적</span>
        </div>
        <div className="flex flex-1 items-center px-4 py-3">
          <span className="font-medium text-black">{selectedLand.remainingArea.toLocaleString()}m²</span>
          <span className="ml-2 text-[15px] text-muted-foreground">(잔여 비율 {selectedLand.remainingRatio}%)</span>
        </div>
      </div>
      
      {/* 필지별 AI 판정 행 - 아코디언 UI */}
      {(() => {
        // 필지별 AI 결과 가져오기
        const landAIResult = application.landAIResults?.[selectedLand.id] || application.aiResult;
        if (!landAIResult?.provisionalJudgment) return null;
        
        // 시민용 AI 판정 레이블 변환 (수용가능 -> 매수 가능성 높음, 수용불가 -> 매수 가능성 낮음)
        const getCitizenJudgmentLabel = (judgment: string) => {
          if (judgment === "수용가능") return "매수 가능성 높음";
          if (judgment === "수용불가") return "매수 가능성 낮음";
          return judgment;
        };
        
        return (
          <Collapsible defaultOpen={false} className="border-b border-border">
            <CollapsibleTrigger asChild>
              <div className="flex cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex w-36 shrink-0 whitespace-nowrap items-center bg-muted/30 px-4 py-3">
                  <span className="text-[15px] font-medium">AI 판정</span>
                </div>
                <div className="flex flex-1 items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <JudgmentStatus 
                      judgment={getCitizenJudgmentLabel(landAIResult.provisionalJudgment)} 
                      variant="badge" 
                      size="sm"
                    />
                  </div>
                  {landAIResult.judgmentRationale && (
                    <ChevronDown className="size-5 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
            {/* AI 판정 근거 아코디언 내용 */}
            {landAIResult.judgmentRationale && (
              <CollapsibleContent>
                <div className="border-t border-border bg-muted/20 px-4 py-3">
                  <RationaleCard 
                    rationale={landAIResult.judgmentRationale} 
                    provisionalJudgment={getCitizenJudgmentLabel(landAIResult.provisionalJudgment)}
                    variant="expanded"
                  />
                </div>
              </CollapsibleContent>
            )}
          </Collapsible>
        );
      })()}
      
      {/* 수정 모드 안내 */}
      {isEditMode && (
        <div className="border-b border-border bg-blue-50 px-4 py-2">
          <p className="text-[15px] text-blue-700">
            AI 판단과 실제 현황이 다를 수 있습니다. 현재 토지의 실제 활용 상황을 입력해 주세요. (필지 주소는 수정 불가)
          </p>
        </div>
      )}

      {/* 활용 지목 / 공부상 지목 행 */}
      <div className="flex border-b border-border">
        <div className="flex w-36 shrink-0 whitespace-nowrap items-center bg-muted/30 px-4 py-3">
          <span className="text-[15px] font-medium">활용 지목</span>
        </div>
        <div className="flex flex-1 items-center px-4 py-3">
          {isEditMode && editData && onEditDataChange ? (
            <LandUsageSelect
              value={editData.landUseCategory || selectedLand.currentUsage || "대"}
              onValueChange={(value) => onEditDataChange({ landUseCategory: value })}
              triggerClassName="h-10 w-full max-w-[200px] bg-background"
            />
          ) : (
            <span className="text-[15px]">
              {getLandUsageLabel(selectedLand.currentUsage || selectedLand.landCategory || "대")}
            </span>
          )}
        </div>
        <div className="flex w-36 shrink-0 whitespace-nowrap items-center border-l border-border bg-muted/30 px-4 py-3">
          <span className="text-[15px] font-medium">공부상 지목</span>
        </div>
        <div className="flex flex-1 items-center px-4 py-3">
          <span className="text-[15px] text-muted-foreground">{selectedLand.landType || "대 (택지)"}</span>
        </div>
      </div>
      

      
      {/* 확인 항목 행 */}
      <div className="flex border-b border-border">
        <div className="flex w-36 shrink-0 whitespace-nowrap items-start bg-muted/30 px-4 py-3">
          <span className="text-[15px] font-medium">확인 항목</span>
        </div>
        <div className="flex flex-1 flex-col px-4 py-3">
          {isEditMode && editData && onEditDataChange ? (
            <>
              <p className="mb-3 text-[15px] text-muted-foreground">
                AI가 자동 판독할 수 없는 사항입니다. 해당되는 경우 체크해 주세요.
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    id="roadFrontageLoss"
                    checked={editData.roadFrontageLoss ?? false}
                    onCheckedChange={(checked) => onEditDataChange({ roadFrontageLoss: checked === true })}
                  />
                  <span className="text-[15px]">접면도로 상실</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    id="irrigationCanalLoss"
                    checked={editData.irrigationCanalLoss ?? false}
                    onCheckedChange={(checked) => onEditDataChange({ irrigationCanalLoss: checked === true })}
                  />
                  <span className="text-[15px]">관개수로 상실</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    id="farmEquipmentTurnImpossible"
                    checked={editData.farmEquipmentTurnImpossible ?? false}
                    onCheckedChange={(checked) => onEditDataChange({ farmEquipmentTurnImpossible: checked === true })}
                  />
                  <span className="text-[15px]">농기계 회전 불가</span>
                </label>
              </div>
            </>
          ) : (
            (() => {
              const checks = [];
              if (selectedLand.accessRoadLost) checks.push("접면도로 상실");
              if (selectedLand.waterChannelLost) checks.push("관개수로 상실");
              if (selectedLand.farmMachineDifficulty) checks.push("농기계 회전 곤란");
              return checks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {checks.map((check, i) => (
                    <span key={i} className="rounded bg-amber-100 px-2 py-0.5 text-[15px] font-medium text-amber-700">
                      {check}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[15px] text-muted-foreground">해당 없음</span>
              );
            })()
          )}
        </div>
      </div>

      {/* 인접 토지 소유 여부 행 */}
      <div className="flex border-b border-border">
        <div className="flex w-36 shrink-0 whitespace-nowrap items-center bg-muted/30 px-4 py-3">
          <span className="text-[15px] font-medium">인접 토지 소유</span>
        </div>
        <div className="flex flex-1 items-center px-4 py-3">
          <span className="text-[15px]">
            {application.hasAdjacentLand ? "있음" : "없음"}
          </span>
        </div>
      </div>

      {/* 신청사유 행 */}
      <div className="flex border-b border-border">
        <div className="flex w-36 shrink-0 whitespace-nowrap items-start bg-muted/30 px-4 py-3">
          <span className="text-[15px] font-medium">신청사유</span>
        </div>
        <div className="flex flex-1 items-center px-4 py-3">
          {isEditMode && editData && onEditDataChange ? (
            <Textarea
              value={editData.reason}
              onChange={(e) => onEditDataChange({ reason: e.target.value })}
              className="min-h-[80px] text-[15px]"
            />
          ) : (
            <span className="text-[15px]">{application.reason}</span>
          )}
        </div>
      </div>

      {/* 첨부 서류 행 */}
      <div className="flex">
        <div className="flex w-36 shrink-0 whitespace-nowrap items-start bg-muted/30 px-4 py-3">
          <span className="text-[15px] font-medium">첨부 서류</span>
        </div>
        <div className="flex flex-1 px-4 py-3">
          {isEditMode && editData && onFileChange && onRemoveFile ? (
            <div className="w-full space-y-3">
              <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-3">
                <p className="mb-2 text-center text-[15px] text-muted-foreground">
                  첨부할 파일을 여기에 끌어다 놓거나, 파일 선택 버튼을 클릭하세요.
                </p>
                <div className="flex items-center justify-center">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-[15px] font-medium text-foreground shadow-sm transition-colors hover:bg-gray-50">
                      <Upload className="size-[14px]" />
                      파일선택
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={onFileChange}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              {editData.attachments.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[15px] text-muted-foreground">
                    {editData.attachments.length}개 / {MAX_FILES}개
                  </span>
                  <ul className="space-y-1">
                    {editData.attachments.map((file, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2"
                      >
                        <span className="truncate text-[15px] text-foreground">
                          {file.name} <span className="text-muted-foreground">[{file.size}]</span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveFile(index)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-[14px]" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-[15px] text-muted-foreground">
                PDF, JPG, PNG 파일 (최대 {MAX_FILES}개, 파일당 20MB 이하)
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {application.attachments && application.attachments.length > 0 ? (
                <>
                  <span className="text-[15px] text-muted-foreground">
                    {application.attachments.length}개 파일 첨부됨
                  </span>
                  <ul className="flex flex-row flex-wrap gap-2">
                    {application.attachments.map((fileName, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => openFileViewer(fileName)}
                        title="파일 보기"
                      >
                        <span className="truncate max-w-[120px] text-[15px] text-foreground">
                          {fileName}
                        </span>
                        <Eye className="size-[14px] shrink-0 text-muted-foreground" />
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <span className="text-[15px] text-muted-foreground">첨부된 파일 없음</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 최종 판정 항목 (심의위원회 회부 이후 또는 심사완료 시 표시) */}
      {(() => {
        const st = application.adminStatus;
        const isCom = application.isCommitteeCase;
        const isComplete = st === "심사완료";
        const isCommitteeStage = st === "심의위원회회부" || st === "심의위원회검토중" || st === "심의위원회검토완료";

        // 복수필지 per-parcel 판정 우선, 없으면 전체 finalJudgment 사용
        const perParcel = application.landJudgmentsForReview?.[selectedLandIndex];
        const fj: string | undefined = perParcel?.judgment ?? application.finalJudgment;
        const appealChoice = perParcel ? perParcel.citizenAppealChoice : application.citizenAppealChoice;

        if (!isCommitteeStage && !(isComplete && fj)) return null;

        let label = "";
        let icon: React.ReactNode = null;
        let textColor = "";

        if (st === "심의위원회회부") {
          label = "심의위원회 회부";
          icon = <Clock className="h-5 w-5 text-amber-500" />;
          textColor = "text-amber-700";
        } else if (st === "심의위원회검토중") {
          label = "심의 위원회 회부(검토 중)";
          icon = <PlayCircle className="h-5 w-5 text-amber-500" />;
          textColor = "text-amber-700";
        } else if (st === "심의위원회검토완료") {
          if (fj === "매수") {
            label = "심의 위원회 회부(검토 완료 - 매수)";
            icon = <CheckCircle2 className="h-5 w-5 text-success" />;
            textColor = "text-success";
          } else if (fj === "기각") {
            label = "심의 위원회 회부(검토 완료 - 기각)";
            icon = <AlertTriangle className="h-5 w-5 text-destructive" />;
            textColor = "text-destructive";
          }
          // finalJudgment 없으면 표시 안 함 (판정 미입력 상태)
        } else if (isComplete && isCom && fj === "매수") {
          label = "심의 위원회 회부(검토 완료 - 매수)";
          icon = <CheckCircle2 className="h-5 w-5 text-success" />;
          textColor = "text-success";
        } else if (isComplete && isCom && fj === "기각") {
          label = "심의 위원회 회부(검토 완료 - 기각)";
          icon = <AlertTriangle className="h-5 w-5 text-destructive" />;
          textColor = "text-destructive";
        } else if (isComplete && fj === "매수") {
          label = "매수";
          icon = <CheckCircle2 className="h-5 w-5 text-success" />;
          textColor = "text-success";
        } else if (isComplete && fj === "기각") {
          label = "기각";
          icon = <AlertTriangle className="h-5 w-5 text-destructive" />;
          textColor = "text-destructive";
        } else if (isComplete && fj === "심의위원회 이관") {
          label = "심의위원회 회부";
          icon = <Clock className="h-5 w-5 text-amber-500" />;
          textColor = "text-amber-700";
        }

        if (!label) return null;

        // 기각 + 수용신청 옵션 표시 여부
        const showAppeal = fj === "기각" && onSave &&
          ((isComplete && (isCom || application.finalJudgment === "심의위원회 이관")) || st === "심의위원회검토완료");

        // CommitteeRejectionAppeal에 전달할 application (per-parcel이면 해당 필지의 선택값 주입)
        const appealApp = perParcel
          ? { ...application, citizenAppealChoice: appealChoice ?? null }
          : application;

        const handleAppealSave = onSave
          ? (updated: Application) => {
              if (perParcel && application.landJudgmentsForReview) {
                const updatedJudgments = application.landJudgmentsForReview.map((j, i) =>
                  i === selectedLandIndex ? { ...j, citizenAppealChoice: updated.citizenAppealChoice } : j
                );
                onSave({ ...updated, landJudgmentsForReview: updatedJudgments });
              } else {
                onSave(updated);
              }
            }
          : undefined;

        return (
          <>
            <div className="flex border-t border-border">
              <div className="flex w-36 shrink-0 whitespace-nowrap items-center bg-muted/30 px-4 py-4">
                <span className="text-[15px] font-medium">최종 판정</span>
              </div>
              <div className="flex flex-1 items-center gap-3 px-4 py-4">
                {icon}
                <span className={`text-base font-semibold ${textColor}`}>{label}</span>
              </div>
            </div>
            {(st === "심의위원회회부" || st === "심의위원회검토중") && (
              <div className="flex items-start gap-2 border-t border-border bg-amber-50 px-4 py-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-[14px] text-amber-700 leading-relaxed">
                  {st === "심의위원회회부"
                    ? "심의위원회 검토가 곧 진행 될 예정입니다."
                    : "심의위원회에서 검토가 진행 중입니다. 검토가 완료되면 결과를 안내드리겠습니다."}
                </p>
              </div>
            )}
            {showAppeal && handleAppealSave && (
              <CommitteeRejectionAppeal key={perParcel?.landId ?? "single"} application={appealApp} onSave={handleAppealSave} />
            )}
            {application.reviewerComment && (
              <div className="flex border-t border-border">
                <div className="flex w-36 shrink-0 whitespace-nowrap bg-muted/30 px-4 py-3">
                  <span className="text-[15px] font-medium">검토 의견</span>
                </div>
                <div className="flex flex-1 px-4 py-3">
                  <p className="text-[15px] text-muted-foreground">{application.reviewerComment}</p>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* 파일 뷰어 다이얼로그 - 풀페이지 */}
      <Dialog open={fileViewerOpen} onOpenChange={setFileViewerOpen}>
        <DialogContent className="fixed inset-0 w-[100vw] h-[100vh] !max-w-none rounded-none border-none overflow-hidden flex flex-col p-0 translate-x-0 translate-y-0 top-0 left-0">
          <DialogHeader className="shrink-0 px-6 py-4 border-b bg-background pr-16">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base">
                첨부파일 미리보기
              </DialogTitle>
              <div className="flex items-center gap-3">
                <span className="text-[15px] text-muted-foreground">{selectedFile}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                >
                  <Download className="size-4" />
                  다운로드
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/30 w-full">
            {selectedFile && (
              <div className="w-full h-full flex items-center justify-center">
                {getFileType(selectedFile) === 'image' ? (
                  <div className="relative w-full h-full flex items-center justify-center p-8">
                    <img 
                      src={`https://picsum.photos/seed/${encodeURIComponent(selectedFile)}/800/600`}
                      alt={selectedFile}
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[15px] px-3 py-1.5 rounded-full">
                      데모용 샘플 이미지입니다
                    </div>
                  </div>
                ) : getFileType(selectedFile) === 'pdf' ? (
                  <div className="relative w-full h-full flex flex-col">
                    <iframe 
                      src="https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf"
                      className="w-full h-full border-0"
                      title={selectedFile}
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[15px] px-3 py-1.5 rounded-full">
                      데모용 샘플 PDF입니다
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground w-full h-full">
                    <FileText className="size-24 text-muted-foreground/50" />
                    <p className="text-base">미리보기를 지원하지 않는 파일 형식입니다.</p>
                    <p className="text-[15px]">파일을 다운로드하여 확인해 주세요.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// RationaleCard 컴포넌트를 import해서 사용
import { RationaleCard } from "@/components/ui/rationale-card";

// 심의위원회 기각 후 민원인 수용 신청 선택 컴포넌트
function CommitteeRejectionAppeal({
  application,
  onSave,
}: {
  application: Application;
  onSave: (updatedApp: Application) => void;
}) {
  const [selected, setSelected] = useState<"중토위" | "한국도로공사" | null>(
    application.citizenAppealChoice ?? null
  );
  const [pendingChoice, setPendingChoice] = useState<"중토위" | "한국도로공사" | null>(null);
  const isLocked = selected !== null; // 한 번 선택하면 번복 불가

  const handleSelect = (choice: "중토위" | "한국도로공사") => {
    if (isLocked) return;
    setSelected(choice);
    onSave({ ...application, citizenAppealChoice: choice });
  };

  const handleConfirm = () => {
    if (pendingChoice) {
      handleSelect(pendingChoice);
      setPendingChoice(null);
    }
  };

  const options: {
    key: "중토위" | "한국도로공사";
    title: string;
    badge: string;
    badgeColor: string;
    summary: string;
    detail: React.ReactNode;
  }[] = [
    {
      key: "중토위",
      title: "중앙토지수용위원회에 직접 수용 신청",
      badge: "민원인 직접 신청",
      badgeColor: "bg-blue-50 text-blue-700",
      summary: "민원인이 직접 중앙토지수용위원회(중토위)에 수용 재결을 신청하는 방법입니다.",
      detail: (
        <div className="space-y-3">
          <ul className="space-y-1 text-[15px] text-slate-600">
            <li>· 보상협의 요청일로부터 <span className="font-medium text-slate-800">30일 이내</span> 재결 신청서 제출</li>
            <li>· 준비 서류: 등기사항전부증명서, 보상협의 결렬 확인서, 신분증 사본</li>
            <li>· 사업 시행자(한국도로공사) 경유 또는 중토위에 직접 제출 가능</li>
            <li>· 심리·재결 후 보상금 확정 / 불복 시 행정소송 가능</li>
            <li className="text-slate-400 text-[13px]">※ 문의: 중앙토지수용위원회 ☎ 1670-4655</li>
          </ul>
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-4">
            <p className="text-[14px] text-slate-600">
              중토위 신청 시 제출 서류로 활용하실 수 있도록 <span className="font-medium text-slate-800">심의결과서</span>를 다운로드하세요.
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const content = [
                  "■ 잔여지 매수청구 심의결과서",
                  "",
                  `신청번호: ${application.applicationNumber}`,
                  `신청인: ${application.applicantName}`,
                  `신청일: ${application.appliedAt ? new Date(application.appliedAt).toLocaleDateString("ko-KR") : "-"}`,
                  "",
                  "■ 심의 결과",
                  "심의위원회 검토 결과: 기각",
                  "",
                  "귀하의 잔여지 매수청구 건에 대해 심의위원회에서 검토한 결과,",
                  "위와 같이 결정되었음을 통보합니다.",
                  "",
                  "※ 본 심의결과서는 중앙토지수용위원회 수용 신청 시 제출 서류로 활용하실 수 있습니다.",
                ].join("\n");
                const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `심의결과서_${application.applicationNumber}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex shrink-0 items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              <Download className="h-4 w-4 shrink-0" />
              심의결과서 다운로드
            </button>
          </div>
        </div>
      ),
    },
    {
      key: "한국도로공사",
      title: "한국도로공사에 이의 신청",
      badge: "담당자가 연락 드립니다",
      badgeColor: "bg-emerald-50 text-emerald-700",
      summary: "한국도로공사 담당자가 직접 연락하여 수용 신청 절차를 안내해 드립니다.",
      detail: (
        <ul className="space-y-1 text-[15px] text-slate-600">
          <li>· 선택 후 담당자가 등록된 연락처로 순차 연락 드립니다</li>
          <li>· 담당자 안내에 따라 서류(토지대장, 등기사항전부증명서, 현황사진 등) 준비</li>
          <li>· 내부 검토 및 현장 확인 후 매수 여부·보상금 서면 통보</li>
          <li>· 결과에 이의가 있을 경우 중토위 재결 신청 가능</li>
          <li className="text-slate-400 text-[13px]">※ 문의: 한국도로공사 고객센터 ☎ 1588-2504</li>
        </ul>
      ),
    },
  ];

  // 선택 완료 후: 선택한 옵션만 표시
  if (isLocked) {
    const chosen = options.find((o) => o.key === selected)!;
    return (
      <div className="border-t border-border px-4 py-4 space-y-3">
        <p className="text-[15px] font-semibold text-foreground">수용 신청 방법</p>
        <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold text-foreground">{chosen.title}</span>
            <span className={`rounded-full px-2 py-0.5 text-[13px] font-medium ${chosen.badgeColor}`}>
              {chosen.badge}
            </span>
          </div>
          <p className="text-[15px] text-muted-foreground">{chosen.summary}</p>
          <div className="rounded-md bg-slate-50 border border-slate-100 px-3 py-2.5">
            {chosen.detail}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          <p className="text-[15px] text-primary font-medium">선택이 완료되었습니다. 선택하신 절차에 따라 안내를 도와드리겠습니다.</p>
        </div>
      </div>
    );
  }

  // 선택 전: 두 옵션 카드 모두 표시
  return (
    <>
      <AlertDialog open={pendingChoice !== null} onOpenChange={(open) => { if (!open) setPendingChoice(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>수용 신청 방법 확정</AlertDialogTitle>
            <AlertDialogDescription className="space-y-1">
              <span className="block">
                <span className="font-semibold text-foreground">
                  {pendingChoice === "한국도로공사" ? "한국도로공사에 이의 신청" : "중앙토지수용위원회에 직접 수용 신청"}
                </span>
                을 선택하셨습니다.
              </span>
              <span className="block text-muted-foreground">
                한 번 선택하면 이후 변경이 불가합니다. 신중하게 확인 후 확정해 주세요.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingChoice(null)}>재확인</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>확정</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="border-t border-border px-4 py-4 space-y-4">
        <div className="space-y-2">
          <p className="text-[16px] font-bold text-foreground">심의 결과 안내</p>
          <p className="text-[15px] text-slate-700">귀하의 잔여지 매수 청구가 최종 기각되었습니다.</p>
          <p className="text-[15px] text-slate-600">결과에 이의가 있으신 경우, 아래 중 원하시는 절차를 선택해 주세요.</p>
        </div>
        <div className="flex flex-col gap-3">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setPendingChoice(opt.key)}
              className="w-full text-left rounded-lg border-2 border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300" />
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-semibold text-foreground">{opt.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[13px] font-medium ${opt.badgeColor}`}>
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[15px] text-muted-foreground">{opt.summary}</p>
                  <div className="rounded-md bg-slate-50 border border-slate-100 px-3 py-2.5">
                    {opt.detail}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
        <p className="text-[14px] text-slate-500">선택하신 절차에 따라 안내를 도와드리겠습니다.</p>
      </div>
    </>
  );
}

// 신청 목록/상세 공통: 실제 상태를 3단계 시민 표시 상태로 변환
function toListStatus(status: AdminStatus): AdminStatus {
  if (status === "접수완료") return "접수완료";
  if (status === "담당자검토중" || status === "심의위원회회부" || status === "심의위원회검토중") return "담당자검토중";
  return "담당자검토완료";
}

// 상세 정보 패널 컴포넌트 (고용24 스타일)
function ApplicationDetailPanel({
  application,
  isEditMode,
  onEditModeChange,
  onSave,
  onReapplyClick
}: {
  application: Application;
  isEditMode: boolean;
  onEditModeChange: (value: boolean) => void;
  onSave: (updatedApp: Application) => void;
  onReapplyClick?: () => void;
}) {
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedLandIndex, setSelectedLandIndex] = useState(0);
  
  // 모든 필지 목록
  const allLands = application.additionalLands 
    ? [application.landInfo, ...application.additionalLands] 
    : [application.landInfo];
  
  // 필지별 토지 편집 데이터 초기화
  const initLandEditDataList = () => {
    return allLands.map((land, index) => {
      const landData = application.landDataList?.[index];
      return {
        landUseCategory: landData?.currentUsage || land?.currentUsage || "대",
        landShape: landData?.reportedShape || land?.reportedShape || "정방형",
        siteType: landData?.landSubType || land?.landSubType || "",
        roadFrontageLoss: landData?.accessRoadLost || land?.accessRoadLost || false,
        irrigationCanalLoss: landData?.waterChannelLost || land?.waterChannelLost || false,
        farmEquipmentTurnImpossible: landData?.farmMachineDifficulty || land?.farmMachineDifficulty || false,
      };
    });
  };
  
  const [landEditDataList, setLandEditDataList] = useState(initLandEditDataList);
  
  const [editData, setEditData] = useState({
    // 신청인 정보
    applicantRelation: (application.applicantRelation || "owner") as "owner" | "agent",
    applicantName: application.applicantName,
    applicantContact: application.applicantContact,
    agentName: application.agentName || "",
    agentContact: application.agentContact || "",
    postalCode: "",
    baseAddress: application.applicantAddress,
    detailAddress: "",
    // 신청 사유 및 첨부 (필수값) - 공통 항목
    reason: application.reason || "잔여지 매수 신청",
    attachments: [] as FileItem[],
  });

  // application이 변경되면 editData와 landEditDataList를 다시 초기화
  useEffect(() => {
    setEditData({
      applicantRelation: (application.applicantRelation || "owner") as "owner" | "agent",
      applicantName: application.applicantName,
      applicantContact: application.applicantContact,
      agentName: application.agentName || "",
      agentContact: application.agentContact || "",
      postalCode: "",
      baseAddress: application.applicantAddress,
      detailAddress: "",
      reason: application.reason || "잔여지 매수 신청",
      attachments: [],
    });
    setLandEditDataList(initLandEditDataList());
    setSelectedLandIndex(0);
  }, [application.id]);

  const canEdit = application.adminStatus === "접수완료";
  const MAX_FILES = 10;

  const handleAddressSelect = (address: { postalCode: string; address: string }) => {
    setEditData(prev => ({
      ...prev,
      postalCode: address.postalCode,
      baseAddress: address.address,
    }));
    setShowAddressModal(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: FileItem[] = Array.from(files).map((file) => ({
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)}KB`,
      status: "complete" as const,
    }));

    setEditData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newFiles].slice(0, MAX_FILES),
    }));
  };

  const handleRemoveFile = (index: number) => {
    setEditData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSaveClick = () => {
    // 컨펌 모달 표시
    setShowConfirmModal(true);
  };

  const handleConfirmSave = () => {
    // 수정된 신청 데이터 생성
    const updatedApplication: Application = {
      ...application,
      applicantRelation: editData.applicantRelation,
      applicantName: editData.applicantName,
      applicantContact: editData.applicantContact,
      applicantAddress: editData.baseAddress + (editData.detailAddress ? ` ${editData.detailAddress}` : ""),
      agentName: editData.applicantRelation === "agent" ? editData.agentName : undefined,
      agentContact: editData.applicantRelation === "agent" ? editData.agentContact : undefined,
      reason: editData.reason,
      // 토지 정보 업데이트 (첫 번째 필지)
      landInfo: application.landInfo ? {
        ...application.landInfo,
        currentUsage: landEditDataList[0]?.landUseCategory,
        reportedShape: landEditDataList[0]?.landShape,
        landSubType: landEditDataList[0]?.siteType,
        accessRoadLost: landEditDataList[0]?.roadFrontageLoss,
        waterChannelLost: landEditDataList[0]?.irrigationCanalLoss,
        farmMachineDifficulty: landEditDataList[0]?.farmEquipmentTurnImpossible,
      } : application.landInfo,
      // 추가 필지 정보 업데이트
      additionalLands: application.additionalLands?.map((land, index) => ({
        ...land,
        currentUsage: landEditDataList[index + 1]?.landUseCategory || land.currentUsage,
        reportedShape: landEditDataList[index + 1]?.landShape || land.reportedShape,
        landSubType: landEditDataList[index + 1]?.siteType || land.landSubType,
        accessRoadLost: landEditDataList[index + 1]?.roadFrontageLoss || land.accessRoadLost,
        waterChannelLost: landEditDataList[index + 1]?.irrigationCanalLoss || land.waterChannelLost,
        farmMachineDifficulty: landEditDataList[index + 1]?.farmEquipmentTurnImpossible || land.farmMachineDifficulty,
      })),
      // landDataList도 업데이트
      landDataList: landEditDataList.map(data => ({
        currentUsage: data.landUseCategory as "대" | "전" | "답" | "과" | "목" | "임" | "광" | "염" | "잡" | "공",
        landSubType: data.siteType as "residential-detached" | "commercial" | "industrial",
        actualUsage: data.landUseCategory as "대" | "전" | "답" | "과" | "목" | "임" | "광" | "염" | "잡" | "공",
        reportedShape: data.landShape as "정방형" | "장방형" | "세장형" | "사다리꼴" | "삼각형" | "역삼각형" | "부정형",
        farmMachineDifficulty: data.farmEquipmentTurnImpossible,
        accessRoadLost: data.roadFrontageLoss,
        waterChannelLost: data.irrigationCanalLoss,
      })),
    };
    
    onSave(updatedApplication);
    setShowConfirmModal(false);
    onEditModeChange(false);
  };

  const handleCancel = () => {
    // 원래 데이터로 복원 (민원인이 신청 시 입력한 값)
    setEditData({
      applicantRelation: "owner",
      applicantName: application.applicantName,
      applicantContact: application.applicantContact,
      agentName: "",
      agentContact: "",
      postalCode: "",
      baseAddress: application.applicantAddress,
      detailAddress: "",
      reason: application.reason || "잔여지 매수 신청",
      attachments: [],
    });
    // 필지별 토지 데이터도 복원
    setLandEditDataList(initLandEditDataList());
    setSelectedLandIndex(0);
    onEditModeChange(false);
  };
  
  // 현재 선택된 필지의 토지 편집 데이터 업데이트
  const handleLandEditDataChange = (data: Partial<typeof landEditDataList[0]>) => {
    setLandEditDataList(prev => {
      const newList = [...prev];
      newList[selectedLandIndex] = { ...newList[selectedLandIndex], ...data };
      return newList;
    });
  };

  return (
    <div className="space-y-4 overflow-visible">
      {/* 상세 화면 타이틀 헤더 */}
      <div className="flex items-center justify-between px-0 py-3">
        <div className="flex items-center gap-3">
          <AdminStatusBadge status={toListStatus(application.adminStatus)} />
          <span className="text-lg font-semibold text-foreground">{application.applicationNumber}</span>
        </div>
        {/* 수정/저장/취소 버튼 - 접수완료 상태에서만 활성화 */}
        {isEditMode ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="h-8 gap-1.5 text-[15px]"
            >
              <X className="size-[18px]" />
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleSaveClick}
              className="h-8 gap-1.5 text-[15px]"
            >
              <Save className="size-[18px]" />
              저장
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {!canEdit && (
              <span className="text-[15px] text-muted-foreground">
                이미 심사가 완료되어 정보 수정이 제한됩니다
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={!canEdit}
              onClick={() => {
                if (onReapplyClick) {
                  onReapplyClick();
                } else {
                  onEditModeChange(true);
                }
              }}
              className={`h-8 text-[15px] ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              수정
            </Button>
          </div>
        )}
      </div>

      {/* 신청인 정보 테이블 */}
      <div className={`overflow-hidden rounded-lg border transition-colors duration-300 ${isEditMode ? "border-primary/50 bg-primary/5" : "border-border"}`}>
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5">
          <h4 className="font-semibold text-foreground">신청인 정보</h4>
        </div>
        
        {/* 신청일 행 */}
        <div className="flex border-b border-border">
          <div className="flex w-36 shrink-0 whitespace-nowrap items-center bg-muted/30 px-4 py-3">
            <span className="text-[15px] font-medium">신청일시</span>
          </div>
          <div className="flex flex-1 items-center px-4 py-3">
            <span className="text-[15px]">{formatDateTime(application.appliedAt)}</span>
          </div>
        </div>

        {/* 대리인 정보 (대리인 신청 시만 표시) */}
        {((isEditMode && editData.applicantRelation === "agent") || (!isEditMode && application.applicantRelation === "agent")) && (
          <>
            <div className="flex border-b border-border">
              <div className="flex w-36 shrink-0 whitespace-nowrap items-center bg-muted/30 px-4 py-3">
                <span className="text-[15px] font-medium">대리인 성명</span>
              </div>
              <div className="flex flex-1 items-center px-4 py-3">
                {isEditMode ? (
                  <Input
                    value={editData.agentName}
                    onChange={(e) => setEditData({ ...editData, agentName: e.target.value })}
                    placeholder="대리인 성명을 입력해주세요"
                    className="h-10 text-[15px]"
                  />
                ) : (
                  <span className="text-[15px]">{application.agentName || "-"}</span>
                )}
              </div>
            </div>
            <div className="flex border-b border-border">
              <div className="flex w-36 shrink-0 whitespace-nowrap items-center bg-muted/30 px-4 py-3">
                <span className="text-[15px] font-medium">대리인 연락처</span>
              </div>
              <div className="flex flex-1 items-center px-4 py-3">
                {isEditMode ? (
                  <Input
                    type="tel"
                    inputMode="numeric"
                    value={editData.agentContact}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      const formatted = value.length <= 3 ? value : value.length <= 7 ? `${value.slice(0, 3)}-${value.slice(3)}` : `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
                      setEditData({ ...editData, agentContact: formatted });
                    }}
                    placeholder="'-' 없이 숫자만 입력"
                    maxLength={13}
                    className="h-10 text-[15px]"
                  />
                ) : (
                  <span className="text-[15px]">{application.agentContact || "-"}</span>
                )}
              </div>
            </div>
            {isEditMode && (
              <div className="border-b border-border bg-amber-50 px-4 py-2">
                <p className="text-[15px] text-amber-700">
                  대리인 신청 시 위임장 및 대리인 신분증 사본을 첨부 서류에 추가해 주세요.
                </p>
              </div>
            )}
          </>
        )}

        {/* 소유자 성명 행 */}
        <div className="flex border-b border-border">
          <div className="flex w-36 shrink-0 whitespace-nowrap items-center bg-muted/30 px-4 py-3">
            <span className="text-[15px] font-medium">소유자 성명</span>
          </div>
          <div className="flex flex-1 items-center px-4 py-3">
            {isEditMode ? (
              <Input
                value={editData.applicantName}
                onChange={(e) => setEditData({ ...editData, applicantName: e.target.value })}
                className="h-10 text-[15px]"
              />
            ) : (
              <span className="text-[15px]">{application.applicantName}</span>
            )}
          </div>
        </div>

        {/* 소유자 연락처 행 */}
        <div className="flex border-b border-border">
          <div className="flex w-36 shrink-0 whitespace-nowrap items-center bg-muted/30 px-4 py-3">
            <span className="text-[15px] font-medium">소유자 연락처</span>
          </div>
          <div className="flex flex-1 items-center px-4 py-3">
            {isEditMode ? (
              <Input
                type="tel"
                inputMode="numeric"
                value={editData.applicantContact}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  const formatted = value.length <= 3 ? value : value.length <= 7 ? `${value.slice(0, 3)}-${value.slice(3)}` : `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
                  setEditData({ ...editData, applicantContact: formatted });
                }}
                placeholder="'-' 없이 숫자만 입력"
                maxLength={13}
                className="h-10 text-[15px]"
              />
            ) : (
              <span className="text-[15px]">{application.applicantContact}</span>
            )}
          </div>
        </div>

        {/* 주소 행 */}
        <div className="flex border-b border-border">
          <div className="flex w-36 shrink-0 whitespace-nowrap items-start bg-muted/30 px-4 py-3">
            <span className="text-[15px] font-medium">주소</span>
          </div>
          <div className="flex flex-1 items-center px-4 py-3">
            {isEditMode ? (
              <div className="w-full space-y-1.5">
                <div className="flex gap-2">
                  <Input
                    value={editData.postalCode}
                    placeholder="우편번호"
                    readOnly
                    className="h-10 w-24 bg-muted text-[15px]"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAddressModal(true)}
                    className="h-10 shrink-0"
                  >
                    주소 검색
                  </Button>
                </div>
                <Input
                  value={editData.baseAddress}
                  placeholder="기본주소"
                  readOnly
                  className="h-10 bg-muted text-[15px]"
                />
                <Input
                  value={editData.detailAddress}
                  onChange={(e) => setEditData({ ...editData, detailAddress: e.target.value })}
                  placeholder="상세주소를 입력해주세요"
                  className="h-10 text-[15px]"
                />
              </div>
            ) : (
              <span className="text-[15px]">{application.applicantAddress}</span>
            )}
          </div>
        </div>
      </div>

      {/* 주소 검색 모달 */}
      {showAddressModal && (
        <AddressSearchModal
          onSelect={handleAddressSelect}
          onClose={() => setShowAddressModal(false)}
        />
      )}

      {/* 토지 정보 (활용 지목, 토지 모양, 택지 유형, 확인 항목, 신청 사유, 첨부 서류) */}
      <LandInfoSection
        application={application}
        isEditMode={isEditMode}
        selectedLandIndex={selectedLandIndex}
        onSelectedLandIndexChange={setSelectedLandIndex}
        onSave={onSave}
        editData={{
          ...landEditDataList[selectedLandIndex],
          reason: editData.reason,
          attachments: editData.attachments,
        }}
        onEditDataChange={(data) => {
          // 토지 관련 필드는 필지별로 저장, 공통 필드는 editData에 저장
          const landFields = ['landUseCategory', 'landShape', 'siteType', 'roadFrontageLoss', 'irrigationCanalLoss', 'farmEquipmentTurnImpossible'];
          const landData: Record<string, unknown> = {};
          const commonData: Record<string, unknown> = {};
          
          Object.entries(data).forEach(([key, value]) => {
            if (landFields.includes(key)) {
              landData[key] = value;
            } else {
              commonData[key] = value;
            }
          });
          
          if (Object.keys(landData).length > 0) {
            handleLandEditDataChange(landData);
          }
          if (Object.keys(commonData).length > 0) {
            setEditData(prev => ({ ...prev, ...commonData }));
          }
        }}
        onFileChange={handleFileChange}
        onRemoveFile={handleRemoveFile}
        MAX_FILES={MAX_FILES}
      />

      {/* 컨펌 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">저장 확인</h3>
            <p className="mb-6 text-[15px] text-muted-foreground">
              변경된 내용을 저장하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
              >
                취소
              </Button>
              <Button onClick={handleConfirmSave}>
                저장
              </Button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
}

interface ApplicationStatusSectionProps {
  onReapply?: (application: Application) => void;
}

export function ApplicationStatusSection({ onReapply }: ApplicationStatusSectionProps) {
  const [applications, setApplications] = useState<Application[]>(dummyApplications);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [pendingApplication, setPendingApplication] = useState<Application | null>(null);
  const [showReapplyAlert, setShowReapplyAlert] = useState(false);
  const [reapplyTarget, setReapplyTarget] = useState<Application | null>(null);

  // 현재 로그인한 사용자의 신청 목록 (심의위원회 회부 케이스 상단 배치)
  const committeeStatuses = new Set(["심의위원회회부", "심의위원회검토중", "심의위원회검토완료"]);
  const myApplications = [...applications].sort((a, b) => {
    const aIsCommittee = committeeStatuses.has(a.adminStatus);
    const bIsCommittee = committeeStatuses.has(b.adminStatus);
    if (aIsCommittee === bIsCommittee) return 0;
    return aIsCommittee ? -1 : 1;
  });

  // 첫 번째 신청이 있으면 기본 선택
  const displayedApplication = selectedApplication || (myApplications.length > 0 ? myApplications[0] : null);

  // 신청 데이터 업데이트 핸들러
  const handleApplicationUpdate = (updatedApp: Application) => {
    setApplications(prev => prev.map(app => 
      app.id === updatedApp.id ? updatedApp : app
    ));
    setSelectedApplication(updatedApp);
  };

  // 목록 클릭 핸들러 - 수정 중이면 경고 표시
  const handleSelectApplication = (app: Application) => {
    if (isEditMode && displayedApplication?.id !== app.id) {
      setPendingApplication(app);
      setShowLeaveWarning(true);
    } else {
      setSelectedApplication(app);
    }
  };

  // 경고 확인 - 저장하지 않고 이동 (새 신청건은 기본 상태로 표시)
  const handleConfirmLeave = () => {
    if (pendingApplication) {
      setSelectedApplication(pendingApplication);
      setPendingApplication(null);
      setIsEditMode(false);
    }
    setShowLeaveWarning(false);
  };

  // 경고 취소 - 현재 수정 계속
  const handleCancelLeave = () => {
    setPendingApplication(null);
    setShowLeaveWarning(false);
  };

  return (
    <div>
      {/* 2-column 레이아웃: 왼쪽 리스트 / 오른쪽 상세 */}
      <div className="grid grid-cols-[320px_1fr] gap-4">
        {/* 왼쪽: 신청 목록 - 정부24 스타일 */}
        <div className="flex h-full max-h-[calc(100vh-200px)] flex-col overflow-hidden rounded-lg border border-border">
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5">
            <h3 className="font-semibold text-foreground">신청 목록</h3>
            <span className="text-[15px] text-muted-foreground">{myApplications.length}건</span>
          </div>
          
          {myApplications.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-[15px] font-medium text-foreground">신청 내역이 없습니다</p>
              <p className="mt-1 text-[15px] text-muted-foreground">
                신규 신청 탭에서 잔여지 매수를 신청해 주세요.
              </p>
            </div>
          ) : (
            <ul className="flex-1 divide-y divide-border overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
              {myApplications.map((app) => {
                const isSelected = displayedApplication?.id === app.id;
                const isMultipleLands = app.additionalLands && app.additionalLands.length > 0;

                return (
                  <li key={app.id}>
                    <button
                      onClick={() => handleSelectApplication(app)}
                      className={`group w-full px-4 py-3 text-left transition-all ${
                        isSelected 
                          ? "border-l-2 border-l-primary bg-primary/5" 
                          : "hover:bg-muted/50"
                      }`}
                    >
                      {/* 상단: 상태 + 접수번호 */}
                      <div className="flex items-center gap-2">
                        <AdminStatusBadge status={toListStatus(app.adminStatus)} size="sm" />
                        <span className={`text-[15px] font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                          {app.applicationNumber}
                        </span>
                      </div>

                      {/* 주소 */}
                      <p className="mt-1.5 truncate text-[15px] text-muted-foreground">
                        {app.landInfo.address}
                        {isMultipleLands && (
                          <span className="ml-1 font-medium text-black">외 {app.additionalLands.length}필지</span>
                        )}
                      </p>

                      {/* 하단: 날짜 */}
                      <div className="mt-2">
                        <span className="text-[15px] text-muted-foreground">{formatDateTime(app.appliedAt)}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 오른쪽: 신청 상세 정보 */}
        {displayedApplication ? (
          <ApplicationDetailPanel 
            application={displayedApplication} 
            isEditMode={isEditMode}
            onEditModeChange={setIsEditMode}
            onSave={handleApplicationUpdate}
            onReapplyClick={() => {
              setReapplyTarget(displayedApplication);
              setShowReapplyAlert(true);
            }}
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="border-b border-border bg-muted/50 px-4 py-2.5">
              <h4 className="font-semibold text-foreground">상세 정보</h4>
            </div>
            <div className="flex h-48 items-center justify-center">
              <div className="text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-[15px] text-muted-foreground">신청 내역을 선택해주세요</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 수정 중 이동 경고 모달 */}
      {showLeaveWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">수정 내용이 저장되지 않습니다</h3>
            <p className="mb-6 text-[15px] text-muted-foreground">
              현재 수정 중인 내용이 있습니다. 저장하지 않고 다른 신청으로 이동하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelLeave}>
                계속 수정하기
              </Button>
              <Button variant="destructive" onClick={handleConfirmLeave}>
                저장하지 않고 이동
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 재신청 알림 모달 */}
      {showReapplyAlert && reapplyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
            <h3 className="font-semibold text-lg mb-3">신청 내용 수정 안내</h3>
            
            <div className="text-[15px] text-muted-foreground space-y-2 mb-6">
              <p>신청 내용 수정 시 기존 신청은 자동 취소되며, 해당 필지로 새 신청서를 작성해야합니다.</p>
              <p className="text-[15px]">* 새로운 신청번호가 부여됩니다.</p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReapplyAlert(false);
                  setReapplyTarget(null);
                }}
              >
                취소
              </Button>
              <Button 
                onClick={() => {
                  setShowReapplyAlert(false);
                  if (onReapply && reapplyTarget) {
                    onReapply(reapplyTarget);
                  }
                  setReapplyTarget(null);
                }}
              >
                새 신청서 작성하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
