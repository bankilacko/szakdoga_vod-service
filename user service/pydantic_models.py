from pydantic import BaseModel
from datetime import datetime

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    registration_date: datetime

    class Config:
        orm_mode = True  # Lehetővé teszi az SQLAlchemy modellekből történő konvertálást
