#!/bin/sh
set -e

echo "Starting AI Smart Attendance System..."

# Run database setup & college seed if not already initialized
python -c "
import models, database
models.Base.metadata.create_all(bind=database.engine)
db = database.SessionLocal()
try:
    if not db.query(models.Admin).first():
        print('Fresh database detected. Seeding initial accounts...')
        import seed_college
    else:
        print('Database already contains admin records.')
except Exception as e:
    print('Seed warning:', e)
finally:
    db.close()
"

# Railway automatically assigns a PORT environment variable
SERVER_PORT="${PORT:-8000}"
echo "Server binding to 0.0.0.0:${SERVER_PORT}..."

exec uvicorn main:app --host 0.0.0.0 --port "${SERVER_PORT}"
