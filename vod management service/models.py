from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from datetime import datetime
from database import Base

# SQLAlchemy model representing the "videos" table in the database
class Video(Base):
    __tablename__ = "videos" # Name of the table in the database

    # Unique identifier for each video (Primary Key)
    id = Column(Integer, primary_key=True, index=True)

    # Title of the video (required field)
    title = Column(String, nullable=False)

    # Optional description of the video
    description = Column(String, nullable=True)

    # Path to the video file (usually an .m3u8 file) – required
    path = Column(String, nullable=False)

    # Category of the video (e.g., "Film", "Sport") – optional
    category = Column(String, nullable=True)

    # Duration of the video in seconds – required
    duration = Column(String, nullable=False)

    # Timestamp indicating when the video record was created
    # Defaults to the current UTC time
    created_at = Column(DateTime, default=datetime.utcnow)

# SQLAlchemy model representing the "comments" table in the database
class Comment(Base):
    __tablename__ = "comments" # Name of the table in the database

    # Unique identifier for each comment (Primary Key)
    id = Column(Integer, primary_key=True, index=True)

    # Foreign key to the videos table
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)

    # Foreign key to the users table (from user service)
    user_id = Column(Integer, nullable=False)

    # Username for display purposes (denormalized for performance)
    username = Column(String, nullable=False)

    # Comment content
    content = Column(Text, nullable=False)

    # Timestamp indicating when the comment was created
    created_at = Column(DateTime, default=datetime.utcnow)

    # Timestamp indicating when the comment was last updated
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

