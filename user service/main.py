from fastapi import FastAPI
from database import init_db
from fastapi.middleware.cors import CORSMiddleware
from routes import router
#import ssl

app = FastAPI()

# if __name__ == "__main__":
#     ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
#     ssl_context.load_cert_chain(certfile="/path/to/fullchain.pem", keyfile="/path/to/privkey.pem")
#     uvicorn.run(app, host="0.0.0.0", port=443, ssl_context=ssl_context)

# CORS konfiguráció
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:32075", "http://localhost:4200"],  # Frontend URL
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

@app.get("/")
def read_root():
    return {"message": "User Service is up and running!"}

