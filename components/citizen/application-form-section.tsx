"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AdminStatusBadge } from "@/components/ui/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { landCategories } from "@/lib/dummy-data";
import type { LandInfo, Application, LandCategory, LandShape, AIAnalysisResult } from "@/lib/types";
import { ArrowLeft, Upload, Send, Bot, CheckCircle2, XCircle, Trash2, Loader2, ChevronDown, AlertTriangle } from "lucide-react";
import { LandUsageSelect, getLandUsageLabel } from "@/components/common/land-usage-select";
import { BuildingTypeSelect } from "@/components/common/building-type-select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { JudgmentStatus } from "@/components/ui/judgment-status";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ApplicationFormSectionProps {
  landInfo: LandInfo;
  landInfoList?: LandInfo[]; // 복수 필지 신청용
  aiResult: AIAnalysisResult;
  aiResultList?: AIAnalysisResult[]; // 복수 필지 AI 결과
  onSubmit: (application: Application) => void;
  onBack: () => void;
}

// 샘플 주소 데이터
const sampleAddresses = [
  { postalCode: "31000", address: "충청남도 천안시 동남구 신부동 100" },
  { postalCode: "31001", address: "충청남도 천안시 동남구 신방동 200" },
  { postalCode: "31002", address: "충청남도 천안시 동남구 봉명동 300" },
  { postalCode: "31010", address: "충청남도 천안시 서북구 성정동 150" },
  { postalCode: "31011", address: "충청남도 천안시 서북구 쌍용동 250" },
  { postalCode: "31100", address: "충청남도 아산시 탕정면 갈산리 50" },
  { postalCode: "31101", address: "충청남도 아산시 배방읍 장재리 100" },
  { postalCode: "31200", address: "충청남도 공주시 중동 200" },
  { postalCode: "31201", address: "충청남도 공주시 산성동 300" },
  { postalCode: "31300", address: "충청남도 논산시 내동 150" },
];

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
    
    // 샘플 데이터에서 검색 (실제로는 API 호출)
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
          <p className="text-muted-foreground" style={{ fontSize: '14px' }}>
            * 정확한 주소를 찾을 수 없는 경우, 가까운 건물명이나 도로명으로 검색해 보세요.
          </p>
        </div>
      </div>
    </div>
  );
}



