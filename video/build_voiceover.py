import asyncio, edge_tts, subprocess, os, time

lines = [
    ('line1', 'في نفس الشارع، كاين زوج قهاوي.', 0.2),
    ('line2', 'نفس القهوة، ونفس الأسعار.', 2.9),
    ('line3', 'بصح وحدة فيهم ديما معمرة.', 5.3),
    ('line4', 'على بالك علاش؟', 7.3),
    ('line5', 'على خاطر تخدم بسيستام.', 8.3)
]

async def gen_voice(voice_name, voice_id, rate='+15%'):
    print(f'Generating {voice_name}...')
    clips = []
    for name, text, start_t in lines:
        raw_path = f'C:/Users/hp/Documents/loyalty/loyalty-app/video/raw_{voice_name}_{name}.mp3'
        clean_path = f'C:/Users/hp/Documents/loyalty/loyalty-app/video/clean_{voice_name}_{name}.wav'
        
        # Retry logic for network
        for attempt in range(3):
            try:
                c = edge_tts.Communicate(text, voice_id, rate=rate)
                await c.save(raw_path)
                break
            except Exception as e:
                print(f'Retry {name} due to {e}')
                await asyncio.sleep(1.5)
        
        # Trim leading and trailing silences
        cmd = f'ffmpeg -y -i "{raw_path}" -af "silenceremove=start_periods=1:start_duration=0.03:start_threshold=-35dB:detection=peak,areverse,silenceremove=start_periods=1:start_duration=0.03:start_threshold=-35dB:detection=peak,areverse" "{clean_path}"'
        subprocess.run(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        clips.append((clean_path, start_t))
        await asyncio.sleep(0.5)

    # Now composite all clips into a single 10.06s audio track
    inputs = ''
    filter_complex = ''
    for i, (path, start_t) in enumerate(clips):
        inputs += f' -i "{path}"'
        delay_ms = int(start_t * 1000)
        filter_complex += f'[{i}:a]adelay={delay_ms}|{delay_ms}[a{i}];'
    
    mix_inputs = ''.join(f'[a{i}]' for i in range(len(clips)))
    filter_complex += f'{mix_inputs}amix=inputs={len(clips)}:dropout_transition=0,volume=1.8[voice_out]'
    
    out_voice = f'C:/Users/hp/Documents/loyalty/loyalty-app/video/voiceover_{voice_name}.wav'
    mix_cmd = f'ffmpeg -y {inputs} -filter_complex "{filter_complex}" -map "[voice_out]" -t 10.07 "{out_voice}"'
    subprocess.run(mix_cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f'Successfully built {out_voice}')

async def main():
    await gen_voice('ismael', 'ar-DZ-IsmaelNeural', rate='+15%')
    await asyncio.sleep(1)
    await gen_voice('amina', 'ar-DZ-AminaNeural', rate='+15%')

asyncio.run(main())
