from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Video
from auth import verify_token
from pydantic_models import VideoCreate, VideoResponse  # Pydantic modellek az adatellenőrzéshez és válaszokhoz
from typing import List
from datetime import datetime
import os
import requests
from bs4 import BeautifulSoup
import time

router = APIRouter()

# NGINX VOD szerver alap URL-je (környezeti változóból vagy alapértelmezett értékkel)
VOD_SERVER_URL = os.getenv("VOD_SERVER_URL", "http://nginx-vod-service:8080/vod/")
VOD_SERVER_URL_GLOBAL = "http://localhost:8080/vod/"

# Induláskor: Automatikus videó szinkronizálás az NGINX szerverről
@router.on_event("startup")
def startup_sync_videos():
    print("Videószinkronizáció indítása...")
    db = next(get_db())
    max_retries = 5
    retry_delay = 5

    try:
        for attempt in range(max_retries):
            try:
                print(f"{attempt + 1}/{max_retries} próbálkozás az NGINX-hez...")
                response = requests.get(VOD_SERVER_URL)
                response.raise_for_status()
                video_files = extract_video_filenames(response.text)

                for file in video_files:
                    if not db.query(Video).filter(Video.path == f"/{file}").first():
                        new_video = Video(
                            title=file.split(".")[0],
                            description="Automatikusan szinkronizálva az NGINX-ből",
                            path=f"/{file}",
                            category="Synced",
                            created_at=datetime.utcnow()
                        )
                        db.add(new_video)
                        db.commit()
                        print(f"Videó hozzáadva: {new_video.title}")
                break  # Ha sikeres, kilépünk a próbálkozások ciklusából
            except requests.RequestException as e:
                print(f"Sikertelen próbálkozás: {e}")
                time.sleep(retry_delay)
        else:
            print("Maximális próbálkozások száma elérve.")
    except Exception as e:
        print(f"Hiba történt a szinkronizáció során: {e}")
    finally:
        db.close()
        print("Adatbázis-kapcsolat lezárva.")


# Segédfüggvény: HTML tartalom feldolgozása .m3u8 fájlok kinyerésére
def extract_video_filenames(html_content):
    """
    HTML tartalom feldolgozása és .m3u8 fájlnevek kinyerése.
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    video_files = []

    # Keresünk minden <a> tag-et, és kiszűrjük azokat, amelyek .m3u8 fájlokra mutatnak
    for link in soup.find_all('a'):
        href = link.get('href')
        if href and href.endswith(".m3u8"):
            video_files.append(href)
    print(f"Kinyert fájlnevek: {video_files}")
    return video_files

# Végpont: Videó elérése .m3u8 fájlnév alapján
@router.get("/videos/{filename}", dependencies=[Depends(verify_token)])
def get_video_by_filename(filename: str, db: Session = Depends(get_db)):
    """
    Egy videófájl teljes URL-jének lekérése az NGINX szerverről.
    """
    # Ellenőrizzük, hogy a fájl létezik-e az adatbázisban
    video = db.query(Video).filter(Video.path == f"/{filename}").first()
    if not video:
        print(f"Videó nem található az adatbázisban: {filename}")
        raise HTTPException(status_code=404, detail="A videó nem található")

    # Teljes URL generálása a videóhoz
    video_url = f"{VOD_SERVER_URL_GLOBAL}{filename}"
    print(f"Videó URL generálva: {video_url}")
    return {"video_url": video_url}

# Titkosított végpont: Videók listázása
@router.get("/videos", response_model=List[VideoResponse]) #, dependencies=[Depends(verify_token)]
def list_videos(db: Session = Depends(get_db)):
    """
    Az NGINX szerverről dinamikusan lekéri az aktuális videókat,
    és az adatbázist frissíti az új videók szerint.
    """
    try:
        # Lekérdezés az NGINX szerverről
        print("Lekérdezés az NGINX szerverről")
        response = requests.get(VOD_SERVER_URL)
        response.raise_for_status()
        video_files = extract_video_filenames(response.text)

        # Az adatbázis frissítése az új videókkal
        for file in video_files:
            existing_video = db.query(Video).filter(Video.path == f"/{file}").first()
            if not existing_video:
                new_video = Video(
                    title=file.split(".")[0],
                    description="Automatikusan szinkronizálva az NGINX-ből",
                    path=f"/{file}",
                    category="Synced",
                    duration=0,
                    created_at=datetime.utcnow()
                )
                db.add(new_video)
                db.commit()
        
        # Az aktuális videók listája az adatbázisból
        videos = db.query(Video).all()
        print(f"{len(videos)} videó található az adatbázisban.")
        return videos

    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Nem sikerült elérni az NGINX szervert: {str(e)}")
