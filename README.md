# AI Smart Attendance System using Face Recognition

A comprehensive full-stack and machine learning attendance management system powered by computer vision (Haar Cascade & LBPH Face Recognition) with a modern web dashboard and research documentation.

---

## 🚀 One-Click Railway Deployment

This repository is pre-configured for automatic deployment on [Railway](https://railway.app):

1. Go to [Railway](https://railway.app) and click **New Project** → **Deploy from GitHub repo**.
2. Select `monishmahesha2006/smart-attendence-system-`.
3. Railway will automatically detect `Dockerfile` & `railway.json`, build the React frontend, package the FastAPI backend and AI model, and provision a live URL.
4. Once deployed, click **Generate Domain** in the service settings to access your live application!

### Default Credentials
- **Super Admin**: `admin@college.edu`
- **Password**: `Admin@123`

---

## 📁 Repository Overview

- **`Dockerfile` & `railway.json`**: Unified full-stack deployment for cloud hosting.
- **`ai-attendance-system/`**: Complete application suite
  - **`frontend/`**: React, Vite, Tailwind CSS & Framer Motion modern UI dashboard
  - **`backend/`**: Python FastAPI REST API with SQLite/PostgreSQL support & JWT authentication
  - **`ai-model/`**: OpenCV facial detection, dataset pipelines, and LBPH model trainer
  - **`docker/`**: Containerization setup
- **Research Papers & Reference Materials**:
  - `Ojala_LBP_PAMI02.pdf`: Multiresolution Gray-Scale and Rotation Invariant Texture Classification with Local Binary Patterns
  - `viola-cvpr-01.pdf`: Rapid Object Detection using a Boosted Cascade of Simple Features (Viola-Jones)
  - `paper.docx` & `paper 2.docx`: Project research papers and documentation

---

## ✨ Features

- **Real-time Face Recognition**: Detect and identify students from a live camera feed.
- **Interactive Web Dashboard**: Student and Administrator management, live status, and attendance analytics.
- **Computer Vision Pipeline**: Dataset collection, preprocessing, Haar cascade face detection, and LBPH training.
- **Role-Based Authentication**: Secure JWT-based access for students and administrators.
- **Export & Analytics**: Visual attendance records and logs.
- **Production-Ready**: Dual API routing (`/` and `/api/`), SPA fallback, healthcheck (`/health`), and dynamic port binding.

---

## 🛠 Local Setup

Refer to [`ai-attendance-system/SETUP.md`](./ai-attendance-system/SETUP.md) and [`ai-attendance-system/README.md`](./ai-attendance-system/README.md) for detailed local environment setup and run configurations.
