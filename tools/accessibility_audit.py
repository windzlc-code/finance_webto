from html.parser import HTMLParser
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
LEAD_FORM_PAGES = ("index.html", "index-2.html", "free-check.html")
REQUIRED_LEAD_FIELDS = (
    "display_name",
    "phone",
    "line_id",
    "region",
    "needs",
    "occupation_type",
    "income_type",
    "source_url",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "cf_turnstile_response",
    "consent_privacy",
    "consent_line",
    "website",
)


class A11yParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.html_lang = ""
        self.images = []
        self.controls = []
        self.labels_for = set()
        self.lead_message_live = False

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag == "html":
            self.html_lang = data.get("lang", "").strip()
        elif tag == "img":
            self.images.append(data)
        elif tag in ("input", "select", "textarea"):
            self.controls.append((tag, data))
        elif tag == "label" and data.get("for"):
            self.labels_for.add(data["for"])
        if data.get("class") == "form-messege" and data.get("aria-live"):
            self.lead_message_live = True


def html_paths():
    return sorted(ROOT.glob("*.html")) + sorted((ROOT / "lp").glob("*.html")) + sorted((ROOT / "database").glob("*.html"))


def text_has_field(text, field):
    return f'name="{field}"' in text or f'name=\\"{field}\\"' in text


def is_hidden_control(tag, attrs):
    input_type = attrs.get("type", "").lower()
    style = attrs.get("style", "").replace(" ", "").lower()
    return (
        input_type in {"hidden", "submit", "button", "reset", "file"}
        or attrs.get("hidden") is not None
        or attrs.get("aria-hidden") == "true"
        or "left:-9999px" in style
        or "opacity:0" in style
    )


def has_accessible_name(tag, attrs, labels_for):
    if is_hidden_control(tag, attrs):
        return True
    input_type = attrs.get("type", "").lower()
    if input_type in {"checkbox", "radio"}:
        return True
    control_id = attrs.get("id", "")
    return bool(
        attrs.get("aria-label")
        or attrs.get("aria-labelledby")
        or attrs.get("placeholder")
        or attrs.get("title")
        or (control_id and control_id in labels_for)
    )


def audit_html():
    failures = []
    for path in html_paths():
        label = path.relative_to(ROOT).as_posix()
        text = path.read_text(encoding="utf-8", errors="ignore")
        parser = A11yParser()
        parser.feed(text)
        if not parser.html_lang:
            failures.append(f"{label}: missing html lang")
        for index, attrs in enumerate(parser.images, start=1):
            if "alt" not in attrs:
                failures.append(f"{label}: image #{index} missing alt")
        if 'id="contact-form"' in text:
            if not parser.lead_message_live:
                failures.append(f"{label}: lead form message must include aria-live")
            if 'data-lead-submit' not in text:
                failures.append(f"{label}: lead form missing data-lead-submit")
            for field in REQUIRED_LEAD_FIELDS:
                if not text_has_field(text, field):
                    failures.append(f"{label}: lead form missing field {field}")
            for tag, attrs in parser.controls:
                name = attrs.get("name", "")
                if name in REQUIRED_LEAD_FIELDS and not has_accessible_name(tag, attrs, parser.labels_for):
                    failures.append(f"{label}: lead form control {name or tag} lacks accessible name")
            honeypots = [attrs for tag, attrs in parser.controls if tag == "input" and attrs.get("name") == "website"]
            if honeypots and not all(is_hidden_control("input", attrs) for attrs in honeypots):
                failures.append(f"{label}: honeypot field should be hidden from assistive tech")
    return failures


def audit_landing_renderer():
    failures = []
    script = (ROOT / "assets/js/tfse-landing-pages.js").read_text(encoding="utf-8", errors="ignore")
    for field in REQUIRED_LEAD_FIELDS:
        if not text_has_field(script, field):
            failures.append(f"tfse-landing-pages.js: generated lead form missing field {field}")
    for marker in ('class=\\"form-messege\\" aria-live=\\"polite\\"', 'data-lead-submit', 'aria-label=\\"需求類型\\"'):
        if marker not in script:
            failures.append(f"tfse-landing-pages.js: missing generated accessibility marker {marker}")
    return failures


def main():
    failures = audit_html() + audit_landing_renderer()
    if failures:
        for failure in failures:
            print(failure)
        return 1
    print("accessibility audit passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
