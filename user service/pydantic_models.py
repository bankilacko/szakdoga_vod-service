from pydantic import BaseModel
from datetime import datetime

# This model defines the shape of the response data when returning user information
class UserResponse(BaseModel):
    id: int # Unique identifier of the user
    username: str # User's username
    email: str # User's email address
    registration_date: datetime # The date and time the user registered

    class Config:
        orm_mode = True  # Enables compatibility with ORM objects like SQLAlchemy models
                         # This allows returning SQLAlchemy objects directly from FastAPI routes
