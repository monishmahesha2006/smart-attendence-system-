from sqlalchemy import Column, Integer, String, Date, Time, DateTime, ForeignKey, Boolean, Float, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Department(Base):
    __tablename__ = "departments"
    id   = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    code = Column(String, unique=True)                             
    admins   = relationship("Admin",    back_populates="department")
    teachers = relationship("Teacher",  back_populates="department")
    sections = relationship("Section",  back_populates="department")
    subjects = relationship("Subject",  back_populates="department")

class Admin(Base):
    __tablename__ = "admins"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String)
    email         = Column(String, unique=True, index=True)
    password      = Column(String)
    role          = Column(String, default="super_admin")                            
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    department    = relationship("Department", back_populates="admins")

class Teacher(Base):
    __tablename__ = "teachers"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String)
    email         = Column(String, unique=True, index=True)
    password      = Column(String)
    department_id = Column(Integer, ForeignKey("departments.id"))
    department    = relationship("Department", back_populates="teachers")
    subjects      = relationship("Subject", back_populates="teacher")

class Section(Base):
    __tablename__ = "sections"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String)                 
    year          = Column(Integer)       
    department_id = Column(Integer, ForeignKey("departments.id"))
    department    = relationship("Department", back_populates="sections")
    students      = relationship("Student",        back_populates="section")
    cameras       = relationship("Camera",         back_populates="section")
    timetable     = relationship("TimetableSlot",  back_populates="section")

class Subject(Base):
    __tablename__ = "subjects"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String)
    code          = Column(String, unique=True)
    department_id = Column(Integer, ForeignKey("departments.id"))
    teacher_id    = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    section_id    = Column(Integer, ForeignKey("sections.id"), nullable=True)
    department    = relationship("Department", back_populates="subjects")
    teacher       = relationship("Teacher",    back_populates="subjects")
    section       = relationship("Section")
    timetable     = relationship("TimetableSlot", back_populates="subject")
    attendance    = relationship("PeriodAttendance", back_populates="subject")

class Camera(Base):
    __tablename__ = "cameras"
    id         = Column(Integer, primary_key=True, index=True)
    room_name  = Column(String)
    stream_url = Column(String, nullable=True)                         
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=True)
    active     = Column(Boolean, default=True)
    section    = relationship("Section", back_populates="cameras")

class TimetableSlot(Base):
    __tablename__ = "timetable_slots"
    id          = Column(Integer, primary_key=True, index=True)
    section_id  = Column(Integer, ForeignKey("sections.id"))
    subject_id  = Column(Integer, ForeignKey("subjects.id"))
    day_of_week = Column(Integer)                  
    period_no   = Column(Integer)        
    start_time  = Column(Time)
    end_time    = Column(Time)
    section     = relationship("Section",  back_populates="timetable")
    subject     = relationship("Subject",  back_populates="timetable")
    attendance  = relationship("PeriodAttendance", back_populates="slot")

class Student(Base):
    __tablename__ = "students"
    id           = Column(Integer, primary_key=True, index=True)
    student_name = Column(String, index=True)
    student_id   = Column(String, unique=True, index=True)                
    department   = Column(String)
    section_id   = Column(Integer, ForeignKey("sections.id"), nullable=True)
    image_path   = Column(String, nullable=True)
    section      = relationship("Section", back_populates="students")
    attendance   = relationship("PeriodAttendance", back_populates="student")

class PeriodAttendance(Base):
    __tablename__ = "period_attendance"
    __table_args__ = (
                                                                                               
                                                                                     
        __import__("sqlalchemy").UniqueConstraint("student_id", "date", "slot_id", name="uq_attendance_per_slot"),
    )
    id         = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    slot_id    = Column(Integer, ForeignKey("timetable_slots.id"), nullable=True)
    date       = Column(Date)
    time       = Column(Time)
    status     = Column(String, default="Present")                              
    timestamp  = Column(DateTime, default=datetime.utcnow)
    student    = relationship("Student",       back_populates="attendance")
    subject    = relationship("Subject",       back_populates="attendance")
    slot       = relationship("TimetableSlot", back_populates="attendance")
