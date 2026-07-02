// 토지 유형
export type LandType = "택지" | "농지" | "산지" | "그밖의토지" | "대지";

// 토지 형상
export type LandShape =
  | "정방형"
  | "장방형"
  | "가로장방형"
  | "세로장방형"
  | "세장형"
  | "변형사다리형"
  | "역사다리형"
  | "사다리형"
  | "사다리꼴"
  | "삼각형"
  | "역삼각형"
  | "부정형"
  | "자루형";

// 지목 (실제 이용 상황)
export type LandCategory =
  | "과"
  | "구"
  | "광"
  | "공"
  | "답"
  | "대"
  | "도"
  | "목"
  | "묘"
  | "양"
  | "염"
  | "임"
  | "잡"
  | "장"
  | "전"
  | "제"
  | "주유소"
  | "창"
  | "천";

// 신청 유형 (민원 분류)
export type ApplicationType = 
  | "single"      // 단일 필지 신청
  | "multiple";   // 복수 필지 개별 신청 (각 필지 개별 분석)

// 처리 상태
export type ProcessStatus = "접수완료" | "AI분석완료" | "검토중" | "처리완료";

// 담당자 진행상황
export type AdminStatus =
  | "접수완료"
  | "담당자검토중"
  | "담당자검토완료"
  | "심의위원회회부"
  | "심의위원회검토중"
  | "심의위원회검토완료"
  | "심사완료";

// AI 1차 판독 결과
// 관리자: 수용가능/수용불가, 시민: 보상 가능성 높음/보상 가능성 낮음
export type AIJudgmentResult = "수용가능" | "수용불가" | "보상 가능성 높음" | "보상 가능성 낮음" | "적용가능" | "보상 불가";

// 최종 판정 결과 (보상/기각/심의위원회 이관)
export type FinalJudgmentResult = "보상" | "기각" | "심의위원회 이관";

// 판정 결과 (하위 호환용)
export type JudgmentResult = FinalJudgmentResult;

// 관할기관 타입
export type BusinessUnit = 
  // 수도권
  | "김포파주" 
  | "수도권" 
  | "양평이천"
  | "고양의정부"
  | "남양주구리"
  | "화성평택"
  // 강원권
  | "춘천원주"
  | "강릉속초"
  | "원주영월"
  // 충청권
  | "천안안성" 
  | "세종천안" 
  | "서산아산"
  | "청주충주"
  | "대전세종"
  | "홍성예산"
  // 전라권
  | "새만금전주" 
  | "강진광주"
  | "목포순천"
  | "여수광양"
  | "익산군산"
  | "남원정읍"
  // 경상권
  | "포항영덕" 
  | "함양합천" 
  | "합천창녕"
  | "대구경산"
  | "부산울산"
  | "창원김해"
  | "진주통영"
  | "안동영주"
  | "구미김천"
  // 제주권
  | "제주서귀포"
  // 건설사업단 전체명 (하위 호환)
  | "수도권건설사업단" | "천안안성건설사업단" | "강진광주건설사업단"
  | "강진광주건설 사업단";

// 토지 정보
export interface LandInfo {
  id: string;
  address: string; // 지번
  originalArea: number; // 편입 전 면적 (㎡)
  includedArea: number; // 편입 면적 (㎡)
  remainingArea: number; // 잔여 면적 (㎡)
  remainingRatio: number; // 잔여 비율 (%)
  landType: LandType; // 토지 유형
  landCategory: LandCategory; // 지목
  originalShape: LandShape; // 편입 전 형상
  remainingShape: LandShape; // 잔여지 형상
  originalShapeIndex: number; // 편입 전 형상지수
  remainingShapeIndex: number; // 잔여지 형상지수
  ownerName: string; // 소유자명
  ownerContact?: string; // 소유자 연락처
  ownerType?: string; // 소유자 구분
  hasIncludedLand: boolean; // 편입토지 존재 여부
  officialLandPrice?: number; // 개별공시지가 (원/m²)
  officialLandPriceYear?: number; // 공시기준연도
  coordinates?: Array<{ lat: number; lng: number }>; // 필지 경계 좌표
  businessUnit?: BusinessUnit; // 관할기관
  projectName?: string; // 사업명
  // 민원인 입력 데이터 (LandSpecificData 미러, 선택적)
  currentUsage?: LandCategory;
  landSubType?: "" | "residential-detached" | "residential-multi" | "residential-apartment" | "commercial" | "industrial";
  reportedShape?: LandShape;
  accessRoadLost?: boolean;
  waterChannelLost?: boolean;
  farmMachineDifficulty?: boolean;
  incorporatedArea?: number; // includedArea 별칭
}

