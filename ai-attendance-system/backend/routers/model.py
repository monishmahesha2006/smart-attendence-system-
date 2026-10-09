from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import cv2
import numpy as np
import os
from datetime import date, datetime

import models
from database import get_db
from core.auth import get_current_admin

router = APIRouter(
    prefix="/model",
    tags=["model"],
)

                                                                                
_HERE        = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR  = os.path.realpath(os.path.join(_HERE, "..", "..", "ai-model", "dataset"))
MODEL_PATH   = os.path.realpath(os.path.join(_HERE, "..", "..", "ai-model", "trainer.yml"))
HAAR         = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"

os.makedirs(DATASET_DIR, exist_ok=True)
os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

def _student_dir(db_id: int) -> str:
    return os.path.realpath(os.path.join(DATASET_DIR, str(db_id)))

                                                                                
def _do_train(db: Session) -> dict:
    import sqlalchemy as sa

    recognizer = cv2.face.LBPHFaceRecognizer_create(
        radius=1, neighbors=8, grid_x=8, grid_y=8
    )
    detector = cv2.CascadeClassifier(HAAR)
    clahe    = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))

    face_samples: list = []
    face_ids:     list = []

                                                                                
                                                                              
                                                                        
    with db.bind.connect() as conn:
        try:
            real_ids_rows = conn.execute(
                sa.text("SELECT id FROM students WHERE has_real_photos=1")
            ).fetchall()
            real_id_set = {r[0] for r in real_ids_rows}
        except Exception:
                                                                           
            real_id_set = None

    student_dirs = [
        d for d in os.listdir(DATASET_DIR)
        if os.path.isdir(os.path.join(DATASET_DIR, d))
    ]

    if not student_dirs:
        raise HTTPException(400, "No student image folders found. Upload face images first.")

    for folder_name in student_dirs:
        try:
            db_id = int(folder_name)
        except ValueError:
            continue

                                   
        if real_id_set is not None and db_id not in real_id_set:
            continue

        student = db.query(models.Student).filter(models.Student.id == db_id).first()
        if not student:
            continue

        folder = _student_dir(db_id)
        imgs   = [f for f in os.listdir(folder) if f.lower().endswith((".jpg", ".jpeg", ".png"))]

        for fname in imgs:
            gray = cv2.imread(os.path.join(folder, fname), cv2.IMREAD_GRAYSCALE)
            if gray is None:
                continue

            if gray.shape == (200, 200):
                face_samples.append(clahe.apply(gray))
                face_ids.append(db_id)
                continue

                                                                                                     
            faces = detector.detectMultiScale(gray, 1.05, 3, minSize=(40, 40))
            if len(faces) > 0:
                for (x, y, w, h) in faces[:1]:
                    crop = clahe.apply(cv2.resize(gray[y:y+h, x:x+w], (200, 200)))
                    face_samples.append(crop)
                    face_ids.append(db_id)
            else:
                                                              
                crop = clahe.apply(cv2.resize(gray, (200, 200)))
                face_samples.append(crop)
                face_ids.append(db_id)

    if not face_samples:
        raise HTTPException(
            400,
            "No real student photos found. Please upload face images for your students first."
        )

    recognizer.train(face_samples, np.array(face_ids))
    recognizer.write(MODEL_PATH)

    return {
        "samples":  len(face_samples),
        "students": len(set(face_ids)),
        "message":  f"Model trained on {len(face_samples)} samples across {len(set(face_ids))} real student(s).",
    }

                                                                                 
@router.post("/upload/{student_id}")
async def upload_and_train(
    student_id: int,
    files: List[UploadFile] = File(...),
    db:    Session          = Depends(get_db),
):
    """
    Upload face images for a student, extract face crops, save them,
    then immediately re-train the LBPH model so the new student is
    recognizable right away.
    """
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(404, "Student not found")

    folder  = _student_dir(student_id)
    os.makedirs(folder, exist_ok=True)
    detector = cv2.CascadeClassifier(HAAR)

    saved = skipped = 0

    for upload in files:
        raw    = await upload.read()
        nparr  = np.frombuffer(raw, np.uint8)
        img    = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            skipped += 1
            continue

        gray   = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces  = detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40))

        if len(faces) == 0:
                                                                               
                                                                                 
            idx  = len(os.listdir(folder))
            path = os.path.join(folder, f"raw_{idx}.jpg")
            cv2.imwrite(path, cv2.resize(gray, (200, 200)))
            skipped += 1
            continue

        for (x, y, w, h) in faces:
            crop = cv2.equalizeHist(cv2.resize(gray[y:y+h, x:x+w], (200, 200)))
            idx  = len(os.listdir(folder))
            cv2.imwrite(os.path.join(folder, f"face_{idx}.jpg"), crop)
            saved += 1

                                                                 
    import sqlalchemy as sa
    student.image_path = folder
    with db.bind.connect() as conn:
        conn.execute(sa.text(f"UPDATE students SET has_real_photos=1 WHERE id={student_id}"))
        conn.commit()
    db.commit()

                                                                                
    try:
        train_result = _do_train(db)
    except HTTPException as e:
        train_result = {"message": f"Upload saved but training failed: {e.detail}"}

    return {
        "student":      student.student_name,
        "faces_saved":  saved,
        "files_skipped": skipped,
        **train_result,
    }

                                                                                
