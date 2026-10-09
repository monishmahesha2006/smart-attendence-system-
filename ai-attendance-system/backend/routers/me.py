\
\
\
   
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta
from collections import defaultdict

import models, schemas
from database import get_db
from core.auth import get_current_user

router = APIRouter(prefix="/me", tags=["me"])

def _dept_id_for_user(user) -> Optional[int]:
    """Return the dept_id this user is scoped to (None = super_admin = all)."""
    role = getattr(user, "_role", "teacher")
    if role == "super_admin":
        return None
    return getattr(user, "department_id", None)

def _subject_ids_for_teacher(user, db: Session) -> Optional[List[int]]:
    """For a teacher, return only their assigned subject IDs."""
    role = getattr(user, "_role", "teacher")
    if role != "teacher":
        return None
    subjects = db.query(models.Subject).filter(
        models.Subject.teacher_id == user.id
    ).all()
    return [s.id for s in subjects]

                                                                               
@router.get("/profile")
def my_profile(user=Depends(get_current_user), db: Session = Depends(get_db)):
    role  = getattr(user, "_role", "teacher")
    dept  = db.query(models.Department).filter(
        models.Department.id == user.department_id
    ).first() if user.department_id else None

    return {
        "id":            user.id,
        "name":          user.name,
        "email":         user.email,
        "role":          role,
        "department_id": user.department_id,
        "department":    dept.name if dept else None,
    }

                                                                               
@router.get("/sections", response_model=List[schemas.SectionResponse])
def my_sections(user=Depends(get_current_user), db: Session = Depends(get_db)):
    role    = getattr(user, "_role", "teacher")
    dept_id = _dept_id_for_user(user)
    q       = db.query(models.Section)

    if role == "teacher":
                                                                  
        sub_ids  = _subject_ids_for_teacher(user, db) or []
        slot_sec = db.query(models.TimetableSlot.section_id).filter(
            models.TimetableSlot.subject_id.in_(sub_ids)
        ).distinct().all()
        sec_ids  = [r[0] for r in slot_sec]
        if sec_ids:
            q = q.filter(models.Section.id.in_(sec_ids))
        else:
            return []
    elif dept_id:
        q = q.filter(models.Section.department_id == dept_id)

    return q.all()

                                                                               
@router.get("/subjects")
def my_subjects(user=Depends(get_current_user), db: Session = Depends(get_db)):
    role    = getattr(user, "_role", "teacher")
    dept_id = _dept_id_for_user(user)

    if role == "teacher":
        subs = db.query(models.Subject).filter(
            models.Subject.teacher_id == user.id
        ).all()
    elif dept_id:
        subs = db.query(models.Subject).filter(
            models.Subject.department_id == dept_id
        ).all()
    else:
        subs = db.query(models.Subject).all()

    return [{"id": s.id, "name": s.name, "code": s.code,
             "department_id": s.department_id, "teacher_id": s.teacher_id}
            for s in subs]

                                                                               
@router.get("/students")
def my_students(user=Depends(get_current_user), db: Session = Depends(get_db)):
    role    = getattr(user, "_role", "teacher")
    dept_id = _dept_id_for_user(user)

    if role == "teacher":
                                                    
        sub_ids  = _subject_ids_for_teacher(user, db) or []
        slot_secs = db.query(models.TimetableSlot.section_id).filter(
            models.TimetableSlot.subject_id.in_(sub_ids)
        ).distinct().all()
        sec_ids   = [r[0] for r in slot_secs]
        if not sec_ids:
            return []
        students = db.query(models.Student).filter(
            models.Student.section_id.in_(sec_ids)
        ).all()
    elif dept_id:
        sec_ids  = [s.id for s in db.query(models.Section).filter(
            models.Section.department_id == dept_id).all()]
        students = db.query(models.Student).filter(
            models.Student.section_id.in_(sec_ids)
        ).all()
    else:
        students = db.query(models.Student).all()

    return [{"id": s.id, "student_name": s.student_name,
             "student_id": s.student_id, "department": s.department,
             "section_id": s.section_id, "image_path": s.image_path}
            for s in students]

                                                                               
