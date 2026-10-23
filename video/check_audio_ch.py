import wave
import numpy as np

with wave.open('C:/Users/hp/.gemini/antigravity-cli/brain/4bb9002f-5c07-46b0-8411-63b24e39339b/scratch/audio.wav', 'rb') as wf:
    n_channels = wf.getnchannels()
    print('Channels:', n_channels)
    rate = wf.getframerate()
    frames = wf.readframes(wf.getnframes())

print(f'Channels: {n_channels}, Rate: {rate}')