// 일단지 판정 조건
export interface UnifiedParcelCondition {
  sameOwner: boolean; // 소유자 동일성
  continuous: boolean; // 지반 연속성
  sameUsage: boolean; // 용도 일체성
  isUnifiedParcel: boolean; // 일단지 여부
}

// 토지별 민원인 입력 데이터
export interface LandSpecificData {
  currentUsage: LandCategory; // 현재 활용 지목
  landSubType: "" | "residential-detached" | "residential-multi" | "residential-apartment" | "commercial" | "industrial"; // 택지 세부 유형
  actualUsage: LandCategory; // 공부상 지목
  reportedShape: LandShape; // 토지 모양
  farmMachineDifficulty: boolean; // 농기계 회전 곤란
  accessRoadLost: boolean; // 접면도로 상실
  waterChannelLost: boolean; // 관개수로 상실
}

// 민원 신청
export interface Application {
  id: string;
  applicationNumber: string; // 접수번호
  applicationType: ApplicationType; // 신청 유형 (단일/복수개별/일단지)
  applicantRelation?: "owner" | "agent"; // 신청인 구분 (본인/대리인)
  applicantName: string; // 신청인명
  applicantContact: string; // 연락처
  applicantAddress: string; // 주소
  agentName?: string; // 대리인 성명
  agentContact?: string; // 대리인 연락처
  landInfo: LandInfo;
  additionalLands?: LandInfo[]; // 동일 소유자 복수 필지
  unifiedParcelCondition?: UnifiedParcelCondition; // 일단지 판정 조건
  actualUsage: LandCategory; // 실제 이용 상황
  reportedShape: LandShape; // 신청인 입력 토지 모양
  farmMachineDifficulty?: boolean; // 농기계 회전 곤란
  hasAdjacentLand?: boolean; // 잔여지 인접한 토지 소유 여부
  reason: string; // 신청 사유
  attachments: string[]; // 첨부 서류
  status: ProcessStatus;
  adminStatus: AdminStatus; // 담당자 진행상황
  appliedAt: string; // 신청일
  aiResult?: AIAnalysisResult; // AI 분석 결과
  landAIResults?: Record<string, AIAnalysisResult>; // 필지별 AI 분석 결과
  applicantEmail?: string; // 신청인 이메일
  finalJudgment?: JudgmentResult; // 최종 판정
  reviewerComment?: string; // 담당자 검토 의견
  finalReviewOpinion?: string; // 최종 검토 의견 (복수 필지용, 심의서 현지상황 및 검토의견에 자동입력)
  citizenAppealChoice?: "중토위" | "한국도로공사" | null; // 심의위원회 기각 후 민원인 선택
  isCommitteeCase?: boolean; // 심의위원회 경유 여부
  adminName?: string; // 담당자명
  statusUpdatedAt?: string; // 상태 변경일
  landDataList?: LandSpecificData[]; // 토지별 민원인 입력 데이터 (복수 필지)
  landJudgmentsForReview?: LandJudgmentForReview[]; // 필지별 판정 결과 (심의서 연동용)
  businessUnit?: BusinessUnit; // 사업단
}

// 심의서 연동용 필지별 판정 결과
export interface LandJudgmentForReview {
  landId: string;
  landIndex: number;
  address: string;
  landType: LandType;
  landCategory: LandCategory;
  originalArea: number;
  remainingArea: number;
  remainingRatio: number;
  judgment: string;
  purchaseDecision: "O" | "X" | "-";
  citizenAppealChoice?: "중토위" | "한국도로공사" | null;
}

