"""Create the Korean-date Kakao JPG, retaining the existing promotional artwork."""
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from io import BytesIO
import json
import urllib.request
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
NOW = datetime.now(ZoneInfo('Asia/Seoul'))
DAY = NOW.strftime('%Y-%m-%d')
WEEKDAY = '월화수목금토일'[NOW.weekday()]
LABEL = f'{NOW.year}년 {NOW.month}월 {NOW.day}일 {WEEKDAY}요일'
BASE = 'https://gaygechqnvehajmsnvfb.supabase.co/storage/v1/object/public/gallery/'
source = ROOT / 'kakao-simple-20261111.jpg'
try:
    with urllib.request.urlopen(BASE + 'inventory/kakao-preview.json', timeout=12) as r:
        meta = json.load(r)
    path = meta.get('image', '')
    if path.startswith('inventory/kakao-preview/') and path.endswith('.jpg'):
        with urllib.request.urlopen(BASE + path, timeout=15) as r:
            im = Image.open(BytesIO(r.read())).convert('RGB')
    else:
        im = Image.open(source).convert('RGB')
except Exception as exc:
    print('Using local default artwork:', exc)
    im = Image.open(source).convert('RGB')

im = im.resize((1200, 630), Image.Resampling.LANCZOS)
draw = ImageDraw.Draw(im, 'RGBA')
# Date ribbon along the bottom, readable on any source color.
draw.rounded_rectangle((345, 554, 855, 616), radius=17, fill=(10, 25, 49, 225), outline=(255, 255, 255, 130), width=2)
fonts = [
    '/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf',
    '/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
]
font_path = next((p for p in fonts if Path(p).exists()), None)
if not font_path:
    raise RuntimeError('Korean font not installed; install fonts-nanum before generating the JPG')
font = ImageFont.truetype(font_path, 34)
draw.text((600, 585), LABEL, font=font, anchor='mm', fill=(255,255,255,255), stroke_width=0)
out = ROOT / 'kakao-daily' / f'{DAY}.jpg'
out.parent.mkdir(exist_ok=True)
im.save(out, quality=91, optimize=True)
print(f'Created {out}: {LABEL}')
