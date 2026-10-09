from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import shutil
import os

import models, schemas
from database import get_db
from core.auth import get_current_admin

router = APIRouter(
    prefix="/students",
    tags=["students"],
    dependencies=[Depends(get_current_admin)]
)

UPLOAD_DIR = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "..", "ai-model", "dataset"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=schemas.StudentResponse)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    db_student = db.query(models.Student).filter(models.Student.student_id == student.student_id).first()
    if db_student:
        raise HTTPException(status_code=400, detail="Student already registered")
    
    new_student = models.Student(**student.dict())
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    
                                                        
    student_dir = os.path.join(UPLOAD_DIR, str(new_student.id))
    os.makedirs(student_dir, exist_ok=True)
    
    return new_student

@router.get("/", response_model=List[schemas.StudentResponse])
def get_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    students = db.query(models.Student).offset(skip).limit(limit).all()
    return students

@router.delete("/{id}")
def delete_student(id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
                              
    student_dir = os.path.join(UPLOAD_DIR, str(student.id))
    if os.path.exists(student_dir):
        shutil.rmtree(student_dir)

    db.delete(student)
    db.commit()
    return {"detail": "Student deleted"}

@router.get("/{student_id}/detail")
def student_detail(student_id: int, db: Session = Depends(get_db)):
    """Full student profile with section info, subjects, teachers, attendance summary."""
    s = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not s:
        raise HTTPException(404, "Student not found")

                                        
    import os
    UPLOAD_DIR = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "..", "ai-model", "dataset"))
    student_dir = os.path.join(UPLOAD_DIR, str(s.id))
    photo_count = len([f for f in os.listdir(student_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]) if os.path.exists(student_dir) else 0

                     
    section_info = None
    subjects     = []
    teachers     = []
    if s.section:
        section_info = {
            "id":   s.section.id,
            "name": s.section.name,
            "year": s.section.year,
        }
                                   
        raw_subjects = db.query(models.Subject).filter(models.Subject.section_id == s.section_id).all()
        for sub in raw_subjects:
            t = sub.teacher
            subjects.append({"code": sub.code, "name": sub.name, "teacher": t.name if t else "—"})
            if t and t.id not in [x["id"] for x in teachers]:
                teachers.append({"id": t.id, "name": t.name, "email": t.email})

                        
    total_records  = db.query(models.PeriodAttendance).filter(models.PeriodAttendance.student_id == s.id).count()
    present_count  = db.query(models.PeriodAttendance).filter(
        models.PeriodAttendance.student_id == s.id,
        models.PeriodAttendance.status == "Present"
    ).count()
    absent_count   = total_records - present_count
    attendance_pct = round(present_count / total_records * 100, 1) if total_records > 0 else None

                               
    recent_records = (
        db.query(models.PeriodAttendance)
        .filter(models.PeriodAttendance.student_id == s.id)
        .order_by(models.PeriodAttendance.date.desc(), models.PeriodAttendance.time.desc())
        .limit(5)
        .all()
    )
    recent = [
        {
            "date":    str(r.date),
            "status":  r.status,
            "subject": r.subject.name if r.subject else "—",
        }
        for r in recent_records
    ]

    return {
        "id":             s.id,
        "student_name":   s.student_name,
        "student_id":     s.student_id,
        "department":     s.department,
        "section":        section_info,
        "photo_count":    photo_count,
        "has_photos":     photo_count > 0,
        "subjects":       subjects,
        "teachers":       teachers,
        "attendance": {
            "total":       total_records,
            "present":     present_count,
            "absent":      absent_count,
            "percentage":  attendance_pct,
        },
        "recent_attendance": recent,
    }

@router.post("/{id}/upload-image")
def upload_student_image(id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
                   
    student_dir = os.path.join(UPLOAD_DIR, str(student.id))
    os.makedirs(student_dir, exist_ok=True)
    
    file_path = os.path.join(student_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    student.image_path = file_path
    db.commit()
    return {"filename": file.filename, "path": file_path}
