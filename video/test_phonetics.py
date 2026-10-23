import asyncio, edge_tts

tests = [
    ('p3_1', 'بَصَّحْ وَحْدَة فِيهُمْ دِيمَا مْعَمْرَا.'),
    ('p3_2', 'بَصَّحْ وَحْدَة فِيهُمْ دَايْمَا مْعَمْرَة.'),
    ('p4_1', 'عْلَى بَالْكْ عْـلَاشْ؟'),
    ('p4_2', 'عْلَى بَالْكْ عَلَاشْ؟'),
    ('p4_3', 'عْلَى بَالْكْ عْلاَشْ؟'),
    ('p4_4', 'عْلَى بَالْكُمْ عَلَاشْ؟'),
    ('p5_1', 'عْلَى خَاطَرْ تْخْدَمْ بْسِيسْتَامْ.'),
    ('p5_2', 'عْلَى خَاطَرْ تْخْدَمْ بِسِيسْتَامْ.')
]

async def main():
    for name, text in tests:
        c = edge_tts.Communicate(text, 'ar-DZ-IsmaelNeural', rate='+10%')
        await c.save(f'C:/Users/hp/Documents/loyalty/loyalty-app/video/t_{name}.mp3')
        await asyncio.sleep(0.3)
    print('Rendered all tests')

asyncio.run(main())
