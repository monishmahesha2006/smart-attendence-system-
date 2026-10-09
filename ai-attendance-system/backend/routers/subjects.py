from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
from core.auth import get_current_admin

router = APIRouter(prefix="/subjects", tags=["subjects"])

@router.post("/", response_model=schemas.SubjectResponse)
def create(s: schemas.SubjectCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    if db.query(models.Subject).filter(models.Subject.code == s.code).first():
        raise HTTPException(400, "Subject code already exists")
    obj = models.Subject(**s.dict())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.get("/", response_model=List[schemas.SubjectResponse])
def list_all(section_id: int = None, teacher_id: int = None, dept_id: int = None, db: Session = Depends(get_db)):
    q = db.query(models.Subject)
    if section_id:  q = q.filter(models.Subject.section_id  == section_id)
    if teacher_id:  q = q.filter(models.Subject.teacher_id  == teacher_id)
    if dept_id:     q = q.filter(models.Subject.department_id == dept_id)
    return q.all()

@router.put("/{id}", response_model=schemas.SubjectResponse)
def update(id: int, s: schemas.SubjectCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    obj = db.query(models.Subject).filter(models.Subject.id == id).first()
    if not obj: raise HTTPException(404, "Not found")
    for k, v in s.dict().items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj

@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    obj = db.query(models.Subject).filter(models.Subject.id == id).first()
    if not obj: raise HTTPException(404, "Not found")
    db.delete(obj); db.commit()
    return {"detail": "Deleted"}
