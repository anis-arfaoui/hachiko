import subprocess, glob

for f in sorted(glob.glob('C:/Users/hp/Documents/loyalty/loyalty-app/video/line*_ismael.mp3')):
    cmd = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', f]
    dur = float(subprocess.check_output(cmd).decode().strip())
    print(f, dur)
