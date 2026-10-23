import cv2
import numpy as np

# Load frame
img = cv2.imread('C:/Users/hp/Documents/loyalty/loyalty-app/video/trans_06.jpg')
h, w = img.shape[:2]

# Subtitle zone: y: 150 to 290, x: 750 to 1170
mask = np.zeros((h, w), dtype=np.uint8)

# Detect bright text (white) and the blue pill
roi = img[150:290, 750:1170]
gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

# White text mask
_, text_thresh = cv2.threshold(gray, 170, 255, cv2.THRESH_BINARY)

# Blue pill mask: blue channel high, red channel low
b = roi[:, :, 0]
g = roi[:, :, 1]
r = roi[:, :, 2]
blue_thresh = ((b > 120) & (b > r.astype(int) + 30)).astype(np.uint8) * 255

roi_mask = cv2.bitwise_or(text_thresh, blue_thresh)

# Dilate mask slightly by 4 pixels to cover antialiased edges
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
roi_mask = cv2.dilate(roi_mask, kernel, iterations=1)

mask[150:290, 750:1170] = roi_mask

# Inpaint using Telea
inpainted = cv2.inpaint(img, mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)

cv2.imwrite('C:/Users/hp/Documents/loyalty/loyalty-app/video/test_inpainted.jpg', inpainted)
cv2.imwrite('C:/Users/hp/Documents/loyalty/loyalty-app/video/test_mask.jpg', mask)
print('Inpainted successfully')
