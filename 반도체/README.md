# AI Semiconductor Dashboard

`ai-semiconductor-dashboard.html` is a static Chart.js dashboard. Seed data is embedded in the HTML so the page can be opened directly without a build step.

## Data Caveats

- Company-level revenue and operating income are not the same as market-specific revenue.
- HBM, CoWoS, CPO, and glass-core substrate often lack company-level product operating profit disclosure.
- Segment operating income is only shown when disclosed or mechanically calculated from disclosed segment margin.
- Do not infer HBM operating profit from HBM market share unless a separate estimate source is added.
- CoWoS allocation is not market share.
- CPO and glass-core substrate should be shown as roadmap/status markets.
- USD, KRW, and TWD values are shown in source currency and are not FX-converted.

## Future Data Automation

- Bloomberg price, market cap, valuation, and consensus integration.
- Bloomberg FX layer for USD/KRW/TWD normalization.
- Manual market-size source table with source date, market definition, and confidence scoring.
- News and event tracker for IR, earnings calls, capex, and supply-chain updates.
- Company exposure scoring and customer exposure scoring.
