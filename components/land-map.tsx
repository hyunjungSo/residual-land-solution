"use client";

import { useRef, useEffect, useState } from "react";
import { Plus, Minus, Info, Ruler, X, Locate, Triangle } from "lucide-react";
import type { LandInfo } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface LandMapProps {
  landInfo?: LandInfo;
  showOverlay?: boolean;
  interactive?: boolean;
  onSelect?: (landId: string) => void;
  sameOwnerParcels?: LandInfo[];
}

type BaseMapType = "normal" | "satellite";

// 레이어 가시화 최소 줌 레벨
const LAYER_MIN_ZOOM = 17;

export function LandMap({
  landInfo,
  showOverlay = true,
  interactive = false,
  sameOwnerParcels = [],
}: LandMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 배경지도 타입
  const [baseMap, setBaseMap] = useState<BaseMapType>("normal");
  
  // 줌 레벨 (14-20)
  const [zoomLevel, setZoomLevel] = useState(14);
  
  // 레이어 옵션
  const [layers, setLayers] = useState({
    originalParcel: true,     // 원필지
    remainderParcel: true,    // 잔여지
    incorporatedParcel: true, // 편입지
    landSupplyDemand: true,   // 국토수급
    roadArea: true,           // 도로구역
  });
  
  // 레이어 가시화 여부
  const isLayerVisible = zoomLevel >= LAYER_MIN_ZOOM;
  
  // 동일 소유자 보기
  const [showSameOwner, setShowSameOwner] = useState(false);

  // 거리 측정 모드
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<{x: number; y: number}[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  
  // 픽셀당 미터 (줌 레벨에 따라 변경 - 가상 스케일)
  const getPixelsPerMeter = () => {
    const baseScale = 0.5; // 줌 14에서 1픽셀 = 2미터
    return baseScale * Math.pow(1.5, zoomLevel - 14);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 크기 설정
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // 배경 그리기 (배경지도 타입에 따라)
    if (baseMap === "satellite") {
      // 위성 배경
      ctx.fillStyle = "#2d4a3e";
      ctx.fillRect(0, 0, rect.width, rect.height);
      
      // 위성 텍스처 시뮬레이션
      for (let i = 0; i < 500; i++) {
        ctx.fillStyle = `rgba(${Math.random() * 50 + 30}, ${Math.random() * 60 + 50}, ${Math.random() * 40 + 30}, 0.3)`;
        ctx.fillRect(
          Math.random() * rect.width,
          Math.random() * rect.height,
          Math.random() * 20 + 5,
          Math.random() * 20 + 5
        );
      }
    } else {
      // 일반 지적도 배경
      ctx.fillStyle = "#f0f4e8";
      ctx.fillRect(0, 0, rect.width, rect.height);

      // 그리드 그리기
      ctx.strokeStyle = "#d0d8c8";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < rect.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, rect.height);
        ctx.stroke();
      }
      for (let i = 0; i < rect.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(rect.width, i);
        ctx.stroke();
      }
    }

    // 국토수급 레이어 (17레벨 이상에서만 표시)
    if (layers.landSupplyDemand && isLayerVisible) {
      ctx.fillStyle = "rgba(255, 193, 7, 0.2)";
      ctx.fillRect(rect.width * 0.1, rect.height * 0.1, rect.width * 0.3, rect.height * 0.25);
      ctx.strokeStyle = "#ffc107";
      ctx.lineWidth = 1;
      ctx.strokeRect(rect.width * 0.1, rect.height * 0.1, rect.width * 0.3, rect.height * 0.25);
      
      ctx.fillStyle = "rgba(255, 193, 7, 0.2)";
      ctx.fillRect(rect.width * 0.6, rect.height * 0.65, rect.width * 0.3, rect.height * 0.25);
      ctx.strokeRect(rect.width * 0.6, rect.height * 0.65, rect.width * 0.3, rect.height * 0.25);
    }

    // 도로구역 레이어 (17레벨 이상에서만 표시)
    if (layers.roadArea && isLayerVisible) {
      ctx.fillStyle = baseMap === "satellite" ? "#555555" : "#888888";
      ctx.beginPath();
      ctx.moveTo(rect.width * 0.1, rect.height * 0.3);
      ctx.lineTo(rect.width * 0.9, rect.height * 0.5);
      ctx.lineTo(rect.width * 0.9, rect.height * 0.6);
      ctx.lineTo(rect.width * 0.1, rect.height * 0.4);
      ctx.closePath();
      ctx.fill();
      
      // 도로구역 경계선
      ctx.strokeStyle = "#ff6b6b";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 원래 토지 그리기 (편입 전)
    ctx.strokeStyle = baseMap === "satellite" ? "#ffffff" : "#666666";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.rect(rect.width * 0.25, rect.height * 0.15, rect.width * 0.5, rect.height * 0.7);
    ctx.stroke();
    ctx.setLineDash([]);

    if (showOverlay && landInfo) {
      // 편입 토지 영역 (빨간색 반투명)
      ctx.fillStyle = "rgba(239, 68, 68, 0.3)";
      ctx.beginPath();
      ctx.moveTo(rect.width * 0.25, rect.height * 0.28);
      ctx.lineTo(rect.width * 0.75, rect.height * 0.42);
      ctx.lineTo(rect.width * 0.75, rect.height * 0.58);
      ctx.lineTo(rect.width * 0.25, rect.height * 0.44);
      ctx.closePath();
      ctx.fill();

      // 편입 영역 테두리
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 잔여지 영역 (파란색 반투명) - 위쪽
      ctx.fillStyle = "rgba(59, 130, 246, 0.3)";
      ctx.beginPath();
      ctx.moveTo(rect.width * 0.25, rect.height * 0.15);
      ctx.lineTo(rect.width * 0.75, rect.height * 0.15);
      ctx.lineTo(rect.width * 0.75, rect.height * 0.42);
      ctx.lineTo(rect.width * 0.25, rect.height * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 잔여지 영역 (파란색 반투명) - 아래쪽
      ctx.fillStyle = "rgba(59, 130, 246, 0.3)";
      ctx.beginPath();
      ctx.moveTo(rect.width * 0.25, rect.height * 0.44);
      ctx.lineTo(rect.width * 0.75, rect.height * 0.58);
      ctx.lineTo(rect.width * 0.75, rect.height * 0.85);
      ctx.lineTo(rect.width * 0.25, rect.height * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 범례
      const legendBg = baseMap === "satellite" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)";
      const legendText = baseMap === "satellite" ? "#ffffff" : "#333333";
      
      ctx.fillStyle = legendBg;
      ctx.fillRect(rect.width - 130, 5, 125, 75);
      ctx.strokeStyle = baseMap === "satellite" ? "#555" : "#ddd";
      ctx.lineWidth = 1;
      ctx.strokeRect(rect.width - 130, 5, 125, 75);
      
      ctx.font = "12px sans-serif";
      
      // 편입 구간 범례
      ctx.fillStyle = "rgba(239, 68, 68, 0.3)";
      ctx.fillRect(rect.width - 120, 15, 16, 16);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1;
      ctx.strokeRect(rect.width - 120, 15, 16, 16);
      ctx.fillStyle = legendText;
      ctx.fillText("편입 구간", rect.width - 98, 27);

      // 잔여지 범례
      ctx.fillStyle = "rgba(59, 130, 246, 0.3)";
      ctx.fillRect(rect.width - 120, 37, 16, 16);
      ctx.strokeStyle = "#3b82f6";
      ctx.strokeRect(rect.width - 120, 37, 16, 16);
      ctx.fillStyle = legendText;
      ctx.fillText("잔여지", rect.width - 98, 49);
      
      // 도로구역 범례 (레이어 활성화 + 가시화 줌 레벨)
      if (layers.roadArea && isLayerVisible) {
        ctx.strokeStyle = "#ff6b6b";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.moveTo(rect.width - 120, 65);
        ctx.lineTo(rect.width - 104, 65);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = legendText;
        ctx.fillText("도로구역", rect.width - 98, 69);
      }
    }

    // 지번 표시
    if (landInfo) {
      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle = baseMap === "satellite" ? "#ffffff" : "#1e3a5f";
      ctx.textAlign = "center";

      const addressParts = landInfo.address.split(" ");
      const shortAddress = addressParts.slice(-1)[0];
      ctx.fillText(shortAddress, rect.width * 0.5, rect.height * 0.92);
    }

    // 동일 소유자 필지 표시
    if (showSameOwner && sameOwnerParcels.length > 0) {
      const positions = [
        { x: 0.08, y: 0.1,  w: 0.14, h: 0.18 },
        { x: 0.78, y: 0.08, w: 0.14, h: 0.20 },
        { x: 0.06, y: 0.65, w: 0.16, h: 0.22 },
        { x: 0.76, y: 0.68, w: 0.15, h: 0.20 },
      ];
      sameOwnerParcels.slice(0, 4).forEach((p, i) => {
        const pos = positions[i];
        const px = rect.width * pos.x;
        const py = rect.height * pos.y;
        const pw = rect.width * pos.w;
        const ph = rect.height * pos.h;

        ctx.fillStyle = "rgba(234, 88, 12, 0.18)";
        ctx.beginPath();
        ctx.rect(px, py, pw, ph);
        ctx.fill();
        ctx.strokeStyle = "#ea580c";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        const parts = p.address.split(" ");
        const label = parts.slice(-1)[0];
        ctx.font = "bold 10px sans-serif";
        ctx.fillStyle = baseMap === "satellite" ? "#ffedd5" : "#9a3412";
        ctx.textAlign = "center";
        ctx.fillText(label, px + pw / 2, py + ph / 2 + 4);
      });

      // 범례에 동일 소유자 항목 추가
      if (showOverlay && landInfo) {
        const legendBg = baseMap === "satellite" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)";
        const legendText = baseMap === "satellite" ? "#ffffff" : "#333333";
        ctx.fillStyle = legendBg;
        ctx.fillRect(rect.width - 130, 82, 125, 22);
        ctx.strokeStyle = baseMap === "satellite" ? "#555" : "#ddd";
        ctx.lineWidth = 1;
        ctx.strokeRect(rect.width - 130, 82, 125, 22);
        ctx.fillStyle = "rgba(234, 88, 12, 0.18)";
        ctx.fillRect(rect.width - 120, 89, 16, 10);
        ctx.strokeStyle = "#ea580c";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 2]);
        ctx.strokeRect(rect.width - 120, 89, 16, 10);
        ctx.setLineDash([]);
        ctx.font = "12px sans-serif";
        ctx.fillStyle = legendText;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("동일소유자", rect.width - 98, 94);
      }
    }
    
    // 거리 측정 포인트 및 라인 그리기 (네이버 지도 스타일)
    if (measurePoints.length > 0) {
      const pixelsPerMeter = getPixelsPerMeter();
      const NAVER_PINK = "#ff3478"; // 네이버 지도 핑크색
      
      // 라인 그리기
      if (measurePoints.length > 1) {
        ctx.strokeStyle = NAVER_PINK;
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(measurePoints[0].x, measurePoints[0].y);
        for (let i = 1; i < measurePoints.length; i++) {
          ctx.lineTo(measurePoints[i].x, measurePoints[i].y);
        }
        ctx.stroke();
        
        // 각 구간 중간에 거리 라벨 표시
        for (let i = 1; i < measurePoints.length; i++) {
          const p1 = measurePoints[i - 1];
          const p2 = measurePoints[i];
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) / pixelsPerMeter;
          
          // 거리 라벨 (네이버 스타일: 흰 배경 + 핑크 테두리)
          ctx.font = "bold 12px sans-serif";
          const label = distance >= 1000 ? `${(distance/1000).toFixed(1)}km` : `${distance.toFixed(0)}m`;
          const labelWidth = ctx.measureText(label).width + 12;
          
          // 라벨 배경 (둥근 사각형)
          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = NAVER_PINK;
          ctx.lineWidth = 1.5;
          const labelHeight = 22;
          const radius = 4;
          ctx.beginPath();
          ctx.roundRect(midX - labelWidth / 2, midY - labelHeight / 2, labelWidth, labelHeight, radius);
          ctx.fill();
          ctx.stroke();
          
          // 거리 텍스트
          ctx.fillStyle = NAVER_PINK;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, midX, midY);
        }
      }
      
      // 포인트 그리기 (네이버 스타일: 흰색 원 + 핑크 테두리)
      measurePoints.forEach((point, index) => {
        // 외곽 원 (핑크 테두리)
        ctx.beginPath();
        ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = NAVER_PINK;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        // 첫 번째 포인트는 내부에 작은 핑크 원
        if (index === 0 && measurePoints.length > 1) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = NAVER_PINK;
          ctx.fill();
        }
      });
    }
  }, [landInfo, showOverlay, baseMap, layers, zoomLevel, measurePoints, showSameOwner, sameOwnerParcels]);

  // 캔버스 클릭 핸들러 (거리 측정)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!measureMode) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newPoints = [...measurePoints, { x, y }];
    setMeasurePoints(newPoints);
    
    // 총 거리 계산
    if (newPoints.length > 1) {
      const pixelsPerMeter = getPixelsPerMeter();
      let total = 0;
      for (let i = 1; i < newPoints.length; i++) {
        const p1 = newPoints[i - 1];
        const p2 = newPoints[i];
        total += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) / pixelsPerMeter;
      }
      setTotalDistance(total);
    }
  };
  
  // 측정 초기화
  const resetMeasurement = () => {
    setMeasurePoints([]);
    setTotalDistance(0);
  };
  
  // 측정 모드 토글
  const toggleMeasureMode = () => {
    if (measureMode) {
      setMeasureMode(false);
      resetMeasurement();
    } else {
      setMeasureMode(true);
    }
  };

  return (
    <div className="w-full space-y-2">
    <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted">

      {/* 지도 오버레이 - 우측 상단 (지도/항공사진, 거리측정, 각도측정) */}
      <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
        {/* 배경지도 타입 선택 */}
        <div className="flex gap-2 bg-white rounded-xl p-2 shadow-md">
          <button
            onClick={() => setBaseMap("normal")}
            className={`flex flex-col items-center rounded-lg overflow-hidden transition-all ${baseMap === "normal" ? "ring-2 ring-teal-600" : "ring-1 ring-gray-200 hover:ring-gray-300"}`}
          >
            <div className="relative w-[56px] h-[40px] overflow-hidden bg-[#f0ede8]">
              <div className="absolute inset-0">
                <div className="absolute top-3 left-2 right-2 h-[3px] bg-[#ffd54f] rounded-full" />
                <div className="absolute top-6 left-2 w-[24px] h-[2px] bg-white" />
                <div className="absolute bottom-4 left-4 w-[18px] h-[14px] bg-[#d4e8d4] rounded-sm" />
                <div className="absolute bottom-3 right-3 w-[22px] h-[10px] bg-[#c5daf0] rounded-sm" />
                <div className="absolute top-[22px] left-[52%] w-[2px] h-[26px] bg-white transform -translate-x-1/2" />
              </div>
            </div>
            <span className={`w-full text-center text-[14px] font-medium py-1.5 ${baseMap === "normal" ? "text-teal-600 bg-teal-50" : "text-gray-600"}`}>지도</span>
          </button>
          <button
            onClick={() => setBaseMap("satellite")}
            className={`flex flex-col items-center rounded-lg overflow-hidden transition-all ${baseMap === "satellite" ? "ring-2 ring-teal-600" : "ring-1 ring-gray-200 hover:ring-gray-300"}`}
          >
            <div className="relative w-[56px] h-[40px] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a3d1a] via-[#2d5a2d] to-[#1a4a2a]">
                <div className="absolute top-1 left-1 right-1 h-[2px] bg-[#3a3a3a]/40" />
                <div className="absolute top-3 left-2 w-[14px] h-[10px] bg-[#4a5a4a] rounded-sm" />
                <div className="absolute bottom-3 right-2 w-[24px] h-[12px] bg-[#3a4a3a] rounded-sm" />
                <div className="absolute top-[50%] left-0 right-0 h-[1px] bg-[#5a5a5a]/30" />
              </div>
            </div>
            <span className={`w-full text-center text-[14px] font-medium py-1.5 ${baseMap === "satellite" ? "text-teal-600 bg-teal-50" : "text-gray-600"}`}>항공사진</span>
          </button>
        </div>

        {/* 거리측정 / 각도측정 */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={toggleMeasureMode}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-white shadow-sm border transition-all ${measureMode ? "border-teal-600 ring-1 ring-teal-600" : "border-gray-200 hover:border-gray-300"}`}
          >
            <Ruler className={`h-[18px] w-[18px] shrink-0 ${measureMode ? "text-teal-600" : "text-gray-500"}`} strokeWidth={1.5} />
            <span className={`text-[14px] font-medium ${measureMode ? "text-teal-600" : "text-gray-600"}`}>거리측정</span>
          </button>
          <button
            onClick={() => {}}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white shadow-sm border border-gray-200 hover:border-gray-300 transition-all"
          >
            <Triangle className="h-[18px] w-[18px] shrink-0 text-gray-500" strokeWidth={1.5} />
            <span className="text-[14px] font-medium text-gray-600">각도측정</span>
          </button>
        </div>
      </div>

      {/* 줌 컨트롤 - 좌측 상단 */}
      <div className="absolute left-3 top-3 z-[1000] flex flex-col gap-1">
        <div className="flex flex-col overflow-hidden rounded-md bg-white shadow-md">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 rounded-none p-0 text-[#1a1a1a] hover:bg-gray-100 [&_svg]:text-[#1a1a1a]"
            onClick={() => setZoomLevel(prev => Math.min(20, prev + 1))}
            disabled={zoomLevel >= 20}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <div className="border-t border-gray-200 px-1 py-1 text-center text-base font-medium text-[#1a1a1a]">
            {zoomLevel}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 rounded-none border-t border-gray-200 p-0 text-[#1a1a1a] hover:bg-gray-100 [&_svg]:text-[#1a1a1a]"
            onClick={() => setZoomLevel(prev => Math.max(10, prev - 1))}
            disabled={zoomLevel <= 10}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* 현재 위치 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 bg-white p-0 text-[#1a1a1a] shadow-md hover:bg-gray-50 [&_svg]:text-[#1a1a1a]"
          onClick={() => {
            // 현재 위치로 이동 (기본 줌 레벨로 리셋)
            setZoomLevel(17);
          }}
        >
          <Locate className="h-4 w-4" />
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        className={cn(
          "h-[300px] w-full sm:h-[460px]",
          interactive && "cursor-crosshair",
          measureMode && "cursor-crosshair"
        )}
        style={{ display: "block" }}
        onClick={handleCanvasClick}
      />
      
      {/* 거리 측정 모드 안내 및 결과 (네이버 지도 스타일) */}
      {measureMode && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg bg-white shadow-lg border border-gray-200 overflow-hidden">
          {measurePoints.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-600">
              지도를 클릭하여 거리 측정을 시작하세요
            </div>
          ) : (
            <div className="min-w-[200px]">
              {/* 거리 정보 테이블 */}
              <div className="px-4 py-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">총거리</span>
                  <span className="text-sm font-bold" style={{ color: '#ff3478' }}>
                    {totalDistance >= 1000 
                      ? `${(totalDistance/1000).toFixed(1)}km` 
                      : `${totalDistance.toFixed(0)}m`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">도보</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.ceil(totalDistance / 67)}분
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">자전거</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.ceil(totalDistance / 250)}분
                  </span>
                </div>
              </div>
              {/* 안내 문구 */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                우클릭 또는 ESC로 측정 종료
              </div>
            </div>
          )}
          {/* 닫기 버튼 */}
          <Button
            variant="ghost"
            className="absolute top-1 right-1 h-10 w-10 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            onClick={toggleMeasureMode}
          >
            <X className="h-8 w-8" />
          </Button>
        </div>
      )}
      

    </div>

    {/* 하단: 범례(원필지·잔여지·편입지) + 토글(도로구역·국토수급·동일소유자) */}
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-1">
      {/* 원필지 / 잔여지 / 편입지 토글 버튼 */}
      <button
        onClick={() => setLayers((prev) => ({ ...prev, originalParcel: !prev.originalParcel }))}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[13px] font-medium transition-all ${layers.originalParcel ? "border-teal-600 text-teal-600 bg-teal-50" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"}`}
      >
        <span className="inline-block w-3 h-3 rounded-[2px] shrink-0" style={{ background: "transparent", border: "2px dashed #888888" }} />
        원필지
      </button>
      <button
        onClick={() => setLayers((prev) => ({ ...prev, remainderParcel: !prev.remainderParcel }))}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[13px] font-medium transition-all ${layers.remainderParcel ? "border-teal-600 text-teal-600 bg-teal-50" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"}`}
      >
        <span className="inline-block w-3 h-3 rounded-[2px] shrink-0" style={{ background: "rgba(59,130,246,0.35)", border: "1.5px solid #3b82f6" }} />
        잔여지
      </button>
      <button
        onClick={() => setLayers((prev) => ({ ...prev, incorporatedParcel: !prev.incorporatedParcel }))}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[13px] font-medium transition-all ${layers.incorporatedParcel ? "border-teal-600 text-teal-600 bg-teal-50" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"}`}
      >
        <span className="inline-block w-3 h-3 rounded-[2px] shrink-0" style={{ background: "rgba(239,68,68,0.35)", border: "1.5px solid #ef4444" }} />
        편입지
      </button>

      <div className="h-5 w-px bg-border" />

      {/* 토글 레이어 버튼 */}
      <button
        onClick={() => setLayers((prev) => ({ ...prev, roadArea: !prev.roadArea }))}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[13px] font-medium transition-all ${layers.roadArea ? "border-teal-600 text-teal-600 bg-teal-50" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"}`}
      >
        <span className="inline-block w-3 h-3 rounded-[2px] shrink-0" style={{ background: "#a0a0a0", border: "1.5px dashed #ff6b6b" }} />
        도로구역
      </button>
      <button
        onClick={() => setLayers((prev) => ({ ...prev, landSupplyDemand: !prev.landSupplyDemand }))}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[13px] font-medium transition-all ${layers.landSupplyDemand ? "border-teal-600 text-teal-600 bg-teal-50" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"}`}
      >
        <span className="inline-block w-3 h-3 rounded-[2px] shrink-0" style={{ background: "rgba(255,193,7,0.3)", border: "1.5px solid #ffc107" }} />
        국토수급
      </button>
      <button
        onClick={() => setShowSameOwner((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[13px] font-medium transition-all ${showSameOwner ? "border-teal-600 text-teal-600 bg-teal-50" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"}`}
      >
        <span className="inline-block w-3 h-3 rounded-[2px] shrink-0" style={{ background: "rgba(234,88,12,0.2)", border: "1.5px dashed #ea580c" }} />
        동일소유자
      </button>

      {(layers.landSupplyDemand || layers.roadArea) && zoomLevel < LAYER_MIN_ZOOM && (
        <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1">
          <Info className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <p className="text-[13px] text-amber-600">줌 {LAYER_MIN_ZOOM}+ 에서 표시</p>
        </div>
      )}
    </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
