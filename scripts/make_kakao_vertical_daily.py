"""Generate the vertical Kakao promotion with today's Korean date (KST).

The uploaded original remains untouched; only the date bar is redrawn.
"""
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "harmony_kakao_promo_1200x1600.jpg"
if not SOURCE.is_file():
    raise FileNotFoundError(f"Vertical promotion artwork missing: {SOURCE}")

now = datetime.now(ZoneInfo("Asia/Seoul"))
day = now.strftime("%Y-%m-%d")
weekday = "월화수목금토일"[now.weekday()]
label = f"{now.year}년 {now.month}월 {now.day}일 {weekday}요일"

image = Image.open(SOURCE).convert("RGB")
if image.size != (1200, 1600):
    raise ValueError(f"Expected 1200x1600 original, got {image.size}")
draw = ImageDraw.Draw(image)
font_candidates = [
    "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc",
    "C:/Windows/Fonts/malgunbd.ttf",
]
font_path = next((p for p in font_candidates if Path(p).is_file()), None)
if not font_path:
    raise RuntimeError("Korean bold font unavailable (install fonts-nanum)")
font = ImageFont.truetype(font_path, 52)

# Cover only the original navy date pill, preserving surrounding artwork.
draw.rounded_rectangle((251, 1289, 938, 1377), radius=25, fill="#0a1a38")
draw.text((594, 1333), label, font=font, anchor="mm", fill="white")

outdir = ROOT / "kakao-vertical-daily"
outdir.mkdir(parents=True, exist_ok=True)
dated = outdir / f"{day}.jpg"
image.save(dated, quality=94, optimize=True)
image.save(outdir / "latest.jpg", quality=94, optimize=True)
print(f"Generated {dated.relative_to(ROOT)} and latest.jpg: {label}")
