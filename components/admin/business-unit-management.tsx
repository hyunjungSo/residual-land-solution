"use client";

import { useState, useRef } from "react";
import { RefreshCw, CheckCircle2, Upload, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const EXTERNAL_UNITS = [
  { id: "ext-001", code: "BU-KR-001", label: "강진광주건설사업단", region: "전남" },
  { id: "ext-002", code: "BU-KR-002", label: "경남권건설사업단",   region: "경남" },
  { id: "ext-003", code: "BU-KR-003", label: "호남권건설사업단",   region: "전북" },
  { id: "ext-004", code: "BU-KR-004", label: "충청권건설사업단",   region: "충남" },
  { id: "ext-005", code: "BU-KR-005", label: "수도권건설사업단",   region: "경기" },
];

const FILE_ITEMS = [
  { key: "aerialPhoto",  label: "항공사진",      accept: ".tif,.tiff",      hint: "GeoTiff / .tif" },
  { key: "cadastralMap", label: "지적도",         accept: ".shp",            hint: ".shp"           },
  { key: "roadBoundary", label: "도로사업구역선", accept: ".shp",            hint: ".shp"           },
  { key: "landRegister", label: "토지조서",       accept: ".xlsx",           hint: ".xlsx"          },
  { key: "dem",          label: "DEM",            accept: ".img,.tif,.tiff", hint: ".img / GeoTiff" },
] as const;

type FileKey = (typeof FILE_ITEMS)[number]["key"];
type UnitData = Record<FileKey, File | null> & { coordinateSystem: string };
type UnitErrors = Partial<Record<FileKey | "coordinateSystem", string>>;
type SavedState = { savedAt: string } | null;

export type ConnectedUnit = {
  id: string;
  label: string;
  dataFilter: string;
};

interface BusinessUnitManagementProps {
  onConnectionChange: (units: ConnectedUnit[]) => void;
}

export function BusinessUnitManagement({ onConnectionChange }: BusinessUnitManagementProps) {
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const [connected, setConnected] = useState<Set<string>>(new Set(["ext-001", "ext-002"]));
  const [dataMap, setDataMap] = useState<Record<string, UnitData>>(() => {
    const init: Record<string, UnitData> = {};
    EXTERNAL_UNITS.forEach((u) => {
      init[u.id] = { aerialPhoto: null, cadastralMap: null, roadBoundary: null, landRegister: null, dem: null, coordinateSystem: "" };
    });
    return init;
  });
  const [errorsMap, setErrorsMap] = useState<Record<string, UnitErrors>>({});
  const [savedMap, setSavedMap] = useState<Record<string, SavedState>>({});

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFetch = () => {
    setIsFetching(true);
    setTimeout(() => {
      setIsFetching(false);
      setHasFetched(true);
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setFetchedAt(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`);
    }, 1200);
  };

  const toggleConnect = (unitId: string, value: boolean) => {
    setConnected((prev) => {
      const next = new Set(prev);
      if (value) {
        next.add(unitId);
      } else {
        next.delete(unitId);
        setErrorsMap((e) => { const c = { ...e }; delete c[unitId]; return c; });
        setSavedMap((s) => { const c = { ...s }; delete c[unitId]; return c; });
      }
      const units = EXTERNAL_UNITS.filter((u) => next.has(u.id)).map((u) => ({
        id: u.id,
        label: u.label,
        dataFilter: u.label.replace("건설사업단", "").trim(),
      }));
      onConnectionChange(units);
      return next;
    });
  };

  const setFile = (unitId: string, key: FileKey, file: File | null) => {
    setDataMap((prev) => ({ ...prev, [unitId]: { ...prev[unitId], [key]: file } }));
    if (file) {
      setErrorsMap((prev) => {
        const errs = { ...prev[unitId] };
        delete errs[key];
        return { ...prev, [unitId]: errs };
      });
    }
  };

  const setCoordinateSystem = (unitId: string, value: string) => {
    setDataMap((prev) => ({ ...prev, [unitId]: { ...prev[unitId], coordinateSystem: value } }));
    if (value.trim()) {
      setErrorsMap((prev) => {
        const errs = { ...prev[unitId] };
        delete errs.coordinateSystem;
        return { ...prev, [unitId]: errs };
      });
    }
  };

  const handleSave = (unitId: string) => {
    const data = dataMap[unitId];
    const errs: UnitErrors = {};
    FILE_ITEMS.forEach((item) => {
      if (!data[item.key]) errs[item.key] = "파일을 업로드해 주세요.";
    });
    if (!data.coordinateSystem.trim()) errs.coordinateSystem = "좌표계 정보를 입력해 주세요.";

    setErrorsMap((prev) => ({ ...prev, [unitId]: errs }));
    if (Object.keys(errs).length > 0) return;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const savedAt = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setSavedMap((prev) => ({ ...prev, [unitId]: { savedAt } }));
  };

  return (
    <div className="max-w-3xl">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">사업단 관리</h1>
        <p className="mt-1.5 text-[16px] text-muted-foreground">
          외부 시스템의 사업단 목록을 불러오고, AI 잔여지 판독 시스템과 연결할 사업단을 선택합니다.
        </p>
      </div>

      {/* 외부 시스템 연동 */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-foreground">외부 시스템 연동</p>
            <p className="mt-0.5 text-[16px] text-muted-foreground">
              공사 내 기존 시스템과 연결하여 최신 사업단 목록을 가져옵니다.
            </p>
            {fetchedAt && (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                마지막 동기화: {fetchedAt}
              </p>
            )}
          </div>
          <Button onClick={handleFetch} disabled={isFetching} variant="outline" className="shrink-0 gap-2">
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            {isFetching ? "불러오는 중..." : hasFetched ? "다시 불러오기" : "사업단 목록 불러오기"}
          </Button>
        </div>
      </div>

      {/* 사업단 목록 */}
      {!hasFetched ? (
        <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center">
          <RefreshCw className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-[16px] text-muted-foreground">
            외부 시스템에서 사업단 목록을 불러오면 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {EXTERNAL_UNITS.map((unit) => {
            const isConnected = connected.has(unit.id);
            const data = dataMap[unit.id];
            const errors = errorsMap[unit.id] ?? {};
            const saved = savedMap[unit.id] ?? null;

            return (
              <div
                key={unit.id}
                className={cn(
                  "rounded-xl border bg-card overflow-hidden transition-all",
                  isConnected ? "border-primary/30" : "border-border"
                )}
              >
                {/* 사업단 헤더 행 */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <span className={cn(
                    "inline-flex shrink-0 h-2 w-2 rounded-full",
                    isConnected ? "bg-emerald-500" : "bg-muted-foreground/30"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-medium text-foreground">{unit.label}</p>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {unit.code}
                      </span>
                    </div>
                    <p className="text-[16px] text-muted-foreground">지역: {unit.region}</p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-[16px] text-muted-foreground">
                      {isConnected ? "연결됨" : "연결 안됨"}
                    </span>
                    <Switch
                      checked={isConnected}
                      onCheckedChange={(v) => toggleConnect(unit.id, v)}
                    />
                  </div>
                </div>

                {/* 연결 시 파일 업로드 영역 */}
                {isConnected && (
                  <div className="border-t border-border px-5 pb-5 pt-4 bg-muted/30">
                    <p className="text-[16px] font-medium text-foreground mb-1">잔여지 분석 데이터</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      모든 항목은 필수값입니다.
                      <span className="text-destructive ml-1">*</span>
                    </p>
                    <div className="space-y-4">
                      {FILE_ITEMS.map((item) => {
                        const file = data[item.key];
                        const refKey = `${unit.id}-${item.key}`;
                        const err = errors[item.key];
                        return (
                          <div key={item.key}>
                            <Label className="mb-1.5 block">
                              {item.label}
                              <span className="ml-1.5 text-sm font-normal text-muted-foreground">{item.hint}</span>
                              <span className="ml-1 text-destructive">*</span>
                            </Label>
                            {file ? (
                              <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-4 py-3 text-base">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                                <span className="flex-1 truncate text-foreground">{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => setFile(unit.id, item.key, null)}
                                  className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[refKey]?.click()}
                                className={cn(
                                  "w-full flex items-center gap-2 rounded-md border border-dashed px-4 py-3 text-base transition-colors",
                                  err
                                    ? "border-destructive bg-destructive/5 text-destructive"
                                    : "border-input text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                                )}
                              >
                                <Upload className="h-4 w-4 shrink-0" />
                                파일 선택
                              </button>
                            )}
                            <input
                              ref={(el) => { fileInputRefs.current[refKey] = el; }}
                              type="file"
                              accept={item.accept}
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0] ?? null;
                                setFile(unit.id, item.key, f);
                                e.target.value = "";
                              }}
                            />
                            {err && (
                              <p className="flex items-center gap-1 text-sm text-destructive mt-1.5">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                {err}
                              </p>
                            )}
                          </div>
                        );
                      })}

                      {/* 좌표계 정보 */}
                      <div>
                        <Label className="mb-1.5 block">
                          좌표계 정보
                          <span className="ml-1.5 text-sm font-normal text-muted-foreground">ex. EPSG:5186</span>
                          <span className="ml-1 text-destructive">*</span>
                        </Label>
                        <Input
                          value={data.coordinateSystem}
                          onChange={(e) => setCoordinateSystem(unit.id, e.target.value)}
                          placeholder="좌표계를 입력하세요 (예: EPSG:5186)"
                          className={cn(
                            data.coordinateSystem && "border-primary/40 bg-primary/5",
                            errors.coordinateSystem && !data.coordinateSystem && "border-destructive focus-visible:ring-destructive/20"
                          )}
                        />
                        {errors.coordinateSystem && (
                          <p className="flex items-center gap-1 text-sm text-destructive mt-1.5">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {errors.coordinateSystem}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 저장 버튼 */}
                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                      {saved ? (
                        <p className="flex items-center gap-1.5 text-sm text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          저장됨: {saved.savedAt}
                        </p>
                      ) : (
                        <span />
                      )}
                      <Button size="sm" onClick={() => handleSave(unit.id)}>
                        저장
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
