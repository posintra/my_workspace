import argparse
import csv
import json
from pathlib import Path


def load_leading_points(data_json: Path) -> dict[str, float]:
    payload = json.loads(data_json.read_text(encoding="utf-8"))
    return {
        str(month): float(value)
        for month, value in payload["leading_cyclical_component"]["points"]
    }


def load_spread_rows(spread_csv: Path) -> list[dict[str, str]]:
    with spread_csv.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def build_rows(
    spread_rows: list[dict[str, str]],
    leading_points: dict[str, float],
    latest_leading_month: str | None,
    latest_leading_value: float | None,
    spread_note: str,
    leading_note: str,
    latest_leading_note: str,
) -> list[dict[str, object]]:
    merged: list[dict[str, object]] = []

    for row in spread_rows:
        month = row["month"]
        if month in leading_points:
            merged.append(
                {
                    "month": month,
                    "bond_spread_bp": float(row["spread_bps"]),
                    "leading_cyclical_component": float(leading_points[month]),
                    "lead_source_note": leading_note,
                    "bond_source_note": spread_note,
                }
            )

    if latest_leading_month and latest_leading_value is not None:
        match = next((row for row in spread_rows if row["month"] == latest_leading_month), None)
        if match is not None and not any(row["month"] == latest_leading_month for row in merged):
            merged.append(
                {
                    "month": latest_leading_month,
                    "bond_spread_bp": float(match["spread_bps"]),
                    "leading_cyclical_component": float(latest_leading_value),
                    "lead_source_note": latest_leading_note,
                    "bond_source_note": spread_note,
                }
            )

    merged.sort(key=lambda row: row["month"])
    return merged[-12:]


def write_rows(output_csv: Path, rows: list[dict[str, object]]) -> None:
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    with output_csv.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "month",
                "bond_spread_bp",
                "leading_cyclical_component",
                "lead_source_note",
                "bond_source_note",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build a corrected 12-month source CSV for 장단기_선행지수.png."
    )
    parser.add_argument("--spread-csv", required=True, help="Input spread CSV path")
    parser.add_argument("--leading-json", required=True, help="Input leading-index JSON path")
    parser.add_argument("--output-csv", required=True, help="Output CSV path")
    parser.add_argument("--latest-leading-month", default=None)
    parser.add_argument("--latest-leading-value", type=float, default=None)
    parser.add_argument("--spread-note", default="spread source csv")
    parser.add_argument("--leading-note", default="leading json")
    parser.add_argument("--latest-leading-note", default="manual latest leading value")
    args = parser.parse_args()

    rows = build_rows(
        spread_rows=load_spread_rows(Path(args.spread_csv)),
        leading_points=load_leading_points(Path(args.leading_json)),
        latest_leading_month=args.latest_leading_month,
        latest_leading_value=args.latest_leading_value,
        spread_note=args.spread_note,
        leading_note=args.leading_note,
        latest_leading_note=args.latest_leading_note,
    )
    if not rows:
        raise ValueError("No overlapping spread/leading rows were produced.")

    write_rows(Path(args.output_csv), rows)
    print(f"Saved: {Path(args.output_csv).resolve()}")
    print(f"Period: {rows[0]['month']} ~ {rows[-1]['month']} ({len(rows)} rows)")


if __name__ == "__main__":
    main()
