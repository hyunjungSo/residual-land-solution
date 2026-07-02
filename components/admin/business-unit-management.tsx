"use client";

import { useState } from "react";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Settings2,
  Loader2,
  Unlink,
  ChevronRight,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export type ConnectedUnit = {
  id: string;
  label: string;
  dataFilter: string;
};

const ALL_UNITS = [
  { id: "ext-001", code: "BU-KR-001", label: "강진광주건설사업단",   region: "전남" },
  { id: "ext-002", code: "BU-KR-002", label: "경남권건설사업단",     region: "경남" },
  { id: "ext-003", code: "BU-KR-003", label: "호남권건설사업단",     region: "전북" },
  { id: "ext-004", code: "BU-KR-004", label: "충청권건설사업단",     region: "충남" },
  { id: "ext-005", code: "BU-KR-005", label: "수도권건설사업단",     region: "경기" },
  { id: "ext-006", code: "BU-KR-006", label: "부산울산건설사업단",   region: "부산" },
  { id: "ext-007", code: "BU-KR-007", label: "대구경북건설사업단",   region: "대구" },
  { id: "ext-008", code: "BU-KR-008", label: "강원권건설사업단",     region: "강원" },
  { id: "ext-009", code: "BU-KR-009", label: "제주건설사업단",       region: "제주" },
  { id: "ext-010", code: "BU-KR-010", label: "인천항만건설사업단",   region: "인천" },
  { id: "ext-011", code: "BU-KR-011", label: "경기북부건설사업단",   region: "경기" },
  { id: "ext-012", code: "BU-KR-012", label: "충북건설사업단",       region: "충북" },
  { id: "ext-013", code: "BU-KR-013", label: "전남동부건설사업단",   region: "전남" },
  { id: "ext-014", code: "BU-KR-014", label: "경북북부건설사업단",   region: "경북" },
  { id: "ext-015", code: "BU-KR-015", label: "서울강남건설사업단",   region: "서울" },
  { id: "ext-016", code: "BU-KR-016", label: "서울강북건설사업단",   region: "서울" },
  { id: "ext-017", code: "BU-KR-017", label: "광주전남건설사업단",   region: "광주" },
  { id: "ext-018", code: "BU-KR-018", label: "대전충청건설사업단",   region: "대전" },
  { id: "ext-019", code: "BU-KR-019", label: "울산건설사업단",       region: "울산" },
  { id: "ext-020", code: "BU-KR-020", label: "세종건설사업단",       region: "세종" },
  { id: "ext-021", code: "BU-KR-021", label: "전북서부건설사업단",   region: "전북" },
  { id: "ext-022", code: "BU-KR-022", label: "경남서부건설사업단",   region: "경남" },
];

const FILE_ITEMS = [
  {
    key: "aerialPhoto"   as const,
    label: "항공사진",
    hint: "GeoTIFF (.tif)",
    placeholder: "s3://bucket/project/aerial_photo.tif",
  },
  {
    key: "cadastralMap"  as const,
    label: "지적도",
    hint: ".shp",
    placeholder: "nfs://nas-server/gis/cadastral_map.shp",
  },
  {
    key: "roadBoundary"  as const,
    label: "도로사업구역선",
    hint: ".shp",
    placeholder: "s3://bucket/project/road_boundary.shp",
  },
  {
    key: "landRegister"  as const,
    label: "토지조서",
    hint: ".xlsx",
    placeholder: "http://file-server/data/land_register.xlsx",
  },
  {
    key: "dem"           as const,
    label: "DEM (수치표고모델)",
    hint: ".img / GeoTIFF",
    placeholder: "s3://bucket/project/dem.tif",
  },
] as const;

type FileKey = (typeof FILE_ITEMS)[number]["key"];
type FilterTab = "all" | "connected" | "disconnected";

type UnitConfig = {
  paths: Record<FileKey, string>;
  coordinateSystem: string;
};

type SavedUnit = {
  savedAt: string;
  config: UnitConfig;
};

const emptyConfig = (): UnitConfig => ({
  paths: { aerialPhoto: "", cadastralMap: "", roadBoundary: "", landRegister: "", dem: "" },
  coordinateSystem: "",
});

interface BusinessUnitManagementProps {
  onConnectionChange: (units: ConnectedUnit[]) => void;
}

