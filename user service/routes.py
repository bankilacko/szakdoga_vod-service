from fastapi import APIRouter, Depends, HTTPException
from auth import create_token, verify_token
from passlib.context import CryptContext
from pydantic_models import UserResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from database import get_db
from models import User

router = APIRouter() # Creating a router for organizing the API routes
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") # Password hashing configuration

# Input models
class RegisterInput(BaseModel):
    username: str
    email: str
    password: str

class LoginInput(BaseModel):
    username: str
    password: str

# Register API endpoint for user registration
@router.post("/register")
def register(input: RegisterInput, db: Session = Depends(get_db)):
    # Check if the email is already in use
    existing_user = db.query(User).filter(User.email == input.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash the user's password before saving it
    # hashed_password = pwd_context.hash(input.password)

    hashed_password = input.password
    
    # Create a new user instance
    user = User(
        username=input.username,
        email=input.email,
        hashed_password=hashed_password,
        registration_date=datetime.utcnow() # Store current UTC time as registration date
    )

    # Add and commit the new user to the database
    db.add(user)
    db.commit()

    # Log the succesfull registartion
    print(f"Successfull registartion for user: {input.username}")

    # Return a success message
    return {"message": "User created successfully"}

# Login API endpoint for user login
@router.post("/login")
def login(input: LoginInput, db: Session = Depends(get_db)):
    # Log the login attempt with username
    print(f"Login attempt for user: {input.username}")
    
    # Find user by username
    user = db.query(User).filter(User.username == input.username).first()
    if not user:
        print("User not found")
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    # Verify the password
    #if not pwd_context.verify(input.password, user.hashed_password):
    #    print("Password mismatch")
    #    raise HTTPException(status_code=400, detail="Invalid credentials")

    if input.password != user.hashed_password:
        print("Password mismatch")
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Log the succesfull password verification
    print("Password verified")

    # Create a JWT token
    token = create_token({"user_id": user.id})

    # Return the access token to the client
    return {"access_token": token}

# Users API endpoint to get all registered users
@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    # Query all users in the database
    users = db.query(User).all()
    # Return list of users  
    return users

# Cureent user API endpoint to get all information about the logged in user
@router.get("/get_current_user", response_model=UserResponse)  # Return using the user datamodel
def get_current_user(payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    # Extract the user ID from the token payload
    user_id = payload.get("user_id")  
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID missing in token payload")

    # Retrieve the user from the database
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Return the user data (filtered by response_model)
    return user

@router.post("/edit_profile")
def edit_profile(input: RegisterInput, payload: dict = Depends(verify_token), db: Session = Depends(get_db)):


    # Edit Profile API Endpoint:
    # Update user profile details (username, email, password).
    # Only update fields that differ from their current values in the database.

    # Extract user ID from token payload
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID missing in token payload")

    # Fetch user from the database
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if username has changed and update it
    if input.username != user.username:
        user.username = input.username

    # Check if email has changed and update it
    if input.email != user.email:
        user.email = input.email

    # Check if password has been provided and is different, then hash and update it
    if input.password and not pwd_context.verify(input.password, user.hashed_password):
        user.hashed_password = pwd_context.hash(input.password)

    # Commit the changes to the database
    db.commit()

    return {"message": "Profile updated successfully"}


# Example of a protected route that only logged-in users can access
@router.get("/protected-endpoint")
def protected_route(payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    # If the token is valid, access is granted
    return {
        "message": "Access granted",
        "user_id": payload["user_id"]
    }