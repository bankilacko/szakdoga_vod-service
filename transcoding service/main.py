from fastapi import FastAPI, File, UploadFile, HTTPException
import os
import subprocess
from pathlib import Path
import shutil  # Fájlok másolásához

app = FastAPI()

# Configure CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:31084", "http://localhost:4200"],  # Allowed frontend origins (e.g., for local development)
    allow_credentials=True, # Allow cookies and authorization headers
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers (e.g., Authorization, Content-Type)
)

# Mappák definiálása
UPLOAD_DIR = Path("uploaded_videos")
OUTPUT_DIR = Path("/vod")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "Transcoding Service is up and running!"}

@app.post("/upload")
async def upload_video(file: UploadFile = File(...), metadata: UploadFile = File(...)):
    """
    Feltöltött MP4 videó feldolgozása és transzkódolása HLS formátumba.
    """
    if not file.filename.endswith(".mp4"):
        raise HTTPException(status_code=400, detail="Csak .mp4 fájlok engedélyezettek.")

    # Feltöltött fájl mentése
    input_file_path = UPLOAD_DIR / file.filename
    with open(input_file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Kimeneti fájlok elérési útjai
    output_file_base = OUTPUT_DIR / file.filename.replace(".mp4", "")
    m3u8_path = output_file_base.with_suffix(".m3u8")
    metadata_path = output_file_base.with_name(f"{output_file_base.stem}_info.txt")

    # Metaadatok mentése
    if metadata:
        with open(metadata_path, "wb") as meta_buffer:
            meta_buffer.write(await metadata.read())

    # FFmpeg parancs a HLS formátumhoz
    ffmpeg_command = [
        "ffmpeg",
        "-i", str(input_file_path),
        "-vf", "scale=1280:720",
        "-codec:v", "libx264",
        "-codec:a", "aac",
        "-threads", "2",
        "-f", "hls",
        "-hls_time", "10",
        "-hls_playlist_type", "vod",
        str(m3u8_path)
    ]

    # Transzkódolás
    try:
        subprocess.run(ffmpeg_command, check=True)
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Transzkódolási hiba: {str(e)}")

    return {
        "message": "Fájl sikeresen transzkódolva.",
        "m3u8_url": f"/vod/{m3u8_path.name}",
        "metadata_url": f"/vod/{metadata_path.name}" if metadata else None
    }