// AI 분석 결과
export interface AIAnalysisResult {
  analysisSource?: "auto" | "auto-change" | "manual" | "manual-select"; // 분석 실행 구분 (정기자동/변동감지자동/AI재판독/담당자직접선택)
  landTypePath: LandType; // 판단 경로 (토지 유형)
  criteriaChecks: CriteriaCheck[]; // 기준 충족 여부
  provisionalJudgment: AIJudgmentResult; // AI 1차 판독 결과 (수용가능/수용불가)
  originalShapeIndex: number;
  remainingShapeIndex: number;
  shapeIndexChange: number;
  isBlindLand: boolean; // 맹지 여부
  accessRoadLost: boolean; // 접면도로 상실 (직접확인)
  waterChannelLost: boolean; // 수로 상실 (직접확인)
  farmMachineDifficulty: boolean; // 농기계 회전 곤란 (직접확인)
  judgmentRationale: JudgmentRationale; // 판단 근거 설명
  confidenceScore?: number; // 신뢰도 점수 (0-1)
  unifiedParcelAnalysis?: UnifiedParcelAnalysis; // 일단지 판정 결과
  landJudgments?: LandJudgment[]; // 필지별 판정 결과 (혼합 케이스용)
}

// 필지별 판정 결과 (일부 일단지 + 일부 미해당 혼합 케이스)
export interface LandJudgment {
  landId: string; // 토지 ID
    judgment: "보상" | "기각" | "심의위원회 이관"; // 담당자 판정 결과
  unifiedGroupId: string | null; // 일단지 그룹 ID (null이면 미해당)
  reason: string; // 판정 사유
}

// 일단지 판정 분석 결과
export interface UnifiedParcelAnalysis {
  isUnifiedParcel: boolean; // 일단지 여부
  totalParcels: number; // 총 필지 수
  ownedParcels: number; // 본인 소유 필지 수
  adjacentParcels: number; // 인접지 필지 수
  conditions: {
    sameOwner: boolean; // 소유자 동일성 (본인 체크 기준)
    continuous: boolean; // 지반 연속성 (인접 여부)
    sameUsage: boolean; // 용도 일체성
  };
  combinedArea: number; // 합산 면적
  explanation: string; // 일단지 판정 설명
}

// 판단 근거 설명
export interface JudgmentRationale {
  summary: string; // 판단 요약
  legalBasis: string; // 법적 근거
  appliedCriteria: string[]; // 적용된 기준
  detailedExplanation: string; // 상세 설명
  manualCheckItems?: string[]; // 직접 확인 필요 항목
}

// 기준 충족 여부
export interface CriteriaCheck {
  criteriaName: string; // 기준명
  criteriaDescription: string; // 기준 설명
  isMet: boolean; // 충족 여부
  autoDetected: boolean; // 자동 판독 가능 여부
}

// 신청 목록 아이템 (장바구니)
export interface ApplicationCartItem {
  id: string;
  landInfo: LandInfo;
  aiResult: AIAnalysisResult;
  addedAt: string;
  businessUnit: BusinessUnit; // 관할기관 그룹핑용
}

// 관할기관별 그룹핑된 신청 목록
export interface BusinessUnitGroupedCart {
  businessUnit: BusinessUnit;
  items: ApplicationCartItem[];
}

// 담당자 확인항목 (사전등록용)
export interface AdminCheckItems {
  accessRoadLost: boolean;                    // 접면도로 상실
  waterChannelLost: boolean;                  // 농업용 수로 상실
  farmMachineDifficulty: boolean;             // 농기계 진입 곤란
  farmMachineRotationDifficulty: boolean;     // 농기계 회전 곤란
  livestockBuildingUnusable: boolean;         // 축사 부지 사용불가
  adjacentSameOwnerLand: boolean;             // 인접 동일소유자 토지
}

// 사전등록 필지 (민원인 화면용)
export interface PreRegisteredParcel {
  id: string;
  businessUnit: BusinessUnit;
  projectName: string;
  landInfo: LandInfo;
  adminCheckItems: AdminCheckItems;
  currentUsage: LandCategory;
  landShape: LandShape;
  aiResult: AIAnalysisResult;
  preRegistrationStatus: "등록완료" | "대기중";
  registeredAt: string;
  registeredBy: string;
}

// 심의서 데이터
export interface ReviewDocument {
  applicationId: string;
  landInfo: LandInfo;
  cadastralMapUrl?: string; // 지적도
  aerialPhotoUrl?: string; // 항공사진
  landShape: LandShape; // 토지 모양
  actualUsage: LandCategory; // 실제 이용 상황
  farmMachineDifficulty: "미입력" | "해당" | "해당없음";
  ownerOpinion: string; // 소유자 의견
  reviewerComment: string; // 검토 의견
  signatureArea?: string; // 서명란
  generatedAt: string;
}

// ===== 프로세스 구조 변경 관련 신규 타입 =====

// 분석 단계
export type AnalysisStage = string;

