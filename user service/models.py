from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base 

# This class defines the User table structure in the database
class User(Base):
    __tablename__ = "users"  # Name of the table in the database

    # Unique identifier for each user (Primary Key)
    id = Column(Integer, primary_key=True, index=True)
    
    # Username of the user - must be unique and not null
    username = Column(String, unique=True, index=True, nullable=False)
    
    # Email address of the user - must be unique and not null
    email = Column(String, unique=True, index=True, nullable=False)
    
    # Date and time when the user registered - defaults to current UTC time
    registration_date = Column(DateTime, default=datetime.utcnow)
    
    # Hashed password of the user - cannot be null
    hashed_password = Column(String, nullable=False)

