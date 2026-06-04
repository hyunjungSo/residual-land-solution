"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { X, LayoutDashboard, FileText, MapPin } from "lucide-react";

export type WorkTabType =
  | "applications"
  | "parcel-management"
  | "application-detail"
  | "parcel-detail";

export interface WorkTab {
  id: string;
  type: WorkTabType;
  label: string;
  refId?: string;
  closable: boolean;
}

interface WorkTabBarProps {
  tabs: WorkTab[];
  activeTabId: string;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabReorder?: (fromId: string, toId: string) => void;
}

function TabIcon({ type }: { type: WorkTabType }) {
  if (type === "applications") return <LayoutDashboard className="h-4 w-4 shrink-0" />;
  if (type === "parcel-management") return <LayoutDashboard className="h-4 w-4 shrink-0" />;
  if (type === "application-detail") return <FileText className="h-4 w-4 shrink-0" />;
  return <MapPin className="h-4 w-4 shrink-0" />;
}

// 드래그 시작 시 캡처하는 각 탭의 레이아웃 정보
interface DragMetrics {
  id: string;
  origIndex: number;
  startX: number;
  lefts: number[];
  widths: number[];
  centers: number[];
  gap: number;
}

const DRAG_THRESHOLD = 4; // 이 거리 이상 움직여야 드래그로 인정 (클릭과 구분)
const SNAP_MS = 180; // 드롭 후 스냅 정렬 애니메이션 시간

