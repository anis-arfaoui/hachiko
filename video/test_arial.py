from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 42)

text = 'في نفس الشارع، كاين زوج قهاوي'
reshaped_text = arabic_reshaper.reshape(text)
bidi_text = get_display(reshaped_text)

im = Image.new('RGBA', (600, 150), (10, 14, 23, 255))
draw = ImageDraw.Draw(im)

bbox = draw.textbbox((0, 0), bidi_text, font=font)
tw = bbox[2] - bbox[0]
th = bbox[3] - bbox[1]
x = (600 - tw) // 2
y = (150 - th) // 2

draw.text((x, y), bidi_text, fill=(255, 255, 255, 255), font=font)
im.save('C:/Users/hp/Documents/loyalty/loyalty-app/video/test_arial_render.png')
print('Rendered arial')
