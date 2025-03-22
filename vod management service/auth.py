from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from datetime import datetime, timedelta

SECRET_KEY = "supersecretkey"  # Ezt biztonságosan kell tárolni, pl. környezeti változóként

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    JWT token validálása.
    """
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        return payload  # A tokenből kinyert adatokat visszaadjuk
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="A token lejárt.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Érvénytelen token.")
