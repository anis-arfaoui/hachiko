import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

font_path = 'C:/Windows/Fonts/arialbd.ttf'
font = ImageFont.truetype(font_path, 38)
font_small = ImageFont.truetype(font_path, 38)

def shape_ar(text):
    return get_display(arabic_reshaper.reshape(text))

def inpaint_frame(img):
    roi = img[150:290, 750:1170]
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    _, text_thresh = cv2.threshold(gray, 170, 255, cv2.THRESH_BINARY)
    b, g, r = roi[:, :, 0], roi[:, :, 1], roi[:, :, 2]
    blue_thresh = ((b > 120) & (b > r.astype(int) + 30)).astype(np.uint8) * 255
    roi_mask = cv2.bitwise_or(text_thresh, blue_thresh)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    roi_mask = cv2.dilate(roi_mask, kernel, iterations=1)
    
    mask = np.zeros((img.shape[0], img.shape[1]), dtype=np.uint8)
    mask[150:290, 750:1170] = roi_mask
    return cv2.inpaint(img, mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)

def draw_subtitles(cv_img, t):
    clean_cv = inpaint_frame(cv_img)
    pil_img = Image.fromarray(cv2.cvtColor(clean_cv, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_img, 'RGBA')
    
    # Determine text based on timestamp t
    l1 = ''
    l2 = ''
    highlight_l2 = False
    
    if 0.0 <= t < 1.45:
        l1 = 'في نفس الشارع،'
    elif 1.45 <= t < 2.80:
        l1 = 'في نفس الشارع،'
        l2 = 'كاين زوج قهاوي'
        highlight_l2 = True
    elif 2.80 <= t < 3.85:
        l1 = 'نفس القهوة،'
    elif 3.85 <= t < 5.30:
        l1 = 'نفس القهوة،'
        l2 = 'ونفس الأسعار'
    elif 5.30 <= t < 7.30:
        l1 = 'بصح وحدة فيهم'
        l2 = 'ديما معمرة'
    elif 7.30 <= t < 8.35:
        l1 = 'على بالك'
        l2 = 'علاش؟'
    elif 8.35 <= t <= 10.15:
        l1 = 'على خاطر'
        l2 = 'تخدم بسيستام'
        highlight_l2 = True

    center_x = 960
    y1 = 180
    y2 = 236
    
    def draw_centered_text(text, y, is_badge=False):
        if not text:
            return
        bidi = shape_ar(text)
        bbox = draw.textbbox((0, 0), bidi, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        x = center_x - w // 2
        
        if is_badge:
            pad_x = 18
            pad_y = 8
            badge_rect = [x - pad_x, y - pad_y, x + w + pad_x, y + h + pad_y]
            draw.rounded_rectangle(badge_rect, radius=10, fill=(38, 62, 199, 255))
        else:
            # Shadow
            draw.text((x, y + 2), bidi, font=font, fill=(0, 0, 0, 180))
            
        draw.text((x, y), bidi, font=font, fill=(255, 255, 255, 255))

    if l1:
        draw_centered_text(l1, y1)
    if l2:
        draw_centered_text(l2, y2, is_badge=highlight_l2)
        
    return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

# Test on a few timestamps
cap = cv2.VideoCapture('c:/Users/hp/Downloads/Video Project.mp4')
fps = cap.get(cv2.CAP_PROP_FPS)

test_times = [1.0, 2.0, 4.5, 6.2, 7.8, 9.2]
for t in test_times:
    frame_idx = int(t * fps)
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
    ret, frame = cap.read()
    if ret:
        out_frame = draw_subtitles(frame, t)
        cv2.imwrite(f'C:/Users/hp/Documents/loyalty/loyalty-app/video/preview_{t:.1f}s.jpg', out_frame)

cap.release()
print('Preview frames generated!')
