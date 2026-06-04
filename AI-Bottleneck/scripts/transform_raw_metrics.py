from __future__ import annotations

import csv
from collections import defaultdict
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
RAW_PATH = DATA_DIR / "raw_metrics.csv"
SOURCE_NOTES_PATH = DATA_DIR / "source_notes.csv"
SUPPLY_DEMAND_PATH = DATA_DIR / "supply_demand.csv"
PRICE_INDICATORS_PATH = DATA_DIR / "price_indicators.csv"

DEMAND_METRICS = {
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
    "dell_ai_optimized_servers_revenue_growth",
}

SUPPLY_METRICS = {
    "tsmc_3nm_total_wafer_revenue_share",
    "tsmc_advanced_technology_revenue_share",
    "tsmc_wafer_shipments",
    "tsmc_annual_capacity",
}

PRICE_KEYWORDS = ("price", "premium", "chipflation")


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
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


def confidence_rank(value: str) -> int:
    ranks = {"Low": 1, "Medium": 2, "High": 3}
    return ranks.get(value, 0)


def build_source_notes(rows: list[dict[str, str]]) -> list[dict[str, object]]:
    grouped: dict[tuple[str, str], dict[str, object]] = {}
    for row in rows:
        key = (row["source_name"], row["source_url_or_file"])
        item = grouped.setdefault(
            key,
            {
                "source_name": row["source_name"],
                "source_url_or_file": row["source_url_or_file"],
                "source_type": row["source_type"],
                "source_date": row["source_date"],
                "last_updated": row["last_updated"],
                "confidence": row["confidence"],
                "metrics_count": 0,
                "numeric_metrics_count": 0,
                "segments": set(),
                "note": "",
            },
        )
        item["metrics_count"] = int(item["metrics_count"]) + 1
        if numeric(row.get("value")) is not None:
            item["numeric_metrics_count"] = int(item["numeric_metrics_count"]) + 1
        item["segments"].add(row["segment_id"])
        if confidence_rank(row["confidence"]) < confidence_rank(str(item["confidence"])):
            item["confidence"] = row["confidence"]
        if row.get("note") and not item["note"]:
            item["note"] = row["note"]

    result: list[dict[str, object]] = []
    for item in grouped.values():
        item["segments"] = ";".join(sorted(item["segments"]))
        result.append(item)
    return sorted(result, key=lambda row: (str(row["source_type"]), str(row["source_name"])))


def build_supply_demand(rows: list[dict[str, str]]) -> list[dict[str, object]]:
    grouped: dict[tuple[str, str, str], dict[str, object]] = defaultdict(dict)
    for row in rows:
        metric_id = row["metric_id"]
        if metric_id not in DEMAND_METRICS and metric_id not in SUPPLY_METRICS:
            continue
        key = (row["segment_id"], row["entity"], row["period"])
        bucket = grouped[key]
        bucket.setdefault("segment_id", row["segment_id"])
        bucket.setdefault("entity", row["entity"])
        bucket.setdefault("period", row["period"])
        bucket.setdefault("source_metric_ids", [])
        bucket.setdefault("notes", [])
        bucket["source_metric_ids"].append(metric_id)
        bucket["notes"].append(row.get("note", ""))

        value = numeric(row.get("value"))
        if metric_id in DEMAND_METRICS and bucket.get("demand_value") in (None, ""):
            bucket["demand_metric_id"] = metric_id
            bucket["demand_value"] = value if value is not None else ""
            bucket["demand_unit"] = row.get("unit", "")
        if metric_id in SUPPLY_METRICS and bucket.get("supply_value") in (None, ""):
            bucket["supply_metric_id"] = metric_id
            bucket["supply_value"] = value if value is not None else ""
            bucket["supply_unit"] = row.get("unit", "")

    output: list[dict[str, object]] = []
    for bucket in grouped.values():
        demand_value = bucket.get("demand_value")
        supply_value = bucket.get("supply_value")
        demand_unit = bucket.get("demand_unit", "")
        supply_unit = bucket.get("supply_unit", "")
        ratio = ""
        formula = "N/A"
        confidence = "Medium"

        if isinstance(demand_value, float) and isinstance(supply_value, float) and demand_unit == supply_unit and demand_value > 0:
            ratio = max((demand_value - supply_value) / demand_value, 0)
            formula = "max((demand_value - supply_value) / demand_value, 0); calculated only when units match"
            confidence = "High"

        output.append(
            {
                "segment_id": bucket.get("segment_id", ""),
                "entity": bucket.get("entity", ""),
                "period": bucket.get("period", ""),
                "demand_metric_id": bucket.get("demand_metric_id", ""),
                "demand_value": demand_value if demand_value is not None else "",
                "demand_unit": demand_unit,
                "supply_metric_id": bucket.get("supply_metric_id", ""),
                "supply_value": supply_value if supply_value is not None else "",
                "supply_unit": supply_unit,
                "supply_shortage_ratio": ratio,
                "formula": formula,
                "confidence": confidence,
                "source_metric_ids": ";".join(bucket.get("source_metric_ids", [])),
                "note": " / ".join(note for note in bucket.get("notes", []) if note),
            }
        )
    return sorted(output, key=lambda row: (str(row["segment_id"]), str(row["entity"]), str(row["period"])))


def build_price_indicators(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    indicators = []
    for row in rows:
        metric_text = f"{row.get('metric_id', '')} {row.get('metric_name', '')}".lower()
        if any(keyword in metric_text for keyword in PRICE_KEYWORDS):
            indicators.append(row)
    return indicators


def main() -> None:
    rows = read_csv(RAW_PATH)

    source_notes = build_source_notes(rows)
    write_csv(
        SOURCE_NOTES_PATH,
        source_notes,
        [
            "source_name",
            "source_url_or_file",
            "source_type",
            "source_date",
            "last_updated",
            "confidence",
            "metrics_count",
            "numeric_metrics_count",
            "segments",
            "note",
        ],
    )

    supply_demand = build_supply_demand(rows)
    write_csv(
        SUPPLY_DEMAND_PATH,
        supply_demand,
        [
            "segment_id",
            "entity",
            "period",
            "demand_metric_id",
            "demand_value",
            "demand_unit",
            "supply_metric_id",
            "supply_value",
            "supply_unit",
            "supply_shortage_ratio",
            "formula",
            "confidence",
            "source_metric_ids",
            "note",
        ],
    )

    price_indicators = build_price_indicators(rows)
    write_csv(PRICE_INDICATORS_PATH, price_indicators, list(rows[0].keys()))

    print(f"{date.today().isoformat()} transform complete: {len(rows)} raw metrics, {len(source_notes)} sources")


if __name__ == "__main__":
    main()
