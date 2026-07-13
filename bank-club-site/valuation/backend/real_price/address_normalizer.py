from __future__ import annotations

import re


_FULLWIDTH_DIGITS = str.maketrans(
    "０１２３４５６７８９ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ",
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
)

_CHINESE_DIGITS = {
    "零": 0,
    "〇": 0,
    "一": 1,
    "二": 2,
    "兩": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9,
}
_CHINESE_UNITS = {"十": 10, "百": 100, "千": 1000, "萬": 10000}
_CITY_RE = re.compile(
    r"(台北市|新北市|桃園市|台中市|台南市|高雄市|基隆市|新竹市|嘉義市|"
    r"新竹縣|苗栗縣|彰化縣|南投縣|雲林縣|嘉義縣|屏東縣|宜蘭縣|花蓮縣|台東縣|"
    r"澎湖縣|金門縣|連江縣)"
)


def normalize_digits(text: str | None) -> str:
    if not text:
        return ""
    return str(text).translate(_FULLWIDTH_DIGITS)


def chinese_number_to_int(text: str | None) -> int | None:
    raw = str(text or "").strip()
    if not raw:
        return None
    if raw.isdigit():
        return int(raw)
    if any(ch not in _CHINESE_DIGITS and ch not in _CHINESE_UNITS for ch in raw):
        return None

    total = 0
    section = 0
    number = 0
    has_unit = any(ch in _CHINESE_UNITS for ch in raw)
    if not has_unit:
        digits = [_CHINESE_DIGITS[ch] for ch in raw if ch in _CHINESE_DIGITS]
        if not digits:
            return None
        return int("".join(str(digit) for digit in digits))

    for ch in raw:
        if ch in _CHINESE_DIGITS:
            number = _CHINESE_DIGITS[ch]
            continue
        unit = _CHINESE_UNITS.get(ch)
        if unit is None:
            return None
        if unit == 10000:
            section = (section + number) or 1
            total += section * unit
            section = 0
            number = 0
            continue
        section += (number or 1) * unit
        number = 0
    return total + section + number


def _replace_chinese_address_numbers(text: str) -> str:
    pattern = re.compile(r"([零〇一二兩三四五六七八九十百千萬]+)(?=(?:段|巷|弄|號|樓|層))")

    def repl(match: re.Match[str]) -> str:
        parsed = chinese_number_to_int(match.group(1))
        return str(parsed) if parsed is not None else match.group(1)

    return pattern.sub(repl, text)


def normalize_address(address: str | None) -> str:
    text = normalize_digits(address)
    text = text.replace("臺", "台")
    text = re.sub(r"\s+", "", text)
    text = text.replace("－", "-").replace("ー", "-")
    text = _replace_chinese_address_numbers(text)
    text = re.sub(r"(號(?:之\d+)?)(?:地下)?\d+(?:樓|層)(?:之\d+)?.*$", r"\1", text)
    text = re.sub(r"(?:地下)?\d+(?:樓|層)(?:之\d+)?.*$", "", text)
    text = re.sub(r"[，,。；;].*$", "", text)
    return text.strip()


def parse_city_district(address: str | None) -> tuple[str | None, str | None]:
    text = normalize_address(address)
    city_match = _CITY_RE.search(text)
    city = city_match.group(1) if city_match else None
    district = None
    if city:
        rest = text[city_match.end() :]
        district_match = re.match(r"(.{1,6}?[區鄉鎮市])", rest)
        if district_match:
            district = district_match.group(1)
    return city, district
