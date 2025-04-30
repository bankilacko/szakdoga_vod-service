from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime
from database import Base 

# This class defines the UserActivity table structure in the database
class UserActivity(Base):
    __tablename__ = "user_activities" # Name of the table in the database

    # Unique identifier for each activity (Primary Key)
    id = Column(Integer, primary_key=True, index=True)
    
    # name of the user - must be not null
    username = Column(String, nullable=False)
    
    # Type of the event - can be null
    event_type = Column(String, nullable=False)
    
    # Date and time when the user made the activity - defaults to current UTC time
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Additional information in JSON format - can be null
    activity_metadata = Column(JSON, nullable=True) 

# This class defines the UserRecentVideos table structure in the database
class UserRecentVideos(Base):
    __tablename__ = "user_recent_videos" # Name of the table in the database

    # Unique identifier for each user-videos pair (Primary Key)
    id = Column(Integer, primary_key=True, index=True)
    # name of the user - must be not null
    username = Column(String, nullable=False)
    # name of the 3 recently watched videos - must be not null
    video_titles = Column(JSON, nullable=False)

# This class defines the SystemMetric table structure in the database
class SystemMetric(Base):
    __tablename__ = "system_metrics" # Name of the table in the database
    
    # Unique identifier for each metric (Primary Key)
    id = Column(Integer, primary_key=True, index=True)
    
    # Name of the backend endpoint - must be not null
    endpoint = Column(String, nullable=False)
    
    # Response time from the backend endpoint - must be not null
    response_time = Column(Float, nullable=False)
    
    # HTTP status code - must be not null
    status_code = Column(Integer, nullable=False)
    
    # Date and time when the endpoint was called - defaults to current UTC time
    timestamp = Column(DateTime, default=datetime.utcnow)