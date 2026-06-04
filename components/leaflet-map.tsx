"use client";

import { useEffect, useRef, useState } from "react";
import { Layers, Plus, Minus, Info, Locate, Ruler, X, Triangle, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// 레이어 가시화 최소 줌 레벨
const LAYER_MIN_ZOOM = 17;

// 지역별 좌표 데이터
const regionCoordinates: Record<string, { lat: number; lng: number; zoom: number }> = {
  // 시도
  "서울특별시": { lat: 37.5665, lng: 126.9780, zoom: 11 },
  "부산광역시": { lat: 35.1796, lng: 129.0756, zoom: 11 },
  "대구광역시": { lat: 35.8714, lng: 128.6014, zoom: 11 },
  "인천광역시": { lat: 37.4563, lng: 126.7052, zoom: 11 },
  "광주광역시": { lat: 35.1595, lng: 126.8526, zoom: 11 },
  "대전광역시": { lat: 36.3504, lng: 127.3845, zoom: 11 },
  "울산광역시": { lat: 35.5384, lng: 129.3114, zoom: 11 },
  "세종특별자치시": { lat: 36.4800, lng: 127.2890, zoom: 11 },
  "경기도": { lat: 37.4138, lng: 127.5183, zoom: 9 },
  "강원특별자치도": { lat: 37.8228, lng: 128.1555, zoom: 9 },
  "충청북도": { lat: 36.6357, lng: 127.4917, zoom: 9 },
  "충청남도": { lat: 36.5184, lng: 126.8000, zoom: 9 },
  "전북특별자치도": { lat: 35.8203, lng: 127.1088, zoom: 9 },
  "전라남도": { lat: 34.8679, lng: 126.9910, zoom: 9 },
  "경상북도": { lat: 36.4919, lng: 128.8889, zoom: 9 },
  "경상남도": { lat: 35.4606, lng: 128.2132, zoom: 9 },
  "제주특별자치도": { lat: 33.4890, lng: 126.4983, zoom: 10 },
  // 시군구 (일부 예시)
  "용인시 처인구": { lat: 37.2343, lng: 127.2010, zoom: 13 },
  "이천시": { lat: 37.2720, lng: 127.4350, zoom: 12 },
  "광주시": { lat: 37.4095, lng: 127.2550, zoom: 12 },
  "음성군": { lat: 36.9400, lng: 127.6900, zoom: 12 },
  "진천군": { lat: 36.8550, lng: 127.4350, zoom: 12 },
  "천안시 동남구": { lat: 36.7850, lng: 127.1550, zoom: 12 },
  "천안시 서북구": { lat: 36.8650, lng: 127.1350, zoom: 12 },
  "아산시": { lat: 36.7900, lng: 127.0020, zoom: 12 },
  // 읍면동 (일부 예시)
  "양지면": { lat: 37.2350, lng: 127.2850, zoom: 14 },
  "백암면": { lat: 37.1550, lng: 127.3550, zoom: 14 },
  "마장면": { lat: 37.3050, lng: 127.4250, zoom: 14 },
  "곤지암읍": { lat: 37.3550, lng: 127.3250, zoom: 14 },
  "삼성면": { lat: 36.9650, lng: 127.5850, zoom: 14 },
  "금왕읍": { lat: 36.9950, lng: 127.6150, zoom: 14 },
  // 리 (일부 예시)
  "마성리": { lat: 37.2180, lng: 127.2950, zoom: 17 },
  "송문리": { lat: 37.2280, lng: 127.2780, zoom: 17 },
  "봉남리": { lat: 37.1450, lng: 127.3650, zoom: 17 },
  "덕평리": { lat: 37.3150, lng: 127.4150, zoom: 17 },
  "신리": { lat: 37.3620, lng: 127.3180, zoom: 17 },
};

interface ParcelData {
  id: string;
  coordinates: Array<{ lat: number; lng: number }>;
  address: string;
  isIncluded: boolean;
  isOwned?: boolean;
}

interface LeafletMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  selectedRegion?: string;
  onParcelClick?: (parcelId: string) => void;
  onParcelHover?: (parcelId: string | null) => void; // 호버 이벤트
  parcels?: ParcelData[];
  selectedParcelId?: string;
  selectedParcelIds?: Set<string>; // 복수 선택 지원
  hoveredParcelId?: string | null; // 호버된 필지 ID
  focusedParcelId?: string | null; // 포커스할 필지 ID (지도 중심 이동)
  zoomControlsPosition?: "left" | "sidebar-right"; // 줌 컨트롤 위치
}

