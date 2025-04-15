from pydantic_models import VideoCreate, VideoResponse 
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from auth import verify_token
from bs4 import BeautifulSoup
from datetime import datetime 
from database import get_db
from models import Video
from typing import List
import requests
import time
import os

router = APIRouter()

# Base URL of the NGINX VOD server (can be set via environment variable or fallback to default)
VOD_SERVER_URL = os.getenv("VOD_SERVER_URL", "http://nginx-vod-service:8080/vod/")

# Global URL used for video streaming from the local dev environment
VOD_SERVER_URL_GLOBAL = "http://localhost:8080/vod/"

# Runs automatically when the app starts to sync available videos from the VOD server
@router.on_event("startup")
def startup_sync_videos():

    # This function is triggered when the FastAPI application starts.
    # It attempts to connect to the NGINX VOD server, extract available video files,
    # read their metadata, and synchronize them with the local database.

    # Log the start of the synchronization process
    print("Start video syncronization...")

    db = next(get_db()) # Open a new database session
    max_retries = 5 # Maximum number of retries
    retry_delay = 5 # Wait time (in seconds) between retries

    try:
        for attempt in range(max_retries):
            try:
                # Log the current attempt to reach the VOD server
                print(f"{attempt + 1}/{max_retries} attempt to reach the NGINX server...")

                # Send GET request to the VOD server to get HTML listing of files
                response = requests.get(VOD_SERVER_URL)
                response.raise_for_status()

                # Extract list of video filenames from the HTML
                video_files = extract_video_filenames(response.text)

                for file in video_files:
                    # Check if the video is already in the database
                    if not db.query(Video).filter(Video.path == f"/{file}").first():
                        # Build the corresponding metadata file path
                        metadata_file = file.replace(".m3u8", "_info.txt")
                        metadata_path = os.path.join(VOD_SERVER_URL, metadata_file)

                        # Read metadata (title, category, duration, description)
                        title, category, duration, description = read_metadata(metadata_path)

                        # Create a new Video entry
                        new_video = Video(
                            title=title,
                            description=description,
                            path=f"/{file}",
                            category=category,
                            duration=duration,
                            created_at=datetime.utcnow()
                        )

                        # Save the new video to the database
                        db.add(new_video)
                        db.commit()

                        # Log the newly added video
                        print(f"Video added: {new_video.title}")
                break  # If successful, break out of the retry loop

            except requests.RequestException as e:
                # Log the failed attempt to contact the VOD server
                print(f"Unsuccessfull attempt: {e}")
                time.sleep(retry_delay) # Wait before retrying

        else:
            # All attempts failed, log that max retries were reached
            print("Reached the number of max attempts.")
    except Exception as e:
        # Log any other unexpected error that occurred during sync
        print(f"Error during syncronization: {e}")
    finally:
        db.close() # Ensure the database connection is closed
        # Log the close
        print("Database connection closed.")


# Function: Extracts .m3u8 filenames from the HTML content of the VOD directory
def extract_video_filenames(html_content):

    # Parses the given HTML content and extracts all filenames that point to .m3u8 video playlist files.
    # This function assumes that the HTML contains <a> tags with href attributes
    # pointing to video files served by an NGINX VOD directory listing.

    # Parse the HTML using BeautifulSoup
    soup = BeautifulSoup(html_content, 'html.parser')
    video_files = []

    # Search for all <a> tags and extract the hrefs that end with .m3u8 (HLS playlist files)
    for link in soup.find_all('a'):
        href = link.get('href')
        if href and href.endswith(".m3u8"):
            video_files.append(href)

    # Log the extracted filenames for debugging purposes        
    print(f"Extracted filenames: {video_files}")

    # Return the video files
    return video_files

# Endpoint to retrieve a video stream URL based on the filename
@router.get("/videos/{filename}", dependencies=[Depends(verify_token)])
def get_video_by_filename(filename: str, db: Session = Depends(get_db)):

    # Returns the full URL of a video stream file (.m3u8) from the NGINX server.
    # This endpoint is protected and requires a valid token (via HTTPBearer).

    # Look up the video in the database using its filename
    video = db.query(Video).filter(Video.path == f"/{filename}").first()

    # If the video doesn't exist, raise a 404 error
    if not video:
        print(f"Video not found: {filename}")
        raise HTTPException(status_code=404, detail="Video not found")

    # Construct the full URL using the global VOD base path
    video_url = f"{VOD_SERVER_URL_GLOBAL}{filename}"

    # Log the generation of the video URL
    print(f"Video URL generated: {video_url}")

    # Return the full video URL as JSON
    return {"video_url": video_url}

# Endpoint to return the list of available videos from the database
@router.get("/videos", response_model=List[VideoResponse]) 
def list_videos(db: Session = Depends(get_db)):

    # Retrieves the list of all video files currently available on the NGINX VOD server.
    # If any new video files are found, they are added to the database along with
    # metadata (title, category, duration, description).

    #The final response returns all video entries stored in the database.

    try:
        # Log the start of the request
        print("Requesting video list from NGINX server")

        # Send a request to the NGINX server to get the directory listing (HTML)
        response = requests.get(VOD_SERVER_URL)

        # Raise an exception if the server response is not successful (e.g., 404 or 500)
        response.raise_for_status()

        # Extract filenames (*.m3u8) from the HTML response
        video_files = extract_video_filenames(response.text)

        # Iterate through each video file to check if it exists in the database
        for file in video_files:
            # Check if the video already exists based on its path
            existing_video = db.query(Video).filter(Video.path == f"/{file}").first()

            if not existing_video:
                # Construct metadata file path and read its content
                metadata_file = file.replace(".m3u8", "_info.txt")
                metadata_path = os.path.join(VOD_SERVER_URL, metadata_file)

                # Parse metadata from the associated .txt file
                title, category, duration, description = read_metadata(metadata_path)

                # Create a new Video model instance with the parsed metadata
                new_video = Video(
                    title=title,
                    description=description,
                    path=f"/{file}",
                    category=category,
                    duration=duration,
                    created_at=datetime.utcnow()
                )

                # Save the new video record into the database
                db.add(new_video)
                db.commit()
        
        # After processing, fetch the complete list of videos from the database
        videos = db.query(Video).all()
        # Log the available videos
        print(f"{len(videos)} videos are in the database.")
        print(videos)

        # Return the list of videos to the client
        return videos

    # In case of any error return HTTPException
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to contact NGINX server: {str(e)}")

# Function to read video metadata from a text file
def read_metadata(metadata_url: str):

    # Reads and parses metadata from a .txt file.
    # Format expected:
    # Line 1: title
    # Line 2: category
    # Line 3: duration
    # Lines 4+: description

    try:
        # Make an HTTP GET request to download the metadata file
        response = requests.get(metadata_url)

        # Raise an HTTPException if the request failed (e.g., 404 or 500)
        response.raise_for_status()

        # Split the file content into individual lines
        lines = response.text.splitlines()

        # The first line is the title
        title = lines[0].strip() if len(lines) > 0 else "No title"

        # The second line is the category
        category = lines[1].strip() if len(lines) > 1 else "No category"

        # Third line is the length
        duration = lines[2].strip() if len(lines) > 1 else "No length"

        # The remaining lines are the description
        description = "\n".join(lines[3:]).strip() if len(lines) > 2 else "No description"

        # Return all extracted values as a tuple
        return title, category, duration, description
    except Exception as e:
        # In case of any error (e.g., network failure, file format issue), log error
        print(f"Failed to read metadata: {e}")

        # Return safe fallback values so the application doesn't break
        return "No Title", "No Category", "No Duration", "No Description"