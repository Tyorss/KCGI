# NeoCloud Infrastructure Dashboard

네오클라우드와 AI infrastructure 프로젝트를 추적하기 위한 MVP 리서치 대시보드입니다. UI는 한국어를 기본으로 하고, TypeScript field와 JSON key는 영어를 유지합니다.

## 실행 방법

PowerShell 실행 정책 때문에 `npm` 대신 `npm.cmd`를 쓰는 편이 안전합니다.

```powershell
cd C:\Users\kcgi\Desktop\KCGI\NeoCloud
npm.cmd install
npm.cmd run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

검증 명령:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

## 데이터 구성

- `src/data/projects.json`: source-indexed 프로젝트 seed data 20개
- `src/data/contracts.json`: 계약 seed data 11개
- `neocloud_mvp_seed_data/SOURCE_INDEX.md`: 주요 source URL과 구현 메모
- `src/types/project.ts`: `Project`, `ContractRecord`, filter, KPI, company metric 타입 정의
- `src/lib/project-utils.ts`: 필터, 집계, formatter, display label mapping

## 화면 구성

- KPI 카드
- 프로젝트 필터
- OpenStreetMap 기반 프로젝트 지도
- 기업별 peer summary
- 프로젝트 pipeline table
- 좌표 확인 필요 / Needs Geocoding table
- 계약 백로그 / Backlog table

## 데이터 원칙

현재 seed dataset은 회사 발표, SEC exhibit, Reuters/AP 보도, 회사 product/hardware page를 섞은 MVP 데이터입니다. 투자·리서치 활용 전 모든 재무, GPU, 전력, 계약, 위치 데이터는 원문 source로 재확인해야 합니다.

좌표가 없는 프로젝트는 지도에 표시하지 않습니다. 해당 행은 `좌표 확인 필요 / Needs Geocoding` 섹션에 보존됩니다.

## 포함된 주요 프로젝트

- IREN Childress / Microsoft GB300
- Nebius Vineland / Microsoft dedicated AI infrastructure
- Nebius hardware regions and Meta dedicated capacity contract
- CoreWeave Lancaster PA AI infrastructure commitment
- Applied Digital Ellendale / CoreWeave lease
- TeraWulf Lake Mariner / Fluidstack / Google backstop
- Cipher Barber Lake / Fluidstack / Google backstop
- Crusoe Abilene / Oracle / OpenAI and Microsoft expansion context
- Lambda Kansas City, Prime LAX01, ECL MV1, Aligned DFW-04, HRT deal
- Hut 8 River Bend and Beacon Point
- Core Scientific Austin and multi-site CoreWeave contracts

## 좌표 업데이트 방법

1. 신뢰 가능한 source에서 위치를 확인합니다.
2. 좌표가 site-level이면 `locationAccuracy`를 `exact_site`로 설정합니다.
3. 도시만 확인되면 `city_level`, 카운티만 확인되면 `county_level`, 주만 확인되면 `state_level`을 사용합니다.
4. 좌표를 확인하지 못하면 `latitude`, `longitude`를 비워두고 `unknown`으로 둡니다.

## Confidence Score 해석

- `65점 이상`: 상대적으로 높은 신뢰도. 그래도 원문 source 확인 필요.
- `45~64점`: 중간 신뢰도. 일부 수치 또는 위치가 간접 추정일 수 있음.
- `44점 이하`: 낮은 신뢰도. 루머, LOI, 불완전 위치, 미검증 contract 가능성이 큼.

## 향후 교체 경로

- source audit trail과 change log
- geocoding workflow for missing locations
- company IR, SEC filings, Reuters, press release ingestion
- valuation layer using market cap, EV, backlog, and revenue
- map layers for power sites, data center sites, and customer-linked projects
- Korean research memo generation
