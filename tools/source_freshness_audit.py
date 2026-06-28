from datetime import date, datetime
from pathlib import Path
from urllib.parse import urlparse
import json
import sys


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets" / "data"
REVIEW_CYCLE_DAYS = 90
PLACEHOLDER_SOURCE = "source-policy.html"
PENDING_PRODUCT_STATUSES = {"來源待核驗", "需更新"}
POLICY_PRODUCT_IDS = {"product_source_policy"}


def load_json(name):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


def parse_date(value):
    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except ValueError:
        return None


def is_https_url(value):
    parsed = urlparse(str(value or ""))
    return parsed.scheme == "https" and bool(parsed.netloc)


def audit_products(products):
    failures = []
    review_queue = []
    today = date.today()
    for item in products:
        item_id = item.get("id") or item.get("slug") or "unknown"
        status = item.get("status", "")
        source_url = item.get("source_url", "")
        updated_at = parse_date(item.get("updated_at", ""))
        reasons = []

        if not updated_at:
            failures.append(f"products.json: {item_id} invalid updated_at")
            reasons.append("invalid updated_at")
        else:
            age = (today - updated_at).days
            if age < -2:
                failures.append(f"products.json: {item_id} updated_at is unexpectedly in the future")
            if age > REVIEW_CYCLE_DAYS:
                reasons.append("超過 90 天未更新")
                if status != "需更新":
                    failures.append(f"products.json: {item_id} older than {REVIEW_CYCLE_DAYS} days must be marked 需更新")

        if source_url == PLACEHOLDER_SOURCE and item_id not in POLICY_PRODUCT_IDS:
            reasons.append("需補官方來源連結")
            if status not in PENDING_PRODUCT_STATUSES:
                failures.append(f"products.json: {item_id} placeholder source must be 來源待核驗 or 需更新")
        if status == "已核驗" and not is_https_url(source_url):
            failures.append(f"products.json: {item_id} 已核驗 must use an https source_url")
        if status in PENDING_PRODUCT_STATUSES:
            reasons.append(status)

        if reasons:
            review_queue.append(item_id)

    return failures


def audit_institutions(institutions):
    failures = []
    today = date.today()
    for item in institutions:
        item_id = item.get("id", "unknown")
        status = item.get("verification_status", "")
        official_url = item.get("official_url", "")
        verified_at = parse_date(item.get("last_verified_at", ""))
        if not verified_at:
            failures.append(f"institutions.json: {item_id} invalid last_verified_at")
        else:
            age = (today - verified_at).days
            if age < -2:
                failures.append(f"institutions.json: {item_id} last_verified_at is unexpectedly in the future")
            if age > REVIEW_CYCLE_DAYS and status == "verified":
                failures.append(f"institutions.json: {item_id} verified source older than {REVIEW_CYCLE_DAYS} days needs review")
        if status == "verified" and not is_https_url(official_url):
            failures.append(f"institutions.json: {item_id} verified source must use an https official_url")
        if official_url == PLACEHOLDER_SOURCE and status not in {"source_pending", "pending"}:
            failures.append(f"institutions.json: {item_id} placeholder official_url must be source_pending")
    return failures


def main():
    failures = []
    try:
        failures += audit_products(load_json("products.json"))
        failures += audit_institutions(load_json("institutions.json"))
    except Exception as error:
        print(f"source freshness audit load failed: {error}")
        return 1

    if failures:
        for failure in failures:
            print(failure)
        return 1
    print("source freshness audit passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
