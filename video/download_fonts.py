import urllib.request

urls = [
    ('Tajawal-Bold.ttf', 'https://github.com/google/fonts/raw/main/ofl/tajawal/Tajawal-Bold.ttf'),
    ('Almarai-Bold.ttf', 'https://github.com/google/fonts/raw/main/ofl/almarai/Almarai-Bold.ttf')
]

for name, url in urls:
    try:
        path = f'C:/Users/hp/Documents/loyalty/loyalty-app/video/fonts/{name}'
        urllib.request.urlretrieve(url, path)
        print(f'Downloaded {name}')
    except Exception as e:
        print(f'Failed {name}: {e}')
