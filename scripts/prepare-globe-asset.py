import cv2
import numpy as np
from PIL import Image

# 1. Load original user uploaded image
img_path = 'C:/Users/eber_johns/.gemini/antigravity/brain/5d3db494-727e-4a61-b30b-b30aa2348b49/.user_uploaded/media_1794764148441_3ff8370c.jpg'
orig = cv2.imread(img_path)
h, w, c = orig.shape

# Public theme dark background token: #06131F
# In BGR: B=31, G=19, R=6
bg_bgr = np.array([31, 19, 6], dtype=np.float32)

result = orig.copy().astype(np.float32)

# 2. Inpaint the period dot around x=373, y=243
dot_mask = np.zeros((h, w), dtype=np.uint8)
cv2.circle(dot_mask, (373, 243), 10, 255, -1)
# Also inpaint any remnant at bottom right (SCROLL TO EXPLORE v)
sub_bot = orig[580:640, 820:980]
gray_sub = cv2.cvtColor(sub_bot, cv2.COLOR_BGR2GRAY)
_, mask_sub = cv2.threshold(gray_sub, 120, 255, cv2.THRESH_BINARY)
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
mask_sub = cv2.dilate(mask_sub, kernel, iterations=1)
dot_mask[580:640, 820:980] = mask_sub

cleaned_base = cv2.inpaint(orig, dot_mask, 7, cv2.INPAINT_TELEA)

# 3. Header row (y: 0 to 68) is clean dark space / background
result[0:68, :] = bg_bgr

# 4. Left side of the globe with smooth atmosphere limb curve
for y in range(68, h):
    t_y = (y - 340.0) / 260.0
    limb_x = 385.0 + 130.0 * (t_y ** 2)
    fade_start = limb_x - 30.0
    
    for x in range(w):
        if x <= fade_start:
            result[y, x] = bg_bgr
        elif x < limb_x + 10.0:
            alpha = (x - fade_start) / (limb_x + 10.0 - fade_start)
            smooth_alpha = alpha * alpha * (3.0 - 2.0 * alpha)
            result[y, x] = bg_bgr * (1.0 - smooth_alpha) + cleaned_base[y, x] * smooth_alpha
        else:
            result[y, x] = cleaned_base[y, x]

res_u8 = np.clip(result, 0, 255).astype(np.uint8)

# Convert to RGB and save
rgb = cv2.cvtColor(res_u8, cv2.COLOR_BGR2RGB)
pil_img = Image.fromarray(rgb)
pil_img.save('public/globe.webp', 'WEBP', quality=95)
pil_img.save('public/globe.png', 'PNG')
print('Flawless globe.webp generated successfully.')
