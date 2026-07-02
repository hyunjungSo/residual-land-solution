"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeafletMap } from "@/components/leaflet-map";
import { 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  FileText,
  ShoppingCart,
  Trash2,
  RefreshCw,
  Loader2,
  X,
  Scale,
  Plus
} from "lucide-react";
import { AIIcon } from "@/components/ui/ai-icon";
import type { PreRegisteredParcel, AdminCheckItems, LandShape, LandCategory, AIAnalysisResult } from "@/lib/types";
import { preRegisteredParcels, adminCheckItemOptions, dummyApplications } from "@/lib/dummy-data";

interface MyParcelListProps {
  onAddToCart: (parcel: PreRegisteredParcel) => void;
  onRemoveFromCart: (parcelId: string) => void;
  cartItems: PreRegisteredParcel[];
  onSubmitApplication: (parcels: PreRegisteredParcel[]) => void;
}

export function MyParcelList({ 
  onAddToCart, 
  onRemoveFromCart,
  cartItems, 
  onSubmitApplication 
}: MyParcelListProps) {
  // 선택된 필지
  const [selectedParcel, setSelectedParcel] = useState<PreRegisteredParcel | null>(null);
  const [hoveredParcelId, setHoveredParcelId] = useState<string | null>(null);
  
  // AI 재분석용 상태
  const [checkItems, setCheckItems] = useState<AdminCheckItems>({
    accessRoadLost: false,
    waterChannelLost: false,
    farmMachineDifficulty: false,
    farmMachineRotationDifficulty: false,
    livestockBuildingUnusable: false,
    adjacentSameOwnerLand: false,
  });
  const [selectedLandShape, setSelectedLandShape] = useState<LandShape | "">("");
  const [selectedLandUsage, setSelectedLandUsage] = useState<LandCategory | "">("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reanalyzedResult, setReanalyzedResult] = useState<AIAnalysisResult | null>(null);

  // 현재 로그인한 민원인 정보 (실제로는 인증 시스템에서 가져옴)
  const currentUser = {
    name: "이순신",
    contact: "010-1111-2222"
  };

  // 본인 소유 잔여지 필터링 (등록완료 상태인 필지만)
  const myParcels = useMemo(() => {
    return preRegisteredParcels.filter(
      p => p.preRegistrationStatus === "등록완료"
    );
  }, []);

  // 이미 신청된 필지 ID 목록
  const appliedParcelIds = useMemo(() => {
    return dummyApplications
      .filter(app => app.applicantName === currentUser.name)
      .map(app => app.landInfo.id);
  }, [currentUser.name]);

  // 필지가 이미 신청되었는지 확인
  const isAlreadyApplied = (parcelId: string) => {
    return appliedParcelIds.includes(parcelId);
  };

  // 장바구니에 담겼는지 확인
  const isInCart = (parcelId: string) => {
    return cartItems.some(item => item.id === parcelId);
  };

  // 필지 선택 핸들러
  const handleParcelSelect = (parcel: PreRegisteredParcel) => {
    setSelectedParcel(parcel);
    // 기존 확인 항목으로 초기화
    setCheckItems(parcel.adminCheckItems || {
      accessRoadLost: false,
      waterChannelLost: false,
      farmMachineDifficulty: false,
      farmMachineRotationDifficulty: false,
      livestockBuildingUnusable: false,
      adjacentSameOwnerLand: false,
    });
    setSelectedLandShape(parcel.landShape);
    setSelectedLandUsage(parcel.currentUsage);
    setReanalyzedResult(null);
  };

  // 장바구니에 추가
  const handleAddToCart = (parcel: PreRegisteredParcel) => {
    if (!isInCart(parcel.id) && !isAlreadyApplied(parcel.landInfo.id)) {
      onAddToCart(parcel);
    }
  };

  // AI 재분석 실행
  const handleReanalyze = async () => {
    if (!selectedParcel) return;
    
    setIsAnalyzing(true);
    
    // 시뮬레이션된 AI 분석 (실제로는 API 호출)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 확인 항목 중 하나라도 true면 보상 가능성 높음으로 판정 (시뮬레이션)
    const hasAnyCheckItem = checkItems.farmMachineDifficulty || checkItems.accessRoadLost || checkItems.waterChannelLost;
    const shapeIndexChange = selectedParcel.aiResult.shapeIndexChange;
    const meetsCriteria = hasAnyCheckItem || shapeIndexChange >= 1.0;
    
    const newResult: AIAnalysisResult = {
      ...selectedParcel.aiResult,
      provisionalJudgment: meetsCriteria ? "보상 가능성 높음" : "보상 가능성 낮음",
      farmMachineDifficulty: checkItems.farmMachineDifficulty,
      accessRoadLost: checkItems.accessRoadLost,
      waterChannelLost: checkItems.waterChannelLost,
      criteriaChecks: [
        { 
          criteriaName: "면적 기준", 
          criteriaDescription: `${selectedParcel.landInfo.landType} 기준 면적 이하`, 
          isMet: selectedParcel.landInfo.remainingArea <= 330, 
          autoDetected: true 
        },
        { 
          criteriaName: "형상 기준", 
          criteriaDescription: `비정형 형상 (${selectedLandShape})`, 
          isMet: !["정방형", "가로장방형", "세로장방형"].includes(selectedLandShape), 
          autoDetected: true 
        },
        { 
          criteriaName: "형상지수 변화", 
          criteriaDescription: "형상지수 1.0 이상 상승", 
          isMet: shapeIndexChange >= 1.0, 
          autoDetected: true 
        },
        ...(checkItems.farmMachineDifficulty ? [{
          criteriaName: "농기계 회전 곤란",
          criteriaDescription: "농기계 회전 곤란으로 경작 불가",
          isMet: true,
          autoDetected: false,
        }] : []),
        ...(checkItems.accessRoadLost ? [{
          criteriaName: "접면도로 상실",
          criteriaDescription: "맹지화로 건축허가 불가",
          isMet: true,
          autoDetected: false,
        }] : []),
        ...(checkItems.waterChannelLost ? [{
          criteriaName: "관개수로 상실",
          criteriaDescription: "관개수로 상실로 농업용수 공급 불가",
          isMet: true,
          autoDetected: false,
        }] : []),
      ],
      judgmentRationale: {
        ...selectedParcel.aiResult.judgmentRationale,
        summary: meetsCriteria 
          ? `${selectedParcel.landInfo.landType} 잔여지 - 선택된 기준 충족으로 「보상 가능성 높음」 판정`
          : `${selectedParcel.landInfo.landType} 잔여지 - 기준 미충족으로 「보상 가능성 낮음」 판정`,
        appliedCriteria: [
          `토지유형: ${selectedParcel.landInfo.landType}`,
          `토지형상: ${selectedLandShape}`,
          `활용지목: ${selectedLandUsage}`,
          ...(checkItems.farmMachineDifficulty ? ["농기계 회전 곤란: 해당"] : []),
          ...(checkItems.accessRoadLost ? ["접면도로 상실: 해당"] : []),
          ...(checkItems.waterChannelLost ? ["관개수로 상실: 해당"] : []),
        ],
      },
    };
    
    setReanalyzedResult(newResult);
    setIsAnalyzing(false);
  };

  // 지도 데이터
  const mapParcels = useMemo(() => {
    return myParcels.map(p => ({
      id: p.landInfo.id,
      address: p.landInfo.address,
      coordinates: p.landInfo.coordinates || [],
      isIncluded: false,
      isSelected: selectedParcel?.id === p.id,
      isHovered: hoveredParcelId === p.id,
    }));
  }, [myParcels, selectedParcel, hoveredParcelId]);

  const aiResult = reanalyzedResult || selectedParcel?.aiResult;
  const alreadyApplied = selectedParcel ? isAlreadyApplied(selectedParcel.landInfo.id) : false;

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[600px] w-full overflow-hidden rounded-lg border bg-background">
      {/* 좌측 패널 - 필지 목록 */}
      <div className="w-[320px] shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-base text-gray-900">{currentUser.name}님의 잔여지</h3>
            <Badge variant="secondary" className="bg-gray-100 text-gray-700">{myParcels.length}건</Badge>
          </div>
          <p className="text-xs text-gray-600">
            보상 가능성 높음한 필지 목록입니다.
          </p>
        </div>

        {/* 필지 목록 */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-white">
          {myParcels.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {myParcels.map((parcel) => {
                const applied = isAlreadyApplied(parcel.landInfo.id);
                const isEligible = parcel.aiResult.provisionalJudgment === "보상 가능성 높음";
                return (
                  <div
                    key={parcel.id}
                    className={`p-3 cursor-pointer transition-colors border-b border-gray-100 ${
                      applied ? "opacity-60 bg-gray-50" :
                      selectedParcel?.id === parcel.id 
                        ? "bg-blue-50 border-l-4 border-l-blue-500" 
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleParcelSelect(parcel)}
                    onMouseEnter={() => setHoveredParcelId(parcel.id)}
                    onMouseLeave={() => setHoveredParcelId(null)}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm leading-tight flex-1 line-clamp-2 text-gray-900">
                          {parcel.landInfo.address}
                        </p>
                        {applied && (
                          <Badge variant="secondary" className="text-xs shrink-0 bg-blue-100 text-blue-700">
                            신청완료
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Badge variant="outline" className="text-xs h-5 border-gray-200 text-gray-600">
                          {parcel.landInfo.landType}
                        </Badge>
                        <span>{parcel.landInfo.remainingArea.toLocaleString()}㎡</span>
                      </div>
                      <div className="flex items-center justify-between">
                        {isEligible ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-500/90 text-white text-xs px-2 py-1">
                            보상 가능성 높음
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-500 hover:bg-rose-500/90 text-white text-xs px-2 py-1">
                            보상 가능성 낮음
                          </Badge>
                        )}
                        {applied ? (
                          <span className="text-xs text-blue-600">처리중</span>
                        ) : isInCart(parcel.id) ? (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveFromCart(parcel.id);
                            }}
                            className="h-6 text-xs gap-1 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-3 w-3" />
                            제외
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(parcel);
                            }}
                            className="h-6 text-xs gap-1 px-2"
                          >
                            <Plus className="h-3 w-3" />
                            선택
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                소유하신 잔여지가 없습니다
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                사업지구 내 소유 토지가 잔여지로<br />
                결정되면 이곳에 표시됩니다.
              </p>
            </div>
          )}
        </div>

        {/* 신청 목록 요약 */}
        {cartItems.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-1.5 text-gray-900">
                <FileText className="h-4 w-4 text-blue-600" />
                신청 목록
              </span>
              <Badge className="bg-gray-200 text-gray-800">{cartItems.length}건</Badge>
            </div>
            
            {/* 선택된 필지 목록 */}
            <div className="space-y-1.5 mb-3 max-h-[120px] overflow-y-auto">
              {cartItems.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-1.5 bg-white rounded border border-gray-200 text-xs"
                >
                  <span className="truncate flex-1 mr-2 text-gray-700">
                    {item.landInfo.address.split(' ').slice(-2).join(' ')}
                  </span>
                  <button
                    onClick={() => onRemoveFromCart(item.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            
            <Button 
              className="w-full"
              onClick={() => onSubmitApplication(cartItems)}
            >
              신청서 작성
            </Button>
          </div>
        )}
      </div>

      {/* AI 분석 결과 패널 */}
      {selectedParcel && (
        <div className="w-[380px] shrink-0 bg-background border-r flex flex-col overflow-hidden">
          {/* 헤더 */}
          <div className="p-3 border-b bg-muted/30 shrink-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{selectedParcel.landInfo.address}</h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{selectedParcel.landInfo.landType}</span>
                  <span>|</span>
                  <span>{selectedParcel.landInfo.remainingArea.toLocaleString()}㎡</span>
                  <span>({selectedParcel.landInfo.remainingRatio.toFixed(1)}%)</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => setSelectedParcel(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 컨텐츠 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* 현재 AI 결과 (선택 즉시 표시) */}
            {(() => {
              const aiResult = reanalyzedResult || selectedParcel.aiResult;
              const alreadyApplied = isAlreadyApplied(selectedParcel.landInfo.id);
              
              return (
                <>
                  {/* 신청 완료 안내 */}
                  {alreadyApplied && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">이미 신청된 필지입니다.</span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">현재 검토 중이며 처리 완료 시 알림 드립니다.</p>
                    </div>
                  )}

                  {/* AI 판정 결과 (항상 표시) */}
                  <div className={`rounded-lg border-2 p-3 ${
                    aiResult.provisionalJudgment === "보상 가능성 높음"
                      ? "border-emerald-500 bg-emerald-500/5"
                      : "border-rose-500 bg-rose-500/5"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold flex items-center gap-1.5">
                        <AIIcon className="h-4 w-4" />
                        AI 분석 결과
                        {reanalyzedResult && <Badge variant="outline" className="text-xs ml-1">재분석</Badge>}
                      </span>
                      <Badge className={`text-xs text-white ${
                        aiResult.provisionalJudgment === "보상 가능성 높음"
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                      }`}>
                        {aiResult.provisionalJudgment === "보상 가능성 높음" ? "보상 가능성 높음" : "보상 가능성 낮음"}
                      </Badge>
                    </div>

                    {aiResult.judgmentRationale && (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                          <p className="text-muted-foreground leading-relaxed text-xs">
                            {aiResult.judgmentRationale.summary}
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <Scale className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                          <p className="text-xs text-muted-foreground">
                            {aiResult.judgmentRationale.legalBasis}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 기준 충족 여부 */}
                    <div className="mt-3 space-y-1">
                      {aiResult.criteriaChecks.map((check, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-center justify-between p-1.5 rounded text-xs ${
                            check.isMet ? 'bg-green-50' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {check.isMet ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-gray-400" />
                            )}
                            <span>{check.criteriaName}</span>
                          </div>
                          <Badge variant={check.isMet ? "default" : "secondary"} className="text-xs h-5">
                            {check.isMet ? "충족" : "미충족"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 확인 항목 선택 (재분석용) - 신청 완료가 아닐 때만 */}
                  {!alreadyApplied && (
                    <div className="space-y-2 border rounded-lg p-3">
                      <h5 className="font-medium text-sm flex items-center gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5" />
                        확인 항목 변경 (AI 재분석)
                      </h5>
                      
                      <div className="grid grid-cols-1 gap-1.5">
                        {adminCheckItemOptions.map((option) => (
                          <div 
                            key={option.value}
                            className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors text-base ${
                              checkItems?.[option.value as keyof AdminCheckItems] 
                                ? 'bg-primary/10 border-primary' 
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => setCheckItems(prev => ({
                              ...prev,
                              [option.value]: !prev?.[option.value as keyof AdminCheckItems]
                            }))}
                          >
                            <Checkbox 
                              id={option.value}
                              checked={checkItems?.[option.value as keyof AdminCheckItems] ?? false}
                              onCheckedChange={(checked) => setCheckItems(prev => ({
                                ...prev,
                                [option.value]: !!checked
                              }))}
                            />
                            <Label htmlFor={option.value} className="cursor-pointer font-normal text-base flex-1">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <Label className="text-xs text-muted-foreground">토지 형상</Label>
                          <Select value={selectedLandShape} onValueChange={(v) => setSelectedLandShape(v as LandShape)}>
                            <SelectTrigger className="h-8 text-xs mt-1">
                              <SelectValue placeholder="선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {["정방형", "가로장방형", "세로장방형", "사다리형", "역사다리형", "부정형", "삼각형", "역삼각형", "자루형"].map((shape) => (
                                <SelectItem key={shape} value={shape} className="text-xs">{shape}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">활용지목</Label>
                          <Select value={selectedLandUsage} onValueChange={(v) => setSelectedLandUsage(v as LandCategory)}>
                            <SelectTrigger className="h-8 text-xs mt-1">
                              <SelectValue placeholder="선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {["전", "답", "과", "대", "임", "목", "잡"].map((usage) => (
                                <SelectItem key={usage} value={usage} className="text-xs">{usage}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleReanalyze}
                        disabled={isAnalyzing}
                        className="w-full gap-1.5 mt-2"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            분석 중...
                          </>
                        ) : (
                          <>
                            <AIIcon className="h-4 w-4" />
                            AI 재분석
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* 하단 액션 */}
          <div className="p-3 border-t bg-muted/30 shrink-0">
            {isAlreadyApplied(selectedParcel.landInfo.id) ? (
              <Badge variant="secondary" className="w-full h-12 flex items-center justify-center bg-blue-100 text-blue-700">
                신청완료 - 처리 중
              </Badge>
            ) : isInCart(selectedParcel.id) ? (
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => onRemoveFromCart(selectedParcel.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  제거
                </Button>
                <span className="flex-1 text-center font-medium text-primary">
                  신청 목록에 추가됨
                </span>
              </div>
            ) : (reanalyzedResult || selectedParcel.aiResult).provisionalJudgment === "보상 가능성 높음" ? (
              <Button 
                className="w-full gap-1.5"
                onClick={() => handleAddToCart(selectedParcel)}
              >
                <ShoppingCart className="h-4 w-4" />
                신청 목록에 담기
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 text-center">
                  AI 분석 결과, 보상 신청 기준을 충족하지 않습니다.
                </p>
                <Button
                  variant="ghost"
                  onClick={() => handleAddToCart(selectedParcel)}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  기준 미충족 필지 신청 진행
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 지도 영역 */}
      <div className="flex-1 min-w-0">
        <LeafletMap
          parcels={mapParcels}
          onParcelClick={(id) => {
            const parcel = myParcels.find(p => p.landInfo.id === id);
            if (parcel) handleParcelSelect(parcel);
          }}
          selectedParcelId={selectedParcel?.landInfo.id}
        />
      </div>
    </div>
  );
}
