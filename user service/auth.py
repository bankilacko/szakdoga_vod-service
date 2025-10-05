from fastapi import Security, HTTPException, Depends
from datetime import datetime, timedelta
from fastapi.security import HTTPBearer
import jwt

# Secret key used to sign JWT tokens
SECRET_KEY = "supersecretkey"

# Define the security scheme – this will automatically look for Authorization: Bearer <token> in requests
security = HTTPBearer()

# Function to create a JWT token
def create_token(data: dict):
    # Prepare the payload with additional expiration time (1 hour from now)
    payload = {
        **data,
        "exp": datetime.utcnow() + timedelta(hours=1)  # Token expiration time
    }

    # Encode the token using HS256 algorithm and the secret key
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token

# Function to verify the validity of a JWT token
def verify_token(credentials: HTTPBearer = Security(security)):
    # Extract the actual token string from the credentials
    token = credentials.credentials

    try:
        # Decode and verify the token using the secret key
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload # Return the decoded payload if token is valid
    except jwt.ExpiredSignatureError:
        # Raised when the token has expired
        print("Token expired")  # Log that the token expired
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        # Raised when the token is invalid (e.g. tampered or wrong signature)
        print("Invalid token")  # Log that the token is invalid
        raise HTTPException(status_code=401, detail="Invalid token")


