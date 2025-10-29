#!/bin/bash

# MonkeyTest Local Testing Script
# This script helps you test the Browser Use action locally before pushing to GitHub

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_info "Checking prerequisites..."

if ! command_exists python3; then
    print_error "Python 3 is not installed. Please install Python 3.11 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
print_success "Found Python $PYTHON_VERSION"

# Check if API key is set
if [ -z "$BROWSER_USE_API_KEY" ]; then
    print_error "BROWSER_USE_API_KEY environment variable is not set"
    print_info "Please set it with: export BROWSER_USE_API_KEY='your-api-key-here'"
    exit 1
fi
print_success "API key found"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

print_info "Project root: $PROJECT_ROOT"

# Check if action files exist
if [ ! -f "$PROJECT_ROOT/src/run_tests.py" ]; then
    print_error "Action files not found in $PROJECT_ROOT/src"
    exit 1
fi
print_success "Action files found"

# Set default test directory if not specified
TEST_DIRECTORY="${TEST_DIRECTORY:-tests/examples}"
print_info "Test directory: $TEST_DIRECTORY"

# Check if test directory exists
if [ ! -d "$PROJECT_ROOT/$TEST_DIRECTORY" ]; then
    print_error "Test directory '$TEST_DIRECTORY' not found"
    print_info "Please create test files or set TEST_DIRECTORY environment variable"
    exit 1
fi

# Count test files
TEST_COUNT=$(find "$PROJECT_ROOT/$TEST_DIRECTORY" -name "*.md" | wc -l)
print_success "Found $TEST_COUNT test file(s)"

if [ "$TEST_COUNT" -eq 0 ]; then
    print_warning "No test files (*.md) found in $TEST_DIRECTORY"
    exit 0
fi

# Check if virtual environment exists, create if not
VENV_DIR="$PROJECT_ROOT/venv"
if [ ! -d "$VENV_DIR" ]; then
    print_info "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
    print_success "Virtual environment created"
fi

# Activate virtual environment
print_info "Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Install dependencies
print_info "Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r "$PROJECT_ROOT/requirements.txt"
print_success "Dependencies installed"

# Set environment variables
export TEST_DIRECTORY="$TEST_DIRECTORY"
export LLM_MODEL="${LLM_MODEL:-browser-use-llm}"
export TIMEOUT="${TIMEOUT:-300}"
export FAIL_ON_ERROR="${FAIL_ON_ERROR:-false}"
export SAVE_OUTPUTS="${SAVE_OUTPUTS:-true}"

# Print configuration
echo ""
print_info "=== Configuration ==="
echo "  Test Directory: $TEST_DIRECTORY"
echo "  LLM Model: $LLM_MODEL"
echo "  Timeout: ${TIMEOUT}s"
echo "  Fail on Error: $FAIL_ON_ERROR"
echo "  Save Outputs: $SAVE_OUTPUTS"
echo ""

# Change to project root
cd "$PROJECT_ROOT"

# Run tests
print_info "Running tests..."
echo ""

python3 "$PROJECT_ROOT/src/run_tests.py"
EXIT_CODE=$?

echo ""

# Report results
if [ $EXIT_CODE -eq 0 ]; then
    print_success "All tests passed!"
elif [ $EXIT_CODE -eq 1 ]; then
    print_warning "Some tests failed"
else
    print_error "Error running tests"
fi

# Show artifacts location
if [ -f "test-results.json" ]; then
    print_info "Results saved to: test-results.json"
fi

if [ -d "browser-use-outputs" ]; then
    print_info "Output files saved to: browser-use-outputs/"
fi

echo ""
print_info "To view detailed results: cat test-results.json | python3 -m json.tool"

# Deactivate virtual environment
deactivate

exit $EXIT_CODE
