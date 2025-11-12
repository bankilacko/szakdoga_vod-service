from models import UserActivity, SystemMetric, UserRecentVideos, UserVideoHistory, VideoViewCount, UserCategoryPreference
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, Request, HTTPException
from database import init_db, get_db
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime
from typing import Dict, List
from time import time
from collections import defaultdict
  
# Create the FastAPI app instance
app = FastAPI()

# Configure CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:31084",
        "http://localhost:4200",
        "http://localhost:8080",
        "http://152.66.245.139:22290",
    ],  # Allowed frontend origins (e.g., for local development)
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

    # If the activity type is "play-video", update all relevant tables
    if data.event_type == "play-video":
        video_title = data.activity_metadata.get("video", "")
        video_id = data.activity_metadata.get("video_id")
        category = data.activity_metadata.get("category")
        
        # Only proceed if we have a video title
        if not video_title:
            return {"message": "User activity tracked successfully", "warning": "No video title provided"}
        
        # 1. Save to UserVideoHistory (all watched videos)
        history = UserVideoHistory(
            username=data.username,
            video_title=video_title,
            video_id=video_id,
            category=category
        )
        db.add(history)
        
        # 2. Update VideoViewCount (increment view count for this video)
        view_count = db.query(VideoViewCount).filter(VideoViewCount.video_title == video_title).first()
        if not view_count:
            view_count = VideoViewCount(
                video_title=video_title,
                video_id=video_id,
                view_count=1
            )
            db.add(view_count)
        else:
            view_count.view_count += 1
        
        # 3. Update UserCategoryPreference (increment category view count for this user)
        if category:
            category_pref = db.query(UserCategoryPreference).filter(
                UserCategoryPreference.username == data.username,
                UserCategoryPreference.category == category
            ).first()
            if not category_pref:
                category_pref = UserCategoryPreference(
                    username=data.username,
                    category=category,
                    view_count=1
                )
                db.add(category_pref)
            else:
                category_pref.view_count += 1
        
        # 4. Update UserRecentVideos (keep last 3 videos)
        user_recent = db.query(UserRecentVideos).filter(UserRecentVideos.username == data.username).first()
        if not user_recent:
            print("create new record for user")
            # If the user hasnt got any record create a record with the username
            user_recent = UserRecentVideos(
                username=data.username,
                video_titles=[video_title]
            )
            # Add the new activity record to the database session
            db.add(user_recent)
        else:
            print(f"Record already exists for user: {data.username}")
            print(f"Current video list before update: {user_recent.video_titles}")

            video_titles = user_recent.video_titles or []

            if video_title not in video_titles:
                print(f"Adding new video: {video_title} to the recently watched list.")
                video_titles.insert(0, video_title)  # Add new video to the beginning
                user_recent.video_titles = video_titles[:3]  # Keep only the last 3 videos
                flag_modified(user_recent, "video_titles")
            else:
                print(f"Skipping duplicate video: {video_title}")
        
        # Commit all changes
        db.commit()
    
    # Return a success message to indicate the event was tracked
    return {"message": "User activity tracked successfully"}


@app.get("/recommendations/{username}")
def get_recommendations(username: str, db: Session = Depends(get_db)):
    """
    Get video recommendations for a user using co-viewing algorithm with category bias.
    Returns top 3 recommended videos based on what similar users watched.
    """
    # 1. Get all videos watched by this user
    user_history = db.query(UserVideoHistory).filter(
        UserVideoHistory.username == username
    ).all()
    
    if not user_history:
        return {"username": username, "recommendations": []}
    
    # Get unique video titles watched by this user
    user_videos = set([h.video_title for h in user_history])
    
    # 2. Find similar users (users who watched at least one common video)
    # Get all users who watched at least one of the user's videos
    similar_users = db.query(UserVideoHistory.username).filter(
        UserVideoHistory.video_title.in_(user_videos),
        UserVideoHistory.username != username
    ).distinct().all()
    
    if not similar_users:
        return {"username": username, "recommendations": []}
    
    similar_usernames = [u[0] for u in similar_users]
    
    # 3. Get videos watched by similar users that the current user hasn't watched
    # Count co-view points for each recommended video
    video_scores = defaultdict(float)  # video_title -> score
    
    for similar_username in similar_usernames:
        # Get videos watched by this similar user
        similar_user_history = db.query(UserVideoHistory).filter(
            UserVideoHistory.username == similar_username
        ).all()
        
        similar_user_videos = set([h.video_title for h in similar_user_history])
        
        # Calculate overlap (number of common videos)
        overlap = len(user_videos.intersection(similar_user_videos))
        
        if overlap == 0:
            continue
        
        # For each video that similar user watched but current user didn't
        for video in similar_user_videos:
            if video not in user_videos:
                # Add co-view points based on overlap
                video_scores[video] += overlap
    
    if not video_scores:
        return {"username": username, "recommendations": []}
    
    # 4. Get user's category preferences
    category_prefs = db.query(UserCategoryPreference).filter(
        UserCategoryPreference.username == username
    ).all()
    
    category_weights = {pref.category: pref.view_count for pref in category_prefs}
    
    # 5. Apply category bias to scores
    # Get category for each recommended video
    for video_title in video_scores.keys():
        # Get category from UserVideoHistory
        video_history = db.query(UserVideoHistory).filter(
            UserVideoHistory.video_title == video_title
        ).first()
        
        if video_history and video_history.category:
            category = video_history.category
            if category in category_weights:
                # Add category bias: multiply category weight by a factor
                category_bias = category_weights[category] * 0.5  # Adjust weight factor as needed
                video_scores[video_title] += category_bias
    
    # 6. Sort by score and get top 3
    ranked_videos = sorted(video_scores.items(), key=lambda x: x[1], reverse=True)
    top_recommendations = [video_title for video_title, score in ranked_videos[:3]]
    
    return {"username": username, "recommendations": top_recommendations}


@app.get("/video-view-count/{video_title}")
def get_video_view_count(video_title: str, db: Session = Depends(get_db)):
    """
    Get the view count for a specific video.
    Returns 0 if the video has no views recorded.
    """
    view_count = db.query(VideoViewCount).filter(
        VideoViewCount.video_title == video_title
    ).first()
    
    if not view_count:
        return {"video_title": video_title, "view_count": 0}
    
    return {"video_title": video_title, "view_count": view_count.view_count}           