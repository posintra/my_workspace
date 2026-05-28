import argparse
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
from matplotlib import font_manager, rcParams


def _read_series(csv_path: Path, date_col: str | None, value_col: str | None, series_name: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    if df.empty:
        raise ValueError(f"Empty file: {csv_path}")

    if date_col is None:
        date_col = df.columns[0]
    if value_col is None:
        if len(df.columns) < 2:
            raise ValueError(f"Value column not found: {csv_path}")
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

    # Keep spread timeline as the 12 monthly columns and align leading values to it.
    merged = pd.merge(spread, leading, on="date", how="left")
    if merged.empty:
        raise ValueError("No data after merge.")

    merged = merged.sort_values("date").tail(12).reset_index(drop=True)
    merged["leading_cycle"] = merged["leading_cycle"].interpolate(method="linear", limit_direction="both")

    plt.style.use("seaborn-v0_8-whitegrid")
    # Apply Korean-capable font after style setup because style resets rcParams.
    font_prop = None
    malgun_path = "C:/Windows/Fonts/malgun.ttf"
    try:
        font_prop = font_manager.FontProperties(fname=malgun_path)
        font_name = font_prop.get_name()
        rcParams["font.family"] = font_name
        rcParams["font.sans-serif"] = [font_name]
    except Exception:
        font_prop = None
    rcParams["axes.unicode_minus"] = False

    fig, (ax1, ax_table) = plt.subplots(
        2,
        1,
        figsize=(14, 8),
        gridspec_kw={"height_ratios": [4.6, 1.4]},
    )
    ax2 = ax1.twinx()

    line1 = ax1.plot(merged["date"], merged["spread_bp"], color="#1f77b4", linewidth=2.2, label="장단기금리차 (bp)")
    line2 = ax2.plot(merged["date"], merged["leading_cycle"], color="#d62728", linewidth=2.2, label="선행지수")

    ax1.set_title("장단기금리차 VS 선행지수 비교", fontsize=14, pad=10)
    ax1.set_xlabel("월")
    ax1.set_ylabel("장단기금리차 (bp)", color="#1f77b4")
    ax2.set_ylabel("선행지수", color="#d62728")
    ax1.tick_params(axis="y", colors="#1f77b4")
    ax2.tick_params(axis="y", colors="#d62728")

    lines = line1 + line2
    labels = [line.get_label() for line in lines]
    ax1.legend(lines, labels, loc="best", frameon=True)

    if font_prop is not None:
        ax1.title.set_fontproperties(font_prop)
        ax1.xaxis.label.set_fontproperties(font_prop)
        ax1.yaxis.label.set_fontproperties(font_prop)
        ax2.yaxis.label.set_fontproperties(font_prop)

    months = merged["date"].dt.strftime("%Y-%m").tolist()
    spread_vals = [f"{v:.1f}" if pd.notna(v) else "-" for v in merged["spread_bp"]]
    leading_vals = [f"{v:.1f}" if pd.notna(v) else "-" for v in merged["leading_cycle"]]

    ax_table.axis("off")
    table = ax_table.table(
        cellText=[spread_vals, leading_vals],
        rowLabels=["장단기금리차", "선행지수"],
        colLabels=months,
        cellLoc="center",
        loc="center",
    )
    table.auto_set_font_size(False)
    table.set_fontsize(8.5)
    table.scale(1.0, 1.2)
    if font_prop is not None:
        for cell in table.get_celld().values():
            cell.get_text().set_fontproperties(font_prop)

    fig.autofmt_xdate()
    fig.tight_layout()
    output_png.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_png, dpi=150)
    plt.close(fig)
    return merged


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate spread vs leading chart with a monthly data table.")
    parser.add_argument("--spread-csv", required=True, help="Spread CSV path")
    parser.add_argument("--leading-csv", required=True, help="Leading index CSV path")
    parser.add_argument("--output", default="bond_vs_leading_mapped.png", help="Output PNG path")
    parser.add_argument("--spread-date-col", default=None, help="Spread date column")
    parser.add_argument("--spread-value-col", default=None, help="Spread value column")
    parser.add_argument("--leading-date-col", default=None, help="Leading date column")
    parser.add_argument("--leading-value-col", default=None, help="Leading value column")
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

    print(f"Saved: {Path(args.output).resolve()}")
    print(f"Period: {merged['date'].min().date()} ~ {merged['date'].max().date()} ({len(merged)} rows)")


if __name__ == "__main__":
    main()
