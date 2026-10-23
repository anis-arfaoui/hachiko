import asyncio, edge_tts, subprocess, os

lines = [
    ('line1', 'فِي نَفْسْ الشَّارِعْ، كَايْنْ زُوجْ قَهَاوِي.', 0.2),
    ('line2', 'نَفْسْ القَهْوَة، ونَفْسْ الأَسْعَارْ.', 2.9),
    ('line3', 'بَصَّحْ وَحْدَة فِيهُمْ دِيمَا مْعَمْرَا.', 5.2),
    ('line4', 'عْلَى بَالْكْ عَلَاشْ؟', 7.2),
    ('line5', 'لْخَاطَرْ تْخْدَمْ بِالسِّيسْتَامْ.', 8.2)
]

async def build_voice(voice_tag, voice_id):
    clips = []
    for name, text, start_t in lines:
        raw = f'C:/Users/hp/Documents/loyalty/loyalty-app/video/v_{voice_tag}_{name}.mp3'
        clean = f'C:/Users/hp/Documents/loyalty/loyalty-app/video/v_{voice_tag}_{name}.wav'
        for _ in range(3):
            try:
                c = edge_tts.Communicate(text, voice_id, rate='+15%')
                await c.save(raw)
                break
            except Exception as e:
                await asyncio.sleep(1)
        
        # Trim leading/trailing silence
        cmd = f'ffmpeg -y -i "{raw}" -af "silenceremove=start_periods=1:start_duration=0.03:start_threshold=-35dB:detection=peak,areverse,silenceremove=start_periods=1:start_duration=0.03:start_threshold=-35dB:detection=peak,areverse" "{clean}"'
        subprocess.run(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        clips.append((clean, start_t))
        await asyncio.sleep(0.3)
    
    # Delay and mix speech
    inputs = ''
    filter_complex = ''
    for i, (path, start_t) in enumerate(clips):
        inputs += f' -i "{path}"'
        delay_ms = int(start_t * 1000)
        filter_complex += f'[{i}:a]adelay={delay_ms}|{delay_ms}[a{i}];'
    
    mix_inputs = ''.join(f'[a{i}]' for i in range(len(clips)))
    filter_complex += f'{mix_inputs}amix=inputs={len(clips)}:dropout_transition=0,volume=2.2[speech];'
    
    # Add isolated music track
    # music input index is len(clips)
    music_idx = len(clips)
    inputs += ' -i "C:/Users/hp/Documents/loyalty/loyalty-app/video/music_isolated.wav"'
    filter_complex += f'[{music_idx}:a]volume=1.0[bgm];[speech][bgm]amix=inputs=2:duration=first:dropout_transition=0[final_a]'
    
    out_audio = f'C:/Users/hp/Documents/loyalty/loyalty-app/video/final_audio_{voice_tag}.wav'
    mix_cmd = f'ffmpeg -y {inputs} -filter_complex "{filter_complex}" -map "[final_a]" -t 10.07 "{out_audio}"'
    subprocess.run(mix_cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f'Done final audio: {out_audio}')

async def main():
    await build_voice('ismael', 'ar-DZ-IsmaelNeural')
    await build_voice('amina', 'ar-DZ-AminaNeural')

asyncio.run(main())
