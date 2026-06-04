from __future__ import annotations

import csv
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
RAW_PATH = DATA_DIR / "raw_metrics.csv"
SUPPLY_DEMAND_PATH = DATA_DIR / "supply_demand.csv"
PRICE_INDICATORS_PATH = DATA_DIR / "price_indicators.csv"
MARKET_REACTION_PATH = DATA_DIR / "market_reaction.csv"
MANUAL_SCORES_PATH = DATA_DIR / "manual_scores.csv"
SCORES_PATH = DATA_DIR / "bottleneck_scores.csv"

REQUIRED_COMPONENTS = ["supply_gap_score", "demand_cagr_score", "price_indicator_score", "stock_momentum_score"]


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in fieldnames})


def numeric(value: str | None) -> float | None:
    if value is None:
        return None
    text = value.strip().replace(",", "")
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def clamp_score(value: float) -> float:
    return round(max(0, min(value, 100)), 2)


def max_by_segment(rows: list[dict[str, str]], value_key: str, metric_filter=None) -> dict[str, float]:
    result: dict[str, float] = {}
    for row in rows:
        if metric_filter and not metric_filter(row):
            continue
        value = numeric(row.get(value_key))
        if value is None:
            continue
        segment_id = row.get("segment_id", "")
        result[segment_id] = max(result.get(segment_id, float("-inf")), value)
    return {key: value for key, value in result.items() if value != float("-inf")}


def collect_segments(*tables: list[dict[str, str]]) -> list[str]:
    segments: set[str] = set()
    for table in tables:
        for row in table:
            if row.get("segment_id"):
                segments.add(row["segment_id"])
            if row.get("segment_ids"):
                segments.update(item for item in row["segment_ids"].split(";") if item)
    return sorted(segments)


def manual_score_by_segment(rows: list[dict[str, str]]) -> dict[str, float]:
    result: dict[str, list[float]] = {}
    for row in rows:
        value = numeric(row.get("score"))
        if value is None:
            continue
        if not row.get("source_metric_ids") or not row.get("source_name"):
            continue
        result.setdefault(row["segment_id"], []).append(clamp_score(value))
    return {key: round(sum(values) / len(values), 2) for key, values in result.items()}


def stock_score_by_segment(rows: list[dict[str, str]]) -> dict[str, float]:
    result: dict[str, list[float]] = {}
    for row in rows:
        value = numeric(row.get("return_6m_pct"))
        if value is None:
            continue
        score = clamp_score(value + 50)
        for segment_id in row.get("segment_ids", "").split(";"):
            if segment_id:
                result.setdefault(segment_id, []).append(score)
    return {key: round(sum(values) / len(values), 2) for key, values in result.items()}


def main() -> None:
    raw_rows = read_csv(RAW_PATH)
    supply_rows = read_csv(SUPPLY_DEMAND_PATH)
    price_rows = read_csv(PRICE_INDICATORS_PATH)
    market_rows = read_csv(MARKET_REACTION_PATH)
    manual_rows = read_csv(MANUAL_SCORES_PATH)

    supply_gap = max_by_segment(supply_rows, "supply_shortage_ratio")
    demand_growth = max_by_segment(
        raw_rows,
        "value",
        lambda row: "cagr" in row.get("metric_id", "").lower() or "growth" in row.get("metric_id", "").lower(),
    )
    price_pressure = max_by_segment(price_rows, "value")
    stock_momentum = stock_score_by_segment(market_rows)
    manual_scores = manual_score_by_segment(manual_rows)
    segments = collect_segments(raw_rows, supply_rows, price_rows, market_rows, manual_rows)

    rows: list[dict[str, object]] = []
    for segment_id in segments:
        components = {
            "supply_gap_score": clamp_score(supply_gap[segment_id] * 100) if segment_id in supply_gap else "",
            "demand_cagr_score": clamp_score(demand_growth[segment_id]) if segment_id in demand_growth else "",
            "price_indicator_score": clamp_score(price_pressure[segment_id]) if segment_id in price_pressure else "",
            "stock_momentum_score": stock_momentum.get(segment_id, ""),
            "manual_score": manual_scores.get(segment_id, ""),
        }
        available_values = [value for value in components.values() if isinstance(value, (int, float))]
        missing = [key for key in REQUIRED_COMPONENTS if components.get(key) == ""]
        total = ""
        status = "insufficient_data"
        if not missing:
            total = round(sum(float(components[key]) for key in REQUIRED_COMPONENTS) / len(REQUIRED_COMPONENTS), 2)
            status = "complete"

        source_metric_ids = sorted(
            {
                row["metric_id"]
                for row in raw_rows
                if row.get("segment_id") == segment_id and numeric(row.get("value")) is not None
            }
        )
        rows.append(
            {
                "segment_id": segment_id,
                "score_period": date.today().isoformat(),
                "total_score": total,
                "available_component_avg": round(sum(available_values) / len(available_values), 2) if available_values else "",
                "component_count": len(available_values),
                "missing_components": ";".join(missing),
                **components,
                "status": status,
                "formula": "total_score = average(required components) only when every required component is available; available_component_avg is partial display only",
                "source_metric_ids": ";".join(source_metric_ids),
                "last_updated": date.today().isoformat(),
                "note": "부족한 항목은 N/A로 유지합니다. total_score는 필수 컴포넌트가 모두 있을 때만 계산됩니다.",
            }
        )

    write_csv(
        SCORES_PATH,
        rows,
        [
            "segment_id",
            "score_period",
            "total_score",
            "available_component_avg",
            "component_count",
            "missing_components",
            "supply_gap_score",
            "demand_cagr_score",
            "price_indicator_score",
            "stock_momentum_score",
            "manual_score",
            "status",
            "formula",
            "source_metric_ids",
            "last_updated",
            "note",
        ],
    )
    print(f"{date.today().isoformat()} score update complete: {len(rows)} segments")


if __name__ == "__main__":
    main()
