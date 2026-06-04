import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "data");
const today = new Date().toISOString().slice(0, 10);

const demandMetrics = new Set([
  "global_dc_electricity_consumption",
  "global_dc_electricity_consumption_base_case",
  "global_dc_electricity_cagr",
  "accelerated_server_electricity_growth",
  "hbm_tam",
  "hbm_tam_cagr",
  "nvidia_total_revenue",
  "nvidia_total_revenue_growth",
  "nvidia_data_center_revenue",
  "nvidia_data_center_revenue_growth",
  "broadcom_ai_semiconductor_revenue_growth",
  "marvell_revenue_growth",
  "dell_ai_optimized_servers_revenue",
  "dell_ai_optimized_servers_revenue_growth"
]);

const supplyMetrics = new Set([
  "tsmc_3nm_total_wafer_revenue_share",
  "tsmc_advanced_technology_revenue_share",
  "tsmc_wafer_shipments",
  "tsmc_annual_capacity"
]);

const requiredScoreComponents = ["supply_gap_score", "demand_cagr_score", "price_indicator_score", "stock_momentum_score"];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quote = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"' && quote && next === '"') {
      cell += '"';
      i += 1;
    } else if (ch === '"') {
      quote = !quote;
    } else if (ch === "," && !quote) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quote) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const headers = (rows.shift() || []).map((header) => header.replace(/^\uFEFF/, ""));
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function toCsv(rows, headers) {
  const esc = (value) => {
    const text = value == null ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return `\uFEFF${[headers.join(","), ...rows.map((row) => headers.map((header) => esc(row[header])).join(","))].join("\n")}\n`;
}

function readCsv(name) {
  return parseCsv(fs.readFileSync(path.join(dataDir, name), "utf8"));
}

function writeCsv(name, rows, headers) {
  fs.writeFileSync(path.join(dataDir, name), toCsv(rows, headers), "utf8");
}

function numberValue(value) {
  if (value === "" || value == null) return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function confidenceRank(value) {
  return { Low: 1, Medium: 2, High: 3 }[value] || 0;
}

function clampScore(value) {
  return Math.round(Math.max(0, Math.min(value, 100)) * 100) / 100;
}

function buildSourceNotes(rawRows) {
  const grouped = new Map();
  for (const row of rawRows) {
    const key = `${row.source_name}||${row.source_url_or_file}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        source_name: row.source_name,
        source_url_or_file: row.source_url_or_file,
        source_type: row.source_type,
        source_date: row.source_date,
        last_updated: row.last_updated,
        confidence: row.confidence,
        metrics_count: 0,
        numeric_metrics_count: 0,
        segments: new Set(),
        note: row.note || ""
      });
    }
    const item = grouped.get(key);
    item.metrics_count += 1;
    if (numberValue(row.value) !== null) item.numeric_metrics_count += 1;
    item.segments.add(row.segment_id);
    if (confidenceRank(row.confidence) < confidenceRank(item.confidence)) item.confidence = row.confidence;
  }
  return [...grouped.values()].map((item) => ({ ...item, segments: [...item.segments].sort().join(";") }));
}

function buildSupplyDemand(rawRows) {
  const grouped = new Map();
  for (const row of rawRows) {
    if (!demandMetrics.has(row.metric_id) && !supplyMetrics.has(row.metric_id)) continue;
    const key = `${row.segment_id}||${row.entity}||${row.period}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        segment_id: row.segment_id,
        entity: row.entity,
        period: row.period,
        demand_metric_id: "",
        demand_value: "",
        demand_unit: "",
        supply_metric_id: "",
        supply_value: "",
        supply_unit: "",
        source_metric_ids: [],
        notes: []
      });
    }
    const item = grouped.get(key);
    item.source_metric_ids.push(row.metric_id);
    if (row.note) item.notes.push(row.note);
    const value = numberValue(row.value);
    if (demandMetrics.has(row.metric_id) && item.demand_metric_id === "") {
      item.demand_metric_id = row.metric_id;
      item.demand_value = value ?? "";
      item.demand_unit = row.unit;
    }
    if (supplyMetrics.has(row.metric_id) && item.supply_metric_id === "") {
      item.supply_metric_id = row.metric_id;
      item.supply_value = value ?? "";
      item.supply_unit = row.unit;
    }
  }
  return [...grouped.values()].map((item) => {
    let ratio = "";
    let formula = "N/A";
    let confidence = "Medium";
    if (
      typeof item.demand_value === "number" &&
      typeof item.supply_value === "number" &&
      item.demand_unit === item.supply_unit &&
      item.demand_value > 0
    ) {
      ratio = Math.max((item.demand_value - item.supply_value) / item.demand_value, 0);
      formula = "max((demand_value - supply_value) / demand_value, 0); calculated only when units match";
      confidence = "High";
    }
    return {
      segment_id: item.segment_id,
      entity: item.entity,
      period: item.period,
      demand_metric_id: item.demand_metric_id,
      demand_value: item.demand_value,
      demand_unit: item.demand_unit,
      supply_metric_id: item.supply_metric_id,
      supply_value: item.supply_value,
      supply_unit: item.supply_unit,
      supply_shortage_ratio: ratio,
      formula,
      confidence,
      source_metric_ids: item.source_metric_ids.join(";"),
      note: item.notes.join(" / ")
    };
  });
}

