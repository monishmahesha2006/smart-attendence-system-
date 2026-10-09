from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models

from routers import (admin, students, attendance, departments,
                     sections, subjects, teachers, timetable,
                     cameras, analytics)
from routers import model as model_router
from routers import me as me_router

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Smart Attendance System — Engineering College",
    description="Multi-role, period-wise AI face-recognition attendance for engineering colleges.",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router)
app.include_router(departments.router)
app.include_router(sections.router)
app.include_router(subjects.router)
app.include_router(teachers.router)
app.include_router(timetable.router)
app.include_router(cameras.router)
app.include_router(students.router)
app.include_router(attendance.router)
app.include_router(analytics.router)
app.include_router(model_router.router)
app.include_router(me_router.router)

@app.get("/")
def home():
    return {"message": "AI Smart Attendance System v3.0 — Engineering College Edition"}
