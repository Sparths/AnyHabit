# Pytest markers

pytest_plugins = []

def pytest_configure(config):
    config.addinivalue_line(
        "markers", "unit: mark test as a unit test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )
    config.addinivalue_line(
        "markers", "analytics: mark test as testing analytics"
    )
    config.addinivalue_line(
        "markers", "endpoints: mark test as testing endpoints"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
