from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Base Pydantic model that defines shared fields for video data
class VideoBase(BaseModel):
    title: str                              # Video title (required)
    description: Optional[str] = None       # Optional text description of the video
    path: str                               # File path or URL to the video on the server (required)
    category: Optional[str] = None          # Optional category (e.g., "sports", "music", etc.)
    duration: str                        # Duration of the video in seconds (required)

# Model used for creating a new video (e.g., in POST requests)
class VideoCreate(VideoBase):
    # Inherits all fields from VideoBase; no additional fields needed for creation
    pass

# Model used for responses (e.g., in GET requests)
class VideoResponse(VideoBase):
    id: int                                 # Unique identifier of the video (assigned by the database)
    created_at: datetime                    # Timestamp of when the video was added

    class Config:
        # Enables automatic conversion from ORM (e.g., SQLAlchemy) objects to Pydantic models
        from_attributes = True