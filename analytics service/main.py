from models import UserActivity, SystemMetric, UserRecentVideos
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, Request
from database import init_db, get_db
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Dict
from time import time
  
# Create the FastAPI app instance
app = FastAPI()

# Configure CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:31084", "http://localhost:4200", "http://localhost:8080"],  # Allowed frontend origins (e.g., for local development)
    allow_credentials=True, # Allow cookies and authorization headers
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers (e.g., Authorization, Content-Type)
)

# Input model
class TrackEventRequest(BaseModel):
    username: str
    event_type: str
    activity_metadata: Dict = {}

# Initialize database tables at application startup
@app.on_event("startup")
def startup():
    init_db() # Creates tables if they don't exist

# Health check endpoint
@app.get("/")
def read_root():
    return {"message": "Analytics Service is up and running!"}

# Endpoint to fetch all user activities
@app.get("/analytics/user-activities")
def get_user_activities(db: Session = Depends(get_db)):
    # Query all records from the UserActivity table
    activities = db.query(UserActivity).all()
    return {"user_activities": activities}

# Endpoint to fetch all system metrics
@app.get("/analytics/system-metrics")
def get_system_metrics(db: Session = Depends(get_db)):
    # Query all records from the SystemMetric table
    metrics = db.query(SystemMetric).all()
    return {"system_metrics": metrics}

# Endpoint to fetch all users recently watched videos
@app.get("/recent-videos/{username}")
def get_recent_videos(username: str, db: Session = Depends(get_db)):
    user_recent = db.query(UserRecentVideos).filter(UserRecentVideos.username == username).first()
    if not user_recent:
        return {"username": username, "recent_videos": []}
    return {"username": username, "recent_videos": user_recent.video_titles}


@app.post("/track")
def track_event(data: TrackEventRequest, db: Session = Depends(get_db)):
    # Create a new UserActivity record with the provided details
    activity = UserActivity(
        username=data.username, # Name of the user who triggered the activity
        event_type=data.event_type, # Type of activity (e.g., "video_play", "login", etc.)
        activity_metadata=data.activity_metadata # Optional metadata related to the activity (e.g., video ID or other context)
    )
    # Add the new activity record to the database session
    db.add(activity)
    # Commit the transaction to save the record in the database
    db.commit()

    # If the activity type is "video_play", refresh the UserRecentVideos table
    if data.event_type == "play-video":
        user_recent = db.query(UserRecentVideos).filter(UserRecentVideos.username == data.username).first()
        if not user_recent:
            print("create new record for user")
            # If the user hasnt got any record create a record with the username
            user_recent = UserRecentVideos(
                username=data.username,
                video_titles=[data.activity_metadata["video"]]
            )
            # Add the new activity record to the database session
            db.add(user_recent)
        else:
            print(f"Record already exists for user: {data.username}")
            print(f"Current video list before update: {user_recent.video_titles}")

            video_titles = user_recent.video_titles or []
            new_video = data.activity_metadata["video"]

            if new_video not in video_titles:
                print(f"Adding new video: {new_video} to the recently watched list.")
                video_titles.insert(0, new_video)  # Add new video to the beginning
                user_recent.video_titles = video_titles[:3]  # Keep only the last 3 videos
            else:
                print(f"Skipping duplicate video: {new_video}")

            #video_titles.insert(0, new_video)  # Add the new video to the beginning of the list
            #updated_videos = video_titles[:3]  # Keep only the last 3 videos

            #db.query(UserRecentVideos).filter(UserRecentVideos.username == data.username).update(
            #    {"video_titles": updated_videos}
            #)  # UPDATE the database with the new video list

        
        # Commit the transaction to save the record in the database
        db.commit()
    # Return a success message to indicate the event was tracked
    return {"message": "User activity tracked successfully"}           