export function ApplicationFormSection({
  landInfo,
  landInfoList,
  aiResult,
  aiResultList,
  onSubmit,
  onBack,
}: ApplicationFormSectionProps) {
  // 복수 필지 여부
  const isMultipleLands = landInfoList && landInfoList.length > 1;
  const allLands = landInfoList || [landInfo];
  const allAiResults = aiResultList || [aiResult];
  interface FileItem {
    name: string;
    size: string;
    status: "uploading" | "complete";
  }

  // 토지별 개별 입력 데이터 타입
  interface LandSpecificData {
    currentUsage: LandCategory;
    landSubType: "" | "residential-detached" | "residential-multi" | "residential-apartment" | "commercial" | "industrial";
    actualUsage: LandCategory;
    reportedShape: LandShape;
    farmMachineDifficulty: boolean;
    accessRoadLost: boolean;
    waterChannelLost: boolean;
  }

  // 토지별 초기 데이터 생성
  const createInitialLandData = (land: LandInfo): LandSpecificData => ({
    currentUsage: land.landCategory as LandCategory,
    landSubType: "",
    actualUsage: land.landCategory as LandCategory,
    reportedShape: land.remainingShape as LandShape,
    farmMachineDifficulty: false,
    accessRoadLost: false,
    waterChannelLost: false,
  });

  const [formData, setFormData] = useState({
    applicantName: landInfo.ownerName,
    applicantContact: landInfo.ownerContact || "",
    postalCode: "",
    baseAddress: "",
    detailAddress: "",
    // 신청인과 소유자 관계 (본인/대리인)
    applicantRelation: "owner" as "owner" | "agent",
    agentName: "",
    agentContact: "",
    reason: "",
    attachments: [] as FileItem[],
  });

  // 토지별 개별 데이터 상태
  const [landDataList, setLandDataList] = useState<LandSpecificData[]>(
    allLands.map(createInitialLandData)
  );

  // 토지별 데이터 업데이트 함수
  const updateLandData = (index: number, field: keyof LandSpecificData, value: LandSpecificData[keyof LandSpecificData]) => {
    setLandDataList(prev => {
      const newList = [...prev];
      newList[index] = { ...newList[index], [field]: value };
      // 택지가 아니면 세부 유형 초기화
      if (field === "currentUsage" && value !== "대") {
        newList[index].landSubType = "";
      }
      return newList;
    });
  };

  const [isAddressSearchOpen, setIsAddressSearchOpen] = useState(false);

  const MAX_FILES = 10;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // 필수 입력값 검증 함수
  const isFormValid = () => {
    // 기본 필수 필드 검증
    const hasApplicantName = formData.applicantName.trim() !== "";
    const hasApplicantContact = formData.applicantContact.trim() !== "";
    const hasPostalCode = formData.postalCode.trim() !== "";
    const hasBaseAddress = formData.baseAddress.trim() !== "";
    const hasReason = formData.reason.trim() !== "";

    // 대리인인 경우 대리인 정보도 필수
    const isAgentValid = formData.applicantRelation === "owner" || 
      (formData.agentName.trim() !== "" && formData.agentContact.trim() !== "");

    return hasApplicantName && hasApplicantContact && hasPostalCode && hasBaseAddress && hasReason && isAgentValid;
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);

    // 첫 번째 토지의 데이터 사용 (단일 필지의 경우)
    const firstLandData = landDataList[0];

    // 신청 데이터 생성
    const application: Application = {
      id: `app-${Date.now()}`,
      applicationType: "single",
      applicationNumber: `2026-${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`,
      applicantName: formData.applicantName,
      applicantContact: formData.applicantContact,
      applicantAddress: `(${formData.postalCode}) ${formData.baseAddress} ${formData.detailAddress}`.trim(),
      landInfo,
      actualUsage: firstLandData.actualUsage,
      reportedShape: firstLandData.reportedShape,
      farmMachineDifficulty: firstLandData.farmMachineDifficulty,
      reason: formData.reason,
      attachments: formData.attachments as unknown as string[],
      status: "접수완료",
      adminStatus: "접수완료",
      appliedAt: new Date().toISOString().split("T")[0],
      aiResult: aiResult,
      // 복수 필지일 경우 추가 토지 정보
      additionalLands: isMultipleLands ? allLands.slice(1) : undefined,
      // 복수 필지일 경우 토지별 데이터 추가
      landDataList: isMultipleLands ? landDataList : undefined,
    };

    // 시뮬레이션을 위한 딜레이
    setTimeout(() => {
      setIsSubmitting(false);
      onSubmit(application);
    }, 1500);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + "B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
    return (bytes / (1024 * 1024)).toFixed(1) + "MB";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles: FileItem[] = Array.from(files).map((f) => ({
        name: f.name,
        size: formatFileSize(f.size),
        status: "uploading" as const,
      }));

      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...newFiles].slice(0, MAX_FILES),
      }));

      // Simulate upload completion
      setTimeout(() => {
        setFormData((prev) => ({
          ...prev,
          attachments: prev.attachments.map((file) =>
            file.status === "uploading" ? { ...file, status: "complete" } : file
          ),
        }));
      }, 1500);
    }
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveAllFiles = () => {
    setFormData((prev) => ({
      ...prev,
      attachments: [],
    }));
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4 h-auto px-0 text-muted-foreground hover:bg-transparent hover:text-foreground">
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        토지 조회로 돌아가기
      </Button>

      <div className="space-y-6">
        {/* 신청서 양식 */}
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">보상 신청서 작성</CardTitle>
            <CardDescription>
              신청인 정보와 토지 관련 정보를 입력해주세요. * 표시는 필수 항목입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitClick} className="space-y-6">
              {/* 신청인 정보 - 깔끔한 선택형 레이아웃 */}
              <div className="space-y-5">
                <h4 className="border-b border-border pb-2 text-base font-medium text-foreground">신청인 정보</h4>
                
                {/* 신청 구분 */}
                <div className="space-y-2 max-w-[500px]">
                  <label className="text-sm font-medium">신청 구분 <span className="text-orange-500">*</span></label>
                  <div className="flex items-center gap-6">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="applicantRelation"
                        value="owner"
                        checked={formData.applicantRelation === "owner"}
                        onChange={() => setFormData((prev) => ({ ...prev, applicantRelation: "owner" }))}
                        className="h-4 w-4 accent-gray-900"
                      />
                      <span className="text-sm">본인 신청</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="applicantRelation"
                        value="agent"
                        checked={formData.applicantRelation === "agent"}
                        onChange={() => setFormData((prev) => ({ ...prev, applicantRelation: "agent" }))}
                        className="h-4 w-4 accent-gray-900"
                      />
                      <span className="text-sm">대리인 신청</span>
                    </label>
                  </div>
                  {formData.applicantRelation === "agent" && (
                    <p className="flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-500">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      대리인 신청 시 위임장 및 대리인 신분증 사본을 첨부 서류에 추가해 주세요.
                    </p>
                  )}
                </div>

                {/* 소유자 정보 */}
                <div className="grid gap-4 sm:grid-cols-2 max-w-[500px]">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">소유자 성명 <span className="text-orange-500">*</span></label>
                    <Input
                      id="applicantName"
                      value={formData.applicantName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, applicantName: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">소유자 연락처 <span className="text-orange-500">*</span></label>
                    <Input
                      id="applicantContact"
                      type="tel"
                      inputMode="numeric"
                      placeholder="'-' 없이 숫자만 입력"
                      value={formData.applicantContact}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        const formatted = value.length <= 3 ? value : value.length <= 7 ? `${value.slice(0, 3)}-${value.slice(3)}` : `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
                        setFormData((prev) => ({ ...prev, applicantContact: formatted }));
                      }}
                      maxLength={13}
                      required
                    />
                  </div>
                </div>

                {/* 대리인 정보 (대리인 신청 시만 표시) */}
                {formData.applicantRelation === "agent" && (
                  <div className="grid gap-4 sm:grid-cols-2 max-w-[500px]">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">대리인 성명 <span className="text-orange-500">*</span></label>
                      <Input
                        id="agentName"
                        value={formData.agentName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, agentName: e.target.value }))
                        }
                        required={formData.applicantRelation === "agent"}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">대리인 연락처 <span className="text-orange-500">*</span></label>
                      <Input
                        id="agentContact"
                        type="tel"
                        inputMode="numeric"
                        placeholder="'-' 없이 숫자만 입력"
                        value={formData.agentContact}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "");
                          const formatted = value.length <= 3 ? value : value.length <= 7 ? `${value.slice(0, 3)}-${value.slice(3)}` : `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
                          setFormData((prev) => ({ ...prev, agentContact: formatted }));
                        }}
                        maxLength={13}
                        required={formData.applicantRelation === "agent"}
                      />
                    </div>
                  </div>
                )}

                {/* 주소 */}
                <div className="space-y-1.5 max-w-[500px]">
                  <label className="text-sm font-medium">주소 <span className="text-orange-500">*</span></label>
                  <div className="flex gap-2">
                    <Input
                      id="postalCode"
                      placeholder="우편번호"
                      value={formData.postalCode}
                      readOnly
                      className="w-28 bg-muted"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="shrink-0"
                      onClick={() => setIsAddressSearchOpen(true)}
                    >
                      주소 검색
                    </Button>
                  </div>
                  <Input
                    id="baseAddress"
                    placeholder="기본주소"
                    value={formData.baseAddress}
                    readOnly
                    className="bg-muted"
                  />
                  <Input
                    id="detailAddress"
                    placeholder="상세주소를 입력해주세요"
                    value={formData.detailAddress}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, detailAddress: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* 주소 검색 모달 */}
              {isAddressSearchOpen && (
                <AddressSearchModal
                  onSelect={(address) => {
                    setFormData((prev) => ({
                      ...prev,
                      postalCode: address.postalCode,
                      baseAddress: address.address,
                    }));
                    setIsAddressSearchOpen(false);
                  }}
                  onClose={() => setIsAddressSearchOpen(false)}
                />
              )}

              {/* 토지 정보 - 아코디언 레이아웃 */}
              <div className="pt-6 space-y-4">
                {/* 토지 정보 타이틀 */}
                <div className="border-b border-border pb-2">
                  <h4 className="text-base font-medium text-foreground">토지 정보</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    AI 판단과 실제 현황이 다를 수 있습니다. 현재 토지의 실제 활용 상황을 입력해 주세요.
                  </p>
                </div>
                
                {/* 필지 목록 */}
                <div className="space-y-2">
                {allLands.map((land, index) => {
                  const landData = landDataList[index];
                  const isAgricultural = land.landType === "농지" || landData.currentUsage === "답" || landData.currentUsage === "전";
                  
                  // 필지 내용 컴포넌트
                  const LandContent = (
                    <div className="space-y-5">
                      {isMultipleLands && (
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">소재지</label>
                          <p className="text-sm text-muted-foreground">{land.address}</p>
                        </div>
                      )}
                      
                      {/* 활용 지목 / 공부상 지목 / 토지 모양 - 한 열 정렬 */}
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">활용 지목 <span className="text-orange-500">*</span></label>
                          <LandUsageSelect
                            value={landData.currentUsage}
                            onValueChange={(value) => updateLandData(index, "currentUsage", value as LandCategory)}
                          />
                          <p className="text-xs text-muted-foreground">
                            AI 판단: {getLandUsageLabel(land.landCategory)}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-muted-foreground">공부상 지목</label>
                          <div className="flex w-fit items-center whitespace-nowrap rounded-md border border-input bg-muted px-4 py-3 h-12 text-base text-muted-foreground cursor-not-allowed opacity-70">
                            {getLandUsageLabel(land.landCategory)}
                          </div>
                        </div>
                      </div>

                      {/* 택지 선택 시 세부 유형 */}
                      {landData.currentUsage === "대" && (
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">택지 유형</label>
                            <Select
                              value={landData.landSubType}
                              onValueChange={(value) => updateLandData(index, "landSubType", value as typeof landData.landSubType)}
                            >
<SelectTrigger>
                              <SelectValue placeholder="현재 활용 지목을 선택해 주세요" />
                            </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="residential-detached">주거용 (기준 90㎡ 이하)</SelectItem>
                                <SelectItem value="commercial">상업용 (기준 150㎡ 이하)</SelectItem>
                                <SelectItem value="industrial">공업용 (기준 330㎡ 이하)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {/* 직접 확인 항목 */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">확인 항목</label>
                        <p className="text-xs text-muted-foreground">
                          AI가 자동 판독할 수 없는 사항입니다. 해당되는 경우 체크해 주세요.
                        </p>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                          <label className="flex cursor-pointer items-center gap-2">
                            <Checkbox
                              id={`accessRoadLost-${index}`}
                              checked={landData.accessRoadLost}
                              onCheckedChange={(checked) => updateLandData(index, "accessRoadLost", checked === true)}
                            />
                            <span className="text-sm">접면도로 상실</span>
                          </label>
                          
                          {isAgricultural && (
                            <>
                              <label className="flex cursor-pointer items-center gap-2">
                                <Checkbox
                                  id={`waterChannelLost-${index}`}
                                  checked={landData.waterChannelLost}
                                  onCheckedChange={(checked) => updateLandData(index, "waterChannelLost", checked === true)}
                                />
                                <span className="text-sm">관개수로 상실</span>
                              </label>
                              <label className="flex cursor-pointer items-center gap-2">
                                <Checkbox
                                  id={`farmMachine-${index}`}
                                  checked={landData.farmMachineDifficulty}
                                  onCheckedChange={(checked) => updateLandData(index, "farmMachineDifficulty", checked === true)}
                                />
                                <span className="text-sm">농기계 회전 곤란</span>
                              </label>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );

                  // 복수 필지: 아코디언으로 표시
                  if (isMultipleLands) {
                    return (
                      <Collapsible key={land.id} defaultOpen={index === 0}>
                        <div className="rounded-lg border border-border overflow-hidden">
                          <CollapsibleTrigger className="flex w-full items-center justify-between bg-muted/30 px-4 py-3 text-left hover:bg-muted/50 transition-colors [&[data-state=open]>svg]:rotate-180">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-foreground">
                                필지 {index + 1}
                              </span>
                              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                {land.remainingArea.toLocaleString()}m²
                              </span>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="border-t border-border px-4 py-4">
                              {LandContent}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  }

                  // 단일 필지: 기존 스타일 (토지 정보 타이틀 제거, 상위에 이미 있음)
                  return (
                    <div key={land.id} className="space-y-5">
                      {LandContent}
                    </div>
                  );
                })}
                </div>
              </div>

              {/* 신청 사유 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">신청 사유 <span className="text-orange-500">*</span></label>
                <Textarea
                  id="reason"
                  placeholder="잔여지 보상를 신청하는 사유를 상세히 작성해주세요."
                  rows={3}
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  className="w-full resize-none"
                  required
                />
              </div>

              {/* 첨부 서류 - KRDS 스타일 */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">첨부 서류</label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    PDF, JPG, PNG 파일 (최대 {MAX_FILES}개, 파일당 20MB 이하)
                  </p>
                </div>
                
                {/* 드롭 영역 + 파일 선택 버튼 */}
                <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4">
                  <p className="mb-3 text-center text-sm text-muted-foreground">
                    첨부할 파일을 여기에 끌어다 놓거나, 파일 선택 버튼을 눌러 파일을 직접 선택해주세요.
                  </p>
                  <div className="flex items-center justify-center">
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-gray-50">
                        <Upload className="h-4 w-4" />
                        파일선택
                      </span>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                {/* 파일 카운터 + 전체 삭제 */}
                {formData.attachments.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {formData.attachments.length}개 / {MAX_FILES}개
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAllFiles}
                      className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-destructive"
                    >
                      전체 파일 삭제
                    </Button>
                  </div>
                )}

                {/* 파일 리스트 - KRDS 스타일 */}
                {formData.attachments.length > 0 && (
                  <ul className="flex flex-wrap gap-2" role="list" aria-label="첨부된 파일 목록">
                    {formData.attachments.map((file, index) => (
                      <li
                        key={index}
                        className="group flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3 max-w-full"
                        role="listitem"
                      >
                        <span className="truncate text-sm text-foreground" id={`file-${index}`}>
                          {file.name} <span className="text-muted-foreground">[{file.size}]</span>
                        </span>
                        <div className="ml-3 flex shrink-0 items-center gap-2">
                          {file.status === "uploading" ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="업로드 중" />
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(index)}
                              className="rounded p-1 text-muted-foreground transition-colors hover:bg-gray-100 hover:text-destructive"
                              aria-describedby={`file-${index}`}
                              aria-label="삭제"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 제출 버튼 */}
              <Button
                type="submit"
                size="lg"
                className="mx-auto flex h-12 w-full max-w-[400px] items-center justify-center gap-2 text-base"
                disabled={isSubmitting || !isFormValid()}
              >
                {isSubmitting ? (
                  "신청서 제출 중..."
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    보상 신청서 제출
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* 제출 확인 다이얼로그 */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>잔여지 보상 신청서를 제출하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-muted-foreground">
                <p className="text-sm">
                  제출 후 신청 내용 수정이 필요한 경우, 기존 신청을 취소하고 새로 신청서를 작성해야 합니다.
                </p>
                <p className="text-xs text-muted-foreground/70">
                  제출 전 신청 내용을 다시 한번 확인해 주세요.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>
              신청서 제출
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
