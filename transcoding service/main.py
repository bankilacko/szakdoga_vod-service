from fastapi import FastAPI, File, UploadFile, HTTPException
from pathlib import Path
import subprocess
import shutil
import os 

app = FastAPI()

# Define upload and output directories
UPLOAD_DIR = Path("uploaded_videos") # Directory where uploaded videos are temporarily stored
OUTPUT_DIR = Path("/vod") # Directory where transcoded video files will be saved

# Ensure that the directories exist
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# Root API endpoint for checking wether the service is running
@app.get("/")
def read_root():
    return {"message": "Transcoding Service is up and running!"}

# Endpoint to handle video upload and transcoding
@app.post("/upload")
async def upload_video(file: UploadFile = File(...), metadata: UploadFile = File(...)):
    # Validate that the uploaded file is an MP4 video
    if not file.filename.endswith(".mp4"):
        raise HTTPException(status_code=400, detail="Only .mp4 files are enabled.")

    # Save the uploaded video file to the upload directory
    input_file_path = UPLOAD_DIR / file.filename
    with open(input_file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Define paths for the output HLS playlist and metadata file
    output_file_base = OUTPUT_DIR / file.filename.replace(".mp4", "")
    m3u8_path = output_file_base.with_suffix(".m3u8")
    metadata_path = output_file_base.with_name(f"{output_file_base.stem}_info.txt")

    # Save metadata if provided (e.g. description, duration, etc.)
    if metadata:
        with open(metadata_path, "wb") as meta_buffer:
            meta_buffer.write(await metadata.read())

    # Build the FFmpeg command to transcode the video to HLS format
    ffmpeg_command = [
        "ffmpeg",
        "-i", str(input_file_path),         # Input file path
        "-vf", "scale=1280:720",            # Resize video to 720p
        "-codec:v", "libx264",              # Use H.264 codec for video
        "-codec:a", "aac",                  # Use AAC codec for audio
        "-threads", "2",                    # Use 2 threads for transcoding
        "-f", "hls",                        # Output format is HLS (HTTP Live Streaming)
        "-hls_time", "10",                  # Each HLS segment is 10 seconds
        "-hls_playlist_type", "vod",        # VOD mode for static playlists
        str(m3u8_path)                      # Output file path (.m3u8)
    ]

    # Transcoding - Execute the FFmpeg command
    try:
        subprocess.run(ffmpeg_command, check=True)
    except subprocess.CalledProcessError as e:
        # If FFmpeg fails, return a 500 error
        raise HTTPException(status_code=500, detail=f"Transzkódolási hiba: {str(e)}")

    # Return success message and paths to the transcoded files
    return {
        "message": "Fájl sikeresen transzkódolva.",
        "m3u8_url": f"/vod/{m3u8_path.name}", # URL to access the playlist
        "metadata_url": f"/vod/{metadata_path.name}" if metadata else None # URL to access the metadata
    }