import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from database import engine, SessionLocal
import sqlalchemy as sa
import models

                                                                               
with engine.connect() as conn:
    try:
        conn.execute(sa.text("ALTER TABLE students ADD COLUMN has_real_photos INTEGER DEFAULT 0"))
        conn.commit()
        print("Column has_real_photos added")
    except Exception:
        print("Column already exists, continuing...")

    conn.execute(sa.text("UPDATE students SET has_real_photos=0 WHERE student_name LIKE 'Student %'"))
    conn.execute(sa.text("UPDATE students SET has_real_photos=1 WHERE student_name NOT LIKE 'Student %'"))
    conn.commit()

                                                                                
db = SessionLocal()
with engine.connect() as conn:
    result = conn.execute(sa.text("SELECT id, student_name, student_id, has_real_photos FROM students ORDER BY has_real_photos DESC"))
    print("\nStudent training status:")
    for row in result:
        tag = "REAL ✓" if row[3] else "fake (skip)"
        print(f"  [{tag}] {row[0]}: {row[1]} ({row[2]})")

                                                                               
import cv2, numpy as np

DATASET_DIR = os.path.realpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ai-model", "dataset"))
MODEL_PATH  = os.path.realpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ai-model", "trainer.yml"))
HAAR        = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
detector    = cv2.CascadeClassifier(HAAR)

with engine.connect() as conn:
    real_rows = conn.execute(sa.text("SELECT id, student_name FROM students WHERE has_real_photos=1")).fetchall()

print(f"\nTraining on {len(real_rows)} real student(s): {[r[1] for r in real_rows]}")

face_samples = []
face_ids     = []

for (db_id, name) in real_rows:
    folder = os.path.join(DATASET_DIR, str(db_id))
    if not os.path.exists(folder):
        print(f"  WARNING: No folder for {name} (id={db_id}) — upload photos first!")
        continue

    imgs = [f for f in os.listdir(folder) if f.lower().endswith((".jpg", ".jpeg", ".png"))]
    if not imgs:
        print(f"  WARNING: Empty folder for {name}")
        continue

    print(f"  {name}: {len(imgs)} image(s) in {folder}")
    added = 0
    for fname in imgs:
        path = os.path.join(folder, fname)
        gray = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
        if gray is None:
            continue

                                                                             
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))

        if gray.shape == (200, 200):
            face_samples.append(clahe.apply(gray))
            face_ids.append(db_id)
            added += 1
            continue

                                   
        faces = detector.detectMultiScale(gray, 1.05, 3, minSize=(40, 40))
        if len(faces) > 0:
            for (x, y, w, h) in faces[:1]:                         
                crop = clahe.apply(cv2.resize(gray[y:y+h, x:x+w], (200, 200)))
                face_samples.append(crop)
                face_ids.append(db_id)
                added += 1
        else:
                                                                             
            crop = clahe.apply(cv2.resize(gray, (200, 200)))
            face_samples.append(crop)
            face_ids.append(db_id)
            added += 1

    print(f"    -> {added} face samples collected")

if not face_samples:
    print("\nERROR: No real student photos found. Please upload photos for real students first.")
    sys.exit(1)

print(f"\nTraining LBPH on {len(face_samples)} samples from {len(set(face_ids))} real student(s)...")
recognizer = cv2.face.LBPHFaceRecognizer_create(radius=1, neighbors=8, grid_x=8, grid_y=8)
recognizer.train(face_samples, np.array(face_ids))
recognizer.write(MODEL_PATH)

print(f"Model saved to: {MODEL_PATH}")
print(f"\nDone! The camera will now only recognize REAL uploaded students.")
print(f"Real students in model: {list(set(face_ids))}")
db.close()
