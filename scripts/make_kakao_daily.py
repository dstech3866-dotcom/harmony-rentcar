"""Preserve the original designed Kakao preview; update only the Korean date."""
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
now = datetime.now(ZoneInfo("Asia/Seoul"))
day = now.strftime("%Y-%m-%d")
weekday = "월화수목금토일"[now.weekday()]
label = f"{now.year}년 {now.month}월 {now.day}일 {weekday}요일"

# Preserve the professionally designed original artwork (logo, icons, CTA).
source = ROOT / "harmony_kakao_selected_design.jpg"
if not source.is_file():
    source = ROOT / "kakao-preview-large-base.jpg"
if not source.is_file():
    raise FileNotFoundError(f"Original Kakao artwork missing: {source}")
im = Image.open(source).convert("RGB").resize((1200, 630), Image.Resampling.LANCZOS)
draw = ImageDraw.Draw(im)

font_candidates = [
    "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc",
    "C:/Windows/Fonts/malgunbd.ttf",
]
font_path = next((p for p in font_candidates if Path(p).is_file()), None)
if not font_path:
    raise RuntimeError("Korean bold font unavailable (install fonts-nanum)")
font = ImageFont.truetype(font_path, 43)

# Change the date in its original bottom position; leave all other art intact.
draw.rounded_rectangle((288, 539, 902, 606), radius=32, fill="#0a1a38")
draw.text((600, 573), label, font=font, anchor="mm", fill="white")

out = ROOT / "kakao-daily" / f"{day}.jpg"
out.parent.mkdir(parents=True, exist_ok=True)
im.save(out, quality=95, optimize=True)
print(f"Created {out} from original design: {label}")
