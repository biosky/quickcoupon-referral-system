from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import base64


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection with SSL support
import certifi

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(
    mongo_url,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=10000
)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"

# Create the main app without a prefix
app = FastAPI()

# Add root health check endpoint
@app.get("/")
async def root():
    return {"status": "healthy", "message": "QuickCoupon API is running", "version": "1.0.0"}

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ============ MODELS ============

class UserBase(BaseModel):
    username: str
    email: EmailStr
    phone: str
    role: str  # 'customer' or 'shopkeeper'

class UserCreate(UserBase):
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class ShopkeeperProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    shopkeeper_id: str
    store_name: str
    cashback_offer: str  # flexible text: "100" or "2 free coffees" or "Buy 1 Get 1"
    promotional_image: Optional[str] = None  # base64 encoded
    store_description: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ShopkeeperProfileUpdate(BaseModel):
    store_name: Optional[str] = None
    cashback_offer: Optional[str] = None
    promotional_image: Optional[str] = None
    store_description: Optional[str] = None

class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    coupon_code: str = Field(default_factory=lambda: str(uuid.uuid4())[:8].upper())
    customer_id: str
    shopkeeper_id: str
    click_count: int = 0
    is_redeemed: bool = False
    cashback_earned: str = ""  # flexible text for offer
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    redeemed_at: Optional[datetime] = None

class CouponCreate(BaseModel):
    shopkeeper_id: str

class ClickTrackRequest(BaseModel):
    coupon_code: str


# ============ UTILITY FUNCTIONS ============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=30)  # 30 days for session persistence
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user_doc is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        if isinstance(user_doc['created_at'], str):
            user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
        
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")


# ============ AUTH ROUTES ============