@router.post("/capture/{student_id}")
async def capture_student_faces(
    student_id: int,
    files: List[UploadFile] = File(...),
    db:    Session          = Depends(get_db),
):
    return await upload_and_train(student_id=student_id, files=files, db=db)

                                                                                
@router.post("/train")
def train_model(db: Session = Depends(get_db)):
    return _do_train(db)

                                                                                
@router.post("/recognize")
async def recognize_face(
    file:    UploadFile    = File(...),
    slot_id: Optional[int] = None,
    db:      Session       = Depends(get_db),
):
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(400, "Model not trained yet. Please upload student photos and wait for auto-training.")

    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.read(MODEL_PATH)
    detector   = cv2.CascadeClassifier(HAAR)

    raw   = await file.read()
    nparr = np.frombuffer(raw, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(400, "Could not decode image frame.")

                                                                                 
    h_img, w_img = img.shape[:2]
    scale    = 640 / w_img if w_img > 640 else 1.0
    if scale != 1.0:
        img = cv2.resize(img, (int(w_img * scale), int(h_img * scale)))

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)                                     

                                                                                
    raw_faces = detector.detectMultiScale(
        gray,
        scaleFactor=1.15,
        minNeighbors=7,                                                        
        minSize=(80, 80),                                    
        flags=cv2.CASCADE_SCALE_IMAGE,
    )

    if len(raw_faces) == 0:
        return {"recognized_faces": []}

                                                                               
    def _nms(boxes, overlap_thresh=0.4):
        if len(boxes) == 0:
            return boxes
        boxes = boxes.astype(float)
        x1, y1 = boxes[:,0], boxes[:,1]
        x2     = boxes[:,0] + boxes[:,2]
        y2     = boxes[:,1] + boxes[:,3]
        areas  = boxes[:,2] * boxes[:,3]
        order  = areas.argsort()[::-1]
        keep   = []
        while order.size > 0:
            i = order[0]
            keep.append(i)
            xx1 = np.maximum(x1[i], x1[order[1:]])
            yy1 = np.maximum(y1[i], y1[order[1:]])
            xx2 = np.minimum(x2[i], x2[order[1:]])
            yy2 = np.minimum(y2[i], y2[order[1:]])
            w_   = np.maximum(0.0, xx2 - xx1)
            h_   = np.maximum(0.0, yy2 - yy1)
            inter = w_ * h_
            iou   = inter / (areas[i] + areas[order[1:]] - inter)
            order = order[np.where(iou <= overlap_thresh)[0] + 1]
        return boxes[keep].astype(int)

    faces = _nms(np.array(raw_faces))

                                                                               
    CONFIDENCE_THRESHOLD = 70

    today    = date.today()
    now_time = datetime.now().time()
    recognized = []
    seen_students = set()                                    

    for (x, y, w, h) in faces:
        crop              = cv2.equalizeHist(cv2.resize(gray[y:y+h, x:x+w], (200, 200)))
        db_id, confidence = recognizer.predict(crop)

        if confidence >= CONFIDENCE_THRESHOLD:
            continue                                              

        if db_id in seen_students:
            continue                                               

        student = db.query(models.Student).filter(models.Student.id == db_id).first()
        if not student:
            continue

        seen_students.add(db_id)

                                                                  
                                                                                           
        try:
            existing = db.query(models.PeriodAttendance).filter(
                models.PeriodAttendance.student_id == student.id,
                models.PeriodAttendance.date       == today,
                models.PeriodAttendance.slot_id    == slot_id,
            ).first()

            if not existing:
                db.add(models.PeriodAttendance(
                    student_id=student.id,
                    subject_id=None,
                    slot_id=slot_id,
                    date=today,
                    time=now_time,
                    status="Present",
                ))
                db.commit()
        except Exception:
            db.rollback()                                                            

                                               
                                                                  
        conf_pct = round((1 - confidence / CONFIDENCE_THRESHOLD) * 100, 1)

        recognized.append({
            "id":           student.id,
            "student_name": student.student_name,
            "student_id":   student.student_id,
            "confidence":   conf_pct,
            "bbox":         [int(x), int(y), int(w), int(h)],
        })

    return {"recognized_faces": recognized}
