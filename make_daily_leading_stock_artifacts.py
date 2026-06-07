from __future__ import annotations

import argparse
import csv
import json
import shutil
from datetime import datetime
from pathlib import Path


def load_payload(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def to_rows(payload: dict) -> list[dict[str, object]]:
    leading_points = payload["leading_cyclical_component"]["points"]
    kospi_points = payload["kospi"]["points"]
    rows: list[dict[str, object]] = []
    for leading, kospi in zip(leading_points, kospi_points, strict=True):
        rows.append(
            {
                "month": leading[0],
                "선행지수": float(leading[1]),
                "주가": float(kospi[1]),
            }
        )
    return rows


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["month", "선행지수", "주가"])
        writer.writeheader()
        writer.writerows(rows)


def write_summary(path: Path, rows: list[dict[str, object]], execution_date: str, copied_png: bool) -> None:
    latest = rows[-1]
    note = (
        "matplotlib 미설치로 최신 공통 12개월 차트 PNG를 오늘 폴더로 복사함."
        if copied_png
        else "오늘 실행에서 차트 PNG를 재생성함."
    )
    lines = [
        f"실행일: 20{execution_date[:2]}-{execution_date[2:4]}-{execution_date[4:]}",
        f"데이터 구간: {rows[0]['month']} ~ {rows[-1]['month']} (최신 공통 12개월)",
        f"최신 선행지수: {latest['선행지수']:.2f} ({latest['month']})",
        f"최신 주가: {latest['주가']:.2f} ({latest['month']})",
        f"비고: {note}",
    ]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def update_date_folders(root: Path) -> None:
    dates = sorted(p.name for p in root.iterdir() if p.is_dir() and p.name.isdigit() and len(p.name) == 6)
    output = root / "date-folders.json"
    output.write_text(json.dumps({"dates": dates}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def try_render_png(data_json: Path, output_png: Path) -> bool:
    try:
        from plot_leading_stock import build_chart
    except Exception:
        return False

    try:
        build_chart(data_json, output_png)
        return True
    except Exception:
        return False


def main() -> None:
    parser = argparse.ArgumentParser(description="Create today's leading-stock output folder and artifacts.")
    parser.add_argument("--source-json", required=True)
    parser.add_argument("--source-png", required=True)
    parser.add_argument("--output-root", default=".")
    parser.add_argument("--execution-date", default=datetime.now().strftime("%y%m%d"))
    args = parser.parse_args()

    root = Path(args.output_root).resolve()
    source_json = Path(args.source_json).resolve()
    source_png = Path(args.source_png).resolve()
    target_dir = root / args.execution_date
    target_dir.mkdir(parents=True, exist_ok=True)

    payload = load_payload(source_json)
    rows = to_rows(payload)

    target_json = target_dir / "일별금융지표2_data.json"
    target_png = target_dir / "선행지수_주가.png"
    target_csv = target_dir / "선행지수_주가_월별데이터.csv"
    target_summary = target_dir / "일별금융지표2_요약.txt"

    shutil.copy2(source_json, target_json)
    rendered = try_render_png(target_json, target_png)
    if not rendered:
        shutil.copy2(source_png, target_png)
    write_csv(target_csv, rows)
    write_summary(target_summary, rows, args.execution_date, copied_png=not rendered)
    update_date_folders(root)

    print(f"saved_dir={target_dir}")
    print(f"rendered_png={rendered}")
    print(f"window={rows[0]['month']}~{rows[-1]['month']}")


if __name__ == "__main__":
    main()
