from database import SessionLocal, engine
import models
from core.auth import get_password_hash

models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

existing_admin = db.query(models.Admin).filter(models.Admin.email == "admin@example.com").first()

if not existing_admin:
    hashed_pass = get_password_hash("password")
    new_admin = models.Admin(name="Super Admin", email="admin@example.com", password=hashed_pass)
    db.add(new_admin)
    db.commit()
    print("Admin created successfully: admin@example.com / password")
else:
    print("Admin already exists")

db.close()
