from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

out = Path(__file__).parent / 'assets'
out.mkdir(exist_ok=True)
font = ImageFont.truetype('C:/Windows/Fonts/georgiaz.ttf', 690)
icon = Image.new('RGB', (1024, 1024), '#174c3e')
draw = ImageDraw.Draw(icon)
draw.text((505, 465), 'p', font=font, fill='#f7f5ed', anchor='mm')
draw.line([(665,330),(798,197)], fill='#d99465', width=30)
draw.line([(699,197),(798,197),(798,296)], fill='#d99465', width=30)
icon.save(out / 'icon.png')
adaptive = Image.new('RGBA', (1024, 1024), (0,0,0,0))
adaptive.alpha_composite(icon.convert('RGBA').resize((650,650)), (187,187))
adaptive.save(out / 'adaptive-icon.png')
