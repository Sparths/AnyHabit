# Backend Documentation Index

Welcome to the AnyHabit Backend API documentation! Here's a guide to help you find what you need.

## 📚 Documentation Files

### I Just Want to Use the API

Start here if you're building a frontend or integrating with the API:

1. **[API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)** ⭐ START HERE
   - One-page cheat sheet
   - All endpoints at a glance
   - Common code examples
   - Response examples
   - Takes 5 minutes to read

2. **[README.md](./README.md)** - Full API Documentation
   - Comprehensive endpoint reference
   - Request/response formats
   - Data types and models
   - Error handling
   - Best practices
   - 30+ examples

### I'm Building a Frontend

If you're creating a frontend application:

1. **[FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)**
   - Complete integration guide
   - Setup API client module
   - React hooks examples
   - Building views (tracker, dashboard)
   - Error handling patterns
   - Performance tips
   - Multiple architecture patterns
   - Deployment checklist

2. **[API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)**
   - Quick lookup of all endpoints
   - Common patterns

### I Want to Develop the Backend

If you're contributing to the backend:

1. **[../TESTING.md](../TESTING.md)** - Testing Guide
   - Run tests: `pytest`
   - Test structure
   - How to add new tests
   - Coverage info

2. **Code files:**
   - [models.py](./models.py) - Database models
   - [schemas.py](./schemas.py) - Request/response schemas
   - [analytics.py](./analytics.py) - Computation logic
   - [routers/](./routers/) - API endpoints

---

## 🚀 Quick Start

### For Frontend Developers

```bash
# 1. Make sure backend is running
docker-compose up -d

# 2. Check it's working
curl http://localhost:8000/

# 3. View interactive docs
# Open in browser:
# Swagger UI: http://localhost:8000/docs
# ReDoc: http://localhost:8000/redoc

# 4. Read the quick reference
# See: API_QUICK_REFERENCE.md

# 5. Start building
# See: FRONTEND_INTEGRATION.md
```

### For Backend Developers

```bash
# Install dependencies
pip install -r requirements.txt

# Run tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Start development server
python -m uvicorn main:app --reload

# API documentation at:
# http://localhost:8000/docs
```

---

## 📖 Documentation Map

### By Use Case

| I want to... | Read this |
|--------------|-----------|
| Learn all endpoints quickly | [Quick Reference](./API_QUICK_REFERENCE.md) |
| Build a custom frontend | [Frontend Integration](./FRONTEND_INTEGRATION.md) |
| Integrate into an existing app | [Frontend Integration](./FRONTEND_INTEGRATION.md) |
| Look up endpoint details | [Full README](./README.md) |
| Add tests | [Testing Guide](../TESTING.md) |
| Contribute code | [Contributing Guide](../CONTRIBUTING.md) |
| Debug an issue | Search [Full README](./README.md) or GitHub Issues |

### By Endpoint Type

| Type | Location |
|------|----------|
| Trackers | All docs - Primary endpoints |
| Logs | All docs - Secondary endpoints |
| Journals | All docs - Secondary endpoints |
| Dashboard | [README.md](./README.md#dashboard) - Advanced |
| Analytics | [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) - For frontends |

---

## 💡 Common Questions

### Q: How do I create a tracker?
**A:** See [Quick Reference - Trackers](./API_QUICK_REFERENCE.md#essential-endpoints) or [Full Docs - Create Tracker](./README.md#create-tracker)

### Q: What's the correct date format?
**A:** ISO 8601: `2024-03-15T10:30:00` - See [Full Docs - Date Format](./README.md#date-format)

### Q: How do I build a tracker view?
**A:** Use the `/bundle` endpoint - See [Full Docs - Bundle](./README.md#get-tracker-with-complete-data) and [Frontend Integration](./FRONTEND_INTEGRATION.md#building-views)

### Q: How do I get the dashboard?
**A:** Use `/dashboard/summary` endpoint - See [Full Docs - Dashboard](./README.md#dashboard) or [Quick Reference](./API_QUICK_REFERENCE.md#dashboard)

### Q: How do I log activity?
**A:** POST to `/logs` endpoint with timestamp - See [Quick Reference - Logs](./API_QUICK_REFERENCE.md#logs) or [Full Docs](./README.md#logs)

### Q: Can I use this API for my own frontend?
**A:** Yes! See [Frontend Integration Guide](./FRONTEND_INTEGRATION.md)

### Q: How do I run tests?
**A:** See [Testing Guide](../TESTING.md) - Quick command: `pytest`

### Q: What frameworks can I use?
**A:** Any framework (React, Vue, Svelte, vanilla JS, Flutter, mobile apps, etc.) - It's just HTTP!

---

## 🔗 Related Documentation

- **[Main Project README](../README.md)** - Project overview
- **[Testing Guide](../TESTING.md)** - How to run tests
- **[Contributing Guidelines](../CONTRIBUTING.md)** - How to contribute
- **[GitHub Issues](https://github.com/Sparths/AnyHabit/issues)** - Report bugs
- **[Discord Community](https://discord.gg/ajknBq5zcH)** - Get help

---

## 📊 API Statistics

- **Total Endpoints:** 25+
- **Trackers:** 8 endpoints
- **Logs:** 3 endpoints
- **Journals:** 4 endpoints
- **Dashboard:** 4 endpoints
- **Response Types:** 15+ schemas
- **Status Codes:** 4 main codes (200, 400, 404, 500)

---

## 🎯 Recommended Reading Order

### If you're new to the API
1. [Quick Reference](./API_QUICK_REFERENCE.md) (5 min)
2. [Full README - Getting Started](./README.md#getting-started) (10 min)
3. [Quick Reference - Examples](./API_QUICK_REFERENCE.md#example-1-create-a-build-tracker) (5 min)

### If you're building a frontend
1. [Quick Reference](./API_QUICK_REFERENCE.md) (5 min)
2. [Frontend Integration - Setup](./FRONTEND_INTEGRATION.md#basic-setup) (15 min)
3. [Frontend Integration - Building Views](./FRONTEND_INTEGRATION.md#building-views) (20 min)
4. [Full README - Examples](./README.md#examples) (10 min)

### If you're contributing code
1. [Testing Guide](../TESTING.md)
2. [Full README](./README.md) - Understand all endpoints
3. Browse [routers/](./routers/) directory
4. Check [models.py](./models.py) and [schemas.py](./schemas.py)

---

## 🚨 Troubleshooting

### API not responding
```bash
# Make sure backend is running
docker-compose up -d

# Check health
curl http://localhost:8000/
```

### Wrong date format
```javascript
// ✓ Correct
new Date().toISOString()  // "2024-03-15T10:30:00.000Z"

// ✗ Wrong
"03/15/2024"              // American format
"15 Mar 2024"             // Text format
```

### Tracker not found
```bash
# List all trackers
curl http://localhost:8000/api/trackers/

# The ID might be different than expected
```

### Invalid timestamp
```bash
# Always include timestamp as query parameter
POST /api/trackers/1/logs?timestamp=2024-03-15T10:30:00
```

---

## 📞 Need Help?

- 📖 **Documentation:** You're reading it!
- 💬 **Community:** [Join Discord](https://discord.gg/ajknBq5zcH)
- 🐛 **Report Issue:** [GitHub Issues](https://github.com/Sparths/AnyHabit/issues)
- 💻 **View Code:** [GitHub Repository](https://github.com/Sparths/AnyHabit)

---

**Last Updated:** March 2024  
**Backend Version:** 1.0  
**API Version:** 1.0
