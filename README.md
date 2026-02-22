# JIRA PMS Dashboard

구축형(On-Premise) JIRA Server/Data Center 환경에서 프로젝트 진척도와 팀/구성원별 업무 효율성을 트래킹하는 Chrome Extension 대시보드입니다.

## 주요 기능

- **프로젝트 진행률 시각화** — Epic 기반 To Do / 진행중 / 완료 스택 바 차트
- **효율성 지표** — OTDR(마감일 준수율), AOD(평균 지연 일수) 자동 계산
- **팀/구성원 관리** — 팀 구성, 구성원 등록, JIRA 계정 자동/수동 매핑
- **팀별 효율성 비교** — 팀 단위 OTDR/AOD 집계 차트
- **구성원 랭킹** — OTDR 기준 효율성 랭킹 테이블
- **백그라운드 자동 동기화** — 설정 주기에 따라 JIRA 데이터 자동 갱신
- **완전 로컬** — 별도 백엔드 없이 브라우저 IndexedDB에 데이터 저장

## 기술 스택

| 기술 | 용도 |
|------|------|
| React 19 + TypeScript | UI 프레임워크 |
| Vite + CRXJS | Chrome Extension (Manifest V3) 빌드 |
| Dexie.js | IndexedDB 로컬 데이터베이스 |
| dayjs (timezone) | KST(Asia/Seoul) 날짜 변환 |
| Recharts | 차트 시각화 |
| Tailwind CSS | 스타일링 |

## 요구사항

- **Chrome** 110 이상 (Manifest V3 지원)
- **구축형 JIRA Server/Data Center** 8.14 이상 (PAT 지원 필수)
- JIRA **Personal Access Token (PAT)**

## 빌드 및 설치

### 소스에서 빌드

```bash
# 의존성 설치
npm install

# 개발 모드 (HMR)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 + zip 패키징
npm run package
```

### Chrome에 설치

1. `npm run build` 실행 (또는 배포된 zip 파일 압축 해제)
2. `chrome://extensions` 접속
3. **개발자 모드** 활성화
4. **압축해제된 확장 프로그램을 로드합니다** 클릭
5. `dist/` 폴더 (또는 압축 해제한 폴더) 선택

## 프로젝트 구조

```
src/
├── background/          # MV3 Service Worker (알람, 동기화)
├── newtab/              # 대시보드 (새 탭 오버라이드)
├── options/             # 설정 페이지 (PAT, JIRA URL)
├── components/
│   ├── dashboard/       # 차트, 랭킹 테이블, 요약 카드
│   ├── team/            # 팀/구성원 관리, 매핑 대기열
│   ├── options/         # PAT 입력, 연결 테스트
│   └── shared/          # 공통 컴포넌트
├── db/
│   ├── models/          # Project, Unit, Worker, Team, Member
│   └── repositories/   # Dexie Repository 패턴
├── services/
│   ├── jira/            # API 클라이언트, 어댑터, 데이터 매퍼
│   ├── sync/            # 동기화 오케스트레이터
│   ├── identity/        # JIRA ↔ 구성원 매핑
│   └── storage/         # chrome.storage 추상화
├── business/
│   ├── strategies/      # 효율성 계산 (Strategy 패턴)
│   └── metrics/         # 프로젝트/구성원/팀 지표
├── hooks/               # React Custom Hooks
└── utils/               # KST 타임존, 상수
```

## 주요 지표

| 지표 | 설명 |
|------|------|
| **OTDR** | On-Time Delivery Rate. 마감일이 있는 완료 이슈 중 기한 내 해결 비율 (0~100%) |
| **AOD** | Average Overdue Days. 마감일 초과 이슈들의 평균 지연 일수 |

- 모든 날짜는 **KST (Asia/Seoul)** 기준으로 계산
- 마감일(`dueDate`)은 해당일 23:59:59 KST로 처리
- 마감일이 없는 이슈는 OTDR/AOD 계산에서 제외

## 데이터 및 보안

- 모든 데이터는 브라우저 **IndexedDB**에 로컬 저장 (외부 서버 전송 없음)
- PAT는 `chrome.storage.local`에 저장 (해당 확장프로그램만 접근 가능)
- JIRA REST API v2 호출 외 어떠한 외부 통신도 없음

## 상세 가이드

설치, 초기 설정(PAT 발급, 팀 구성, 매핑), 대시보드 사용법, 문제 해결 등 자세한 내용은 [GUIDE.md](GUIDE.md)를 참고하세요.

## License

MIT
