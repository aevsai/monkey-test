# MonkeyTest 🐵🧪

AI-powered browser testing with Browser Use - A reusable Docker-based GitHub Action for natural language browser automation.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
[![GitHub Actions](https://img.shields.io/badge/GitHub-Actions-2088FF?logo=github-actions)](https://github.com/features/actions)

## Overview

MonkeyTest provides a simple, reusable GitHub Action that lets you write browser tests in plain English using markdown files. Powered by [Browser Use](https://browser-use.com) AI agents, your tests are executed automatically in a Docker container with no need to write complex Selenium or Playwright scripts.

**This action is located at the repository root**, making it easy to reference directly in your workflows:

```yaml
- uses: yourusername/monkeytest@v1
  with:
    api-key: ${{ secrets.BROWSER_USE_API_KEY }}
    test-directory: tests
```

## Features

- 🐳 **Docker Container**: Self-contained, consistent execution environment
- 🤖 **AI-Powered**: Write tests in natural language, let AI handle the browser automation
- 📝 **Markdown Tests**: Simple, readable test cases in markdown format
- 🔄 **Reusable Action**: Easy to integrate into any GitHub workflow
- 📊 **Rich Reports**: Detailed JSON results with test outcomes and artifacts
- 💾 **Artifacts**: Capture screenshots and generated files
- 🎯 **Flexible**: Support for multiple LLM models and custom configurations

## Quick Start

### 1. Choose How to Use This Action

**Option A: Reference directly (Recommended)**
```yaml
uses: yourusername/monkeytest@v1
```

**Option B: Fork and customize**
```yaml
uses: your-fork/monkeytest@main
```

**Option C: Local action for development**
```yaml
uses: ./
```

### 2. Get Your Browser Use API Key

1. Sign up at [Browser Use Cloud](https://cloud.browser-use.com)
2. Generate an API key from your dashboard
3. Add it to your repository secrets as `BROWSER_USE_API_KEY`:
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `BROWSER_USE_API_KEY`
   - Value: Your API key

### 3. Create Test Cases

Create a `tests` directory with markdown test files:

**tests/homepage-test.md**:
```markdown
---
name: "Homepage Load Test"
description: "Verify homepage loads correctly"
timeout: 60
---

# Task

Navigate to https://example.com and verify:
1. The page title is "Example Domain"
2. The main heading says "Example Domain"
3. There is a "More information" link

Return "PASS" if all elements are present, otherwise "FAIL" with details.
```

### 4. Create a Workflow

**.github/workflows/browser-tests.yml**:
```yaml
name: Browser Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses:
 actions/checkout@v4

      - name: Run Browser Tests
        uses: yourusername/monkey-test@v1  # Or use ./  for local action
        with:
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          test-directory: tests

      - name: Upload Artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            test-results.json
            browser-use-outputs/
```

### 5. Run Your Tests

Push your code and watch the tests run automatically! 🚀

## Documentation

- [Getting Started Guide](GETTING_STARTED.md) - Step-by-step setup instructions
- [Example Tests](tests/examples/) - Sample test cases to get started
- [Example Workflow](.github/workflows/example-browser-tests.yml) - Full workflow example with reporting
- [Architecture](ARCHITECTURE.md) - Technical architecture details
- [Docker Implementation](DOCKER_IMPLEMENTATION.md) - Docker container details
- [Contributing](CONTRIBUTING.md) - Contribution guidelines

## Project Structure

```
monkeytest/
├── action.yml                      # Action definition (at root)
├── Dockerfile                      # Docker container definition
├── requirements.txt                # Python dependencies
├── src/
│   └── run_tests.py               # Main test runner script
├── .github/
│   └── workflows/
│       └── example-browser-tests.yml  # Example workflow
├── tests/
│   └── examples/                   # Example test cases
│       ├── hackernews-search.md
│       ├── form-validation.md
│       └── simple-page-check.md
├── scripts/
│   └── test-local.sh              # Local testing helper
├── README.md                       # This file
├── GETTING_STARTED.md              # Setup guide
├── ARCHITECTURE.md                 # Technical docs
├── DOCKER_IMPLEMENTATION.md        # Docker details
├── CONTRIBUTING.md                 # Contribution guide
└── LICENSE                         # MIT License
```

## Example Test Cases

### Simple Page Verification

```markdown
---
name: "Page Load Test"
---

# Task

Go to https://example.com and check if the page title is "Example Domain".
Return "PASS" or "FAIL".
```

### Form Testing

```markdown
---
name: "Contact Form Test"
timeout: 120
---

# Task

1. Navigate to https://example.com/contact
2. Fill in the form with test data
3. Submit the form
4. Verify the success message appears
5. Return the confirmation message text
```

### Data Extraction

```markdown
---
name: "Extract News Headlines"
llm_model: "gpt-4.1"
---

# Task

Go to https://news.ycombinator.com and extract the top 5 post titles and URLs.
Return as JSON array with "title" and "url" fields.
```

## Action Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `api-key` | ✅ | - | Browser Use API key |
| `test-directory` | ✅ | - | Directory with test markdown files |
| `llm-model` | ❌ | `browser-use-llm` | AI model to use |
| `fail-on-error` | ❌ | `true` | Fail action if tests fail |
| `timeout` | ❌ | `300` | Timeout per test (seconds) |
| `save-outputs` | ❌ | `true` | Save screenshots/artifacts |

## Action Outputs

| Output | Description |
|--------|-------------|
| `results` | JSON string with detailed results |
| `total-tests` | Number of tests executed |
| `passed-tests` | Number of passed tests |
| `failed-tests` | Number of failed tests |
| `results-file` | Path to JSON results file |

## Use Cases

- **E2E Testing**: Automated end-to-end testing of web applications
- **Smoke Tests**: Quick validation that key features work after deployment
- **Regression Testing**: Ensure new changes don't break existing functionality
- **Web Scraping Validation**: Verify data extraction pipelines
- **UI/UX Testing**: Test user flows and interactions
- **Cross-browser Testing**: Validate behavior across different scenarios
- **Monitoring**: Scheduled checks to ensure site availability and functionality

## Advanced Usage

### Multiple Test Suites

```yaml
jobs:
  smoke-tests:
    steps:
      - uses: yourusername/monkeytest@v1
        with:
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          test-directory: tests/smoke
          timeout: 60

  full-tests:
    needs: smoke-tests
    steps:
      - uses: yourusername/monkeytest@v1
        with:
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          test-directory: tests/full
          llm-model: gpt-4.1
          timeout: 600
```

### Custom Reporting

```yaml
- name: Run Tests
  id: tests
  uses: yourusername/monkeytest@v1
  with:
    api-key: ${{ secrets.BROWSER_USE_API_KEY }}
    test-directory: tests

- name: Generate Report
  run: |
    echo "Test Results:" > report.txt
    echo "Total: ${{ steps.tests.outputs.total-tests }}" >> report.txt
    echo "Passed: ${{ steps.tests.outputs.passed-tests }}" >> report.txt
    echo "Failed: ${{ steps.tests.outputs.failed-tests }}" >> report.txt
```

### Scheduled Monitoring

```yaml
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  monitor:
    steps:
      - uses: yourusername/monkeytest@v1
        with:
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          test-directory: tests/monitoring
          fail-on-error: false

      - name: Send Alert
        if: failure()
        # Send notification via email, Slack, etc.
```

## Tips for Writing Effective Tests

### ✅ Do's

- **Be specific**: "Click the blue 'Submit' button on the contact form"
- **Set boundaries**: "Extract the first 10 items from the list"
- **Include URLs**: Always specify the full URL to navigate to
- **Define output format**: "Return as JSON with fields: name, email, status"
- **Add context**: Explain login credentials or prerequisites

### ❌ Don'ts

- **Too vague**: "Test the website" - what specifically?
- **Too broad**: "Check all functionality" - be more specific
- **Missing details**: "Login to the app" - with what credentials?
- **No success criteria**: How do you know if the test passed?

## Troubleshooting

### Tests Timeout

- Increase the timeout value
- Simplify test instructions
- Break complex tests into smaller ones
- Check if the target website is slow

### API Key Not Found

- Verify secret name is exactly `BROWSER_USE_API_KEY`
- Ensure secret is added to repository (not organization)
- Check workflow has permission to access secrets

### Test Parsing Errors

- Validate YAML frontmatter syntax
- Ensure proper markdown formatting
- Check file encoding is UTF-8

### Action Not Found Error

If you see "Can't find 'action.yml'" or similar:

1. **For local testing** (within this repo): Use `uses: ./` and ensure you've checked out the code first
2. **For external use**: Create a release tag (e.g., `v1`) and use `uses: aevsai/monkey-test@v1`
3. **Verify files**: Ensure `action.yml` is at the repository root
4. **Check branch**: Make sure you're referencing the correct branch/tag

### Docker Build Failures

- Test locally: `docker build -t monkeytest .`
- Check Dockerfile syntax
- Verify all file paths in COPY commands exist
- Ensure requirements.txt is valid

## Contributing

Contributions are welcome! Feel free to:

- Report bugs and issues
- Suggest new features
- Submit pull requests
- Improve documentation
- Share example test cases

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Browser Use Resources

- [Browser Use Documentation](https://docs.cloud.browser-use.com)
- [Browser Use Cloud Dashboard](https://cloud.browser-use.com)
- [Browser Use GitHub](https://github.com/browser-use/browser-use)

## License

MIT License - See [LICENSE](LICENSE) file for details

## Technical Details

This action runs in a **Docker container** with:
- Python 3.11 slim base image
- Pre-installed Browser Use SDK and dependencies
- Isolated, consistent environment
- Efficient layer caching for faster builds

## Using This Action

### In Your Own Repository

```yaml
# .github/workflows/tests.yml
- uses: aevsai/monkey-test@v1
  with:
    api-key: ${{ secrets.BROWSER_USE_API_KEY }}
    test-directory: tests
```

### As a Local Action (Development)

```yaml
# From within this repository
- uses: ./
  with:
    api-key: ${{ secrets.BROWSER_USE_API_KEY }}
    test-directory: tests
```

## Support

- 📖 [Getting Started Guide](GETTING_STARTED.md)
- 📐 [Architecture Documentation](ARCHITECTURE.md)
- 🐳 [Docker Implementation](DOCKER_IMPLEMENTATION.md)
- 💬 [GitHub Discussions](https://github.com/aevsai/monkey-test/discussions)
- 🐛 [Report Issues](https://github.com/aevsai/monkey-test/issues)

---

**Happy Testing!** 🐵🧪

Made with ❤️ using [Browser Use](https://browser-use.com)