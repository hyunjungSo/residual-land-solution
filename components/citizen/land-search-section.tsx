"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LeafletMap } from "@/components/leaflet-map";
import { dummyLandInfoList } from "@/lib/dummy-data";
import type { LandInfo, AIAnalysisResult, JudgmentRationale, ApplicationCartItem } from "@/lib/types";
import { Search, MapPin, ChevronRight, ChevronLeft, Bot, CheckCircle2, XCircle, AlertTriangle, Loader2, RotateCcw, Info, Ban, FileText, Scale, ChevronDown, ChevronUp, ClipboardList, Plus, Trash2, X, User, Layers, PlayCircle } from "lucide-react";
import { AIIcon } from "@/components/ui/ai-icon";
import { LandUsageSelect, getLandUsageLabel } from "@/components/common/land-usage-select";
import { JUDGMENT_COLORS } from "@/components/ui/judgment-badge";
import { BuildingTypeSelect } from "@/components/common/building-type-select";

interface LandSearchSectionProps {
  onLandSelect: (land: LandInfo, aiResult: AIAnalysisResult) => void;
  cartItems: ApplicationCartItem[];
  onAddToCart: (land: LandInfo, aiResult: AIAnalysisResult) => void;
  onRemoveFromCart: (itemId: string) => void;
  onSubmitCart: (items: ApplicationCartItem[]) => void;
}
// 행정구역 데이터 (전국 17개 시도)
const regionData = {
  시도: [
    "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시", 
    "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원특별자치도", 
    "충청북도", "충청남도", "전북특별자치도", "전라남도", "경상북도", 
    "경상남도", "제주특별자치도"
  ],
  시군구: {
    "서울특별시": ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
    "부산광역시": ["강서구", "금정구", "기장군", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구"],
    "부산광역시": ["강서구", "금정구", "기장군", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구"],
    "대구광역시": ["남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구"],
    "인천광역시": ["강화군", "계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "옹진군", "중구"],
    "광주광역시": ["광산구", "남구", "동구", "북구", "서구"],
    "대전광역시": ["대덕구", "동구", "서구", "유성구", "중구"],
    "울산광역시": ["남구", "동구", "북구", "울주군", "중구"],
    "세종특별자치시": ["세종시"],
    "경기도": ["가평군", "고양시 덕양구", "고양시 일산동구", "고양시 일산서구", "과천시", "광명시", "광주시", "구리시", "군포시", "김포시", "남양주시", "동두천시", "부천시", "성남시 분당구", "성남시 수정구", "성남시 중원구", "수원시 권선구", "수원시 영통구", "수원시 장안구", "수원시 팔달구", "시흥시", "안산시 단원구", "안산시 상록구", "안성시", "안양시 동안구", "안양시 만안구", "양주시", "양평군", "여주시", "연천군", "오산시", "용인시 기흥구", "용인시 수지구", "용인시 처인구", "의왕시", "의정부시", "이천시", "파주시", "평택시", "포천시", "하남시", "화성시"],
    "강원특별자치도": ["강릉시", "고성군", "동해시", "삼척시", "속초시", "양구군", "양양군", "영월군", "원주시", "인제군", "정선군", "철원군", "춘천시", "태백시", "평창군", "홍천군", "화천군", "횡성군"],
    "충청북도": ["괴산군", "단양군", "보은군", "영동군", "옥천군", "음성군", "제천시", "증평군", "진천군", "청주시 상당구", "청주시 서원구", "청주시 청원구", "청주시 흥덕구", "충주시"],
    "충청남도": ["계룡시", "공주시", "금산군", "논산시", "당진시", "보령시", "부여군", "서산시", "서천군", "아산시", "예산군", "천안시 동남구", "천안시 서북구", "청양군", "태안군", "홍성군"],
    "전북특별자치도": ["고창군", "군산시", "김제시", "남원시", "무주군", "부안군", "순창군", "완주군", "익산시", "임실군", "장수군", "전주시 덕진구", "전주시 완산구", "정읍시", "진안군"],
    "전라남도": ["강진군", "고흥군", "곡성군", "광양시", "구례군", "나주시", "담양군", "목포시", "무안군", "보성군", "순천시", "신안군", "여수시", "영광군", "영암군", "완도군", "장성군", "장흥군", "진도군", "함평군", "해남군", "화순군"],
    "경상북도": ["경산시", "경주시", "고령군", "구미시", "군위군", "김천시", "문경시", "봉화군", "상주시", "성주군", "안동시", "영덕군", "영양군", "영주시", "영천시", "예천군", "울릉군", "울진군", "의성군", "청도군", "청송군", "칠곡군", "포항시 남구", "포항시 북구"],
    "경상남도": ["거제시", "거창군", "고성군", "김해시", "남해군", "밀양시", "사천시", "산청군", "양산시", "의령군", "진주시", "창녕군", "창원시 마산합포구", "창원시 마산회원구", "창원시 성산구", "창원시 의창구", "창원시 진해구", "통영시", "하동군", "함안군", "함양군", "합천군"],
    "제주특별자치도": ["서귀포시", "제주시"],
  },
  읍면동: {
    // 서울특별시
    "강남구": ["개포동", "논현동", "대치동", "도곡동", "삼성동", "세곡동", "수서동", "신사동", "압구정동", "역삼동", "율현동", "일원동", "자곡동", "청담동"],
    "강동구": ["강일동", "고덕동", "길동", "둔촌동", "명일동", "상일동", "성내동", "암사동", "천호동"],
    "강북구": ["미아동", "번동", "수유동", "우이동"],
    "강서구": ["가양동", "개화동", "공항동", "과해동", "내발산동", "등촌동", "마곡동", "방화동", "염창동", "오곡동", "오쇠동", "외발산동", "화곡동"],
    "관악구": ["봉천동", "신림동"],
    "광진구": ["광장동", "구의동", "군자동", "능동", "자양동", "중곡동", "화양동"],
    "구로구": ["가리봉동", "개봉동", "고척동", "구로동", "궁동", "신도림동", "오류동", "온수동", "천왕동", "항동"],
    "금천구": ["가산동", "독산동", "시흥동"],
    "노원구": ["공릉동", "상계동", "월계동", "중계동", "하계동"],
    "도봉구": ["도봉동", "방학동", "쌍문동", "창동"],
    "동대문구": ["답십리동", "신설동", "용두동", "이문동", "장안동", "전농동", "제기동", "청량리동", "회기동", "휘경동"],
    "동작구": ["노량진동", "대방동", "동작동", "본동", "사당동", "상도동", "신대방동", "흑석동"],
    "마포구": ["공덕동", "노고산동", "대흥동", "도화동", "동교동", "마포동", "망원동", "상수동", "상암동", "서교동", "성산동", "신공덕동", "신수동", "신정동", "연남동", "용강동", "중동", "합정동", "현석동"],
    "서대문구": ["남가좌동", "대신동", "대현동", "미근동", "북가좌동", "북아현동", "신촌동", "연희동", "영천동", "옥천동", "창천동", "천연동", "충정로2가", "충정로3가", "합동", "현저동", "홍은동", "홍제동"],
    "서초구": ["내곡동", "반포동", "방배동", "서초동", "신원동", "양재동", "염곡동", "우면동", "원지동", "잠원동"],
    "성동구": ["금호동", "도선동", "마장동", "사근동", "상왕십리동", "성수동", "송정동", "옥수동", "왕십리동", "응봉동", "하왕십리동", "행당동", "홍익동"],
    "성북구": ["길음동", "돈암동", "동선동", "동소문동", "보문동", "삼선동", "상월곡동", "석관동", "성북동", "안암동", "월곡동", "장위동", "정릉동", "종암동", "하월곡동"],
    "송파구": ["가락동", "거여동", "마천동", "문정동", "방이동", "삼전동", "석촌동", "송파동", "신천동", "오금동", "잠실동", "장지동", "풍납동"],
    "양천구": ["목동", "신월동", "신정동"],
    "영등포구": ["당산동", "대림동", "도림동", "문래동", "신길동", "양평동", "여의도동", "영등포동"],
    "용산구": ["갈월동", "남영동", "동빙고동", "동자동", "문배동", "보광동", "산천동", "서빙고동", "신계동", "신창동", "용문동", "용산동", "원효로", "이촌동", "이태원동", "주성동", "청암동", "청파동", "한강로동", "한남동", "효창동", "후암동"],
    "은평구": ["갈현동", "구산동", "녹번동", "대조동", "불광동", "수색동", "신사동", "역촌동", "응암동", "증산동", "진관동"],
    "종로구": ["가회동", "견지동", "경운동", "계동", "공평동", "관수동", "관철동", "교남동", "교북동", "궁정동", "권농동", "낙원동", "내수동", "내자동", "누상동", "누하동", "당주동", "도렴동", "돈의동", "동숭동", "명륜동", "묘동", "무악동", "봉익동", "부암동", "사간동", "사직동", "삼청동", "서린동", "세종로", "소격동", "송월동", "송현동", "수송동", "숭인동", "신교동", "신문로", "신영동", "안국동", "연건동", "연지동", "예지동", "옥인동", "와룡동", "운니동", "원남동", "원서동", "이화동", "익선동", "인사동", "인의동", "장사동", "재동", "적선동", "종로1가", "중학동", "창성동", "창신동", "청운동", "청진동", "체부동", "충신동", "통의동", "통인동", "팔판동", "평동", "평창동", "필운동", "행촌동", "혜화동", "홍지동", "홍파동", "화동", "효자동", "훈정동"],
    "중구": ["광희동", "남대문로", "남산동", "남창동", "남학동", "다동", "만리동", "명동", "무교동", "무학동", "묵정동", "방산동", "봉래동", "북창동", "산림동", "삼각동", "서소문동", "소공동", "수표동", "수하동", "순화동", "신당동", "쌍림동", "예관동", "예장동", "오장동", "을지로", "인현동", "입정동", "장교동", "장충동", "저동", "정동", "주교동", "주자동", "중림동", "초동", "충무로", "충정로", "태평로", "필동", "황학동", "회현동", "흥인동"],
    "중랑구": ["망우동", "면목동", "묵동", "상봉동", "신내동", "중화동"],
    // 부산광역시
    "해운대구": ["반송동", "반여동", "석대동", "송정동", "우동", "좌동", "재송동", "중동"],
    "기장군": ["기장읍", "장안읍", "정관읍", "일광면", "철마면"],
    "금정구": ["구서동", "금사동", "금성동", "남산동", "노포동", "두구동", "부곡동", "서동", "선두구동", "오륜동", "장전동", "청룡동", "회동동"],
    // 경기도
    "용인시 처인구": ["양지면", "백암면", "원삼면", "이동읍", "남사읍", "포곡읍", "모현읍"],
    "용인시 기흥구": ["구갈동", "마북동", "보라동", "상갈동", "상하동", "서농동", "신갈동", "언남동", "영덕동", "중동", "지곡동", "청덕동", "하갈동"],
    "용인시 수지구": ["고기동", "동천동", "상현동", "성복동", "신봉동", "죽전동", "풍덕천동"],
    "이천시": ["마장면", "대월면", "모가면", "백사면", "설성면", "신둔면", "장호원읍", "율면", "호법면", "부발읍"],
    "광주시": ["곤지암읍", "도척면", "퇴촌면", "남종면", "남한산성면", "경안동", "오포읍", "초월읍", "실촌읍", "중부면"],
    "화성시": ["동탄면", "봉담읍", "서신면", "송산면", "양감면", "우정읍", "장안면", "정남면", "팔탄면", "향남읍", "매송면", "비봉면", "마도면", "남양읍"],
    "평택시": ["고덕면", "서탄면", "안중읍", "오성면", "청북읍", "팽성읍", "포승읍", "현덕면", "진위면", "통복동", "비전동"],
    "파주시": ["광탄면", "교하동", "군내면", "금촌동", "문산읍", "법원읍", "적성면", "조리읍", "진동면", "진서면", "탄현면", "파주읍", "파평면"],
    "김포시": ["고촌읍", "대곶면", "양촌읍", "월곶면", "통진읍", "하성면", "김포본동", "장기본동", "걸포동", "구래동", "마산동", "운양동", "장기동"],
    "양주시": ["광적면", "남면", "백석읍", "은현면", "장흥면", "회천읍", "회정동", "양주동", "덕계동", "삼숭동"],
    "포천시": ["가산면", "관인면", "군내면", "내촌면", "소흘읍", "신북면", "영북면", "영중면", "이동면", "일동면", "창수면", "화현면", "선단동", "설운동", "자작동", "어룡동"],
    "여주시": ["가남읍", "강천면", "금사면", "대신면", "북내면", "산북면", "세종대왕면", "여주읍", "점동면", "흥천면"],
    "안성시": ["가현동", "고삼면", "공도읍", "금광면", "대덕면", "미양면", "보개면", "삼죽면", "서운면", "양성면", "원곡면", "일죽면", "죽산면"],
    "남양주시": ["별내동", "오남읍", "와부읍", "진건읍", "진접읍", "퇴계원읍", "화도읍", "호평동", "평내동", "금곡동", "다산동"],
    // 충청북도
    "음성군": ["삼성면", "대소면", "금왕읍", "맹동면", "생극면", "소이면", "원남면", "음성읍", "감곡면"],
    "진천군": ["진천읍", "덕산면", "초평면", "광혜원면", "만승면", "백곡면", "이월면", "문백면"],
    "청주시 상당구": ["가덕면", "낭성면", "미원면", "문의면", "남일면", "내덕동", "용정동", "용암동"],
    "청주시 서원구": ["남이면", "현도면", "분평동", "사직동", "산남동", "수곡동"],
    "청주시 청원구": ["내수읍", "북이면", "오창읍", "옥산면", "오송읍", "내덕동", "율량동"],
    "청주시 흥덕구": ["강내면", "옥산면", "오송읍", "가경동", "복대동", "봉명동", "송정동", "신봉동"],
    "충주시": ["가금면", "금가면", "노은면", "대소원면", "동량면", "산척면", "살미면", "소태면", "수안보면", "신니면", "앙성면", "엄정면", "이류면", "주덕읍", "중앙탑면"],
    "제천시": ["금성면", "덕산면", "백운면", "봉양읍", "송학면", "수산면", "청풍면", "한수면"],
    // 충청남도
    "천안시 동남구": ["광덕면", "동면", "목천읍", "병천면", "북면", "성남면", "수신면", "풍세면"],
    "천안시 서북구": ["성환읍", "성거읍", "직산읍", "입장면"],
    "아산시": ["탕정면", "배방읍", "음봉면", "둔포면", "선장면", "송악면", "신창면", "염치읍", "영인면", "인주면", "도고면", "신장면"],
    "논산시": ["가야곡면", "강경읍", "광석면", "노성면", "벌곡면", "부적면", "상월면", "성동면", "양촌면", "연무읍", "연산면", "은진면", "채운면", "취암동"],
    "공주시": ["계룡면", "반포면", "사곡면", "신풍면", "우성면", "유구읍", "의당면", "이인면", "장기면", "정안면", "탄천면"],
    "서산시": ["고북면", "대산읍", "부석면", "성연면", "송악면", "양대면", "운산면", "음암면", "인지면", "지곡면", "팔봉면", "해미면"],
    "당진시": ["고대면", "면천면", "석문면", "송산면", "송악읍", "순성면", "신평면", "우강면", "정미면", "합덕읍"],
    // 세종특별자치시
    "세종시": ["조치원읍", "금남면", "부강면", "소정면", "연기면", "연동면", "연서면", "장군면", "전동면", "전의면"],
    // 전북특별자치도
    "전주시 덕진구": ["금상동", "덕진동", "동산동", "만성동", "송천동", "여의동", "우아동", "인후동", "중동", "진북동", "팔복동", "호성동", "화산동", "장동"],
    "전주시 완산구": ["경원동", "다가동", "동서학동", "삼천동", "서노송동", "서신동", "색장동", "완산동", "중앙동", "중화산동", "평화동", "효자동"],
    "익산시": ["금마면", "낭산면", "망성면", "삼기면", "성당면", "용안면", "용동면", "왕궁면", "웅포면", "춘포면", "팔봉동", "함라면", "함열읍", "황등면"],
    "군산시": ["나포면", "대야면", "서수면", "성산면", "옥구읍", "옥도면", "옥산면", "임피면", "회현면", "개정면", "개복동"],
    // 경상북도
    "경주시": ["감포읍", "강동면", "건천읍", "내남면", "산내면", "서면", "안강읍", "양남면", "양북면", "외동읍", "천북면", "현곡면"],
    "포항시 남구": ["구룡포읍", "대송면", "동해면", "연일읍", "오천읍", "장기면", "호미곶면"],
    "포항시 북구": ["기계면", "기북면", "신광면", "송라면", "죽장면", "청하면", "흥해읍"],
    "구미시": ["고아읍", "도개면", "무을면", "산동읍", "선산읍", "옥성면", "장천면", "해평면"],
    "안동시": ["녹전면", "남선면", "남후면", "도산면", "북후면", "서후면", "예안면", "와룡면", "임동면", "임하면", "일직면", "길안면", "풍산읍", "풍천면"],
    // 경상남도
    "창원시 의창구": ["대산면", "동읍", "북면", "의창동", "팔용동"],
    "창원시 성산구": ["가음정동", "반림동", "사파동", "상남동", "성주동", "중앙동", "토월동"],
    "창원시 마산합포구": ["구산면", "내서읍", "진동면", "진북면", "진전면", "해운동", "합포동", "월영동", "산호동"],
    "창원시 마산회원구": ["내서읍", "봉암동", "석전동", "양덕동", "회원동", "합성동"],
    "창원시 진해구": ["경화동", "석동", "이동", "자은동", "장천동", "진해동", "충무동", "풍호동", "행암동"],
    "김해시": ["대동면", "상동면", "생림면", "주촌면", "진례면", "진영읍", "한림면"],
    "양산시": ["동면", "물금읍", "상북면", "웅상읍", "원동면", "하북면"],
    // 제주특별자치도
    "제주시": ["구좌읍", "애월읍", "우도면", "조천읍", "추자면", "한경면", "한림읍", "아라동", "건입동", "노형동", "봉개동", "삼도동", "연동", "오라동", "외도동", "용담동", "이도동", "이호동", "일도동", "화북동"],
    "서귀포시": ["남원읍", "대정읍", "안덕면", "성산읍", "표선면", "동홍동", "서귀동", "서홍동", "송산동", "영천동", "정방동", "천지동", "효돈동", "대륜동", "대천동", "도순동", "법환동", "색달동", "상효동", "신효동", "토평동", "하원동", "하효동", "호근동", "회수동"],
  },
  리: {
    // 경기도 - 용인시 처인구
    "양지면": ["마성리", "송문리", "대대리", "남곡리", "추계리", "제일리", "정수리", "평창리", "양지리"],
    "백암면": ["봉남리", "백봉리", "근창리", "고안리", "박곡리", "석천리", "옥산리", "용천리", "가창리"],
    "원삼면": ["사암리", "문촌리", "두창리", "고당리", "좌항리", "맹리", "미평리", "죽능리", "학일리"],
    "이동읍": ["묵리", "시미리", "송전리", "어비리", "천리", "서리"],
    "남사읍": ["완장리", "북리", "창리", "봉명리", "아곡리", "원암리", "진목리"],
    "포곡읍": ["금어리", "둔전리", "마성리", "삼계리", "영문리", "유운리", "전대리"],
    "모현읍": ["갈담리", "능원리", "동림리", "매산리", "오산리", "왕산리", "일산리", "초부리"],
    // 경기도 - 이천시
    "마장면": ["덕평리", "이치리", "장암리", "오천리", "표교리", "해월리", "목리", "관리"],
    "대월면": ["사동리", "초지리", "대월리", "군량리", "송라리", "장평리", "부필리"],
    "모가면": ["진가리", "어농리", "소고리", "산내리", "서경리", "공이리", "소정리"],
    "백사면": ["도립리", "경사리", "내촌리", "송말리", "원적리", "조읍리", "현방리"],
    "설성면": ["대죽리", "사곡리", "상봉리", "송계리", "신필리", "신작리", "행죽리"],
    "신둔면": ["고척리", "남정리", "도봉리", "수광리", "수남리", "용면리", "지석리"],
    "장호원읍": ["나래리", "노탑리", "선읍리", "송산리", "와현리", "장왕리", "진암리", "풍계리"],
    "율면": ["고당리", "반농리", "산성리", "월포리", "이황리"],
    "호법면": ["동산리", "매곡리", "유산리", "주미리", "후안리"],
    "부발읍": ["가좌리", "고백리", "신하리", "아미리", "응암리"],
    // 경기도 - 광주시
    "곤지암읍": ["신리", "역동리", "삼리", "건업리", "연곡리", "오향리", "화촌리"],
    "도척면": ["진우리", "노곡리", "상림리", "도웅리", "유정리", "추곡리"],
    "퇴촌면": ["정지리", "영동리", "도수리", "관음리", "무수리", "원당리"],
    "남종면": ["귀여리", "분원리", "삼성리", "수청리", "이석리", "천좌리"],
    "남한산성면": ["검복리", "광지원리", "상번천리", "하번천리"],
    "오포읍": ["고산리", "능평리", "매산리", "문형리", "신현리", "양벌리"],
    "초월읍": ["대쌍령리", "도평리", "산이리", "선동리", "서하리", "신월리", "쌍동리"],
    "실촌읍": ["곤지암리", "삼리", "유사리"],
    "중부면": ["광평리", "금광리", "대오리", "산수리", "엄미리"],
    // 경기도 - 화성시
    "봉담읍": ["당하리", "동화리", "분천리", "상기리", "수영리", "왕림리", "유리"],
    "서신면": ["노하리", "매화리", "백미리", "상안리", "송교리", "신흥리", "전곡리"],
    "송산면": ["고정리", "독지리", "봉가리", "삼존리", "사강리", "어도리", "중송리", "천등리"],
    "양감면": ["대양리", "무송리", "사창리", "신왕리", "용소리", "정문리", "초록리"],
    "우정읍": ["국화리", "매향리", "멱우리", "석천리", "운평리", "조암리", "주곡리", "화산리"],
    "장안면": ["금의리", "독정리", "수촌리", "어은리", "장안리", "덕다리"],
    "정남면": ["괘랑리", "귀래리", "문학리", "백리", "보통리", "오두리", "서양리"],
    "팔탄면": ["가재리", "기천리", "덕우리", "하저리", "해창리"],
    "향남읍": ["구문천리", "도이리", "발안리", "상신리", "제암리", "평리", "행정리"],
    "매송면": ["송라리", "숙곡리", "야목리", "어천리", "원리", "천천리"],
    "비봉면": ["남전리", "삼화리", "양노리", "유포리", "자안리", "청오리", "화천리"],
    "마도면": ["백곡리", "송정리", "쌍송리", "청원리", "해문리"],
    "남양읍": ["남양리", "문호리", "북양리", "송림리", "신남리"],
    // 경기도 - 평택시
    "고덕면": ["궁리", "동고리", "두릉리", "문곡리", "방축리", "해용리"],
    "서탄면": ["내천리", "마두리", "사리", "수월암리", "황구지리"],
    "안중읍": ["고잔리", "대반리", "덕우리", "송담리", "용성리", "학현리", "현덕리"],
    "오성면": ["교포리", "길음리", "숙성리", "신리", "안화리", "양교리", "죽리"],
    "청북읍": ["고렴리", "백봉리", "어소리", "어연리", "율북리", "삼계리", "현곡리"],
    "팽성읍": ["객사리", "노양리", "대사리", "두정리", "본정리", "신대리"],
    "포승읍": ["내기리", "도곡리", "방림리", "석정리", "신영리", "원정리", "홍원리"],
    "현덕면": ["기산리", "권관리", "대안리", "덕목리", "도대리", "인광리", "화양리"],
    "진위면": ["가곡리", "갈곶리", "동천리", "마산리", "봉남리", "은산리", "청호리"],
    // 충청북도 - 음성군
    "삼성면": ["천남리", "양덕리", "용성리", "대사리", "덕정리", "대정리"],
    "대소면": ["성본리", "대풍리", "삼호리", "미곡리", "내산리", "부윤리"],
    "금왕읍": ["용계리", "내송리", "호산리", "오선리", "쌍봉리", "무극리"],
    "맹동면": ["마산리", "봉현리", "본대리", "쌍정리", "인곡리", "통동리"],
    "생극면": ["관성리", "방축리", "오생리", "신양리", "차곡리", "팔성리"],
    "소이면": ["갑산리", "대장리", "비산리", "충곡리", "후미리"],
    "원남면": ["보천리", "상당리", "상노리", "삼용리", "하당리"],
    "음성읍": ["동음리", "석인리", "용산리", "읍내리", "평곡리", "한벌리"],
    "감곡면": ["단평리", "문촌리", "사곡리", "상우리", "왕궁리", "오향리", "영산리"],
    // 충청북도 - 진천군
    "진천읍": ["성석리", "연곡리", "읍내리", "벽암리", "행정리", "신정리"],
    "덕산면": ["용몽리", "구산리", "합목리", "두촌리", "산수리", "석장리"],
    "초평면": ["용정리", "화산리", "영구리", "금곡리", "오갑리", "용곡리"],
    "광혜원면": ["광혜원리", "도원리", "죽현리", "회안리", "상산리"],
    "만승면": ["봉죽리", "삼덕리", "신척리", "월성리", "효청리", "하비리"],
    "백곡면": ["갈월리", "구수리", "대문리", "사송리", "석현리", "명암리"],
    "이월면": ["노원리", "삼용리", "송림리", "사곡리", "신월리", "중척리"],
    "문백면": ["도하리", "봉죽리", "사양리", "은탄리", "장월리", "평산리"],
    // 충청남도 - 천안시
    "성환읍": ["대홍리", "수향리", "매주리", "봉양리", "왕림리", "송정리"],
    "성거읍": ["요방리", "신월리", "천흥리", "모전리", "송남리", "소정리"],
    "직산읍": ["군동리", "삼은리", "마정리", "모시리", "신갈리", "삼곡리"],
    "입장면": ["가산리", "도하리", "시장리", "양대리", "용정리", "유리", "호당리"],
    "광덕면": ["광덕리", "매당리", "보산원리", "신덕리", "원덕리"],
    "동면": ["구도리", "덕성리", "송연리", "용두리", "화덕리"],
    "목천읍": ["교촌리", "동리", "삼성리", "송전리", "신계리", "운전리"],
    "병천면": ["가전리", "도원리", "매성리", "병천리", "봉정리", "탑원리"],
    "북면": ["납안리", "대평리", "사담리", "연춘리", "오곡리", "청송리"],
    "성남면": ["대정리", "봉양리", "신사리", "화성리"],
    "수신면": ["백자리", "발산리", "속창리", "신풍리", "장산리", "해정리"],
    "풍세면": ["가송리", "남관리", "미죽리", "삼태리", "용정리"],
    // 충청남도 - 아산시
    "탕정면": ["갈산리", "용두리", "매곡리", "호산리", "명암리", "동산리"],
    "배방읍": ["장재리", "갈매리", "호서리", "공수리", "세교리", "북수리"],
    "음봉면": ["신수리", "동천리", "쌍용리", "산동리", "외암리", "소동리"],
    "둔포면": ["관대리", "봉재리", "석곡리", "신왕리", "신남리", "신항리", "운교리", "염작리"],
    "선장면": ["가산리", "군덕리", "대흥리", "선장리", "죽산리", "학성리"],
    "송악면": ["강장리", "궁평리", "마곡리", "수곡리", "역촌리", "유곡리", "평촌리"],
    "신창면": ["가덕리", "궁화리", "남성리", "읍내리", "학정리", "황산리"],
    "염치읍": ["곡교리", "산동리", "백암리", "송곡리", "동정리", "석정리"],
    "영인면": ["고룡리", "상성리", "신봉리", "삼현리", "아산리", "월선리"],
    "인주면": ["걸매리", "냉정리", "대율리", "문방리", "신두리", "용두리"],
    "도고면": ["신곡리", "효자리", "금수리", "금산리"],
    "신장면": ["국곡리", "목촌리", "팽나무골리", "하천리"],
    // 세종특별자치시
    "조치원읍": [],
    "금남면": ["감성리", "금천리", "대박리", "발산리", "부용리", "용포리"],
    "부강면": ["금산리", "노호리", "등곡리", "문곡리", "청용리"],
    "소정면": ["송등리", "대곡리", "소정리", "운담리"],
    "연기면": ["눌왕리", "봉기리", "산울리", "세종리", "수산리", "응암리"],
    "연동면": ["내판리", "노송리", "명학리", "송용리", "예양리"],
    "연서면": ["기룡리", "부동리", "신대리", "쌍류리", "월하리", "청라리"],
    "장군면": ["금암리", "도계리", "봉안리", "송문리", "송정리", "용암리"],
    "전동면": ["미곡리", "봉대리", "송곡리", "송성리", "청송리"],
    "전의면": ["관정리", "금사리", "다방리", "시목리", "신방리", "읍내리"],
    // 동 지역 (리 없음)
    "개포동": [], "논현동": [], "대치동": [], "도곡동": [], "삼성동": [], "세곡동": [], 
    "수서동": [], "신사동": [], "압구정동": [], "역삼동": [], "율현동": [], "일원동": [], 
    "자곡동": [], "청담동": [], "강일동": [], "고덕동": [], "길동": [], "둔촌동": [], 
    "명일동": [], "상일동": [], "성내동": [], "암사동": [], "천호동": [],
  }
} as const;

// 택지 세부 유형별 면적 기준
const LAND_SUB_TYPE_CRITERIA: Record<string, { label: string; maxArea: number }> = {
  "residential-detached": { label: "주거용(단독주택)", maxArea: 90 },
  "residential-multi": { label: "주거용(연립/다세대)", maxArea: 165 },
  "residential-apartment": { label: "주거용(아파트)", maxArea: 60 },
  "commercial": { label: "상업용", maxArea: 150 },
  "industrial": { label: "공업용", maxArea: 330 },
};

// AI 분석 결과 시뮬레이션
function simulateAIAnalysis(
  land: LandInfo, 
  currentUsage: string, // 현재 활용 지목 (사용자 선택)
  landSubType?: "" | "residential-detached" | "residential-multi" | "residential-apartment" | "commercial" | "industrial"
): AIAnalysisResult {
  const shapeIndexChange = land.remainingShapeIndex - land.originalShapeIndex;
  
  // 현재 활용 지목(currentUsage) 기준으로 면적 기준 적용
  let areaCriteriaLabel = "";
  let areaCriteriaMet = false;
  
  // 현재 활용 지목이 "대"(택지)인 경우 세부 유형에 따른 면적 기준 적용
  if (currentUsage === "대" && landSubType && LAND_SUB_TYPE_CRITERIA[landSubType]) {
    const criteria = LAND_SUB_TYPE_CRITERIA[landSubType];
    areaCriteriaLabel = `잔여 면적 ${land.remainingArea}㎡ (${criteria.label} 기준: ${criteria.maxArea}㎡ 이하)`;
    areaCriteriaMet = land.remainingArea <= criteria.maxArea;
  } else if (currentUsage === "전" || currentUsage === "답") {
    // 현재 활용 지목이 "전"(밭) 또는 "답"(논)인 경우 농지 기준
    areaCriteriaLabel = `잔여 면적 ${land.remainingArea}㎡ (농지 기준: 330㎡ 이하)`;
    areaCriteriaMet = land.remainingArea <= 330;
  } else if (currentUsage === "임") {
    // 현재 활용 지목이 "임"(임야)인 경우 산지 기준
    areaCriteriaLabel = `잔여 면적 ${land.remainingArea}㎡ (산지 기준: 990㎡ 이하)`;
    areaCriteriaMet = land.remainingArea <= 990;
  } else {
    // 그 밖의 지목 (잡종지 등)
    areaCriteriaLabel = `잔여 면적 ${land.remainingArea}㎡ (그 밖의 토지 기준: 330㎡ 이하)`;
    areaCriteriaMet = land.remainingArea <= 330;
  }
  
  // 공통 자동 판독 기준
  const criteriaChecks = [
    {
      criteriaName: "잔여 면적 기준",
      criteriaDescription: areaCriteriaLabel,
      isMet: areaCriteriaMet,
      autoDetected: true,
    },
    {
      criteriaName: "잔여지 비율",
      criteriaDescription: `잔여 비율 ${land.remainingRatio}% (기준: 25% 이하 시 면적 기준 1.5배 완화)`,
      isMet: land.remainingRatio <= 25,
      autoDetected: true,
    },
    {
      criteriaName: "형상지수 변화",
      criteriaDescription: `형상지수 변화 +${shapeIndexChange.toFixed(1)} (기준: 1.0 이상 상승)`,
      isMet: shapeIndexChange >= 1.0,
      autoDetected: true,
    },
    {
      criteriaName: "잔여지 형상",
      criteriaDescription: `잔여지 형상: ${land.remainingShape} (사각형 폭 5m 이하 / 삼각형 한 변 11m 이하)`,
      isMet: ["부정형", "삼각형", "역삼각형", "자루형"].includes(land.remainingShape),
      autoDetected: true,
    },
  ];

  // 토지 유형별 물리 조건 (PRD 기준)
  // 택지인 경우
  if (currentUsage === "대") {
    criteriaChecks.push({
      criteriaName: "접면도로 상실",
      criteriaDescription: "접면도로 상태 변경으로 건축허가 불가",
      isMet: false,
      autoDetected: false,
    });
    criteriaChecks.push({
      criteriaName: "형상 부정형 변경",
      criteriaDescription: "형상 부정형으로 변경 (사각형 폭 5m 이하 / 삼각형 한 변 11m 이하)",
      isMet: false,
      autoDetected: false,
    });
  }
  
  // 농지(전, 답)인 경우
  if (currentUsage === "전" || currentUsage === "답") {
    criteriaChecks.push({
      criteriaName: "도로/수로 상실",
      criteriaDescription: "도로 또는 수로 상실로 농지로서의 사용 불가",
      isMet: false,
      autoDetected: false,
    });
    criteriaChecks.push({
      criteriaName: "농기계 회전 곤란",
      criteriaDescription: "농기계 회전이 곤란하여 영농이 불가능한 경우",
      isMet: false,
      autoDetected: false,
    });
    criteriaChecks.push({
      criteriaName: "축사부지 건축 불가",
      criteriaDescription: "접면도로 상태 변경으로 축사부지 건축 불가",
      isMet: false,
      autoDetected: false,
    });
  }
  
  // 산지(임)인 경우
  if (currentUsage === "임") {
    criteriaChecks.push({
      criteriaName: "접면도로 상실",
      criteriaDescription: "공익사업으로 인해 접한 도로가 없어진 경우",
      isMet: false,
      autoDetected: false,
    });
  }
  
  // 그 밖의 토지인 경우
  if (!["대", "전", "답", "임"].includes(currentUsage)) {
    criteriaChecks.push({
      criteriaName: "진입 곤란",
      criteriaDescription: "절토 및 성토/옹벽 설치 등으로 진입 곤란",
      isMet: false,
      autoDetected: false,
    });
    criteriaChecks.push({
      criteriaName: "토지 양분",
      criteriaDescription: "일단의 토지가 양분되어 잔여지 발생",
      isMet: false,
      autoDetected: false,
    });
    criteriaChecks.push({
      criteriaName: "형상 변경",
      criteriaDescription: "정형: 잔여지 폭이 기준 이하로 변경 / 비정형: 형상지수 1.0 이상 상승",
      isMet: false,
      autoDetected: false,
    });
  }

  const metAutoCriteria = criteriaChecks.filter(c => c.isMet && c.autoDetected).length;
  const hasManualCheckNeeded = criteriaChecks.some(c => !c.autoDetected);
  const manualCheckItems = criteriaChecks.filter(c => !c.autoDetected).map(c => c.criteriaName);
  const metCriteriaNames = criteriaChecks.filter(c => c.isMet).map(c => c.criteriaName);
  
    // AI 1차 판독: 수용가능/수용불가 판정
    let provisionalJudgment: "수용가능" | "수용불가";
  
  // 잔여 면적이 0인 경우: 잔여지가 없으므로 수용 불가
  if (land.remainingArea === 0) {
    provisionalJudgment = "수용불가";
  } else if (metAutoCriteria >= 1) {
    provisionalJudgment = "수용가능";
  } else {
    provisionalJudgment = "수용불가";
  }

  const judgmentRationale: JudgmentRationale = generateJudgmentRationale(
    land,
    provisionalJudgment,
    metAutoCriteria,
    metCriteriaNames,
    manualCheckItems,
    shapeIndexChange,
    currentUsage,
    landSubType
  );
  
  return {
    landTypePath: land.landType,
    criteriaChecks,
    provisionalJudgment,
    originalShapeIndex: land.originalShapeIndex,
    remainingShapeIndex: land.remainingShapeIndex,
    shapeIndexChange,
    isBlindLand: land.remainingRatio <= 20,
    accessRoadLost: false,
    waterChannelLost: false,
    farmMachineDifficulty: false,
    judgmentRationale,
  };
}

// 중앙토지수용위원회 기준 기반 판단 근거 설명 생성 함수
function generateJudgmentRationale(
  land: LandInfo,
  judgment: "매수" | "기각",
  metCriteriaCount: number,
  metCriteriaNames: string[],
  manualCheckItems: string[],
  shapeIndexChange: number,
  currentUsage: string, // 현재 활용 지목
  landSubType?: string
): JudgmentRationale {
  const legalBasis = "「공익사업을 위한 토지 등의 취득 및 보상에 관한 법률」 제74조(잔여지의 매수청구 등) 및 동법 시행규칙 제34조(잔여지 등의 매수청구), 중앙토지수용위원회 잔여지 수용 및 가치하락 손실보상 참고기준";
  
  let summary: string;
  let detailedExplanation: string;
  const appliedCriteria: string[] = [];

  // 현재 활용 지목(currentUsage) 기준에 따른 판단 문장
  if (currentUsage === "대" && landSubType && LAND_SUB_TYPE_CRITERIA[landSubType]) {
    const criteria = LAND_SUB_TYPE_CRITERIA[landSubType];
    appliedCriteria.push(`택지(현재 활용 지목: 대) 면적 기준: ${criteria.label} ${criteria.maxArea}㎡ 이하`);
  } else if (currentUsage === "전" || currentUsage === "답") {
    appliedCriteria.push(`농지(현재 활용 지목: ${currentUsage}) 면적 기준: 330㎡(약 100평) 이하이거나, 폭 5m 이하의 부정형으로서 농기계 회전이 곤란한 경우`);
  } else if (currentUsage === "임") {
    appliedCriteria.push(`산지(현재 활용 지목: 임) 면적 기준: 990㎡(약 300평) 이하`);
  } else {
    appliedCriteria.push(`그 밖의 토지(현재 활용 지목: ${currentUsage}) 면적 기준: 330㎡ 이하`);
  }
  
  appliedCriteria.push(`형상지수 변화 기준: 편입 전 대비 1.0 이상 상승 시 형상 불량으로 판단`);
  appliedCriteria.push(`잔여지 형상 기준: 삼각형, 역삼각형, 자루형, 부정형 등 불규칙 형상으로 종래 목적 사용 곤란`);
  appliedCriteria.push(`잔여비율 기준: 30% 이하일 경우 종래 목적 사용이 현저히 곤란한 것으로 판단`);

  // 중앙토지수용위원회 기준 문장 형식의 판단 근거
  const shapeDescription = getShapeDescription(land.remainingShape, land.remainingArea);
  const usageDescription = getUsageDifficultyDescription(land.landType, land.remainingArea, land.remainingShape);

  if (judgment === "매수") {
    summary = `${shapeDescription} ${usageDescription} 수용할 수 있는 것으로 판단됩니다.`;
    detailedExplanation = `[중앙토지수용위원회 참고기준에 따른 분석]

1. 분석 대상 토지
- 소재지: ${land.address}
- 토지 유형: ${land.landType}
- 지목: ${land.landCategory}
- 소유자: ${land.ownerName}

2. 편입 현황
- 편입 전 면적: ${land.originalArea.toLocaleString()}㎡
- 편입 면적: ${land.includedArea.toLocaleString()}㎡
- 잔여 면적: ${land.remainingArea.toLocaleString()}m²
- 잔여 비율: ${land.remainingRatio}%

3. 형상 분석
- 편입 전 형상: ${land.originalShape} (형상지수 ${land.originalShapeIndex})
- 잔여지 형상: ${land.remainingShape} (형상지수 ${land.remainingShapeIndex})
- 형상지수 변화: +${shapeIndexChange.toFixed(1)}

4. 충족 기준
${metCriteriaNames.map((name, i) => `${i + 1}) ${name}`).join("\n")}

5. 판정 결과
${summary}`;
  } else {
    // 기각
    summary = `본 토지는 잔여지 면적 및 형상상 종래 목적대로 사용 가능한 것으로 판단되어 매수청구 대상에 해당하지 않습니다.`;
    detailedExplanation = `[중앙토지수용위원회 참고기준에 따른 분석]

1. 분석 대상 토지
- 소재지: ${land.address}
- 토지 유형: ${land.landType}
- 지목: ${land.landCategory}
- 소유자: ${land.ownerName}

2. 편입 현황
- 편입 전 면적: ${land.originalArea.toLocaleString()}㎡
- 편입 면적: ${land.includedArea.toLocaleString()}㎡
- 잔여 면적: ${land.remainingArea.toLocaleString()}㎡
- 잔여 비율: ${land.remainingRatio}%

3. 형상 분석
- 편입 전 형상: ${land.originalShape} (형상지수 ${land.originalShapeIndex})
- 잔여지 형상: ${land.remainingShape} (형상지수 ${land.remainingShapeIndex})
- 형상지수 변화: +${shapeIndexChange.toFixed(1)}

4. 미충족 사유
- 잔여 비율 ${land.remainingRatio}%로 기준(30% 이하) 초과
- 형상지수 변화 ${shapeIndexChange.toFixed(1)}로 기준(1.0 이상) 미달

5. 판정 결과
${summary}`;
  }

  return {
    summary,
    legalBasis,
    appliedCriteria,
    manualCheckItems: manualCheckItems.length > 0 ? manualCheckItems : undefined,
    detailedExplanation,
  };
}

// 형상 설명 생성 (중앙토지수용위원회 문장 형식)
function getShapeDescription(shape: string, area: number): string {
  const width = Math.sqrt(area); // 대략적인 폭 계산
  
  switch (shape) {
    case "삼각형":
    case "역삼각형":
      return `잔여지의 형상이 ${shape}으로서 정상적인 이용이 곤란한 부정형으로 보이며,`;
    case "자루형":
      return `잔여지의 형상이 자루형(세장형)으로서 폭이 좁아 정상적인 이용이 곤란하며,`;
    case "부정형":
      return `잔여지의 형상이 사각형으로서 폭 ${width.toFixed(0)}미터 이하인 부정형으로 보이며,`;
    default:
      return `잔여지의 형상이 ${shape}으로서,`;
  }
}

// 사용 곤란 설명 생성 (토지 유형별)
function getUsageDifficultyDescription(landType: string, area: number, shape: string): string {
  switch (landType) {
    case "농지":
      return `이는 농지로서의 사용이 현저히 곤란한 경우(농기계 회전 곤란)로 예상되어`;
    case "택지":
      return `이는 택지로서 건축물의 건축이 현저히 곤란한 경우로 예상되어`;
    case "산지":
      return `이는 산지로서의 종래 목적대로 사용이 현저히 곤란한 경우로 예상되어`;
    default:
      return `이는 종래 목적대로 사용이 현저히 곤란한 경우로 예상되어`;
  }
}

export function LandSearchSection({ onLandSelect, cartItems = [], onAddToCart, onRemoveFromCart, onSubmitCart }: LandSearchSectionProps) {
  // 장바구니 패널 표시 상태
  const [isCartOpen, setIsCartOpen] = useState(false);
  // 장바구니 선택 항목
  const [selectedCartItems, setSelectedCartItems] = useState<Set<string>>(new Set());

  
  // 검색 방식 탭 (지번 / 개인정보 / 법인정보)
  const [searchMode, setSearchMode] = useState<"address" | "individual" | "corporation">("address");
  
  // 개인정보 검색 상태 (이름 + 주민번호 앞자리)
  const [ownerName, setOwnerName] = useState<string>("");
  const [ownerBirthDate, setOwnerBirthDate] = useState<string>(""); // YYMMDD (주민번호 앞 6자리)
  
  // 법인정보 검색 상태 (법인명 + 사업자번호)
  const [corpName, setCorpName] = useState<string>("");
  const [businessNumber, setBusinessNumber] = useState<string>("");
  
  // 행정구역 선택 상태
  const [selectedSido, setSelectedSido] = useState<string>("");
  const [selectedSigungu, setSelectedSigungu] = useState<string>("");
  const [selectedEupmyeondong, setSelectedEupmyeondong] = useState<string>("");
  const [selectedRi, setSelectedRi] = useState<string>("");
  const [jibun, setJibun] = useState<string>("");
  
  // 검색 결과 상태
  const [searchResults, setSearchResults] = useState<LandInfo[]>([]);
  const [selectedLand, setSelectedLand] = useState<LandInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isResultsCollapsed, setIsResultsCollapsed] = useState(false);
  const [isBasicInfoCollapsed, setIsBasicInfoCollapsed] = useState(false);
  
  // 본인 소유 필지 선택 상태 (인접지 중 본인 소유 확인용)
  const [ownedParcels, setOwnedParcels] = useState<Set<string>>(new Set());
  
  // 지도-목록 호버 연동 상태
  const [hoveredParcelId, setHoveredParcelId] = useState<string | null>(null);
  
  // 본인 소유 필지 선택 (단일 선택만 가능)
  const toggleOwnedParcel = (landId: string) => {
    setOwnedParcels(prev => {
      // 이미 선택된 필지를 다시 클릭하면 선택 해제
      if (prev.has(landId)) {
        return new Set();
      }
      // 새로운 필지 선택 시 기존 선택 해제하고 새 필지만 선택
      return new Set([landId]);
    });
  };
  
  // AI 분석 상태
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  
  // 필지별 AI 판독 결과 저장 (복수 선택 지원)
  const [parcelAiResults, setParcelAiResults] = useState<Map<string, AIAnalysisResult>>(new Map());
  
  // 편입토지 없음 상태
  const [noIncludedLand, setNoIncludedLand] = useState(false);
  
  // 현재 활용 지목 (공부상 지목과 다를 수 있음 - 사용자 선택)
  const [currentUsage, setCurrentUsage] = useState<string>("");
  // 택지 세부 유형 (현재 활용 지목이 "대"인 경우에만 사용)
  const [landSubType, setLandSubType] = useState<"" | "residential-detached" | "residential-multi" | "residential-apartment" | "commercial" | "industrial">("");

  // 현재 단계 계산
  // 1. 지번조회 = 필지 선택 전까지
  // 2. 필지 선택 = AI 판독 시작 버튼 누르기 전까지
  // 3. AI 판독 = AI판독 시작 버튼 누르고난 후
  // 4. 결과 확인 = AI 판독 완료 후
  const currentStep = aiResult ? 4 : (aiAnalyzing ? 3 : (selectedLand ? 2 : 1));

  // 검색 실행
  const handleSearch = () => {
    // 검색 모드에 따른 유효성 검사
    if (searchMode === "address" && !selectedSigungu) return;
    if (searchMode === "individual" && (!ownerName || ownerBirthDate.length !== 6)) return;
    if (searchMode === "corporation" && (!corpName || businessNumber.replace(/-/g, "").length !== 10)) return;
    
    setIsSearching(true);
    setHasSearched(true);
    setSelectedLand(null);
    setCurrentPage(1);
    setAiResult(null);
    setNoIncludedLand(false);
    setOwnedParcels(new Set()); // 본인 소유 선택 초기화
    setParcelAiResults(new Map()); // AI 판독 결과 초기화
    
    setTimeout(() => {
      let results: LandInfo[];
      
      if (searchMode === "individual" || searchMode === "corporation") {
        // 소유자 검색: 이름 + 주민번호 앞자리로 검색
        // 실제 구현에서는 API 호출, 여기서는 더미 데이터 시뮬레이션
        // 홍길동이 3개 관할기관(양평이천, 수도권, 천안안성)에 잔여지를 소유한 경우
        const ownerLandData = [
          // 양평이천 관할기관 - 2건
          {
            id: "owner-search-0",
            address: "경기도 이천시 마장면 덕평리 55-3",
            coordinates: [
              { lat: 37.2350, lng: 127.3800 },
              { lat: 37.2358, lng: 127.3812 },
              { lat: 37.2352, lng: 127.3820 },
              { lat: 37.2345, lng: 127.3808 },
            ],
            originalArea: 850,
            incorporatedArea: 620,
            remainingArea: 230,
            remainingRatio: 27.1,
            landType: "농지",
            landCategory: "전",
            businessUnit: "양평이천",
            projectName: "이천-여주 국도확장사업",
          },
          {
            id: "owner-search-1",
            address: "경기도 양평군 용문면 연수리 123-4",
            coordinates: [
              { lat: 37.4850, lng: 127.5320 },
              { lat: 37.4858, lng: 127.5332 },
              { lat: 37.4852, lng: 127.5340 },
              { lat: 37.4845, lng: 127.5328 },
            ],
            originalArea: 1120,
            incorporatedArea: 850,
            remainingArea: 270,
            remainingRatio: 24.1,
            landType: "농지",
            landCategory: "전",
            businessUnit: "양평이천",
            projectName: "양평-홍천 도로확장사업",
          },
          // 부산울산 관할기관 - 2건
          {
            id: "owner-search-2",
            address: "부산광역시 해운대구 우동 1450-2",
            coordinates: [
              { lat: 35.1620, lng: 129.1635 },
              { lat: 35.1628, lng: 129.1645 },
              { lat: 35.1622, lng: 129.1652 },
              { lat: 35.1615, lng: 129.1642 },
            ],
            originalArea: 980,
            incorporatedArea: 750,
            remainingArea: 230,
            remainingRatio: 23.5,
            landType: "택지",
            landCategory: "대",
            businessUnit: "부산울산",
            projectName: "해운대 도시재생사업",
          },
          {
            id: "owner-search-3",
            address: "울산광역시 울주군 범서읍 천상리 88-5",
            coordinates: [
              { lat: 35.5420, lng: 129.2635 },
              { lat: 35.5428, lng: 129.2645 },
              { lat: 35.5422, lng: 129.2652 },
              { lat: 35.5415, lng: 129.2642 },
            ],
            originalArea: 1350,
            incorporatedArea: 1020,
            remainingArea: 330,
            remainingRatio: 24.4,
            landType: "농지",
            landCategory: "전",
            businessUnit: "부산울산",
            projectName: "울산-경주 산업도로 확장사업",
          },
          // 강진광주 관할기관 - 1건
          {
            id: "owner-search-4",
            address: "광주광역시 광산구 송정동 250-1",
            coordinates: [
              { lat: 35.1320, lng: 126.7920 },
              { lat: 35.1328, lng: 126.7932 },
              { lat: 35.1322, lng: 126.7940 },
              { lat: 35.1315, lng: 126.7928 },
            ],
            originalArea: 780,
            incorporatedArea: 550,
            remainingArea: 230,
            remainingRatio: 29.5,
            landType: "택지",
            landCategory: "대",
            businessUnit: "강진광주",
            projectName: "광주 도시개발사업",
          },
          // 춘천원주 관할기관 - 1건
          {
            id: "owner-search-5",
            address: "강원특별자치도 춘천시 서면 현암리 155-3",
            coordinates: [
              { lat: 37.8520, lng: 127.6835 },
              { lat: 37.8528, lng: 127.6845 },
              { lat: 37.8522, lng: 127.6852 },
              { lat: 37.8515, lng: 127.6842 },
            ],
            originalArea: 1650,
            incorporatedArea: 1280,
            remainingArea: 370,
            remainingRatio: 22.4,
            landType: "농지",
            landCategory: "답",
            businessUnit: "춘천원주",
            projectName: "춘천-홍천 국도확장사업",
          },
        ];
        
        // 여러 필지를 소유한 경우 (4개 관할기관: 양평이천 2건, 부산울산 2건, 강원원주 1건, 충천원주 1건)
        results = ownerLandData.map((landData) => ({
          ...dummyLandInfoList[0],
          ...landData,
          ownerName: ownerName || "홍길동",
        }));
        
        setSearchResults(results);
        setIsSearching(false);
        return;
      }
      
      // 지번 검색: 선택된 지역에 해당하는 토지 필터링
      results = dummyLandInfoList.filter(land => {
        // 시군구 포함 여부
        if (!land.address.includes(selectedSigungu)) return false;
        
        // 읍면동이 선택되었으면 필터링
        if (selectedEupmyeondong && !land.address.includes(selectedEupmyeondong)) return false;
        
        // 리가 선택되었으면 필터링
        if (selectedRi && !land.address.includes(selectedRi)) return false;
        
        // 지번이 입력되었으면 필터링
        if (jibun && !land.address.includes(jibun)) return false;
        
        return true;
      });
      
      // 검색 결과가 없으면 해당 지역의 더미 데이터 생성 (좌표 포함)
      if (results.length === 0) {
        const baseCoords = [
          [
            { lat: 37.2180, lng: 127.2950 },
            { lat: 37.2185, lng: 127.2960 },
            { lat: 37.2178, lng: 127.2965 },
            { lat: 37.2173, lng: 127.2955 },
          ],
          [
            { lat: 37.2185, lng: 127.2960 },
            { lat: 37.2192, lng: 127.2972 },
            { lat: 37.2188, lng: 127.2980 },
            { lat: 37.2178, lng: 127.2965 },
          ],
          [
            { lat: 37.2192, lng: 127.2972 },
            { lat: 37.2200, lng: 127.2985 },
            { lat: 37.2195, lng: 127.2995 },
            { lat: 37.2188, lng: 127.2980 },
          ],
          [
            { lat: 37.2170, lng: 127.2940 },
            { lat: 37.2176, lng: 127.2948 },
            { lat: 37.2172, lng: 127.2956 },
            { lat: 37.2165, lng: 127.2948 },
          ],
          [
            { lat: 37.2200, lng: 127.2985 },
            { lat: 37.2208, lng: 127.2998 },
            { lat: 37.2202, lng: 127.3008 },
            { lat: 37.2195, lng: 127.2995 },
          ],
        ];
        // 읍면동이 선택되지 않은 경우 기본 읍면동 목록에서 랜덤 선택
        const eupmyeondongList = regionData.읍면동[selectedSigungu as keyof typeof regionData.읍면동] || ["중앙동", "남부동", "북부동", "동부동", "서부동"];
        
        results = dummyLandInfoList.slice(0, 5).map((land, idx) => {
          const randomEupmyeondong = selectedEupmyeondong || eupmyeondongList[idx % eupmyeondongList.length];
          return {
            ...land,
            id: `search-${idx}`,
            address: `${selectedSido} ${selectedSigungu} ${randomEupmyeondong}${selectedRi ? ` ${selectedRi}` : ""} ${jibun || `${100 + idx}-${idx + 1}`}`,
            coordinates: baseCoords[idx] || baseCoords[0],
          };
        });
      }
      
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  // 필지 선택
  const handleLandSelect = (land: LandInfo) => {
    setSelectedLand(land);
    setNoIncludedLand(false);
    setCurrentUsage(land.landCategory); // 공부상 지목을 기본값으로 설정
    setLandSubType(""); // 택지 세부 유형 초기화
    
    // 해당 필지에 AI 판독 결과가 있으면 표시
    if (parcelAiResults.has(land.id)) {
      setAiResult(parcelAiResults.get(land.id)!);
    } else {
      setAiResult(null);
    }
    
    // 기본정보 패널이 접혀 있으면 자동으로 펼침
    if (isBasicInfoCollapsed) {
      setIsBasicInfoCollapsed(false);
    }
    
    // 편입토지가 없는 경우 체크
    if (land.includedArea === 0) {
      setNoIncludedLand(true);
    }
  };

  // AI 판독 실행 (단일 필지만 분석)
  const handleAIAnalysis = () => {
    if (noIncludedLand) return;
    // 현재 활용 지목 필수
    if (!currentUsage) return;
    // 현재 활용 지목이 "대"(택지)인 경우 세부 유형이 필수
    if (currentUsage === "대" && !landSubType) return;
    
    // 현재 선택된 단일 필지만 분석 (복수 분석 불가)
    if (!selectedLand) return;
    
    setAiAnalyzing(true);
    setAiResult(null);
    
    setTimeout(() => {
      // 단일 필지 AI 분석 실행
      const result = simulateAIAnalysis(selectedLand, currentUsage, landSubType);
      
      // 기존 결과 유지하면서 새 결과 추가
      setParcelAiResults(prev => {
        const newResults = new Map(prev);
        newResults.set(selectedLand.id, result);
        return newResults;
      });
      setAiResult(result);
      
      setAiAnalyzing(false);
    }, 1500);
  };

  // 초기화
  const handleReset = () => {
    setSearchMode("address");
    setOwnerName("");
    setOwnerBirthDate("");
    setSelectedSido("");
    setSelectedSigungu("");
    setSelectedEupmyeondong("");
    setSelectedRi("");
    setJibun("");
    setSearchResults([]);
    setSelectedLand(null);
    setAiResult(null);
    setNoIncludedLand(false);
    setHasSearched(false);
  };
  
  // 검색 방식 변경 시 필지 목록 및 기본 정보 초기화
  const handleSearchModeChange = (mode: "address" | "individual" | "corporation") => {
    setSearchMode(mode);
    setOwnerName("");
    setOwnerBirthDate("");
    setSelectedSido("");
    setSelectedSigungu("");
    setSelectedEupmyeondong("");
    setSelectedRi("");
    setJibun("");
    setSearchResults([]);
    setSelectedLand(null);
    setAiResult(null);
    setNoIncludedLand(false);
    setHasSearched(false);
  };

  // 드롭다운 옵션
  const sigunguOptions = selectedSido ? regionData.시군구[selectedSido as keyof typeof regionData.시군구] || [] : [];
  
  const eupmyeondongOptions = selectedSigungu ? regionData.읍면동[selectedSigungu as keyof typeof regionData.읍면동] || [] : [];
  const riOptions = selectedEupmyeondong ? regionData.리[selectedEupmyeondong as keyof typeof regionData.리] || [] : [];

  return (
    <div className="space-y-6">
      {/* KRDS 진행 단계 표시기 */}
      <nav aria-label="신청 진행 단계" className="w-full">
        <ol className="flex items-center justify-center">
          {[
            { step: 1, label: "지번 조회" },
            { step: 2, label: "필지 선택" },
            { step: 3, label: "AI 판독" },
            { step: 4, label: "결과 확인" },
          ].map((item, idx) => (
            <li key={item.step} className="flex items-center">
              <div className={`flex items-center gap-2 ${currentStep >= item.step ? "text-primary" : "text-gray-400"}`}>
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-base font-semibold ${
                  currentStep === item.step 
                    ? "bg-primary text-white" 
                    : currentStep > item.step
                      ? "bg-gray-200 text-gray-600"
                      : "bg-gray-100 text-gray-400"
                }`}>
                  {currentStep > item.step ? <CheckCircle2 className="h-5 w-5" /> : item.step}
                </span>
                <span className={`hidden text-base font-medium sm:block ${
                  currentStep >= item.step ? "text-primary" : "text-gray-400"
                }`}>
                  {item.label}
                </span>
              </div>
              {idx < 3 && (
                <div className={`mx-2 h-px w-8 sm:mx-4 sm:w-12 ${
                  currentStep > item.step ? "bg-primary" : "bg-gray-300"
                }`} aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* 검색 필터 영역 - 정부24 스타일 테이블 형식 */}
      <div className="mb-4 overflow-hidden rounded-lg border border-border">
        {/* 검색 방식 행 */}
        <div className="flex border-b border-border">
          <div className="flex w-28 shrink-0 items-center bg-muted/50 px-4 py-3">
            <span className="text-sm font-medium text-foreground">검색방식</span>
          </div>
          <div className="flex flex-1 items-center gap-4 bg-background px-4 py-3">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="searchMode"
                checked={searchMode === "address"}
                onChange={() => handleSearchModeChange("address")}
                className="h-4 w-4 accent-gray-900"
              />
              <span className="text-sm">지번으로 검색</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="searchMode"
                checked={searchMode === "individual"}
                onChange={() => handleSearchModeChange("individual")}
                className="h-4 w-4 accent-gray-900"
              />
              <span className="text-sm">개인정보로 검색</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="searchMode"
                checked={searchMode === "corporation"}
                onChange={() => handleSearchModeChange("corporation")}
                className="h-4 w-4 accent-gray-900"
              />
              <span className="text-sm">법인정보로 검색</span>
            </label>
          </div>
        </div>

        {/* 검색 조건 행 */}
        {searchMode === "individual" ? (
          <>
            <div className="flex border-b border-border">
              <div className="flex w-28 shrink-0 items-center bg-muted/50 px-4 py-3">
                <span className="text-sm font-medium text-foreground">개인정보</span>
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-4 bg-background px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">성명</span>
                  <Input
                    placeholder="홍길동"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-[140px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">주민번호</span>
                  <Input
                    placeholder="앞 6자리"
                    value={ownerBirthDate}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOwnerBirthDate(value);
                    }}
                    maxLength={6}
                    className="w-[100px]"
                  />
                </div>
              </div>
            </div>
            <div className="flex border-b border-border">
              <div className="flex w-28 shrink-0 items-center bg-muted/50 px-4 py-2">
                <span className="text-sm font-medium text-foreground">안내</span>
              </div>
              <div className="flex flex-1 items-center bg-background px-4 py-2">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  대리 신청 시, 신청서 제출 단계에서 위임장 및 대리인 신분증 사본이 필요합니다.
                </p>
              </div>
            </div>
          </>
        ) : searchMode === "corporation" ? (
          <>
            <div className="flex border-b border-border">
              <div className="flex w-28 shrink-0 items-center bg-muted/50 px-4 py-3">
                <span className="text-sm font-medium text-foreground">법인정보</span>
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-4 bg-background px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">법인명</span>
                  <Input
                    placeholder="주식회사 A건설"
                    value={corpName}
                    onChange={(e) => setCorpName(e.target.value)}
                    className="w-[180px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">사업자번호</span>
                  <Input
                    placeholder="000-00-00000"
                    value={businessNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                      if (value.length <= 3) {
                        setBusinessNumber(value);
                      } else if (value.length <= 5) {
                        setBusinessNumber(`${value.slice(0, 3)}-${value.slice(3)}`);
                      } else {
                        setBusinessNumber(`${value.slice(0, 3)}-${value.slice(3, 5)}-${value.slice(5)}`);
                      }
                    }}
                    maxLength={12}
                    className="w-[140px]"
                  />
                </div>
              </div>
            </div>
            <div className="flex border-b border-border">
              <div className="flex w-28 shrink-0 items-center bg-muted/50 px-4 py-2">
                <span className="text-sm font-medium text-foreground">안내</span>
              </div>
              <div className="flex flex-1 items-center bg-background px-4 py-2">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  법인 신청 시, 사업자등록증 및 법인인감증명서가 필요합니다.
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex border-b border-border">
            <div className="flex w-28 shrink-0 items-center bg-muted/50 px-4 py-3">
              <span className="text-sm font-medium text-foreground">지역</span>
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-3 bg-background px-4 py-3">
              <Select 
                value={selectedSido} 
                onValueChange={(v) => {
                  setSelectedSido(v);
                  setSelectedSigungu("");
                  setSelectedEupmyeondong("");
                  setSelectedRi("");
                  setSearchResults([]);
                }}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="시도 선택" />
                </SelectTrigger>
                <SelectContent>
                  {regionData.시도.map((sido) => (
                    <SelectItem key={sido} value={sido}>{sido}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedSigungu} 
                onValueChange={(v) => {
                  setSelectedSigungu(v);
                  setSelectedEupmyeondong("");
                  setSelectedRi("");
                  setSearchResults([]);
                }}
                disabled={!selectedSido}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="시군구 선택" />
                </SelectTrigger>
                <SelectContent>
                  {sigunguOptions.map((sigungu) => (
                    <SelectItem key={sigungu} value={sigungu}>{sigungu}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedEupmyeondong} 
                onValueChange={(v) => {
                  setSelectedEupmyeondong(v);
                  setSelectedRi("");
                  setSearchResults([]);
                }}
                disabled={!selectedSigungu}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="읍면동 선택" />
                </SelectTrigger>
                <SelectContent>
                  {eupmyeondongOptions.map((eupmyeondong) => (
                    <SelectItem key={eupmyeondong} value={eupmyeondong}>{eupmyeondong}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedRi} 
                onValueChange={setSelectedRi}
                disabled={!selectedEupmyeondong || riOptions.length === 0}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder={riOptions.length === 0 ? "해당없음" : "리 선택"} />
                </SelectTrigger>
                <SelectContent>
                  {riOptions.map((ri) => (
                    <SelectItem key={ri} value={ri}>{ri}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input 
                placeholder="지번 입력" 
                value={jibun}
                onChange={(e) => setJibun(e.target.value)}
                className="w-[100px]"
              />
            </div>
          </div>
        )}

        {/* 검색 버튼 영역 */}
        <div className="flex items-center justify-center gap-3 bg-muted/30 px-4 py-3">
          {(selectedSido || searchResults.length > 0) && (
            <Button 
              onClick={handleReset}
              variant="outline"
              className="gap-1.5 px-5 border-gray-900 text-gray-900 hover:bg-gray-100"
            >
              <RotateCcw className="h-4 w-4" />
              초기화
            </Button>
          )}
          <Button 
            onClick={handleSearch} 
            variant="default"
            className="gap-1.5 px-8 bg-gray-900 hover:bg-gray-800"
            disabled={
              isSearching ||
              (searchMode === "address" && !selectedSigungu) ||
              (searchMode === "individual" && (!ownerName || ownerBirthDate.length !== 6)) ||
              (searchMode === "corporation" && (!corpName || businessNumber.replace(/-/g, "").length !== 10))
            }
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>조회 중</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>검색</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 전체 화면 지도 컨테이너 */}
      <div className="relative h-[calc(100vh-260px)] min-h-[500px] w-full">
        {/* 지도 (전체 화면) */}
        <div className="absolute inset-0 z-[5]">
          <LeafletMap 
            zoomControlsPosition="sidebar-right"
            selectedRegion={selectedRi || selectedEupmyeondong || selectedSigungu || selectedSido}
            onParcelClick={(id) => {
              const land = searchResults.find(l => l.id === id);
              const landIndex = searchResults.findIndex(l => l.id === id);
              if (land) {
                handleLandSelect(land);
                // 지도에서 클릭 시 본인 소유 토글 (복수 선택)
                toggleOwnedParcel(land.id);
              }
            }}
            parcels={searchResults
              .filter(land => land.coordinates && land.coordinates.length >= 3)
              .map((land, index) => ({
                id: land.id,
                coordinates: land.coordinates!,
                address: land.address,
                isIncluded: land.includedArea > 0,
                isOwned: ownedParcels.has(land.id) || (index === 0 && ownedParcels.size === 0),
              }))}
            selectedParcelId={selectedLand?.id}
            selectedParcelIds={ownedParcels}
            hoveredParcelId={hoveredParcelId}
            onParcelHover={setHoveredParcelId}
          />
        </div>

        {/* 좌측 사이드바 - 필지 목록 + 기본정보 패널 */}
        <div className="absolute bottom-0 left-0 top-0 z-10 flex">
          {/* 필지 목록 패널 */}
          <div className="relative">
            <div className={`h-full bg-background transition-all duration-300 overflow-hidden ${isResultsCollapsed ? "w-0" : "w-[320px]"}`}>
            {/* 필지 목록 헤더 */}
            <div className="flex items-center justify-between border-b bg-muted pl-4 pr-1 py-3">
              <span className="text-base font-medium text-foreground">필지 목록</span>
              {searchResults.length > 0 && parcelAiResults.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // AI 판독 상태만 리셋 (필지 목록은 유지)
                    setParcelAiResults(new Map());
                    setAiResult(null);
                    setCheckedParcelsForCart(new Set());
                    setOwnedParcels(new Set());
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  title="판독 상태 초기화"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* 검색 결과 목록 */}
            <div className="max-h-[calc(100%-52px)] overflow-y-auto pb-4">
              {searchResults.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-4 py-12 text-center">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                  {hasSearched && (searchMode === "individual" || searchMode === "corporation") ? (
                    <div className="mt-3">
                      <p className="text-base font-medium text-foreground">
                        일치하는 토지 정보가 없습니다
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        입력하신 성명과 주민번호 앞자리로<br />
                        등록된 편입 토지를 찾을 수 없습니다.<br />
                        정보를 다시 확인해 주세요.
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-base text-muted-foreground">
                      {(searchMode === "individual" || searchMode === "corporation") 
                        ? "소유자 정보를 입력하고\n검색 버튼을 클릭하세요."
                        : "행정구역을 선택하고\n검색 버튼을 클릭하세요."}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <ul>
                    {searchResults.map((land, index) => {
                      const isOwned = ownedParcels.has(land.id);
                      const isFirstResult = index === 0; // 첫번째 결과는 기본적으로 본인 소유로 간주
                      const hasAiResult = parcelAiResults.has(land.id);
                      const landAiResult = parcelAiResults.get(land.id);
                      
                      const isHovered = land.id === hoveredParcelId;
                      
                      return (
                        <li key={land.id} className="border-b border-border">
                          <div
                            onMouseEnter={() => setHoveredParcelId(land.id)}
                            onMouseLeave={() => setHoveredParcelId(null)}
                            className={`flex w-full items-center gap-2 px-3 py-3 transition-all duration-150 ${
                              isHovered
                                ? "border-l-4 border-l-blue-500 bg-blue-50"
                                : selectedLand?.id === land.id 
                                  ? "border-l-4 border-l-primary bg-primary/5" 
                                  : isOwned
                                    ? "bg-green-50/50"
                                    : "hover:bg-muted/50"
                            }`}
                          >
                            {/* 필지 정보 버튼 */}
                            <button
                              onClick={() => handleLandSelect(land)}
                              className="flex flex-1 cursor-pointer items-center justify-between text-left"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm ${
                                      !(isOwned || (isFirstResult && !ownedParcels.size)) 
                                        ? "text-muted-foreground" 
                                        : ""
                                    }`}>
                                      {land.address}
                                    </span>
                                  {/* AI 판독 완료 뱃지 */}
                                  {hasAiResult && (
                                    <Badge 
                                      className={`text-xs px-1.5 py-0 text-white ${
                                        landAiResult?.provisionalJudgment === "수용가능" 
                                          ? JUDGMENT_COLORS.수용가능.bg 
                                          : landAiResult?.provisionalJudgment === "수용불가"
                                            ? JUDGMENT_COLORS.수용불가.bg
                                            : "bg-amber-500"
                                      }`}
                                    >
                                      {landAiResult?.provisionalJudgment}
                                    </Badge>
                                  )}
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>잔여 {land.remainingArea.toLocaleString()}㎡</span>
                                  <span>|</span>
                                  <span>{land.landType}</span>
                                </div>
                              </div>
                              <ChevronRight className={`h-5 w-5 shrink-0 ${
                                selectedLand?.id === land.id ? "text-primary" : "text-muted-foreground"
                              }`} />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  

                </>
              )}
            </div>

              {/* 페이지네이션 */}
              {searchResults.length > 0 && (
              <div className="absolute bottom-0 left-0 flex w-[320px] items-center justify-center gap-1 border-t bg-background py-3">
                {(() => {
                  const totalPages = Math.ceil(searchResults.length / itemsPerPage);
                  if (totalPages <= 1) return null;
                  
                  return (
                    <>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button 
                          key={page}
                          size="sm" 
                          className={`h-8 w-8 p-0 ${currentPage === page ? "bg-[#222222] hover:bg-[#333333]" : ""}`}
                          variant={currentPage === page ? "default" : "ghost"}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  );
                })()}
              </div>
              )}

            </div>
          </div>

          {/* 기본정보 패널 (선택된 토지 정보) - 슬라이드 */}
          {selectedLand && (
          <div className="relative flex h-full">
            {/* 패널 본체 */}
            <div className={`flex h-full flex-col border-l bg-background transition-all duration-300 overflow-hidden ${isBasicInfoCollapsed ? "w-0 border-l-0" : "w-[440px]"}`}>
            {/* 헤더 */}
            <div className="flex shrink-0 items-center justify-between border-b bg-muted px-4 py-3">
              <span className="text-base font-medium text-foreground">기본정보</span>
            </div>
            
            {/* 컨텐츠 */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {/* 토지 기본 정보 + 현재 활용 지목 통합 */}
                <div className="rounded border border-border bg-muted/30 p-3">
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">잔여 면적</span>
                      <span className="font-medium text-primary">{selectedLand.remainingArea.toLocaleString()}m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">잔여 비율</span>
                      <span className={`font-bold ${selectedLand.remainingRatio <= 30 ? "text-primary" : "text-foreground"}`}>
                        {selectedLand.remainingRatio}%
                      </span>
                    </div>
                    {/* 현재 활용 지목 선택 */}
                    {!noIncludedLand && !aiResult && (
                      <div className="border-t border-border pt-3">
                        <div className="mb-2 flex items-center justify-between">
                          <Label htmlFor="currentUsage" className="text-sm font-medium">
                            현재 활용 지목 <span className="text-orange-500">*</span>
                          </Label>
                          <span className="text-xs text-muted-foreground">
                            공부상 지목: <span className="font-medium text-foreground">{getLandUsageLabel(selectedLand.landCategory)}</span>
                          </span>
                        </div>
                        <LandUsageSelect
                          value={currentUsage}
                          onValueChange={(value) => {
                            setCurrentUsage(value);
                            if (value !== "대") setLandSubType("");
                          }}
                        />
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          실제 토지 활용 상황에 따라 선택해 주세요.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 편입토지 없음 경고 */}
                {noIncludedLand && (
                  <div className="rounded border border-destructive bg-destructive/5 p-3">
                    <div className="flex items-center gap-2">
                      <Ban className="h-4 w-4 text-destructive" />
                      <span className="text-base font-medium text-destructive">편입토지 없음 - 매수 가능성 낮음</span>
                    </div>
                  </div>
                )}

                {/* 택지 세부 유형 선택 - 현재 활용 지목이 "대"인 경우 */}
                {!noIncludedLand && !aiResult && currentUsage === "대" && (
                  <div className="rounded border border-border bg-muted/30 p-3">
                    <Label htmlFor="landSubType" className="mb-2 block text-sm font-medium">
                      건축물 용도 선택 <span className="text-orange-500">*</span>
                    </Label>
                    <Select value={landSubType} onValueChange={(value) => setLandSubType(value as typeof landSubType)}>
                      <SelectTrigger id="landSubType" className="h-10 w-full bg-background">
                        <SelectValue placeholder="건축물 용도를 선택해 주세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential-detached">주거용 - 단독주택 (기준: 90㎡)</SelectItem>
                        <SelectItem value="residential-multi">주거용 - 연립/다세대 (기준: 165㎡)</SelectItem>
                        <SelectItem value="residential-apartment">주거용 - 아파트 (기준: 60㎡)</SelectItem>
                        <SelectItem value="commercial">상업용 (기준: 150㎡)</SelectItem>
                        <SelectItem value="industrial">공업용 (기준: 330㎡)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      택지 유형에 따라 매수 기준 면적이 달라집니다.
                    </p>
                  </div>
                )}

                {/* AI 판독 결과 - 복수 필지 통합 뷰 (선택된 필지가 AI 판독된 경우에만 표시) */}
                {parcelAiResults.size > 0 && aiResult && (
                  <div className="space-y-4">
                    {/* 선택된 필지 상세 결과 */}
                    {aiResult && selectedLand && (
                      <div className={`rounded-lg border-2 p-4 ${
                        aiResult.provisionalJudgment === "수용가능" 
                          ? `${JUDGMENT_COLORS.수용가능.border} ${JUDGMENT_COLORS.수용가능.bgLight}` 
                          : aiResult.provisionalJudgment === "심의위원회 이관"
                            ? `${JUDGMENT_COLORS.이관.border} ${JUDGMENT_COLORS.이관.bgLight}`
                            : `${JUDGMENT_COLORS.수용불가.border} ${JUDGMENT_COLORS.수용불가.bgLight}`
                      }`}>
                        {/* 헤더 */}
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <span className="text-lg font-semibold">상세 판독 결과</span>
                            <p className="text-sm text-muted-foreground mt-0.5">{selectedLand.address}</p>
                          </div>
                          <Badge 
                            className={`px-2 py-1 text-sm font-semibold text-white ${
                              aiResult.provisionalJudgment === "수용가능" || aiResult.provisionalJudgment === "매수 가능성 높음"
                                ? JUDGMENT_COLORS.수용가능.bg 
                                : aiResult.provisionalJudgment === "심의위원회 이관"
                                  ? JUDGMENT_COLORS.이관.bg
                                  : JUDGMENT_COLORS.수용불가.bg
                            }`}
                          >
                            {aiResult.provisionalJudgment === "수용가능" || aiResult.provisionalJudgment === "매수 가능성 높음" ? "매수 가능성 높음" : aiResult.provisionalJudgment === "심의위원회 이관" ? "심의위원회 이관" : "매수 가능성 낮음"}
                          </Badge>
                        </div>

                    {/* 내용 - 신청현황조회와 동일한 순서 */}
                    <div className="space-y-4">
                      {/* 판단 요약 */}
                      {aiResult.judgmentRationale && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0 text-primary" />
                            <h4 className="text-base font-semibold text-foreground">판단 요약</h4>
                          </div>
                          <p className="text-base leading-relaxed text-muted-foreground">{aiResult.judgmentRationale.summary}</p>
                        </div>
                      )}

                      {/* 법적 근거 */}
                      {aiResult.judgmentRationale && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Scale className="h-4 w-4 shrink-0 text-amber-500" />
                            <h4 className="text-base font-semibold text-foreground">법적 근거</h4>
                          </div>
                          <p className="text-base leading-relaxed text-muted-foreground">{aiResult.judgmentRationale.legalBasis}</p>
                        </div>
                      )}

                      {/* 적용 기준 */}
                      {aiResult.judgmentRationale && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                            <h4 className="text-base font-semibold text-foreground">적용 기준</h4>
                          </div>
                          <ul className="space-y-1">
                            {aiResult.judgmentRationale.appliedCriteria.map((criteria, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 text-base text-muted-foreground">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                                <span>{criteria}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 수동 확인 항목 */}
                      {aiResult.judgmentRationale?.manualCheckItems && aiResult.judgmentRationale.manualCheckItems.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                            <h4 className="text-base font-semibold text-foreground">수동 확인 항목</h4>
                          </div>
                          <ul className="space-y-1">
                            {aiResult.judgmentRationale.manualCheckItems.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-1.5 text-base text-muted-foreground">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 상세 분석 */}
                      {aiResult.judgmentRationale?.detailedExplanation && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <h4 className="text-base font-semibold text-foreground">상세 분석</h4>
                          </div>
                          <pre className="whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
                            {aiResult.judgmentRationale.detailedExplanation}
                          </pre>
                        </div>
                      )}

                      {/* 안내 문구 */}
                      <div className="flex items-center gap-2 pt-2">
                        <Info className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <p className="text-base text-muted-foreground">
                          AI 판독 결과는 참고용이며, 최종 판정은 담당자 검토에 따라 결정됩니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
            </div>
            
            {/* AI 판독 버튼 - 하단 고정 (AI 결과 없을 때) */}
            {!aiResult && !noIncludedLand && (
              <div className="shrink-0 border-t bg-background p-3">
                <Button 
                  onClick={handleAIAnalysis}
                  className="h-12 w-full gap-2 text-base"
                  variant="default"
                  disabled={aiAnalyzing || !currentUsage || (currentUsage === "대" && !landSubType) || !selectedLand}
                >
                  {aiAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      필지 판독 중...
                    </>
                  ) : (
                    <>
                      <AIIcon className="h-5 w-5" />
                      AI 판독 실행
                    </>
                  )}
                </Button>
                {(!currentUsage || (currentUsage === "대" && !landSubType)) && (
                  <p className="mt-1.5 text-center text-xs text-muted-foreground">
                    활용 지목을 선택하세요
                  </p>
                )}
              </div>
            )}
            
            {/* 신청 목록 추가 버튼 - 하단 고정 */}
            {aiResult && (
              <div className="shrink-0 border-t bg-background p-3">
                {(() => {
                  const isAlreadyInCart = cartItems.some(item => item.landInfo.id === selectedLand.id);
                  
                  if (isAlreadyInCart) {
                    return (
                      <div className="space-y-2">
                        <div className="flex h-[38px] items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                          <span className="text-sm font-medium text-primary">신청 목록에 추가됨</span>
                        </div>
                        <Button 
                          onClick={() => onRemoveFromCart(selectedLand.id)}
                          variant="destructive"
                          className="h-12 w-full text-base"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          신청 목록에서 제거
                        </Button>
                      </div>
                    );
                  }
                  
                  if (aiResult.provisionalJudgment !== "수용불가") {
                    const isAlreadyInCart = cartItems.some(c => c.landInfo.id === selectedLand.id);
                    
                    return (
                      <div className="space-y-2">
                        <Button
                          onClick={() => onAddToCart(selectedLand, aiResult!)}
                          className="h-12 w-full cursor-pointer text-base"
                          variant="default"
                          disabled={isAlreadyInCart}
                        >
                          <Plus className="mr-2 h-6 w-6" />
                          신청 목록에 추가
                        </Button>
                        {isAlreadyInCart && (
                          <p className="text-center text-xs text-muted-foreground">
                            이미 신청 목록에 추가된 필지입니다
                          </p>
                        )}
                      </div>
                    );
                  }
                  
                  // 잔여 면적이 0인 경우: 잔여지가 없으므로 신청 자체가 불가
                  if (selectedLand.remainingArea === 0) {
                    return (
                      <div className="space-y-2">
                        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center">
                          <p className="text-sm font-medium text-red-600">
                            잔여지가 없어 매수 신청이 불가합니다
                          </p>
                          <p className="mt-1.5 text-xs text-red-600">
                            본 토지는 전체가 공익사업에 편입되어 잔여지가 존재하지 않습니다.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  
                  // 그 외 수용불가 케이스: 기준 미충족이지만 신청은 가능
                  return (
                    <div className="space-y-2">
                      <div className="rounded bg-muted/50 p-2 text-center">
                        <p className="text-sm font-medium text-muted-foreground">
                          AI 분석 결과 매수 기준에 충족하지 않습니다
                        </p>
                      </div>
                      <button
                        onClick={() => onAddToCart(selectedLand, aiResult!)}
                        className="w-full cursor-pointer py-1 text-xs text-muted-foreground/60 underline-offset-2 transition-colors hover:text-muted-foreground hover:underline"
                      >
                        그래도 신청 목록에 추가하기
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
            </div>
            {/* 기본정보 토글 버튼 - 패널 오른쪽 모서리에 배치 */}
            <button 
              onClick={() => setIsBasicInfoCollapsed(!isBasicInfoCollapsed)}
              className="absolute top-1/2 -right-6 z-20 flex h-12 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-r-md bg-background shadow-md"
            >
              <ChevronLeft className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${isBasicInfoCollapsed ? "rotate-180" : ""}`} />
            </button>
          </div>
          )}
        </div>

      </div>

      {/* 장바구니 플로팅 버튼 */}
      {cartItems.length > 0 && !isCartOpen && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 animate-float items-center gap-2 rounded-full bg-primary px-5 text-white shadow-lg transition-all hover:animate-none hover:bg-primary/90 hover:shadow-xl"
        >
          <ClipboardList className="h-5 w-5" />
          <span className="font-medium">신청 목록</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-primary">
            {cartItems.length}
          </span>
        </button>
      )}

      {/* 장바구니 슬라이드 패널 */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* 오버레이 */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setIsCartOpen(false)}
          />
          
          {/* 패널 */}
          <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-background shadow-2xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b px-4 py-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">신청 목록</h2>
                <Badge variant="secondary">{cartItems.length}건</Badge>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* 관할기관별 그룹핑된 목록 */}
            <div className="flex-1 overflow-y-auto">
              {(() => {
                // 관할기관별로 그룹핑
                const groupedByBusinessUnit = cartItems.reduce((acc, item) => {
                  const businessUnit = item.businessUnit || "수도권";
                  
                  if (!acc[businessUnit]) {
                    acc[businessUnit] = [];
                  }
                  acc[businessUnit].push(item);
                  return acc;
                }, {} as Record<string, ApplicationCartItem[]>);

                const businessUnits = Object.keys(groupedByBusinessUnit);
                const hasMultipleJurisdictions = businessUnits.length > 1;

                if (businessUnits.length === 0) {
                  return (
                    <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                      <ClipboardList className="mb-2 h-12 w-12 opacity-30" />
                      <p>신청 목록이 비어 있습니다</p>
                      <p className="mt-1 text-sm">토지를 검색하여 추가해 주세요</p>
                    </div>
                  );
                }

// 전체 선택 여부 계산
                const allSelected = cartItems.length > 0 && cartItems.every(item => selectedCartItems.has(item.id));
                return (
                  <div className="space-y-4 p-4">
                    {/* 여러 관할기관이 있을 때 상단 안내 */}
                    {hasMultipleJurisdictions && (
                      <div className="rounded-lg border border-warning/50 bg-warning/5 p-3">
                        <p className="flex items-start gap-2 text-sm text-warning">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>
                            <strong>{businessUnits.length}개 관할기관</strong>의 토지가 있습니다.
                            각 관할기관별로 별도 신청이 필요합니다.
                          </span>
                        </p>
                      </div>
                    )}
                    {businessUnits.map((businessUnit) => {
                      const items = groupedByBusinessUnit[businessUnit];
                      const selectedInUnit = items.filter(item => selectedCartItems.has(item.id));
                      const allSelectedInUnit = items.length > 0 && items.every(item => selectedCartItems.has(item.id));
                      
                      return (
                        <div key={businessUnit} className="rounded-lg border bg-card">
                          {/* 관할기관 헤더 */}
                          <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={allSelectedInUnit}
                                onCheckedChange={(checked) => {
                                  const newSelected = new Set(selectedCartItems);
                                  if (checked) {
                                    items.forEach(item => newSelected.add(item.id));
                                  } else {
                                    items.forEach(item => newSelected.delete(item.id));
                                  }
                                  setSelectedCartItems(newSelected);
                                }}
                              />
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{businessUnit} 관할기관</span>
                                <Badge variant="outline" className="text-xs">{items.length}필지</Badge>
                              </div>
                            </div>
                            {selectedInUnit.length > 0 && (
                              <span className="text-xs text-primary">{selectedInUnit.length}건 선택</span>
                            )}
                          </div>
                          
                          {/* 해당 지역 토지 목록 */}
                          <div className="divide-y">
                            {items.map((item) => {
                              const isSelected = selectedCartItems.has(item.id);
                              return (
                                <div 
                                  key={item.id} 
                                  className={`flex items-start gap-3 p-3 transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      const newSelected = new Set(selectedCartItems);
                                      if (checked) {
                                        newSelected.add(item.id);
                                      } else {
                                        newSelected.delete(item.id);
                                      }
                                      setSelectedCartItems(newSelected);
                                    }}
                                    className="mt-0.5 h-5 w-5 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{item.landInfo.address}</p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                      <span>잔여: {item.landInfo.remainingArea.toLocaleString()}㎡</span>
                                      <span>|</span>
                                      <span>{item.landInfo.landType}</span>
                                      <Badge 
                                        className={`text-xs text-white ${item.aiResult.provisionalJudgment === "수용가능" || item.aiResult.provisionalJudgment === "매수 가능성 높음" ? JUDGMENT_COLORS.수용가능.bg : JUDGMENT_COLORS.수용불가.bg}`}
                                      >
                                        {item.aiResult.provisionalJudgment === "수용가능" || item.aiResult.provisionalJudgment === "매수 가능성 높음" ? "매수 가능성 높음" : "매수 가능성 낮음"}
                                      </Badge>
                                    </div>
                                  </div>
                                  {/* 삭제 버튼 */}
                                  <button
                                    onClick={() => onRemoveFromCart(item.id)}
                                    className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* 이 관할기관 선택 필지 신청하기 버튼 */}
                          <div className="border-t p-3">
                            <Button 
                              onClick={() => {
                                if (selectedInUnit.length > 0) {
                                  onSubmitCart(selectedInUnit);
                                  setIsCartOpen(false);
                                  // 신청 완료된 항목 선택 해제
                                  const newSelected = new Set(selectedCartItems);
                                  selectedInUnit.forEach(item => newSelected.delete(item.id));
                                  setSelectedCartItems(newSelected);
                                }
                              }}
                              className="w-full"
                              disabled={selectedInUnit.length === 0}
                            >
                              {selectedInUnit.length > 0 
                                ? `선택한 ${selectedInUnit.length}건 신청하기`
                                : "항목을 선택해 주세요"}
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                );
              })()}
            </div>

            {/* 하단 요약 */}
            {cartItems.length > 0 && (
              <div className="border-t bg-muted/30 px-4 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    총 {cartItems.length}필지
                  </span>
                  <button
                    onClick={() => {
                      cartItems.forEach(item => onRemoveFromCart(item.id));
                      setSelectedCartItems(new Set());
                    }}
                    className="text-sm text-muted-foreground hover:text-destructive"
                  >
                    전체 삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
