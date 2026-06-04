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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  Search, 
  Play, 
  CheckCircle2, 
  XCircle, 
  FileText,
  ChevronRight,
  MapPin,
  Ruler,
  Shapes,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { 
  PreRegisteredParcel, 
  AdminCheckItems, 
  LandCategory, 
  LandShape,
  AIAnalysisResult,
  LandInfo
} from "@/lib/types";
import { 
  preRegisteredParcels, 
  landCategories, 
  landShapes, 
  adminCheckItemOptions,
  dummyLandInfoList
} from "@/lib/dummy-data";

// 사업단별 잔여지 필지 리스트 (DB에서 가져온 것처럼 시뮬레이션)
const businessUnitParcels: { [key: string]: LandInfo[] } = {
  "수도권": dummyLandInfoList.filter(land => land.businessUnit === "수도권"),
  "화성평택": dummyLandInfoList.filter(land => land.businessUnit === "화성평택"),
  "세종천안": dummyLandInfoList.slice(0, 3).map(land => ({ ...land, businessUnit: "세종천안" as const })),
};

interface ParcelPreRegistrationProps {
  businessUnit: string;
  onRegisterComplete?: () => void;
}

export function ParcelPreRegistration({ businessUnit, onRegisterComplete }: ParcelPreRegistrationProps) {
  // 등록된 필지 목록
  const [registeredParcels, setRegisteredParcels] = useState<PreRegisteredParcel[]>(
    preRegisteredParcels.filter(p => p.businessUnit === businessUnit)
  );
  
  // 선택된 필지 (분석할 필지)
  const [selectedParcel, setSelectedParcel] = useState<LandInfo | null>(null);
  
  // 분석 설정 다이얼로그
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  
  // 담당자 확인항목
  const [checkItems, setCheckItems] = useState<AdminCheckItems>({
    farmMachineDifficulty: false,
    accessRoadLost: false,
    waterChannelLost: false,
  });
  
  // 현재 활용지목
  const [currentUsage, setCurrentUsage] = useState<LandCategory | "">("");
  
  // 토지모양
  const [landShape, setLandShape] = useState<LandShape | "">("");
  
  // 분석 중 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // 분석 결과 다이얼로그
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  
  // 검색어
  const [searchTerm, setSearchTerm] = useState("");
  
  // 필터링된 미등록 필지 목록
  const availableParcels = useMemo(() => {
    const parcels = businessUnitParcels[businessUnit] || dummyLandInfoList.slice(0, 5);
    const registeredIds = new Set(registeredParcels.map(p => p.landInfo.id));
    
    return parcels
      .filter(p => !registeredIds.has(p.id))
      .filter(p => 
        searchTerm === "" || 
        p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ownerName.includes(searchTerm)
      );
  }, [businessUnit, registeredParcels, searchTerm]);

  // 필지 선택 및 분석 다이얼로그 열기
  const handleSelectParcel = (parcel: LandInfo) => {
    setSelectedParcel(parcel);
    setCheckItems({
      farmMachineDifficulty: false,
      accessRoadLost: false,
      waterChannelLost: false,
    });
    setCurrentUsage(parcel.landCategory);
    setLandShape(parcel.remainingShape || "부정형");
    setShowAnalysisDialog(true);
  };

  // AI 분석 실행
  const handleRunAnalysis = async () => {
    if (!selectedParcel || !currentUsage || !landShape) return;
    
    setIsAnalyzing(true);
    
    // AI 분석 시뮬레이션 (실제로는 API 호출)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 분석 결과 생성 (시뮬레이션)
    const result = generateAnalysisResult(selectedParcel, checkItems, currentUsage, landShape);
    
    setAnalysisResult(result);
    setIsAnalyzing(false);
    setShowAnalysisDialog(false);
    setShowResultDialog(true);
  };

  // 분석 결과 생성 (시뮬레이션)
  const generateAnalysisResult = (
    parcel: LandInfo, 
    checks: AdminCheckItems,
    usage: LandCategory,
    shape: LandShape
  ): AIAnalysisResult => {
    const shapeIndexChange = parcel.remainingShapeIndex - parcel.originalShapeIndex;
    const isIrregularShape = ["삼각형", "역삼각형", "부정형", "자루형", "사다리형", "변형사다리형", "역사다리형"].includes(shape);
    
    // 매수 기준 판단
    const areaThreshold = parcel.landType === "택지" ? 90 : parcel.landType === "농지" ? 330 : 200;
    const isAreaMet = parcel.remainingArea <= areaThreshold;
    const isShapeMet = isIrregularShape;
    const isShapeIndexMet = shapeIndexChange >= 1.0;
    const hasSpecialCondition = checks.farmMachineDifficulty || checks.accessRoadLost || checks.waterChannelLost;
    
    const criteriaChecks = [
      { 
        criteriaName: "면적 기준", 
        criteriaDescription: `${parcel.landType} 기준 ${areaThreshold}㎡ 이하`, 
        isMet: isAreaMet, 
        autoDetected: true 
      },
      { 
        criteriaName: "형상 기준", 
        criteriaDescription: `비정형 형상 (${shape})`, 
        isMet: isShapeMet, 
        autoDetected: true 
      },
      { 
        criteriaName: "형상지수 변화", 
        criteriaDescription: "형상지수 1.0 이상 상승", 
        isMet: isShapeIndexMet, 
        autoDetected: true 
      },
    ];
    
    if (checks.farmMachineDifficulty) {
      criteriaChecks.push({ 
        criteriaName: "농기계 회전 곤란", 
        criteriaDescription: "농기계 회전 곤란으로 경작 불가", 
        isMet: true, 
        autoDetected: false 
      });
    }
    if (checks.accessRoadLost) {
      criteriaChecks.push({ 
        criteriaName: "접면도로 상실", 
        criteriaDescription: "접면도로 상실로 건축허가 불가", 
        isMet: true, 
        autoDetected: false 
      });
    }
    if (checks.waterChannelLost) {
      criteriaChecks.push({ 
        criteriaName: "관개수로 상실", 
        criteriaDescription: "관개수로 상실로 농업용수 공급 불가", 
        isMet: true, 
        autoDetected: false 
      });
    }

    const canPurchase = (isAreaMet || isShapeMet || isShapeIndexMet) || hasSpecialCondition;
    
    return {
      landTypePath: parcel.landType,
      criteriaChecks,
      provisionalJudgment: canPurchase ? "매수 가능성 높음" : "매수 가능성 낮음",
      originalShapeIndex: parcel.originalShapeIndex,
      remainingShapeIndex: parcel.remainingShapeIndex,
      shapeIndexChange,
      isBlindLand: checks.accessRoadLost,
      accessRoadLost: checks.accessRoadLost,
      waterChannelLost: checks.waterChannelLost,
      farmMachineDifficulty: checks.farmMachineDifficulty,
      judgmentRationale: {
        summary: canPurchase 
          ? `${parcel.landType} 잔여지 - 매수 기준 충족으로 「매수 가능성 높음」 판정`
          : `${parcel.landType} 잔여지 - 매수 기준 미충족으로 「매수 가능성 낮음」 판정`,
        legalBasis: "「공익사업을 위한 토지 등의 취득 및 보상에 관한 법률」 제74조",
        appliedCriteria: criteriaChecks.filter(c => c.isMet).map(c => c.criteriaName),
        detailedExplanation: canPurchase
          ? `본 필지는 잔여지 매수 기준을 충족하여 민원인 신청 시 매수 대상입니다.`
          : `본 필지는 잔여지 매수 기준을 충족하지 않아 매수 대상에서 제외됩니다.`,
      },
    };
  };

  // 등록 완료
  const handleRegister = () => {
    if (!selectedParcel || !analysisResult || !currentUsage || !landShape) return;
    
    const newParcel: PreRegisteredParcel = {
      id: `pre-${Date.now()}`,
      businessUnit: businessUnit as any,
      projectName: selectedParcel.projectName || "미지정 사업",
      landInfo: selectedParcel,
      adminCheckItems: checkItems,
      currentUsage: currentUsage,
      landShape: landShape,
      aiResult: analysisResult,
      preRegistrationStatus: "등록완료",
      registeredAt: new Date().toISOString(),
      registeredBy: "현재 담당자",
    };
    
    setRegisteredParcels(prev => [...prev, newParcel]);
    setShowResultDialog(false);
    setSelectedParcel(null);
    setAnalysisResult(null);
    
    onRegisterComplete?.();
  };

  return (
    <div className="space-y-6">
      {/* 상단 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">전체 등록 필지</p>
                <p className="text-3xl font-bold">{registeredParcels.length}</p>
              </div>
              <FileText className="h-10 w-10 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">매수 가능성 높음 필지</p>
                <p className="text-3xl font-bold text-green-600">
                  {registeredParcels.filter(p => p.aiResult.provisionalJudgment === "매수 가능성 높음").length}
                </p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">매수 가능성 낮음 필지</p>
                <p className="text-3xl font-bold text-red-600">
                  {registeredParcels.filter(p => p.aiResult.provisionalJudgment === "매수 가능성 낮음").length}
                </p>
              </div>
              <XCircle className="h-10 w-10 text-red-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 미등록 필지 목록 (AI 분석 대상) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">잔여지 AI 분석 및 등록</CardTitle>
          <CardDescription>
            사업단 할당 잔여지 중 아직 분석되지 않은 필지를 선택하여 AI 분석을 실행하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="주소 또는 소유자명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {availableParcels.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>지번주소</TableHead>
                  <TableHead>토지유형</TableHead>
                  <TableHead>지목</TableHead>
                  <TableHead className="text-right">잔여면적</TableHead>
                  <TableHead className="text-right">잔여비율</TableHead>
                  <TableHead>잔여지 형상</TableHead>
                  <TableHead>소유자</TableHead>
                  <TableHead className="text-center">AI 분석</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableParcels.map((parcel) => (
                  <TableRow key={parcel.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{parcel.address}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{parcel.landType}</Badge>
                    </TableCell>
                    <TableCell>{parcel.landCategory}</TableCell>
                    <TableCell className="text-right">{parcel.remainingArea.toLocaleString()}㎡</TableCell>
                    <TableCell className="text-right">{parcel.remainingRatio.toFixed(1)}%</TableCell>
                    <TableCell>{parcel.remainingShape}</TableCell>
                    <TableCell>{parcel.ownerName}</TableCell>
                    <TableCell className="text-center">
                      <Button 
                        size="sm" 
                        onClick={() => handleSelectParcel(parcel)}
                        className="gap-1"
                      >
                        <Play className="h-3 w-3" />
                        분석실행
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>분석 대기 중인 필지가 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 등록 완료 필지 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">등록 완료 필지 목록</CardTitle>
          <CardDescription>
            AI 분석이 완료되어 민원인이 조회 및 신청할 수 있는 필지 목록입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registeredParcels.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>지번주소</TableHead>
                  <TableHead>토지유형</TableHead>
                  <TableHead className="text-right">잔여면적</TableHead>
                  <TableHead>AI 판정</TableHead>
                  <TableHead>등록상태</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead>등록자</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registeredParcels.map((parcel) => (
                  <TableRow key={parcel.id}>
                    <TableCell className="font-medium">{parcel.landInfo.address}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{parcel.landInfo.landType}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {parcel.landInfo.remainingArea.toLocaleString()}㎡
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={parcel.aiResult.provisionalJudgment === "매수 가능성 높음" 
                          ? "bg-emerald-500 hover:bg-emerald-500/90 text-white" 
                          : "bg-rose-500 hover:bg-rose-500/90 text-white"
                        }
                      >
                        {parcel.aiResult.provisionalJudgment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        parcel.preRegistrationStatus === "등록완료"
                          ? "border-green-400 bg-green-50 text-green-600"
                          : "border-gray-400 bg-gray-50 text-gray-600"
                      }>
                        {parcel.preRegistrationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(parcel.registeredAt).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>{parcel.registeredBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>등록된 필지가 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI 분석 설정 다이얼로그 */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">AI 분석 실행</DialogTitle>
            <DialogDescription>
              필지 정보를 확인하고 담당자 확인항목을 선택한 후 AI 분석을 실행하세요.
            </DialogDescription>
          </DialogHeader>
          
          {selectedParcel && (
            <div className="space-y-6">
              {/* 필지 기본 정보 */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <MapPin className="h-5 w-5 text-primary" />
                  {selectedParcel.address}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
                  <div>
                    <span className="text-muted-foreground">토지유형</span>
                    <p className="font-medium">{selectedParcel.landType}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">지목</span>
                    <p className="font-medium">{selectedParcel.landCategory}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">잔여면적</span>
                    <p className="font-medium">{selectedParcel.remainingArea.toLocaleString()}㎡</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">잔여비율</span>
                    <p className="font-medium">{selectedParcel.remainingRatio.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {/* 담당자 확인항목 */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  담당자 확인항목 (현장 확인 사항)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {adminCheckItemOptions.map((item) => (
                    <div 
                      key={item.value} 
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => setCheckItems(prev => ({
                        ...prev,
                        [item.value]: !prev[item.value as keyof AdminCheckItems]
                      }))}
                    >
                      <Checkbox
                        id={item.value}
                        checked={checkItems[item.value as keyof AdminCheckItems]}
                        onCheckedChange={(checked) => 
                          setCheckItems(prev => ({
                            ...prev,
                            [item.value]: checked as boolean
                          }))
                        }
                      />
                      <Label htmlFor={item.value} className="cursor-pointer font-medium">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 현재 활용지목 선택 */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-blue-500" />
                  현재 활용지목
                </Label>
                <Select value={currentUsage} onValueChange={(v) => setCurrentUsage(v as LandCategory)}>
                  <SelectTrigger className="h-[40px]">
                    <SelectValue placeholder="활용지목을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {landCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 토지모양 선택 */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Shapes className="h-4 w-4 text-purple-500" />
                  토지모양
                </Label>
                <Select value={landShape} onValueChange={(v) => setLandShape(v as LandShape)}>
                  <SelectTrigger className="h-[40px]">
                    <SelectValue placeholder="토지모양을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-xs text-muted-foreground font-medium">정형</div>
                    {landShapes.regular.map((shape) => (
                      <SelectItem key={shape.value} value={shape.value}>
                        {shape.label}
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1 text-xs text-muted-foreground font-medium border-t mt-1 pt-2">비정형</div>
                    {landShapes.irregular.map((shape) => (
                      <SelectItem key={shape.value} value={shape.value}>
                        {shape.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnalysisDialog(false)}>
              취소
            </Button>
            <Button 
              onClick={handleRunAnalysis}
              disabled={!currentUsage || !landShape || isAnalyzing}
              className="gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  AI 분석 실행
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI 분석 결과 다이얼로그 */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              AI 분석 결과
              {analysisResult && (
                <Badge 
                  className={analysisResult.provisionalJudgment === "매수 가능성 높음" 
                    ? "bg-emerald-500 hover:bg-emerald-500/90 text-white text-lg px-3 py-1" 
                    : "bg-rose-500 hover:bg-rose-500/90 text-white text-lg px-3 py-1"
                  }
                >
                  {analysisResult.provisionalJudgment}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              AI 분석이 완료되었습니다. 결과를 확인하고 등록을 진행하세요.
            </DialogDescription>
          </DialogHeader>

          {analysisResult && selectedParcel && (
            <div className="space-y-6">
              {/* 필지 정보 요약 */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 font-semibold mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {selectedParcel.address}
                </div>
                <div className="grid grid-cols-3 gap-5 text-sm">
                  <div>
                    <span className="text-muted-foreground">토지유형</span>
                    <p className="font-medium">{selectedParcel.landType}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">잔여면적</span>
                    <p className="font-medium">{selectedParcel.remainingArea.toLocaleString()}㎡</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">형상지수 변화</span>
                    <p className="font-medium">
                      {analysisResult.originalShapeIndex.toFixed(1)} → {analysisResult.remainingShapeIndex.toFixed(1)}
                      <span className="text-primary ml-1">(+{analysisResult.shapeIndexChange.toFixed(1)})</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 기준 충족 여부 */}
              <div className="space-y-3">
                <h4 className="font-semibold">매수 기준 검토 결과</h4>
                <div className="space-y-2">
                  {analysisResult.criteriaChecks.map((check, index) => (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        check.isMet ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {check.isMet ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <p className="font-medium">{check.criteriaName}</p>
                          <p className="text-sm text-muted-foreground">{check.criteriaDescription}</p>
                        </div>
                      </div>
                      <Badge variant={check.isMet ? "default" : "secondary"}>
                        {check.isMet ? "충족" : "미충족"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI 상세 분석 내용 */}
              <div className="space-y-3">
                <h4 className="font-semibold">AI 상세 분석</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <p className="font-medium text-blue-900">
                    {analysisResult.judgmentRationale.summary}
                  </p>
                  <div className="text-sm text-blue-800">
                    <p className="mb-2">
                      <strong>법적 근거:</strong> {analysisResult.judgmentRationale.legalBasis}
                    </p>
                    <p className="mb-2">
                      <strong>적용 기준:</strong> {analysisResult.judgmentRationale.appliedCriteria.join(", ")}
                    </p>
                    <p>
                      <strong>상세 설명:</strong> {analysisResult.judgmentRationale.detailedExplanation}
                    </p>
                  </div>
                </div>
              </div>

              {/* 담당자 확인항목 표시 */}
              {(checkItems.farmMachineDifficulty || checkItems.accessRoadLost || checkItems.waterChannelLost) && (
                <div className="space-y-3">
                  <h4 className="font-semibold">담당자 확인항목</h4>
                  <div className="flex flex-wrap gap-2">
                    {checkItems.farmMachineDifficulty && (
                      <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-700">
                        농기계 회전 불가
                      </Badge>
                    )}
                    {checkItems.accessRoadLost && (
                      <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-700">
                        접면도로 상실
                      </Badge>
                    )}
                    {checkItems.waterChannelLost && (
                      <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-700">
                        관개수로 상실
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResultDialog(false)}>
              취소
            </Button>
            <Button onClick={handleRegister} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              등록 완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
