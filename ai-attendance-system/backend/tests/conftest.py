import sys, os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import models
from database import Base, get_db
from main import app
from core.auth import get_password_hash

TEST_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "test_temp.db"))
SQLALCHEMY_TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Builds clean schema once for the test session."""
    if os.path.exists(TEST_DB_PATH):
        try: os.remove(TEST_DB_PATH)
        except Exception: pass
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists(TEST_DB_PATH):
        try: os.remove(TEST_DB_PATH)
        except Exception: pass

@pytest.fixture(scope="function")
def db_session():
    """Provides a transactional database session for each test."""
    db = TestingSessionLocal()
    
    # Ensure baseline Super Admin and CSE Department exist
    dept = db.query(models.Department).filter(models.Department.code == "CSE").first()
    if not dept:
        dept = models.Department(name="Computer Science & Engineering", code="CSE")
        db.add(dept)
        db.commit()
        db.refresh(dept)

    admin = db.query(models.Admin).filter(models.Admin.email == "admin@college.edu").first()
    if not admin:
        admin = models.Admin(
            name="Super Admin",
            email="admin@college.edu",
            password=get_password_hash("Admin@123"),
            role="super_admin",
            department_id=dept.id
        )
        db.add(admin)

    teacher = db.query(models.Teacher).filter(models.Teacher.email == "sarah.t@college.edu").first()
    if not teacher:
        teacher = models.Teacher(
            name="Sarah Connor",
            email="sarah.t@college.edu",
            password=get_password_hash("Teacher@123"),
            department_id=dept.id
        )
        db.add(teacher)
    db.commit()

    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="function")
def client(db_session):
    """Provides a TestClient with the mocked database session."""
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
