from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import json
import os
import hashlib
import jwt
from datetime import datetime, timedelta
import secrets

app = FastAPI(title="Uap Market API", version="1.0.0")

# Security
security = HTTPBearer()
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: str

class UserResponse(User):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class GameBase(BaseModel):
    title: str
    description: str
    price: int
    category: str
    image: Optional[str] = "/placeholder.svg?height=200&width=300"
    rating: float = 4.0
    tags: List[str] = []
    featured: bool = False

class GameCreate(GameBase):
    pass

class GameUpdate(GameBase):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = None
    category: Optional[str] = None
    image: Optional[str] = None
    rating: Optional[float] = None
    tags: Optional[List[str]] = None
    featured: Optional[bool] = None

class Game(GameBase):
    id: int
    created_at: str
    updated_at: str

# Database simulation (in production, use a real database)
users_db = [
    {
        "id": 1,
        "email": "admin@uapmarket.com",
        "name": "Admin User",
        "password_hash": hashlib.sha256("admin123".encode()).hexdigest(),
        "role": "admin",
        "is_active": True,
        "created_at": "2024-01-01T00:00:00Z"
    }
]

games_db = [
    {
        "id": 1,
        "title": "Epic Adventure RPG",
        "description": "Immersive fantasy role-playing game with stunning graphics and epic storylines",
        "price": 299000,
        "category": "RPG",
        "image": "/RGP.jpg?height=200&width=300",
        "rating": 4.8,
        "tags": ["Fantasy", "Adventure", "Multiplayer"],
        "featured": True,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": 2,
        "title": "Speed Racing Championship",
        "description": "High-octane racing game with realistic physics and stunning visuals",
        "price": 199000,
        "category": "Racing",
        "image": "/placeholder.svg?height=200&width=300",
        "rating": 4.6,
        "tags": ["Racing", "Sports", "Simulation"],
        "featured": True,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": 3,
        "title": "Mystery Detective Story",
        "description": "Solve complex mysteries in this thrilling point-and-click adventure",
        "price": 149000,
        "category": "Adventure",
        "image": "/placeholder.svg?height=200&width=300",
        "rating": 4.7,
        "tags": ["Mystery", "Puzzle", "Story"],
        "featured": True,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": 4,
        "title": "Space Combat Simulator",
        "description": "Epic space battles with advanced combat mechanics and stunning graphics",
        "price": 249000,
        "category": "Action",
        "image": "/placeholder.svg?height=200&width=300",
        "rating": 4.9,
        "tags": ["Space", "Combat", "Simulation"],
        "featured": True,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }
]

# Helper functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def get_user_by_email(email: str):
    return next((user for user in users_db if user["email"] == email), None)

def get_user_by_id(user_id: int):
    return next((user for user in users_db if user["id"] == user_id), None)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = get_user_by_id(user_id)
    if user is None:
        raise credentials_exception
    return user

def get_next_user_id():
    return max([user["id"] for user in users_db], default=0) + 1

def get_next_game_id():
    return max([game["id"] for game in games_db], default=0) + 1

def find_game_by_id(game_id: int):
    return next((game for game in games_db if game["id"] == game_id), None)

# Authentication Routes
@app.post("/api/auth/register", response_model=Token)
async def register(user: UserCreate):
    """Register a new user"""
    # Check if user already exists
    if get_user_by_email(user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = {
        "id": get_next_user_id(),
        "email": user.email,
        "name": user.name,
        "password_hash": hash_password(user.password),
        "role": "user",  # Default role
        "is_active": True,
        "created_at": datetime.now().isoformat() + "Z"
    }
    
    users_db.append(new_user)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user["id"]}, expires_delta=access_token_expires
    )
    
    # Return user data without password
    user_response = UserResponse(
        id=new_user["id"],
        email=new_user["email"],
        name=new_user["name"],
        role=new_user["role"],
        is_active=new_user["is_active"],
        created_at=new_user["created_at"]
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@app.post("/api/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """Login user"""
    user = get_user_by_email(user_credentials.email)
    
    if not user or not verify_password(user_credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    # Return user data without password
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        is_active=user["is_active"],
        created_at=user["created_at"]
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        is_active=current_user["is_active"],
        created_at=current_user["created_at"]
    )

@app.get("/api/users", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(get_current_user)):
    """Get all users (Admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return [
        UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            is_active=user["is_active"],
            created_at=user["created_at"]
        )
        for user in users_db
    ]

# Game Routes (with authentication)
@app.get("/")
async def root():
    return {"message": "Uap Market API", "version": "1.0.0", "users_count": len(users_db)}

@app.get("/api/games", response_model=List[Game])
async def get_games(
    category: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None
):
    """Get all games with optional filtering"""
    filtered_games = games_db.copy()
    
    if category and category != "All":
        filtered_games = [game for game in filtered_games if game["category"] == category]
    
    if search:
        search_lower = search.lower()
        filtered_games = [
            game for game in filtered_games 
            if search_lower in game["title"].lower() 
            or search_lower in game["description"].lower()
            or any(search_lower in tag.lower() for tag in game["tags"])
        ]
    
    if featured is not None:
        filtered_games = [game for game in filtered_games if game["featured"] == featured]
    
    return filtered_games

@app.get("/api/games/{game_id}", response_model=Game)
async def get_game(game_id: int):
    """Get a specific game by ID"""
    game = find_game_by_id(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game

@app.post("/api/games", response_model=Game)
async def create_game(game: GameCreate, current_user: dict = Depends(get_current_user)):
    """Create a new game (Admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    new_game = {
        "id": get_next_game_id(),
        **game.dict(),
        "created_at": datetime.now().isoformat() + "Z",
        "updated_at": datetime.now().isoformat() + "Z"
    }
    games_db.append(new_game)
    return new_game

@app.put("/api/games/{game_id}", response_model=Game)
async def update_game(game_id: int, game_update: GameUpdate, current_user: dict = Depends(get_current_user)):
    """Update a game (Admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    game = find_game_by_id(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Update only provided fields
    update_data = game_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        game[field] = value
    
    game["updated_at"] = datetime.now().isoformat() + "Z"
    return game

@app.delete("/api/games/{game_id}")
async def delete_game(game_id: int, current_user: dict = Depends(get_current_user)):
    """Delete a game (Admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    game = find_game_by_id(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    games_db.remove(game)
    return {"message": "Game deleted successfully"}

@app.get("/api/categories")
async def get_categories():
    """Get all available game categories"""
    categories = list(set(game["category"] for game in games_db))
    return sorted(categories)

@app.get("/api/stats")
async def get_stats():
    """Get marketplace statistics"""
    return {
        "total_games": len(games_db),
        "featured_games": len([game for game in games_db if game["featured"]]),
        "categories": len(set(game["category"] for game in games_db)),
        "average_rating": sum(game["rating"] for game in games_db) / len(games_db) if games_db else 0,
        "total_users": len(users_db),
        "active_users": len([user for user in users_db if user["is_active"]])
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting Uap Market API...")
    print("API Documentation: http://localhost:8000/docs")
    print("Users in database:", len(users_db))
    uvicorn.run(app, host="0.0.0.0", port=8000)
