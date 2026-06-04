"use client";

import { useRef, useEffect, useState } from "react";
import { Layers, Map as MapIcon, Plus, Minus, Info, Ruler, X, RotateCcw, Locate, Route, Triangle } from "lucide-react";
import type { LandInfo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface LandMapProps {
  landInfo?: LandInfo;
  showOverlay?: boolean;
  interactive?: boolean;
  onSelect?: (landId: string) => void;
}

type BaseMapType = "normal" | "satellite";

// 레이어 가시화 최소 줌 레벨
const LAYER_MIN_ZOOM = 17;

export function LandMap({
  landInfo,
  showOverlay = true,
  interactive = false,
}: LandMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 배경지도 타입
  const [baseMap, setBaseMap] = useState<BaseMapType>("normal");
  
  // 줌 레벨 (14-20)
  const [zoomLevel, setZoomLevel] = useState(14);
  
  // 레이어 옵션
  const [layers, setLayers] = useState({
    landSupplyDemand: false, // 국토수급
    roadArea: true, // 도로구역
  });
  
  // 레이어 가시화 여부
  const isLayerVisible = zoomLevel >= LAYER_MIN_ZOOM;
  
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
  }, [landInfo, showOverlay, baseMap, layers, zoomLevel, measurePoints]);

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
    <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted">
      {/* 지도 컨트롤 - 우측 상단 (배경지도/도구) */}
      <div className="absolute right-0 top-3 z-[1000] flex flex-col gap-1.5 pr-3">
        {/* 배경지도 타입 선택 - 네이버지도 스타일 */}
        <div className="flex gap-1.5 bg-white rounded-lg p-1.5 shadow">
          <button
            onClick={() => setBaseMap("normal")}
            className={`relative flex flex-col items-center rounded-md overflow-hidden transition-all ${
              baseMap === "normal" 
                ? "ring-2 ring-blue-500" 
                : "ring-1 ring-gray-200 hover:ring-gray-300"
            }`}
          >
            <div className="relative w-[60px] h-[42px] overflow-hidden bg-[#f0ede8]">
              {/* 지도 썸네일 - 도로와 건물 표현 */}
              <div className="absolute inset-0">
                <div className="absolute top-2 left-2 right-2 h-[3px] bg-[#ffd54f] rounded-full" />
                <div className="absolute top-4 left-1 w-[20px] h-[2px] bg-white" />
                <div className="absolute bottom-3 left-3 w-[15px] h-[12px] bg-[#d4e8d4] rounded-sm" />
                <div className="absolute bottom-2 right-2 w-[18px] h-[8px] bg-[#c5daf0] rounded-sm" />
                <div className="absolute top-[18px] left-[50%] w-[2px] h-[20px] bg-white transform -translate-x-1/2" />
              </div>
              {/* 상단 아이콘 */}
              <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2">
                <div className="bg-white rounded-sm p-0.5 shadow-sm">
                  <svg className="w-2.5 h-2.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </div>
            </div>
            <span className={`text-[11px] font-medium py-1 ${baseMap === "normal" ? "text-blue-600" : "text-gray-600"}`}>
              일반지도
            </span>
          </button>
          <button
            onClick={() => setBaseMap("satellite")}
            className={`relative flex flex-col items-center rounded-md overflow-hidden transition-all ${
              baseMap === "satellite" 
                ? "ring-2 ring-blue-500" 
                : "ring-1 ring-gray-200 hover:ring-gray-300"
            }`}
          >
            <div className="relative w-[60px] h-[42px] overflow-hidden">
              {/* 위성 썸네일 */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a3d1a] via-[#2d5a2d] to-[#1a4a2a]">
                <div className="absolute top-1 left-1 right-1 h-[2px] bg-[#3a3a3a]/40" />
                <div className="absolute top-3 left-2 w-[12px] h-[8px] bg-[#4a5a4a] rounded-sm" />
                <div className="absolute bottom-2 right-1 w-[20px] h-[10px] bg-[#3a4a3a] rounded-sm" />
                <div className="absolute top-[50%] left-0 right-0 h-[1px] bg-[#5a5a5a]/30" />
              </div>
            </div>
            <span className={`text-[11px] font-medium py-1 ${baseMap === "satellite" ? "text-blue-600" : "text-gray-600"}`}>
              위성지도
            </span>
          </button>
        </div>
        
        {/* 지도 도구 버튼들 - 세로 스택 */}
        <div className="flex flex-col gap-1 items-end">
          {/* 국토수급 */}
          <button
            onClick={() => setLayers((prev) => ({ ...prev, landSupplyDemand: !prev.landSupplyDemand }))}
            className={`flex flex-col items-center justify-center w-[52px] h-12 rounded-md shadow transition-colors ${
              layers.landSupplyDemand 
                ? "bg-white ring-2 ring-primary" 
                : "bg-white hover:bg-gray-100"
            }`}
          >
            <Layers className={`h-4 w-4 mb-0.5 ${layers.landSupplyDemand ? "text-primary" : "text-gray-700"}`} strokeWidth={1.5} />
            <span className={`text-[10px] font-medium ${layers.landSupplyDemand ? "text-primary" : "text-gray-700"}`}>국토수급</span>
          </button>
          
          {/* 도로구역 */}
          <button
            onClick={() => setLayers((prev) => ({ ...prev, roadArea: !prev.roadArea }))}
            className={`flex flex-col items-center justify-center w-[52px] h-12 rounded-md shadow transition-colors ${
              layers.roadArea 
                ? "bg-white ring-2 ring-primary" 
                : "bg-white hover:bg-gray-100"
            }`}
          >
            <Route className={`h-4 w-4 mb-0.5 ${layers.roadArea ? "text-primary" : "text-gray-700"}`} strokeWidth={1.5} />
            <span className={`text-[10px] font-medium ${layers.roadArea ? "text-primary" : "text-gray-700"}`}>도로구역</span>
          </button>
          
          {/* 거리측정 */}
          <button
            onClick={toggleMeasureMode}
            className={`flex flex-col items-center justify-center w-[52px] h-12 rounded-md shadow transition-colors ${
              measureMode 
                ? "bg-white ring-2 ring-primary" 
                : "bg-white hover:bg-gray-100"
            }`}
          >
            <Ruler className={`h-4 w-4 mb-0.5 ${measureMode ? "text-primary" : "text-gray-700"}`} strokeWidth={1.5} />
            <span className={`text-[10px] font-medium ${measureMode ? "text-primary" : "text-gray-700"}`}>거리측정</span>
          </button>
          
          {/* 각도측정 */}
          <button
            onClick={() => {
              // 각도 측정은 캔버스 기반 지도에서는 미지원 (placeholder)
            }}
            className="flex flex-col items-center justify-center w-[52px] h-12 rounded-md shadow transition-colors bg-white hover:bg-gray-100"
          >
            <Triangle className="h-4 w-4 mb-0.5 text-gray-700" strokeWidth={1.5} />
            <span className="text-[10px] font-medium text-gray-700">각도측정</span>
          </button>
        </div>
        
        {/* 레이어 가시화 안내 */}
        {(layers.landSupplyDemand || layers.roadArea) && zoomLevel < LAYER_MIN_ZOOM && (
          <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 p-2 mt-1 max-w-[52px] shadow">
            <Info className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
            <p className="text-[9px] leading-tight text-amber-600">
              {LAYER_MIN_ZOOM}+
            </p>
          </div>
        )}
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
          "h-[300px] w-full sm:h-[400px]",
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
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
