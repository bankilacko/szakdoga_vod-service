from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Pydantic alaposztály a közös mezők számára
class VideoBase(BaseModel):
    title: str
    description: Optional[str] = None
    path: str
    category: Optional[str] = None
    duration: int

# Létrehozás során használatos modell (POST)
class VideoCreate(VideoBase):
    pass

# Válaszmodell (GET)
class VideoResponse(VideoBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True