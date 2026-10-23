import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display
import subprocess
import os
import shutil

input_video = 'c:/Users/hp/Downloads/Video Project.mp4'
temp_video = 'C:/Users/hp/Documents/loyalty/loyalty-app/video/temp_video.mp4'
audio_male = 'C:/Users/hp/Documents/loyalty/loyalty-app/video/final_audio_ismael.wav'
audio_female = 'C:/Users/hp/Documents/loyalty/loyalty-app/video/final_audio_amina.wav'
out_male = 'C:/Users/hp/Documents/loyalty/loyalty-app/video/algerian_video_project.mp4'
out_female = 'C:/Users/hp/Documents/loyalty/loyalty-app/video/algerian_video_project_female.mp4'
font_path = 'C:/Windows/Fonts/arialbd.ttf'

font = ImageFont.truetype(font_path, 40)

def shape_ar(text):
    return get_display(arabic_reshaper.reshape(text))

cap = cv2.VideoCapture(input_video)
fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

print(f'Starting render: {width}x{height} @ {fps}fps, {total_frames} frames', flush=True)

ffmpeg_cmd = [
    'ffmpeg', '-y',
    '-f', 'rawvideo',
    '-vcodec', 'rawvideo',
    '-s', f'{width}x{height}',
    '-pix_fmt', 'bgr24',
    '-r', str(fps),
    '-i', '-',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '18',
    '-preset', 'fast',
    temp_video
]

proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))

for frame_idx in range(total_frames):
    ret, frame = cap.read()
    if not ret:
        break
    
    t = frame_idx / fps
    
    # 1. Inpaint original subtitles in ROI
    roi = frame[150:290, 750:1170]
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    _, text_thresh = cv2.threshold(gray, 35, 255, cv2.THRESH_BINARY)
    b, g, r = roi[:, :, 0], roi[:, :, 1], roi[:, :, 2]
    blue_thresh = ((b > 70) & (b > r.astype(int) + 20)).astype(np.uint8) * 255
    roi_mask = cv2.bitwise_or(text_thresh, blue_thresh)
    roi_mask = cv2.dilate(roi_mask, kernel, iterations=1)
    
    mask = np.zeros((height, width), dtype=np.uint8)
    mask[150:290, 750:1170] = roi_mask
    clean_frame = cv2.inpaint(frame, mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)
    
    # 2. Draw Arabic typography & motion graphic elements
    pil_img = Image.fromarray(cv2.cvtColor(clean_frame, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_img, 'RGBA')
    
    l1 = ''
    l2 = ''
    highlight_l2 = False
    l2_start_t = 0.0
    
    if 0.0 <= t < 1.45:
        l1 = 'في نفس الشارع،'
    elif 1.45 <= t < 2.80:
        l1 = 'في نفس الشارع،'
        l2 = 'كاين زوج قهاوي'
        highlight_l2 = True
        l2_start_t = 1.45
    elif 2.80 <= t < 3.85:
        l1 = 'نفس القهوة،'
    elif 3.85 <= t < 5.30:
        l1 = 'نفس القهوة،'
        l2 = 'ونفس الأسعار'
        l2_start_t = 3.85
    elif 5.30 <= t < 7.30:
        l1 = 'بصح وحدة فيهم'
        l2 = 'ديما معمرة'
        l2_start_t = 5.30
    elif 7.30 <= t < 8.35:
        l1 = 'على بالكم'
        l2 = 'علاش؟'
        l2_start_t = 7.30
    elif 8.35 <= t <= 10.15:
        l1 = 'على خاطر تخدم'
        l2 = 'بسيستام'
        highlight_l2 = True
        l2_start_t = 8.35

    center_x = 960
    y1 = 178
    y2 = 236
    
    l2_progress = 1.0
    if l2 and l2_start_t > 0:
        elapsed = t - l2_start_t
        l2_progress = min(1.0, max(0.0, elapsed / 0.15))
        l2_progress = 1.0 - (1.0 - l2_progress) ** 3 # ease-out

    if l1:
        bidi1 = shape_ar(l1)
        bbox1 = draw.textbbox((0, 0), bidi1, font=font)
        w1 = bbox1[2] - bbox1[0]
        x1 = center_x - w1 // 2
        draw.text((x1, y1 + 2), bidi1, font=font, fill=(0, 0, 0, 180))
        draw.text((x1, y1), bidi1, font=font, fill=(255, 255, 255, 255))

    if l2:
        bidi2 = shape_ar(l2)
        bbox2 = draw.textbbox((0, 0), bidi2, font=font)
        w2 = bbox2[2] - bbox2[0]
        h2 = bbox2[3] - bbox2[1]
        x2 = center_x - w2 // 2
        
        anim_y2 = int(y2 + (1.0 - l2_progress) * 8)
        alpha = int(l2_progress * 255)
        
        if highlight_l2:
            pad_x = 18
            pad_y = 8
            badge_rect = [x2 - pad_x, anim_y2 - pad_y, x2 + w2 + pad_x, anim_y2 + h2 + pad_y]
            draw.rounded_rectangle(badge_rect, radius=10, fill=(38, 62, 199, alpha))
        else:
            draw.text((x2, anim_y2 + 2), bidi2, font=font, fill=(0, 0, 0, int(alpha * 0.7)))
            
        draw.text((x2, anim_y2), bidi2, font=font, fill=(255, 255, 255, alpha))

    final_frame = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    proc.stdin.write(final_frame.tobytes())
    
    if frame_idx % 60 == 0:
        print(f'Progress: frame {frame_idx}/{total_frames} ({t:.1f}s)', flush=True)

cap.release()
proc.stdin.close()
proc.wait()

print('Video frames rendered. Now muxing audio tracks...', flush=True)

# Mux with Male Voice
subprocess.run([
    'ffmpeg', '-y',
    '-i', temp_video,
    '-i', audio_male,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-map', '0:v:0',
    '-map', '1:a:0',
    out_male
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print('Male version ready:', out_male, flush=True)

# Mux with Female Voice
subprocess.run([
    'ffmpeg', '-y',
    '-i', temp_video,
    '-i', audio_female,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-map', '0:v:0',
    '-map', '1:a:0',
    out_female
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print('Female version ready:', out_female, flush=True)
