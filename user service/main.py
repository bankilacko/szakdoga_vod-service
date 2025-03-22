from fastapi import FastAPI
from database import init_db
from routes import router

app = FastAPI()

# API útvonalak hozzáadása
app.include_router(router)

# Táblák inicializálása induláskor
@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def read_root():
    return {"message": "User Service is up and running!"}