function buildPriceIndicators(rawRows) {
  return rawRows.filter((row) => {
    const text = `${row.metric_id} ${row.metric_name}`.toLowerCase();
    return ["price", "premium", "chipflation"].some((keyword) => text.includes(keyword));
  });
}

function buildScores(rawRows, supplyDemand, priceIndicators, marketReaction, manualScores) {
  const segments = new Set(rawRows.map((row) => row.segment_id));
  const maxBySegment = (rows, valueKey, predicate = () => true) => {
    const result = {};
    for (const row of rows) {
      if (!predicate(row)) continue;
      const value = numberValue(row[valueKey]);
      if (value === null) continue;
      result[row.segment_id] = Math.max(result[row.segment_id] ?? -Infinity, value);
    }
    return Object.fromEntries(Object.entries(result).filter(([, value]) => value !== -Infinity));
  };
  const supplyGap = maxBySegment(supplyDemand, "supply_shortage_ratio");
  const demandGrowth = maxBySegment(rawRows, "value", (row) => /cagr|growth/i.test(row.metric_id));
  const pricePressure = maxBySegment(priceIndicators, "value");
  const stockMomentum = {};
  for (const row of marketReaction) {
    const value = numberValue(row.return_6m_pct);
    if (value === null) continue;
    for (const segmentId of row.segment_ids.split(";").filter(Boolean)) {
      stockMomentum[segmentId] ||= [];
      stockMomentum[segmentId].push(clampScore(value + 50));
      segments.add(segmentId);
    }
  }
  const stockScores = Object.fromEntries(Object.entries(stockMomentum).map(([key, values]) => [key, values.reduce((a, b) => a + b, 0) / values.length]));
  const manual = {};
  for (const row of manualScores) {
    const value = numberValue(row.score);
    if (value === null || !row.source_metric_ids || !row.source_name) continue;
    manual[row.segment_id] ||= [];
    manual[row.segment_id].push(clampScore(value));
  }
  const manualAvg = Object.fromEntries(Object.entries(manual).map(([key, values]) => [key, values.reduce((a, b) => a + b, 0) / values.length]));

  return [...segments].sort().map((segmentId) => {
    const components = {
      supply_gap_score: supplyGap[segmentId] != null ? clampScore(supplyGap[segmentId] * 100) : "",
      demand_cagr_score: demandGrowth[segmentId] != null ? clampScore(demandGrowth[segmentId]) : "",
      price_indicator_score: pricePressure[segmentId] != null ? clampScore(pricePressure[segmentId]) : "",
      stock_momentum_score: stockScores[segmentId] ?? "",
      manual_score: manualAvg[segmentId] ?? ""
    };
    const availableValues = Object.values(components).filter((value) => typeof value === "number");
    const missing = requiredScoreComponents.filter((key) => components[key] === "");
    const total = missing.length ? "" : requiredScoreComponents.reduce((sum, key) => sum + components[key], 0) / requiredScoreComponents.length;
    const sourceMetricIds = rawRows.filter((row) => row.segment_id === segmentId && numberValue(row.value) !== null).map((row) => row.metric_id).sort();
    return {
      segment_id: segmentId,
      score_period: today,
      total_score: total === "" ? "" : Math.round(total * 100) / 100,
      available_component_avg: availableValues.length ? Math.round((availableValues.reduce((a, b) => a + b, 0) / availableValues.length) * 100) / 100 : "",
      component_count: availableValues.length,
      missing_components: missing.join(";"),
      ...components,
      status: missing.length ? "insufficient_data" : "complete",
      formula: "total_score = average(required components) only when every required component is available; available_component_avg is partial display only",
      source_metric_ids: sourceMetricIds.join(";"),
      last_updated: today,
      note: "부족한 항목은 N/A로 유지합니다. total_score는 필수 컴포넌트가 모두 있을 때만 계산됩니다."
    };
  });
}

