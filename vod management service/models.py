from sqlalchemy import Column, Integer, String, DateTime
from database import Base
from datetime import datetime

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    path = Column(String, nullable=False)  # .m3u8 fájl elérési útja
    category = Column(String, nullable=True)  # Kategória, pl. "Film", "Sport"
    duration = Column(Integer, nullable=False)  # Videó hossza másodpercben
    created_at = Column(DateTime, default=datetime.utcnow)  # Létrehozás ideje