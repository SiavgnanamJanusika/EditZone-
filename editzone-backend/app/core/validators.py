import re

NIC_OLD_RE = re.compile(r"^[0-9]{9}[vVxX]$")
NIC_NEW_RE = re.compile(r"^[0-9]{12}$")
PHONE_RE = re.compile(r"^(?:\+94|0)[0-9]{9}$")
EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


def is_valid_nic(nic: str) -> bool:
    if not nic:
        return False
    nic = nic.strip()
    return bool(NIC_OLD_RE.match(nic) or NIC_NEW_RE.match(nic))


def is_valid_phone(phone: str) -> bool:
    if not phone:
        return False
    return bool(PHONE_RE.match(phone.strip()))


def is_valid_email(email: str) -> bool:
    if not email:
        return False
    return bool(EMAIL_RE.match(email.strip()))


ALLOWED_FILE_EXTENSIONS = {
    "image": {".jpg", ".jpeg", ".png", ".gif", ".webp"},
    "video": {".mp4", ".mov", ".avi", ".mkv", ".webm"},
    "document": {".pdf", ".doc", ".docx", ".txt"},
    "archive": {".zip", ".rar", ".7z"},
    "audio": {".mp3", ".wav", ".m4a", ".ogg"},
}


def get_file_category(filename: str) -> str | None:
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    for category, exts in ALLOWED_FILE_EXTENSIONS.items():
        if ext in exts:
            return category
    return None
