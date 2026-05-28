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


def build_chart(config_json: Path, output_png: Path) -> pd.DataFrame:
    payload = json.loads(config_json.read_text(encoding="utf-8"))
    labels = payload["data"]["labels"]
    datasets = payload["data"]["datasets"]

    kospi = datasets[0]["data"]
    exports = datasets[1]["data"]

    df = pd.DataFrame(
        {
            "month": labels,
            "date": pd.to_datetime(labels, format="%Y-%m", errors="coerce"),
            "kospi": pd.to_numeric(kospi, errors="coerce"),
            "exports": pd.to_numeric(exports, errors="coerce"),
        }
    ).dropna(subset=["date"]).sort_values("date").tail(12)

    plt.style.use("seaborn-v0_8-whitegrid")
    _configure_korean_font()

    fig, (ax1, ax_table) = plt.subplots(
        2,
        1,
        figsize=(14, 8),
        gridspec_kw={"height_ratios": [4.6, 1.4]},
    )
    ax2 = ax1.twinx()

    line1 = ax1.plot(df["date"], df["kospi"], color="#d62728", linewidth=2.2, label="주가")
    line2 = ax2.plot(df["date"], df["exports"], color="#1f77b4", linewidth=2.2, label="일별수출액")

    ax1.set_title("주가 VS 일별수출액 비교", fontsize=14, pad=10)
    ax1.set_xlabel("월")
    ax1.set_ylabel("주가", color="#d62728")
    ax2.set_ylabel("일별수출액", color="#1f77b4")
    ax1.tick_params(axis="y", colors="#d62728")
    ax2.tick_params(axis="y", colors="#1f77b4")

    lines = line1 + line2
    labels = [line.get_label() for line in lines]
    ax1.legend(lines, labels, loc="best", frameon=True)

    months = df["date"].dt.strftime("%Y-%m").tolist()
    kospi_vals = [f"{v:,.2f}" if pd.notna(v) else "-" for v in df["kospi"]]
    export_vals = [f"{v:,.1f}" if pd.notna(v) else "-" for v in df["exports"]]

    ax_table.axis("off")
    table = ax_table.table(
        cellText=[kospi_vals, export_vals],
        rowLabels=["주가", "일별수출액"],
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
    parser = argparse.ArgumentParser(description="Generate 주가_일별수출액.png with 12-month data table.")
    parser.add_argument("--config-json", required=True, help="Input chart config JSON path")
    parser.add_argument("--output", required=True, help="Output PNG path")
    args = parser.parse_args()

    df = build_chart(Path(args.config_json), Path(args.output))
    print(f"Saved: {Path(args.output).resolve()}")
    print(f"Period: {df['date'].min().date()} ~ {df['date'].max().date()} ({len(df)} rows)")


if __name__ == "__main__":
    main()