@router.get("/dashboard-stats")
def my_dashboard(user=Depends(get_current_user), db: Session = Depends(get_db)):
    role    = getattr(user, "_role", "teacher")
    dept_id = _dept_id_for_user(user)
    today   = date.today()

                     
    if role == "teacher":
        sub_ids = _subject_ids_for_teacher(user, db) or []
        slot_secs = db.query(models.TimetableSlot.section_id).filter(
            models.TimetableSlot.subject_id.in_(sub_ids)
        ).distinct().all()
        sec_ids   = [r[0] for r in slot_secs]
        student_ids = [s.id for s in db.query(models.Student).filter(
            models.Student.section_id.in_(sec_ids)).all()] if sec_ids else []
    elif dept_id:
        sec_ids = [s.id for s in db.query(models.Section).filter(
            models.Section.department_id == dept_id).all()]
        student_ids = [s.id for s in db.query(models.Student).filter(
            models.Student.section_id.in_(sec_ids)).all()]
    else:
        sec_ids = [s.id for s in db.query(models.Section).all()]
        student_ids = [s.id for s in db.query(models.Student).all()]

    today_records = db.query(models.PeriodAttendance).filter(
        models.PeriodAttendance.date == today,
        models.PeriodAttendance.student_id.in_(student_ids),
    ).all()

    present_ids = {r.student_id for r in today_records if r.status == "Present"}

                                   
    risk_count = 0
    for sid in student_ids:
        recs    = db.query(models.PeriodAttendance).filter(
            models.PeriodAttendance.student_id == sid).all()
        total   = len(recs)
        if total == 0:
            continue
        pct     = sum(1 for r in recs if r.status == "Present") / total * 100
        if pct < 75:
            risk_count += 1

                 
    trend = []
    for i in range(6, -1, -1):
        d     = today - timedelta(days=i)
        recs  = db.query(models.PeriodAttendance).filter(
            models.PeriodAttendance.date == d,
            models.PeriodAttendance.student_id.in_(student_ids),
        ).all()
        total    = len(recs)
        attended = sum(1 for r in recs if r.status == "Present")
        trend.append({
            "date":    str(d),
            "present": attended,
            "absent":  total - attended,
            "total":   total,
            "pct":     round(attended / total * 100, 1) if total else 0,
        })

    return {
        "total_students": len(student_ids),
        "total_sections": len(sec_ids),
        "today_present":  len(present_ids),
        "today_absent":   len(student_ids) - len(present_ids),
        "at_risk_count":  risk_count,
        "role":           role,
        "department_id":  dept_id,
        "trend":          trend,
    }

                                                                                
