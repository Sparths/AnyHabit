# Testing Guide

This document explains how to run tests for the AnyHabit project.

## Backend Tests

### Setup

Install testing dependencies:
```bash
cd backend
pip install -r requirements.txt
```

### Running Tests

Run all tests:
```bash
pytest
```

Run specific test file:
```bash
pytest backend/tests/test_analytics.py
pytest backend/tests/test_endpoints.py
```

Run with verbose output:
```bash
pytest -v
```

Run with coverage report:
```bash
pytest --cov=backend --cov-report=html
```

### Test Structure

- **`test_analytics.py`** - Tests for analytics calculations
  - Date utility functions (period_start, add_period, shift_period, etc.)
  - Tracker analytics building
  - Edge cases and None value handling

- **`test_endpoints.py`** - Tests for API endpoints
  - Tracker CRUD operations
  - Analytics endpoint (`GET /trackers/{id}/analytics`)
  - Bundle endpoint (`GET /trackers/{id}/bundle`)
  - Dashboard summary endpoint (`GET /dashboard/summary`)
  - Logs and journals endpoints

### Fixtures

Common fixtures available in `conftest.py`:
- `client` - FastAPI TestClient
- `db_session` - Test database session
- `sample_tracker` - Pre-created build tracker
- `sample_quit_tracker` - Pre-created quit tracker
- `sample_logs` - Pre-created habit logs
- `sample_journals` - Pre-created journal entries
- `simple_namespace_tracker` - SimpleNamespace tracker for unit tests

## Frontend Tests

### Setup

Install testing dependencies:
```bash
cd frontend
npm install
```

### Running Tests

Run all tests:
```bash
npm test
```

Run with watch mode:
```bash
npm test -- --watch
```

Run with UI:
```bash
npm run test:ui
```

Run coverage:
```bash
npm run test:coverage
```

Run specific test file:
```bash
npm test -- src/tests/services.test.js
npm test -- src/tests/hooks.test.js
npm test -- src/tests/components.test.js
```

### Test Structure

- **`services.test.js`** - Tests for API service functions
  - API response normalization (snake_case to camelCase)
  - Tracker analytics fetching
  - Dashboard summary fetching
  - Error handling

- **`hooks.test.js`** - Tests for custom React hooks
  - useTrackerAnalytics - Fetching and caching analytics
  - useOutsideClick - Click detection
  - useTheme - Theme toggling

- **`components.test.js`** - Tests for React components
  - Individual component rendering
  - Component interactions
  - Props handling
  - Modal open/close behavior

### Test Utilities

Common utilities available in `test-utils.js`:
- `renderWithProviders` - Render components with necessary providers
- `mockTracker` - Sample tracker object
- `mockAnalytics` - Sample analytics data
- `mockDashboardSummary` - Sample dashboard data
- `mockLogs` - Sample habit logs
- `mockJournals` - Sample journal entries

## CI/CD Integration

To run all tests in CI/CD pipeline:

```bash
# Backend
cd backend
pip install -r requirements.txt
pytest --cov=backend

# Frontend
cd frontend
npm install
npm test
npm run test:coverage
```

## Writing New Tests

### Backend Test Example

```python
def test_new_feature(client, sample_tracker):
    """Test description"""
    response = client.get(f"/trackers/{sample_tracker.id}/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == sample_tracker.name
```

### Frontend Test Example

```javascript
it('should do something', async () => {
  const { container } = render(
    <MyComponent prop="value" />
  );
  
  expect(container).toBeDefined();
  // Add more assertions
});
```

## Debugging Tests

### Backend
```bash
# Run with debugging
pytest -vv -s
pytest --pdb  # Drop into debugger on failure
```

### Frontend
```bash
# Run with logging
npm test -- --reporter=verbose

# Debug in browser
npm run test:ui
```

## Best Practices

1. **Keep tests focused** - One assertion per test when possible
2. **Use fixtures** - Reuse test data through fixtures
3. **Mock external calls** - Mock API calls, don't make real requests
4. **Test edge cases** - Include tests for None/empty/invalid values
5. **Descriptive names** - Use clear, descriptive test names
6. **Isolation** - Tests should not depend on each other
7. **Coverage** - Aim for 80%+ code coverage

## Troubleshooting

### Backend Issues

**ImportError when running tests:**
- Ensure you're running pytest from the project root
- Check that all dependencies are installed

**Database lock errors:**
- Tests use in-memory SQLite, shouldn't have lock issues
- If persists, clear any temporary test databases

### Frontend Issues

**Module not found errors:**
- Run `npm install` to ensure dependencies are installed
- Check that import paths are correct

**Tests timing out:**
- Increase timeout in vitest.config.js
- Check for unresolved promises in async tests

**Mock not working:**
- Ensure vi.mock() is called before import
- Check that global.fetch is properly reset between tests

## Test Coverage Targets

- **Backend:** 80%+ coverage
- **Frontend:** 70%+ coverage for components and hooks

Generate coverage reports:
```bash
# Backend
pytest --cov=backend --cov-report=html
# Open htmlcov/index.html

# Frontend
npm run test:coverage
# Open coverage/index.html
```