// 필지 공개 상태 (민원인 조회 가능 여부)
export type ParcelPublishStatus = "대기중" | "분석전" | "분석전" | "1차분석완료" | "1차분석완료" | "2차분석중" | "2차분석완료" | "2차분석중" | "2차분석완료" | "담당자확인완료" | "공개";

// 분석 히스토리
export interface AnalysisHistory {
  id: string;
  parcelId: string;                           // 필지 ID
  stage: AnalysisStage;                       // 분석 단계 (1차/2차)
  analyzedAt: string;                         // 분석일시
  analyzedBy: string;                         // 분석 담당자
  previousResult?: AIJudgmentResult;          // 이전 판정 결과
  newResult: AIJudgmentResult;                // 새 판정 결과
  previousShapeIndex?: number;                // 이전 형상지수
  newShapeIndex?: number;                     // 새 형상지수
  changedOptions?: {                          // 변경된 옵션값
    currentUsage?: LandCategory;              // 활용지목
    landShape?: LandShape;                    // 토지형상
    accessRoadLost?: boolean;                 // 접면도로 상실
    waterChannelLost?: boolean;               // 농업용 수로 상실
    farmMachineDifficulty?: boolean;          // 농기계 진입 곤란
    farmMachineRotationDifficulty?: boolean;  // 농기계 회전 곤란
    livestockBuildingUnusable?: boolean;      // 축사 부지 사용불가
    adjacentSameOwnerLand?: boolean;          // 인접 동일소유자 토지
  };
  changeReason?: string;                      // 변경 사유
  memo?: string;                              // 메모
  aiResult: AIAnalysisResult;                 // 전체 AI 분석 결과
}

// 잔여지 판정 상태
export type ResidualStatus = "판정대기" | "잔여지 인정" | "기준 미달";

// 확장된 사전등록 필지 (분석 프로세스용)
export interface ProcessedParcel extends PreRegisteredParcel {
  publishStatus: ParcelPublishStatus;         // 공개 상태
  analysisHistory: AnalysisHistory[];         // 분석 히스토리
  residualStatus?: ResidualStatus;            // 잔여지 판정 상태
  firstAnalyzedAt?: string;                   // 1차 분석 완료일
  lastAnalyzedAt?: string;                    // 최종 분석일
  confirmedAt?: string;                       // 담당자 확인 완료일
  confirmedBy?: string;                       // 확인 담당자
  ownerIdentifier?: string;                   // 소유자 식별자 (주민번호 뒷자리 등)
  isVisible?: boolean;                        // 노출 여부 (true: 노출, false: 미노출)
  reportCompleted?: boolean;                  // 보고서 완료 여부
  reviewStatus?: "완료" | "미완료";            // 검토 여부 (수동 설정)
  finalReviewOpinion?: string;               // 현지상황 및 검토의견 (심의서 자동 연동)
  // 민원인 활동 상태
  citizenActivity?: {
    inCart?: boolean;                         // 장바구니에 담김
    cartAddedAt?: string;                     // 장바구니 담긴 일시
    applicationSubmitted?: boolean;           // 신청 완료됨
    applicationId?: string;                   // 신청 ID
    applicationSubmittedAt?: string;          // 신청 완료 일시
  };
}

// 일괄 분석 요청
export interface BatchAnalysisRequest {
  parcelIds: string[];                        // 분석 대상 필지 IDs
  analysisOptions: {                          // 분석 옵션
    useCurrentUsage: boolean;                 // 현재 활용지목 사용
    useLandShape: boolean;                    // 토지형상 사용
  };
  stage: AnalysisStage;                       // 분석 단계
  analyzedBy: string;                         // 분석 담당자
}

// 일괄 분석 결과
export interface BatchAnalysisResult {
  totalCount: number;                         // 전체 건수
  successCount: number;                       // 성공 건수
  failedCount: number;                        // 실패 건수
  highPossibilityCount: number;               // 보상 가능성 높음 건수
  lowPossibilityCount: number;                // 보상 가능성 낮음 건수
  processedParcels: ProcessedParcel[];        // 처리된 필지 목록
}

// 소유자 인증 정보
export interface OwnerVerification {
  verificationType: "주민번호" | "소재지" | "로그인";
  ownerName: string;                          // 소유자명
  identifier: string;                         // 식별값 (주민번호 뒷자리 또는 소재지)
  verifiedAt: string;                         // 인증일시
  isVerified: boolean;                        // 인증 성공 여부
}
