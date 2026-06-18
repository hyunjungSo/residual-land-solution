"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { JUDGMENT_COLORS } from "@/components/ui/judgment-badge";
import type { LandInfo, AIAnalysisResult } from "@/lib/types";
import {
  CheckCircle2,
  Home,
  Wheat,
  TreePine,
  Star,
  Layers,
  Check,
  X,
} from "lucide-react";

interface AIAnalysisFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiResult: AIAnalysisResult | null;
  landInfo: LandInfo;
  isAdminResult?: boolean; // 관리자 재판독 결과 여부
}

type LandType = "택지" | "농지" | "산지" | "그밖의토지";

const landTypeIcons: Record<LandType, typeof Home> = {
  "택지": Home,
  "농지": Wheat,
  "산지": TreePine,
  "그밖의토지": Star,
};

export function AIAnalysisFlowDialog({
  open,
  onOpenChange,
  aiResult,
  landInfo,
  isAdminResult = false,
}: AIAnalysisFlowDialogProps) {
  const [animationStep, setAnimationStep] = useState(0);

  // 토지 유형 매핑 (다양한 표기를 표준화)
  const mapLandType = (type: string): LandType => {
    if (type === "농경지" || type === "농지" || type === "전" || type === "답") return "농지";
    if (type === "택지" || type === "주거" || type === "상업" || type === "공업") return "택지";
    if (type === "산지" || type === "임야" || type === "산림") return "산지";
    return "그밖의토지";
  };
  
  const currentLandType = mapLandType(landInfo.landType || "그밖의토지");
  const remainingArea = landInfo.remainingArea || 0;
  const originalArea = landInfo.originalArea || 0;
  const includedArea = landInfo.includedArea || 0;
  const remainingRatio = landInfo.remainingRatio || 0;
  const originalShape = landInfo.originalShape || "정방형";
  const remainingShape = landInfo.remainingShape || "정방형";
  const originalShapeIndex = landInfo.originalShapeIndex || 4.0;
  const remainingShapeIndex = landInfo.remainingShapeIndex || 4.0;
  const shapeIndexChange = remainingShapeIndex - originalShapeIndex;
  
  // 용도지역 추출 (기본값: 주거)
  // 실제로는 landInfo에 별도 필드가 있어야 함. 현재는 임의로 "주거"로 설정
  const zoneType = "주거";
  
  // 면적 기준 계산 (PRD 기준)
  const getAreaThreshold = (type: LandType, zone: string) => {
    if (type === "택지") {
      if (zone.includes("상업")) return { base: 150, relaxed: 225, label: "상업" };
      if (zone.includes("공업")) return { base: 330, relaxed: 495, label: "공업" };
      return { base: 90, relaxed: 135, label: "주거" };
    }
    if (type === "농지") return { base: 330, relaxed: 495, label: "농지" };
    if (type === "산지") return { base: 330, relaxed: 495, label: "산지" };
    return { base: 330, relaxed: 330, label: "그밖의토지" };
  };

  const areaThreshold = getAreaThreshold(currentLandType, zoneType);
  const isRatioRelaxed = remainingRatio <= 25;
  const effectiveThreshold = isRatioRelaxed ? areaThreshold.relaxed : areaThreshold.base;
  const areaMet = remainingArea <= effectiveThreshold;

  // 물리적 조건 (aiResult에서 가져오기)
  const accessRoadLost = aiResult?.accessRoadLost || false;
  const waterChannelLost = aiResult?.waterChannelLost || false;
  const farmMachineDifficulty = aiResult?.farmMachineDifficulty || false;
  const isBlindLand = aiResult?.isBlindLand || false;
  
  // 형상 변경 여부
  const isIrregularShape = ["삼각형", "역삼각형", "자루형", "부정형"].includes(remainingShape);
  const shapeChanged = shapeIndexChange >= 1.0 || isIrregularShape;

  // 최종 판정
  const finalJudgment = aiResult?.provisionalJudgment || "수용불가";
  const anyConditionMet = areaMet || accessRoadLost || shapeChanged;

  // 조건 상태 결정 (AI 판정 결과 우선 적용)
  const getConditionStatus = () => {
    // AI 판정이 수용가능인 경우 충족 반환
    if (finalJudgment === "수용가능") return "충족";
    // AI 판정이 수용불가인 경우 미충족 반환
    return "미충족";
  };
  const conditionStatus = getConditionStatus();

  // 애니메이션
  useEffect(() => {
    if (open) {
      setAnimationStep(0);
      const steps = [300, 600, 900, 1200, 1500, 1800, 2100];
      steps.forEach((delay, i) => {
        setTimeout(() => setAnimationStep(i + 1), delay);
      });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-h-[95vh] overflow-y-auto p-0 border-0 shadow-2xl bg-white z-[1100]" 
        style={{ width: '75vw', maxWidth: '1400px', minWidth: '1000px' }}
      >
        {/* 헤더 */}
        <DialogHeader className="px-6 pt-4 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
<DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
  AI 분석 프로세스
  {isAdminResult && (
    <Badge className="bg-blue-600 hover:bg-blue-600 text-xs">
      담당자 재판독
    </Badge>
  )}
</DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {/* 토지 분류 섹션 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: animationStep >= 1 ? 1 : 0.3 }}
            className="flex flex-col"
          >
            {/* 타이틀 */}
            <div className="mb-4">
              <h3 className="text-[15px] font-bold text-gray-700">
                토지 분류
              </h3>
            </div>
            {/* 4개 경로 컬럼 */}
            <div className="grid grid-cols-4 gap-5">
            {/* 택지 경로 */}
            <PathColumn
              type="택지"
              icon={Home}
              isActive={currentLandType === "택지"}
              animationStep={animationStep}
              criteria={[
                {
                  title: "면적 기준 미달 여부",
                  items: [
                    { label: "주거", subLabel: "단독·다세대 90㎡, 연립 330㎡, 아파트 1,000㎡", isSelected: currentLandType === "택지" && areaThreshold.label === "주거", isMet: currentLandType === "택지" && areaThreshold.label === "주거" && areaMet,
                      explanationMet: `잔여면적 ${remainingArea.toLocaleString()}㎡ ≤ 기준 ${effectiveThreshold.toLocaleString()}㎡${isRatioRelaxed ? " (완화적용)" : ""}`,
                      explanationUnmet: `잔여면적 ${remainingArea.toLocaleString()}㎡ > 기준 ${effectiveThreshold.toLocaleString()}㎡${isRatioRelaxed ? " (완화적용)" : ""}` },
                    { label: "상업", value: "150㎡ 이하", isSelected: currentLandType === "택지" && areaThreshold.label === "상업", isMet: currentLandType === "택지" && areaThreshold.label === "상업" && areaMet,
                      explanationMet: `잔여면적 ${remainingArea.toLocaleString()}㎡ ≤ 기준 ${effectiveThreshold.toLocaleString()}㎡${isRatioRelaxed ? " (완화적용)" : ""}`,
                      explanationUnmet: `잔여면적 ${remainingArea.toLocaleString()}㎡ > 기준 ${effectiveThreshold.toLocaleString()}㎡${isRatioRelaxed ? " (완화적용)" : ""}` },
                    { label: "공업", value: "330㎡ 이하", isSelected: currentLandType === "택지" && areaThreshold.label === "공업", isMet: currentLandType === "택지" && areaThreshold.label === "공업" && areaMet,
                      explanationMet: `잔여면적 ${remainingArea.toLocaleString()}㎡ ≤ 기준 ${effectiveThreshold.toLocaleString()}㎡${isRatioRelaxed ? " (완화적용)" : ""}`,
                      explanationUnmet: `잔여면적 ${remainingArea.toLocaleString()}㎡ > 기준 ${effectiveThreshold.toLocaleString()}㎡${isRatioRelaxed ? " (완화적용)" : ""}` },
                  ],
                  note: "잔여 비율 25% 이하 시, 1.5배 완화 적용",
                  showStep: 2,
                },
                {
                  title: "접면도로 상태 변경",
                  items: [
                    { label: "접면도로 상태 변경으로 건축허가 불가", isSelected: currentLandType === "택지", isMet: currentLandType === "택지" && accessRoadLost,
                      explanationMet: "접면도로 상태 변경으로 건축 불가 상태 확인됨",
                      explanationUnmet: "접면도로 상태 변경 없음 - 건축 가능 상태" },
                  ],
                  showStep: 3,
                },
                {
                  title: "형상 부정형으로 변경",
                  items: [
                    { label: "사각형 폭: 5m 이하", isSelected: currentLandType === "택지", isMet: currentLandType === "택지" && shapeChanged,
                      explanationMet: `형상 변경: ${originalShape} → ${remainingShape} (형상지수 +${shapeIndexChange.toFixed(1)})`,
                      explanationUnmet: `형상 유지: ${originalShape} → ${remainingShape} (형상지수 +${shapeIndexChange.toFixed(1)})` },
                    { label: "삼각형 한 변: 11m 이하", isSelected: currentLandType === "택지", isMet: currentLandType === "택지" && shapeChanged,
                      explanationMet: `비정형 형상(${remainingShape})으로 기준 충족`,
                      explanationUnmet: `정형 형상(${remainingShape}) 유지 - 형상 기준 미해당` },
                  ],
                  showStep: 4,
                },
              ]}
              conditionStatus={currentLandType === "택지" ? conditionStatus : null}
            />

            {/* 농지 경로 */}
            <PathColumn
              type="농지"
              icon={Wheat}
              isActive={currentLandType === "농지"}
              animationStep={animationStep}
              criteria={[
                {
                  title: "면적 기준 미달 여부",
                  items: [
                    { label: "기본 면적", value: "330㎡ 이하", isSelected: currentLandType === "농지" && !isRatioRelaxed, isMet: currentLandType === "농지" && !isRatioRelaxed && areaMet,
                      explanationMet: `잔여면적 ${remainingArea.toLocaleString()}㎡ ≤ 기준 330㎡`,
                      explanationUnmet: `잔여면적 ${remainingArea.toLocaleString()}㎡ > 기준 330㎡` },
                    { label: "잔여 비율 25% 이하", value: "495㎡ 이하 (완화)", isSelected: currentLandType === "농지" && isRatioRelaxed, isMet: currentLandType === "농지" && isRatioRelaxed && areaMet, highlight: true,
                      explanationMet: `잔여면적 ${remainingArea.toLocaleString()}㎡ ≤ 완화기준 495㎡`,
                      explanationUnmet: `잔여면적 ${remainingArea.toLocaleString()}㎡ > 완화기준 495㎡` },
                  ],
                  showStep: 2,
                },
                {
                  title: "접면 도로/수로 상실 여부",
                  items: [
                    { label: "도로/수로 상실로 농지로서의 사용 불가", isSelected: currentLandType === "농지", isMet: currentLandType === "농지" && (accessRoadLost || waterChannelLost),
                      explanationMet: accessRoadLost ? "접면도로 상실 확인됨" : "관개수로 상실 확인됨",
                      explanationUnmet: "도로/수로 정상 유지 - 농지로서 사용 가능" },
                    { label: "접면도로 상태변경으로 축사부지 건축불가", isSelected: currentLandType === "농지", isMet: currentLandType === "농지" && accessRoadLost,
                      explanationMet: "접면도로 상태변경으로 축사부지 건축 불가",
                      explanationUnmet: "접면도로 정상 - 축사부지 건축 가능" },
                  ],
                  showStep: 3,
                },
                {
                  title: "농기계 회전 곤란, 형상 부정형 변경",
                  items: [
                    { label: "농기계 회전 곤란", isSelected: currentLandType === "농지", isMet: currentLandType === "농지" && farmMachineDifficulty,
                      explanationMet: "민원인 확인: 농기계 회전 곤란 상태",
                      explanationUnmet: "농기계 회전 가능 상태" },
                    { label: "사각형 폭: 5m 이하", isSelected: currentLandType === "농지", isMet: currentLandType === "농지" && shapeChanged,
                      explanationMet: `형상 변경: ${originalShape} → ${remainingShape} (형상지수 +${shapeIndexChange.toFixed(1)})`,
                      explanationUnmet: `형상 유지: ${originalShape} → ${remainingShape} (형상지수 +${shapeIndexChange.toFixed(1)})` },
                    { label: "삼각형 한 변: 11m 이하", isSelected: currentLandType === "농지", isMet: currentLandType === "농지" && isIrregularShape,
                      explanationMet: `비정형 형상(${remainingShape})으로 기준 충족`,
                      explanationUnmet: `정형 형상(${remainingShape}) 유지 - 형상 기준 미해당` },
                  ],
                  showStep: 4,
                },
              ]}
              conditionStatus={currentLandType === "농지" ? conditionStatus : null}
            />

            {/* 산지 경로 */}
            <PathColumn
              type="산지"
              icon={TreePine}
              isActive={currentLandType === "산지"}
              animationStep={animationStep}
              criteria={[
                {
                  title: "면적 기준 미달 여부",
                  items: [
                    { label: "기본 면적", value: "330㎡ 이하", isSelected: currentLandType === "산지" && !isRatioRelaxed, isMet: currentLandType === "산지" && !isRatioRelaxed && areaMet,
                      explanationMet: `잔여면적 ${remainingArea.toLocaleString()}㎡ ≤ 기준 330㎡`,
                      explanationUnmet: `잔여면적 ${remainingArea.toLocaleString()}㎡ > 기준 330㎡` },
                    { label: "잔여 비율 25% 이하", value: "495㎡ 이하 (완화)", isSelected: currentLandType === "산지" && isRatioRelaxed, isMet: currentLandType === "산지" && isRatioRelaxed && areaMet, highlight: true,
                      explanationMet: `잔여면적 ${remainingArea.toLocaleString()}㎡ ≤ 완화기준 495㎡`,
                      explanationUnmet: `잔여면적 ${remainingArea.toLocaleString()}㎡ > 완화기준 495㎡` },
                  ],
                  showStep: 2,
                },
                {
                  title: "접면 도로 상실 여부",
                  items: [
                    { label: "산지가 도로와 접하였다가 공익사업으로 인해 접한 도로가 없어진 경우", isSelected: currentLandType === "산지", isMet: currentLandType === "산지" && accessRoadLost,
                      explanationMet: "공익사업으로 접면도로 상실 확인됨",
                      explanationUnmet: "접면도로 정상 유지 - 도로 상실 기준 미해당" },
                  ],
                  showStep: 3,
                },
              ]}
              conditionStatus={currentLandType === "산지" ? conditionStatus : null}
            />

            {/* 그밖의토지 경로 */}
            <PathColumn
              type="그밖의토지"
              icon={Star}
              isActive={currentLandType === "그밖의토지"}
              animationStep={animationStep}
              criteria={[
                {
                  title: "면적 기준 미달 여부",
                  items: [
                    { label: "기본 면적", value: "330㎡ 이하", isSelected: currentLandType === "그밖의토지", isMet: currentLandType === "그밖의토지" && areaMet,
                      explanationMet: `잔여면적 ${remainingArea.toLocaleString()}㎡ ≤ 기준 330㎡`,
                      explanationUnmet: `잔여면적 ${remainingArea.toLocaleString()}㎡ > 기준 330㎡` },
                    { label: "또는", value: "잔여 비율 50% 이하", isSelected: currentLandType === "그밖의토지" && remainingRatio <= 50, isMet: currentLandType === "그밖의토지" && remainingRatio <= 50,
                      explanationMet: `잔여비율 ${remainingRatio.toFixed(1)}% ≤ 기준 50%`,
                      explanationUnmet: `잔여비율 ${remainingRatio.toFixed(1)}% > 기준 50%` },
                  ],
                  showStep: 2,
                },
                {
                  title: "종래의 목적 사용 곤란 여부",
                  items: [
                    { label: "진입 곤란: 절토 및 성토/옹벽 설치 등", isSelected: currentLandType === "그밖의토지", isMet: currentLandType === "그밖의토지" && accessRoadLost,
                      explanationMet: "절토/성토/옹벽 설치로 진입 곤란 확인됨",
                      explanationUnmet: "진입 가능 - 진입 곤란 기준 미해당" },
                    { label: "양분된 토지: 일단의 토지가 양분됨", isSelected: currentLandType === "그밖의토지", isMet: currentLandType === "그밖의토지" && includedArea > 0,
                      explanationMet: `편입면적 ${includedArea.toLocaleString()}㎡로 토지 양분됨`,
                      explanationUnmet: "편입 없음 - 토지 양분 미발생" },
                  ],
                  showStep: 3,
                },
                {
                  title: "형상 변경",
                  items: [
                    { label: "정형: 잔여지 폭이 기준 이하로 변경", subLabel: "주거용 5m, 상업용 7m, 공업용/농지/산지 10m", isSelected: currentLandType === "그밖의토지", isMet: currentLandType === "그밖의토지" && shapeChanged,
                      explanationMet: `형상 변경: ${originalShape} → ${remainingShape}`,
                      explanationUnmet: `형상 유지: ${originalShape} → ${remainingShape}` },
                    { label: "비정형: 형상 지수가 1.0 이상 상승", isSelected: currentLandType === "그밖의토지", isMet: currentLandType === "그밖의토지" && shapeIndexChange >= 1.0,
                      explanationMet: `형상지수 +${shapeIndexChange.toFixed(1)} (1.0 이상 상승)`,
                      explanationUnmet: `형상지수 +${shapeIndexChange.toFixed(1)} (1.0 미만)` },
                  ],
                  showStep: 4,
                },
              ]}
              conditionStatus={currentLandType === "그밖의토지" ? conditionStatus : null}
              note="*택지/농지/산지 중 가장 유사한 용도의 기준으로 참작"
            />
            </div>
          </motion.div>

          {/* 담당자 검토 섹션 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: animationStep >= 6 ? 1 : 0.3, y: 0 }}
            className="mt-6 pt-4 border-t border-gray-200"
          >
            <div className="flex flex-col">
              <div className="mb-3">
                <h4 className="text-[15px] font-bold text-gray-700">담당자 검토</h4>
              </div>
              <div className="grid grid-cols-3 gap-5">
                <div className={cn(
                  "border rounded p-3 text-center transition-all",
                  finalJudgment === "수용가능" ? `${JUDGMENT_COLORS.수용가능.border} ${JUDGMENT_COLORS.수용가능.bgLight}` : "border-gray-200 bg-gray-50"
                )}>
                  <p className={cn("text-[15px] font-medium", finalJudgment === "수용가능" ? JUDGMENT_COLORS.수용가능.text : "text-gray-500")}>수용가능 판단</p>
                </div>
                <div className={cn(
                  "border rounded p-3 text-center transition-all",
                  finalJudgment === "수용불가" ? `${JUDGMENT_COLORS.수용불가.border} ${JUDGMENT_COLORS.수용불가.bgLight}` : "border-gray-200 bg-gray-50"
                )}>
                  <p className={cn("text-[15px] font-medium", finalJudgment === "수용불가" ? JUDGMENT_COLORS.수용불가.text : "text-gray-500")}>수용불가 판단</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 최종 결정 섹션 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: animationStep >= 7 ? 1 : 0.3, y: 0 }}
            className="mt-4"
          >
            <div className="flex flex-col">
              <div className="mb-3">
                <h4 className="text-[15px] font-bold text-gray-700">최종 결정</h4>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <motion.div 
                  animate={{ scale: finalJudgment === "수용가능" && animationStep >= 7 ? 1.02 : 1 }}
                  className={cn(
                    "rounded p-3 text-center text-[15px] font-semibold border transition-all",
                    finalJudgment === "수용가능" 
                      ? `${JUDGMENT_COLORS.수용가능.border} ${JUDGMENT_COLORS.수용가능.bg} text-white` 
                      : "border-gray-200 bg-gray-50 text-gray-400"
                  )}
                >
                  수용가능
                </motion.div>
                <motion.div 
                  animate={{ scale: finalJudgment === "수용불가" && animationStep >= 7 ? 1.02 : 1 }}
                  className={cn(
                    "rounded p-3 text-center text-[15px] font-semibold border transition-all",
                    finalJudgment === "수용불가"
                      ? `${JUDGMENT_COLORS.수용불가.border} ${JUDGMENT_COLORS.수용불가.bg} text-white` 
                      : "border-gray-200 bg-gray-50 text-gray-400"
                  )}
                >
                  수용불가
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 푸터 - 현재 케이스 요약 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-base text-gray-500">토지 유형</span>
                <span className="text-base font-semibold text-gray-800 bg-white px-3 py-1 rounded border">{currentLandType}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base text-gray-500">잔여 면적</span>
                <span className="text-base font-semibold text-gray-800">{remainingArea.toLocaleString()}㎡</span>
                <span className="text-[15px] text-gray-400">/ 기준 {effectiveThreshold}㎡ {isRatioRelaxed && "(완화)"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base text-gray-500">잔여 비율</span>
                <span className="text-base font-semibold text-gray-800">{remainingRatio}%</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-base text-gray-500">AI 잠정 판정:</span>
              <span className={cn(
                "text-base font-bold px-4 py-1.5 rounded text-white",
                finalJudgment === "수용가능" ? JUDGMENT_COLORS.수용가능.bg : JUDGMENT_COLORS.수용불가.bg
              )}>
                {finalJudgment}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 기준 아이템 타입
interface CriteriaItem {
  label: string;
  value?: string;
  subLabel?: string;
  isSelected: boolean;
  isMet: boolean;
  highlight?: boolean;
  explanationMet?: string;
  explanationUnmet?: string;

}

interface Criteria {
  title: string | null;
  items: CriteriaItem[];
  note?: string;
  showStep: number;
}

// 설명 텍스트 렌더 헬퍼: 민원인 잔여지 데이터를 기준값보다 더 뚜렷하게 표시
// "잔여면적 123㎡ ≤ 기준 90㎡" 형태에서 ≤/>가 있으면 "기준" 앞까지를 굵게, 기준값은 흐리게 처리
function ExplanationText({ text, colorClass }: { text: string; colorClass: string }) {
  const hasComparison = (text.includes(' ≤ ') || text.includes(' > ')) && text.includes('기준');
  if (hasComparison) {
    const kijunIdx = text.indexOf('기준');
    const citizenPart = text.slice(0, kijunIdx).trimEnd();
    const referencePart = text.slice(kijunIdx);
    return (
      <>
        <span className={`font-bold ${colorClass}`}>{citizenPart}</span>
        <span className="text-xs text-muted-foreground/70 font-normal"> {referencePart}</span>
      </>
    );
  }
  return <span className={`font-medium ${colorClass}`}>{text}</span>;
}

// 경로 컬럼 컴포넌트
function PathColumn({
  type,
  icon: Icon,
  isActive,
  animationStep,
  criteria,
  conditionStatus,
  note,
}: {
  type: LandType;
  icon: typeof Home;
  isActive: boolean;
  animationStep: number;
  criteria: Criteria[];
  conditionStatus: string | null;
  note?: string;
}) {
  const showHighlight = isActive && animationStep >= 1;
  // 충족/미충족 상태에 따른 색상 결정 - JUDGMENT_COLORS 사용
  const isMet = conditionStatus === "충족";
  const isUnmet = conditionStatus === "미충족";
  
  // 색상 클래스 결정 - JUDGMENT_COLORS 기반
  const borderColor = showHighlight 
    ? (isMet ? JUDGMENT_COLORS.충족.border : isUnmet ? JUDGMENT_COLORS.미충족.border : "border-amber-500")
    : "border-gray-200";
  const bgColor = showHighlight 
    ? (isMet ? JUDGMENT_COLORS.충족.bgLight : isUnmet ? JUDGMENT_COLORS.미충족.bgLight : "bg-amber-50")
    : "bg-white";
  const headerBorderColor = showHighlight 
    ? (isMet ? "border-emerald-300" : isUnmet ? "border-rose-300" : "border-amber-300")
    : "border-gray-100";
  const iconColor = showHighlight 
    ? (isMet ? JUDGMENT_COLORS.충족.text : isUnmet ? JUDGMENT_COLORS.미충족.text : "text-amber-600")
    : "text-gray-400";
  const titleColor = showHighlight 
    ? (isMet ? JUDGMENT_COLORS.충족.text : isUnmet ? JUDGMENT_COLORS.미충족.text : "text-amber-600")
    : "text-gray-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: animationStep >= 1 ? 1 : 0.5, y: 0 }}
      className={cn(
        "rounded-lg border p-3 transition-all",
        borderColor, bgColor
      )}
    >
      {/* 경로 헤더 */}
      <div className={cn(
        "flex items-center gap-2 mb-3 pb-2 border-b",
        headerBorderColor
      )}>
        <Icon className={cn("h-5 w-5", iconColor)} />
        <span className={cn("text-[15px] font-bold", titleColor)}>
          {type} 경로
        </span>
      </div>

      {/* 기준 카드들 */}
      {criteria.map((c, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0 }}
          animate={{ opacity: animationStep >= c.showStep ? 1 : 0.4 }}
          className="mb-2"
        >
          {c.title === null ? (
            <div className={cn(
              "border border-dashed rounded p-2",
              showHighlight 
                ? (isMet ? "border-success/50 bg-success/10" : isUnmet ? "border-destructive/50 bg-destructive/10" : "border-warning/50 bg-warning/10")
                : "border-gray-200 bg-gray-50"
            )}>
              <p className="text-[15px] text-gray-400 italic text-center">해당 없음</p>
            </div>
          ) : (
            <div className={cn(
              "rounded p-2 transition-all",
              showHighlight ? bgColor : "bg-white"
            )}>
              {/* 카드 타이틀 + 체크박스 + 뱃지 */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {/* 체크박스 - 활성 경로에서 충족시 체크, 미충족시 X 표시 */}
                  <div className={cn(
                    "flex-shrink-0 w-4 h-4 rounded-sm flex items-center justify-center border",
                    isActive && c.items.some(item => item.isMet) 
                      ? `${JUDGMENT_COLORS.충족.bg} ${JUDGMENT_COLORS.충족.border}` 
                      : isActive && !c.items.some(item => item.isMet)
                        ? `${JUDGMENT_COLORS.미충족.bg} ${JUDGMENT_COLORS.미충족.border}`
                        : "border-gray-300 bg-white"
                  )}>
                    {isActive && c.items.some(item => item.isMet) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                    {isActive && !c.items.some(item => item.isMet) && (
                      <X className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <p className={cn(
                    "text-[15px] font-semibold",
                    isActive ? "text-gray-700" : "text-gray-400"
                  )}>
                    {c.title}
                  </p>
                </div>
              </div>

              {/* 기준 항목들 */}
              <div className="space-y-1.5 pl-6">
                {c.items.map((item, itemIdx) => (
                  <div 
                    key={itemIdx}
                    className={cn(
                      "flex items-start gap-2 text-[15px] py-1 px-2 rounded",
                      isActive && item.isSelected 
                        ? (item.isMet ? `${JUDGMENT_COLORS.충족.bgLight} border ${JUDGMENT_COLORS.충족.border}` : `${JUDGMENT_COLORS.미충족.bgLight} border ${JUDGMENT_COLORS.미충족.border}`)
                        : "bg-transparent"
                    )}
                  >
                    {/* 충족/미충족 아이콘 */}
                    {isActive && item.isSelected && (
                      <div className={cn(
                        "flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5",
                        item.isMet ? JUDGMENT_COLORS.충족.bg : JUDGMENT_COLORS.미충족.bg
                      )}>
                        {item.isMet ? (
                          <Check className="h-2.5 w-2.5 text-white" />
                        ) : (
                          <X className="h-2.5 w-2.5 text-white" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={cn(
                          isActive && item.isSelected 
                            ? (item.isMet ? `${JUDGMENT_COLORS.충족.text} font-medium` : `${JUDGMENT_COLORS.미충족.text} font-medium`)
                            : "text-gray-500"
                        )}>
                          {item.label}
                        </span>
                        {item.value && (
                          <span className={cn(
                            "text-[15px]",
                            isActive && item.isSelected 
                              ? (item.isMet ? JUDGMENT_COLORS.충족.text : JUDGMENT_COLORS.미충족.text)
                              : "text-gray-400"
                          )}>
                            {item.value}
                          </span>
                        )}

                      </div>
                      {item.subLabel && (
                        <p className="text-[15px] text-gray-400 mt-0.5">{item.subLabel}</p>
                      )}
                      {/* 충족/미충족 상세 설명 — 민원인 값은 굵게, 기준값은 흐리게 */}
                      {isActive && item.isSelected && item.isMet && item.explanationMet && (
                        <p className={`text-[15px] ${JUDGMENT_COLORS.충족.text} mt-1`}>
                          → <ExplanationText text={item.explanationMet} colorClass={JUDGMENT_COLORS.충족.text} />
                        </p>
                      )}
                      {isActive && item.isSelected && !item.isMet && item.explanationUnmet && (
                        <p className={`text-[15px] ${JUDGMENT_COLORS.미충족.text} mt-1`}>
                          → <ExplanationText text={item.explanationUnmet} colorClass={JUDGMENT_COLORS.미충족.text} />
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 참고 사항 */}
              {c.note && (
                <p className="text-[15px] text-gray-400 mt-1.5">{c.note}</p>
              )}
            </div>
          )}
        </motion.div>
      ))}

      {/* 판정 조건 - isActive이고 conditionStatus가 있을 때만 표시 */}
      {isActive && conditionStatus && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: animationStep >= 5 ? 1 : 0.4 }}
          className="text-[15px] space-y-0.5 mb-3 py-2 border-t border-gray-100"
        >
          <p className={cn(
            conditionStatus === "충족" ? `${JUDGMENT_COLORS.충족.text} font-medium` : "text-gray-400"
          )}>
            어느 하나라도 해당 시 조건 <span className={JUDGMENT_COLORS.충족.text}>충족</span> → 수용
          </p>
          <p className={cn(
            conditionStatus === "미충족" ? `${JUDGMENT_COLORS.미충족.text} font-medium` : "text-gray-400"
          )}>
            전체 미해당 시 조건 <span className={JUDGMENT_COLORS.미충족.text}>미충족</span> → 수용
          </p>
          <p className={cn(
            conditionStatus === "미충족" ? "text-warning font-medium" : "text-gray-400"
          )}>
            실측 및 추가 검토 필요시 → <span className="text-warning">검토필요</span>
          </p>
        </motion.div>
      )}

      {/* 결과 배지 - 선택된 경로에만 표시 */}
      {isActive && conditionStatus && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: animationStep >= 5 ? 1 : 0.3, scale: animationStep >= 5 ? 1 : 0.9 }}
          className="flex justify-center"
        >
          <span className={cn(
            "px-4 py-1.5 rounded-full text-[15px] font-bold text-white",
            conditionStatus === "충족" ? JUDGMENT_COLORS.충족.bg :
            conditionStatus === "미충족" ? JUDGMENT_COLORS.미충족.bg :
            "bg-amber-500"
          )}>
            {conditionStatus}
          </span>
        </motion.div>
      )}

      {/* 경로 참고사항 */}
      {note && (
        <p className="text-xs text-gray-400 mt-2 italic">{note}</p>
      )}
    </motion.div>
  );
}
