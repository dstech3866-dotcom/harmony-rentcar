"""Preserve the original designed Kakao preview; update only the Korean date."""
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from PIL import Image, ImageDraw, ImageFont
from urllib.request import Request, urlopen
from io import BytesIO
import json

ROOT = Path(__file__).resolve().parents[1]
now = datetime.now(ZoneInfo("Asia/Seoul"))
day = now.strftime("%Y-%m-%d")
weekday = "월화수목금토일"[now.weekday()]
label = f"{now.year}년 {now.month}월 {now.day}일 {weekday}요일"

# Prefer the admin-published design. Fall back to the original artwork offline.
base = "https://gaygechqnvehajmsnvfb.supabase.co/storage/v1/object/public/gallery/"
im = None
try:
    request = Request(base + "inventory/kakao-preview.json", headers={"Cache-Control": "no-cache"})
    with urlopen(request, timeout=12) as response:
        metadata = json.load(response)
    image_path = metadata.get("image", "")
    if isinstance(image_path, str) and image_path.startswith("inventory/kakao-preview/") and image_path.endswith(".jpg"):
        with urlopen(Request(base + image_path, headers={"Cache-Control": "no-cache"}), timeout=15) as response:
            im = Image.open(BytesIO(response.read())).convert("RGB")
        print(f"Using admin-selected Kakao design: {image_path}")
except Exception as exc:
    print(f"Admin Kakao image unavailable, using bundled original: {exc}")

if im is None:
    source = ROOT / "harmony_kakao_selected_design.jpg"
    if not source.is_file():
        source = ROOT / "kakao-preview-large-base.jpg"
    if not source.is_file():
        raise FileNotFoundError(f"Original Kakao artwork missing: {source}")
    im = Image.open(source).convert("RGB")
# Preserve the whole original design (including its bottom CTA) without covering it.
# Reserve a separate 96-pixel footer for the daily date inside 1200x630.
canvas = Image.new("RGB", (1200, 630), "white")
art = im.resize((1017, 534), Image.Resampling.LANCZOS)
canvas.paste(art, ((1200 - art.width) // 2, 0))
im = canvas
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
font_size = 48
font = ImageFont.truetype(font_path, font_size)
date_text = f"{now.year}년 {now.month}월 {now.day}일"
weekday_text = f" {weekday}요일"
while font_size > 34 and draw.textlength(date_text + weekday_text, font=font) > 690:
    font_size -= 1
    font = ImageFont.truetype(font_path, font_size)

# Draw only in the reserved footer; never overprint the promotional button.
draw.rounded_rectangle((218, 542, 982, 620), radius=35, fill="#0a1a38")
first_width = draw.textlength(date_text, font=font)
second_width = draw.textlength(weekday_text, font=font)
left = 600 - (first_width + second_width) / 2
draw.text((left, 581), date_text, font=font, anchor="lm", fill="white")
draw.text((left + first_width, 581), weekday_text, font=font, anchor="lm", fill="#ffe600")

out = ROOT / "kakao-daily" / f"{day}.jpg"
out.parent.mkdir(parents=True, exist_ok=True)
im.save(out, quality=95, optimize=True)
# Stable Open Graph image URL; overwritten with the newest date each day.
im.save(out.parent / "latest.jpg", quality=95, optimize=True)
print(f"Created {out} from original design: {label}")
