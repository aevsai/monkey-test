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
Return "PASS" if successful.
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

### ❌ Don'ts

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