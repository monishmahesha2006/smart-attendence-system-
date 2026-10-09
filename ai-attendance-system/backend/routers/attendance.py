from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
import io, csv
import models, schemas
from database import get_db
from core.auth import get_current_user

router = APIRouter(prefix="/attendance", tags=["attendance"])

                                                                                
@router.post("/", response_model=schemas.PeriodAttendanceResponse)
def record(a: schemas.PeriodAttendanceCreate, db: Session = Depends(get_db)):
    existing = db.query(models.PeriodAttendance).filter(
        models.PeriodAttendance.student_id == a.student_id,
        models.PeriodAttendance.date       == a.date,
        models.PeriodAttendance.slot_id    == a.slot_id,
    ).first()
    if existing:
        return existing
    obj = models.PeriodAttendance(**a.dict())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

                                                                               
@router.put("/{id}/status")
def override_status(id: int, status: str, db: Session = Depends(get_db)):
    obj = db.query(models.PeriodAttendance).filter(models.PeriodAttendance.id == id).first()
    if not obj: raise HTTPException(404, "Record not found")
    obj.status = status
    db.commit()
    return {"detail": f"Updated to {status}"}

                                                                                
@router.get("/", response_model=List[schemas.PeriodAttendanceResponse])
def get_attendance(
    date_query:  Optional[date] = None,
    section_id:  Optional[int]  = None,
    subject_id:  Optional[int]  = None,
    slot_id:     Optional[int]  = None,
    student_id:  Optional[int]  = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.PeriodAttendance)
    if date_query: q = q.filter(models.PeriodAttendance.date       == date_query)
    if subject_id: q = q.filter(models.PeriodAttendance.subject_id == subject_id)
    if slot_id:    q = q.filter(models.PeriodAttendance.slot_id    == slot_id)
    if student_id: q = q.filter(models.PeriodAttendance.student_id == student_id)
    if section_id:
        student_ids = [s.id for s in db.query(models.Student).filter(models.Student.section_id == section_id).all()]
        q = q.filter(models.PeriodAttendance.student_id.in_(student_ids))
    return q.order_by(models.PeriodAttendance.date.desc(), models.PeriodAttendance.time.desc()).all()

                                                                                
@router.get("/export")
def export_csv(
    date_from:  Optional[date] = None,
    date_to:    Optional[date] = None,
    section_id: Optional[int]  = None,
    subject_id: Optional[int]  = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.PeriodAttendance)
    if date_from:  q = q.filter(models.PeriodAttendance.date >= date_from)
    if date_to:    q = q.filter(models.PeriodAttendance.date <= date_to)
    if subject_id: q = q.filter(models.PeriodAttendance.subject_id == subject_id)
    if section_id:
        ids = [s.id for s in db.query(models.Student).filter(models.Student.section_id == section_id).all()]
        q = q.filter(models.PeriodAttendance.student_id.in_(ids))
    records = q.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Student Name", "Roll No", "Subject", "Date", "Time", "Status"])
    for r in records:
        sub_name = r.subject.name if r.subject else "N/A"
        writer.writerow([r.id, r.student.student_name, r.student.student_id,
                         sub_name, r.date, r.time, r.status])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance.csv"},
    )

                                                                                
@router.get("/section-summary/{section_id}")
def section_summary(section_id: int, query_date: Optional[date] = None, db: Session = Depends(get_db)):
    today = query_date or date.today()
    students = db.query(models.Student).filter(models.Student.section_id == section_id).all()
    present_ids = {
        r.student_id for r in db.query(models.PeriodAttendance).filter(
            models.PeriodAttendance.date == today,
            models.PeriodAttendance.student_id.in_([s.id for s in students]),
            models.PeriodAttendance.status == "Present"
        ).all()
    }
    return {
        "total": len(students),
        "present": len(present_ids),
        "absent": len(students) - len(present_ids),
        "date": today,
    }
