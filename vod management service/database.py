from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

# Database connection URL (PostgreSQL in this case)
# Format: postgresql://<username>:<password>@<host>:<port>/<database_name>
DATABASE_URL = "postgresql://user:password@database-service:5432/vod-database"

# Create the SQLAlchemy engine that manages the connection pool
engine = create_engine(DATABASE_URL)

# SessionLocal is a factory for database sessions
# autocommit=False: commits must be explicit
# autoflush=False: avoids automatic writes before queries
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all ORM models (used to define table structures)
Base = declarative_base()

# Initializes the database and creates all tables defined via ORM models
def init_db():
    from models import Video  # Import the model so that SQLAlchemy sees it
    Base.metadata.create_all(bind=engine)  # Create tables if they don't exist

# Dependency for getting a database session (used with FastAPI's Depends)
# Ensures the session is properly opened and closed
def get_db():
    db = SessionLocal()
    try:
        yield db # Yield control to the request handler
    finally:
        db.close() # Close the session after the request is processed

# Automatically initialize the database when this file is loaded
init_db()