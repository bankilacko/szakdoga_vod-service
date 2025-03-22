from fastapi import Security, HTTPException, Depends
from fastapi.security import HTTPBearer
import jwt
from datetime import datetime, timedelta

SECRET_KEY = "supersecretkey"
security = HTTPBearer()

def create_token(data: dict):
    payload = {
        **data,
        "exp": datetime.utcnow() + timedelta(hours=1)  # Token lejárati idő
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token

def verify_token(credentials: HTTPBearer = Security(security)):
    token = credentials.credentials
    print(f"Received token: {token}")  # Debug: ellenőrizd a tokent
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        print(f"Decoded payload: {payload}")  # Debug: dekódolt token tartalma
        return payload
    except jwt.ExpiredSignatureError:
        print("Token expired")  # Debug: Token lejárt
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        print("Invalid token")  # Debug: Érvénytelen token
        raise HTTPException(status_code=401, detail="Invalid token")


