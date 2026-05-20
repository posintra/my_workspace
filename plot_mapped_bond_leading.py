import argparse
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


def _read_series(csv_path: Path, date_col: str | None, value_col: str | None, series_name: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    if df.empty:
        raise ValueError(f"빈 파일입니다: {csv_path}")

    if date_col is None:
        date_col = df.columns[0]
    if value_col is None:
        if len(df.columns) < 2:
            raise ValueError(f"값 컬럼을 찾을 수 없습니다: {csv_path}")
        value_col = df.columns[1]

    out = df[[date_col, value_col]].copy()
    out.columns = ["date", series_name]
    out["date"] = pd.to_datetime(out["date"], errors="coerce")
    out[series_name] = pd.to_numeric(out[series_name], errors="coerce")
    out = out.dropna(subset=["date", series_name]).sort_values("date")
    return out


def build_mapped_plot(
    spread_csv: Path,
    leading_csv: Path,
    output_png: Path,
    spread_date_col: str | None = None,
    spread_value_col: str | None = None,
    leading_date_col: str | None = None,
    leading_value_col: str | None = None,
) -> pd.DataFrame:
    spread = _read_series(spread_csv, spread_date_col, spread_value_col, "spread_bp")
    leading = _read_series(leading_csv, leading_date_col, leading_value_col, "leading_cycle")

    merged = pd.merge(spread, leading, on="date", how="inner")
    if merged.empty:
        raise ValueError("공통 기간이 없습니다. 두 CSV의 날짜 형식을 확인해 주세요.")

    plt.style.use("seaborn-v0_8-whitegrid")
    fig, ax1 = plt.subplots(figsize=(11, 6))
    ax2 = ax1.twinx()

    line1 = ax1.plot(merged["date"], merged["spread_bp"], color="#1f77b4", linewidth=2.2, label="장단기금리차 (bp)")
    line2 = ax2.plot(merged["date"], merged["leading_cycle"], color="#d62728", linewidth=2.2, label="선행지수순환변동치")

    ax1.set_title("장단기금리차 vs 선행지수순환변동치 (공통 기간 매핑)", fontsize=14, pad=10)
    ax1.set_xlabel("날짜")
    ax1.set_ylabel("장단기금리차 (bp)", color="#1f77b4")
    ax2.set_ylabel("선행지수순환변동치", color="#d62728")

    ax1.tick_params(axis="y", colors="#1f77b4")
    ax2.tick_params(axis="y", colors="#d62728")

    lines = line1 + line2
    labels = [l.get_label() for l in lines]
    ax1.legend(lines, labels, loc="best", frameon=True)

    fig.autofmt_xdate()
    fig.tight_layout()
    output_png.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_png, dpi=150)
    plt.close(fig)

    return merged


def main() -> None:
    parser = argparse.ArgumentParser(
        description="장단기금리차와 선행지수순환변동치를 공통 기간으로 매핑해 하나의 꺾은선그래프로 저장합니다."
    )
    parser.add_argument("--spread-csv", required=True, help="장단기금리차 CSV 경로")
    parser.add_argument("--leading-csv", required=True, help="선행지수순환변동치 CSV 경로")
    parser.add_argument("--output", default="bond_vs_leading_mapped.png", help="출력 PNG 경로")
    parser.add_argument("--spread-date-col", default=None, help="장단기 CSV 날짜 컬럼명 (기본: 첫 번째 컬럼)")
    parser.add_argument("--spread-value-col", default=None, help="장단기 CSV 값 컬럼명 (기본: 두 번째 컬럼)")
    parser.add_argument("--leading-date-col", default=None, help="선행지수 CSV 날짜 컬럼명 (기본: 첫 번째 컬럼)")
    parser.add_argument("--leading-value-col", default=None, help="선행지수 CSV 값 컬럼명 (기본: 두 번째 컬럼)")
    args = parser.parse_args()

    merged = build_mapped_plot(
        spread_csv=Path(args.spread_csv),
        leading_csv=Path(args.leading_csv),
        output_png=Path(args.output),
        spread_date_col=args.spread_date_col,
        spread_value_col=args.spread_value_col,
        leading_date_col=args.leading_date_col,
        leading_value_col=args.leading_value_col,
    )

    print(f"그래프 저장 완료: {Path(args.output).resolve()}")
    print(f"공통 기간: {merged['date'].min().date()} ~ {merged['date'].max().date()} ({len(merged)}개 관측치)")


if __name__ == "__main__":
    main()
