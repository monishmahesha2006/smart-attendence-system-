\
\
   
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import secrets, string

import models, schemas
from database import get_db
from core.auth import (verify_password, get_password_hash,
                       create_access_token, get_current_user,
                       get_current_super_admin, get_current_admin,
                       ACCESS_TOKEN_EXPIRE_MINUTES)

router = APIRouter(prefix="/auth", tags=["auth"])

                                                                                 
@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Tries Admin table first, then Teacher."""
    user  = db.query(models.Admin).filter(models.Admin.email == form_data.username).first()
    role  = getattr(user, "role", None) if user else None

    if not user:
        user = db.query(models.Teacher).filter(models.Teacher.email == form_data.username).first()
        role = "teacher" if user else None

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    token = create_access_token(
        data={"sub": user.email, "role": role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    name = getattr(user, "name", user.email)
    dept_id = getattr(user, "department_id", None)
    return {"access_token": token, "token_type": "bearer",
            "role": role, "name": name, "department_id": dept_id}

                                                                                 
def _gen_password(length: int = 10) -> str:
    chars = string.ascii_letters + string.digits + "@#$"
    return "".join(secrets.choice(chars) for _ in range(length))

                                                                                 
                                            
                                                                                 

@router.get("/dept-admins")
def list_dept_admins(db: Session = Depends(get_db),
                     _=Depends(get_current_super_admin)):
    """List all dept admins — super_admin only."""
    admins = db.query(models.Admin).filter(models.Admin.role == "dept_admin").all()
    result = []
    for a in admins:
        dept_name = a.department.name if a.department else None
        result.append({
            "id":            a.id,
            "name":          a.name,
            "email":         a.email,
            "role":          a.role,
            "department_id": a.department_id,
            "department":    dept_name,
        })
    return result

@router.post("/dept-admins")
def create_dept_admin(
    payload: dict,
    db: Session = Depends(get_db),
    _=Depends(get_current_super_admin),
):
    """Create a new dept admin — super_admin only.
    Body: { name, email, department_id, password? }
    """
    name          = payload.get("name", "").strip()
    email         = payload.get("email", "").strip().lower()
    department_id = payload.get("department_id")
    raw_password  = payload.get("password") or _gen_password()

    if not name or not email or not department_id:
        raise HTTPException(400, "name, email, and department_id are required")

    if db.query(models.Admin).filter(models.Admin.email == email).first():
        raise HTTPException(400, "Email is already registered")

    dept = db.query(models.Department).filter(models.Department.id == department_id).first()
    if not dept:
        raise HTTPException(404, "Department not found")

    new_admin = models.Admin(
        name=name,
        email=email,
        password=get_password_hash(raw_password),
        role="dept_admin",
        department_id=department_id,
    )
    db.add(new_admin); db.commit(); db.refresh(new_admin)

    return {
        "id":            new_admin.id,
        "name":          new_admin.name,
        "email":         new_admin.email,
        "role":          "dept_admin",
        "department_id": department_id,
        "department":    dept.name,
                                                                         
        "plain_password": raw_password,
    }

@router.put("/dept-admins/{admin_id}/reset-password")
def reset_dept_admin_password(
    admin_id: int,
    payload: dict = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_super_admin),
):
    """Reset a dept admin's password — super_admin only."""
    admin = db.query(models.Admin).filter(
        models.Admin.id == admin_id, models.Admin.role == "dept_admin"
    ).first()
    if not admin:
        raise HTTPException(404, "Dept admin not found")

    new_pw = (payload or {}).get("password") or _gen_password()
    admin.password = get_password_hash(new_pw)
    db.commit()
    return {"detail": "Password reset", "plain_password": new_pw}

@router.delete("/dept-admins/{admin_id}")
def delete_dept_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_super_admin),
):
    """Delete a dept admin — super_admin only."""
    admin = db.query(models.Admin).filter(
        models.Admin.id == admin_id, models.Admin.role == "dept_admin"
    ).first()
    if not admin:
        raise HTTPException(404, "Dept admin not found")
    db.delete(admin); db.commit()
    return {"detail": "Deleted"}

                                                                              
@router.post("/register-admin", response_model=schemas.AdminResponse)
def register_admin(admin: schemas.AdminCreate, db: Session = Depends(get_db)):
    if db.query(models.Admin).filter(models.Admin.email == admin.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    new = models.Admin(
        name=admin.name, email=admin.email,
        password=get_password_hash(admin.password),
        role=admin.role, department_id=admin.department_id
    )
    db.add(new); db.commit(); db.refresh(new)
    return new

@router.post("/register-teacher", response_model=schemas.TeacherResponse)
def register_teacher(t: schemas.TeacherCreate, db: Session = Depends(get_db)):
    if db.query(models.Teacher).filter(models.Teacher.email == t.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    new = models.Teacher(
        name=t.name, email=t.email,
        password=get_password_hash(t.password),
        department_id=t.department_id
    )
    db.add(new); db.commit(); db.refresh(new)
    return new
