"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { dummyApplications } from "@/lib/dummy-data";
import type { Application } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Download, Printer, CheckCircle2, Edit3, Upload, X } from "lucide-react";

// 대상 토지 필지 데이터 (샘플과 동일하게)
interface LandParcel {
  originalLotNumber: string;
  landCategory: string;
  originalArea: number;
  includedLotNumber: string;
  includedArea: number;
  remainingLotNumber: string;
  remainingArea: number;
  remainingRatio: number;
  purchaseDecision: "O" | "X" | "";
}

// 심의위원회 결정
interface CommitteeDecision {
  role: string;
  decision: "O" | "X" | "";
  signature: string;
}

export default function ReviewDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isEditing, setIsEditing] = useState(true);

  // 문서 데이터
  const [documentMeta, setDocumentMeta] = useState({
    projectName: "대산당진 고속도로 건설공사",
    sectionNumber: "1공구",
    reviewNumber: "제4차",
    author: "차장 지광호",
  });

  const [landParcels, setLandParcels] = useState<LandParcel[]>([]);
  const [ownerInfo, setOwnerInfo] = useState({
    address: "",
    ownerName: "",
  });

  // 이미지 업로드 상태
  const [cadastralMapImage, setCadastralMapImage] = useState<string | null>(null);
  const [aerialPhotoImage, setAerialPhotoImage] = useState<string | null>(null);

  // 현지상황 및 검토의견 (최종검토의견 textarea 내용이 자동 입력됨)
  const [fieldConditionReview, setFieldConditionReview] = useState("");

  // 소유자 의견
  const [ownerOpinion, setOwnerOpinion] = useState(
    "토지 활용도가 현저히 저하되어, 경제적 가치가 현저히 하락하게 되었으니 보상 요청"
  );

  // 심의위원회 결정
  const [committeeDecisions, setCommitteeDecisions] = useState<CommitteeDecision[]>([
    { role: "사업단장", decision: "", signature: "" },
    { role: "보상부장", decision: "", signature: "" },
    { role: "공사부장", decision: "", signature: "" },
    { role: "품질부장", decision: "", signature: "" },
    { role: "외부위원", decision: "", signature: "" },
    { role: "최종결정", decision: "", signature: "" },
  ]);

  // 심의서 데이터 저장 함수
  const saveReviewDocumentData = (parcels: LandParcel[]) => {
    try {
      const savedReviewDocuments = JSON.parse(localStorage.getItem('reviewDocuments') || '{}');
      savedReviewDocuments[resolvedParams.id] = {
        landParcels: parcels,
        ownerInfo,
        ownerOpinion,
        fieldConditionReview,
        committeeDecisions,
        documentMeta,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('reviewDocuments', JSON.stringify(savedReviewDocuments));
    } catch (e) {
      console.error('Failed to save review document:', e);
    }
  };

  useEffect(() => {
    // localStorage에서 업데이트된 데이터를 먼저 확인
    let found: Application | undefined;
    try {
      const savedApplications = JSON.parse(localStorage.getItem('updatedApplications') || '{}');
      if (savedApplications[resolvedParams.id]) {
        found = savedApplications[resolvedParams.id];
      }
    } catch (e) {
      console.error('Failed to read from localStorage:', e);
    }
    
    // localStorage에 없으면 더미 데이터에서 찾기
    if (!found) {
      found = dummyApplications.find((app) => app.id === resolvedParams.id);
    }

    // localStorage 데이터에 landInfo가 없으면 더미 데이터로 보완
    if (found && !found.landInfo) {
      const original = dummyApplications.find((app) => app.id === resolvedParams.id);
      if (original) {
        found = { ...original, ...found, landInfo: original.landInfo, additionalLands: original.additionalLands };
      }
    }

    if (found) {
      setApplication(found);
      setOwnerInfo({
        address: found.landInfo?.address || found.applicantAddress || "",
        ownerName: found.landInfo?.ownerName || found.applicantName || "",
      });
      // documentMeta에 application 데이터 연동
      setDocumentMeta(prev => ({
        ...prev,
        projectName: found!.landInfo?.projectName || prev.projectName,
      }));
      
      // 1. 먼저 심의서 자체 저장 데이터가 있는지 확인 (이전에 심의서에서 수정한 데이터)
      let savedReviewData = null;
      try {
        const savedReviewDocuments = JSON.parse(localStorage.getItem('reviewDocuments') || '{}');
        if (savedReviewDocuments[resolvedParams.id]) {
          savedReviewData = savedReviewDocuments[resolvedParams.id];
        }
      } catch (e) {
        console.error('Failed to read review document from localStorage:', e);
      }
      
      // 심의서 자체 저장 데이터가 있으면 해당 데이터 사용 (연동 없이 독립적 수정)
      if (savedReviewData && savedReviewData.landParcels && savedReviewData.landParcels.length > 0) {
        setLandParcels(savedReviewData.landParcels);
        if (savedReviewData.ownerOpinion) setOwnerOpinion(savedReviewData.ownerOpinion);
        if (savedReviewData.fieldConditionReview) setFieldConditionReview(savedReviewData.fieldConditionReview);
        if (savedReviewData.committeeDecisions) setCommitteeDecisions(savedReviewData.committeeDecisions);
        if (savedReviewData.documentMeta) setDocumentMeta(savedReviewData.documentMeta);
        return; // 심의서 자체 데이터 사용 시 관리자 검토 데이터 연동하지 않음
      }
      
      // 2. 심의서 자체 데이터가 없으면 관리자 검토 판정값을 초기값으로 사용
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const savedJudgments = (found as any).landJudgmentsForReview;
      
      if (savedJudgments && savedJudgments.length > 0) {
        // 관리자 검토에서 저장된 필지별 판정 결과를 초기값으로 사용
        const parcelsFromJudgments: LandParcel[] = savedJudgments.map((lj: {
          address: string;
          landCategory: string;
          originalArea: number;
          remainingArea: number;
          remainingRatio: number;
          purchaseDecision: "O" | "X" | "-";
        }) => {
          // 주소에서 지번 추출
          const addressParts = lj.address.split(" ");
          const lotNumber = addressParts[addressParts.length - 1] || lj.address;
          
          return {
            originalLotNumber: lotNumber,
            landCategory: lj.landCategory === "택지" ? "대" : 
                         lj.landCategory === "전" ? "전" :
                         lj.landCategory === "답" ? "답" :
                         lj.landCategory === "임야" ? "임" : lj.landCategory,
            originalArea: lj.originalArea,
            includedLotNumber: lotNumber + "-편입",
            includedArea: lj.originalArea - lj.remainingArea,
            remainingLotNumber: lotNumber,
            remainingArea: lj.remainingArea,
            remainingRatio: lj.remainingRatio,
            purchaseDecision: (lj.purchaseDecision === "O" || lj.purchaseDecision === "X") ? lj.purchaseDecision : "",
          };
        });
        setLandParcels(parcelsFromJudgments);
      } else {
        // 기본 필지 데이터 (연동된 판정 결과가 없는 경우)
        // 실제 신청서의 토지 정보를 기반으로 생성
        const allLands = found.additionalLands
          ? [found.landInfo, ...found.additionalLands]
          : [found.landInfo];

        const defaultParcels: LandParcel[] = allLands.filter(Boolean).map((land) => {
          const addressParts = (land.address ?? "").split(" ");
          const lotNumber = addressParts[addressParts.length - 1] || land.address || "";
          
          return {
            originalLotNumber: lotNumber,
            landCategory: land.landType === "택지" ? "대" :
                         land.landCategory === "전" ? "전" :
                         land.landCategory === "답" ? "답" :
                         land.landType === "산지" ? "임" : land.landCategory,
            originalArea: land.originalArea,
            includedLotNumber: lotNumber + "-편입",
            includedArea: land.originalArea - land.remainingArea,
            remainingLotNumber: lotNumber,
            remainingArea: land.remainingArea,
            remainingRatio: land.remainingRatio,
            purchaseDecision: "" as const,
          };
        });
        setLandParcels(defaultParcels);
      }
      
      setOwnerOpinion(found.reason || ownerOpinion);
      
      // 최종 검토 의견이 있으면 현지상황 및 검토의견에 반영
      if (found.reviewerComment) {
        setFieldConditionReview(found.reviewerComment);
      }
    }
  }, [resolvedParams.id]);

  const handleGenerate = () => {
    // 완료 시 심의서 데이터 저장
    saveReviewDocumentData(landParcels);
    setIsGenerated(true);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  // 필지별 보상여부 변경 핸들러
  const handlePurchaseDecisionChange = (index: number, decision: "O" | "X" | "") => {
    setLandParcels((prev) => {
      const updated = prev.map((parcel, i) =>
        i === index ? { ...parcel, purchaseDecision: decision } : parcel
      );
      // 변경 시 심의서 데이터 자동 저장
      saveReviewDocumentData(updated);
      return updated;
    });
  };

  if (!application) {
    return (
      <div className="flex h-screen flex-col bg-[rgb(243,246,249)]">
        <header className="flex h-14 shrink-0 items-center border-b bg-white px-6 print:hidden">
          <p className="text-muted-foreground">민원을 찾을 수 없습니다.</p>
        </header>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[rgb(243,246,249)]">
      {/* 상단 고정 헤더바 */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-6 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/admin?appId=${resolvedParams.id}`)}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            돌아가기
          </Button>
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <span className="text-sm font-semibold text-gray-900">심의서 작성</span>
            <span className="ml-2 text-xs text-muted-foreground">
              접수번호: {application?.applicationNumber ?? "-"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing && (
            <Button size="sm" onClick={handleGenerate}>
              완료
            </Button>
          )}
          {isGenerated && !isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit3 className="mr-1.5 h-4 w-4" />
                수정
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="mr-1.5 h-4 w-4" />
                인쇄
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-4 w-4" />
                PDF 다운로드
              </Button>
            </>
          )}
        </div>
      </header>

      {/* 메인 콘텐츠 - 스크롤 가능 */}
      <main className="flex-1 overflow-auto p-6 print:p-0">
        {/* 심의서 본문 */}
          <Card className="overflow-hidden print:border-none print:shadow-none">
            <CardContent className="p-0">
              <div className="bg-card p-6 print:p-0">
                {/* 제목 */}
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                    잔여지 보상여부 심의서({documentMeta.sectionNumber})[{documentMeta.reviewNumber}]
                  </h2>
                </div>

                {/* 사업명 / 작성자 */}
                <div className="mb-4 flex items-center justify-between text-base">
                  <div>
                    <span className="text-primary">○ 사업명 : </span>
                    <span className="text-foreground">{documentMeta.projectName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">작성자 : </span>
                    <span className="inline-block w-24 border-b border-foreground" />
                    <span className="ml-2 text-muted-foreground">(인)</span>
                  </div>
                </div>

                {/* 메인 테이블 */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-foreground text-base">
                    <thead>
                      <tr>
                        <th
                          colSpan={10}
                          className="border border-foreground bg-muted px-2 py-2 text-center font-medium text-foreground"
                        >
                          대상 토지
                        </th>
                        <th
                          className="border border-foreground bg-primary/10 px-2 py-2 text-center font-semibold text-primary"
                          style={{ minWidth: "220px" }}
                        >
                          현지상황 및 검토의견
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td
                          rowSpan={2}
                          className="border border-foreground bg-muted px-2 py-2 text-center font-medium text-foreground"
                          style={{ minWidth: "200px" }}
                        >
                          소재지
                          <br />
                          (소유자)
                        </td>
                        <td
                          rowSpan={2}
                          className="border border-foreground bg-muted px-1 py-1 text-center text-base font-medium text-foreground"
                          style={{ width: "80px" }}
                        >
                          원지번
                        </td>
                        <td
                          rowSpan={2}
                          className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground"
                          style={{ width: "44px" }}
                        >
                          지목
                        </td>
                        <td
                          rowSpan={2}
                          className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground"
                        >
                          면적(m²)
                        </td>
                        <td
                          colSpan={2}
                          className="border border-foreground bg-muted px-2 py-2 text-center font-medium text-foreground"
                        >
                          편입토지
                        </td>
                        <td
                          colSpan={4}
                          className="border border-foreground bg-muted px-2 py-2 text-center font-medium text-foreground"
                        >
                          잔여토지
                        </td>
                        <td
                          rowSpan={9}
                          className="border border-foreground p-0 align-top"
                          style={{ minWidth: "220px", height: "1px" }}
                        >
                          {isEditing ? (
                            <Textarea
                              value={fieldConditionReview}
                              onChange={(e) => setFieldConditionReview(e.target.value)}
                              className="h-full min-h-[300px] cursor-text resize-none rounded-none border-0 text-base leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
                              placeholder="현지상황 및 검토의견을 입력하세요"
                            />
                          ) : (
                            <div className="whitespace-pre-wrap p-2 text-base leading-relaxed text-foreground">
                              {fieldConditionReview}
                            </div>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-foreground bg-muted px-1 py-1 text-center text-base font-medium text-foreground" style={{ width: "50px" }}>
                          지번
                        </td>
                        <td className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground">
                          면적(m²)
                        </td>
                        <td className="border border-foreground bg-muted px-1 py-1 text-center text-base font-medium text-foreground" style={{ width: "50px" }}>
                          지번
                        </td>
                        <td className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground">
                          면적(m²)
                        </td>
                        <td className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground">
                          잔여비율
                        </td>
                        <td className="border border-foreground bg-primary/10 px-2 py-1 text-center text-base font-semibold text-primary">
                          보상여부
                        </td>
                      </tr>
                      {landParcels.map((parcel, index) => (
                        <tr key={index}>
                          {index === 0 && (
                            <td
                              rowSpan={landParcels.length}
                              className="border border-foreground px-2 py-2 text-center text-foreground"
                            >
                              {ownerInfo.address}
                              <br />
                              <span className="text-muted-foreground">({ownerInfo.ownerName})</span>
                            </td>
                          )}
                          <td className="border border-foreground px-2 py-1 text-center text-foreground">
                            {parcel.originalLotNumber}
                          </td>
                          <td className="border border-foreground px-2 py-1 text-center text-foreground">
                            {parcel.landCategory}
                          </td>
                          <td className="border border-foreground px-2 py-1 text-center text-foreground">
                            {parcel.originalArea.toLocaleString()}
                          </td>
                          <td className="border border-foreground px-2 py-1 text-center text-foreground">
                            {parcel.includedLotNumber}
                          </td>
                          <td className="border border-foreground px-2 py-1 text-center text-foreground">
                            {parcel.includedArea.toLocaleString()}
                          </td>
                          <td className="border border-foreground px-2 py-1 text-center text-foreground">
                            {parcel.remainingLotNumber}
                          </td>
                          <td className="border border-foreground px-2 py-1 text-center text-foreground">
                            {parcel.remainingArea.toLocaleString()}
                          </td>
                          <td className="border border-foreground px-2 py-1 text-center text-foreground">
                            {parcel.remainingRatio.toFixed(1)}%
                          </td>
                          <td className="border border-foreground px-1 py-1 text-center font-bold" style={{ minWidth: "96px" }}>
                            {isEditing ? (
                              <Select
                                value={parcel.purchaseDecision}
                                onValueChange={(value) =>
                                  handlePurchaseDecisionChange(index, value as "O" | "X" | "")
                                }
                              >
                                <SelectTrigger className="h-10 min-h-0 w-full border-primary/50 text-center font-bold">
                                  <SelectValue placeholder="선택" />
                                </SelectTrigger>
                                <SelectContent style={{ minWidth: "96px" }}>
                                  <SelectItem value="O" className="whitespace-nowrap font-bold text-primary">
                                    O (보상)
                                  </SelectItem>
                                  <SelectItem value="X" className="whitespace-nowrap font-bold text-destructive">
                                    X (기각)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span
                                className={
                                  parcel.purchaseDecision === "O"
                                    ? "text-primary"
                                    : parcel.purchaseDecision === "X"
                                    ? "text-destructive"
                                    : "text-muted-foreground"
                                }
                              >
                                {parcel.purchaseDecision}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {/* 소유자 의견 + 심의위원회결정 */}
                      <tr>
                        <td
                          rowSpan={4}
                          className="border border-foreground bg-muted px-1 py-2 text-center text-base font-medium text-foreground"
                          style={{ width: "56px" }}
                        >
                          소유자의견
                        </td>
                        <td rowSpan={4} colSpan={2} className="border border-foreground p-0 align-top" style={{ minWidth: "220px", height: "1px" }}>
                          <div className="whitespace-pre-wrap p-2 text-base leading-relaxed text-foreground">
                            {ownerOpinion}
                          </div>
                        </td>
                        <td
                          colSpan={7}
                          className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground"
                        >
                          심의위원회결정{" "}
                          <span className="text-muted-foreground">(보상시 O, 기각시 X표시)</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground">
                          구분
                        </td>
                        {committeeDecisions.map((item, idx) => (
                          <td
                            key={idx}
                            className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground"
                          >
                            {item.role}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground">
                          O, X
                        </td>
                        {committeeDecisions.map((_, idx) => (
                          <td
                            key={idx}
                            className="border border-foreground px-2 py-3 text-center"
                          >
                            {/* 인쇄 후 수기 기입 */}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground">
                          서명
                        </td>
                        {committeeDecisions.map((_, idx) => (
                          <td
                            key={idx}
                            className="border border-foreground px-2 py-3 text-center"
                          >
                            {/* 인쇄 후 수기 서명 */}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 지적도 / 항공사진 */}
                <div className="mt-4 grid grid-cols-2 gap-0">
                  <div className="border border-foreground">
                    <div className="border-b border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground">
                      지적도
                    </div>
                    <div className="relative h-[300px] overflow-hidden">
                      {cadastralMapImage ? (
                        <>
                          <img 
                            src={cadastralMapImage} 
                            alt="지적도" 
                            className="h-full w-full object-contain"
                          />
                          {isEditing && (
                            <button
                              onClick={() => setCadastralMapImage(null)}
                              className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-white hover:bg-destructive/80 print:hidden"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-muted/30">
                          <p className="mb-4 text-base text-muted-foreground">
                            {isEditing ? '첨부할 파일을 여기에 끌어다 놓거나, 파일 선택 버튼을 직접 선택해주세요.' : '지적도 미등록'}
                          </p>
                          {isEditing && (
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#222222] px-6 py-2.5 text-base font-medium text-white transition-colors hover:bg-[#333333]">
                              <Upload className="h-4 w-4" />
                              파일선택
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      setCadastralMapImage(event.target?.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="border border-l-0 border-foreground">
                    <div className="border-b border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground">
                      항공사진
                    </div>
                    <div className="relative h-[300px] overflow-hidden">
                      {aerialPhotoImage ? (
                        <>
                          <img 
                            src={aerialPhotoImage} 
                            alt="항공사진" 
                            className="h-full w-full object-contain"
                          />
                          {isEditing && (
                            <button
                              onClick={() => setAerialPhotoImage(null)}
                              className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-white hover:bg-destructive/80 print:hidden"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-muted/30">
                          <p className="mb-4 text-base text-muted-foreground">
                            {isEditing ? '첨부할 파일을 여기에 끌어다 놓거나, 파일 선택 버튼을 직접 선택해주세요.' : '항공사진 미등록'}
                          </p>
                          {isEditing && (
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#222222] px-6 py-2.5 text-base font-medium text-white transition-colors hover:bg-[#333333]">
                              <Upload className="h-4 w-4" />
                              파일선택
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      setAerialPhotoImage(event.target?.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 생성 완료 메시지 */}
                {isGenerated && !isEditing && (
                  <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-accent/10 p-4 print:hidden">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <span className="font-medium text-accent">
                      심의서가 생성되었습니다. 인쇄 또는 PDF 다운로드가 가능합니다.
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
      </main>
    </div>
  );
}
