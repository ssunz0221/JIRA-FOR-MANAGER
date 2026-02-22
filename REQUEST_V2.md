# [Claude Code Task Brief] JIRA PAT 기반 관리자용 PMS (Chrome Ext. + Team Management)

## 1. Context (맥락)
- **목적**: 관리자가 자신의 JIRA PAT를 활용하여 프로젝트 진척도, 팀별/개인별 업무 효율을 트래킹하는 Serverless PMS 구축.
- **환경**: Chrome Extension (React + TypeScript + IndexedDB/Dexie.js).
- **핵심 추가 요건**: JIRA에는 조직도(팀 구성) 데이터가 없으므로, 확장프로그램 내부에서 관리자가 직접 '구성원(이메일, 닉네임)'과 '팀'을 생성하고, 이를 JIRA의 Assignee와 매핑하는 독립적인 HR 계층이 필요함.

## 2. Objective (구현 목표 및 DB 스키마)
1. **IndexedDB (Dexie.js) 스키마 고도화**:
   - `teams`: `id`(PK), `name`
   - `members`: `email`(PK), `jiraAccountId`(index), `nickname`, `teamId`(fk)
   - `epics`: `id`, `key`, `name`, `status`
   - `issues`: `id`, `epicId`, `assigneeAccountId`, `dueDate`, `resolutionDate`, `status`
2. **조직도 관리 UI 구현**:
   - 대시보드 내 [구성원 관리] 탭을 신설하여 팀 CRUD 및 구성원(이메일, 닉네임, JIRA Account ID) CRUD 기능 구현.
3. **IdentityMapper 로직 구현 (매핑)**:
   - JIRA API에서 이슈 동기화 시 반환되는 `assignee.accountId` 또는 `assignee.emailAddress`를 추출.
   - 로컬 `members` DB와 대조하여, 등록되지 않은 JIRA 작업자는 UI의 '매핑 대기열(Unmapped Users)'에 표시하여 관리자가 닉네임과 팀을 할당하도록 유도.
4. **팀/개인 단위 업무 효율 산출 (Strategy 패턴 + KST)**:
   - 모든 날짜는 KST(Asia/Seoul) 자정 기준으로 변환하여 계산 (`dayjs` 활용).
   - 기존의 개인별 효율(OTDR, AOD)에 더해, 구성원의 `teamId`를 기준으로 그룹핑(Group By)한 **팀별 업무 효율성 통계** 로직 추가.

## 3. Constraints (제약 사항 및 원칙)
- **의존성 분리 (SRP)**: JIRA 데이터 동기화(`SyncService`)와 로컬 조직도 매핑(`IdentityMapper`), 효율성 계산(`EfficiencyStrategy`) 로직을 완벽히 분리할 것.
- **비동기 조인(Join)**: IndexedDB는 RDBMS가 아니므로, 통계 산출 시 `issues` 스토어와 `members` 스토어 데이터를 메모리로 가져와 조인(Map/Reduce)하는 유틸리티 함수를 별도로 작성할 것.
- **방어적 프로그래밍**: JIRA API 응답에 `assignee`가 null이거나 `dueDate`가 null인 경우, 통계 로직이 크래시되지 않도록 예외 처리(Fallback) 필수.

## 4. Implementation Steps (구현 단계)
- **Step 1**: Vite Chrome Extension 템플릿 세팅 및 Dexie.js를 활용한 4개 테이블(`teams`, `members`, `epics`, `issues`) DB 초기화.
- **Step 2**: 팀 및 구성원 관리를 위한 React 컴포넌트(CRUD UI) 구현. (JIRA 연동 전 사전 구성 단계)
- **Step 3**: JIRA PAT 기반 API Fetcher 구현 및 `IdentityMapper` 작성 (JIRA Assignee <-> 로컬 Member 매핑 로직).
- **Step 4**: KST 타임존 기반 업무 효율 산출 로직 구현 (개인별 집계 및 팀별 집계 함수 작성).
- **Step 5**: Full-Page 대시보드 완성 (Recharts 기반 팀별 진행률/효율성 차트, 미매핑 작업자 알림 기능 포함).

요구사항의 논리적 흐름을 완벽히 파악했다면, Step 1의 프로젝트 스캐폴딩 및 Dexie.js 데이터베이스 모델 클래스 코드부터 작성해 주세요.