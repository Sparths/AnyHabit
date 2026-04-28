# <img src="frontend/public/AnyHabit.png" width="45" height="45" valign="middle"> AnyHabit

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?style=flat-square&logo=sqlite)](https://www.sqlite.org/)
[![Docker](https://img.shields.io/badge/Deployment-Docker-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![Discord](https://img.shields.io/badge/Community-Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/ajknBq5zcH)
[![Live Demo](https://img.shields.io/badge/Demo-Live_Preview-FF4B4B?style=flat&logo=render)](https://sparths.github.io/anyhabit-demo/)

**AnyHabit** is a streamlined, universal habit-tracking dashboard designed for **Raspberry Pi**, home servers, and **Docker** enthusiasts. It provides a minimalist interface to track positive growth or systematically reduce harmful routines.

---

## 📺 Preview & Updates

> [!IMPORTANT]  
> **Try it now:** [Explore the Live Demo Site](https://sparths.github.io/anyhabit-demo/)  
> **Join the Community:** [AnyHabit Discord Server](https://discord.gg/ajknBq5zcH) — Get support, showcase your work, and chat with fellow devs!

![AnyHabit Demo](assets/demo.gif)

<details>
<summary><b>🚀 Click to see Recent Updates (Changelog)</b></summary>

#### [v0.6.2] - Latest Release
- **Added:** Historical Progress/Heatmap
- [Full Changelog](https://github.com/Sparths/AnyHabit/compare/v0.6.1...v0.6.2)

#### [v0.6.1] - Mobile Support
- **Added:** Better Mobile Layout
- [Full Changelog](https://github.com/Sparths/AnyHabit/compare/v0.6.0...v0.6.1)

#### [v0.6.0] - Relapse Feature
- **Added:** Add Relapse Feature that resets your Tracker without having to delete the whole tracker and loosing all Journal Entries
- **Fix:** Changed that Impact Units go up based on actual units logged.
- [Full Changelog](https://github.com/Sparths/AnyHabit/compare/v0.5.0...v0.6.0)
  
#### [v0.5.0] - Custom Impact Units
- **Added:** Support custom impact units!
- [Full Changelog](https://github.com/Sparths/AnyHabit/compare/v0.4.0...v0.5.0)

#### [v0.4.0] - Logic Update
- **Added:** New Tracker Type "Boolean"!
- [Full Changelog](https://github.com/Sparths/AnyHabit/compare/v0.3.1...v0.4.0)

#### [v0.3.1] - UI Enhancement
- **Added:** Fix Darkmode Colors
- [Full Changelog](https://github.com/Sparths/AnyHabit/compare/v0.3.0...v0.3.1)

#### [v0.3.0] - UX Enhancement
- **Added:** Category support for better tracker organization.
- [Full Changelog](https://github.com/Sparths/AnyHabit/compare/v0.2.0...v0.3.0)

#### [v0.2.0] - UI Enhancement
- **Added:** Full Dark Mode / Light Mode support.
- **Added:** Dedicated Settings window for better customization.
- [Full Changelog](https://github.com/Sparths/AnyHabit/compare/v0.1.1...v0.2.0)

#### [v0.1.1] - Small Fixes
- **Fixed:** Visual bug where an unnecessary 's' was appended to units.
- **Added:** Timestamps showing exactly when a tracker was created.

#### [v0.1.0] - Initial Release!
- Launch of AnyHabit: Dual tracking modes, financial impact calculation, daily journal, and one-command Docker deployment.
</details>

---

## ✨ Key Features

* **Dual Tracking Modes:** Monitor positive routines or reduce harmful ones.
* **Categories:** Organize your dashboard with custom categories.
* **Accounts & Groups:** Sign in with private accounts, then create family/friend groups for shared trackers.
* **Shared Trackers:** Assign multiple group members to one tracker and compare progress per participant.
* **Dual Streaks:** Track both individual streaks and a collective group streak for shared goals.
* **Dark Mode:** Seamlessly switch between Light and Dark themes.
* **Financial Impact:** Automatically calculate money saved by avoiding negative habits.
* **Daily Journal:** Log your mood and thoughts alongside your habits.
* **Self-Hosted & Private:** Complete control over your data with SQLite and Docker.

---

## 🚀 One-Command Quick Start

AnyHabit is designed to be "up and running" in seconds. You do **not** need Node.js or Python installed locally.

**Requirements:** [Docker](https://docs.docker.com/get-docker/) with the Compose plugin.

```bash
# 1. Clone the repository
git clone https://github.com/Sparths/AnyHabit.git
cd AnyHabit

# 2. Build and start everything
docker compose up -d --build
```

Open **http://localhost** (or your device's IP) in your browser.

> [!TIP]
> Your data is safely stored in a Docker volume (`db_data`) and will persist even if you stop or rebuild the containers.

---

## ⚙️ Configuration

| Variable | Description | Default |
| :--- | :--- | :--- |
| `APP_PORT` | The port on which the app is accessible | `80` |
| `VITE_API_URL` | Backend URL for local frontend development | `http://localhost/api` |
| `ANYHABIT_SECRET_KEY` | JWT signing secret for authentication | `change-me-in-production` |
| `ANYHABIT_CORS_ORIGINS` | Comma-separated allowlist of frontend origins | `http://localhost:5173,...` |
| `ANYHABIT_COOKIE_SECURE` | Marks auth cookie as secure-only | `true` |
| `ANYHABIT_COOKIE_SAMESITE` | SameSite policy for auth cookie | `lax` |
| `ANYHABIT_COOKIE_DOMAIN` | Optional domain scope for auth cookie | unset |
| `ANYHABIT_BOOTSTRAP_USERNAME` | Initial local login username | `owner` |
| `ANYHABIT_BOOTSTRAP_EMAIL` | Initial local login email | `owner@anyhabit.local` |
| `ANYHABIT_BOOTSTRAP_PASSWORD` | Initial local login password | `anyhabit` |

Frontend auth now uses HttpOnly cookies; API calls must include credentials.

**To change the port:**
1. Create an environment file: `cp .env.example .env`
2. Edit `.env` and change `APP_PORT=8080`
3. Restart: `docker compose up -d`

---

## � Backend API Documentation

AnyHabit provides a **complete REST API** that enables you to:
- ✅ **Build custom frontends** with any framework (React, Vue, Flutter, etc.)
- ✅ **Integrate with your own applications** 
- ✅ **Access all data programmatically** without the UI

### Quick Links

| Resource | Description |
|----------|-------------|
| **[📚 API Documentation](backend/README.md)** | Complete API reference with 25+ endpoints and examples |
| **[⚡ Quick Reference](backend/API_QUICK_REFERENCE.md)** | One-page API cheat sheet for quick lookup |
| **[🔧 Frontend Integration Guide](backend/FRONTEND_INTEGRATION.md)** | Guide for building custom frontends with the API |
| **[🗂️ Documentation Index](backend/INDEX.md)** | Main navigation hub for all backend docs |
| **[💻 Development Guide](backend/DEVELOPMENT.md)** | Backend development and contribution guide |

### Example: Use the API

```bash
# Get all trackers
curl http://localhost:8000/api/trackers/

# Get complete tracker data (with analytics, logs, journals)
curl http://localhost:8000/api/trackers/1/bundle

# View interactive API docs
# Open in browser: http://localhost:8000/docs
```

### Interactive API Documentation

FastAPI provides built-in interactive documentation:
- **[Swagger UI](http://localhost:8000/docs)** - Try endpoints live
- **[ReDoc](http://localhost:8000/redoc)** - Alternative documentation format

---

## �🛠️ Tech Stack

* **Backend:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12-slim)
* **Frontend:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
* **Proxy:** [Nginx](https://www.nginx.com/) as a Reverse Proxy & Static File Server

---

## 🤝 Community & Contributing

AnyHabit is an open-source, community-driven project! 

Join our **[Discord Server](https://discord.gg/ajknBq5zcH)** to:
* 🛠️ Get help with your setup or projects.
* 🚀 Showcase what you've built.
* 💬 Chat with other programmers and contributors.

**Other ways to help:**
* **💡 Ideas:** [Open a Feature Request](https://github.com/Sparths/AnyHabit/issues)
* **🐛 Bugs:** [Open a Bug Report](https://github.com/Sparths/AnyHabit/issues)
* **💻 Code:** Check our [Contributing Guidelines](CONTRIBUTING.md)

## ⭐ Star History

<a href="https://www.star-history.com/?repos=Sparths%2FAnyHabit&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=Sparths/AnyHabit&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=Sparths/AnyHabit&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=Sparths/AnyHabit&type=date&legend=top-left" />
 </picture>
</a>
