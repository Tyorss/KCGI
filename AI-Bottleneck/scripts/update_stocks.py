from __future__ import annotations

import csv
import importlib.util
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
LOG_DIR = ROOT / "logs"
COMPANIES_PATH = DATA_DIR / "companies.csv"
BLOOMBERG_PATH = DATA_DIR / "bloomberg_prices.csv"
MARKET_REACTION_PATH = DATA_DIR / "market_reaction.csv"
WARNINGS_PATH = LOG_DIR / "stock_update_warnings.log"


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in fieldnames})


def numeric(value: object) -> float | None:
    if value is None:
        return None
    text = str(value).strip().replace(",", "")
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def pct_return(current: float | None, prior: float | None) -> float | str:
    if current is None or prior is None or prior == 0:
        return ""
    return round((current / prior - 1) * 100, 2)


def update_from_bloomberg(companies: list[dict[str, str]]) -> tuple[list[dict[str, object]], list[str]]:
    warnings: list[str] = []
    prices = read_csv(BLOOMBERG_PATH)
    by_ticker = {row.get("ticker", ""): row for row in prices}
    rows: list[dict[str, object]] = []
    for company in companies:
        ticker = company["ticker"]
        source = by_ticker.get(ticker)
        if not source:
            warnings.append(f"{ticker}: bloomberg_prices.csv row not found")
            continue
        current = numeric(source.get("price"))
        row = {
            "company": company["company"],
            "ticker": ticker,
            "segment_ids": company["segment_ids"],
            "as_of": source.get("as_of", date.today().isoformat()),
            "price": current if current is not None else "",
            "currency": source.get("currency", ""),
            "return_1m_pct": pct_return(current, numeric(source.get("price_1m_ago"))),
            "return_3m_pct": pct_return(current, numeric(source.get("price_3m_ago"))),
            "return_6m_pct": pct_return(current, numeric(source.get("price_6m_ago"))),
            "return_12m_pct": pct_return(current, numeric(source.get("price_12m_ago"))),
            "return_ytd_pct": pct_return(current, numeric(source.get("price_start_ytd"))),
            "warnings": "",
            "source_name": "Bloomberg local export",
            "source_url_or_file": "data/bloomberg_prices.csv",
            "last_updated": date.today().isoformat(),
            "confidence": "High",
            "note": "Local Bloomberg export; manual valuation columns remain in companies.csv.",
        }
        rows.append(row)
    return rows, warnings


def update_from_yfinance(companies: list[dict[str, str]]) -> tuple[list[dict[str, object]], list[str]]:
    warnings: list[str] = []
    if importlib.util.find_spec("yfinance") is None:
        return [], ["yfinance package not installed; market_reaction.csv left as header-only output"]

    import yfinance as yf

    rows: list[dict[str, object]] = []
    for company in companies:
        ticker = company["ticker"]
        try:
            hist = yf.download(ticker, period="1y", interval="1d", progress=False, auto_adjust=True)
        except Exception as exc:
            warnings.append(f"{ticker}: yfinance download failed: {exc}")
            continue
        if hist is None or hist.empty:
            warnings.append(f"{ticker}: no yfinance price history")
            continue

        close = hist["Close"].dropna()
        if close.empty:
            warnings.append(f"{ticker}: no valid close price")
            continue

        current = float(close.iloc[-1])
        points = {
            "return_1m_pct": close.iloc[-22] if len(close) >= 22 else None,
            "return_3m_pct": close.iloc[-66] if len(close) >= 66 else None,
            "return_6m_pct": close.iloc[-132] if len(close) >= 132 else None,
            "return_12m_pct": close.iloc[0] if len(close) >= 2 else None,
            "return_ytd_pct": close[close.index.year == close.index[-1].year].iloc[0] if len(close[close.index.year == close.index[-1].year]) else None,
        }
        rows.append(
            {
                "company": company["company"],
                "ticker": ticker,
                "segment_ids": company["segment_ids"],
                "as_of": str(close.index[-1].date()),
                "price": round(current, 4),
                "currency": "",
                "return_1m_pct": pct_return(current, float(points["return_1m_pct"])) if points["return_1m_pct"] is not None else "",
                "return_3m_pct": pct_return(current, float(points["return_3m_pct"])) if points["return_3m_pct"] is not None else "",
                "return_6m_pct": pct_return(current, float(points["return_6m_pct"])) if points["return_6m_pct"] is not None else "",
                "return_12m_pct": pct_return(current, float(points["return_12m_pct"])) if points["return_12m_pct"] is not None else "",
                "return_ytd_pct": pct_return(current, float(points["return_ytd_pct"])) if points["return_ytd_pct"] is not None else "",
                "warnings": "",
                "source_name": "Yahoo Finance via yfinance",
                "source_url_or_file": f"https://finance.yahoo.com/quote/{ticker}",
                "last_updated": date.today().isoformat(),
                "confidence": "Medium",
                "note": "Auto-adjusted daily close from yfinance. Failed tickers are not fabricated.",
            }
        )
    return rows, warnings


def main() -> None:
    companies = read_csv(COMPANIES_PATH)
    if BLOOMBERG_PATH.exists():
        rows, warnings = update_from_bloomberg(companies)
    else:
        rows, warnings = update_from_yfinance(companies)

    fields = [
        "company",
        "ticker",
        "segment_ids",
        "as_of",
        "price",
        "currency",
        "return_1m_pct",
        "return_3m_pct",
        "return_6m_pct",
        "return_12m_pct",
        "return_ytd_pct",
        "warnings",
        "source_name",
        "source_url_or_file",
        "last_updated",
        "confidence",
        "note",
    ]
    write_csv(MARKET_REACTION_PATH, rows, fields)

    LOG_DIR.mkdir(exist_ok=True)
    WARNINGS_PATH.write_text("\n".join(warnings) + ("\n" if warnings else ""), encoding="utf-8")
    print(f"{date.today().isoformat()} stock update complete: {len(rows)} rows, {len(warnings)} warnings")


if __name__ == "__main__":
    main()
