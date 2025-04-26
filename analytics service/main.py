from fastapi import FastAPI, Depends, Request
from models import UserActivity, SystemMetric
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from time import time

# Create the FastAPI app instance
app = FastAPI()

# Configure CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:31084", "http://localhost:4200"],  # Allowed frontend origins (e.g., for local development)
    allow_credentials=True, # Allow cookies and authorization headers
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers (e.g., Authorization, Content-Type)
)

# Health check endpoint
@app.get("/")
def read_root():
    return {"message": "Analytics Service is up and running!"}

# Endpoint to fetch all user activities
@app.get("/analytics/user-activities")
def get_user_activities(db: Session = Depends(get_db)):
    # Query all records from the UserActivity table
    activities = db.query(UserActivity).all()
    return {"user_activities": activities}

# Endpoint to fetch all system metrics
@app.get("/analytics/system-metrics")
def get_system_metrics(db: Session = Depends(get_db)):
    # Query all records from the SystemMetric table
    metrics = db.query(SystemMetric).all()
    return {"system_metrics": metrics}    

# User Activity Tracking Endpoint
@app.post("/track")
def track_event(user_id: int, event_type: str, metadata: dict = {}, db: Session = Depends(get_db)):
    # Create a new UserActivity record with the provided details
    activity = UserActivity(
        user_id=user_id,    # ID of the user who triggered the activity
        event_type=event_type,  # Type of activity (e.g., "video_play", "login", etc.)
        metadata=metadata   # Optional metadata related to the activity (e.g., video ID or other context)
    )
    # Add the new activity record to the database session
    db.add(activity)
    # Commit the transaction to save the record in the database
    db.commit()
    # Return a success message to indicate the event was tracked
    return {"message": "User activity tracked successfully"}

# Middleware for Measuring API Performance
@app.middleware("http")
async def measure_performance(request: Request, call_next):
    # Record the start time to measure the request's duration
    start_time = time()
    # Process the incoming HTTP request and generate a response
    response = await call_next(request)
    # Calculate the total time taken to process the request
    process_time = time() - start_time

    # Save the performance metrics to the database
    with SessionLocal() as db:
        metric = SystemMetric(
            endpoint=request.url.path,  # The API endpoint that was called (e.g., "/track")
            response_time=process_time, # Time taken to process the request (in seconds)
            status_code=response.status_code,  # HTTP status code of the response (e.g., 200, 404, etc.)
        )
        # Add the new metrics record to the database session
        db.add(metric)
        # Commit the transaction to save the record in the database
        db.commit()

    # Return the original response to the client
    return response