export function BusinessUnitManagement({ onConnectionChange }: BusinessUnitManagementProps) {
  const [searchQuery,  setSearchQuery]  = useState("");
  const [filterTab,    setFilterTab]    = useState<FilterTab>("all");
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [isSaving,          setIsSaving]          = useState(false);
  const [disconnectTarget,  setDisconnectTarget]  = useState<string | null>(null);
  const [toast,             setToast]             = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [configMap, setConfigMap] = useState<Record<string, UnitConfig>>(() => {
    const init: Record<string, UnitConfig> = {};
    ALL_UNITS.forEach((u) => { init[u.id] = emptyConfig(); });
    return init;
  });

  const [savedMap,  setSavedMap]  = useState<Record<string, SavedUnit>>({});

  /* ── helpers ── */
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const notifyParent = (next: Record<string, SavedUnit>) => {
    onConnectionChange(
      ALL_UNITS.filter((u) => next[u.id]).map((u) => ({
        id: u.id,
        label: u.label,
        dataFilter: u.label.replace("건설사업단", "").trim(),
      }))
    );
  };


  /* ── actions ── */
  const updatePath = (unitId: string, key: FileKey, value: string) =>
    setConfigMap((p) => ({
      ...p,
      [unitId]: { ...p[unitId], paths: { ...p[unitId].paths, [key]: value } },
    }));

  const updateCoord = (unitId: string, value: string) =>
    setConfigMap((p) => ({ ...p, [unitId]: { ...p[unitId], coordinateSystem: value } }));

  const handleSave = (unitId: string) => {
    if (isSaving) return;
    setIsSaving(true);
    setTimeout(() => {
      const now = new Date();
      const p = (n: number) => String(n).padStart(2, "0");
      const savedAt = `${now.getFullYear()}.${p(now.getMonth() + 1)}.${p(now.getDate())} ${p(now.getHours())}:${p(now.getMinutes())}`;
      const next = { ...savedMap, [unitId]: { savedAt, config: configMap[unitId] } };
      setSavedMap(next);
      notifyParent(next);
      setIsSaving(false);
      showToast(`${ALL_UNITS.find((u) => u.id === unitId)?.label} 설정이 저장되었습니다.`);
    }, 900);
  };

  const confirmDisconnect = () => {
    if (!disconnectTarget) return;
    const next = { ...savedMap };
    delete next[disconnectTarget];
    setSavedMap(next);
    notifyParent(next);
    setDisconnectTarget(null);
    showToast("연결이 해제되었습니다.", "error");
  };

  /* ── derived ── */
  const filteredUnits = ALL_UNITS
    .filter((u) => {
      const q = searchQuery.toLowerCase();
      const matches = u.label.includes(searchQuery) || u.region.includes(searchQuery) || u.code.toLowerCase().includes(q);
      if (filterTab === "connected")    return matches && !!savedMap[u.id];
      if (filterTab === "disconnected") return matches && !savedMap[u.id];
      return matches;
    })
    .sort((a, b) => {
      const as = !!savedMap[a.id], bs = !!savedMap[b.id];
      return as === bs ? 0 : as ? -1 : 1;
    });

  const connectedCount = Object.keys(savedMap).length;
  const selectedUnit   = ALL_UNITS.find((u) => u.id === selectedId) ?? null;
  const selectedConfig = selectedId ? configMap[selectedId] : null;
  const selectedSaved  = selectedId ? savedMap[selectedId] ?? null : null;

  /* ── render ── */
  return (
    <div className="flex rounded-xl border border-border bg-card overflow-hidden" style={{ height: "calc(100vh - 96px)" }}>

      {/* ════════════════════════════════════════
          LEFT PANEL — Master List (380px)
      ════════════════════════════════════════ */}
      <div className="flex w-[380px] shrink-0 flex-col border-r border-border">

        {/* Header */}
        <div className="shrink-0 border-b border-border px-4 pt-4 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-bold text-foreground">사업단 목록</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                전체 {ALL_UNITS.length}개 · 연결 완료{" "}
                <span className="text-emerald-600 font-semibold">{connectedCount}개</span>
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="사업단명, 지역 검색..."
              className="pl-8 h-9 text-[14px]"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {([ ["all", "전체"], ["connected", "연결됨"], ["disconnected", "연결안됨"] ] as [FilterTab, string][]).map(
              ([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-[13px] font-medium transition-all",
                    filterTab === tab
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                  {tab === "connected" && connectedCount > 0 && (
                    <span className="ml-1 text-[12px] text-emerald-600 font-semibold">({connectedCount})</span>
                  )}
                </button>
              )
            )}
          </div>
        </div>

        {/* Unit list — scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filteredUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-6">
              <p className="text-[14px] text-muted-foreground">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredUnits.map((unit) => {
                const isSaved    = !!savedMap[unit.id];
                const isSelected = selectedId === unit.id;

                return (
                  <div
                    key={unit.id}
                    onClick={() => setSelectedId(isSelected ? null : unit.id)}
                    className={cn(
                      "group flex items-center gap-2.5 px-4 py-3 cursor-pointer transition-all select-none",
                      isSelected
                        ? "bg-primary/5 border-l-[3px] border-l-primary"
                        : isSaved
                        ? "bg-muted/30 hover:bg-muted/50"
                        : "hover:bg-muted/20"
                    )}
                  >
                    {/* Status dot */}
                    <span className={cn(
                      "shrink-0 h-2 w-2 rounded-full transition-colors",
                      isSaved ? "bg-emerald-500" : "bg-muted-foreground/20"
                    )} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-[14px] font-medium truncate leading-snug",
                        isSaved ? "text-muted-foreground" : "text-foreground"
                      )}>
                        {unit.label}
                      </p>
                      <p className="text-[12px] text-muted-foreground/70 mt-0.5">
                        {unit.region} · {unit.code}
                      </p>
                    </div>

                    {/* Right side */}
                    {isSaved ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700 whitespace-nowrap">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          연결 완료
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedId(unit.id); }}
                          className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                          title="설정 편집"
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <ChevronRight className={cn(
                        "h-3.5 w-3.5 shrink-0 text-muted-foreground/40",
                        isSelected && "text-primary"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════
          RIGHT PANEL — Detail (flex fill)
      ════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedUnit ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-10">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <Building2 className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-foreground mb-1">사업단을 선택하세요</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                왼쪽 목록에서 사업단 카드를 클릭하면<br />데이터 연결 설정 패널이 열립니다.
              </p>
            </div>
            {connectedCount > 0 && (
              <p className="text-[12px] text-emerald-600 font-medium">
                현재 {connectedCount}개 사업단이 연결 중입니다.
              </p>
            )}
          </div>
        ) : (
          /* Detail panel */
          <div className="flex flex-col h-full overflow-hidden">

            {/* Sticky header */}
            <div className="shrink-0 border-b border-border bg-card px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[16px] font-bold text-foreground">{selectedUnit.label}</p>
                    {selectedSaved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        연결 완료
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-muted-foreground">
                    {selectedUnit.region} · {selectedUnit.code}
                    {selectedSaved && ` · 저장: ${selectedSaved.savedAt}`}
                  </p>
                </div>
                {selectedSaved && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDisconnectTarget(selectedId!)}
                    className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/5 gap-1.5 text-[13px]"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                    연결 해제
                  </Button>
                )}
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5">

              {/* File path fields */}
              <div className="space-y-5 mb-6">
                {FILE_ITEMS.map((item, idx) => {
                  const path = selectedConfig?.paths[item.key] ?? "";

                  return (
                    <div key={item.key}>
                      <Label className="flex items-center gap-1.5 mb-2">
                        <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-[14px] font-medium">{item.label}</span>
                        <span className="text-[12px] font-normal text-muted-foreground">{item.hint}</span>
                      </Label>
                      <Input
                        value={path}
                        onChange={(e) => updatePath(selectedId!, item.key, e.target.value)}
                        placeholder={item.placeholder}
                        className="font-mono text-[12px] h-9"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Coordinate system */}
              <div className="border-t border-dashed border-border pt-5 mb-6">
                <Label className="flex items-center gap-1.5 mb-2">
                  <span className="text-[14px] font-medium">투영 좌표계</span>
                  <span className="text-[12px] font-normal text-muted-foreground">예: EPSG:5186</span>
                </Label>
                <Input
                  value={selectedConfig?.coordinateSystem ?? ""}
                  onChange={(e) => updateCoord(selectedId!, e.target.value)}
                  placeholder="좌표계 코드를 입력하세요 (예: EPSG:5186)"
                  className="font-mono text-[13px] h-9"
                />
              </div>

              {/* Save row */}
              <div className="border-t border-border pt-5 flex items-center justify-between">
                <div>
                  {selectedSaved ? (
                    <p className="flex items-center gap-1.5 text-[12px] text-emerald-600 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      마지막 저장: {selectedSaved.savedAt}
                    </p>
                  ) : (
                    <span />
                  )}
                </div>
                <Button
                  disabled={isSaving}
                  onClick={() => handleSave(selectedId!)}
                  className="gap-2 px-6"
                >
                  {isSaving
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> 저장 중...</>
                    : "저장"
                  }
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 연결 해제 확인 다이얼로그 */}
      <AlertDialog open={!!disconnectTarget} onOpenChange={(open) => { if (!open) setDisconnectTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>연결을 해제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              연결을 해제하면 <span className="font-semibold text-foreground">{ALL_UNITS.find((u) => u.id === disconnectTarget)?.label}</span>에
              등록된 모든 경로 설정 및 데이터가 삭제됩니다.
              <br />
              <span className="text-destructive font-medium">삭제된 정보는 복구할 수 없습니다.</span>
              계속 진행하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDisconnect}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              연결 해제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-xl px-5 py-3.5 shadow-xl text-white text-[13px] font-semibold pointer-events-none",
          toast.type === "success" ? "bg-emerald-600" : "bg-destructive"
        )}>
          {toast.type === "success"
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertTriangle className="h-4 w-4 shrink-0" />
          }
          {toast.message}
        </div>
      )}
    </div>
  );
}