function validate() {
  const errors = [];
  const requiredFiles = [
    "raw_metrics.csv",
    "source_notes.csv",
    "supply_demand.csv",
    "price_indicators.csv",
    "manual_scores.csv",
    "bottleneck_scores.csv",
    "companies.csv",
    "market_reaction.csv",
    "segments.json"
  ];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(dataDir, file))) errors.push(`missing ${file}`);
  }
  const segmentIds = new Set(JSON.parse(fs.readFileSync(path.join(dataDir, "segments.json"), "utf8")).map((row) => row.segment_id));
  for (const [index, row] of readCsv("raw_metrics.csv").entries()) {
    if (!segmentIds.has(row.segment_id)) errors.push(`raw_metrics.csv line ${index + 2}: invalid segment_id ${row.segment_id}`);
    if (numberValue(row.value) !== null) {
      for (const field of ["source_name", "source_url_or_file", "confidence", "source_type", "last_updated"]) {
        if (!row[field]) errors.push(`raw_metrics.csv line ${index + 2}: numeric row missing ${field}`);
      }
      if (numberValue(row.value) < 0 && /demand|supply|consumption|shipment|capacity|revenue/i.test(row.metric_id)) {
        errors.push(`raw_metrics.csv line ${index + 2}: negative demand/supply/revenue metric`);
      }
    }
  }
  for (const row of readCsv("companies.csv")) {
    for (const segmentId of row.segment_ids.split(";").filter(Boolean)) {
      if (!segmentIds.has(segmentId)) errors.push(`companies.csv: invalid segment_id ${segmentId}`);
    }
  }
  const targets = ["index.html", ...fs.readdirSync(dataDir).filter((file) => file.endsWith(".csv")).map((file) => `data/${file}`), "data/segments.json"];
  for (const rel of targets) {
    const text = fs.readFileSync(path.join(root, rel), "utf8").toLowerCase();
    for (const term of ["mock", "dummy", "sample", "placeholder", "example"]) {
      if (text.includes(term)) errors.push(`banned term ${term} in ${rel}`);
    }
  }
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  for (const rel of ["data/raw_metrics.csv", "data/source_notes.csv", "data/supply_demand.csv", "data/price_indicators.csv", "data/bottleneck_scores.csv", "data/companies.csv", "data/market_reaction.csv", "data/segments.json"]) {
    if (!html.includes(rel)) errors.push(`index.html does not load ${rel}`);
  }
  if (/data\s*:\s*\[\s*[-\d.]/.test(html)) errors.push("index.html appears to contain hardcoded chart data arrays");
  if (errors.length) {
    throw new Error(`validation failed:\n- ${errors.join("\n- ")}`);
  }
}

function main() {
  const rawRows = readCsv("raw_metrics.csv");
  const sourceNotes = buildSourceNotes(rawRows);
  const supplyDemand = buildSupplyDemand(rawRows);
  const priceIndicators = buildPriceIndicators(rawRows);
  const marketReaction = readCsv("market_reaction.csv");
  const manualScores = readCsv("manual_scores.csv");
  const scores = buildScores(rawRows, supplyDemand, priceIndicators, marketReaction, manualScores);

  writeCsv("source_notes.csv", sourceNotes, ["source_name", "source_url_or_file", "source_type", "source_date", "last_updated", "confidence", "metrics_count", "numeric_metrics_count", "segments", "note"]);
  writeCsv("supply_demand.csv", supplyDemand, ["segment_id", "entity", "period", "demand_metric_id", "demand_value", "demand_unit", "supply_metric_id", "supply_value", "supply_unit", "supply_shortage_ratio", "formula", "confidence", "source_metric_ids", "note"]);
  writeCsv("price_indicators.csv", priceIndicators, Object.keys(rawRows[0]));
  writeCsv("bottleneck_scores.csv", scores, ["segment_id", "score_period", "total_score", "available_component_avg", "component_count", "missing_components", "supply_gap_score", "demand_cagr_score", "price_indicator_score", "stock_momentum_score", "manual_score", "status", "formula", "source_metric_ids", "last_updated", "note"]);

  validate();
  console.log(`pipeline complete: ${rawRows.length} raw metrics, ${sourceNotes.length} sources, ${scores.length} score rows`);
}

main();
