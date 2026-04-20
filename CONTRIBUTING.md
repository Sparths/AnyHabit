# Contributing to AnyHabit

First off, thank you for considering contributing to AnyHabit! It's people like you that make open-source software such a great community. 

There are many ways to contribute, from writing tutorials or improving the documentation, to submitting bug reports and feature requests, or writing code.

## 🐛 Found a Bug or Have a Feature Request?

If you find a bug or have an idea for a new feature, please **open an issue** first to discuss it before you spend time writing code. 
* Check the existing issues to make sure it hasn't already been reported or requested.
* Provide as much context as possible (OS, browser, Docker version, steps to reproduce).

## 💻 Local Development Setup

If you want to contribute code, you'll need to set up the project locally. You can use Docker for the easiest setup, or run the frontend and backend separately.

### Option 1: Using Docker (Recommended)
1. Fork the repository and clone your fork:
   `git clone https://github.com/YOUR-USERNAME/AnyHabit.git`
2. Navigate to the directory: `cd AnyHabit`
3. Build and start the containers: `docker compose up -d --build`
4. The app will be available at `http://localhost`.

### Option 2: Without Docker
**Backend (FastAPI):**
1. `cd backend`
2. `pip install -r requirements.txt`
3. `mkdir -p data`
4. `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

**Frontend (React + Vite):**
1. `cd frontend`
2. `npm install`
3. `VITE_API_URL=http://localhost:8000 npm run dev`

## 🛠️ Making Changes & Pull Requests

1. **Create a branch** for your feature or bug fix:
   `git checkout -b feature/your-feature-name` or `git checkout -b fix/your-bug-fix`
2. **Make your changes**. Keep your commits small and descriptive.
3. **Check your code**:
   * For the frontend, ensure there are no linting errors by running `npm run lint`.
4. **Push your branch** to your fork:
   `git push origin your-branch-name`
5. **Open a Pull Request (PR)** against the `main` branch of the original AnyHabit repository.
6. Await review! We will try to review your PR as quickly as possible.

## 📝 Coding Guidelines
* **Frontend**: We use React 19, Tailwind CSS 4, and Lucide React for icons. Please stick to functional components and hooks.
* **Backend**: We use FastAPI and SQLAlchemy. Ensure type hints are used where applicable.

Thank you for helping make AnyHabit better!