@router.get("/attendance")
def my_attendance(
    date_query: Optional[date] = None,
    section_id: Optional[int]  = None,
    subject_id: Optional[int]  = None,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    role    = getattr(user, "_role", "teacher")
    dept_id = _dept_id_for_user(user)

    q = db.query(models.PeriodAttendance)
    if date_query:  q = q.filter(models.PeriodAttendance.date == date_query)
    if subject_id:  q = q.filter(models.PeriodAttendance.subject_id == subject_id)
    if section_id:
        ids = [s.id for s in db.query(models.Student).filter(
            models.Student.section_id == section_id).all()]
        q = q.filter(models.PeriodAttendance.student_id.in_(ids))

                          
    if role == "teacher":
        teacher_sub_ids   = _subject_ids_for_teacher(user, db) or []
        slot_sec          = db.query(models.TimetableSlot.section_id).filter(
            models.TimetableSlot.subject_id.in_(teacher_sub_ids)).distinct().all()
        allowed_sec_ids   = [r[0] for r in slot_sec]
        allowed_stu_ids   = [s.id for s in db.query(models.Student).filter(
            models.Student.section_id.in_(allowed_sec_ids)).all()] if allowed_sec_ids else []
        q = q.filter(models.PeriodAttendance.student_id.in_(allowed_stu_ids))
    elif dept_id and role == "dept_admin":
        dept_sec_ids      = [s.id for s in db.query(models.Section).filter(
            models.Section.department_id == dept_id).all()]
        dept_stu_ids      = [s.id for s in db.query(models.Student).filter(
            models.Student.section_id.in_(dept_sec_ids)).all()]
        q = q.filter(models.PeriodAttendance.student_id.in_(dept_stu_ids))

    records = q.order_by(models.PeriodAttendance.date.desc()).limit(500).all()
    return [
        {
            "id":         r.id,
            "student_id": r.student_id,
            "subject_id": r.subject_id,
            "date":       str(r.date),
            "time":       str(r.time),
            "status":     r.status,
            "student":    {
                "student_name": r.student.student_name,
                "student_id":   r.student.student_id,
            } if r.student else None,
        }
        for r in records
    ]

                                                                               
@router.get("/risk-list")
def my_risk_list(user=Depends(get_current_user), db: Session = Depends(get_db)):
    stats  = my_dashboard(user=user, db=db)
    student_ids = []
    role    = getattr(user, "_role", "teacher")
    dept_id = _dept_id_for_user(user)

    if role == "teacher":
        sub_ids  = _subject_ids_for_teacher(user, db) or []
        slot_secs = db.query(models.TimetableSlot.section_id).filter(
            models.TimetableSlot.subject_id.in_(sub_ids)).distinct().all()
        sec_ids   = [r[0] for r in slot_secs]
        student_ids = [s.id for s in db.query(models.Student).filter(
            models.Student.section_id.in_(sec_ids)).all()] if sec_ids else []
    elif dept_id:
        sec_ids = [s.id for s in db.query(models.Section).filter(
            models.Section.department_id == dept_id).all()]
        student_ids = [s.id for s in db.query(models.Student).filter(
            models.Student.section_id.in_(sec_ids)).all()]
    else:
        student_ids = [s.id for s in db.query(models.Student).all()]

    risk = []
    for sid in student_ids:
        student = db.query(models.Student).filter(models.Student.id == sid).first()
        if not student:
            continue
        recs    = db.query(models.PeriodAttendance).filter(
            models.PeriodAttendance.student_id == sid).all()
        total   = len(recs)
        attended = sum(1 for r in recs if r.status == "Present")
        pct     = round(attended / total * 100, 1) if total else 0.0

        if total > 0 and pct < 80:
                              
            if pct < 65:
                level = "DETAIN"
                color = "#ef4444"
            elif pct < 75:
                level = "CRITICAL"
                color = "#f59e0b"
            else:
                level = "WARNING"
                color = "#eab308"

            risk.append({
                "student_id":   student.id,
                "student_name": student.student_name,
                "roll_no":      student.student_id,
                "section_id":   student.section_id,
                "percentage":   pct,
                "total":        total,
                "attended":     attended,
                "level":        level,
                "color":        color,
            })

    return sorted(risk, key=lambda x: x["percentage"])

                                                                                
@router.get("/monthly-trend")
def monthly_trend(user=Depends(get_current_user), db: Session = Depends(get_db)):
    role    = getattr(user, "_role", "teacher")
    dept_id = _dept_id_for_user(user)
    today   = date.today()

    if role == "teacher":
        sub_ids = _subject_ids_for_teacher(user, db) or []
        slot_secs = db.query(models.TimetableSlot.section_id).filter(
            models.TimetableSlot.subject_id.in_(sub_ids)).distinct().all()
        sec_ids   = [r[0] for r in slot_secs]
        student_ids = [s.id for s in db.query(models.Student).filter(
            models.Student.section_id.in_(sec_ids)).all()] if sec_ids else []
    elif dept_id:
        sec_ids = [s.id for s in db.query(models.Section).filter(
            models.Section.department_id == dept_id).all()]
        student_ids = [s.id for s in db.query(models.Student).filter(
            models.Student.section_id.in_(sec_ids)).all()]
    else:
        student_ids = [s.id for s in db.query(models.Student).all()]

    trend = []
    for i in range(29, -1, -1):
        d     = today - timedelta(days=i)
        recs  = db.query(models.PeriodAttendance).filter(
            models.PeriodAttendance.date == d,
            models.PeriodAttendance.student_id.in_(student_ids),
        ).all()
        total    = len(recs)
        attended = sum(1 for r in recs if r.status == "Present")
        trend.append({
            "date":    str(d),
            "present": attended,
            "absent":  total - attended,
            "total":   total,
            "pct":     round(attended / total * 100, 1) if total else 0,
        })
    return trend
