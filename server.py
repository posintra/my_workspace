from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse
import json
import mimetypes
import re

BASE_DIR = Path(__file__).resolve().parent
DATE_PATTERN = re.compile(r"^\d{6}$")
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"}


class FinanceHandler(SimpleHTTPRequestHandler):
    def _send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _safe_path_from_relative(self, relative_value):
        relative_path = Path(unquote(relative_value))
        target = (BASE_DIR / relative_path).resolve()
        if BASE_DIR not in target.parents and target != BASE_DIR:
            return None
        return target

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/api/date-folders":
            dates = sorted(
                [p.name for p in BASE_DIR.iterdir() if p.is_dir() and DATE_PATTERN.match(p.name)]
            )
            self._send_json({"dates": dates})
            return

        if parsed.path == "/api/images":
            query = parse_qs(parsed.query)
            date = (query.get("date", [""])[0] or "").strip()

            if not DATE_PATTERN.match(date):
                self._send_json({"files": []})
                return

            folder = BASE_DIR / date
            if not folder.is_dir():
                self._send_json({"files": []})
                return

            files = []
            for path in sorted(folder.rglob("*")):
                if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
                    files.append(path.relative_to(BASE_DIR).as_posix())

            self._send_json({"files": files})
            return

        if parsed.path.startswith("/files/"):
            encoded_relative = parsed.path[len("/files/"):]
            target = self._safe_path_from_relative(encoded_relative)
            if target is None or (not target.is_file()):
                self.send_error(404, "File not found")
                return

            content_type = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
            data = target.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        super().do_GET()


def run():
    host = "127.0.0.1"
    port = 8000
    server = ThreadingHTTPServer((host, port), FinanceHandler)
    print(f"Server running at http://{host}:{port}")
    print(f"Base directory: {BASE_DIR}")
    server.serve_forever()


if __name__ == "__main__":
    run()
