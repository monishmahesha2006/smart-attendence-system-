from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models, schemas

SECRET_KEY = "college_attendance_supersecret_key"
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)
def get_password_hash(pw):          return pwd_context.hash(pw)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

                                                                                
def _decode_token(token: str) -> schemas.TokenData:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role:  str = payload.get("role", "super_admin")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return schemas.TokenData(email=email, role=role)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

                                                                                
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    data = _decode_token(token)
    if data.role in ("super_admin", "dept_admin"):
        user = db.query(models.Admin).filter(models.Admin.email == data.email).first()
    else:
        user = db.query(models.Teacher).filter(models.Teacher.email == data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    user._role = data.role
    return user

def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    data = _decode_token(token)
    if data.role not in ("super_admin", "dept_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    user = db.query(models.Admin).filter(models.Admin.email == data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Admin not found")
    return user

def get_current_super_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    data = _decode_token(token)
    if data.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super Admin access required")
    user = db.query(models.Admin).filter(models.Admin.email == data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Admin not found")
    return user

def get_current_teacher(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    data = _decode_token(token)
    if data.role != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")
    user = db.query(models.Teacher).filter(models.Teacher.email == data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Teacher not found")
    return user
