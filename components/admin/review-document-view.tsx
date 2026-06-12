"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { dummyApplications, landCategories } from "@/lib/dummy-data";
import type { Application } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LandMap } from "@/components/land-map";
import { Download, Printer, CheckCircle2, Edit3, Upload, X } from "lucide-react";

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

interface CommitteeDecision {
  role: string;
  decision: "O" | "X" | "";
  signature: string;
}

interface ReviewDocumentViewProps {
  applicationId: string;
}

export function ReviewDocumentView({ applicationId }: ReviewDocumentViewProps) {
  const { toast } = useToast();
  const [application, setApplication] = useState<Application | null>(null);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isEditing, setIsEditing] = useState(true);

  const snapshot = useRef<{ landParcels: LandParcel[]; fieldConditionReview: string } | null>(null);

  const enterEditMode = () => {
    snapshot.current = { landParcels: [...landParcels], fieldConditionReview };
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (snapshot.current) {
      setLandParcels(snapshot.current.landParcels);
      setFieldConditionReview(snapshot.current.fieldConditionReview);
      snapshot.current = null;
    }
    setIsEditing(false);
  };

  const [documentMeta, setDocumentMeta] = useState({
    projectName: "대산당진 고속도로 건설공사",
    sectionNumber: "1공구",
    reviewNumber: "제4차",
    author: "차장 지광호",
  });

  const [landParcels, setLandParcels] = useState<LandParcel[]>([]);
  const [ownerInfo, setOwnerInfo] = useState({ address: "", ownerName: "" });
  const [aerialPhotoImage, setAerialPhotoImage] = useState<string | null>(null);
  const [fieldConditionReview, setFieldConditionReview] = useState("");
  const [ownerOpinion, setOwnerOpinion] = useState(
    "토지 활용도가 현저히 저하되어, 경제적 가치가 현저히 하락하게 되었으니 매수 요청"
  );
  const [committeeDecisions, setCommitteeDecisions] = useState<CommitteeDecision[]>([
    { role: "사업단장", decision: "", signature: "" },
    { role: "보상부장", decision: "", signature: "" },
    { role: "공사부장", decision: "", signature: "" },
    { role: "품질부장", decision: "", signature: "" },
    { role: "외부위원", decision: "", signature: "" },
    { role: "최종결정", decision: "", signature: "" },
  ]);

  const saveReviewDocumentData = (parcels: LandParcel[]) => {
    try {
      const saved = JSON.parse(localStorage.getItem("reviewDocuments") || "{}");
      saved[applicationId] = {
        landParcels: parcels,
        ownerInfo,
        ownerOpinion,
        fieldConditionReview,
        committeeDecisions,
        documentMeta,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem("reviewDocuments", JSON.stringify(saved));
    } catch (e) {
      console.error("Failed to save review document:", e);
    }
  };

  useEffect(() => {
    let found: Application | undefined;
    try {
      const savedApplications = JSON.parse(localStorage.getItem("updatedApplications") || "{}");
      if (savedApplications[applicationId]) found = savedApplications[applicationId];
    } catch (e) {
      console.error(e);
    }
    if (!found) found = dummyApplications.find((app) => app.id === applicationId);
    if (found && !found.landInfo) {
      const original = dummyApplications.find((app) => app.id === applicationId);
      if (original) found = { ...original, ...found, landInfo: original.landInfo, additionalLands: original.additionalLands };
    }
    if (!found) return;

    setApplication(found);
    setOwnerInfo({
      address: found.landInfo?.address || found.applicantAddress || "",
      ownerName: found.landInfo?.ownerName || found.applicantName || "",
    });
    setDocumentMeta((prev) => ({ ...prev, projectName: found!.landInfo?.projectName || prev.projectName }));

    let savedReviewData = null;
    try {
      const savedDocs = JSON.parse(localStorage.getItem("reviewDocuments") || "{}");
      if (savedDocs[applicationId]) savedReviewData = savedDocs[applicationId];
    } catch (e) {
      console.error(e);
    }

    if (savedReviewData?.landParcels?.length > 0) {
      setLandParcels(savedReviewData.landParcels);
      if (savedReviewData.ownerOpinion) setOwnerOpinion(savedReviewData.ownerOpinion);
      if (savedReviewData.fieldConditionReview) setFieldConditionReview(savedReviewData.fieldConditionReview);
      if (savedReviewData.committeeDecisions) setCommitteeDecisions(savedReviewData.committeeDecisions);
      if (savedReviewData.documentMeta) setDocumentMeta(savedReviewData.documentMeta);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const savedJudgments = (found as any).landJudgmentsForReview;
    if (savedJudgments?.length > 0) {
      setLandParcels(
        savedJudgments.map((lj: { address: string; landCategory: string; originalArea: number; remainingArea: number; remainingRatio: number; purchaseDecision: "O" | "X" | "-" }) => {
          const parts = lj.address.split(" ");
          const lot = parts[parts.length - 1] || lj.address;
          return {
            originalLotNumber: lot,
            landCategory: lj.landCategory === "택지" ? "대" : lj.landCategory === "전" ? "전" : lj.landCategory === "답" ? "답" : lj.landCategory === "임야" ? "임" : lj.landCategory,
            originalArea: lj.originalArea,
            includedLotNumber: lot + "-편입",
            includedArea: lj.originalArea - lj.remainingArea,
            remainingLotNumber: lot,
            remainingArea: lj.remainingArea,
            remainingRatio: lj.remainingRatio,
            purchaseDecision: lj.purchaseDecision === "O" || lj.purchaseDecision === "X" ? lj.purchaseDecision : "",
          };
        })
      );
    } else {
      const allLands = found.additionalLands ? [found.landInfo, ...found.additionalLands] : [found.landInfo];
      setLandParcels(
        allLands.filter(Boolean).map((land) => {
          const parts = (land.address ?? "").split(" ");
          const lot = parts[parts.length - 1] || land.address || "";
          return {
            originalLotNumber: lot,
            landCategory: land.landType === "택지" ? "대" : land.landCategory === "전" ? "전" : land.landCategory === "답" ? "답" : land.landType === "산지" ? "임" : land.landCategory,
            originalArea: land.originalArea,
            includedLotNumber: lot + "-편입",
            includedArea: land.originalArea - land.remainingArea,
            remainingLotNumber: lot,
            remainingArea: land.remainingArea,
            remainingRatio: land.remainingRatio,
            purchaseDecision: "" as const,
          };
        })
      );
    }

    if (found.reason) setOwnerOpinion(found.reason);
    const reviewOpinion = found.finalReviewOpinion || found.reviewerComment;
    if (reviewOpinion) setFieldConditionReview(reviewOpinion);
  }, [applicationId]);

  const handlePurchaseDecisionChange = (index: number, decision: "O" | "X" | "") => {
    setLandParcels((prev) => {
      const updated = prev.map((p, i) => (i === index ? { ...p, purchaseDecision: decision } : p));
      saveReviewDocumentData(updated);
      return updated;
    });
  };

  if (!application) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">민원을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* 탭 내부 툴바 */}
      <div className="flex items-center justify-between py-3 print:hidden">
        <div>
          <span className="text-lg font-bold text-gray-900">심의서 작성</span>
          <span className="ml-3 text-sm text-muted-foreground">접수번호: {application.applicationNumber ?? "-"}</span>
        </div>
        <div className="flex gap-2">
          {isEditing && (
            <>
              {isGenerated && (
                <Button variant="outline" size="sm" onClick={cancelEdit}>
                  취소
                </Button>
              )}
              <Button size="sm" onClick={() => {
                saveReviewDocumentData(landParcels);
                setIsGenerated(true);
                setIsEditing(false);
                toast({ description: isGenerated ? "저장이 완료되었습니다." : "작성이 완료되었습니다." });
              }}>
                {isGenerated ? "저장" : "완료"}
              </Button>
            </>
          )}
          {isGenerated && !isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={enterEditMode}>
                <Edit3 className="mr-1.5 h-4 w-4" />수정
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="mr-1.5 h-4 w-4" />인쇄
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-4 w-4" />PDF 다운로드
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 심의서 본문 */}
      <Card className="overflow-hidden print:border-none print:shadow-none flex-1">
        <CardContent className="p-0">
          <div className="bg-card p-6 print:p-0">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                잔여지 매수여부 심의서({documentMeta.sectionNumber})[{documentMeta.reviewNumber}]
              </h2>
            </div>
            <div className="mb-4 flex items-center justify-between text-base">
              <div>
                <span className="text-primary">○ 사업명 : </span>
                <span className="text-foreground">{documentMeta.projectName}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">작성자 : </span>
                {isEditing ? (
                  <input
                    value={documentMeta.author}
                    onChange={(e) => setDocumentMeta((prev) => ({ ...prev, author: e.target.value }))}
                    className="w-32 border-b border-foreground bg-transparent text-center text-base focus:outline-none"
                  />
                ) : (
                  <span className="font-medium">{documentMeta.author || <span className="inline-block w-24 border-b border-foreground" />}</span>
                )}
                <span className="text-muted-foreground">(인)</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-foreground text-base">
                <thead>
                  <tr>
                    <th colSpan={10} className="border border-foreground bg-muted px-2 py-2 text-center font-medium text-foreground">대상 토지</th>
                    <th className="border border-foreground bg-primary/10 px-2 py-2 text-center font-semibold text-primary" style={{ minWidth: "220px" }}>현지상황 및 검토의견</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowSpan={2} className="border border-foreground bg-muted px-2 py-2 text-center font-medium text-foreground" style={{ minWidth: "200px" }}>소재지<br />(소유자)</td>
                    <td rowSpan={2} className="border border-foreground bg-muted px-1 py-1 text-center text-base font-medium text-foreground" style={{ width: "80px" }}>원지번</td>
                    <td rowSpan={2} className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground" style={{ width: "44px" }}>지목</td>
                    <td rowSpan={2} className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground">면적(m²)</td>
                    <td colSpan={2} className="border border-foreground bg-muted px-2 py-2 text-center font-medium text-foreground">편입토지</td>
                    <td colSpan={4} className="border border-foreground bg-muted px-2 py-2 text-center font-medium text-foreground">잔여토지</td>
                    <td rowSpan={9} className="border border-foreground p-0 align-top" style={{ minWidth: "220px", height: "1px" }}>
                      {/* 구조화 항목 (자동 연동) */}
                      <div className="border-b border-foreground/30 p-2 space-y-1.5">
                        {[
                          { label: "토지유형", value: application.landInfo.landType },
                          { label: "잔여면적", value: `${application.landInfo.remainingArea.toLocaleString()} ㎡` },
                          { label: "토지모양", value: application.landInfo.remainingShape },
                          { label: "실제용도", value: application.actualUsage },
                          { label: "공부상 지목", value: landCategories.find(c => c.value === application.landInfo.landCategory)?.label ?? application.landInfo.landCategory },
                          { label: "확인항목", value: application.farmMachineDifficulty ? "농기계 진입불가" : "해당없음" },
                          { label: "인접 토지 소유", value: application.hasAdjacentLand ? "있음" : "없음" },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex gap-1 text-xs">
                            <span className="w-[72px] shrink-0 font-medium text-muted-foreground">{label}</span>
                            <span className="text-foreground">{value ?? "-"}</span>
                          </div>
                        ))}
                      </div>
                      {/* 최종검토 의견 */}
                      <div className="border-b border-foreground/20 bg-muted/30 px-2 py-1 text-xs font-medium text-muted-foreground">최종검토 의견</div>
                      {isEditing ? (
                        <Textarea value={fieldConditionReview} onChange={(e) => setFieldConditionReview(e.target.value)} className="min-h-[160px] cursor-text resize-none rounded-none border-0 text-base leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0" placeholder="최종 검토 의견을 입력하세요" />
                      ) : (
                        <div className="whitespace-pre-wrap p-2 text-base leading-relaxed text-foreground">{fieldConditionReview}</div>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-foreground bg-muted px-1 py-1 text-center text-base font-medium text-foreground" style={{ width: "50px" }}>지번</td>
                    <td className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground">면적(m²)</td>
                    <td className="border border-foreground bg-muted px-1 py-1 text-center text-base font-medium text-foreground" style={{ width: "50px" }}>지번</td>
                    <td className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground">면적(m²)</td>
                    <td className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground">잔여비율</td>
                    <td className="border border-foreground bg-primary/10 px-2 py-1 text-center text-base font-semibold text-primary">매수여부</td>
                  </tr>
                  {landParcels.map((parcel, index) => (
                    <tr key={index}>
                      {index === 0 && (
                        <td rowSpan={landParcels.length} className="border border-foreground px-2 py-2 text-center text-foreground">
                          {ownerInfo.address}<br /><span className="text-muted-foreground">({ownerInfo.ownerName})</span>
                        </td>
                      )}
                      <td className="border border-foreground px-2 py-1 text-center text-foreground">{parcel.originalLotNumber}</td>
                      <td className="border border-foreground px-2 py-1 text-center text-foreground">{parcel.landCategory}</td>
                      <td className="border border-foreground px-2 py-1 text-center text-foreground">{parcel.originalArea.toLocaleString()}</td>
                      <td className="border border-foreground px-2 py-1 text-center text-foreground">{parcel.includedLotNumber}</td>
                      <td className="border border-foreground px-2 py-1 text-center text-foreground">{parcel.includedArea.toLocaleString()}</td>
                      <td className="border border-foreground px-2 py-1 text-center text-foreground">{parcel.remainingLotNumber}</td>
                      <td className="border border-foreground px-2 py-1 text-center text-foreground">{parcel.remainingArea.toLocaleString()}</td>
                      <td className="border border-foreground px-2 py-1 text-center text-foreground">{parcel.remainingRatio.toFixed(1)}%</td>
                      <td className="border border-foreground px-1 py-1 text-center font-bold" style={{ minWidth: "96px" }}>
                        {isEditing ? (
                          <Select value={parcel.purchaseDecision} onValueChange={(v) => handlePurchaseDecisionChange(index, v as "O" | "X" | "")}>
                            <SelectTrigger className="h-10 min-h-0 w-full border-primary/50 text-center font-bold"><SelectValue placeholder="선택" /></SelectTrigger>
                            <SelectContent style={{ minWidth: "96px" }}>
                              <SelectItem value="O" className="whitespace-nowrap font-bold text-primary">O (매수)</SelectItem>
                              <SelectItem value="X" className="whitespace-nowrap font-bold text-destructive">X (기각)</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={parcel.purchaseDecision === "O" ? "text-primary" : parcel.purchaseDecision === "X" ? "text-destructive" : "text-muted-foreground"}>{parcel.purchaseDecision}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td rowSpan={4} className="border border-foreground bg-muted px-1 py-2 text-center text-base font-medium text-foreground" style={{ width: "56px" }}>소유자의견</td>
                    <td rowSpan={4} colSpan={2} className="border border-foreground p-0 align-top" style={{ minWidth: "220px", height: "1px" }}>
                      <div className="whitespace-pre-wrap p-2 text-base leading-relaxed text-foreground">{ownerOpinion}</div>
                    </td>
                    <td colSpan={7} className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground">심의위원회결정 <span className="text-muted-foreground">(매수시 O, 기각시 X표시)</span></td>
                  </tr>
                  <tr>
                    <td className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground">구분</td>
                    {committeeDecisions.map((item, idx) => (
                      <td key={idx} className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground">{item.role}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground">O, X</td>
                    {committeeDecisions.map((_, idx) => (
                      <td key={idx} className="border border-foreground px-2 py-3 text-center" />
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground">서명</td>
                    {committeeDecisions.map((_, idx) => (
                      <td key={idx} className="border border-foreground px-2 py-3 text-center" />
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 지적도 / 항공사진 */}
            <div className="mt-4 grid grid-cols-2 gap-0">
              {/* 지적도 — 자동 연동 */}
              <div className="border border-foreground">
                <div className="border-b border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground">지적도</div>
                <div className="h-[300px] overflow-hidden">
                  <LandMap landInfo={application.landInfo} showOverlay={true} interactive={false} />
                </div>
              </div>
              {/* 항공사진 — 파일 업로드 */}
              <div className="border border-l-0 border-foreground">
                <div className="border-b border-foreground bg-muted px-2 py-1 text-center text-base font-medium text-foreground">항공사진</div>
                <div className="relative h-[300px] overflow-hidden">
                  {aerialPhotoImage ? (
                    <>
                      <img src={aerialPhotoImage} alt="항공사진" className="h-full w-full object-contain" />
                      {isEditing && (
                        <button onClick={() => setAerialPhotoImage(null)} className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-white hover:bg-destructive/80 print:hidden">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-muted/30">
                      <p className="mb-4 text-base text-muted-foreground">{isEditing ? "첨부할 파일을 여기에 끌어다 놓거나, 파일 선택 버튼을 직접 선택해주세요." : "항공사진 미등록"}</p>
                      {isEditing && (
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#222222] px-6 py-2.5 text-base font-medium text-white transition-colors hover:bg-[#333333]">
                          <Upload className="h-4 w-4" />파일선택
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) { const r = new FileReader(); r.onload = (ev) => setAerialPhotoImage(ev.target?.result as string); r.readAsDataURL(file); }
                          }} />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isGenerated && !isEditing && (
              <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-accent/10 p-4 print:hidden">
                <CheckCircle2 className="h-5 w-5 text-accent" />
                <span className="font-medium text-accent">심의서가 생성되었습니다. 인쇄 또는 PDF 다운로드가 가능합니다.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
