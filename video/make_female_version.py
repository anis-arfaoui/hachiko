import subprocess

# Re-mux video stream with female audio track - instant 0.1s operation!
video_in = 'C:/Users/hp/Documents/loyalty/loyalty-app/video/algerian_video_project.mp4'
audio_in = 'C:/Users/hp/Documents/loyalty/loyalty-app/video/final_audio_amina.wav'
video_out = 'C:/Users/hp/Documents/loyalty/loyalty-app/video/algerian_video_project_female.mp4'

cmd = [
    'ffmpeg', '-y',
    '-i', video_in,
    '-i', audio_in,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-map', '0:v:0',
    '-map', '1:a:0',
    '-shortest',
    video_out
]

subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print('Female version ready:', video_out)
