import argparse
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


def build_chart(input_csv: Path, output_png: Path) -> pd.DataFrame:
    df = pd.read_csv(input_csv)
    df["date"] = pd.to_datetime(df["month"], format="%Y-%m", errors="coerce")
    df["spread_bps"] = pd.to_numeric(df["spread_bps"], errors="coerce")
    df["kospi"] = pd.to_numeric(df["kospi"], errors="coerce")
    df = df.dropna(subset=["date", "spread_bps", "kospi"]).sort_values("date").tail(12)

    plt.style.use("seaborn-v0_8-whitegrid")
    _configure_korean_font()

    fig, (ax1, ax_table) = plt.subplots(
        2,
        1,
        figsize=(14, 8),
        gridspec_kw={"height_ratios": [4.6, 1.4]},
    )
    ax2 = ax1.twinx()

    line1 = ax1.plot(df["date"], df["spread_bps"], color="#1f77b4", linewidth=2.2, label="장단기금리차")
    line2 = ax2.plot(df["date"], df["kospi"], color="#d62728", linewidth=2.2, label="주가")

    ax1.set_title("장단기금리차 VS 주가 비교", fontsize=14, pad=10)
    ax1.set_xlabel("월")
    ax1.set_ylabel("장단기금리차 (bp)", color="#1f77b4")
    ax2.set_ylabel("주가", color="#d62728")
    ax1.tick_params(axis="y", colors="#1f77b4")
    ax2.tick_params(axis="y", colors="#d62728")

    lines = line1 + line2
    labels = [line.get_label() for line in lines]
    ax1.legend(lines, labels, loc="best", frameon=True)

    months = df["date"].dt.strftime("%Y-%m").tolist()
    spread_vals = [f"{v:.2f}" if pd.notna(v) else "-" for v in df["spread_bps"]]
    kospi_vals = [f"{v:,.2f}" if pd.notna(v) else "-" for v in df["kospi"]]

    ax_table.axis("off")
    table = ax_table.table(
        cellText=[spread_vals, kospi_vals],
        rowLabels=["장단기금리차", "주가"],
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
    return df


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate 장단기_주가.png with 12-month data table.")
    parser.add_argument("--input-csv", required=True, help="Input monthly csv path")
    parser.add_argument("--output", required=True, help="Output PNG path")
    args = parser.parse_args()

    df = build_chart(Path(args.input_csv), Path(args.output))
    print(f"Saved: {Path(args.output).resolve()}")
    print(f"Period: {df['date'].min().date()} ~ {df['date'].max().date()} ({len(df)} rows)")


if __name__ == "__main__":
    main()

