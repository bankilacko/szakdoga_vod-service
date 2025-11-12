from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

# Database connection URL (PostgreSQL in this case)
DATABASE_URL = "postgresql://user:password@database-service:5432/vod-database"

# Create a SQLAlchemy engine to interact with the PostgreSQL database
engine = create_engine(DATABASE_URL)

# Create a configured "SessionLocal" class for database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our ORM models (used to define tables)
Base = declarative_base()

# Function to initialize the database (create tables based on models)
def init_db():
    from models import UserActivity, SystemMetric, UserRecentVideos, UserVideoHistory, VideoViewCount, UserCategoryPreference  # Import the models so metadata knows about them
    Base.metadata.create_all(bind=engine) # Create all tables defined with Base

# Dependency to get a database session (used in routes)
def get_db():
    db = SessionLocal() # Create a new session
    try:
        yield db # Provide the session to the route
    finally:
        db.close() # Close the session after the request is completed

# Automatically initialize the database when this file is loaded
# init_db()