import pytest
from datetime import date, time
from core.auth import create_access_token
import models

def auth_headers(email="admin@college.edu", role="super_admin"):
    token = create_access_token({"sub": email, "role": role})
    return {"Authorization": f"Bearer {token}"}

def test_student_and_attendance_flow(client, db_session):
    headers = auth_headers()
    
    # Create Section
    sec = models.Section(name="Section-B", year=2, department_id=1)
    db_session.add(sec)
    db_session.commit()
    db_session.refresh(sec)

    # Create Student
    student_payload = {
        "student_name": "John Doe",
        "student_id": "CS202601",
        "department": "CSE",
        "section_id": sec.id
    }
    stud_res = client.post("/students/", json=student_payload, headers=headers)
    assert stud_res.status_code == 200
    stud_data = stud_res.json()
    assert stud_data["student_id"] == "CS202601"

    # Create Subject & Slot
    subj = models.Subject(name="Computer Networks", code="CS301", department_id=1, section_id=sec.id)
    db_session.add(subj)
    db_session.commit()
    db_session.refresh(subj)

    slot = models.TimetableSlot(
        section_id=sec.id,
        subject_id=subj.id,
        day_of_week=0,
        period_no=1,
        start_time=time(9, 0),
        end_time=time(10, 0)
    )
    db_session.add(slot)
    db_session.commit()
    db_session.refresh(slot)

    # Mark Attendance
    att_payload = {
        "student_id": stud_data["id"],
        "subject_id": subj.id,
        "slot_id": slot.id,
        "date": str(date.today()),
        "time": "09:15:00",
        "status": "Present"
    }
    att_res = client.post("/attendance/", json=att_payload, headers=headers)
    assert att_res.status_code == 200
    att_data = att_res.json()
    assert att_data["status"] == "Present"

    # Verify duplicate attendance returns existing or updates gracefully
    att_dup = client.post("/attendance/", json=att_payload, headers=headers)
    assert att_dup.status_code in (200, 400)
