# MonkeyTest 🐵🧪

AI-powered browser testing with Browser Use - TypeScript test runner for natural language browser automation.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-8.15-orange.svg)](https://pnpm.io/)

## Overview

MonkeyTest is a TypeScript-based test runner that lets you write browser tests in plain English using markdown files. Powered by [Browser Use](https://browser-use.com) AI agents, your tests are executed automatically with no need to write complex Selenium or Playwright scripts.

## Features

- 🤖 **AI-Powered**: Write tests in natural language, let AI handle the browser automation
- 📝 **Markdown Tests**: Simple, readable test cases in markdown format with frontmatter
- 🎨 **Beautiful Output**: Colored console output with chalk for better readability
- 📊 **Rich Reports**: Detailed JSON results with test outcomes and artifacts
- 💾 **Artifacts**: Capture screenshots and generated files
- 🎯 **Flexible**: Support for multiple LLM models and custom configurations
- ⚡ **Fast**: Built with TypeScript and modern async/await patterns
- 🔧 **Type-Safe**: Full TypeScript support with strict typing
- 🔍 **Git Diff Testing**: Auto-generate tests from code changes using LLM analysis
- 🚀 **GitHub Actions Integration**: Automated test generation and execution in CI/CD

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+ (install with `npm install -g pnpm`)
- Browser Use API key from [Browser Use Cloud](https://cloud.browser-use.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/monkey-test.git
cd monkey-test

# Install dependencies
pnpm install

# Build the project
pnpm build
```

### Configuration

Set your Browser Use API key as an environment variable:

```bash
export BROWSER_USE_API_KEY="your-api-key-here"
```

## Using as GitHub Action in External Repositories

MonkeyTest can be used as a GitHub Action in your own repositories!

### Quick Start

```yaml
name: Browser Tests

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Browser Tests
        uses: aevsai/monkey-test@v0.6
        with:
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          test-directory: tests
```

### Auto-Generate Tests from PR Changes

```yaml
name: Auto-Generated Tests

on:
  pull_request:
    branches: [main]

jobs:
  auto-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate and Run Tests
        uses: aevsai/monkey-test@v0.6
        with:
          from-commit: ${{ github.event.pull_request.base.sha }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          context-file: './docs/app-context.md'
          max-test-cases: 10

      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            .monkey-test-generated/
            artifacts/
            test-results.json
            browser-use-outputs/
```

### Action Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `api-key` | No* | - | Browser Use API key |
| `test-directory` | No* | - | Test files directory (standard mode) |
| `from-commit` | No | - | Generate tests from diff |
| `openai-api-key` | No** | - | OpenAI API key (diff mode) |
| `test-generation-model` | No | `gpt-4-turbo-preview` | Model for generation |
| `context-file` | No | - | Path to context file describing solution |
| `generate-only` | No | `false` | Generate without executing |
| `max-test-cases` | No | `10` | Max tests to generate |
| `max-concurrency` | No | `3` | Concurrent execution |
| `timeout` | No | `300` | Test timeout (seconds) |

\* Required for standard mode  
\** Required for diff-based mode

**📖 Full external usage guide:** See [docs/EXTERNAL_USAGE.md](docs/EXTERNAL_USAGE.md) for 10+ workflow examples!

## Usage Modes

MonkeyTest supports two modes of operation:

### 1. Standard Mode - Run Existing Tests

Run pre-written markdown test cases from your test directory:

```bash
# Run all tests in the tests directory
monkey-test

# Or use npm/pnpm scripts
pnpm test
```

### 2. Diff-Based Test Generation (NEW!)

Automatically generate and run tests based on git commit changes:

```bash
# Generate tests from changes since a specific commit
monkey-test --from-commit main

# Generate tests from last 3 commits
monkey-test --from-commit HEAD~3

# Generate tests only (don't execute them)
monkey-test --from-commit main --generate-only
```

#### How Diff-Based Testing Works

1. **Get Git Diff**: Compares your current code with the specified commit
2. **LLM Analysis**: Sends the diff to GPT-4 to analyze changes
3. **Test Generation**: LLM generates browser test cases in XML format
4. **Convert to Markdown**: Converts generated tests to markdown format
5. **Execute Tests**: Runs the generated tests using Browser Use
6. **Save Artifacts**: Saves diff, LLM response, and test results
7. **GitHub Actions**: Displays results in PR comments and workflow summaries

#### Required Environment Variables for Diff Mode

```bash
export OPENAI_API_KEY="your-openai-api-key"
export BROWSER_USE_API_KEY="your-browser-use-api-key"
```

#### Optional Configuration

```bash
# LLM model for test generation (default: gpt-4-turbo-preview)
export TEST_GENERATION_MODEL="gpt-4-turbo-preview"

# Max test cases to generate (default: 10)
export MAX_TEST_CASES=10

# Max diff size in characters (default: 100000)
export MAX_DIFF_SIZE=100000

# Artifact directory (default: artifacts)
export ARTIFACT_DIR="./artifacts"

# Max concurrent tests (default: 3)
export MAX_CONCURRENCY=3

# Test timeout in seconds (default: 300)
export TIMEOUT=300
```

#### Using Context Files for Better Test Generation

Context files help the LLM generate more accurate and relevant tests by providing information about your application. Create a markdown file describing your solution:

```bash
# Create a context file
cat > docs/app-context.md << 'EOF'
# Application Context

## Overview
E-commerce platform built with React and Node.js

## Key Features
- User authentication
- Product catalog with search
- Shopping cart
- Checkout with Stripe integration

## Important URLs
- Homepage: /
- Products: /products
- Cart: /cart
- Checkout: /checkout

## Testing Priorities
1. Critical: Payment flow
2. High: User authentication
3. Medium: Product search
EOF

# Use the context file
monkey-test --from-commit main --context-file ./docs/app-context.md

# Or with environment variable
CONTEXT_FILE=./docs/app-context.md monkey-test --from-commit main
```

**What to include in your context file:**
- Application overview and purpose
- Technical stack
- Key features and user workflows
- Important URLs and routes
- Testing priorities
- Domain-specific terminology
- Known constraints or test data requirements

See [examples/context-file-example.md](examples/context-file-example.md) for a complete example.

## GitHub Actions Integration

MonkeyTest includes built-in GitHub Actions support for automated testing on PRs and commits.

### Setup GitHub Actions Workflow

1. Add secrets to your repository:
   - `BROWSER_USE_API_KEY`: Your Browser Use API key
   - `OPENAI_API_KEY`: Your OpenAI API key

2. Use the provided workflow file at `.github/workflows/diff-test.yml`

3. The workflow will automatically:
   - Generate tests from PR changes
   - Execute the tests
   - Upload artifacts (diffs, generated tests, results)
   - Comment on PRs with test results
   - Display summary in workflow page

### Workflow Features

- **Pull Request Testing**: Automatically tests changes in PRs
- **Artifact Storage**: Saves all generated tests and results for 30 days
- **PR Comments**: Posts test results directly on pull requests
- **Test Preview**: Optional job to generate tests without executing
- **Manual Trigger**: Run workflow manually with custom commit reference

### Example Workflow Output

The GitHub Actions workflow provides:

1. **Step Summary**: Formatted markdown table with test results
2. **Artifacts**:
   - Generated test cases (`.md` files)
   - Git diff used for generation
   - Raw LLM response
   - Test execution results (JSON + Markdown)
   - Screenshots and outputs
3. **PR Comments**: Automatic comment with pass/fail status
4. **Annotations**: Error annotations for failed tests

## Command Line Options

```bash
monkey-test [OPTIONS]

OPTIONS:
  --from-commit <ref>      Generate tests from git diff (commit reference)
  --context-file <path>    Path to context file describing the solution
  --generate-only          Only generate tests, don't execute them
  --help                   Show help message

EXAMPLES:
  # Standard mode
  monkey-test

  # Generate from main branch
  monkey-test --from-commit main

  # Generate from specific commit
  monkey-test --from-commit abc123

  # Preview generated tests only
  monkey-test --from-commit HEAD~1 --generate-only

  # Use context file for better test generation
  monkey-test --from-commit main --context-file ./docs/app-context.md
```

## Environment Variables Reference

### Required (Standard Mode)
- `BROWSER_USE_API_KEY`: API key for Browser Use Cloud

### Required (Diff Mode)
- `BROWSER_USE_API_KEY`: API key for Browser Use Cloud
- `OPENAI_API_KEY`: API key for OpenAI

### Optional
- `TEST_DIRECTORY`: Test files directory (default: `tests`)
- `LLM_MODEL`: Model for test execution (default: `browser-use-llm`)
- `TEST_GENERATION_MODEL`: Model for test generation (default: `gpt-4-turbo-preview`)
- `CONTEXT_FILE`: Path to context file describing the solution being tested
- `TIMEOUT`: Test timeout in seconds (default: `300`)
- `MAX_CONCURRENCY`: Max concurrent tests (default: `3`)
- `MAX_TEST_CASES`: Max tests to generate (default: `10`)
- `MAX_DIFF_SIZE`: Max diff size in chars (default: `100000`)
- `ARTIFACT_DIR`: Artifact output directory (default: `artifacts`)
- `OUTPUT_DIR`: Test output directory (default: `browser-use-outputs`)
- `FAIL_ON_ERROR`: Exit with error on failure (default: `true`)
- `SAVE_OUTPUTS`: Save test outputs (default: `true`)

## Examples

### Example 1: Test PR Changes

```bash
# Get the base branch of your PR
BASE_COMMIT=$(git merge-base HEAD origin/main)

# Generate and run tests
OPENAI_API_KEY="sk-..." BROWSER_USE_API_KEY="bu-..." \
  monkey-test --from-commit $BASE_COMMIT
```

### Example 2: Preview Generated Tests

```bash
# Generate tests without executing
OPENAI_API_KEY="sk-..." \
  monkey-test --from-commit main --generate-only

# View generated tests
ls -la .monkey-test-generated/
```

### Example 3: Custom Test Generation

```bash
# Generate more tests with larger diff size
MAX_TEST_CASES=20 MAX_DIFF_SIZE=200000 \
  OPENAI_API_KEY="sk-..." BROWSER_USE_API_KEY="bu-..." \
  monkey-test --from-commit HEAD~5
```

## Artifacts Structure

When using diff-based testing, the following artifacts are created:

```
artifacts/
├── diff-2024-01-15T10-30-00-000Z.txt          # Git diff
├── llm-response-2024-01-15T10-30-00-000Z.txt  # Raw LLM response
├── test-results-2024-01-15T10-30-00-000Z.json # Test results (JSON)
└── test-results-2024-01-15T10-30-00-000Z.md   # Test results (Markdown)

.monkey-test-generated/
├── 1-test-login-functionality.md
├── 2-test-dashboard-rendering.md
└── 3-test-api-integration.md

browser-use-outputs/
├── test-login-functionality/
│   ├── screenshot-1.png
│   └── output.txt
└── test-dashboard-rendering/
    └── screenshot-1.png
```

## Troubleshooting

### Common Issues

**Error: "OPENAI_API_KEY environment variable is required"**
- Set your OpenAI API key: `export OPENAI_API_KEY="sk-..."`

**Error: "Not a git repository"**
- Run monkey-test from within a git repository
- Ensure `.git` directory exists

**Error: "Invalid commit reference"**
- Verify the commit exists: `git log --oneline`
- Use valid references: `main`, `HEAD~1`, commit SHA, etc.

**Error: "No changes found between commits"**
- The diff is empty - no changes detected
- Check if you're comparing identical commits

**LLM generates invalid XML**
- Try running again - LLMs can occasionally produce malformed output
- Check your API key and quota limits
- Try a different model with `TEST_GENERATION_MODEL`

### Debug Mode

Enable verbose logging:

```bash
export BROWSER_USE_API_KEY="bu_..."
```

Or create a `.env` file:

```env
BROWSER_USE_API_KEY=bu_...
TEST_DIRECTORY=tests
LLM_MODEL=browser-use-llm
TIMEOUT=300
SAVE_OUTPUTS=true
FAIL_ON_ERROR=true
```

### Create Your First Test

Create a test file in the `tests` directory:

**tests/example-test.md**:
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

### Run Tests

```bash
# Run tests
pnpm test

# Or run directly with tsx (development)
pnpm dev

# Or run the built version
pnpm start
```

## Project Structure

```
monkey-test/
├── src/
│   ├── index.ts           # Main entry point
│   ├── types.ts           # TypeScript type definitions
│   ├── config.ts          # Configuration management
│   ├── test-parser.ts     # Markdown test parser
│   ├── test-executor.ts   # Test execution logic
│   ├── reporter.ts        # Report generation and display
│   └── utils.ts           # Utility functions
├── tests/                 # Your test markdown files
├── browser-use-outputs/   # Test artifacts (generated)
├── dist/                  # Compiled JavaScript (generated)
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Test Case Format

Test cases are written in Markdown with YAML frontmatter:

```markdown
---
name: "Test Name"
description: "Optional description"
timeout: 120
llm_model: "browser-use-llm"
input_files: []
expected_output: "Optional expected output"
---

# Task

Your test instructions in plain English...

1. Navigate to a URL
2. Interact with elements
3. Verify conditions
4. Return results

**IMPORTANT:** Include a status tag in your response:
- `<status>completed</status>` if the task completed successfully
- `<status>failed</status>` if the task failed or encountered errors
- `<status>not-finished</status>` if the task couldn't be completed
```

### Status Tag Requirement

MonkeyTest automatically adds instructions to all test tasks requiring the Browser Use agent to include a status tag in its response. This tag is used to determine if the test passed or failed:

- **`<status>completed</status>`** - Test passes ✅ (task completed successfully)
- **`<status>failed</status>`** - Test fails ❌ (task encountered errors or conditions not met) - **CAUSES BUILD FAILURE**
- **`<status>not-finished</status>`** - Test not finished 🔄 (task couldn't be completed, e.g., site down, network issues) - **Does NOT cause build failure**

The agent will parse this tag from the output and set the test result accordingly. If no status tag is found, the test defaults to passed for backward compatibility.

**Important:** Tests marked as `not-finished` are tracked separately and do not cause the test run to fail. This is useful for scenarios where external factors prevent test completion (site unavailable, network issues, etc.) but you don't want to fail the entire build.
```

### Frontmatter Options

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | No | Filename | Test case name |
| `description` | string | No | "" | Test description |
| `timeout` | number | No | 300 | Timeout in seconds |
| `llm_model` | string | No | browser-use-llm | LLM model to use |
| `input_files` | array | No | [] | Input file IDs |
| `expected_output` | string | No | - | Expected output for validation |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BROWSER_USE_API_KEY` | (required) | Your Browser Use API key |
| `TEST_DIRECTORY` | `tests` | Directory containing test files |
| `LLM_MODEL` | `browser-use-llm` | Default LLM model |
| `TIMEOUT` | `300` | Default timeout in seconds |
| `SAVE_OUTPUTS` | `true` | Save output files |
| `FAIL_ON_ERROR` | `true` | Exit with error code on test failure |
| `OUTPUT_DIR` | `browser-use-outputs` | Directory for output files |
| `MAX_CONCURRENCY` | `3` | Maximum number of concurrent test sessions |

## Scripts

```json
{
  "build": "tsc",                    // Compile TypeScript to JavaScript
  "dev": "tsx src/index.ts",         // Run in development mode
  "start": "node dist/index.js",     // Run compiled version
  "test": "node dist/index.js",      // Run tests (after build)
  "clean": "rm -rf dist",            // Clean build artifacts
  "typecheck": "tsc --noEmit"        // Type check without compiling
}
```

## Example Tests

### Simple Page Check

```markdown
---
name: "Page Load Test"
---

# Task

Go to https://example.com and verify the page loads successfully.

If the page loads correctly, include: <status>completed</status>
Otherwise, include: <status>failed</status>
```

### Form Testing

```markdown
---
name: "Contact Form Test"
timeout: 120
---

# Task

1. Navigate to https://example.com/contact
2. Fill in the form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Message: "This is a test message"
3. Submit the form
4. Verify the success message appears
5. Return the confirmation message text

Include status tag:
- <status>completed</status> if form submitted successfully
- <status>failed</status> if form submission failed
```

### Data Extraction

```markdown
---
name: "Extract Headlines"
llm_model: "browser-use-llm"
---

# Task

Go to https://news.ycombinator.com and extract the top 10 post titles and URLs.
Return as JSON array with "title" and "url" fields.

Include status tag:
- <status>completed</status> if data extracted successfully
- <status>failed</status> if extraction failed
```

## Output

### Console Output

The test runner provides colored, formatted console output:

```
🚀 Browser Use Test Runner
================================================================================

🔧 Initializing Browser Use client...
✅ Browser Use client initialized successfully

📁 Found 3 test file(s) in 'tests'

🎯 Starting test execution...
📁 Test directory: tests
⚙️  LLM Model: browser-use-llm
⏱️  Timeout: 300s per test
💾 Save outputs: true

================================================================================
🧪 Running test: Homepage Load Test
📄 File: tests/example-test.md
📝 Description: Verify homepage loads correctly
================================================================================
🚀 Creating Browser Use task...
📋 Task instructions: Navigate to https://example.com and verify...
✅ Task created: task_abc123
⏳ Waiting for task completion (timeout: 60s)...
📊 Status: running
📊 Status: finished
✅ Test PASSED in 12.34s
📤 Output: PASS - All elements verified

================================================================================
📊 TEST SUMMARY
================================================================================
Total Tests:    3
✅ Passed:      3
❌ Failed:      0
⚠️  Errors:      0
Success Rate:   100.0%
================================================================================

📋 Individual Test Results:
  ✅ Homepage Load Test (12.34s)
  ✅ Contact Form Test (45.67s)
  ✅ Extract Headlines (23.45s)

💾 Results saved to: test-results.json
✅ All tests passed!
```

### JSON Output

Results are saved to `test-results.json`:

```json
{
  "summary": {
    "total": 3,
    "passed": 3,
    "failed": 0,
    "errors": 0,
    "successRate": "100.0%"
  },
  "results": [
    {
      "name": "Homepage Load Test",
      "filePath": "tests/example-test.md",
      "status": "passed",
      "output": "PASS - All elements verified",
      "duration": 12.34,
      "taskId": "task_abc123",
      "outputFiles": []
    }
  ]
}
```

## GitHub Actions Integration

The test runner supports GitHub Actions through the `GITHUB_OUTPUT` environment variable:

```yaml
name: Browser Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Run tests
        id: tests
        env:
          BROWSER_USE_API_KEY: ${{ secrets.BROWSER_USE_API_KEY }}
        run: pnpm test

      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            test-results.json
            browser-use-outputs/

      - name: Check results
        run: |
          echo "Total: ${{ steps.tests.outputs.total-tests }}"
          echo "Passed: ${{ steps.tests.outputs.passed-tests }}"
          echo "Failed: ${{ steps.tests.outputs.failed-tests }}"
```

## API Reference

### BrowserUseClient

```typescript
import { BrowserUseClient } from "browser-use-sdk";

const client = new BrowserUseClient({
  apiKey: "bu_...",
});

// Create a task
const task = await client.tasks.createTask({
  task: "Navigate to example.com",
  llm: "browser-use-llm",
  inputFiles: [], // optional
});

// Stream progress
for await (const update of task.stream()) {
  console.log(update.status);
}

// Get final result
const result = await task.complete();
console.log(result.output);
console.log(result.outputFiles);
```

## Tips for Writing Effective Tests

### ✅ Do's

- **Be specific**: "Click the blue 'Submit' button on the contact form"
- **Set boundaries**: "Extract the first 10 items from the list"
- **Include URLs**: Always specify the full URL to navigate to
- **Define output format**: "Return as JSON with fields: name, email, status"
- **Add context**: Explain login credentials or prerequisites
- **Use timeouts**: Set realistic timeouts based on page complexity
- **Include status tags**: Always instruct the agent to include `<status>completed</status>`, `<status>failed</status>`, or `<status>not-finished</status>` in the response
- **Define success criteria**: Clearly specify what constitutes success vs failure for the status tag
- **Use not-finished appropriately**: Use `<status>not-finished</status>` for external issues (site down, network problems) that shouldn't fail the build, and `<status>failed</status>` for actual test failures

### ❌ Don'ts

- **Don't forget status tags**: Always include instructions for status tags to ensure proper test validation
- **Don't be ambiguous about success**: Make it clear when the agent should report `<status>completed</status>` vs `<status>failed</status>` vs `<status>not-finished</status>`
- **Don't misuse not-finished**: Don't use `<status>not-finished</status>` for actual test failures - use it only when external factors prevent completion

- **Too vague**: "Test the website" - what specifically?
- **Too broad**: "Check all functionality" - be more specific
- **Missing details**: "Login to the app" - with what credentials?
- **No success criteria**: How do you know if the test passed?
- **Unrealistic timeouts**: Give complex tests enough time

## Troubleshooting

### API Key Not Found

```
❌ Error: BROWSER_USE_API_KEY environment variable is not set
```

**Solution**: Export the environment variable or add it to your `.env` file.

### Test Directory Not Found

```
❌ Error: Test directory 'tests' does not exist
```

**Solution**: Create the test directory or set `TEST_DIRECTORY` to an existing directory.

### Tests Timeout

**Solutions**:
- Increase the timeout in test frontmatter or `TIMEOUT` env var
- Simplify test instructions
- Break complex tests into smaller ones
- Check if the target website is slow

### TypeScript Compilation Errors

```bash
# Check for type errors
pnpm typecheck

# Clean and rebuild
pnpm clean
pnpm build
```

### Module Resolution Issues

Make sure you're using `.js` extensions in imports:

```typescript
// ✅ Correct
import { Config } from "./types.js";

// ❌ Wrong
import { Config } from "./types";
```

## Development

### Setup Development Environment

```bash
# Install dependencies
pnpm install

# Run in development mode (with auto-reload)
pnpm dev

# Type check
pnpm typecheck

# Build
pnpm build
```

### Project Architecture

- **`index.ts`**: Main entry point and test runner orchestration
- **`config.ts`**: Environment variable loading and validation
- **`types.ts`**: TypeScript interfaces and types
- **`test-parser.ts`**: Markdown parsing with frontmatter support
- **`test-executor.ts`**: Test execution with Browser Use SDK
- **`reporter.ts`**: Console and JSON report generation
- **`utils.ts`**: Shared utility functions

### Adding New Features

1. Add types to `types.ts`
2. Implement logic in appropriate module
3. Update tests
4. Update documentation

## Contributing

Contributions are welcome! Please feel free to:

- Report bugs and issues
- Suggest new features
- Submit pull requests
- Improve documentation
- Share example test cases

## Resources

- [Browser Use Documentation](https://docs.cloud.browser-use.com)
- [Browser Use Cloud Dashboard](https://cloud.browser-use.com)
- [Browser Use SDK](https://github.com/browser-use/browser-use-sdk)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [pnpm Documentation](https://pnpm.io/)

## License

MIT License - See LICENSE file for details

## Support

- 💬 [GitHub Issues](https://github.com/yourusername/monkey-test/issues)
- 📖 [Documentation](https://github.com/yourusername/monkey-test)
- 🌐 [Browser Use Community](https://browser-use.com)

---

**Happy Testing!** 🐵🧪

Made with ❤️ using [Browser Use](https://browser-use.com)
