"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Application } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { CheckCircle2, FileText, FilePlus, Printer } from "lucide-react";

interface ApplicationResultSectionProps {
  application: Application;
  onNewApplication?: () => void;
}

const judgmentConfig = {
  매수: { label: "매수 결정", variant: "outline" as const, className: "border-success text-success" },
  기각: { label: "기각", variant: "outline" as const, className: "border-destructive text-destructive" },
  "심의위원회 이관": { label: "심의위원회 이관", variant: "outline" as const, className: "border-warning text-warning" },
};

export function ApplicationResultSection({ application, onNewApplication }: ApplicationResultSectionProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* 접수 완료 알림 */}
      <Card className="border-accent/50 bg-accent/5">
        <CardContent className="flex flex-col items-center py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <CheckCircle2 className="h-8 w-8 text-accent-foreground" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-foreground">
            신청이 접수되었습니다
          </h2>
          <p className="mt-2 text-muted-foreground">
            신청하신 내용은 담당자 검토 후 처리될 예정입니다.
          </p>
        </CardContent>
      </Card>

      {/* 접수 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            접수 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <dt className="text-muted-foreground">접수번호</dt>
              <dd className="text-lg font-bold text-primary">
                {application.applicationNumber}
              </dd>
            </div>
            
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">신청인</dt>
              <dd className="font-medium text-foreground">{application.applicantName}</dd>
            </div>
            
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">연락처</dt>
              <dd className="font-medium text-foreground">{application.applicantContact}</dd>
            </div>
            
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">신청일</dt>
              <dd className="font-medium text-foreground">{formatDateTime(application.appliedAt)}</dd>
            </div>
            
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">대상 토지</dt>
              <dd className="text-right font-medium text-foreground">
                {application.landInfo.address}
                {application.additionalLands && application.additionalLands.length > 0 && (
                  <span className="text-muted-foreground"> 외 {application.additionalLands.length}건</span>
                )}
              </dd>
            </div>

            {application.finalJudgment && (
              <div className="flex items-center justify-between border-t border-border pt-4">
                <dt className="text-muted-foreground">최종 판정</dt>
                <dd>
                  <Badge 
                    variant={judgmentConfig[application.finalJudgment].variant} 
                    size="lg"
                    className={judgmentConfig[application.finalJudgment].className}
                  >
                    {judgmentConfig[application.finalJudgment].label}
                  </Badge>
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* 안내 사항 */}
      <Card>
        <CardHeader>
          <CardTitle>안내 사항</CardTitle>
          <CardDescription>
            신청 처리 절차에 대한 안내입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-base text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-base font-medium text-primary-foreground">
                1
              </span>
              <span>
                접수된 신청서는 담당자가 직접 검토하여 매수 기준 충족 여부를 판정합니다.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-base font-medium text-primary-foreground">
                2
              </span>
              <span>
                필요시 현장 확인 및 추가 서류 요청이 있을 수 있으며, 수동 확인 항목(접면도로 상실, 농기계 회전 곤란, 수로 상실 등)을 검토합니다.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-base font-medium text-primary-foreground">
                3
              </span>
              <span>
                처리가 완료되면 문자 또는 우편으로 결과를 안내드립니다.
              </span>
            </li>
          </ol>

          <div className="mt-6 rounded-lg bg-muted p-4">
            <h4 className="font-medium text-foreground">판정 결과 안내</h4>
            <ul className="mt-2 space-y-1 text-base text-muted-foreground">
              <li>
                <strong className="text-primary">매수:</strong> 매수 기준 충족. 보상 절차가 진행됩니다.
              </li>
              <li>
                <strong className="text-destructive">기각:</strong> 매수 기준 미충족. 사유가 안내됩니다.
              </li>
              <li>
                <strong className="text-amber-500">심의위원회 이관:</strong> 추가 심의가 필요한 경우입니다.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 버튼 */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" className="h-12 flex-1 cursor-pointer text-base">
          <Printer className="mr-2 !size-[1.2rem]" />
          접수증 출력
        </Button>
        {onNewApplication && (
          <Button onClick={onNewApplication} className="h-12 flex-1 cursor-pointer text-base">
            <FilePlus className="mr-2 !size-[1.2rem]" />
            새 신청하기
          </Button>
        )}
      </div>
    </div>
  );
}
