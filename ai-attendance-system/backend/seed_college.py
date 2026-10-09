\
\
\
\
\
\
\
   

import os, sys, cv2, numpy as np
from datetime import time as dtime

ROOT = os.path.realpath(os.path.join(os.path.dirname(__file__), ".."))
DATASET_DIR = os.path.join(ROOT, "ai-model", "dataset")
MODEL_PATH  = os.path.join(ROOT, "ai-model", "trainer.yml")
os.makedirs(DATASET_DIR, exist_ok=True)

sys.path.insert(0, os.path.dirname(__file__))
from database import SessionLocal, engine
import models
from core.auth import get_password_hash
models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

HAAR = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"

                                                                                
def upsert_admin(name, email, pw, role, dept_id=None):
    a = db.query(models.Admin).filter(models.Admin.email == email).first()
    if not a:
        a = models.Admin(name=name, email=email, password=get_password_hash(pw),
                         role=role, department_id=dept_id)
        db.add(a); db.commit(); db.refresh(a)
        print(f"  Admin: {email}")
    return a

upsert_admin("Super Admin", "admin@college.edu", "Admin@123", "super_admin")

                                                                                
DEPTS_INFO = [
    ("Computer Science",        "CSE"),
    ("Electronics Engineering", "ECE"),
    ("Mechanical Engineering",  "MECH"),
    ("Civil Engineering",       "CIVIL"),
    ("Information Technology",  "IT"),
]
DEPTS = {}
for name, code in DEPTS_INFO:
    d = db.query(models.Department).filter(models.Department.code == code).first()
    if not d:
        d = models.Department(name=name, code=code)
        db.add(d); db.commit(); db.refresh(d)
    DEPTS[code] = d
    print(f"  Dept: {code}")

             
for code, dept in DEPTS.items():
    upsert_admin(f"{code} Admin", f"admin.{code.lower()}@college.edu",
                 "Admin@123", "dept_admin", dept.id)

                                                                               
SECTIONS = {}
for code, dept in DEPTS.items():
    for sec_name in [f"{code}-A", f"{code}-B"]:
        s = db.query(models.Section).filter(
            models.Section.name == sec_name, models.Section.department_id == dept.id
        ).first()
        if not s:
            s = models.Section(name=sec_name, year=2, department_id=dept.id)
            db.add(s); db.commit(); db.refresh(s)
        SECTIONS[sec_name] = s
        print(f"  Section: {sec_name}")

                                                                                
SUBJECTS_BY_DEPT = {
    "CSE":  [("Data Structures", "CSE201"), ("DBMS", "CSE202"), ("OS", "CSE203"),
             ("Computer Networks", "CSE204"), ("AI", "CSE205"), ("Web Tech", "CSE206")],
    "ECE":  [("Signals & Systems", "ECE201"), ("Analog Circuits", "ECE202"),
             ("Digital Electronics", "ECE203"), ("Microprocessors", "ECE204"),
             ("Communication", "ECE205"), ("VLSI", "ECE206")],
    "MECH": [("Thermodynamics", "MECH201"), ("Fluid Mechanics", "MECH202"),
             ("Manufacturing", "MECH203"), ("Dynamics", "MECH204"),
             ("Heat Transfer", "MECH205"), ("CAD", "MECH206")],
    "CIVIL":[("Structural Analysis", "CIV201"), ("Soil Mechanics", "CIV202"),
             ("Surveying", "CIV203"), ("Concrete Tech", "CIV204"),
             ("Environmental Engg", "CIV205"), ("Transportation", "CIV206")],
    "IT":   [("Software Engg", "IT201"), ("Cloud Computing", "IT202"),
             ("Machine Learning", "IT203"), ("Cyber Security", "IT204"),
             ("Data Mining", "IT205"), ("Mobile Dev", "IT206")],
}

TEACHERS_MAP = {}                           
for code, dept in DEPTS.items():
    for i, (sub_name, sub_code) in enumerate(SUBJECTS_BY_DEPT[code]):
                 
        t_email = f"teacher.{sub_code.lower()}@college.edu"
        t = db.query(models.Teacher).filter(models.Teacher.email == t_email).first()
        if not t:
            t = models.Teacher(name=f"Prof. {sub_name[:12]}", email=t_email,
                               password=get_password_hash("Teacher@123"),
                               department_id=dept.id)
            db.add(t); db.commit(); db.refresh(t)

                                                
        for sec_suffix in ["A", "B"]:
            sec = SECTIONS[f"{code}-{sec_suffix}"]
            unique_code = f"{sub_code}-{sec_suffix}"
            subj = db.query(models.Subject).filter(models.Subject.code == unique_code).first()
            if not subj:
                subj = models.Subject(name=sub_name, code=unique_code,
                                      department_id=dept.id,
                                      teacher_id=t.id, section_id=sec.id)
                db.add(subj); db.commit(); db.refresh(subj)
            TEACHERS_MAP[unique_code] = t

