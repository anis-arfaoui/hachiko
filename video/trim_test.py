import asyncio, edge_tts, subprocess, os, glob

lines = [
    ('line1', 'في نفس الشارع، كاين زوج قهاوي.'),
    ('line2', 'نفس القهوة، ونفس الأسعار.'),
    ('line3', 'بصح وحدة فيهم ديما معمرة.'),
    ('line4', 'على بالك علاش؟'),
    ('line5', 'على خاطر تخدم بسيستام.')
]

async def gen():
    for name, text in lines:
        for voice_tag, voice in [('ismael', 'ar-DZ-IsmaelNeural'), ('amina', 'ar-DZ-AminaNeural')]:
            c = edge_tts.Communicate(text, voice, rate='+25%')
            raw = f'C:/Users/hp/Documents/loyalty/loyalty-app/video/raw_{name}_{voice_tag}.mp3'
            trimmed = f'C:/Users/hp/Documents/loyalty/loyalty-app/video/trimmed_{name}_{voice_tag}.wav'
            await c.save(raw)
            # trim silences using ffmpeg
            cmd = f'ffmpeg -y -i "{raw}" -af "silenceremove=start_periods=1:start_duration=0.05:start_threshold=-40dB:detection=peak,areverse,silenceremove=start_periods=1:start_duration=0.05:start_threshold=-40dB:detection=peak,areverse" "{trimmed}"'
            subprocess.run(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            dur_cmd = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', trimmed]
            dur = float(subprocess.check_output(dur_cmd).decode().strip())
            print(f'{name} {voice_tag}: {dur:.2f}s')

asyncio.run(gen())
