import subprocess
from PIL import Image

# Extract frames around transition 1: 2.5s to 3.0s at 10 fps
subprocess.run('ffmpeg -y -ss 00:00:02.5 -i "c:/Users/hp/Downloads/Video Project.mp4" -t 0.6 -r 10 "C:/Users/hp/Documents/loyalty/loyalty-app/video/trans_%02d.jpg"', shell=True)

# Check text in these frames
print('Extracted transition frames')
