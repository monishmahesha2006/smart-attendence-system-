\
\
\
\
\
   
import secrets, string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from database import get_db
from core.auth import (get_current_user, get_current_admin,
                       get_password_hash, verify_password)

router = APIRouter(prefix="/teachers", tags=["teachers"])

def _gen_password(length: int = 10) -> str:
    chars = string.ascii_letters + string.digits + "@#$"
    return "".join(secrets.choice(chars) for _ in range(length))

def _teacher_to_dict(t: models.Teacher, plain_password: str = None) -> dict:
    d = {
        "id":            t.id,
        "name":          t.name,
        "email":         t.email,
        "department_id": t.department_id,
        "department":    t.department.name if t.department else None,
        "subject_count": len(t.subjects),
    }
    if plain_password:
        d["plain_password"] = plain_password
    return d

                                                                                
@router.get("/")
def list_teachers(
    dept_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role    = getattr(current_user, "_role", "teacher")
    q       = db.query(models.Teacher)

    if role == "super_admin":
        if dept_id:
            q = q.filter(models.Teacher.department_id == dept_id)
    elif role == "dept_admin":
                                                                    
        q = q.filter(models.Teacher.department_id == current_user.department_id)
    else:
                                          
        return [_teacher_to_dict(current_user)]

    return [_teacher_to_dict(t) for t in q.all()]

                                                                              
@router.post("/")
def create_teacher(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role = getattr(current_user, "_role", "teacher")
    if role not in ("super_admin", "dept_admin"):
        raise HTTPException(403, "Only admins can create teachers")

    name     = payload.get("name", "").strip()
    email    = payload.get("email", "").strip().lower()
    dept_id  = payload.get("department_id")
    raw_pw   = payload.get("password") or _gen_password()

                                                            
    if role == "dept_admin":
        dept_id = current_user.department_id

    if not name or not email or not dept_id:
        raise HTTPException(400, "name, email, and department_id are required")

    if db.query(models.Teacher).filter(models.Teacher.email == email).first():
        raise HTTPException(400, "Email already registered")

    dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not dept:
        raise HTTPException(404, "Department not found")

    teacher = models.Teacher(
        name=name, email=email,
        password=get_password_hash(raw_pw),
        department_id=dept_id,
    )
    db.add(teacher); db.commit(); db.refresh(teacher)
    return _teacher_to_dict(teacher, plain_password=raw_pw)

                                                                                
@router.put("/{teacher_id}/reset-password")
def reset_teacher_password(
    teacher_id: int,
    payload: dict = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role    = getattr(current_user, "_role", "teacher")
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(404, "Teacher not found")

                                                                      
    if role == "dept_admin" and teacher.department_id != current_user.department_id:
        raise HTTPException(403, "Not in your department")

    new_pw = (payload or {}).get("password") or _gen_password()
    teacher.password = get_password_hash(new_pw)
    db.commit()
    return {"detail": "Password reset", "plain_password": new_pw}

                                                                                 
@router.delete("/{teacher_id}")
def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role    = getattr(current_user, "_role", "teacher")
    if role not in ("super_admin", "dept_admin"):
        raise HTTPException(403, "Admins only")

    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(404, "Teacher not found")

    if role == "dept_admin" and teacher.department_id != current_user.department_id:
        raise HTTPException(403, "Not in your department")

    db.delete(teacher); db.commit()
    return {"detail": "Teacher deleted"}
