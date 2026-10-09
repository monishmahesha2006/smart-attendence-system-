from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta
from collections import defaultdict
import models, schemas
from database import get_db

router = APIRouter(prefix="/analytics", tags=["analytics"])

RISK_THRESHOLD = 75.0

def _attendance_pct(attended: int, total: int) -> float:
    return round((attended / total) * 100, 2) if total else 0.0

                                                                               
@router.get("/students", response_model=List[schemas.StudentAttendanceSummary])
def student_summaries(
    section_id:  Optional[int] = None,
    subject_id:  Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Student)
    if section_id: q = q.filter(models.Student.section_id == section_id)
    students = q.all()

    result = []
    for s in students:
        att_q = db.query(models.PeriodAttendance).filter(models.PeriodAttendance.student_id == s.id)
        if subject_id: att_q = att_q.filter(models.PeriodAttendance.subject_id == subject_id)
        records  = att_q.all()
        total    = len(records)
        attended = sum(1 for r in records if r.status == "Present")
        pct      = _attendance_pct(attended, total)
        result.append(schemas.StudentAttendanceSummary(
            student_id=s.id, student_name=s.student_name,
            roll_no=s.student_id,
            section=s.section.name if s.section else None,
            total_classes=total, attended=attended,
            percentage=pct, at_risk=(pct < RISK_THRESHOLD and total > 0),
        ))
    return sorted(result, key=lambda x: x.percentage)

                                                                                
@router.get("/risk-list")
def risk_list(section_id: Optional[int] = None, db: Session = Depends(get_db)):
    summaries = student_summaries(section_id=section_id, db=db)
    return [s for s in summaries if s.at_risk]

                                                                                
@router.get("/period-heatmap")
def period_heatmap(section_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Returns absent count per period number (1–8)."""
    slots = db.query(models.TimetableSlot)
    if section_id: slots = slots.filter(models.TimetableSlot.section_id == section_id)
    slots = slots.all()

    heatmap = defaultdict(lambda: {"present": 0, "absent": 0})
    for slot in slots:
        records = db.query(models.PeriodAttendance).filter(
            models.PeriodAttendance.slot_id == slot.id
        ).all()
        for r in records:
            if r.status == "Present": heatmap[slot.period_no]["present"] += 1
            else:                     heatmap[slot.period_no]["absent"]  += 1

    return [{"period": p, **v} for p, v in sorted(heatmap.items())]

                                                                                
@router.get("/department-comparison")
def dept_comparison(db: Session = Depends(get_db)):
    depts = db.query(models.Department).all()
    result = []
    for dept in depts:
        sections = db.query(models.Section).filter(models.Section.department_id == dept.id).all()
        total = attended = 0
        for sec in sections:
            student_ids = [s.id for s in db.query(models.Student).filter(models.Student.section_id == sec.id).all()]
            records = db.query(models.PeriodAttendance).filter(
                models.PeriodAttendance.student_id.in_(student_ids)
            ).all()
            total    += len(records)
            attended += sum(1 for r in records if r.status == "Present")
        result.append({
            "department": dept.name,
            "code":       dept.code,
            "sections":   len(sections),
            "percentage": _attendance_pct(attended, total),
        })
    return result

                                                                                
@router.get("/weekly-trend")
def weekly_trend(section_id: Optional[int] = None, db: Session = Depends(get_db)):
    today = date.today()
    trend = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        q = db.query(models.PeriodAttendance).filter(models.PeriodAttendance.date == d)
        if section_id:
            ids = [s.id for s in db.query(models.Student).filter(models.Student.section_id == section_id).all()]
            q = q.filter(models.PeriodAttendance.student_id.in_(ids))
        records  = q.all()
        total    = len(records)
        attended = sum(1 for r in records if r.status == "Present")
        trend.append({"date": str(d), "present": attended, "absent": total - attended, "total": total})
    return trend

                                                                                
@router.get("/college-stats")
def college_stats(db: Session = Depends(get_db)):
    today = date.today()
    today_records = db.query(models.PeriodAttendance).filter(models.PeriodAttendance.date == today).all()
    return {
        "total_students":    db.query(models.Student).count(),
        "total_teachers":    db.query(models.Teacher).count(),
        "total_sections":    db.query(models.Section).count(),
        "total_departments": db.query(models.Department).count(),
        "today_present":     sum(1 for r in today_records if r.status == "Present"),
        "today_absent":      sum(1 for r in today_records if r.status != "Present"),
        "total_cameras":     db.query(models.Camera).count(),
    }
