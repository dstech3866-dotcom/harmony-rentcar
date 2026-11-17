"""Create enlarged Kakao artwork with an automatically updated Korean date."""
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
now = datetime.now(ZoneInfo("Asia/Seoul"))
day = now.strftime("%Y-%m-%d")
weekday = "월화수목금토일"[now.weekday()]
label = f"{now.year}년 {now.month}월 {now.day}일 {weekday}요일"
source = ROOT / "kakao-preview-large-base.jpg"
im = Image.open(source).convert("RGB").resize((1200,630),Image.Resampling.LANCZOS)
draw = ImageDraw.Draw(im)
fonts = [
    "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "C:/Windows/Fonts/malgunbd.ttf",
]
font_path = next((p for p in fonts if Path(p).exists()), None)
if not font_path:
    raise RuntimeError("Korean font unavailable; install fonts-nanum")
font = ImageFont.truetype(font_path, 53)
draw.text((600,565),label,font=font,anchor="mm",fill="white")
out = ROOT / "kakao-daily" / f"{day}.jpg"
out.parent.mkdir(parents=True,exist_ok=True)
im.save(out,quality=93,optimize=True)
print(f"Created {out}: {label}")
