# AI 인프라 병목 밸류체인 대시보드

AI 데이터센터 확산에서 발생하는 전력, 메모리, HBM, GPU, ASIC, CoWoS, Foundry, Optical, Server ODM/OEM 병목을 공개 출처 기반으로 추적하기 위한 독립 리서치 대시보드입니다.

## 목적

- AI 인프라 밸류체인의 병목 지표를 원천 데이터 중심으로 정리합니다.
- 데이터 출처, 기준일, 신뢰도, 산식, N/A 상태를 화면에 노출합니다.
- HTML 안에 분석 수치를 직접 넣지 않고 `data/*.csv`와 `data/segments.json`에서만 읽습니다.
- 부족한 데이터는 임의 보정하지 않고 `N/A` 또는 `insufficient_data`로 유지합니다.

## 폴더 구조

```text
AI-Bottleneck/
  index.html
  README.md
  data/
    raw_metrics.csv
    source_notes.csv
    supply_demand.csv
    price_indicators.csv
    manual_scores.csv
    bottleneck_scores.csv
    companies.csv
    market_reaction.csv
    segments.json
  scripts/
    transform_raw_metrics.py
    update_scores.py
    update_stocks.py
    validate_data.py
  logs/
```

## 데이터 우선순위

1. 회사 IR, 연차보고서, SEC filing, 공식 실적 발표
2. 국제기구 및 공공기관 보고서
3. 유료/공개 시장조사기관의 공개 요약
4. Reuters 등 뉴스 wire
5. 사용자 수동 입력 파일

사용자 수동 입력 파일에서 가져온 값은 원문 링크 또는 파일 경로를 남기고, 검증 전에는 confidence를 낮춰 둡니다.

## 금지 원칙

- 출처 없는 숫자 금지
- 임의 계산값의 HTML 직접 입력 금지
- 실패한 ticker의 주가 데이터 생성 금지
- 좌표, 수급, 가격, 점수의 임의 보정 금지
- qualitative note를 숫자 점수로 강제 변환 금지

## 실행 방법

```powershell
cd C:\Users\kcgi\Desktop\KCGI\AI-Bottleneck
python scripts\transform_raw_metrics.py
python scripts\update_scores.py
python scripts\validate_data.py
python -m http.server 8000
```

브라우저에서 아래 주소를 엽니다.

```text
http://localhost:8000
```

현재 PC처럼 Python 실행 파일이 설치되어 있지 않고 Node.js만 있는 경우에는 아래 보조 파이프라인을 사용할 수 있습니다.

```powershell
node scripts\run_pipeline.mjs
node scripts\serve.mjs
```

## 주가 업데이트

`data/bloomberg_prices.csv`가 있으면 그 파일을 우선 사용합니다. 없으면 `yfinance`가 설치된 경우 Yahoo Finance에서 가격을 가져옵니다.

```powershell
python scripts\update_stocks.py
python scripts\update_scores.py
python scripts\validate_data.py
```

`yfinance`가 없거나 ticker 다운로드가 실패하면 해당 ticker는 생성하지 않고 `logs/stock_update_warnings.log`에 경고를 남깁니다.

## 파생 파일 정책

- `source_notes.csv`: `raw_metrics.csv`의 출처를 집계합니다.
- `supply_demand.csv`: 지정된 demand/supply metric만 분리합니다.
- `price_indicators.csv`: 가격, 프리미엄, margin 관련 지표만 분리합니다.
- `bottleneck_scores.csv`: 필수 컴포넌트가 모두 있을 때만 `total_score`를 계산합니다.

필수 컴포넌트가 부족하면 `total_score`는 비워 두고 `available_component_avg`만 참고용으로 표시합니다.

## 현재 seed 출처

- IEA Energy and AI
- NVIDIA Q1 FY2027 results
- Micron FQ1 2026 prepared remarks
- TrendForce advanced packaging article
- TSMC 2025 Annual Report
- LightCounting April 2026 forecast note
- Dell Q1 FY2027 results
- Broadcom FY2025 results
- Marvell FY2026 results
- Reuters / Morgan Stanley chipflation reporting
