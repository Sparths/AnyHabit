# <img src="frontend/public/AnyHabit.png" width="45" height="45" valign="middle"> AnyHabit

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?style=flat-square&logo=sqlite)](https://www.sqlite.org/)

**AnyHabit** is a streamlined, universal habit-tracking dashboard designed for **Raspberry Pi**, home servers, and **Docker** enthusiasts. It provides a minimalist interface to track positive growth or systematically reduce harmful routines.

---

## 📺 Preview

![AnyHabit Demo](assets/demo.gif)

*Watch how AnyHabit tracks your progress and savings in real-time.*

---

## 🚀 One-Command Quick Start

AnyHabit is designed to be "up and running" in seconds. You do **not** need Node.js or Python installed locally.

**Requirements:** [Docker](https://docs.docker.com/get-docker/) with the Compose plugin.

```bash
# 1. Clone the repository
git clone [https://github.com/Sparths/AnyHabit.git](https://github.com/Sparths/AnyHabit.git)
cd AnyHabit

# 2. Build and start everything
docker compose up -d --build
```

Open **http://localhost** (or your device's IP) in your browser.

> [!TIP]
> Your data is safely stored in a Docker volume (`db_data`) and will persist even if you stop or rebuild the containers.

---

## ⚙️ Configuration (Optional)

By default, AnyHabit runs on **port 80**. If you need to change this (e.g., to run alongside other services on a Raspberry Pi), follow these steps:

1. Create an environment file: `cp .env.example .env`
2. Edit `.env` and change `APP_PORT=8080`
3. Restart with: `docker compose up -d`

---

## 🛠️ Architecture

AnyHabit uses a modern, high-performance stack:

* **Backend:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12-slim).
* **Frontend:** [React 19](https://react.dev/) served via [Nginx](https://www.nginx.com/).
* **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) for a lightweight, modern UI.
* **Database:** [SQLite](https://www.sqlite.org/) for zero-config persistence.
* **Reverse Proxy:** Integrated Nginx configuration to route API requests seamlessly.

---

## 👨‍💻 Local Development

If you wish to modify the code and run it without Docker:

### Backend
```bash
pip install -r backend/requirements.txt
mkdir -p backend/data
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```
*Note: Make sure to install dependencies from `backend/requirements.txt`.*

### Frontend
```bash
cd frontend
npm install
# Set API URL to point to your local backend
VITE_API_URL=http://localhost:8000 npm run dev
```
*Note: The frontend uses Vite for a fast development experience.*
