from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1] / 'public'
for size in (192, 512):
    image = Image.new('RGB', (size, size), '#f5f1e8')
    draw = ImageDraw.Draw(image)
    pad = round(size * .12)
    draw.rounded_rectangle((pad, pad, size - pad, size - pad), radius=round(size * .18), fill='#202a35')
    # Símbolo simple y legible incluso en el icono pequeño.
    pts = [(size*.54, size*.22), (size*.32, size*.53), (size*.50, size*.53), (size*.44, size*.78), (size*.70, size*.43), (size*.52, size*.43)]
    draw.polygon(pts, fill='#f3bf69')
    image.save(root / f'icon-{size}.png')
