from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
REQUIRED_FILES = [
    DATA_DIR / "raw_metrics.csv",
    DATA_DIR / "source_notes.csv",
    DATA_DIR / "supply_demand.csv",
    DATA_DIR / "price_indicators.csv",
    DATA_DIR / "manual_scores.csv",
    DATA_DIR / "bottleneck_scores.csv",
    DATA_DIR / "companies.csv",
    DATA_DIR / "segments.json",
    ROOT / "index.html",
]
BANNED_TERMS = ("mock", "dummy", "sample", "placeholder", "example")


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


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


def validate_required_files(errors: list[str]) -> None:
    for path in REQUIRED_FILES:
        if not path.exists():
            errors.append(f"missing required file: {path.relative_to(ROOT)}")


def validate_segments(errors: list[str]) -> set[str]:
    with (DATA_DIR / "segments.json").open("r", encoding="utf-8") as handle:
        segments = json.load(handle)
    segment_ids = {row["segment_id"] for row in segments}
    for row in read_csv(DATA_DIR / "raw_metrics.csv"):
        if row.get("segment_id") not in segment_ids:
            errors.append(f"invalid segment_id in raw_metrics.csv: {row.get('segment_id')}")
    for row in read_csv(DATA_DIR / "companies.csv"):
        for segment_id in row.get("segment_ids", "").split(";"):
            if segment_id and segment_id not in segment_ids:
                errors.append(f"invalid segment_id in companies.csv: {segment_id}")
    return segment_ids


def validate_sources(errors: list[str]) -> None:
    rows = read_csv(DATA_DIR / "raw_metrics.csv")
    for index, row in enumerate(rows, start=2):
        value = numeric(row.get("value"))
        if value is not None:
            for field in ("source_name", "source_url_or_file", "confidence", "source_type", "last_updated"):
                if not row.get(field):
                    errors.append(f"raw_metrics.csv line {index}: numeric row missing {field}")
        if value is not None and value < 0:
            metric_id = row.get("metric_id", "").lower()
            if any(token in metric_id for token in ("demand", "supply", "consumption", "shipment", "capacity", "revenue")):
                errors.append(f"raw_metrics.csv line {index}: negative demand/supply/revenue metric")


def validate_banned_terms(errors: list[str]) -> None:
    targets = [ROOT / "index.html", *DATA_DIR.glob("*.csv"), DATA_DIR / "segments.json"]
    for path in targets:
        text = path.read_text(encoding="utf-8-sig").lower()
        for term in BANNED_TERMS:
            if term in text:
                errors.append(f"banned term '{term}' found in {path.relative_to(ROOT)}")


def validate_dashboard_data_loading(errors: list[str]) -> None:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    required_fetches = [
        "data/raw_metrics.csv",
        "data/source_notes.csv",
        "data/supply_demand.csv",
        "data/price_indicators.csv",
        "data/bottleneck_scores.csv",
        "data/companies.csv",
        "data/market_reaction.csv",
        "data/segments.json",
    ]
    for path in required_fetches:
        if path not in html:
            errors.append(f"index.html does not load {path}")
    if re.search(r"data\s*:\s*\[\s*[-\d.]", html):
        errors.append("index.html appears to contain hardcoded chart data arrays")


def main() -> None:
    errors: list[str] = []
    validate_required_files(errors)
    if errors:
        print("\n".join(errors), file=sys.stderr)
        sys.exit(1)

    validate_segments(errors)
    validate_sources(errors)
    validate_banned_terms(errors)
    validate_dashboard_data_loading(errors)

    if errors:
        print("validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        sys.exit(1)

    print("validation passed")


if __name__ == "__main__":
    main()
