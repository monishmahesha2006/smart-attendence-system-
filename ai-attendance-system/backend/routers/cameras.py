from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
from core.auth import get_current_admin

router = APIRouter(prefix="/cameras", tags=["cameras"])

@router.post("/", response_model=schemas.CameraResponse)
def create(c: schemas.CameraCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    obj = models.Camera(**c.dict())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.get("/", response_model=List[schemas.CameraResponse])
def list_all(db: Session = Depends(get_db)):
    return db.query(models.Camera).all()

@router.put("/{id}", response_model=schemas.CameraResponse)
def update(id: int, c: schemas.CameraCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    obj = db.query(models.Camera).filter(models.Camera.id == id).first()
    if not obj: raise HTTPException(404, "Not found")
    for k, v in c.dict().items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj

@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    obj = db.query(models.Camera).filter(models.Camera.id == id).first()
    if not obj: raise HTTPException(404, "Not found")
    db.delete(obj); db.commit()
    return {"detail": "Deleted"}
