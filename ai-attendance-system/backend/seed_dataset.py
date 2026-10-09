\
\
\
\
\
\
\
\
\
\
   

import os, sys, cv2, numpy as np

                                                                                 
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

DEPARTMENTS = [
    "Computer Science", "Electronics", "Mechanical", "Civil", "Electrical",
    "Information Technology", "Mathematics", "Physics", "Chemistry", "Biomedical",
]

print("=" * 60)
print("  AI Attendance System — Dataset Seeder")
print("=" * 60)

                                                                                
admin = db.query(models.Admin).filter(models.Admin.email == "admin@example.com").first()
if not admin:
    db.add(models.Admin(
        name="Super Admin",
        email="admin@example.com",
        password=get_password_hash("password"),
    ))
    db.commit()
    print("[✓] Admin created: admin@example.com / password")
else:
    print("[✓] Admin already exists")

                                                                               
print("\n[↓] Downloading AT&T Olivetti 400-face dataset (40 subjects × 10 images)…")
try:
    from sklearn.datasets import fetch_olivetti_faces
    dataset = fetch_olivetti_faces(shuffle=False, download_if_missing=True)
    images = dataset.images                                            
    labels = dataset.target                
    print(f"[✓] Downloaded {len(images)} images for {len(set(labels))} subjects")
except Exception as e:
    print(f"[✗] scikit-learn download failed: {e}")
    sys.exit(1)

                                                                               
print("\n[→] Registering students and saving face images…")

face_samples  = []
face_ids      = []
detector      = cv2.CascadeClassifier(HAAR)
all_zero_detect = 0

for subject_idx in range(40):
    dept = DEPARTMENTS[subject_idx % len(DEPARTMENTS)]
    sid  = f"ATT{subject_idx+1:03d}"
    name = f"Student {subject_idx+1:02d}"

                          
    existing = db.query(models.Student).filter(models.Student.student_id == sid).first()
    if existing:
        student = existing
    else:
        student = models.Student(
            student_name=name,
            student_id=sid,
            department=dept,
        )
        db.add(student)
        db.commit()
        db.refresh(student)

                              
    student_dir = os.path.join(DATASET_DIR, str(student.id))
    os.makedirs(student_dir, exist_ok=True)

                                                                      
    for img_idx in range(10):
        global_idx = subject_idx * 10 + img_idx

                                                                         
        face_float = images[global_idx]
        face_u8 = (face_float * 255).astype(np.uint8)
        face_200 = cv2.resize(face_u8, (200, 200), interpolation=cv2.INTER_LANCZOS4)

                                                          
        face_eq = cv2.equalizeHist(face_200)

        save_path = os.path.join(student_dir, f"face_{img_idx}.jpg")
        cv2.imwrite(save_path, face_eq)

        face_samples.append(face_eq)
        face_ids.append(student.id)

    if subject_idx % 10 == 9:
        print(f"  … {subject_idx+1}/40 students processed")

                       
    student.image_path = student_dir
    db.commit()

print(f"\n[✓] All 40 students registered | {len(face_samples)} face samples ready")

                                                                                
print("\n[⚙] Training LBPH face recognizer…")

recognizer = cv2.face.LBPHFaceRecognizer_create(
    radius=2,
    neighbors=8,
    grid_x=8,
    grid_y=8,
)
recognizer.train(face_samples, np.array(face_ids))
recognizer.write(MODEL_PATH)

print(f"[✓] Model saved → {MODEL_PATH}")
print(f"\n{'='*60}")
print("  Training complete!")
print(f"  Students : 40")
print(f"  Samples  : {len(face_samples)}")
print(f"  Model    : {MODEL_PATH}")
print(f"{'='*60}")
print("\n  ➜  Open http://localhost:5173  →  Live Camera  →  Start Camera")
print("  Login: admin@example.com  |  Password: password\n")

db.close()
