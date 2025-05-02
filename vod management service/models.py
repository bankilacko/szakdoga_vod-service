from sqlalchemy import Column, Integer, String, DateTime
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

