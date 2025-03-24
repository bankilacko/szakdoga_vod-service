from fastapi import FastAPI
from database import init_db
from fastapi.middleware.cors import CORSMiddleware
from routes import router

app = FastAPI()

# CORS konfiguráció
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Engedélyezett metódusok
    allow_headers=["*"],  # Engedélyezett headerek
)

# API útvonalak hozzáadása
app.include_router(router)

# Táblák inicializálása induláskor
@app.on_event("startup")
def startup():
    init_db()

# Egyszerű "health check" endpoint
@app.get("/")
def read_root():
    return {"message": "VOD Management Service is up and running!"}