from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import subprocess
import os 

app = FastAPI()

# Configure CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:31084", "http://localhost:4200", "http://localhost:8080", "http://152.66.245.139:22290"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define upload and output directories
UPLOAD_DIR = Path("/app/uploads")
OUTPUT_DIR = Path("/vod")

# Ensure that the directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Helper function to check if audio stream exists
def has_audio_stream(input_file):
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_type", "-of", "csv=p=0", str(input_file)],
            capture_output=True,
            text=True,
            timeout=10
        )
        return result.returncode == 0 and result.stdout.strip() == "audio"
    except:
        return False

# Root API endpoint for checking whether the service is running
@app.get("/")
def read_root():
    return {"message": "Transcoding Service is up and running!"}

# Endpoint to handle video upload and multi-rendition HLS transcoding
@app.post("/upload")
async def upload_video(file: UploadFile = File(...), metadata: UploadFile | None = File(None)):
    # Validate input
    if not file.filename.endswith(".mp4"):
        raise HTTPException(status_code=400, detail="Only .mp4 files are enabled.")

    # Prepare names and paths
    base_name = Path(file.filename).stem
    slug = base_name.replace(" ", "_").lower()

    # Save input
    input_file_path = UPLOAD_DIR / file.filename
    with open(input_file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Resolve absolute path for FFmpeg (cwd will change for output writing)
    input_file_path = input_file_path.resolve()

    # Output directory: flat structure in /vod
    out_dir = OUTPUT_DIR
    os.makedirs(out_dir, exist_ok=True)

    # Ensure rendition subdirectories exist: /vod/<slug>_0, /vod/<slug>_1, ...
    for rendition_dir in range(4):
        (out_dir / f"{slug}_{rendition_dir}").mkdir(exist_ok=True)

    # Save metadata to /vod/<slug>_info.txt
    metadata_path = out_dir / f"{slug}_info.txt"
    if metadata:
        with open(metadata_path, "wb") as meta_buffer:
            meta_buffer.write(await metadata.read())

    # Check if audio stream exists
    has_audio = has_audio_stream(input_file_path)

    # FFmpeg command to generate 4 renditions + master.m3u8
    # Output structure: /vod/<slug>_master.m3u8, /vod/<slug>_0/index.m3u8, etc.
    ffmpeg_command = [
        "ffmpeg", "-y",
        "-i", str(input_file_path),

        # Scale/filter graph: 1080p, 720p, 480p, 360p (force divisible by 2)
        "-filter_complex",
        "[0:v]split=4[v1080][v720][v480][v360];"
        "[v1080]scale=w=1920:h=-2:force_original_aspect_ratio=decrease:force_divisible_by=2[v1080out];"
        "[v720]scale=w=1280:h=-2:force_original_aspect_ratio=decrease:force_divisible_by=2[v720out];"
        "[v480]scale=w=848:h=-2:force_original_aspect_ratio=decrease:force_divisible_by=2[v480out];"
        "[v360]scale=w=640:h=-2:force_original_aspect_ratio=decrease:force_divisible_by=2[v360out]",

        # 1080p
        "-map", "[v1080out]",
        "-c:v:0", "libx264", "-profile:v:0", "high", "-preset:v:0", "veryfast", "-threads:v:0", "0",
        "-b:v:0", "5000k", "-maxrate:v:0", "5350k", "-bufsize:v:0", "7500k",
        "-g:v:0", "48", "-keyint_min:v:0", "48", "-sc_threshold:v:0", "0",

        # 720p
        "-map", "[v720out]",
        "-c:v:1", "libx264", "-profile:v:1", "main", "-preset:v:1", "veryfast", "-threads:v:1", "0",
        "-b:v:1", "2800k", "-maxrate:v:1", "2996k", "-bufsize:v:1", "4200k",
        "-g:v:1", "48", "-keyint_min:v:1", "48", "-sc_threshold:v:1", "0",

        # 480p
        "-map", "[v480out]",
        "-c:v:2", "libx264", "-profile:v:2", "main", "-preset:v:2", "veryfast", "-threads:v:2", "0",
        "-b:v:2", "1400k", "-maxrate:v:2", "1498k", "-bufsize:v:2", "2100k",
        "-g:v:2", "48", "-keyint_min:v:2", "48", "-sc_threshold:v:2", "0",

        # 360p
        "-map", "[v360out]",
        "-c:v:3", "libx264", "-profile:v:3", "baseline", "-preset:v:3", "veryfast", "-threads:v:3", "0",
        "-b:v:3", "800k", "-maxrate:v:3", "856k", "-bufsize:v:3", "1200k",
        "-g:v:3", "48", "-keyint_min:v:3", "48", "-sc_threshold:v:3", "0",
    ]

    # Add audio mapping if audio exists
    if has_audio:
        ffmpeg_command.extend([
            "-map", "0:a?",
            "-c:a:0", "aac", "-b:a:0", "192k", "-ac:a:0", "2",
            "-c:a:1", "aac", "-b:a:1", "128k", "-ac:a:1", "2",
            "-c:a:2", "aac", "-b:a:2", "96k", "-ac:a:2", "2",
            "-c:a:3", "aac", "-b:a:3", "64k", "-ac:a:3", "2",
        ])

    # Add HLS output options
    if has_audio:
        var_stream_map = "v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3"
    else:
        var_stream_map = "v:0 v:1 v:2 v:3"

    ffmpeg_command.extend([
        "-f", "hls",
        "-hls_time", "4",
        "-hls_playlist_type", "vod",
        "-hls_flags", "independent_segments",
        "-master_pl_name", f"{slug}.m3u8",
        "-hls_segment_filename", f"{slug}_%v/seg_%03d.ts",
        "-var_stream_map", var_stream_map,
        f"{slug}_%v/index.m3u8",
    ])

    try:
        subprocess.run(ffmpeg_command, check=True, cwd=str(out_dir))
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Transcoding error: {e}")

    return {
        "message": "Multi-rendition HLS created",
        "master_m3u8": f"/vod/{slug}.m3u8",
        "renditions": [
            {"name": "1080p", "url": f"/vod/{slug}_0/index.m3u8"},
            {"name": "720p",  "url": f"/vod/{slug}_1/index.m3u8"},
            {"name": "480p",  "url": f"/vod/{slug}_2/index.m3u8"},
            {"name": "360p",  "url": f"/vod/{slug}_3/index.m3u8"},
        ],
    }
