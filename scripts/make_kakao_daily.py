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
# Larger high-contrast date inside the existing bottom date area.
# Keep the original preview canvas (1200x630) and all other elements unchanged.
font_size = 56
font = ImageFont.truetype(font_path, font_size)
date_text = f"{now.year}년 {now.month}월 {now.day}일"
weekday_text = f" {weekday}요일"
# Fit the complete label safely within the navy pill, including on wide dates.
while font_size > 40:
    font = ImageFont.truetype(font_path, font_size)
    total_width = draw.textlength(date_text + weekday_text, font=font)
    if total_width <= 660:
        break
    font_size -= 1

# Enlarge the navy date pill without changing the rest of the preview.
draw.rounded_rectangle((242, 532, 958, 614), radius=37, fill="#0a1a38")
first_width = draw.textlength(date_text, font=font)
second_width = draw.textlength(weekday_text, font=font)
left = 600 - (first_width + second_width) / 2
draw.text((left, 573), date_text, font=font, anchor="lm", fill="white", stroke_width=1)
draw.text((left + first_width, 573), weekday_text, font=font, anchor="lm", fill="#ffe600", stroke_width=1)

out = ROOT / "kakao-daily" / f"{day}.jpg"
out.parent.mkdir(parents=True, exist_ok=True)
im.save(out, quality=95, optimize=True)
# Stable Open Graph image URL; overwritten with the newest date each day.
im.save(out.parent / "latest.jpg", quality=95, optimize=True)
print(f"Created {out} from original design: {label}")
