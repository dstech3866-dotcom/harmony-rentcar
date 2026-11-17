"""Validate generated Kakao images before any automatic deployment.

Read-only validation: never touches source artwork, inventory or site files.
"""
from datetime import datetime
from hashlib import sha256
from pathlib import Path
from zoneinfo import ZoneInfo

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TODAY = datetime.now(ZoneInfo("Asia/Seoul")).strftime("%Y-%m-%d")
OUTPUTS = (
    ("kakao-daily", (1200, 630)),
    ("kakao-vertical-daily", (1200, 1600)),
)


def verify_image(path: Path, expected_size: tuple[int, int]) -> None:
    if not path.is_file() or path.stat().st_size < 10_000:
        raise ValueError(f"Missing or unusually small image: {path}")
    with Image.open(path) as image:
        if image.format != "JPEG" or image.size != expected_size:
            raise ValueError(
                f"Unexpected image format/size for {path}: "
                f"{image.format}, {image.size}; expected JPEG {expected_size}"
            )
        image.verify()


def validate() -> None:
    for folder, dimensions in OUTPUTS:
        dated = ROOT / folder / f"{TODAY}.jpg"
        latest = ROOT / folder / "latest.jpg"
        verify_image(dated, dimensions)
        verify_image(latest, dimensions)
        if sha256(dated.read_bytes()).digest() != sha256(latest.read_bytes()).digest():
            raise ValueError(f"{folder}: latest.jpg differs from today's dated image")
        print(f"OK: {folder}, {TODAY}, {dimensions[0]}x{dimensions[1]}")


if __name__ == "__main__":
    validate()
