"use client";

import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { JudgmentRationale } from "@/lib/types";
import { Scale, ChevronDown, Info } from "lucide-react";
import { AIIcon } from "@/components/ui/ai-icon";

interface RationaleCardProps {
  rationale: JudgmentRationale;
  provisionalJudgment?: "수용가능" | "수용불가";
  defaultOpen?: boolean;
  variant?: "collapsible" | "expanded" | "modal-trigger";
}

export function RationaleCard({ 
  rationale, 
  provisionalJudgment,
  defaultOpen = false,
  variant = "collapsible"
}: RationaleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const content = (
    <div className="divide-y divide-border">
      {/* 판단 요약 */}
      <div className="py-3">
        <h4 className="text-xs font-medium text-muted-foreground">판단 요약</h4>
        <p className="mt-1 text-sm text-foreground">{rationale.summary}</p>
      </div>

      {/* 법적 근거 */}
      <div className="py-3">
        <h4 className="text-xs font-medium text-muted-foreground">법적 근거</h4>
        <p className="mt-1 text-sm text-foreground">{rationale.legalBasis}</p>
      </div>

      {/* 적용 기준 */}
      <div className="py-3">
        <h4 className="text-xs font-medium text-muted-foreground">적용 기준</h4>
        <ul className="mt-1.5 space-y-1">
          {rationale.appliedCriteria.map((criteria, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
              <span>{criteria}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 직접 확인 필요 항목 */}
      {rationale.manualCheckItems && rationale.manualCheckItems.length > 0 && (
        <div className="py-3">
          <h4 className="text-xs font-medium text-muted-foreground">직접 확인 필요 항목</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            AI 자동 판독 불가 항목으로 담당자가 현장 확인 후 판단합니다.
          </p>
          <ul className="mt-1.5 space-y-1">
            {rationale.manualCheckItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 상세 분석 */}
      {rationale.detailedExplanation && (
        <div className="py-3">
          <h4 className="text-xs font-medium text-muted-foreground">상세 분석</h4>
          <pre className="mt-1 whitespace-pre-wrap text-sm text-foreground">
            {rationale.detailedExplanation}
          </pre>
        </div>
      )}

      {/* 안내 문구 */}
      <div className="pt-3">
        <p className="text-xs text-muted-foreground">
          AI 판독 결과는 참고용이며, 최종 판정은 담당자 검토에 따라 결정됩니다.
        </p>
      </div>
    </div>
  );

  if (variant === "expanded") {
    return content;
  }

  if (variant === "modal-trigger") {
    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-auto gap-0.5 px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground">
            <Info className="h-3 w-3" />
            상세
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AIIcon className="h-4 w-4" />
              AI 판단 근거
            </DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-lg border border-border overflow-hidden">
      <CollapsibleTrigger className="flex w-full items-center justify-between bg-muted/30 px-4 py-3 text-left hover:bg-muted/50 transition-colors [&[data-state=open]>svg]:rotate-180">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">판단 근거 상세 보기</span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border px-4 py-1">
          {content}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
