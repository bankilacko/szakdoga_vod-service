from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from fastapi import FastAPI
from routes import router
#import ssl

# Create the FastAPI app instance
app = FastAPI()

# if __name__ == "__main__":
#     ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
#     ssl_context.load_cert_chain(certfile="/path/to/fullchain.pem", keyfile="/path/to/privkey.pem")
#     uvicorn.run(app, host="0.0.0.0", port=443, ssl_context=ssl_context)

# CORS konfiguráció
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:31084", "http://localhost:4200", "http://localhost:8080"],  # Allowed frontend origins (e.g., for local development)
    allow_credentials=True, # Allow cookies and authorization headers
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers (e.g., Authorization, Content-Type)
)

# Include all routes defined in the router
app.include_router(router)

# Initialize database tables at application startup
@app.on_event("startup")
def startup():
    init_db() # Creates tables if they don't exist

# Default root endpoint to verify the service is running
@app.get("/")
def read_root():
    return {"message": "User Service is up and running!"}

