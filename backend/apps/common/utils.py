from __future__ import annotations

import hashlib
import re
import unicodedata
from decimal import Decimal, ROUND_HALF_UP


def strip_accents(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return "".join(char for char in normalized if not unicodedata.combining(char))


def normalize_name(value: str | None) -> str:
    if not value:
        return ""

    cleaned = strip_accents(str(value)).upper().strip()
    cleaned = re.sub(r"^(M\.|MME\.|MR\.|MRS\.|DR\.|PROF\.)\s+", "", cleaned)
    cleaned = re.sub(r"[^A-Z0-9\s]", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def normalize_phone_number(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\D", "", str(value))


def hash_identity(value: str | None) -> str:
    normalized = normalize_phone_number(value)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def money(value: Decimal | str | int | float) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
