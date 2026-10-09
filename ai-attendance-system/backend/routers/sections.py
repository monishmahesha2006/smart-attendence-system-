\
\
   
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
from core.auth import get_current_admin

router = APIRouter(prefix="/sections", tags=["sections"])

@router.post("/", response_model=schemas.SectionResponse)
def create(s: schemas.SectionCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    obj = models.Section(**s.dict())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.get("/", response_model=List[schemas.SectionResponse])
def list_all(dept_id: int = None, db: Session = Depends(get_db)):
    q = db.query(models.Section)
    if dept_id:
        q = q.filter(models.Section.department_id == dept_id)
    return q.all()

@router.get("/{section_id}/detail")
def section_detail(section_id: int, db: Session = Depends(get_db)):
    """Full section info: students list, subjects & teachers, timetable slots."""
    sec = db.query(models.Section).filter(models.Section.id == section_id).first()
    if not sec:
        raise HTTPException(404, "Section not found")

                              
    students = [
        {
            "id":           s.id,
            "student_name": s.student_name,
            "student_id":   s.student_id,
            "department":   s.department,
            "has_photos":   bool(s.image_path),
        }
        for s in sec.students
    ]

                                                                          
    subjects_direct = db.query(models.Subject).filter(models.Subject.section_id == section_id).all()
                                       
    slot_subjects = {slot.subject for slot in sec.timetable if slot.subject}
    all_subjects   = {s.id: s for s in subjects_direct}
    for s in slot_subjects:
        all_subjects[s.id] = s

    subject_info = []
    teacher_set  = {}
    for subj in all_subjects.values():
        t = subj.teacher
        teacher_info = None
        if t:
            teacher_set[t.id] = t
            teacher_info = {"id": t.id, "name": t.name, "email": t.email}
        subject_info.append({
            "id":          subj.id,
            "name":        subj.name,
            "code":        subj.code,
            "teacher":     teacher_info,
        })

                                      
    timetable = [
        {
            "id":          slot.id,
            "day":         ["Mon","Tue","Wed","Thu","Fri","Sat"][slot.day_of_week] if slot.day_of_week is not None else "?",
            "period_no":   slot.period_no,
            "start_time":  str(slot.start_time)[:5] if slot.start_time else None,
            "end_time":    str(slot.end_time)[:5] if slot.end_time else None,
            "subject":     slot.subject.name if slot.subject else None,
            "subject_code":slot.subject.code if slot.subject else None,
            "teacher":     slot.subject.teacher.name if (slot.subject and slot.subject.teacher) else None,
        }
        for slot in sorted(sec.timetable, key=lambda x: (x.day_of_week or 0, x.period_no or 0))
    ]

    return {
        "id":            sec.id,
        "name":          sec.name,
        "year":          sec.year,
        "department":    sec.department.name if sec.department else None,
        "dept_code":     sec.department.code if sec.department else None,
        "student_count": len(students),
        "students":      students,
        "subjects":      subject_info,
        "teachers":      [{"id": t.id, "name": t.name, "email": t.email} for t in teacher_set.values()],
        "timetable":     timetable,
    }

@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    obj = db.query(models.Section).filter(models.Section.id == id).first()
    if not obj:
        raise HTTPException(404, "Not found")
    db.delete(obj); db.commit()
    return {"detail": "Deleted"}
