#!/bin/bash

# AnyHabit Test Runner
# This script runs all tests for the project

set -e

echo "🧪 AnyHabit Test Suite"
echo "======================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
TEST_TYPE=${1:-all}
COVERAGE=${2:-}

# Backend tests
run_backend_tests() {
    echo -e "\n${BLUE}Running Backend Tests...${NC}"
    cd backend
    
    if [ "$COVERAGE" = "--coverage" ]; then
        pytest tests/ -v --cov=. --cov-report=html --cov-report=term
    else
        pytest tests/ -v
    fi
    
    cd ..
}

# Frontend tests
run_frontend_tests() {
    echo -e "\n${BLUE}Running Frontend Tests...${NC}"
    cd frontend
    
    if [ "$COVERAGE" = "--coverage" ]; then
        npm test -- --run --coverage
    else
        npm test -- --run
    fi
    
    cd ..
}

# Run specific test file
run_specific_test() {
    local test_file=$1
    
    if [[ $test_file == backend/* ]]; then
        cd backend
        pytest "$test_file" -v
        cd ..
    elif [[ $test_file == frontend/* ]]; then
        cd frontend
        npm test -- "$test_file"
        cd ..
    else
        echo "Unknown test path: $test_file"
        exit 1
    fi
}

# Main execution
case $TEST_TYPE in
    backend)
        run_backend_tests
        ;;
    frontend)
        run_frontend_tests
        ;;
    all)
        run_backend_tests
        run_frontend_tests
        ;;
    *)
        if [ -f "$TEST_TYPE" ]; then
            run_specific_test "$TEST_TYPE"
        else
            echo "Usage: ./run-tests.sh [backend|frontend|all|<test-file>] [--coverage]"
            echo ""
            echo "Examples:"
            echo "  ./run-tests.sh                           # Run all tests"
            echo "  ./run-tests.sh backend                   # Run backend tests only"
            echo "  ./run-tests.sh frontend                  # Run frontend tests only"
            echo "  ./run-tests.sh all --coverage            # Run all tests with coverage"
            echo "  ./run-tests.sh backend/tests/test_analytics.py  # Run specific backend test"
            exit 1
        fi
        ;;
esac

echo -e "\n${GREEN}✅ Tests completed!${NC}"
