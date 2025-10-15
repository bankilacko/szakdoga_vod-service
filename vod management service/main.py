from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from fastapi import FastAPI
from routes import router

# Create a new FastAPI application instance
app = FastAPI()

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows frontend applications (e.g., on a different port) to interact with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:31084", "http://localhost:4200", "http://localhost:8080", "http://152.66.245.139:22290"],  # Allowed frontend origins
    allow_credentials=True,  # Allow sending cookies and authentication headers
    allow_methods=["*"],     # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],     # Allow all headers
)

# Include all API routes from the external router module
app.include_router(router)

# This function runs automatically when the application starts
# Used here to initialize the database (e.g., create tables)
@app.on_event("startup")
def startup():
    init_db()

# Basic root API endpoint, useful as a health check
@app.get("/")
def read_root():
    return {"message": "VOD Management Service is up and running!"}