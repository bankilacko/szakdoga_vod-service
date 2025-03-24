from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from auth import create_token, verify_token
from database import get_db
from models import User
from pydantic import BaseModel
from passlib.context import CryptContext

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Input modellek
class RegisterInput(BaseModel):
    username: str
    email: str
    password: str

class LoginInput(BaseModel):
    username: str
    password: str

@router.post("/register")
def register(input: RegisterInput, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == input.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = pwd_context.hash(input.password)
    user = User(username=input.username, email=input.email, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    return {"message": "User created successfully"}

@router.post("/login")
def login(input: LoginInput, db: Session = Depends(get_db)):
    print(f"Login attempt for user: {input.username}")
    user = db.query(User).filter(User.username == input.username).first()
    if not user:
        print("User not found")
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    if not pwd_context.verify(input.password, user.hashed_password):
        print("Password mismatch")
        raise HTTPException(status_code=400, detail="Invalid credentials")

    print("Password verified")
    token = create_token({"user_id": user.id})
    print(f"Token created: {token}")
    return {"access_token": token}

@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()  # Lekéri az összes felhasználót
    return users

@router.get("/me")
def get_current_user(payload: dict = Depends(verify_token)):
    return {"user_id": payload["user_id"]}

@router.get("/protected-endpoint")
def protected_route(payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    return {
        "message": "Access granted",
        "user_id": payload["user_id"]
    }