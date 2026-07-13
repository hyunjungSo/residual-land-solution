"use client";

import { useRef, useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, X } from "lucide-react";
import type { Application, LandInfo, LandCategory, LandShape } from "@/lib/types";
import { landCategories, landShapes } from "@/lib/dummy-data";

interface ManualApplicationFormProps {
  prefillLandInfo?: Partial<LandInfo>;
  onComplete: (application: Application) => void;
  onCancel: () => void;
}

const CHECK_ITEMS: { key: string; label: string; showFor: LandCategory[] }[] = [
  { key: "accessRoadLost", label: "진입로(접면도로) 소실", showFor: ["대", "전", "답", "임", "잡"] },
  { key: "waterChannelLost", label: "수로 소실", showFor: ["전", "답"] },
  { key: "farmMachineDifficulty", label: "농기계 진입·회전 곤란", showFor: ["전", "답"] },
  { key: "cannotUseOriginalPurpose", label: "종래 목적대로 사용 곤란", showFor: ["잡"] },
  { key: "hasAdjacentLand", label: "잔여지 인접 토지를 동일 소유자가 보유", showFor: ["대", "전", "답", "임", "잡"] },
];

const allLandShapes = [...landShapes.regular, ...landShapes.irregular];

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

export function ManualApplicationForm({ prefillLandInfo, onComplete, onCancel }: ManualApplicationFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setAlertOpen(true);
  };

  const openAddressSearch = (onSelect: (zipCode: string, address: string) => void) => {
    if (typeof window !== "undefined" && (window as any).daum?.Postcode) {
      new (window as any).daum.Postcode({
        oncomplete: (data: any) => {
          onSelect(data.zonecode, data.roadAddress || data.jibunAddress);
        },
      }).open();
    } else {
      showAlert("주소 검색 서비스가 로딩 중입니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  // 신청인
  const [applicantName, setApplicantName] = useState("");
  const [applicantContact, setApplicantContact] = useState("");
  const [applicantZipCode, setApplicantZipCode] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  const [applicantAddressDetail, setApplicantAddressDetail] = useState("");

  // 필지
  const landAddress = prefillLandInfo?.address ?? "";
  const originalArea = prefillLandInfo?.originalArea != null ? String(prefillLandInfo.originalArea) : "";
  const includedArea = prefillLandInfo?.includedArea != null ? String(prefillLandInfo.includedArea) : "";
  const [actualUsage, setActualUsage] = useState<LandCategory>(prefillLandInfo?.landCategory ?? "대");
  const [landShape, setLandShape] = useState<LandShape>((prefillLandInfo?.originalShape as LandShape) ?? "정방형");

  // 확인 항목
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const toggleCheck = (key: string) => setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  const visibleChecks = CHECK_ITEMS.filter((item) => item.showFor.includes(actualUsage));

  const handleUsageChange = (val: LandCategory) => {
    setActualUsage(val);
    const nextKeys = CHECK_ITEMS.filter((i) => i.showFor.includes(val)).map((i) => i.key);
    setChecks((prev) => {
      const next: Record<string, boolean> = {};
      nextKeys.forEach((k) => { next[k] = prev[k] ?? false; });
      return next;
    });
  };

  // 첨부 서류
  const [attachments, setAttachments] = useState<File[]>([]);
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setAttachments((prev) => [...prev, ...Array.from(files)]);
  };
  const removeAttachment = (idx: number) => setAttachments((prev) => prev.filter((_, i) => i !== idx));

  // 신청 사유
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (!applicantName || !applicantContact || !applicantAddress || !landAddress) {
      showAlert("신청인명, 연락처, 주소는 필수 입력 항목입니다.");
      return;
    }

    const orig = parseFloat(originalArea) || 0;
    const inc = parseFloat(includedArea) || 0;
    const rem = orig - inc;

    const landInfo: LandInfo = {
      id: prefillLandInfo?.id ?? `manual-${Date.now()}`,
      address: landAddress,
      originalArea: orig,
      includedArea: inc,
      remainingArea: rem,
      remainingRatio: orig > 0 ? Math.round((rem / orig) * 1000) / 10 : 0,
      landType: "택지",
      landCategory: actualUsage,
      originalShape: landShape,
      remainingShape: "부정형",
      originalShapeIndex: 1.0,
      remainingShapeIndex: 5.0,
      ownerName: applicantName,
      hasIncludedLand: inc > 0,
      projectName: prefillLandInfo?.projectName ?? "",
      businessUnit: prefillLandInfo?.businessUnit,
    };

    const application: Application = {
      id: `APP-${Date.now()}`,
      applicationNumber: `2026-${Date.now().toString().slice(-6)}`,
      applicationType: "single",
      applicantName,
      applicantContact,
      applicantAddress: [applicantAddress, applicantAddressDetail].filter(Boolean).join(" "),
      landInfo,
      actualUsage,
      reportedShape: landShape,
      farmMachineDifficulty: checks["farmMachineDifficulty"] ?? false,
      hasAdjacentLand: checks["hasAdjacentLand"] ?? false,
      reason,
      attachments: attachments.map((f) => f.name),
      status: "검토중",
      adminStatus: "접수완료",
      appliedAt: new Date().toISOString(),
      submissionChannel: "offline",
      aiResult: {
        landTypePath: "택지",
        criteriaChecks: [],
        provisionalJudgment: "수용불가",
        originalShapeIndex: 1.0,
        remainingShapeIndex: 5.0,
        shapeIndexChange: 4.0,
        isBlindLand: false,
        accessRoadLost: checks["accessRoadLost"] ?? false,
        waterChannelLost: checks["waterChannelLost"] ?? false,
        farmMachineDifficulty: checks["farmMachineDifficulty"] ?? false,
        judgmentRationale: {
          summary: reason,
          legalBasis: "",
          appliedCriteria: [],
          detailedExplanation: "",
        },
      },
    };

    onComplete(application);
  };

  return (
    <>
      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="max-w-sm sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>필수 항목 누락</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">

          {/* 신청인 정보 */}
          <section className="space-y-4">
            <h3 className="text-[16px] font-semibold">신청인 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="신청인명" required>
                <Input value={applicantName} onChange={(e) => setApplicantName(e.target.value)} placeholder="홍길동" />
              </FormField>
              <FormField label="연락처" required>
                <Input value={applicantContact} onChange={(e) => setApplicantContact(e.target.value)} placeholder="010-0000-0000" />
              </FormField>
              <div className="col-span-2">
                <FormField label="주소" required>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input placeholder="우편번호" value={applicantZipCode} disabled className="w-32 bg-gray-50" />
                      <Button
                        type="button"
                        className="bg-gray-900 hover:bg-gray-800 text-white px-4"
                        onClick={() => openAddressSearch((zip, addr) => { setApplicantZipCode(zip); setApplicantAddress(addr); setApplicantAddressDetail(""); })}
                      >
                        주소 검색
                      </Button>
                    </div>
                    <Input placeholder="기본주소" value={applicantAddress} disabled className="bg-gray-50" />
                    <Input placeholder="상세주소를 입력해주세요" value={applicantAddressDetail} onChange={(e) => setApplicantAddressDetail(e.target.value)} />
                  </div>
                </FormField>
              </div>
            </div>
          </section>

          {/* 필지 정보 */}
          <section className="space-y-4">
            <h3 className="text-[16px] font-semibold">필지 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FormField label="필지 주소">
                  <Input value={landAddress} disabled className="bg-muted/40" />
                </FormField>
              </div>
              <FormField label="원필지 면적 (㎡)">
                <Input value={originalArea} disabled className="bg-muted/40" />
              </FormField>
              <FormField label="편입 면적 (㎡)">
                <Input value={includedArea} disabled className="bg-muted/40" />
              </FormField>
              <FormField label="현재 활용지목">
                <Select value={actualUsage} onValueChange={(v) => handleUsageChange(v as LandCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[10001]">
                    {landCategories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="토지 형상">
                <Select value={landShape} onValueChange={(v) => setLandShape(v as LandShape)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[10001]">
                    {allLandShapes.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </section>

          {/* 추가 확인 항목 */}
          {visibleChecks.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-[16px] font-semibold">추가 확인 항목</h3>
              <div className="flex flex-col gap-3">
                {visibleChecks.map((item) => (
                  <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                    <Checkbox checked={checks[item.key] ?? false} onCheckedChange={() => toggleCheck(item.key)} />
                    <span className="text-[13px]">{item.label}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* 첨부 서류 */}
          <section className="space-y-4">
            <h3 className="text-[16px] font-semibold">첨부 서류</h3>
            <div
              className="border-2 border-dashed border-border rounded-lg p-5 text-center hover:border-muted-foreground/40 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
              <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-[13px] text-foreground">클릭하여 파일 업로드</p>
              <p className="text-[12px] text-muted-foreground mt-1">토지대장, 등기부등본 등</p>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-1.5">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                    <span className="text-[13px] truncate flex-1">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-muted-foreground hover:text-destructive ml-3 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 신청 사유 */}
          <section className="space-y-4">
            <h3 className="text-[16px] font-semibold">신청 사유</h3>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="신청 사유를 입력하세요"
              rows={4}
              className="resize-none"
            />
          </section>
        </div>

        {/* 하단 액션 */}
        <div className="shrink-0 border-t px-6 py-4 flex justify-end gap-3 bg-background">
          <Button variant="outline" onClick={onCancel}>취소</Button>
          <Button onClick={handleSubmit}>접수 등록</Button>
        </div>
      </div>
    </>
  );
}
