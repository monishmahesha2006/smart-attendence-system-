from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import date, time, datetime

                                                                                
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role:  Optional[str] = None

                                                                                
class DepartmentCreate(BaseModel):
    name: str
    code: str

class DepartmentResponse(DepartmentCreate):
    id: int
    class Config:
        from_attributes = True

                                                                                
class AdminCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "super_admin"
    department_id: Optional[int] = None

class AdminResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    class Config:
        from_attributes = True

                                                                                
class TeacherCreate(BaseModel):
    name: str
    email: str
    password: str
    department_id: int

class TeacherResponse(BaseModel):
    id: int
    name: str
    email: str
    department_id: int
    class Config:
        from_attributes = True

                                                                                
class SectionCreate(BaseModel):
    name: str
    year: int
    department_id: int

class SectionResponse(SectionCreate):
    id: int
    class Config:
        from_attributes = True

                                                                                
class SubjectCreate(BaseModel):
    name: str
    code: str
    department_id: int
    teacher_id:  Optional[int] = None
    section_id:  Optional[int] = None

class SubjectResponse(SubjectCreate):
    id: int
    class Config:
        from_attributes = True

                                                                                
class CameraCreate(BaseModel):
    room_name: str
    stream_url: Optional[str] = None
    section_id: Optional[int] = None
    active: bool = True

class CameraResponse(CameraCreate):
    id: int
    class Config:
        from_attributes = True

                                                                                
class TimetableSlotCreate(BaseModel):
    section_id:  int
    subject_id:  int
    day_of_week: int                  
    period_no:   int        
    start_time:  time
    end_time:    time

class TimetableSlotResponse(TimetableSlotCreate):
    id: int
    class Config:
        from_attributes = True

                                                                                
class StudentCreate(BaseModel):
    student_name: str
    student_id:   str
    department:   str
    section_id:   Optional[int] = None

class StudentResponse(StudentCreate):
    id: int
    image_path: Optional[str] = None
    class Config:
        from_attributes = True

                                                                                
class PeriodAttendanceCreate(BaseModel):
    student_id: int
    subject_id: Optional[int] = None
    slot_id:    Optional[int] = None
    date:       date
    time:       time
    status:     str = "Present"

class PeriodAttendanceResponse(BaseModel):
    id:         int
    student_id: int
    subject_id: Optional[int]
    slot_id:    Optional[int]
    date:       date
    time:       time
    status:     str
    student:    StudentResponse
    class Config:
        from_attributes = True

                                                                                
class StudentAttendanceSummary(BaseModel):
    student_id:   int
    student_name: str
    roll_no:      str
    section:      Optional[str]
    total_classes: int
    attended:     int
    percentage:   float
    at_risk:      bool
