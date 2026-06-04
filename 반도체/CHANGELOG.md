# AI Semiconductor Dashboard Changelog

## 2026-06-04

- CAGR 표시를 `sourceCagr`와 displayed endpoint 기준 `calculatedCagr`로 분리했습니다.
- `cagrConsistencyFlag`와 Data Quality Warnings 패널을 추가했습니다.
- DRAM, HBM, NAND, ABF, AI Optical Device 등 source CAGR과 calculated CAGR 차이가 큰 항목을 warning으로 표시합니다.
- `marketLevel` taxonomy를 추가했습니다: Total market, Sub-market, Product segment, Technology option, Scenario / SAM, Roadmap market.
- HBM 점유율을 snapshot selector로 분리했습니다.
  - `2Q25 Counterpoint`
  - `2026 latest`
  - `Show all snapshots`
- HBM share와 FY company financials가 같은 개념처럼 보이지 않도록 financial period와 share period/source를 별도 컬럼으로 분리했습니다.
- KRW/USD/TWD 재무 수치 표시를 mn 단위 대신 `tn` 또는 `bn` 단위로 축약했습니다.
- Glass-core substrate와 CPO bull case가 headline 확정값처럼 보이지 않도록 market level, confidence, scenario badge를 강화했습니다.
- Valuation burden이 risk score임을 heatmap 하단 caveat에 명시했습니다.