type BaseMapType = "normal" | "satellite";

export function LeafletMap({
  center = { lat: 37.2350, lng: 127.2850 },
  selectedParcelIds = new Set(),
  zoom = 14,
  selectedRegion,
  onParcelClick,
  onParcelHover,
  parcels = [],
  selectedParcelId,
  hoveredParcelId,
  focusedParcelId,
  zoomControlsPosition = "left",
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.LayerGroup | null>(null);
  const normalTileRef = useRef<L.TileLayer | null>(null);
  const satelliteTileRef = useRef<L.TileLayer | null>(null);
  const landSupplyLayerRef = useRef<L.LayerGroup | null>(null);
  const roadAreaLayerRef = useRef<L.LayerGroup | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [baseMap, setBaseMap] = useState<BaseMapType>("normal");
  const [layers, setLayers] = useState({
    landSupplyDemand: false,
    roadArea: true,
  });
  
  // 거리 측정 상태
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const measureLayerRef = useRef<L.LayerGroup | null>(null);
  
  // 각도 측정 상태
  const [angleMeasureMode, setAngleMeasureMode] = useState(false);
  const [anglePoints, setAnglePoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [measuredAngle, setMeasuredAngle] = useState<number | null>(null);
  const angleLayerRef = useRef<L.LayerGroup | null>(null);

  const isLayerVisible = currentZoom >= LAYER_MIN_ZOOM;

  // Leaflet 초기화
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    // Leaflet CSS 동적 로드
    const linkEl = document.createElement("link");
    linkEl.rel = "stylesheet";
    linkEl.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(linkEl);

    // Leaflet JS 동적 로드
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const L = (window as typeof window & { L: typeof import("leaflet") }).L;

      // 지도 생성
      const map = L.map(mapRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // 타일 레이어 추가 (OpenStreetMap 기본, ESRI 위성)
      const normalTile = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      );

      const satelliteTile = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      );

      // ref에 저장
      normalTileRef.current = normalTile;
      satelliteTileRef.current = satelliteTile;

      // 기본 타일 추가
      normalTile.addTo(map);

      // 폴리곤 레이어 그룹 생성
      const polygonLayer = L.layerGroup().addTo(map);
      polygonLayerRef.current = polygonLayer;

      // 국토수급 레이어 그룹 생성
      const landSupplyLayer = L.layerGroup();
      landSupplyLayerRef.current = landSupplyLayer;

      // 도로구역 레이어 그룹 생성 (기본 활성화)
      const roadAreaLayer = L.layerGroup().addTo(map);
      roadAreaLayerRef.current = roadAreaLayer;
      
      // 거리 측정 레이어 그룹 생성
      const measureLayer = L.layerGroup().addTo(map);
      measureLayerRef.current = measureLayer;

      // 줌 변경 이벤트
      map.on("zoomend", () => {
        setCurrentZoom(map.getZoom());
      });

      mapInstanceRef.current = map;
      setIsMapReady(true);
    };

    document.body.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 지역 변경 시 지도 이동
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedRegion) return;

    const coords = regionCoordinates[selectedRegion];
    if (coords) {
      mapInstanceRef.current.setView([coords.lat, coords.lng], coords.zoom, {
        animate: true,
      });
    }
  }, [selectedRegion]);

  // focusedParcelId 변경 시 해당 필지로 지도 이동
  useEffect(() => {
    if (!mapInstanceRef.current || !focusedParcelId || !isMapReady) return;

    const parcel = parcels.find(p => p.id === focusedParcelId);
    if (parcel && parcel.coordinates.length > 0) {
      // 필지 중심점 계산
      const avgLat = parcel.coordinates.reduce((sum, c) => sum + c.lat, 0) / parcel.coordinates.length;
      const avgLng = parcel.coordinates.reduce((sum, c) => sum + c.lng, 0) / parcel.coordinates.length;
      
      mapInstanceRef.current.setView([avgLat, avgLng], 18, {
        animate: true,
      });
    }
  }, [focusedParcelId, parcels, isMapReady]);

  // 배경지도 타입 변경 시 타일 전환
  useEffect(() => {
    if (!mapInstanceRef.current || !normalTileRef.current || !satelliteTileRef.current || !isMapReady) return;

    const map = mapInstanceRef.current;
    const normalTile = normalTileRef.current;
    const satelliteTile = satelliteTileRef.current;

    if (baseMap === "satellite") {
      if (map.hasLayer(normalTile)) {
        map.removeLayer(normalTile);
      }
      if (!map.hasLayer(satelliteTile)) {
        satelliteTile.addTo(map);
        satelliteTile.bringToBack();
      }
    } else {
      if (map.hasLayer(satelliteTile)) {
        map.removeLayer(satelliteTile);
      }
      if (!map.hasLayer(normalTile)) {
        normalTile.addTo(map);
        normalTile.bringToBack();
      }
    }
  }, [baseMap, isMapReady]);

  // 레이어 토글 효과 (국토수급, 도로구역)
  useEffect(() => {
    if (!mapInstanceRef.current || !landSupplyLayerRef.current || !roadAreaLayerRef.current || !isMapReady) return;

    const L = (window as typeof window & { L: typeof import("leaflet") }).L;
    const map = mapInstanceRef.current;
    const landSupplyLayer = landSupplyLayerRef.current;
    const roadAreaLayer = roadAreaLayerRef.current;

    // 국토수급 레이어 토글
    if (layers.landSupplyDemand) {
      if (!map.hasLayer(landSupplyLayer)) {
        // 국토수급 영역 표시 (예시 데이터 - 파란색 영역)
        landSupplyLayer.clearLayers();
        const landSupplyArea = L.polygon([
          [37.2200, 127.2900],
          [37.2250, 127.2900],
          [37.2250, 127.3000],
          [37.2200, 127.3000],
        ], {
          color: "#2196f3",
          weight: 2,
          fillColor: "#2196f3",
          fillOpacity: 0.2,
          dashArray: "5, 5",
        });
        landSupplyArea.addTo(landSupplyLayer);
        landSupplyLayer.addTo(map);
      }
    } else {
      if (map.hasLayer(landSupplyLayer)) {
        map.removeLayer(landSupplyLayer);
      }
    }

    // 도로구역 레이어 토글
    if (layers.roadArea) {
      if (!map.hasLayer(roadAreaLayer)) {
        // 도로구역 영역 표시 (예시 데이터 - 주황색 영역)
        roadAreaLayer.clearLayers();
        const roadArea = L.polygon([
          [37.2170, 127.2940],
          [37.2210, 127.2940],
          [37.2210, 127.3010],
          [37.2170, 127.3010],
        ], {
          color: "#ff9800",
          weight: 2,
          fillColor: "#ff9800",
          fillOpacity: 0.15,
          dashArray: "10, 5",
        });
        roadArea.addTo(roadAreaLayer);
        roadAreaLayer.addTo(map);
      }
    } else {
      if (map.hasLayer(roadAreaLayer)) {
        map.removeLayer(roadAreaLayer);
      }
    }
  }, [layers, isMapReady]);

  // Set을 직렬화하여 의존성 비교용으로 사용
  const selectedParcelIdsKey = Array.from(selectedParcelIds).sort().join(",");
  
  // parcels의 isOwned 상태를 직렬화하여 의존성 비교용으로 사용
  const parcelsOwnedKey = parcels.map(p => `${p.id}:${p.isOwned ? 1 : 0}`).join(",");
  
  // 필지 폴리곤 렌더링
  useEffect(() => {
    if (!mapInstanceRef.current || !polygonLayerRef.current || !isMapReady) return;

    const L = (window as typeof window & { L: typeof import("leaflet") }).L;
    const polygonLayer = polygonLayerRef.current;

    // 기존 폴리곤 제거
    polygonLayer.clearLayers();

    if (parcels.length === 0) return;

    // 각 필지에 대해 폴리곤 생성
    parcels.forEach((parcel) => {
      if (!parcel.coordinates || parcel.coordinates.length < 3) return;
      
      // 좌표 유효성 검사
      const validCoords = parcel.coordinates.filter(coord => 
        coord && typeof coord.lat === 'number' && typeof coord.lng === 'number' &&
        !isNaN(coord.lat) && !isNaN(coord.lng) && 
        isFinite(coord.lat) && isFinite(coord.lng) &&
        Math.abs(coord.lat) <= 90 && Math.abs(coord.lng) <= 180
      );
      
      if (validCoords.length < 3) return;

      const isSelected = parcel.id === selectedParcelId || selectedParcelIds.has(parcel.id);
      const isOwned = parcel.isOwned ?? selectedParcelIds.has(parcel.id);
      const isHovered = parcel.id === hoveredParcelId;
      const isAdjacentParcel = !parcel.isIncluded; // 인접 필지 여부 (미신청 인접지)
      const latlngs = validCoords.map(coord => [coord.lat, coord.lng] as [number, number]);

      // 4가지 필지 상태별 스타일링
      // 1. 민원인 신청 필지 선택 시 - 파란색 실선
      // 2. 민원인 신청 필지 미선택 시 - 회색 실선
      // 3. (미신청 인접지) 선택 시 - 주황색 실선
      // 4. (미신청 인접지) 미선택 시 - 주황색 점선
      let polygonColor = "#6b7280"; // 기본: 미선택 신청필지 (회색)
      let fillColor = "#f3f4f6";
      let weight = 3;
      let fillOpacity = 0.3;
      let dashArray: string | undefined = undefined;
      
      if (isAdjacentParcel) {
        // 미신청 인접지
        if (isSelected || isOwned) {
          // 3. (미신청 인접지) 선택 시: 주황색 실선, 배경은 보더색상 10%
          polygonColor = "#d97706"; // 주황색
          fillColor = "#d97706"; // 보더와 동일한 색상
          weight = 4;
          fillOpacity = 0.1; // 10% 투명도
          dashArray = undefined; // 실선
        } else {
          // 4. (미신청 인접지) 미선택 시: 주황색 점선
          polygonColor = "#d97706"; // 주황색
          fillColor = "#d97706"; // 보더와 동일한 색상
          weight = 2;
          fillOpacity = 0.05; // 미선택시 더 연하게
          dashArray = "6, 4"; // 점선 스타일
        }
      } else {
        // 민원인 신청 필지
        if (isSelected || isOwned) {
          // 1. 민원인 신청 필지 선택 시: 파란색 실선, 배경은 보더색상 10%
          polygonColor = "#2563eb"; // 파란색
          fillColor = "#2563eb"; // 보더와 동일한 색상
          weight = 4;
          fillOpacity = 0.1; // 10% 투명도
          dashArray = undefined; // 실선
        } else {
          // 2. 민원인 신청 필지 미선택 시: 파란색 실선, 배경 없음
          polygonColor = "#2563eb"; // 파란색
          fillColor = "transparent"; // 배경 없음
          weight = 3;
          fillOpacity = 0; // 배경 투명
          dashArray = undefined; // 실선
        }
      }
      
      // 호버 시 스타일 오버라이드
      if (isHovered) {
        if (isAdjacentParcel) {
          // 인접 필지 호버: 진한 주황색, 배경은 보더색상 15%
          polygonColor = "#c2410c";
          fillColor = "#c2410c";
          weight = 4;
          fillOpacity = 0.15;
          dashArray = undefined;
        } else {
          // 신청 필지 호버: 진한 파란색, 배경은 보더색상 15%
          polygonColor = "#1d4ed8";
          fillColor = "#1d4ed8";
          weight = 4;
          fillOpacity = 0.15;
          dashArray = undefined;
        }
      }
      
      const polygon = L.polygon(latlngs, {
        color: polygonColor,
        weight: weight,
        fillColor: fillColor,
        fillOpacity: fillOpacity,
        opacity: 1,
        dashArray: dashArray,
      });

      // 호버 이벤트
      polygon.on("mouseover", () => {
        if (onParcelHover) {
          onParcelHover(parcel.id);
        }
      });
      
      polygon.on("mouseout", () => {
        if (onParcelHover) {
          onParcelHover(null);
        }
      });

      // 클릭 이벤트
      polygon.on("click", () => {
        if (onParcelClick) {
          onParcelClick(parcel.id);
        }
      });

      polygon.addTo(polygonLayer);

      // 필지 중앙에 지번 라벨 추가
      const bounds = polygon.getBounds();
      const center = bounds.getCenter();
      
      // 주소에서 지번만 추출 (마지막 부분)
      const addressParts = parcel.address.split(" ");
      const jibunNumber = addressParts[addressParts.length - 1];
      
      // 커스텀 라벨 마커 생성
      const labelIcon = L.divIcon({
        className: "parcel-label",
        html: `<div style="
          background: transparent;
          color: #333;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          text-shadow: 1px 1px 1px white, -1px -1px 1px white, 1px -1px 1px white, -1px 1px 1px white;
        ">${jibunNumber}</div>`,
        iconSize: [50, 20],
        iconAnchor: [25, 10],
      });
      
      const labelMarker = L.marker(center, { 
        icon: labelIcon,
        interactive: true,
      });
      
      // 라벨 클릭시에도 필지 선택
      labelMarker.on("click", () => {
        if (onParcelClick) {
          onParcelClick(parcel.id);
        }
      });
      
      labelMarker.addTo(polygonLayer);
    });

    // 필지들이 있으면 해당 영역으로 지도 이동
    if (parcels.length > 0) {
      const firstParcel = parcels[0];
      if (firstParcel.coordinates && firstParcel.coordinates.length > 0) {
        // 유효한 좌표만 필터링
        const validCoords = firstParcel.coordinates.filter(c => 
          c && typeof c.lat === 'number' && typeof c.lng === 'number' &&
          !isNaN(c.lat) && !isNaN(c.lng) && isFinite(c.lat) && isFinite(c.lng)
        );
        
        if (validCoords.length > 0) {
          try {
            // 첫번째 필지의 중심점으로 이동 (animate: false로 에러 방지)
            const centerLat = validCoords.reduce((sum, c) => sum + c.lat, 0) / validCoords.length;
            const centerLng = validCoords.reduce((sum, c) => sum + c.lng, 0) / validCoords.length;
            if (isFinite(centerLat) && isFinite(centerLng)) {
              mapInstanceRef.current.setView([centerLat, centerLng], 18, { animate: false });
            }
          } catch {
            // setView 오류 무시
          }
        }
      }
    }
  }, [parcels, selectedParcelId, selectedParcelIdsKey, parcelsOwnedKey, hoveredParcelId, onParcelClick, onParcelHover, isMapReady]);

  // 줌 컨트롤
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  // 현재 위치로 이동
  const handleLocate = () => {
    if (mapInstanceRef.current && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          mapInstanceRef.current?.setView(
            [position.coords.latitude, position.coords.longitude],
            17
          );
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  };
  
  // 두 좌표 간 거리 계산 (Haversine 공식)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371000; // 지구 반지름 (미터)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  
  // 거리 측정 모드 토글
  const toggleMeasureMode = () => {
    if (measureMode) {
      setMeasureMode(false);
      resetMeasurement();
    } else {
      setMeasureMode(true);
      // 거리 측정 모드 시작 시 각도 측정 모드 끄기
      setAngleMeasureMode(false);
      setAnglePoints([]);
      setMeasuredAngle(null);
    }
  };
  
  // 측정 초기화
  const resetMeasurement = () => {
    setMeasurePoints([]);
    setTotalDistance(0);
    if (measureLayerRef.current) {
      measureLayerRef.current.clearLayers();
    }
  };
  
  // 거리 측정 클릭 핸들러
  useEffect(() => {
    if (!mapInstanceRef.current || !measureLayerRef.current || !isMapReady) return;
    
    const map = mapInstanceRef.current;
    const measureLayer = measureLayerRef.current;
    const L = (window as typeof window & { L: typeof import("leaflet") }).L;
    
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!measureMode) return;
      
      const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng };
      const newPoints = [...measurePoints, newPoint];
      setMeasurePoints(newPoints);
      
      // 총 거리 계산
      if (newPoints.length > 1) {
        let total = 0;
        for (let i = 1; i < newPoints.length; i++) {
          total += calculateDistance(
            newPoints[i - 1].lat, newPoints[i - 1].lng,
            newPoints[i].lat, newPoints[i].lng
          );
        }
        setTotalDistance(total);
      }
    };
    
    if (measureMode) {
      map.on("click", handleMapClick);
      map.getContainer().style.cursor = "crosshair";
    } else {
      map.off("click", handleMapClick);
      map.getContainer().style.cursor = "";
    }
    
    return () => {
      map.off("click", handleMapClick);
    };
  }, [measureMode, measurePoints, isMapReady]);
  
  // 거리 측정 포인트/라인 렌더링
  useEffect(() => {
    if (!measureLayerRef.current || !isMapReady) return;
    
    const measureLayer = measureLayerRef.current;
    const L = (window as typeof window & { L: typeof import("leaflet") }).L;
    
    measureLayer.clearLayers();
    
    if (measurePoints.length === 0) return;
    
    const NAVER_PINK = "#ff3478";
    
    // 유효한 좌표만 필터링
    const validPoints = measurePoints.filter(p => 
      p && typeof p.lat === 'number' && typeof p.lng === 'number' && 
      !isNaN(p.lat) && !isNaN(p.lng) && isFinite(p.lat) && isFinite(p.lng) &&
      Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180
    );
    
    if (validPoints.length === 0) return;
    
    try {
      // 라인 그리기
      if (validPoints.length > 1) {
        const latlngs = validPoints.map(p => L.latLng(p.lat, p.lng));
        const polyline = L.polyline(latlngs, {
          color: NAVER_PINK,
          weight: 4,
          opacity: 1,
        });
        polyline.addTo(measureLayer);
        
        // 각 구간 중간에 거리 라벨 표시
        for (let i = 1; i < validPoints.length; i++) {
          const p1 = validPoints[i - 1];
          const p2 = validPoints[i];
          const midLat = (p1.lat + p2.lat) / 2;
          const midLng = (p1.lng + p2.lng) / 2;
          const distance = calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng);
          
          const label = distance >= 1000 
            ? `${(distance / 1000).toFixed(1)}km` 
            : `${distance.toFixed(0)}m`;
          
          const labelIcon = L.divIcon({
            className: "measure-label",
            html: `<div style="
              background: white;
              border: 2px solid ${NAVER_PINK};
              border-radius: 4px;
              padding: 2px 6px;
              font-size: 12px;
              font-weight: bold;
              color: ${NAVER_PINK};
              white-space: nowrap;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">${label}</div>`,
            iconSize: [60, 24],
            iconAnchor: [30, 12],
          });
          
          L.marker([midLat, midLng], { icon: labelIcon, interactive: false }).addTo(measureLayer);
        }
      }
      
      // 포인트 마커 그리기
      validPoints.forEach((point, index) => {
        const markerIcon = L.divIcon({
          className: "measure-point",
          html: `<div style="
            width: 14px;
            height: 14px;
            background: white;
            border: 3px solid ${NAVER_PINK};
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ${index === 0 && measurePoints.length > 1 ? `
              position: relative;
            ` : ""}
          ">${index === 0 && measurePoints.length > 1 ? `
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 6px;
              height: 6px;
              background: ${NAVER_PINK};
              border-radius: 50%;
            "></div>
          ` : ""}</div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        
        L.marker([point.lat, point.lng], { icon: markerIcon, interactive: false }).addTo(measureLayer);
      });
    } catch {
      // 거리 측정 렌더링 에러 무시
    }
  }, [measurePoints, isMapReady]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-border">
      {/* 지도 컨테이너 */}
      <div ref={mapRef} className="h-full w-full" />

      {/* 로딩 상태 */}
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-2 text-base text-muted-foreground">지도 로딩중...</p>
          </div>
        </div>
      )}

      {/* 지도 컨트롤 - 배경지도/거리측정/레이어 */}
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
              setAngleMeasureMode(!angleMeasureMode);
              if (!angleMeasureMode) {
                // 각도 측정 모드 시작 시 거리 측정 모드 끄기
                setMeasureMode(false);
                setMeasurePoints([]);
                setTotalDistance(0);
              }
              setAnglePoints([]);
              setMeasuredAngle(null);
            }}
            className={`flex flex-col items-center justify-center w-[52px] h-12 rounded-md shadow transition-colors ${
              angleMeasureMode 
                ? "bg-white ring-2 ring-primary" 
                : "bg-white hover:bg-gray-100"
            }`}
          >
            <Triangle className={`h-4 w-4 mb-0.5 ${angleMeasureMode ? "text-primary" : "text-gray-700"}`} strokeWidth={1.5} />
            <span className={`text-[10px] font-medium ${angleMeasureMode ? "text-primary" : "text-gray-700"}`}>각도측정</span>
          </button>
        </div>
      </div>

      {/* 줌 컨트롤 */}
      <div className="absolute bottom-12 right-3 z-[1000] flex flex-col gap-1">
        <div className="flex flex-col overflow-hidden rounded-md bg-white shadow-md">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-none p-0 text-[#1a1a1a] hover:bg-gray-100 [&_svg]:text-[#1a1a1a]"
            onClick={handleZoomIn}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <div className="border-t border-gray-200 px-1 py-1 text-center text-base font-medium text-[#1a1a1a]">
            {currentZoom}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-none border-t border-gray-200 p-0 text-[#1a1a1a] hover:bg-gray-100 [&_svg]:text-[#1a1a1a]"
            onClick={handleZoomOut}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* 현재 위치 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 bg-white p-0 text-[#1a1a1a] shadow-md hover:bg-gray-50 [&_svg]:text-[#1a1a1a]"
          onClick={handleLocate}
        >
          <Locate className="h-4 w-4" />
        </Button>
      </div>

      {/* 거리 측정 결과 패널 */}
      {measureMode && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] rounded-lg bg-white shadow-lg border border-gray-200 overflow-hidden">
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
                      ? `${(totalDistance / 1000).toFixed(1)}km` 
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
                클릭으로 포인트 추가 | 버튼으로 측정 종료
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

      {/* 축척 표시 */}
      <div className="absolute bottom-3 left-3 z-[1000] rounded bg-white/90 px-2 py-1 text-base text-gray-600 shadow">
        축척: 1:{Math.round(591657550.5 / Math.pow(2, currentZoom))}
      </div>

      {/* 저작권 표시 */}
      <div className="absolute bottom-3 right-3 z-[1000] rounded bg-white/90 px-2 py-1 text-base text-gray-500">
        © VWorld, OpenStreetMap
      </div>
    </div>
  );
}