print(f"  Teachers + Subjects created.")

                                                                                
PERIOD_TIMES = [
    (dtime(8, 0),  dtime(9, 0)),
    (dtime(9, 0),  dtime(10, 0)),
    (dtime(10, 15),dtime(11, 15)),
    (dtime(11, 15),dtime(12, 15)),
    (dtime(13, 0), dtime(14, 0)),
    (dtime(14, 0), dtime(15, 0)),
]

for code, dept in DEPTS.items():
    for sec_suffix in ["A", "B"]:
        sec = SECTIONS[f"{code}-{sec_suffix}"]
        subjects_for_sec = db.query(models.Subject).filter(
            models.Subject.section_id == sec.id
        ).all()
        for day in range(6):                  
            for period_idx, (st, et) in enumerate(PERIOD_TIMES):
                sub = subjects_for_sec[period_idx % len(subjects_for_sec)]
                exists = db.query(models.TimetableSlot).filter(
                    models.TimetableSlot.section_id  == sec.id,
                    models.TimetableSlot.day_of_week == day,
                    models.TimetableSlot.period_no   == period_idx + 1,
                ).first()
                if not exists:
                    slot = models.TimetableSlot(section_id=sec.id, subject_id=sub.id,
                                                day_of_week=day, period_no=period_idx+1,
                                                start_time=st, end_time=et)
                    db.add(slot)
        db.commit()
print("  Timetable created.")

                                                                                
for name, sec in SECTIONS.items():
    cam = db.query(models.Camera).filter(models.Camera.section_id == sec.id).first()
    if not cam:
        cam = models.Camera(room_name=f"Room-{name}", stream_url="0",
                            section_id=sec.id, active=True)
        db.add(cam)
db.commit()
print("  Cameras registered.")

                                                                                
print("\n[↓] Downloading Olivetti faces…")
from sklearn.datasets import fetch_olivetti_faces
dataset = fetch_olivetti_faces(shuffle=False, download_if_missing=True)
images  = dataset.images
labels  = dataset.target
print(f"[✓] {len(images)} images, {len(set(labels))} subjects")

section_list = list(SECTIONS.values())
face_samples, face_ids = [], []

for idx in range(40):
    sec = section_list[idx % len(section_list)]
    sid = f"ROLL{idx+1:04d}"
    s   = db.query(models.Student).filter(models.Student.student_id == sid).first()
    if not s:
        s = models.Student(student_name=f"Student {idx+1:02d}", student_id=sid,
                           department=sec.department.name, section_id=sec.id)
        db.add(s); db.commit(); db.refresh(s)

    student_dir = os.path.join(DATASET_DIR, str(s.id))
    os.makedirs(student_dir, exist_ok=True)

    for img_i in range(10):
        global_i  = idx * 10 + img_i
        face_u8   = (images[global_i] * 255).astype(np.uint8)
        face_eq   = cv2.equalizeHist(cv2.resize(face_u8, (200, 200)))
        cv2.imwrite(os.path.join(student_dir, f"face_{img_i}.jpg"), face_eq)
        face_samples.append(face_eq)
        face_ids.append(s.id)

    s.image_path = student_dir
    db.commit()

print(f"[✓] 40 students seeded across {len(section_list)} sections")

                                                                               
print("[⚙] Training LBPH model…")
recognizer = cv2.face.LBPHFaceRecognizer_create(radius=2, neighbors=8, grid_x=8, grid_y=8)
recognizer.train(face_samples, np.array(face_ids))
recognizer.write(MODEL_PATH)

print(f"[✓] Model saved → {MODEL_PATH}")
print(f"\n{'='*62}")
print("  Engineering College System Ready!")
print(f"  Students : 40 | Sections : {len(SECTIONS)} | Subjects : {sum(len(v) for v in SUBJECTS_BY_DEPT.values())*2}")
print(f"  Model    : {MODEL_PATH}")
print("  Frontend : http://localhost:5173")
print(f"\n  Super Admin  : admin@college.edu        / Admin@123")
print(f"  Dept Admin   : admin.cse@college.edu    / Admin@123")
print(f"  Any Teacher  : teacher.cse201-a@college.edu / Teacher@123")
print(f"{'='*62}\n")
db.close()
