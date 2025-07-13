from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from passlib.hash import bcrypt
from jose import jwt
from models.user_models import UserCreate, UserLogin
from db import users_collection
from bson import ObjectId
from datetime import datetime, timedelta

router = APIRouter()
SECRET_KEY = "your-secret-key"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_jwt(user_id: str):
    payload = {"sub": user_id, "exp": datetime.utcnow() + timedelta(days=1)}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def decode_jwt(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload["sub"]
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    user_id = decode_jwt(token)
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": str(user["_id"]), "username": user["username"]}

@router.post("/signup")
async def signup(data: UserCreate):
    if await users_collection.find_one({"username": data.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed_pw = bcrypt.hash(data.password)
    result = await users_collection.insert_one({
        "username": data.username,
        "password": hashed_pw
    })
    return {"token": create_jwt(str(result.inserted_id))}

@router.post("/login")
async def login(data: UserLogin):
    user = await users_collection.find_one({"username": data.username})
    if not user or not bcrypt.verify(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"token": create_jwt(str(user["_id"]))}

@router.get("/logout")
async def logout():
    return {"message": "Logged out. Please discard the token."}

@router.get("/me")
async def get_user_info(current_user: dict = Depends(get_current_user)):
    return current_user
