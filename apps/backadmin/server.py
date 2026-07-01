#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import sys
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


APP_ROOT = Path(__file__).resolve().parents[2]
if str(APP_ROOT) not in sys.path:
    sys.path.insert(0, str(APP_ROOT))

from backend.tfse_persistent_api import DEFAULT_ADMIN_PASSWORD, DEFAULT_DB, Handler, Store  # noqa: E402


MIME_TYPES = {
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
}


class BackadminHandler(Handler):
    static_root = APP_ROOT

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path.startswith("/api/") or path.startswith("/tfse/api/"):
            super().do_GET()
            return
        self._serve_static(path, include_body=True)

    def do_HEAD(self) -> None:
        path = urlparse(self.path).path
        self._serve_static(path, include_body=False)

    def _serve_static(self, path: str, include_body: bool) -> None:
        if path in {"", "/", "/admin", "/admin/"}:
            path = "/admin.html"
        target = (self.static_root / path.lstrip("/")).resolve()
        if target.is_dir():
            target = target / "index.html"
        if not str(target).startswith(str(self.static_root)) or not target.exists() or not target.is_file():
            self._write_json({"error": "not_found", "path": path}, status=404)
            return
        self.send_response(200)
        self.send_header("Content-Type", MIME_TYPES.get(target.suffix.lower(), "application/octet-stream"))
        if target.name == "site-config.json":
            self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if include_body:
            with target.open("rb") as handle:
                self.wfile.write(handle.read())


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Backadmin unified admin + TFSE API server")
    parser.add_argument("--host", default=os.getenv("BACKADMIN_HOST", os.getenv("TFSE_API_HOST", "0.0.0.0")))
    parser.add_argument("--port", type=int, default=int(os.getenv("BACKADMIN_PORT", os.getenv("TFSE_API_PORT", "8788"))))
    parser.add_argument("--db", default=os.getenv("TFSE_DB_PATH", str(DEFAULT_DB)))
    parser.add_argument("--static-root", default=os.getenv("BACKADMIN_STATIC_ROOT", str(APP_ROOT)))
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    BackadminHandler.static_root = Path(args.static_root).resolve()
    BackadminHandler.store = Store(Path(args.db))
    BackadminHandler.admin_password = os.getenv("TFSE_ADMIN_PASSWORD", DEFAULT_ADMIN_PASSWORD)
    server = ThreadingHTTPServer((args.host, args.port), BackadminHandler)
    print(f"Backadmin listening on http://{args.host}:{args.port} db={args.db} static={BackadminHandler.static_root}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
