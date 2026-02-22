# [Claude Code Task Brief] JIRA PAT 기반 관리자용 PMS (Chrome Extension) 통합 개발

## 1. Context (맥락)
- **목적**: 관리자가 자신의 JIRA PAT(Personal Access Token)를 활용하여 프로젝트 진척도 및 작업자별 업무 효율을 트래킹하는 PMS 구축.
- **배포 환경**: 관리자 PC 로컬 환경에 최적화된 **Chrome Extension (React + TypeScript 기반)** 형태. 별도의 백엔드 서버(Node/Python) 및 외부 DB를 사용하지 않는 Serverless 구조.
- **타임존 제약**: 시스템의 모든 날짜 기준 및 지연 일수 계산은 **한국 표준시(KST, Asia/Seoul)**를 따름.

## 2. Objective (구현 목표 및 구조)
1. **Chrome Extension 세팅 (Manifest V3)**: 
   - `host_permissions`를 통해 JIRA API CORS 우회.
   - `chrome.storage.local`에 JIRA 도메인 및 PAT 안전 저장.
2. **로컬 DB (IndexedDB / Dexie.js) 구현**: 
   - PostgreSQL을 대체하여 브라우저 내부에 `projects(Epic)`, `units(Issue)`, `workers(Assignee)` 테이블 스키마 구성.
3. **JIRA API 동기화 어댑터 (`src/services/JiraAdapter.ts`)**: 
   - JIRA REST API 통신 및 페이징(Pagination) 처리 (maxResults 대응).
   - Background Service Worker를 통한 로컬 DB(IndexedDB) 동기화(Sync) 로직.
4. **업무 효율 산출 비즈니스 로직 (Strategy 패턴)**:
   - `DueDateStrategy`: JIRA의 `dueDate`(YYYY-MM-DD)를 KST 당일 23:59:59로 파싱.
   - KST 기준 `resolutionDate`와 비교하여 '마감일 준수율(OTDR)' 및 '평균 지연 일수(AOD)' 계산.
   - `dueDate`가 없는 이슈의 엣지 케이스 방어 로직 적용.
5. **UI/UX 구현 (React + Tailwind + Recharts)**: 
   - 설정(Options) 페이지: PAT 및 JIRA URL 입력.
   - 대시보드(Dashboard) 페이지: 크롬 새 탭(Full-Page) 화면으로 열리며, 프로젝트별 진행률 바 차트 및 작업자 효율성 랭킹 렌더링.

## 3. Constraints (제약 사항 및 원칙)
- **SOLID 원칙**: React 컴포넌트(View) 내부에 API 통신 로직이나 복잡한 계산 로직(Business)을 섞지 말 것. 반드시 Service/Repository 계층으로 분리(SRP, DIP 준수).
- **시간 정합성 (KST)**: `dayjs` 또는 `date-fns-tz` 라이브러리를 사용하여 KST 타임존을 명시적으로 강제할 것. JIRA API가 반환하는 UTC/로컬 타임존에 의존하지 않음.
- **성능 고려**: 대시보드 렌더링 시 JIRA API를 실시간으로 호출하지 않음. 반드시 IndexedDB에 캐싱된 데이터만 읽어와 통계를 계산하여 렌더링 속도 최적화.

## 4. Implementation Steps (구현 단계)
- **Step 1**: Vite/Webpack 기반 React Chrome Extension 보일러플레이트 구성 및 `manifest.json` 작성.
- **Step 2**: Dexie.js를 활용한 IndexedDB 스키마(모델) 정의 및 Repository 클래스 작성.
- **Step 3**: PAT를 활용한 JIRA API Fetcher 모듈 구현 및 데이터 파싱 -> Dexie DB 적재(Upsert) 동기화 로직 구현.
- **Step 4**: `dayjs` 등을 활용한 KST 변환 유틸리티 및 효율성 계산(OTDR, AOD) 핵심 비즈니스 로직(Strategy) 구현.
- **Step 5**: React 컴포넌트 구현 (설정 페이지 및 Full-Page 대시보드) 및 Recharts 연동.

위 아키텍처(서버리스 크롬 확장프로그램 기반 로컬 연동) 및 KST 타임존 룰을 완벽히 이해했다면, Step 1의 프로젝트 초기 설정 및 manifest 파일 작성부터 코드 출력을 시작하세요.