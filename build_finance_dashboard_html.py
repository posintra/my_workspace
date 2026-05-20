from pathlib import Path


def find_latest_data_dir(base_dir: Path) -> Path:
    candidates = [p for p in base_dir.iterdir() if p.is_dir() and p.name.isdigit()]
    if not candidates:
        raise FileNotFoundError(f"날짜 폴더(예: 260519)를 찾을 수 없습니다: {base_dir}")
    return sorted(candidates, key=lambda p: p.name)[-1]


def build_index_html(project_root: Path) -> str:
    data_base = project_root / "일별금융지표"
    latest_dir = find_latest_data_dir(data_base)

    images = [
        ("장단기금리차-선행지수", "장단기_선행지수.png"),
        ("선행지수-주가", "선행지수_주가.png"),
        ("주가-일별수출액", "주가_일별수출액.png"),
        ("장단기금리차-주가", "장단기-주가.png"),
    ]

    buttons_html = []
    for idx, (label, filename) in enumerate(images):
        rel_path = f"일별금융지표/{latest_dir.name}/{filename}"
        active = " active" if idx == 0 else ""
        buttons_html.append(
            f'    <button type="button" class="chart-btn{active}" data-img="{rel_path}" data-title="{label}">{label}</button>'
        )

    default_image = f"일별금융지표/{latest_dir.name}/{images[0][1]}"
    default_title = images[0][0]

    return f"""<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>일별 주요 금융지표</title>
  <style>
    body {{
      margin: 0;
      padding: 24px;
      font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
      background: #f7f9fc;
      color: #1f2937;
    }}

    h1 {{
      margin: 0 0 16px;
      font-size: 28px;
      font-weight: 700;
    }}

    .button-row {{
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }}

    .button-row button {{
      padding: 10px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #ffffff;
      font-size: 14px;
      cursor: pointer;
    }}

    .button-row button:hover {{
      background: #eef2ff;
    }}

    .button-row button.active {{
      background: #dbeafe;
      border-color: #93c5fd;
    }}

    .chart-wrap {{
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
    }}

    .chart-title {{
      margin: 0 0 10px;
      font-size: 16px;
      font-weight: 600;
    }}

    .chart-image {{
      width: 100%;
      max-width: 1200px;
      display: block;
      border-radius: 8px;
    }}
  </style>
</head>
<body>
  <h1>일별 주요 금융지표</h1>
  <div class="button-row">
{chr(10).join(buttons_html)}
  </div>

  <div class="chart-wrap">
    <h2 id="chartTitle" class="chart-title">{default_title}</h2>
    <img id="chartImage" class="chart-image" src="{default_image}" alt="{default_title}" />
  </div>

  <script>
    const buttons = document.querySelectorAll(".chart-btn");
    const chartTitle = document.getElementById("chartTitle");
    const chartImage = document.getElementById("chartImage");

    for (const button of buttons) {{
      button.addEventListener("click", () => {{
        for (const b of buttons) b.classList.remove("active");
        button.classList.add("active");

        const title = button.dataset.title;
        const imgPath = button.dataset.img;
        chartTitle.textContent = title;
        chartImage.src = imgPath;
        chartImage.alt = title;
      }});
    }}
  </script>
</body>
</html>
"""


def main() -> None:
    project_root = Path(__file__).resolve().parent
    output = project_root / "index.html"
    html = build_index_html(project_root)
    output.write_text(html, encoding="utf-8")
    print(f"index.html 생성 완료: {output}")


if __name__ == "__main__":
    main()
