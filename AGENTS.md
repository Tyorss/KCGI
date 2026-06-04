# AGENTS.md

## Project Purpose

This repository is an MVP research dashboard for tracking neocloud and AI infrastructure projects.

The dashboard should prioritize:

- Data accuracy
- Clear source attribution
- Extensible data models
- Research-friendly UI
- Simple local development

## Target Users

The primary users are Korean-speaking investment and research professionals.

The dashboard should help users track:

- Neocloud companies
- AI data center projects
- GPU capacity
- Power capacity
- Customer contracts
- Project status
- Location accuracy
- Data confidence

## Language Policy

The user-facing dashboard should default to Korean.

Use Korean for:

- Page titles
- Section headers
- KPI card labels
- Table column labels
- Filter names
- Tooltips
- Empty states
- Disclaimers

Keep English for:

- Company names
- Project names
- GPU model names
- Ticker symbols
- TypeScript field names
- JSON keys
- Database column names
- Widely used industry terms where translation would reduce clarity

Preferred style:

- Use Korean as the base language.
- Keep important industry terms in English or Korean + English mixed format.
- Example labels:
  - 계약 백로그 / Backlog
  - 계획 전력 / Planned MW
  - 확보 전력 / Secured MW
  - GPU 수량 / GPU count
  - 고객사 / Customer
  - 계약 상태 / Contract Status
  - 위치 정확도 / Location Accuracy
  - 신뢰도 점수 / Confidence Score
  - 가동 예정일 / Expected Online Date
  - 데이터 출처 / Source

## Development Principles

1. Do not invent factual data.
2. Use mock data only when clearly labeled as mock data.
3. Keep financial, GPU, power, contract, and location fields sourceable.
4. Preserve confidence scores and location accuracy fields in all views.
5. Keep components modular and reusable.
6. Prefer readable TypeScript over clever abstractions.
7. The MVP should run locally without paid API keys.
8. Avoid introducing unnecessary backend complexity unless requested.
9. Internal field names, types, and JSON keys should remain English.
10. User-facing labels should be Korean or Korean + English mixed.

## UI Principles

Use a clean Korean investment-research dashboard style:

- Compact KPI cards
- Interactive map as the core visual
- Spreadsheet-like tables
- Clear filters
- Neutral colors
- Minimal decoration
- Strong emphasis on status, source, and confidence
- Dense but readable layout

## Data Rules

Every project should include:

- company
- projectName
- location fields
- status
- lastUpdated
- confidenceScore
- locationAccuracy

Projects without coordinates must not be plotted on the map. They should appear in a separate "좌표 확인 필요 / Needs Geocoding" table.

Do not invent missing latitude or longitude. If location is uncertain, use the appropriate `locationAccuracy` value and lower the `confidenceScore`.

## Testing / Validation

Before finishing a task:

- Run type checks if available.
- Run lint if available.
- Run build if available.
- Confirm that map, filters, KPI cards, and tables work together.
- Confirm that projects without coordinates appear in "좌표 확인 필요 / Needs Geocoding".
- Confirm that mock data is clearly labeled.
- Confirm that the user-facing UI defaults to Korean.
