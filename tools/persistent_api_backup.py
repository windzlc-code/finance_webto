#!/usr/bin/env python3
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import shutil
import sqlite3
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = ROOT / "data" / "tfse.sqlite3"
DEFAULT_BACKUP_DIR = ROOT / "data" / "backups"
CRITICAL_TABLES = [
    "lead_forms",
    "audit_logs",
    "event_logs",
    "public_feedback_tickets",
    "compliance_reviews",
    "privacy_request_tasks",
    "lead_rate_limits",
]


def now_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def connect(path: Path, readonly: bool = False) -> sqlite3.Connection:
    conn = sqlite3.connect(str(path), timeout=30.0)
    conn.row_factory = sqlite3.Row
    if readonly:
        conn.execute("PRAGMA query_only=ON")
    return conn


def table_counts(db_path: Path) -> dict[str, int | None]:
    counts: dict[str, int | None] = {}
    with connect(db_path, readonly=True) as conn:
        existing = {
            row["name"]
            for row in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'").fetchall()
        }
        for table in CRITICAL_TABLES:
            if table not in existing:
                counts[table] = None
                continue
            counts[table] = conn.execute(f"SELECT COUNT(1) FROM {table}").fetchone()[0]
    return counts


def integrity_check(db_path: Path) -> str:
    with connect(db_path, readonly=True) as conn:
        return str(conn.execute("PRAGMA integrity_check").fetchone()[0])


def sqlite_online_backup(source_db: Path, target_db: Path) -> None:
    target_db.parent.mkdir(parents=True, exist_ok=True)
    with connect(source_db, readonly=True) as source, connect(target_db) as target:
        source.backup(target)


def gzip_file(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with source.open("rb") as src, gzip.open(destination, "wb", compresslevel=6) as dst:
        shutil.copyfileobj(src, dst)


def gunzip_file(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with gzip.open(source, "rb") as src, destination.open("wb") as dst:
        shutil.copyfileobj(src, dst)


def remove_sqlite_sidecars(path: Path) -> None:
    for suffix in ("-wal", "-shm"):
        sidecar = Path(str(path) + suffix)
        if sidecar.exists():
            sidecar.unlink()


def create_backup(db_path: Path, backup_dir: Path, label: str = "") -> dict:
    if not db_path.exists():
        raise FileNotFoundError(f"database not found: {db_path}")
    stamp = now_stamp()
    prefix = f"tfse-api-{stamp}" + (f"-{label}" if label else "")
    raw_backup = backup_dir / f"{prefix}.sqlite3"
    archive = backup_dir / f"{prefix}.sqlite3.gz"
    manifest_path = backup_dir / f"{prefix}.manifest.json"
    sqlite_online_backup(db_path, raw_backup)
    source_counts = table_counts(db_path)
    backup_counts = table_counts(raw_backup)
    backup_integrity = integrity_check(raw_backup)
    gzip_file(raw_backup, archive)
    raw_backup.unlink()
    remove_sqlite_sidecars(raw_backup)
    manifest = {
        "format": "tfse_persistent_api_backup_manifest",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source_db": str(db_path),
        "backup_file": str(archive),
        "manifest_file": str(manifest_path),
        "sha256": sha256_file(archive),
        "size_bytes": archive.stat().st_size,
        "source_counts": source_counts,
        "backup_counts": backup_counts,
        "integrity_check": backup_integrity,
        "counts_match": source_counts == backup_counts,
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return manifest


def restore_drill(backup_file: Path) -> dict:
    if not backup_file.exists():
        raise FileNotFoundError(f"backup not found: {backup_file}")
    with tempfile.TemporaryDirectory(prefix="tfse-restore-drill-") as temp_dir:
        restored = Path(temp_dir) / "tfse-restored.sqlite3"
        if backup_file.suffix == ".gz":
            gunzip_file(backup_file, restored)
        else:
            shutil.copy2(backup_file, restored)
        counts = table_counts(restored)
        return {
            "format": "tfse_persistent_api_restore_drill",
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "backup_file": str(backup_file),
            "sha256": sha256_file(backup_file),
            "integrity_check": integrity_check(restored),
            "row_count_checks": counts,
            "critical_tables_present": all(value is not None for value in counts.values()),
        }


def render_markdown(payload: dict) -> str:
    if payload.get("format") == "tfse_persistent_api_backup_manifest":
        lines = [
            "# TFSE Persistent API Backup",
            "",
            f"- Backup file: `{payload['backup_file']}`",
            f"- Manifest: `{payload['manifest_file']}`",
            f"- SHA256: `{payload['sha256']}`",
            f"- Size bytes: `{payload['size_bytes']}`",
            f"- Integrity: `{payload['integrity_check']}`",
            f"- Counts match: `{payload['counts_match']}`",
            "",
            "| Table | Source | Backup |",
            "| --- | ---: | ---: |",
        ]
        for table in CRITICAL_TABLES:
            lines.append(f"| {table} | {payload['source_counts'].get(table)} | {payload['backup_counts'].get(table)} |")
        return "\n".join(lines)
    lines = [
        "# TFSE Persistent API Restore Drill",
        "",
        f"- Backup file: `{payload['backup_file']}`",
        f"- SHA256: `{payload['sha256']}`",
        f"- Integrity: `{payload['integrity_check']}`",
        f"- Critical tables present: `{payload['critical_tables_present']}`",
        "",
        "| Table | Rows |",
        "| --- | ---: |",
    ]
    for table in CRITICAL_TABLES:
        lines.append(f"| {table} | {payload['row_count_checks'].get(table)} |")
    return "\n".join(lines)


def latest_backup(backup_dir: Path) -> Path | None:
    candidates = sorted(backup_dir.glob("tfse-api-*.sqlite3.gz"), key=lambda item: item.stat().st_mtime, reverse=True)
    return candidates[0] if candidates else None


def main() -> int:
    parser = argparse.ArgumentParser(description="Back up or restore-drill the TFSE persistent SQLite API database.")
    parser.add_argument("--db", default=str(DEFAULT_DB))
    parser.add_argument("--backup-dir", default=str(DEFAULT_BACKUP_DIR))
    parser.add_argument("--label", default="")
    parser.add_argument("--restore-drill", action="store_true")
    parser.add_argument("--backup-file", default="")
    parser.add_argument("--markdown", action="store_true")
    args = parser.parse_args()

    db_path = Path(args.db)
    backup_dir = Path(args.backup_dir)
    if args.restore_drill:
        backup_file = Path(args.backup_file) if args.backup_file else latest_backup(backup_dir)
        if not backup_file:
            raise FileNotFoundError(f"no backup found in {backup_dir}")
        payload = restore_drill(backup_file)
        ok = payload["integrity_check"] == "ok" and payload["critical_tables_present"]
    else:
        payload = create_backup(db_path, backup_dir, args.label)
        ok = payload["integrity_check"] == "ok" and payload["counts_match"]
    print(render_markdown(payload) if args.markdown else json.dumps(payload, ensure_ascii=False, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
