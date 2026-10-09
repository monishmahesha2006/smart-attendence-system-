from sqlalchemy import Column, Integer, String, Date, Time, DateTime, ForeignKey, Boolean, Float, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Department(Base):
    __tablename__ = "departments"
    id   = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    code = Column(String, unique=True, index=True)
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
    role          = Column(String, default="super_admin", index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True, index=True)
    department    = relationship("Department", back_populates="admins")

class Teacher(Base):
    __tablename__ = "teachers"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String)
    email         = Column(String, unique=True, index=True)
    password      = Column(String)
    department_id = Column(Integer, ForeignKey("departments.id"), index=True)
    department    = relationship("Department", back_populates="teachers")
    subjects      = relationship("Subject", back_populates="teacher")

class Section(Base):
    __tablename__ = "sections"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String, index=True)
    year          = Column(Integer, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), index=True)
    department    = relationship("Department", back_populates="sections")
    students      = relationship("Student",        back_populates="section")
    cameras       = relationship("Camera",         back_populates="section")
    timetable     = relationship("TimetableSlot",  back_populates="section")

class Subject(Base):
    __tablename__ = "subjects"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String)
    code          = Column(String, unique=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), index=True)
    teacher_id    = Column(Integer, ForeignKey("teachers.id"), nullable=True, index=True)
    section_id    = Column(Integer, ForeignKey("sections.id"), nullable=True, index=True)
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
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=True, index=True)
    active     = Column(Boolean, default=True, index=True)
    section    = relationship("Section", back_populates="cameras")

class TimetableSlot(Base):
    __tablename__ = "timetable_slots"
    id          = Column(Integer, primary_key=True, index=True)
    section_id  = Column(Integer, ForeignKey("sections.id"), index=True)
    subject_id  = Column(Integer, ForeignKey("subjects.id"), index=True)
    day_of_week = Column(Integer, index=True)
    period_no   = Column(Integer, index=True)
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
    department   = Column(String, index=True)
    section_id   = Column(Integer, ForeignKey("sections.id"), nullable=True, index=True)
    image_path   = Column(String, nullable=True)
    section      = relationship("Section", back_populates="students")
    attendance   = relationship("PeriodAttendance", back_populates="student")

class PeriodAttendance(Base):
    __tablename__ = "period_attendance"
    __table_args__ = (
        UniqueConstraint("student_id", "date", "slot_id", name="uq_attendance_per_slot"),
    )
    id         = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True, index=True)
    slot_id    = Column(Integer, ForeignKey("timetable_slots.id"), nullable=True, index=True)
    date       = Column(Date, index=True)
    time       = Column(Time)
    status     = Column(String, default="Present", index=True)
    timestamp  = Column(DateTime, default=datetime.utcnow, index=True)
    student    = relationship("Student",       back_populates="attendance")
    subject    = relationship("Subject",       back_populates="attendance")
    slot       = relationship("TimetableSlot", back_populates="attendance")
