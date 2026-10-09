\
\
\
\
\
   
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import models, schemas
from database import get_db
from core.auth import get_current_admin, get_current_user

router = APIRouter(prefix="/timetable", tags=["timetable"])

def _dept_section_ids(db: Session, department_id: int):
    """Return all section IDs that belong to a department."""
    return [
        s.id for s in
        db.query(models.Section).filter(models.Section.department_id == department_id).all()
    ]

@router.post("/", response_model=schemas.TimetableSlotResponse)
def create(
    s: schemas.TimetableSlotCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role = getattr(current_user, "_role", "teacher")
    if role not in ("super_admin", "dept_admin"):
        raise HTTPException(403, "Admins only")

                                                                    
    if role == "dept_admin":
        allowed = _dept_section_ids(db, current_user.department_id)
        if s.section_id not in allowed:
            raise HTTPException(403, "Section not in your department")

    obj = models.TimetableSlot(**s.dict())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.get("/", response_model=List[schemas.TimetableSlotResponse])
def list_slots(
    section_id: int = None,
    day: int = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Return timetable slots scoped by role:
      - super_admin : all slots (optionally filtered by section_id / day)
      - dept_admin  : only slots for their department's sections
      - teacher     : only slots for sections where they teach a subject
    """
    role = getattr(current_user, "_role", "teacher")
    q    = db.query(models.TimetableSlot)

    if role == "super_admin":
        if section_id:
            q = q.filter(models.TimetableSlot.section_id == section_id)

    elif role == "dept_admin":
        dept_sections = _dept_section_ids(db, current_user.department_id)
        if section_id:
                                                                          
            if section_id in dept_sections:
                q = q.filter(models.TimetableSlot.section_id == section_id)
            else:
                return []                                           
        else:
            q = q.filter(models.TimetableSlot.section_id.in_(dept_sections))

    else:           
                                                            
        teacher_section_ids = [
            sub.section_id for sub in
            db.query(models.Subject).filter(
                models.Subject.teacher_id == current_user.id,
                models.Subject.section_id.isnot(None),
            ).all()
        ]
        if section_id and section_id in teacher_section_ids:
            q = q.filter(models.TimetableSlot.section_id == section_id)
        elif teacher_section_ids:
            q = q.filter(models.TimetableSlot.section_id.in_(teacher_section_ids))
        else:
            return []

    if day is not None:
        q = q.filter(models.TimetableSlot.day_of_week == day)

    return q.order_by(models.TimetableSlot.section_id, models.TimetableSlot.period_no).all()

@router.get("/active")
def get_active_slot(section_id: int, db: Session = Depends(get_db)):
    """Returns the timetable slot currently active for a section based on current time."""
    now   = datetime.now()
    day   = now.weekday()
    now_t = now.time()
    slots = db.query(models.TimetableSlot).filter(
        models.TimetableSlot.section_id  == section_id,
        models.TimetableSlot.day_of_week == day,
    ).all()
    for slot in slots:
        if slot.start_time <= now_t <= slot.end_time:
            return slot
    return None

@router.delete("/{id}")
def delete(
    id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role = getattr(current_user, "_role", "teacher")
    if role not in ("super_admin", "dept_admin"):
        raise HTTPException(403, "Admins only")
    obj = db.query(models.TimetableSlot).filter(models.TimetableSlot.id == id).first()
    if not obj:
        raise HTTPException(404, "Not found")
    if role == "dept_admin":
        allowed = _dept_section_ids(db, current_user.department_id)
        if obj.section_id not in allowed:
            raise HTTPException(403, "Not in your department")
    db.delete(obj); db.commit()
    return {"detail": "Deleted"}
