"""
Upload element icons to imgbb
"""
import requests
import base64
import os
import json

API_KEY = '06a98f5c0c2dad952e6ab94b03040f36'
PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
ELEMENTS_DIR = os.path.join(PROJECT_ROOT, 'data', 'images', 'Autre', 'elements')
OUTPUT_JSON = os.path.join(PROJECT_ROOT, 'data', 'element_urls.json')

# Mapping des fichiers vers les noms d'éléments
elements = {
    'feu.png': 'Feu',
    'eau.png': 'Eau',
    'terre.png': 'Terre',
    'air.png': 'Air',
    'lumiere.png': 'Lumière',
    'nuit.png': 'Nuit',
    'divin.png': 'Divin',
    'maléfique.png': 'Maléfique'
}

uploaded_urls = {}

for filename, element_name in elements.items():
    filepath = os.path.join(ELEMENTS_DIR, filename)

    if not os.path.exists(filepath):
        print(f"Fichier non trouvé: {filepath}")
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
            'name': f'element_{element_name}'
        }
    )

    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            url = result['data']['url']
            uploaded_urls[element_name] = url
            print(f"OK {element_name}: {url}")
        else:
            print(f"FAIL {element_name}: Upload failed - {result}")
    else:
        print(f"FAIL {element_name}: HTTP {response.status_code}")

print("\n--- URLs pour ElementIcons ---")
print("window.ElementIcons = {")
for element, url in uploaded_urls.items():
    print(f"    '{element}': '<img src=\"{url}\" alt=\"{element}\" class=\"element-icon\" style=\"width: 20px; height: 20px; vertical-align: middle;\">',")
print("};")

# Sauvegarder les URLs
with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(uploaded_urls, f, ensure_ascii=False, indent=2)
print(f"\nURLs sauvegardees dans {OUTPUT_JSON}")
