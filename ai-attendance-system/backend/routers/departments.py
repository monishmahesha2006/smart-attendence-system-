from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
from core.auth import get_current_super_admin

router = APIRouter(prefix="/departments", tags=["departments"])

@router.post("/", response_model=schemas.DepartmentResponse)
def create(d: schemas.DepartmentCreate, db: Session = Depends(get_db), _=Depends(get_current_super_admin)):
    if db.query(models.Department).filter(models.Department.code == d.code).first():
        raise HTTPException(400, "Department code already exists")
    obj = models.Department(name=d.name, code=d.code)
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.get("/", response_model=List[schemas.DepartmentResponse])
def list_all(db: Session = Depends(get_db)):
    return db.query(models.Department).all()

@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db), _=Depends(get_current_super_admin)):
    obj = db.query(models.Department).filter(models.Department.id == id).first()
    if not obj: raise HTTPException(404, "Not found")
    db.delete(obj); db.commit()
    return {"detail": "Deleted"}
