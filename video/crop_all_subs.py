import cv2
import numpy as np

# Let's extract timestamps and inspect frames
cap = cv2.VideoCapture('c:/Users/hp/Downloads/There’s a customer you’ve already lost… and you don’t know it yet.Three coffees a week, then not.mp4')
fps = cap.get(cv2.CAP_PROP_FPS)

# Sample every 0.5 seconds from 10s to 38s
timestamps = [i * 0.5 for i in range(20, 77)]

for t in timestamps:
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
    ret, frame = cap.read()
    if ret:
        # crop top subtitle area: y from 160 to 320, full width
        sub_crop = frame[160:320, :]
        cv2.imwrite(f'C:/Users/hp/.gemini/antigravity-cli/brain/4bb9002f-5c07-46b0-8411-63b24e39339b/scratch/sub_{t:.1f}s.jpg', sub_crop)

cap.release()
print('Cropped subtitle frames saved')