@api_router.post("/auth/signup", response_model=TokenResponse)
async def signup(user_create: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"username": user_create.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create new user
    user = User(
        username=user_create.username,
        role=user_create.role
    )
    
    user_dict = user.model_dump()
    user_dict['password'] = hash_password(user_create.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return TokenResponse(access_token=access_token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(login_req: LoginRequest):
    # Find user
    user_doc = await db.users.find_one({"username": login_req.username}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Verify password
    if not verify_password(login_req.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Convert datetime
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return TokenResponse(access_token=access_token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ============ SHOPKEEPER ROUTES ============

@api_router.post("/shopkeeper/profile")
async def update_shopkeeper_profile(
    store_name: str = Form(...),
    cashback_offer: str = Form(...),
    store_description: str = Form(None),
    promotional_image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != 'shopkeeper':
        raise HTTPException(status_code=403, detail="Only shopkeepers can update profile")
    
    # Process image if provided
    image_base64 = None
    if promotional_image:
        image_data = await promotional_image.read()
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        image_base64 = f"data:{promotional_image.content_type};base64,{image_base64}"
    
    # Check if profile exists
    existing_profile = await db.shopkeeper_profiles.find_one({"shopkeeper_id": current_user.id})
    
    profile_data = {
        "shopkeeper_id": current_user.id,
        "store_name": store_name,
        "cashback_offer": cashback_offer,
        "store_description": store_description,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if image_base64:
        profile_data["promotional_image"] = image_base64
    elif not existing_profile:
        profile_data["promotional_image"] = None
    
    if existing_profile:
        await db.shopkeeper_profiles.update_one(
            {"shopkeeper_id": current_user.id},
            {"$set": profile_data}
        )
    else:
        await db.shopkeeper_profiles.insert_one(profile_data)
    
    return {"message": "Profile updated successfully"}

@api_router.get("/shopkeeper/profile")
async def get_shopkeeper_profile(current_user: User = Depends(get_current_user)):
    if current_user.role != 'shopkeeper':
        raise HTTPException(status_code=403, detail="Only shopkeepers can view profile")
    
    profile = await db.shopkeeper_profiles.find_one({"shopkeeper_id": current_user.id}, {"_id": 0})
    if not profile:
        return None
    
    return profile

@api_router.delete("/shopkeeper/profile")
async def delete_shopkeeper_profile(current_user: User = Depends(get_current_user)):
    if current_user.role != 'shopkeeper':
        raise HTTPException(status_code=403, detail="Only shopkeepers can delete profile")
    
    # Delete profile
    await db.shopkeeper_profiles.delete_one({"shopkeeper_id": current_user.id})
    
    # Delete all coupons associated with this shopkeeper
    await db.coupons.delete_many({"shopkeeper_id": current_user.id})
    
    # Delete user account
    await db.users.delete_one({"id": current_user.id})
    
    return {"message": "Profile deleted successfully"}

@api_router.get("/shopkeeper/coupons")
async def get_shopkeeper_coupons(current_user: User = Depends(get_current_user)):
    if current_user.role != 'shopkeeper':
        raise HTTPException(status_code=403, detail="Only shopkeepers can view coupons")
    
    coupons = await db.coupons.find({"shopkeeper_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    # Get customer details for each coupon
    for coupon in coupons:
        customer = await db.users.find_one({"id": coupon['customer_id']}, {"_id": 0, "username": 1})
        coupon['customer_username'] = customer['username'] if customer else 'Unknown'
    
    return coupons

@api_router.get("/shopkeeper/analytics")
async def get_shopkeeper_analytics(current_user: User = Depends(get_current_user)):
    if current_user.role != 'shopkeeper':
        raise HTTPException(status_code=403, detail="Only shopkeepers can view analytics")
    
    # Get all coupons
    all_coupons = await db.coupons.find({"shopkeeper_id": current_user.id}).to_list(1000)
    
    total_coupons = len(all_coupons)
    redeemed_coupons = sum(1 for c in all_coupons if c['is_redeemed'])
    pending_coupons = total_coupons - redeemed_coupons
    
    return {
        "total_coupons": total_coupons,
        "redeemed_coupons": redeemed_coupons,
        "pending_coupons": pending_coupons
    }


# ============ CUSTOMER ROUTES ============

@api_router.post("/customer/coupon", response_model=Coupon)
async def create_coupon(
    coupon_create: CouponCreate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != 'customer':
        raise HTTPException(status_code=403, detail="Only customers can create coupons")
    
    # Verify shopkeeper exists
    shopkeeper = await db.users.find_one({"id": coupon_create.shopkeeper_id, "role": "shopkeeper"})
    if not shopkeeper:
        raise HTTPException(status_code=404, detail="Shopkeeper not found")
    
    # Create coupon
    coupon = Coupon(
        customer_id=current_user.id,
        shopkeeper_id=coupon_create.shopkeeper_id
    )
    
    coupon_dict = coupon.model_dump()
    coupon_dict['created_at'] = coupon_dict['created_at'].isoformat()
    
    await db.coupons.insert_one(coupon_dict)
    
    return coupon

@api_router.get("/customer/coupons")
async def get_customer_coupons(current_user: User = Depends(get_current_user)):
    if current_user.role != 'customer':
        raise HTTPException(status_code=403, detail="Only customers can view coupons")
    
    coupons = await db.coupons.find({"customer_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    # Get shopkeeper details for each coupon
    for coupon in coupons:
        profile = await db.shopkeeper_profiles.find_one({"shopkeeper_id": coupon['shopkeeper_id']}, {"_id": 0})
        if profile:
            coupon['store_name'] = profile.get('store_name', 'Unknown Store')
            coupon['cashback_offer'] = profile.get('cashback_offer', 'No offer')
    
    return coupons

@api_router.post("/customer/click")
async def track_click(
    click_req: ClickTrackRequest,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != 'customer':
        raise HTTPException(status_code=403, detail="Only customers can track clicks")
    
    # Find coupon
    coupon = await db.coupons.find_one({"coupon_code": click_req.coupon_code, "customer_id": current_user.id})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    if coupon['is_redeemed']:
        return {"message": "Coupon already redeemed", "already_redeemed": True, "click_count": coupon['click_count']}
    
    # Increment click count only (no auto-redemption)
    new_click_count = coupon['click_count'] + 1
    
    await db.coupons.update_one(
        {"coupon_code": click_req.coupon_code},
        {"$set": {"click_count": new_click_count}}
    )
    
    return {
        "message": "Click tracked successfully",
        "click_count": new_click_count,
        "can_redeem": new_click_count >= 3,
        "is_redeemed": False
    }

@api_router.post("/customer/redeem")
async def redeem_coupon(
    click_req: ClickTrackRequest,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != 'customer':
        raise HTTPException(status_code=403, detail="Only customers can redeem coupons")
    
    # Find coupon
    coupon = await db.coupons.find_one({"coupon_code": click_req.coupon_code, "customer_id": current_user.id})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    if coupon['is_redeemed']:
        return {"message": "Coupon already redeemed", "already_redeemed": True}
    
    # Check if customer has clicked 3 times
    if coupon['click_count'] < 3:
        raise HTTPException(status_code=400, detail="You need to click Copy Link 3 times before redeeming")
    
    # Get shopkeeper profile for cashback offer
    profile = await db.shopkeeper_profiles.find_one({"shopkeeper_id": coupon['shopkeeper_id']})
    cashback_offer = profile.get('cashback_offer', 'No offer') if profile else 'No offer'
    
    # Redeem coupon
    await db.coupons.update_one(
        {"coupon_code": click_req.coupon_code},
        {"$set": {
            "is_redeemed": True,
            "cashback_earned": cashback_offer,
            "redeemed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "message": "Coupon redeemed successfully",
        "is_redeemed": True,
        "cashback_earned": cashback_offer
    }


# ============ PUBLIC ROUTES ============

@api_router.get("/public/coupon/{coupon_code}")
async def get_public_coupon(coupon_code: str):
    """Public endpoint to view coupon details (for shared links)"""
    coupon = await db.coupons.find_one({"coupon_code": coupon_code}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    # Get shopkeeper profile
    profile = await db.shopkeeper_profiles.find_one({"shopkeeper_id": coupon['shopkeeper_id']}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Store information not found")
    
    return {
        "coupon_code": coupon['coupon_code'],
        "store_name": profile.get('store_name', 'Store'),
        "cashback_offer": profile.get('cashback_offer', 'No offer'),
        "promotional_image": profile.get('promotional_image'),
        "store_description": profile.get('store_description', ''),
        "is_redeemed": coupon['is_redeemed']
    }

@api_router.get("/public/shopkeepers")
async def get_all_shopkeepers():
    """Get list of all shopkeepers for customer to choose from"""
    shopkeepers = await db.users.find({"role": "shopkeeper"}, {"_id": 0, "password": 0}).to_list(1000)
    
    # Get profiles for each shopkeeper
    result = []
    for shopkeeper in shopkeepers:
        profile = await db.shopkeeper_profiles.find_one({"shopkeeper_id": shopkeeper['id']}, {"_id": 0})
        result.append({
            "id": shopkeeper['id'],
            "username": shopkeeper['username'],
            "store_name": profile.get('store_name', shopkeeper['username']) if profile else shopkeeper['username'],
            "cashback_offer": profile.get('cashback_offer', 'No offer') if profile else 'No offer'
        })
    
    return result


@api_router.get("/")
async def root():
    return {"message": "Referral Coupon System API"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()