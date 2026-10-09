import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models, schemas

# Secure token configuration with environment override
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "c7f9e8a1d4b63e528192a0f7e4c2b9a8174620f5b8d9c1e3a7f0e2b4c6a8d1e3")
ALGORITHM  = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))

pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain: str, hashed: str) -> bool:
    if not plain or not hashed:
        return False
    return pwd_context.verify(plain, hashed)

def get_password_hash(pw: str) -> str:
    return pwd_context.hash(pw)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def _decode_token(token: str) -> schemas.TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role", "super_admin")
        if email is None:
            raise credentials_exception
        return schemas.TokenData(email=email, role=role)
    except JWTError:
        raise credentials_exception

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
