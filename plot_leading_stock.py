import argparse
import json
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
from matplotlib import font_manager, rcParams


def _configure_korean_font() -> None:
    malgun_path = "C:/Windows/Fonts/malgun.ttf"
    try:
        font_prop = font_manager.FontProperties(fname=malgun_path)
        font_name = font_prop.get_name()
        rcParams["font.family"] = font_name
        rcParams["font.sans-serif"] = [font_name]
    except Exception:
        pass
    rcParams["axes.unicode_minus"] = False


def _points_to_df(points: list[list], value_name: str) -> pd.DataFrame:
    df = pd.DataFrame(points, columns=["month", value_name])
    df["date"] = pd.to_datetime(df["month"], format="%Y-%m", errors="coerce")
    df[value_name] = pd.to_numeric(df[value_name], errors="coerce")
    df = df.dropna(subset=["date", value_name]).sort_values("date")
    return df


def _last_value_per_month(df: pd.DataFrame, value_name: str) -> pd.DataFrame:
    # If duplicate entries exist in a month, keep the last value in that month.
    month_key = df["date"].dt.to_period("M")
    out = (
        df.assign(month_key=month_key)
        .sort_values("date")
        .groupby("month_key", as_index=False)
        .tail(1)
        .drop(columns=["month_key"])
        .sort_values("date")
        .reset_index(drop=True)
    )
    return out[["date", value_name]]


def build_chart(data_json: Path, output_png: Path) -> pd.DataFrame:
    payload = json.loads(data_json.read_text(encoding="utf-8"))
    leading_points = payload["leading_cyclical_component"]["points"]
    kospi_points = payload["kospi"]["points"]

    leading_df = _points_to_df(leading_points, "leading_index")
    kospi_df = _points_to_df(kospi_points, "kospi")

    # Ensure KOSPI uses month-end (last trading day) monthly value.
    leading_df = _last_value_per_month(leading_df, "leading_index")
    kospi_df = _last_value_per_month(kospi_df, "kospi")

    merged = pd.merge(leading_df, kospi_df, on="date", how="inner")
    merged = merged.sort_values("date").tail(12).reset_index(drop=True)
    if merged.empty:
        raise ValueError("No merged monthly data found.")

    plt.style.use("seaborn-v0_8-whitegrid")
    _configure_korean_font()

    fig, (ax1, ax_table) = plt.subplots(
        2,
        1,
        figsize=(14, 8),
        gridspec_kw={"height_ratios": [4.6, 1.4]},
    )
    ax2 = ax1.twinx()

    line1 = ax1.plot(merged["date"], merged["leading_index"], color="#1f77b4", linewidth=2.2, label="선행지수")
    line2 = ax2.plot(merged["date"], merged["kospi"], color="#d62728", linewidth=2.2, label="주가")

    ax1.set_title("선행지수 VS 주가 비교", fontsize=14, pad=10)
    ax1.set_xlabel("월")
    ax1.set_ylabel("선행지수", color="#1f77b4")
    ax2.set_ylabel("주가", color="#d62728")
    ax1.tick_params(axis="y", colors="#1f77b4")
    ax2.tick_params(axis="y", colors="#d62728")

    lines = line1 + line2
    labels = [line.get_label() for line in lines]
    ax1.legend(lines, labels, loc="best", frameon=True)

    months = merged["date"].dt.strftime("%Y-%m").tolist()
    leading_vals = [f"{v:.2f}" if pd.notna(v) else "-" for v in merged["leading_index"]]
    kospi_vals = [f"{v:,.2f}" if pd.notna(v) else "-" for v in merged["kospi"]]

    ax_table.axis("off")
    table = ax_table.table(
        cellText=[leading_vals, kospi_vals],
        rowLabels=["선행지수", "주가"],
        colLabels=months,
        cellLoc="center",
        loc="center",
    )
    table.auto_set_font_size(False)
    table.set_fontsize(8.5)
    table.scale(1.0, 1.2)

    fig.autofmt_xdate()
    fig.tight_layout()
    output_png.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_png, dpi=150)
    plt.close(fig)
    return merged


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate 선행지수_주가.png with 12-month data table.")
    parser.add_argument("--data-json", required=True, help="Input JSON file path")
    parser.add_argument("--output", required=True, help="Output PNG file path")
    args = parser.parse_args()

    merged = build_chart(Path(args.data_json), Path(args.output))
    print(f"Saved: {Path(args.output).resolve()}")
    print(f"Period: {merged['date'].min().date()} ~ {merged['date'].max().date()} ({len(merged)} rows)")


if __name__ == "__main__":
    main()

