# Getting Started with MonkeyTest

A step-by-step guide to get you up and running with AI-powered browser testing using MonkeyTest and Browser Use. MonkeyTest runs in a Docker container for consistent, isolated execution.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Creating Your First Test](#creating-your-first-test)
4. [Running Tests Locally](#running-tests-locally)
5. [Setting Up GitHub Actions](#setting-up-github-actions)
6. [Understanding Test Results](#understanding-test-results)
7. [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, make sure you have:

- A GitHub repository (or create a new one)
- A Browser Use Cloud account (sign up at https://cloud.browser-use.com)
- Basic understanding of GitHub Actions
- Familiarity with markdown syntax

## Initial Setup

### Step 1: Get Your Browser Use API Key

1. Go to [Browser Use Cloud](https://cloud.browser-use.com)
2. Sign up for an account (free tier available)
3. Navigate to your dashboard
4. Click on "API Keys" or "Settings"
5. Generate a new API key
6. **Copy and save it securely** - you'll need it in the next steps

### Step 2: Add API Key to GitHub Secrets

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter:
   - **Name**: `BROWSER_USE_API_KEY`
   - **Value**: Paste your API key from Step 1
5. Click **Add secret**

### Step 3: Add MonkeyTest to Your Repository

**Option A: Reference the Action (Recommended)**

Reference the action directly in your workflow:
```yaml
uses: yourusername/monkeytest@v1
```

**Option B: Fork and Customize**

1. Fork the MonkeyTest repository
2. Customize the action as needed
3. Reference your fork:
```yaml
uses: your-username/monkeytest@main
```

**Option C: Copy as Local Action (Development)**

1. Copy the action files to your repository root or subdirectory
2. Reference it as a local action:
```yaml
uses: ./  # If action.yml is at repository root
# or
uses: ./.github/actions/browser-use-test  # If in subdirectory
```

## Creating Your First Test

### Step 1: Create Test Directory

Create a `tests` directory in your repository root:

```bash
mkdir -p tests
```

### Step 2: Write Your First Test

Create a file `tests/my-first-test.md`:

```markdown
---
name: "My First Browser Test"
description: "Verify that Example.com loads correctly"
timeout: 60
---

# Task

Navigate to https://example.com and verify the following:

1. The page loads successfully
2. The page title contains "Example Domain"
3. There is a heading that says "Example Domain"

Return "PASS" if all checks succeed, otherwise return "FAIL" with details of what went wrong.
```

### Step 3: Understand the Test Structure

Every test has two parts:

**Frontmatter (YAML)**:
```yaml
---
name: "Test Name"          # Required: Display name
description: "..."          # Optional: What the test does
timeout: 60                 # Optional: Max time in seconds
llm_model: "browser-use-llm"  # Optional: Which AI model to use
---
```

**Task Instructions (Markdown)**:
```markdown
# Task

Clear, step-by-step instructions for the AI agent.
Be specific about what to do and what to return.
```

## Running Tests Locally

### Option 1: Build and Run Docker Container (Recommended)

Build the action's Docker image:

```bash
# From repository root
docker build -t browser-use-test .
```

Run tests with the container:

```bash
docker run --rm \
  -e BROWSER_USE_API_KEY="your-api-key-here" \
  -e TEST_DIRECTORY="tests" \
  -e LLM_MODEL="browser-use-llm" \
  -e TIMEOUT="300" \
  -v $(pwd):/github/workspace \
  -w /github/workspace \
  browser-use-test
```

The Docker container provides the same environment as GitHub Actions, ensuring consistency.

### Option 2: Using Local Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  test-runner:
    build: .
    volumes:
      - .:/github/workspace
    working_dir: /github/workspace
    environment:
      - BROWSER_USE_API_KEY=${BROWSER_USE_API_KEY}
      - TEST_DIRECTORY=tests
      - LLM_MODEL=browser-use-llm
      - TIMEOUT=300
```

Run tests:
```bash
export BROWSER_USE_API_KEY="your-api-key-here"
docker-compose run test-runner
```

### Option 3: Direct Python Execution (Without Docker)

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export BROWSER_USE_API_KEY="your-api-key-here"
export TEST_DIRECTORY="tests"
export LLM_MODEL="browser-use-llm"
export TIMEOUT="300"

# Run tests
python src/run_tests.py
```

## Setting Up GitHub Actions

### Step 1: Create Workflow File

Create `.github/workflows/browser-tests.yml`:

```yaml
name: Browser Tests

on:
  push:
    branches: [main, develop]
  pull_request:
  workflow_dispatch:  # Allows manual triggering

jobs:
  test:
    name: Run Browser Tests
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Browser Use Tests
        id: tests
        uses: yourusername/monkeytest@v1  # Or ./  for local testing
        with:
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          test-directory: tests
          llm-model: browser-use-llm
          timeout: 300
          fail-on-error: true
      
      - name: Upload Test Artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            test-results.json
            browser-use-outputs/
      
      - name: Show Results
        if: always()
        run: |
          echo "Total: ${{ steps.tests.outputs.total-tests }}"
          echo "Passed: ${{ steps.tests.outputs.passed-tests }}"
          echo "Failed: ${{ steps.tests.outputs.failed-tests }}"
```

### Step 2: Commit and Push

```bash
git add .github/workflows/browser-tests.yml
git commit -m "Add browser test workflow"
git push
```

### Step 3: Verify Workflow Runs

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. You should see your workflow running
4. Click on it to see detailed logs

## Understanding Test Results

### Console Output

When tests run, you'll see output like:

```
🚀 Browser Use Test Runner
================================================================================

🔧 Initializing Browser Use client...
✅ Browser Use client initialized successfully
📁 Found 1 test file(s) in 'tests'

🎯 Starting test execution...
⚙️  LLM Model: browser-use-llm
⏱️  Timeout: 300s per test
💾 Save outputs: true

================================================================================
🧪 Running test: My First Browser Test
📄 File: tests/my-first-test.md
📝 Description: Verify that Example.com loads correctly
================================================================================
🚀 Creating Browser Use task...
📋 Task instructions: Navigate to https://example.com and verify...
✅ Task created: task_abc123
⏳ Waiting for task completion (timeout: 60s)...
📊 Status: started
📊 Status: finished
✅ Test PASSED in 12.45s
📤 Output: PASS

================================================================================
📊 TEST SUMMARY
================================================================================
Total Tests:    1
✅ Passed:      1
❌ Failed:      0
⚠️  Errors:      0
Success Rate:   100.0%
================================================================================

📋 Individual Test Results:
  ✅ My First Browser Test (12.45s)

💾 Results saved to: test-results.json
✅ All tests passed!
```

### JSON Results File

The `test-results.json` file contains detailed information:

```json
{
  "summary": {
    "total": 1,
    "passed": 1,
    "failed": 0,
    "errors": 0,
    "success_rate": "100.0%"
  },
  "results": [
    {
      "name": "My First Browser Test",
      "file_path": "tests/my-first-test.md",
      "status": "passed",
      "output": "PASS",
      "error": null,
      "duration": 12.45,
      "task_id": "task_abc123",
      "output_files": []
    }
  ]
}
```

### Artifacts

After the workflow completes, check the **Artifacts** section at the bottom of the workflow run page to download:

- `test-results.json` - Detailed results
- `browser-use-outputs/` - Screenshots and other generated files

## Next Steps

### Level Up Your Testing

1. **Write More Complex Tests**
   - See [examples](tests/examples/) for inspiration
   - Read the [full documentation](.github/actions/browser-use-test/README.md)

2. **Test Multiple Pages**
   - Create separate test files for different features
   - Organize tests in subdirectories

3. **Add Data Extraction Tests**
   - Extract structured data from websites
   - Verify API responses through browser interactions

4. **Set Up Scheduled Tests**
   - Add cron schedules for regular monitoring
   - Create separate workflows for different test suites

### Example: Scheduled Daily Monitoring

Add to your workflow:

```yaml
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM daily
```

### Example: Test Organization

```
tests/
├── smoke/           # Quick critical path tests
│   └── homepage.md
├── features/        # Feature-specific tests
│   ├── login.md
│   ├── search.md
│   └── checkout.md
└── monitoring/      # Production monitoring
    ├── uptime.md
    └── critical-flows.md
```

### Tips for Success

1. **Start Simple**: Begin with basic page load tests before complex scenarios
2. **Be Specific**: Clear instructions = better results
3. **Set Reasonable Timeouts**: Give tasks enough time to complete
4. **Test Incrementally**: Add one test at a time and verify it works
5. **Monitor Costs**: Check your Browser Use usage dashboard regularly
6. **Use Descriptive Names**: Make test names clear and searchable

### Common Use Cases

- **E2E Testing**: Complete user flows from start to finish
- **Smoke Tests**: Quick checks after deployments
- **Regression Tests**: Verify bug fixes stay fixed
- **Data Validation**: Ensure scraped data is accurate
- **Monitoring**: Regular checks on production sites
- **Form Testing**: Validate form validation and submission
- **Authentication Flows**: Test login/logout/signup processes

### Getting Help

- 📖 [Full Documentation](.github/actions/browser-use-test/README.md)
- 🌐 [Browser Use Docs](https://docs.cloud.browser-use.com)
- 💬 [GitHub Discussions](https://github.com/yourusername/monkeytest/discussions)
- 🐛 [Report Issues](https://github.com/yourusername/monkeytest/issues)

---

## Quick Reference

### Minimal Test Template

```markdown
---
name: "Test Name"
---

# Task

What the AI agent should do.
```

### Full Test Template

```markdown
---
name: "Descriptive Test Name"
description: "What this test validates"
timeout: 120
llm_model: "browser-use-llm"
---

# Task

1. Step-by-step instructions
2. Be clear and specific
3. Include URLs
4. Specify expected output format

Return structured results (JSON, text, etc.)

# Expected Output

Optional: Document what the output should look like
```

### Minimal Workflow

```yaml
name: Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: yourusername/monkeytest@v1
        with:
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          test-directory: tests
```

---

## Docker Container Details

MonkeyTest runs in a Docker container with:
- **Base Image**: Python 3.11 slim
- **Pre-installed**: Browser Use SDK and all dependencies
- **Benefits**: Consistent environment, no local setup required
- **GitHub Actions**: Container is built automatically on each run

### Why Docker?

- ✅ **Consistency**: Same environment locally and in CI/CD
- ✅ **Isolation**: No conflicts with other tools
- ✅ **Portability**: Works anywhere Docker runs
- ✅ **Fast**: Layer caching speeds up builds

---

**You're all set!** 🎉 Start writing tests and let AI handle the browser automation.

Happy Testing! 🐵🧪