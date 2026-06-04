"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Lock,
  User,
  FileText,
  Info,
  Eye,
  EyeOff,
  Building2,
  BarChart3
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { 
  ProcessedParcel, 
  OwnerVerification,
  AIJudgmentResult
} from "@/lib/types";
import { dummyProcessedParcels } from "@/lib/dummy-data";
import { formatDateTime } from "@/lib/format";

interface OwnerParcelSearchProps {
  onSelectParcel?: (parcel: ProcessedParcel) => void;
}

export function OwnerParcelSearch({ onSelectParcel }: OwnerParcelSearchProps) {
  // 인증 상태
  const [isVerified, setIsVerified] = useState(false);
  const [verification, setVerification] = useState<OwnerVerification | null>(null);
  
  // 인증 입력
  const [verificationMethod, setVerificationMethod] = useState<"주민번호" | "소재지">("주민번호");
  const [ownerName, setOwnerName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [verificationError, setVerificationError] = useState("");
  
  // 필지 목록
  const [selectedParcel, setSelectedParcel] = useState<ProcessedParcel | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // 공개된 필지만 필터링 (담당자 확인 완료 또는 공개 상태)
  const publicParcels = useMemo(() => {
    return dummyProcessedParcels.filter(p => 
      p.publishStatus === "담당자확인완료" || p.publishStatus === "공개"
    );
  }, []);

  // 본인 소유 필지 필터링
  const myParcels = useMemo(() => {
    if (!verification) return [];
    
    // 실제로는 소유자 정보로 필터링
    // 여기서는 시뮬레이션으로 ownerIdentifier와 매칭
    return publicParcels.filter(p => {
      // 이름 매칭 (시뮬레이션)
      if (p.landInfo.ownerName === verification.ownerName) return true;
      // 또는 식별자 매칭
      if (p.ownerIdentifier === verification.identifier) return true;
      return false;
    });
  }, [publicParcels, verification]);

  // 인증 처리
  const handleVerify = () => {
    setVerificationError("");
    
    if (!ownerName.trim()) {
      setVerificationError("소유자명을 입력해주세요.");
      return;
    }
    
    if (!identifier.trim()) {
      setVerificationError(
        verificationMethod === "주민번호" 
          ? "주민등록번호 뒷자리를 입력해주세요." 
          : "토지 소재지를 입력해주세요."
      );
      return;
    }
    
    // 시뮬레이션: 인증 성공
    // 실제로는 서버에서 소유자 정보 확인
    const matchedParcel = publicParcels.find(p => 
      p.landInfo.ownerName === ownerName || 
      p.ownerIdentifier === identifier
    );
    
    if (!matchedParcel) {
      setVerificationError("일치하는 소유자 정보를 찾을 수 없습니다. 입력 정보를 확인해주세요.");
      return;
    }
    
    setVerification({
      verificationType: verificationMethod,
      ownerName,
      identifier,
      verifiedAt: new Date().toISOString(),
      isVerified: true,
    });
    setIsVerified(true);
  };

  // 인증 해제
  const handleLogout = () => {
    setIsVerified(false);
    setVerification(null);
    setOwnerName("");
    setIdentifier("");
    setSelectedParcel(null);
  };

  // 필지 상세 보기
  const handleViewDetail = (parcel: ProcessedParcel) => {
    setSelectedParcel(parcel);
    setShowDetailDialog(true);
  };

  // 신청하기
  const handleApply = (parcel: ProcessedParcel) => {
    onSelectParcel?.(parcel);
  };

  // 인증 전 화면
  if (!isVerified) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>잔여지 조회</CardTitle>
            <CardDescription>
              본인 소유 잔여지를 조회하려면 소유자 인증이 필요합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 인증 방법 선택 */}
            <div className="space-y-2">
              <Label>인증 방법</Label>
              <Select 
                value={verificationMethod} 
                onValueChange={(v) => setVerificationMethod(v as "주민번호" | "소재지")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="주민번호">주민등록번호로 조회</SelectItem>
                  <SelectItem value="소재지">토지 소재지로 조회</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 소유자명 */}
            <div className="space-y-2">
              <Label>소유자명</Label>
              <Input 
                placeholder="소유자명을 입력하세요"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>

            {/* 식별 정보 */}
            <div className="space-y-2">
              <Label>
                {verificationMethod === "주민번호" ? "주민등록번호 뒷자리" : "토지 소재지"}
              </Label>
              <Input 
                placeholder={
                  verificationMethod === "주민번호" 
                    ? "주민등록번호 뒷자리 7자리" 
                    : "예: 경기도 용인시 처인구 양지면"
                }
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                type={verificationMethod === "주민번호" ? "password" : "text"}
              />
              {verificationMethod === "주민번호" && (
                <p className="text-xs text-muted-foreground">
                  * 입력한 정보는 조회 목적으로만 사용됩니다.
                </p>
              )}
            </div>

            {/* 에러 메시지 */}
            {verificationError && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                {verificationError}
              </div>
            )}

            {/* 인증 버튼 */}
            <Button onClick={handleVerify} className="w-full">
              <Search className="h-4 w-4 mr-2" />
              조회하기
            </Button>

            {/* 안내 문구 */}
            <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div className="text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">조회 안내</p>
                  <ul className="space-y-1">
                    <li>- 담당자 확인이 완료된 잔여지만 조회됩니다.</li>
                    <li>- 본인 소유 토지만 조회 가능합니다.</li>
                    <li>- 조회 결과는 AI 분석 기준이며, 최종 판정은 별도 심사가 필요합니다.</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 인증 후 화면
  return (
    <div className="space-y-6">
      {/* 인증 정보 표시 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium">{verification?.ownerName} 님</p>
                <p className="text-sm text-muted-foreground">
                  {verification?.verificationType}로 인증됨 | {formatDateTime(verification?.verifiedAt || "")}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 조회 결과 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            내 잔여지 목록
          </CardTitle>
          <CardDescription>
            담당자 확인이 완료된 본인 소유 잔여지입니다. 총 {myParcels.length}건
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myParcels.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">소재지</TableHead>
                    <TableHead className="font-semibold">사업단</TableHead>
                    <TableHead className="font-semibold">소유자</TableHead>
                    <TableHead className="font-semibold text-right">잔여 면적</TableHead>
                    <TableHead className="font-semibold text-center">공부상 지목</TableHead>
                    <TableHead className="font-semibold text-center">AI 판정</TableHead>
                    <TableHead className="font-semibold text-center">분석 횟수</TableHead>
                    <TableHead className="font-semibold">최종 분석일시</TableHead>
                    <TableHead className="font-semibold text-center">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myParcels.map((parcel) => {
                    const isHighPossibility = 
                      parcel.aiResult.provisionalJudgment === "매수 가능성 높음" || 
                      parcel.aiResult.provisionalJudgment === "수용가능";
                    const ownerType = parcel.landInfo.ownerType === "individual" ? "개인" : "법인";
                    const analysisCount = parcel.analysisHistory?.length || 1;
                    const isPublished = parcel.publishStatus === "공개";
                    
                    return (
                      <TableRow 
                        key={parcel.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleViewDetail(parcel)}
                      >
                        {/* 소재지 */}
                        <TableCell className="font-medium max-w-[200px]">
                          <div className="truncate" title={parcel.landInfo.address}>
                            {parcel.landInfo.address}
                          </div>
                        </TableCell>
                        
                        {/* 사업단 */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{parcel.businessUnit}</span>
                          </div>
                        </TableCell>
                        
                        {/* 소유자(개인/법인) */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{parcel.landInfo.ownerName}</span>
                            <Badge variant="outline" className="text-xs">
                              {ownerType}
                            </Badge>
                          </div>
                        </TableCell>
                        
                        {/* 잔여 면적 */}
                        <TableCell className="text-right font-medium">
                          {parcel.landInfo.remainingArea.toLocaleString()} ㎡
                        </TableCell>
                        
                        {/* 공부상 지목 */}
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {parcel.landInfo.landCategory}
                          </Badge>
                        </TableCell>
                        
                        {/* AI 판정 */}
                        <TableCell className="text-center">
                          <Badge 
                            className={
                              isHighPossibility
                                ? "bg-emerald-500 hover:bg-emerald-500/90 text-white" 
                                : "bg-rose-500 hover:bg-rose-500/90 text-white"
                            }
                          >
                            {isHighPossibility ? "매수 가능성 높음" : "매수 가능성 낮음"}
                          </Badge>
                        </TableCell>
                        
                        {/* 분석 횟수 */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{analysisCount}회</span>
                          </div>
                        </TableCell>
                        
                        {/* 최종 분석일시 */}
                        <TableCell className="text-sm text-muted-foreground">
                          {parcel.lastAnalyzedAt ? formatDateTime(parcel.lastAnalyzedAt) : "-"}
                        </TableCell>
                        
                        {/* 관리(노출/미노출) */}
                        <TableCell className="text-center">
                          {isPublished ? (
                            <div className="flex items-center justify-center gap-1 text-emerald-600">
                              <Eye className="h-4 w-4" />
                              <span className="text-xs">노출</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1 text-muted-foreground">
                              <EyeOff className="h-4 w-4" />
                              <span className="text-xs">미노출</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">조회된 잔여지가 없습니다</h3>
              <p className="text-sm text-muted-foreground">
                담당자 확인이 완료된 본인 소유 잔여지가 없거나,<br />
                아직 분석이 진행 중일 수 있습니다.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 상세 다이얼로그 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>잔여지 상세 정보</DialogTitle>
            <DialogDescription>
              {selectedParcel?.landInfo.address}
            </DialogDescription>
          </DialogHeader>
          
          {selectedParcel && (
            <div className="space-y-6">
              {/* AI 판정 결과 */}
              <div className={`p-4 rounded-lg border-2 ${
                selectedParcel.aiResult.provisionalJudgment === "매수 가능성 높음" || 
                selectedParcel.aiResult.provisionalJudgment === "수용가능"
                  ? "border-emerald-500 bg-emerald-50" 
                  : "border-rose-500 bg-rose-50"
              }`}>
                <div className="flex items-center gap-3">
                  {selectedParcel.aiResult.provisionalJudgment === "매수 가능성 높음" || 
                   selectedParcel.aiResult.provisionalJudgment === "수용가능" ? (
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-rose-600" />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">AI 분석 결과</p>
                    <p className={`text-xl font-bold ${
                      selectedParcel.aiResult.provisionalJudgment === "매수 가능성 높음" || 
                      selectedParcel.aiResult.provisionalJudgment === "수용가능"
                        ? "text-emerald-600" : "text-rose-600"
                    }`}>
                      {selectedParcel.aiResult.provisionalJudgment === "수용가능" ? "매수 가능성 높음" : 
                       selectedParcel.aiResult.provisionalJudgment === "수용불가" ? "매수 가능성 낮음" :
                       selectedParcel.aiResult.provisionalJudgment}
                    </p>
                  </div>
                </div>
              </div>

              {/* 토지 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">사업명</Label>
                  <p className="font-medium">{selectedParcel.projectName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">관할 사업단</Label>
                  <p className="font-medium">{selectedParcel.businessUnit}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">편입 전 면적</Label>
                  <p className="font-medium">{selectedParcel.landInfo.originalArea.toLocaleString()} ㎡</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">편입 면적</Label>
                  <p className="font-medium">{selectedParcel.landInfo.includedArea.toLocaleString()} ㎡</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">잔여 면적</Label>
                  <p className="font-medium">{selectedParcel.landInfo.remainingArea.toLocaleString()} ㎡</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">잔여 비율</Label>
                  <p className="font-medium">{selectedParcel.landInfo.remainingRatio}%</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">토지 유형</Label>
                  <p className="font-medium">{selectedParcel.landInfo.landType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">지목</Label>
                  <p className="font-medium">{selectedParcel.landInfo.landCategory}</p>
                </div>
              </div>

              {/* 분석 근거 */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">판정 근거</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedParcel.aiResult.judgmentRationale.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedParcel.aiResult.criteriaChecks.map((check, index) => (
                    <Badge 
                      key={index}
                      variant={check.isMet ? "default" : "outline"}
                      className={check.isMet ? "bg-emerald-500" : ""}
                    >
                      {check.criteriaName}: {check.isMet ? "충족" : "미충족"}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 안내 문구 */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  <p className="text-amber-800">
                    위 결과는 AI 분석 기준이며, 실제 매수 여부는 신청 후 담당자 심사를 통해 결정됩니다.
                    매수 신청을 원하시면 아래 버튼을 눌러 신청서를 작성해주세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              닫기
            </Button>
            {selectedParcel && (
              selectedParcel.aiResult.provisionalJudgment === "매수 가능성 높음" || 
              selectedParcel.aiResult.provisionalJudgment === "수용가능"
            ) && (
              <Button onClick={() => {
                handleApply(selectedParcel);
                setShowDetailDialog(false);
              }}>
                <FileText className="h-4 w-4 mr-2" />
                매수 신청하기
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
