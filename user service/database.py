from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://user:password@database-service:5432/vod-database"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Táblák automatikus létrehozása
def init_db():
    from models import User  # Importáljuk a modelleket
    Base.metadata.create_all(bind=engine)
    print("initdb()-----------------------------------------------------------")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Ha a script betöltődik, akkor hozzuk létre a táblákat
init_db()