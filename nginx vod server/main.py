import os
import requests

# Beállítások (módosítsd a megfelelő IP-kkel)
VOD_MANAGEMENT_URL = "http://vod-management-service:5000/register-video"
VOD_DIRECTORY = "/usr/share/nginx/html/vod"

# Fájlok regisztrálása
def register_file(filename):
    # Egyéni metaadatok létrehozása
    data = {
        "title": filename.split('.')[0],  # A fájl neve lesz a cím
        "description": "Automatically registered video",
        "path": f"/vod/{filename}",
        "category": "Uploaded",
        "duration": 0  # Alapértelmezett érték, később frissíthető
    }

    # API hívás a VOD Management Service felé
    response = requests.post(VOD_MANAGEMENT_URL, json=data)
    if response.status_code == 200:
        print(f"Successfully registered: {filename}")
    else:
        print(f"Failed to register: {filename}. Error: {response.text}")

# Mappa figyelése és fájlok feldolgozása
def monitor_vod_directory():
    existing_files = set(os.listdir(VOD_DIRECTORY))
    print(f"Monitoring directory: {VOD_DIRECTORY}")

    while True:
        current_files = set(os.listdir(VOD_DIRECTORY))
        new_files = current_files - existing_files

        for new_file in new_files:
            if new_file.endswith(".m3u8"):
                register_file(new_file)

        existing_files = current_files