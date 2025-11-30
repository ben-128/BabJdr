"""
Upload stat icons to imgbb
"""
import requests
import base64
import os
import json

API_KEY = '06a98f5c0c2dad952e6ab94b03040f36'
PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
STATS_DIR = os.path.join(PROJECT_ROOT, 'data', 'images', 'Autre', 'stats')
OUTPUT_JSON = os.path.join(PROJECT_ROOT, 'data', 'stat_urls.json')

# Mapping des fichiers vers les noms de stats
stats = {
    'Force.png': 'Force',
    'Agilité.png': 'Agilité',
    'Endurance.png': 'Endurance',
    'Intelligence.png': 'Intelligence',
    'Volonté.png': 'Volonté',
    'Chance.png': 'Chance'
}

uploaded_urls = {}

for filename, stat_name in stats.items():
    filepath = os.path.join(STATS_DIR, filename)

    if not os.path.exists(filepath):
        print(f"Fichier non trouve: {filepath}")
        continue

    # Lire et encoder en base64
    with open(filepath, 'rb') as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')

    # Upload sur imgbb
    response = requests.post(
        'https://api.imgbb.com/1/upload',
        data={
            'key': API_KEY,
            'image': image_data,
            'name': f'stat_{stat_name}'
        }
    )

    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            url = result['data']['url']
            uploaded_urls[stat_name] = url
            print(f"OK {stat_name}: {url}")
        else:
            print(f"FAIL {stat_name}: Upload failed - {result}")
    else:
        print(f"FAIL {stat_name}: HTTP {response.status_code}")

print("\n--- URLs pour StatIcons ---")
print("window.StatIcons = {")
for stat, url in uploaded_urls.items():
    print(f"    '{stat}': '<img src=\"{url}\" alt=\"{stat}\" class=\"stat-icon\" style=\"width: 20px; height: 20px; vertical-align: middle;\">',")
print("};")

# Sauvegarder les URLs
with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(uploaded_urls, f, ensure_ascii=False, indent=2)
print(f"\nURLs sauvegardees dans {OUTPUT_JSON}")
