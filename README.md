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

#### [v0.5.0] - Latest Release
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
| `VITE_API_URL` | Backend URL (internal routing) | `http://localhost/api` |

**To change the port:**
1. Create an environment file: `cp .env.example .env`
2. Edit `.env` and change `APP_PORT=8080`
3. Restart: `docker compose up -d`

---

## 🛠️ Tech Stack

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