export function WorkTabBar({ tabs, activeTabId, onTabSelect, onTabClose, onTabReorder }: WorkTabBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<DragMetrics | null>(null);
  const activatedRef = useRef(false); // 임계값을 넘겨 실제 드래그가 시작됐는지
  const movedRef = useRef(false); // 드래그가 발생했으면 클릭 선택을 막기 위함
  const deltaRef = useRef(0); // pointerup 클로저에서 최신 이동량을 읽기 위함
  const targetIndexRef = useRef<number | null>(null); // pointerup 클로저에서 최신 삽입 위치를 읽기 위함

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [delta, setDelta] = useState(0); // 드래그 대상의 가로 이동량(px)
  const [targetIndex, setTargetIndex] = useState<number | null>(null); // 현재 삽입 위치
  const [releasing, setReleasing] = useState(false); // 드롭 후 스냅 중

  const computeTargetIndex = (m: DragMetrics, dx: number) => {
    const draggedCenter = m.centers[m.origIndex] + dx;
    let ni = m.origIndex;
    for (let i = m.origIndex + 1; i < m.centers.length; i++) {
      if (draggedCenter > m.centers[i]) ni = i;
      else break;
    }
    for (let i = m.origIndex - 1; i >= 0; i--) {
      if (draggedCenter < m.centers[i]) ni = i;
      else break;
    }
    return ni;
  };

  const handlePointerMove = (e: PointerEvent) => {
    const m = metricsRef.current;
    if (!m) return;
    const dx = e.clientX - m.startX;

    if (!activatedRef.current) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      activatedRef.current = true;
      movedRef.current = true;
      setDraggingId(m.id);
      setTargetIndex(m.origIndex);
      targetIndexRef.current = m.origIndex;
    }
    e.preventDefault();
    const ni = computeTargetIndex(m, dx);
    deltaRef.current = dx;
    targetIndexRef.current = ni;
    setDelta(dx);
    setTargetIndex(ni);
  };

  const handlePointerUp = () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);

    const m = metricsRef.current;
    if (!m || !activatedRef.current) {
      // 단순 클릭 - 드래그 정리만
      metricsRef.current = null;
      activatedRef.current = false;
      return;
    }

    const ni = computeTargetIndex(m, deltaRef.current);

    // 드래그 대상이 새 자리로 정확히 스냅되도록 최종 이동량 계산
    let snapDelta = 0;
    if (ni > m.origIndex) {
      snapDelta = m.lefts[ni] + m.widths[ni] - m.widths[m.origIndex] - m.lefts[m.origIndex];
    } else if (ni < m.origIndex) {
      snapDelta = m.lefts[ni] - m.lefts[m.origIndex];
    }

    setReleasing(true);
    setDelta(snapDelta);
    setTargetIndex(ni);

    const fromId = m.id;
    const toId = tabs[ni]?.id;
    window.setTimeout(() => {
      if (fromId && toId && fromId !== toId && onTabReorder) {
        onTabReorder(fromId, toId);
      }
      setDraggingId(null);
      setDelta(0);
      setTargetIndex(null);
      setReleasing(false);
      metricsRef.current = null;
      activatedRef.current = false;
      deltaRef.current = 0;
      targetIndexRef.current = null;
    }, SNAP_MS);
  };

  const handlePointerDown = (e: React.PointerEvent, tab: WorkTab, index: number) => {
    if (!onTabReorder) return;
    if (e.button !== 0) return;
    // 닫기 버튼 클릭 시에는 드래그 시작 안 함
    if ((e.target as HTMLElement).closest("[data-tab-close]")) return;
    if (releasing) return;

    const container = containerRef.current;
    if (!container) return;
    const children = Array.from(container.children) as HTMLElement[];
    const rects = children.map((c) => c.getBoundingClientRect());
    const lefts = rects.map((r) => r.left);
    const widths = rects.map((r) => r.width);
    const centers = rects.map((r) => r.left + r.width / 2);
    const gap = rects.length > 1 ? Math.max(0, rects[1].left - (rects[0].left + rects[0].width)) : 4;

    metricsRef.current = {
      id: tab.id,
      origIndex: index,
      startX: e.clientX,
      lefts,
      widths,
      centers,
      gap,
    };
    activatedRef.current = false;
    movedRef.current = false;

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // 드래그 중이 아닌 탭이 빈자리를 만들기 위해 슬라이드할 거리
  const getShift = (index: number) => {
    const m = metricsRef.current;
    if (!m || draggingId === null || targetIndex === null || index === m.origIndex) return 0;
    const footprint = m.widths[m.origIndex] + m.gap;
    if (targetIndex > m.origIndex && index > m.origIndex && index <= targetIndex) return -footprint;
    if (targetIndex < m.origIndex && index >= targetIndex && index < m.origIndex) return footprint;
    return 0;
  };

  return (
    <div ref={containerRef} className="flex items-end overflow-hidden bg-white px-2 pt-2.5 min-w-0">
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;
        const isDragging = tab.id === draggingId;
        const shift = isDragging ? delta : getShift(index);

        const style: React.CSSProperties = {
          transform: shift !== 0 ? `translateX(${shift}px)` : undefined,
          transition: isDragging
            ? releasing
              ? `transform ${SNAP_MS}ms ease`
              : "none"
            : draggingId !== null
              ? `transform ${SNAP_MS}ms ease`
              : undefined,
          zIndex: isDragging ? 30 : undefined,
          position: isDragging ? "relative" : undefined,
        };

        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={0}
            style={style}
            onPointerDown={(e) => handlePointerDown(e, tab, index)}
            onClick={() => {
              if (movedRef.current) {
                movedRef.current = false;
                return;
              }
              onTabSelect(tab.id);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onTabSelect(tab.id);
              }
            }}
            className={cn(
              "group relative flex h-9 flex-1 min-w-0 max-w-[240px] select-none items-center gap-2 rounded-t-[10px] px-3 text-sm",
              isDragging ? "cursor-grabbing" : "cursor-default transition-colors",
              isActive
                ? "z-10 bg-[rgb(243,246,249)] font-semibold text-[#00875a] shadow-[0_-1px_4px_rgba(0,0,0,0.08)]"
                : "bg-white font-medium text-[#828080] hover:bg-gray-50 hover:text-gray-900",
              isDragging && "scale-[1.02] bg-white shadow-lg"
            )}
          >
            <TabIcon type={tab.type} />
            <span className="flex-1 truncate">{tab.label}</span>
            {tab.closable && (
              <button
                type="button"
                data-tab-close
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className="flex items-center justify-center rounded-full p-0.5 text-[#828080] transition-colors hover:bg-gray-200 hover:text-gray-700"
                aria-label={`${tab.label} 탭 닫기`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
