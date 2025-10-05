from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Request, HTTPException, Depends
from datetime import datetime, timedelta
import jwt

# Secret key used to sign and verify JWT tokens
SECRET_KEY = "supersecretkey"

# HTTPBearer defines the expected authentication scheme (Bearer token in Authorization header)
security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    
    # Validates a JWT token provided in the Authorization header using Bearer scheme.

    try:
        # Decode and verify the JWT using the shared secret and the HS256 algorithm
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        return payload  # Return the token's decoded payload (e.g., user info, roles, expiry)
    except jwt.ExpiredSignatureError:
        # Token is expired
        raise HTTPException(status_code=401, detail="Token has expired.")
    except jwt.InvalidTokenError:
        # Token is malformed or signature doesn't match
        raise HTTPException(status_code=401, detail="Invalid token.")    
