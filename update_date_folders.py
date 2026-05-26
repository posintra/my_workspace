from __future__ import annotations

import json
from pathlib import Path


def collect_yymmdd_dirs(base: Path) -> list[str]:
    return sorted(
        [p.name for p in base.iterdir() if p.is_dir() and p.name.isdigit() and len(p.name) == 6]
    )


def main() -> None:
    root = Path(__file__).resolve().parent
    dates = collect_yymmdd_dirs(root)
    output = root / "date-folders.json"
    payload = {"dates": dates}
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"updated {output} with {len(dates)} folders")


if __name__ == "__main__":
    main()
