"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { ApplicationList } from "@/components/admin/application-list";
import { ApplicationDetail } from "@/components/admin/application-detail";
import { BatchAnalysis } from "@/components/admin/batch-analysis";
import { ParcelDetailReview } from "@/components/admin/parcel-detail-review";
import { ReviewDocumentView } from "@/components/admin/review-document-view";
import { LoginScreen } from "@/components/admin/login-screen";
import { WorkTabBar, type WorkTab } from "@/components/admin/work-tab-bar";
import type { Application, ProcessedParcel } from "@/lib/types";
import { dummyApplications, dummyProcessedParcels } from "@/lib/dummy-data";
import { FileText, MapPin, LogOut, Settings, Plus, Trash2, Eye, EyeOff, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// 사이드바 기본 메뉴 (베이스 목록/대시보드)
type BaseTab = "applications" | "parcel-management";

// 사업단 타입 정의
type ProjectUnit = "gangjin-gwangju" | "gyeongnam";

// 사업단 옵션 목록
const PROJECT_UNIT_OPTIONS: { value: ProjectUnit; label: string; dataFilter: string }[] = [
  { value: "gangjin-gwangju", label: "강진광주건설사업단", dataFilter: "강진광주" },
  { value: "gyeongnam", label: "경남권건설사업단", dataFilter: "경남권" },
];

function AdminPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [applications, setApplications] = useState<Application[]>(dummyApplications);
  const [processedParcels, setProcessedParcels] = useState<ProcessedParcel[]>(dummyProcessedParcels);
  const [projectUnitFilter, setProjectUnitFilter] = useState<ProjectUnit>(PROJECT_UNIT_OPTIONS[0].value);
  // 사업단 변경 확인 대기 값 (모달 확인 시 적용)
  const [pendingProjectUnit, setPendingProjectUnit] = useState<ProjectUnit | null>(null);

  // 사이드바 기본 메뉴 (베이스 화면)
  const [baseTab, setBaseTab] = useState<BaseTab>("applications");

  // 동적 상세 탭 (고정 대시보드 탭 없음 - 상세 화면만 탭으로 열림)
  const [detailTabs, setDetailTabs] = useState<WorkTab[]>([]);
  // 활성 상세 탭 id (null이면 사이드바 베이스 목록/대시보드 표시)
  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);

  // 이탈 방지 상태
  const [isDetailDirty, setIsDetailDirty] = useState(false);
  const [showExitAlert, setShowExitAlert] = useState(false);
  const pendingNavRef = useRef<(() => void) | null>(null);

  // 사업단 관리 모달
  const [showBusinessUnitModal, setShowBusinessUnitModal] = useState(false);
  type BusinessUnitItem = { id: string; label: string; dataFilter: string; hidden: boolean };
  const [businessUnits, setBusinessUnits] = useState<BusinessUnitItem[]>([
    { id: "gangjin-gwangju", label: "강진광주건설사업단", dataFilter: "강진광주", hidden: false },
    { id: "gyeongnam", label: "경남권건설사업단", dataFilter: "경남권", hidden: false },
  ]);
  const [newUnitLabel, setNewUnitLabel] = useState("");
  const [newUnitFilter, setNewUnitFilter] = useState("");

  // 관리자 설정 모달
  const [showAdminModal, setShowAdminModal] = useState(false);
  type AdminRole = "마스터" | "관리자";
  type AdminItem = { id: string; employeeId: string; name: string; department: string; phone: string; email: string; role: AdminRole };
  // 사번 자동완성용 더미 직원 DB
  const EMPLOYEE_DB: Record<string, { name: string; department: string; phone: string; email: string }> = {
    "2019-0234": { name: "김민준", department: "토지보상부", phone: "010-1234-5678", email: "mj.kim@lx.or.kr" },
    "2021-0891": { name: "이수진", department: "강진광주사업단", phone: "010-2345-6789", email: "sj.lee@lx.or.kr" },
    "2022-1102": { name: "박지훈", department: "경남권사업단", phone: "010-3456-7890", email: "jh.park@lx.or.kr" },
    "2020-0567": { name: "최다연", department: "용지기획팀", phone: "010-4567-8901", email: "dy.choi@lx.or.kr" },
    "2023-0318": { name: "정우성", department: "보상지원팀", phone: "010-5678-9012", email: "ws.jung@lx.or.kr" },
  };
  const [admins, setAdmins] = useState<AdminItem[]>([
    { id: "admin-1", employeeId: "2019-0234", name: "김민준", department: "토지보상부", phone: "010-1234-5678", email: "mj.kim@lx.or.kr", role: "마스터" },
    { id: "admin-2", employeeId: "2021-0891", name: "이수진", department: "강진광주사업단", phone: "010-2345-6789", email: "sj.lee@lx.or.kr", role: "관리자" },
    { id: "admin-3", employeeId: "2022-1102", name: "박지훈", department: "경남권사업단", phone: "010-3456-7890", email: "jh.park@lx.or.kr", role: "관리자" },
  ]);
  const [newAdminEmployeeId, setNewAdminEmployeeId] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminDept, setNewAdminDept] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>("관리자");
  const [adminToDelete, setAdminToDelete] = useState<AdminItem | null>(null);
  const [employeeLookupStatus, setEmployeeLookupStatus] = useState<null | "found" | "not-found">(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const resetNewAdminForm = () => {
    setNewAdminEmployeeId("");
    setNewAdminName("");
    setNewAdminDept("");
    setNewAdminPhone("");
    setNewAdminEmail("");
    setNewAdminRole("관리자");
    setEmployeeLookupStatus(null);
  };

  const handleEmployeeIdInput = (value: string) => {
    setNewAdminEmployeeId(value);
    // 사번이 바뀌면 이전 조회 결과 초기화
    setEmployeeLookupStatus(null);
    setNewAdminName("");
    setNewAdminDept("");
    setNewAdminPhone("");
    setNewAdminEmail("");
  };

  const handleEmployeeLookup = () => {
    const key = newAdminEmployeeId.trim();
    if (!key) return;
    setIsLookingUp(true);
    // 실제 API 호출을 시뮬레이션하는 짧은 딜레이
    setTimeout(() => {
      const found = EMPLOYEE_DB[key];
      if (found) {
        setNewAdminName(found.name);
        setNewAdminDept(found.department);
        setNewAdminPhone(found.phone);
        setNewAdminEmail(found.email);
        setEmployeeLookupStatus("found");
      } else {
        setEmployeeLookupStatus("not-found");
      }
      setIsLookingUp(false);
    }, 400);
  };

  // dirty 상태일 때 이동 요청 → 알럿 표시, 아니면 즉시 이동
  const requestNav = (action: () => void) => {
    if (isDetailDirty) {
      pendingNavRef.current = action;
      setShowExitAlert(true);
    } else {
      action();
    }
  };

  // 심의서에서 돌아오는 경우 해당 신청 탭 자동 오픈 (searchParams 변경 시마다 실행)
  useEffect(() => {
    const appId = searchParams.get("appId");
    if (!appId) return;
    const app = applications.find(a => a.id === appId) || dummyApplications.find(a => a.id === appId);
    if (!app) return;
    const tabId = `app-${appId}`;
    setDetailTabs(prev =>
      prev.some(t => t.id === tabId)
        ? prev
        : [...prev, { id: tabId, type: "application-detail", label: `${app.applicationNumber} (${app.applicantName})`, refId: appId, closable: true }]
    );
    setActiveDetailId(tabId);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // 선택된 사업단에 따라 데이터 필터링
  const currentProjectUnit = PROJECT_UNIT_OPTIONS.find(opt => opt.value === projectUnitFilter);
  const dataFilter = currentProjectUnit?.dataFilter || "";

  // 필터링된 신청 데이터
  const filteredApplications = dataFilter
    ? applications.filter(app =>
        app.businessUnit?.includes(dataFilter) ||
        app.landInfo.businessUnit?.includes(dataFilter) ||
        app.additionalLands?.some(land => land.businessUnit?.includes(dataFilter))
      )
    : applications;

  // 필터링된 필지 데이터
  const filteredParcels = dataFilter
    ? processedParcels.filter(parcel => parcel.businessUnit?.includes(dataFilter))
    : processedParcels;

  // 현재 활성 상세 탭 및 라이브 데이터 조회
  const activeDetailTab = detailTabs.find(t => t.id === activeDetailId) || null;
  const activeApplication =
    activeDetailTab?.type === "application-detail"
      ? applications.find(a => a.id === activeDetailTab.refId) || null
      : null;
  const activeParcel =
    activeDetailTab?.type === "parcel-detail"
      ? processedParcels.find(p => p.id === activeDetailTab.refId) || null
      : null;
  const activeReviewId =
    activeDetailTab?.type === "review-document" ? activeDetailTab.refId : null;

  // 신청 상세 탭 열기
  const openApplicationTab = (application: Application) => {
    const id = `app-${application.id}`;
    setDetailTabs((prev) =>
      prev.some((t) => t.id === id)
        ? prev
        : [
            ...prev,
            {
              id,
              type: "application-detail",
              label: `${application.applicationNumber} (${application.applicantName})`,
              refId: application.id,
              closable: true,
            },
          ]
    );
    setActiveDetailId(id);
  };

  // 필지 상세 탭 열기
  const openParcelTab = (parcel: ProcessedParcel) => {
    const id = `parcel-${parcel.id}`;
    setDetailTabs((prev) =>
      prev.some((t) => t.id === id)
        ? prev
        : [
            ...prev,
            {
              id,
              type: "parcel-detail",
              label: parcel.landInfo.address,
              refId: parcel.id,
              closable: true,
            },
          ]
    );
    setActiveDetailId(id);
  };

  // 심의서 탭 열기
  const openReviewTab = (application: Application) => {
    const id = `review-${application.id}`;
    setDetailTabs((prev) =>
      prev.some((t) => t.id === id)
        ? prev
        : [...prev, { id, type: "review-document", label: `심의서 - ${application.applicationNumber}`, refId: application.id, closable: true }]
    );
    setActiveDetailId(id);
  };

  // 탭 닫기
  const handleTabClose = (id: string) => {
    const doClose = () => {
      setIsDetailDirty(false);
      setDetailTabs((prev) => prev.filter((t) => t.id !== id));
      setActiveDetailId((curr) => (curr === id ? null : curr));
    };
    if (id === activeDetailId) {
      requestNav(doClose);
    } else {
      doClose();
    }
  };

  // 탭 순서 변경 (드래그 앤 드롭) - fromId를 toId 위치로 이동
  const handleTabReorder = (fromId: string, toId: string) => {
    setDetailTabs((prev) => {
      const fromIndex = prev.findIndex((t) => t.id === fromId);
      const toIndex = prev.findIndex((t) => t.id === toId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  // 사이드바 메뉴 클릭 시 베이스 화면으로 전환 (상세 탭은 유지)
  const goToBase = (tab: BaseTab) => {
    requestNav(() => {
      setIsDetailDirty(false);
      setBaseTab(tab);
      setActiveDetailId(null);
    });
  };

  // 사업단 변경 요청 - 동일 값이면 무시, 다르면 확인 모달 표시
  const requestProjectUnitChange = (value: ProjectUnit) => {
    if (value === projectUnitFilter) return;
    setPendingProjectUnit(value);
  };

  // 사업단 변경 확정: 기존 탭 배열 초기화 → 새 사업단 적용(데이터 전환) → 신청관리 홈 활성화
  const confirmProjectUnitChange = () => {
    if (!pendingProjectUnit) return;
    // 1. 기존 열린 상세 탭 전체 초기화
    setDetailTabs([]);
    setActiveDetailId(null);
    // 2. 새 사업단 데이터로 전환
    setProjectUnitFilter(pendingProjectUnit);
    // 3. 신청관리 홈(기본 화면) 활성화
    setBaseTab("applications");
    // 모달 닫기
    setPendingProjectUnit(null);
  };

  // 사업단 변경 취소
  const cancelProjectUnitChange = () => {
    setPendingProjectUnit(null);
  };

  // 모달에 표시할 대상 사업단 라벨
  const pendingProjectUnitLabel = PROJECT_UNIT_OPTIONS.find((o) => o.value === pendingProjectUnit)?.label ?? "";

  const handleSave = (updatedApplication: Application) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === updatedApplication.id ? updatedApplication : app
      )
    );

    // localStorage에 업데이트된 application 저장 (심의서 페이지와 연동)
    try {
      const savedApplications = JSON.parse(localStorage.getItem('updatedApplications') || '{}');
      savedApplications[updatedApplication.id] = updatedApplication;
      localStorage.setItem('updatedApplications', JSON.stringify(savedApplications));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  };

  const handleParcelUpdate = (updatedParcel: ProcessedParcel) => {
    setProcessedParcels((prev) =>
      prev.map((p) => (p.id === updatedParcel.id ? updatedParcel : p))
    );
  };

  // 로그인/로그아웃 핸들러
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    // 로그아웃 시 상태 초기화
    setDetailTabs([]);
    setActiveDetailId(null);
    setBaseTab("applications");
  };

  // 로그인 화면 표시
  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // 필지상세에서 신청상세로 이동
  const handleNavigateToApplication = (applicationId: string) => {
    const application = applications.find(app => app.id === applicationId);
    if (application) {
      openApplicationTab(application);
    }
  };

  // 현재 탭 닫고 베이스 화면 전환
  const closeTabAndGoToBase = (tab: BaseTab) => {
    setIsDetailDirty(false);
    setDetailTabs((prev) => prev.filter((t) => t.id !== activeDetailId));
    setActiveDetailId(null);
    setBaseTab(tab);
  };

  // 신청 목록(베이스)으로 이동
  const handleNavigateToApplicationList = () => {
    closeTabAndGoToBase("applications");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 왼쪽 SNB (Side Navigation Bar) - sticky, 100vh, 화이트 배경 */}
      <aside className="w-60 shrink-0 bg-white flex flex-col sticky top-0 h-screen z-50 border-r border-gray-200">
        {/* 1단 - 시스템 로고 */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => goToBase("applications")}
            className="focus:outline-none"
          >
            <Image
              src="/images/logo-lc.png"
              alt="한국도로공사 토지정보"
              width={180}
              height={40}
              className="h-auto cursor-pointer"
            />
          </button>
        </div>

        {/* 2단 - 전역 사업단 셀렉트 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-500">사업단</label>
            <button
              onClick={() => setShowBusinessUnitModal(true)}
              className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="사업단 관리"
            >
              <Settings className="h-[18px] w-[18px]" />
            </button>
          </div>
          <Select value={projectUnitFilter} onValueChange={(value) => requestProjectUnitChange(value as ProjectUnit)}>
            <SelectTrigger className="w-full h-[42px] bg-gray-50 border-gray-300 text-gray-900 font-medium hover:bg-gray-100 focus:ring-[#00875a]">
              <SelectValue placeholder="사업단 선택" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              {businessUnits.filter((u) => !u.hidden).map((option) => (
                <SelectItem
                  key={option.id}
                  value={option.id}
                  className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 3단 - 메인 메뉴 */}
        <div className="flex-1 py-4">
          <h2 className="mb-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
            메뉴
          </h2>
          <nav className="space-y-1">
            {/* 신청관리 메뉴 */}
            <button
              onClick={() => goToBase("applications")}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2.5 text-[17px] font-medium transition-colors",
                !activeDetailTab && baseTab === "applications"
                  ? "bg-[#00875a] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <FileText className="h-5 w-5" />
              <span>신청관리</span>
            </button>

            {/* 필지관리 메뉴 */}
            <button
              onClick={() => goToBase("parcel-management")}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2.5 text-[17px] font-medium transition-colors",
                !activeDetailTab && baseTab === "parcel-management"
                  ? "bg-[#00875a] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <MapPin className="h-5 w-5" />
              <span>필지관리</span>
            </button>
          </nav>
        </div>

        {/* 4단 - 계정 정보 및 로그아웃 (하단 고정) */}
        <div className="mt-auto p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            {/* 프로필 이미지 */}
            <img
              src="/images/profileImg.jpg"
              alt="프로필"
              className="w-9 h-9 rounded-full shrink-0 object-cover border border-gray-200"
            />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[16px] font-medium text-gray-900 truncate">{user?.name || "담당자"}</span>
              <span className="text-xs text-gray-500">관리자</span>
            </div>
            <button
              onClick={() => setShowAdminModal(true)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors shrink-0"
              title="관리자 설정"
            >
              <Settings className="h-[18px] w-[18px]" />
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[16px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* 오른쪽 콘텐츠 영역 */}
      <main className="flex-1 p-6 overflow-auto h-screen" style={{ backgroundColor: '#f3f6f9' }}>
        {/* 동적 상세 탭 바 (열린 상세가 있을 때만 노출, 고정 대시보드 탭 없음) */}
        {detailTabs.length > 0 && (
          <div className="sticky -top-6 z-[9999] -mx-6 -mt-6 mb-6 bg-[rgb(243,246,249)]">
            <WorkTabBar
              tabs={detailTabs}
              activeTabId={activeDetailId ?? ""}
              onTabSelect={(id) => requestNav(() => { setIsDetailDirty(false); setActiveDetailId(id); })}
              onTabClose={handleTabClose}
              onTabReorder={handleTabReorder}
            />
          </div>
        )}

        {/* 신청 상세 탭 */}
        {activeDetailTab && activeApplication && (
          <div>
            <ApplicationDetail
              application={activeApplication}
              onBack={() => setActiveDetailId(null)}
              onSave={handleSave}
              onNavigateToList={handleNavigateToApplicationList}
              onDirtyChange={setIsDetailDirty}
              onOpenReview={openReviewTab}
            />
            {/* 콘텐츠 하단 - 버튼 영역 (목록, 취소, 저장) */}
            <div className="flex items-center justify-between mt-6 pb-6">
              {/* 좌측 - 목록보기 버튼 */}
              <Button
                variant="outline"
                onClick={() => requestNav(() => closeTabAndGoToBase("applications"))}
                className="w-[80px] text-foreground border-foreground hover:bg-foreground/5"
              >
                목록
              </Button>

              {/* 중앙 - 취소/저장 버튼 (심사완료가 아닐 때만 표시) */}
              {activeApplication.adminStatus !== "심사완료" && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="w-[80px] text-foreground border-foreground hover:bg-foreground/5"
                    onClick={() => setActiveDetailId(null)}
                  >
                    취소
                  </Button>
                  <Button className="w-[80px]" onClick={() => window.dispatchEvent(new CustomEvent('application-detail-save'))}>
                    저장
                  </Button>
                </div>
              )}

              {/* 우측 공백 (레이아웃 균형용) */}
              <div className="w-[80px]" />
            </div>
          </div>
        )}

        {/* 필지 상세 탭 */}
        {activeDetailTab && activeParcel && (
          <ParcelDetailReview
            parcel={activeParcel}
            onBack={() => closeTabAndGoToBase("parcel-management")}
            onUpdate={handleParcelUpdate}
            onNavigateToApplication={handleNavigateToApplication}
          />
        )}

        {/* 심의서 탭 */}
        {activeReviewId && (
          <ReviewDocumentView applicationId={activeReviewId} />
        )}

        {/* 베이스: 신청관리 목록 */}
        {!activeDetailTab && baseTab === "applications" && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">신청관리</h1>
            </div>
            <ApplicationList
              applications={filteredApplications}
              onSelect={openApplicationTab}
            />
          </>
        )}

        {/* 베이스: 필지관리 대시보드 */}
        {!activeDetailTab && baseTab === "parcel-management" && (
          <BatchAnalysis
            parcels={filteredParcels}
            onParcelsUpdate={setProcessedParcels}
            onParcelSelect={openParcelTab}
          />
        )}
      </main>

      {/* 사업단 관리 모달 */}
      <Dialog open={showBusinessUnitModal} onOpenChange={setShowBusinessUnitModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">사업단 관리</DialogTitle>
            <DialogDescription>사업단을 추가하거나 목록에서 숨길 수 있습니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-10">
            {/* 사업단 목록 */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                사업단 목록
              </Label>
              <div className="space-y-2">
                {businessUnits.map((unit) => (
                  <div
                    key={unit.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-background transition-opacity",
                      unit.hidden ? "border-gray-200 opacity-50" : "border-gray-200"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-base font-medium truncate", unit.hidden ? "text-muted-foreground line-through" : "text-gray-900")}>
                        {unit.label}
                      </p>
                    </div>
                    <button
                      onClick={() => setBusinessUnits((prev) => prev.map((u) => (u.id === unit.id ? { ...u, hidden: !u.hidden } : u)))}
                      className="p-1.5 rounded text-muted-foreground hover:text-gray-700 hover:bg-muted transition-colors"
                      title={unit.hidden ? "표시" : "숨김"}
                    >
                      {unit.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 사업단 추가 */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                사업단 추가
              </Label>
              <div className="space-y-3">
                <Input
                  value={newUnitLabel}
                  onChange={(e) => setNewUnitLabel(e.target.value)}
                  placeholder="사업단명 (예: 호남권건설사업단)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newUnitLabel.trim()) {
                      const id = `unit-${Date.now()}`;
                      setBusinessUnits((prev) => [...prev, { id, label: newUnitLabel.trim(), dataFilter: newUnitLabel.trim(), hidden: false }]);
                      setNewUnitLabel("");
                    }
                  }}
                />
                <Button
                  disabled={!newUnitLabel.trim()}
                  onClick={() => {
                    if (!newUnitLabel.trim()) return;
                    const id = `unit-${Date.now()}`;
                    setBusinessUnits((prev) => [...prev, { id, label: newUnitLabel.trim(), dataFilter: newUnitLabel.trim(), hidden: false }]);
                    setNewUnitLabel("");
                  }}
                  className="w-full gap-2 bg-[#00875a] hover:bg-[#00734d] text-white"
                >
                  <Plus className="h-4 w-4" />
                  사업단 추가
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 관리자 설정 모달 */}
      <Dialog open={showAdminModal} onOpenChange={setShowAdminModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">관리자 설정</DialogTitle>
            <DialogDescription>관리자를 추가하거나 권한을 설정할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-10">
            {/* 관리자 목록 */}
            <div className="space-y-6">
              <Label className="text-base font-semibold">
                관리자 목록
              </Label>
              <div className="space-y-2">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-background">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-medium text-gray-900">{admin.name}</p>
                        <span className="text-sm text-muted-foreground">{admin.employeeId}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{admin.department} · {admin.phone}</p>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                      <button
                        onClick={() => setAdmins((prev) => prev.map((a) => (a.id === admin.id ? { ...a, role: "마스터" } : a)))}
                        className={cn("px-2.5 py-1 rounded text-sm font-medium transition-colors", admin.role === "마스터" ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                      >마스터</button>
                      <button
                        onClick={() => setAdmins((prev) => prev.map((a) => (a.id === admin.id ? { ...a, role: "관리자" } : a)))}
                        className={cn("px-2.5 py-1 rounded text-sm font-medium transition-colors", admin.role === "관리자" ? "bg-gray-900 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                      >관리자</button>
                    </div>
                    <button
                      onClick={() => setAdminToDelete(admin)}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 mt-0.5"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 관리자 추가 */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                관리자 추가
              </Label>
              <div className="space-y-3">
                {/* 사번 + 조회 */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground font-normal">사번</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newAdminEmployeeId}
                      onChange={(e) => handleEmployeeIdInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleEmployeeLookup(); }}
                      placeholder="예: 2019-0234"
                      className={cn(
                        employeeLookupStatus === "found" ? "border-emerald-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-200/50" :
                        employeeLookupStatus === "not-found" ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20" : ""
                      )}
                    />
                    <Button
                      variant="outline"
                      onClick={handleEmployeeLookup}
                      disabled={!newAdminEmployeeId.trim() || isLookingUp}
                      className="shrink-0 gap-1.5"
                    >
                      {isLookingUp
                        ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                        : <Search className="h-4 w-4" />
                      }
                      조회
                    </Button>
                  </div>
                  {employeeLookupStatus === "found" && (
                    <p className="flex items-center gap-1.5 text-sm text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      직원 정보를 불러왔습니다. 내용을 확인해 주세요.
                    </p>
                  )}
                  {employeeLookupStatus === "not-found" && (
                    <p className="flex items-center gap-1.5 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      일치하는 사번이 없습니다. 다시 확인해 주세요.
                    </p>
                  )}
                </div>

                {/* 자동완성 필드 — 조회 성공 시 표시 */}
                {employeeLookupStatus === "found" && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground font-normal">이름</Label>
                      <Input value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} className="border-emerald-300 bg-emerald-50/40" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground font-normal">소속 부서/팀</Label>
                      <Input value={newAdminDept} onChange={(e) => setNewAdminDept(e.target.value)} className="border-emerald-300 bg-emerald-50/40" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm text-muted-foreground font-normal">연락처</Label>
                        <Input value={newAdminPhone} onChange={(e) => setNewAdminPhone(e.target.value)} className="border-emerald-300 bg-emerald-50/40" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm text-muted-foreground font-normal">이메일 주소</Label>
                        <Input value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} className="border-emerald-300 bg-emerald-50/40" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground font-normal">권한 등급</Label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setNewAdminRole("마스터")}
                          className={cn("flex-1 h-[40px] rounded-md text-base font-medium border transition-colors", newAdminRole === "마스터" ? "bg-blue-600 text-white border-blue-600" : "bg-background text-muted-foreground border-gray-200 hover:bg-muted/50")}
                        >마스터</button>
                        <button
                          onClick={() => setNewAdminRole("관리자")}
                          className={cn("flex-1 h-[40px] rounded-md text-base font-medium border transition-colors", newAdminRole === "관리자" ? "bg-gray-900 text-white border-gray-900" : "bg-background text-muted-foreground border-gray-200 hover:bg-muted/50")}
                        >관리자</button>
                      </div>
                    </div>
                  </>
                )}

                <Button
                  disabled={employeeLookupStatus !== "found" || !newAdminName.trim()}
                  onClick={() => {
                    if (employeeLookupStatus !== "found" || !newAdminName.trim()) return;
                    const id = `admin-${Date.now()}`;
                    setAdmins((prev) => [...prev, { id, employeeId: newAdminEmployeeId.trim(), name: newAdminName.trim(), department: newAdminDept.trim(), phone: newAdminPhone.trim(), email: newAdminEmail.trim(), role: newAdminRole }]);
                    resetNewAdminForm();
                  }}
                  className="w-full gap-2 bg-[#00875a] hover:bg-[#00734d] text-white"
                >
                  <Plus className="h-4 w-4" />
                  관리자 추가
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 관리자 삭제 확인 */}
      <AlertDialog open={adminToDelete !== null} onOpenChange={(open) => { if (!open) setAdminToDelete(null); }}>
        <AlertDialogContent className="max-w-sm bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">관리자를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              <span className="font-semibold text-gray-800">{adminToDelete?.name}</span>({adminToDelete?.role}) 계정 삭제후 복구 불가 합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAdminToDelete(null)} className="border-gray-300 text-gray-700 hover:bg-gray-100">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setAdmins((prev) => prev.filter((a) => a.id !== adminToDelete!.id));
                setAdminToDelete(null);
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 사업단 변경 확인 모달 - 확인 시 탭 전체 리셋 후 신청관리 홈으로 전환 */}
      <AlertDialog
        open={pendingProjectUnit !== null}
        onOpenChange={(open) => {
          if (!open) cancelProjectUnitChange();
        }}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">사업단를 변경하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500" asChild>
              <div>
                <span className="font-semibold text-[#00875a]">{pendingProjectUnitLabel}</span>(으)로 전환하면 현재 열려 있는 모든 상세 검토 탭이 닫히고,
                <br />
                해당 사업단의 신청관리 홈 화면으로 이동합니다.
                <br />
                저장하지 않은 작업 내용은 사라질 수 있습니다.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={cancelProjectUnitChange}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmProjectUnitChange}
              className="bg-[#00875a] text-white hover:bg-[#00734d]"
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 이탈 방지 알럿 */}
      <AlertDialog open={showExitAlert} onOpenChange={setShowExitAlert}>
        <AlertDialogContent className="max-w-sm rounded-xl border-0 shadow-2xl">
          <AlertDialogHeader className="gap-2">
            <AlertDialogTitle className="text-base font-semibold text-gray-900">
              변경사항 저장 안 됨
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[16px] text-gray-500 leading-relaxed whitespace-pre-line">
              {`작성 중인 변경사항이 저장되지 않았습니다.\n이대로 다른 페이지로 이동하시겠습니까?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel
              onClick={() => {
                pendingNavRef.current = null;
                setShowExitAlert(false);
              }}
              className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowExitAlert(false);
                setIsDetailDirty(false);
                pendingNavRef.current?.();
                pendingNavRef.current = null;
              }}
              className="flex-1 bg-[#00875a] text-white hover:bg-[#00734d]"
            >
              이동
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminPageContent />
    </Suspense>
  );
}
