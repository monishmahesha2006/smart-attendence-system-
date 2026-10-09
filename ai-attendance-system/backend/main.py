import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from database import engine, SessionLocal
import models

from routers import (admin, students, attendance, departments,
                     sections, subjects, teachers, timetable,
                     cameras, analytics)
from routers import model as model_router
from routers import me as me_router

# Ensure all database tables exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Smart Attendance System — Engineering College",
    description="Multi-role, period-wise AI face-recognition attendance for engineering colleges.",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Compression middleware for high transfer efficiency (90%+ network reduction)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Secure CORS handling
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS != ["*"] else ["*"],
    allow_credentials=False if ALLOWED_ORIGINS == ["*"] else True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["Content-Length", "X-Process-Time"],
)

# Enterprise HTTP Security Headers Middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(self), microphone=()"
    return response

# Startup event: Auto-seed initial admin and defaults if database is fresh
@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        existing_admin = db.query(models.Admin).first()
        if not existing_admin:
            print("No admin detected in database. Running initial seed...")
            try:
                import seed_college
            except Exception as e:
                print(f"Notice: Auto-seeding skipped or encountered: {e}")
    except Exception as exc:
        print(f"Startup DB check notice: {exc}")
    finally:
        db.close()

# Healthcheck endpoint for Railway & cloud monitors
@app.get("/health", tags=["system"])
def health():
    return {
        "status": "healthy",
        "service": "ai-attendance-system",
        "version": "3.0.0",
        "environment": os.getenv("ENVIRONMENT", "production")
    }

# Mount API routers (both standard prefix and /api prefix for maximum compatibility)
all_routers = [
    admin.router,
    departments.router,
    sections.router,
    subjects.router,
    teachers.router,
    timetable.router,
    cameras.router,
    students.router,
    attendance.router,
    analytics.router,
    model_router.router,
    me_router.router,
]

for r in all_routers:
    app.include_router(r)
    # Also support /api prefix seamlessly
    app.include_router(r, prefix="/api")

# Static frontend directory detection (Docker build, local build, or relative)
_HERE = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = None
for candidate in [
    os.path.join(_HERE, "static"),
    os.path.realpath(os.path.join(_HERE, "..", "frontend", "dist")),
    os.path.realpath(os.path.join(_HERE, "..", "dist")),
    "/app/dist",
    "/app/static",
]:
    if os.path.isdir(candidate) and os.path.isfile(os.path.join(candidate, "index.html")):
        STATIC_DIR = candidate
        break

if STATIC_DIR:
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.middleware("http")
async def spa_middleware(request: Request, call_next):
    path = request.url.path
    api_prefixes = (
        "/auth", "/api", "/departments", "/sections", "/subjects",
        "/teachers", "/timetable", "/cameras/", "/students",
        "/attendance", "/analytics", "/model", "/me",
        "/docs", "/openapi.json", "/redoc", "/health"
    )
    accept = request.headers.get("accept", "")
    
    if STATIC_DIR and request.method == "GET" and "text/html" in accept:
        if not path.startswith(api_prefixes) and not path.startswith("/assets/"):
            index_path = os.path.join(STATIC_DIR, "index.html")
            if os.path.isfile(index_path):
                return FileResponse(index_path)

    response = await call_next(request)

    # Fallback for client-side routing on 404 GET
    if STATIC_DIR and response.status_code == 404 and request.method == "GET":
        if not path.startswith(api_prefixes) and not path.startswith("/assets/"):
            index_path = os.path.join(STATIC_DIR, "index.html")
            if os.path.isfile(index_path):
                return FileResponse(index_path)

    return response

@app.get("/")
def root():
    if STATIC_DIR and os.path.isfile(os.path.join(STATIC_DIR, "index.html")):
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
    return {"message": "AI Smart Attendance System v3.0 — Engineering College Edition", "docs": "/docs", "health": "/health"}
