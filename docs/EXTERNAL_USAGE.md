# Using MonkeyTest as GitHub Action in External Repositories

Complete guide for using `aevsai/monkey-test` as a GitHub Action in your own repositories.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Standard Mode (Existing Tests)](#standard-mode-existing-tests)
- [Diff-Based Mode (Auto-Generate Tests)](#diff-based-mode-auto-generate-tests)
- [Combined Workflows](#combined-workflows)
- [Configuration Reference](#configuration-reference)
- [Examples](#examples)

## Basic Usage

Add MonkeyTest to your repository's GitHub Actions workflow.

### Prerequisites

1. Add secrets to your repository (Settings → Secrets and variables → Actions):
   - `BROWSER_USE_API_KEY` - Required for test execution
   - `OPENAI_API_KEY` - Required for diff-based test generation

## Standard Mode (Existing Tests)

Run pre-written markdown test cases from your repository.

### Example 1: Basic Test Execution

```yaml
name: Browser Tests

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

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

      - name: Upload Artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            test-results.json
            browser-use-outputs/
```

### Example 2: Advanced Configuration

```yaml
name: Browser Tests (Advanced)

on:
  push:
    branches: [main, develop]
  pull_request:
  workflow_dispatch:

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
          llm-model: browser-use-llm
          timeout: 600
          max-concurrency: 5
          fail-on-error: true
          save-outputs: true

      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ github.run_id }}
          path: |
            test-results.json
            browser-use-outputs/
          retention-days: 30

      - name: Comment on PR
        if: github.event_name == 'pull_request' && always()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            if (fs.existsSync('test-results.json')) {
              const results = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
              const { summary } = results;
              
              const comment = `## 🧪 Test Results
              
              | Total | Passed | Failed | Errors | Success Rate |
              |-------|--------|--------|--------|--------------|
              | ${summary.total} | ${summary.passed} | ${summary.failed} | ${summary.errors} | ${summary.successRate} |
              
              ${summary.failed > 0 ? '⚠️ Some tests failed!' : '✅ All tests passed!'}`;
              
              await github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: comment
              });
            }
```

## Diff-Based Mode (Auto-Generate Tests)

Automatically generate tests from code changes.

### Example 3: Auto-Generate Tests from PR

```yaml
name: Auto-Generate Tests from PR Changes

on:
  pull_request:
    branches: [main]

jobs:
  auto-test:
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      pull-requests: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for git diff

      - name: Generate and Run Tests
        uses: aevsai/monkey-test@v0.6
        with:
          # Diff-based mode
          from-commit: ${{ github.event.pull_request.base.sha }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          
          # Generation settings
          test-generation-model: gpt-4-turbo-preview
          max-test-cases: 10
          max-diff-size: 100000
          
          # Execution settings
          llm-model: browser-use-llm
          max-concurrency: 3
          timeout: 300

      - name: Upload Generated Tests
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: generated-tests-${{ github.run_id }}
          path: |
            .monkey-test-generated/
            artifacts/
          retention-days: 30

      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ github.run_id }}
          path: |
            test-results.json
            browser-use-outputs/
          retention-days: 30
```

### Example 4: Preview Tests Only (No Execution)

```yaml
name: Preview Generated Tests

on:
  pull_request:
    branches: [main]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate Tests Preview
        uses: aevsai/monkey-test@v0.6
        with:
          from-commit: ${{ github.event.pull_request.base.sha }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          generate-only: true
          max-test-cases: 10

      - name: Upload Preview
        uses: actions/upload-artifact@v4
        with:
          name: test-preview-${{ github.run_id }}
          path: |
            .monkey-test-generated/
            artifacts/
          retention-days: 7

      - name: Comment Preview
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const path = require('path');
            
            let comment = '## 🔍 Generated Test Preview\n\n';
            
            if (fs.existsSync('.monkey-test-generated')) {
              const files = fs.readdirSync('.monkey-test-generated');
              comment += `**${files.length} test case(s) would be generated:**\n\n`;
              
              files.forEach((file, i) => {
                if (file.endsWith('.md')) {
                  comment += `${i + 1}. \`${file}\`\n`;
                }
              });
            } else {
              comment += 'No tests generated from this change.\n';
            }
            
            await github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### Example 5: Test on Push to Main

```yaml
name: Test Changes on Main

on:
  push:
    branches: [main]

jobs:
  test-main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate and Test Changes
        uses: aevsai/monkey-test@v0.6
        with:
          from-commit: HEAD~1
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          max-test-cases: 10

      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: main-test-results
          path: |
            .monkey-test-generated/
            artifacts/
            test-results.json
            browser-use-outputs/
```

## Combined Workflows

Run both standard tests and auto-generated tests.

### Example 6: Hybrid Testing

```yaml
name: Comprehensive Testing

on:
  pull_request:
    branches: [main]

jobs:
  # Job 1: Run existing manual tests
  manual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Manual Tests
        uses: aevsai/monkey-test@v0.6
        with:
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          test-directory: tests

      - name: Upload Manual Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: manual-test-results
          path: |
            test-results.json
            browser-use-outputs/

  # Job 2: Auto-generate and run tests from diff
  auto-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate and Run Auto Tests
        uses: aevsai/monkey-test@v0.6
        with:
          from-commit: ${{ github.event.pull_request.base.sha }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          max-test-cases: 5

      - name: Upload Auto Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: auto-test-results
          path: |
            .monkey-test-generated/
            artifacts/
            test-results.json
            browser-use-outputs/

  # Job 3: Combine results and report
  report:
    needs: [manual-tests, auto-tests]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Download All Artifacts
        uses: actions/download-artifact@v4

      - name: Create Combined Report
        run: |
          echo "# Test Report" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "## Manual Tests" >> $GITHUB_STEP_SUMMARY
          if [ -f "manual-test-results/test-results.json" ]; then
            cat manual-test-results/test-results.json | jq -r '.summary | "- Total: \(.total)\n- Passed: \(.passed)\n- Failed: \(.failed)"'
          fi >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "## Auto-Generated Tests" >> $GITHUB_STEP_SUMMARY
          if [ -f "auto-test-results/test-results.json" ]; then
            cat auto-test-results/test-results.json | jq -r '.summary | "- Total: \(.total)\n- Passed: \(.passed)\n- Failed: \(.failed)"'
          fi >> $GITHUB_STEP_SUMMARY
```

## Configuration Reference

### All Available Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `api-key` | No* | - | Browser Use API key (required for execution) |
| `test-directory` | No* | - | Directory with test files (standard mode) |
| `llm-model` | No | `browser-use-llm` | LLM model for execution |
| `fail-on-error` | No | `true` | Fail action if tests fail |
| `timeout` | No | `300` | Test timeout (seconds) |
| `save-outputs` | No | `true` | Save screenshots/outputs |
| `from-commit` | No | - | Commit ref for diff mode |
| `openai-api-key` | No** | - | OpenAI API key (required for diff mode) |
| `test-generation-model` | No | `gpt-4-turbo-preview` | Model for generation |
| `generate-only` | No | `false` | Generate without executing |
| `max-test-cases` | No | `10` | Max tests to generate |
| `max-diff-size` | No | `100000` | Max diff size (chars) |
| `max-concurrency` | No | `3` | Concurrent test execution |

\* Required for standard mode  
\** Required for diff-based mode

### All Available Outputs

| Output | Description |
|--------|-------------|
| `results` | JSON string with test results |
| `total-tests` | Total number of tests |
| `passed-tests` | Number of passed tests |
| `failed-tests` | Number of failed tests |
| `error-tests` | Number of error tests |
| `success-rate` | Success rate percentage |
| `results-file` | Path to results JSON file |

### Using Outputs

```yaml
- name: Run Tests
  id: test
  uses: aevsai/monkey-test@v0.6
  with:
    api-key: ${{ secrets.BROWSER_USE_API_KEY }}
    test-directory: tests

- name: Check Results
  run: |
    echo "Total: ${{ steps.test.outputs.total-tests }}"
    echo "Passed: ${{ steps.test.outputs.passed-tests }}"
    echo "Failed: ${{ steps.test.outputs.failed-tests }}"
    echo "Success Rate: ${{ steps.test.outputs.success-rate }}"

- name: Fail if Error Rate Too High
  if: steps.test.outputs.error-tests > 2
  run: exit 1
```

## Examples

### Example 7: Multi-Environment Testing

```yaml
name: Multi-Environment Tests

on:
  pull_request:

jobs:
  test:
    strategy:
      matrix:
        environment: [staging, production]
        model: [gpt-4-turbo-preview, gpt-3.5-turbo]
    
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Test ${{ matrix.environment }}
        uses: aevsai/monkey-test@v0.6
        with:
          from-commit: ${{ github.event.pull_request.base.sha }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          test-generation-model: ${{ matrix.model }}
          max-test-cases: 5
        env:
          TEST_ENV: ${{ matrix.environment }}

      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-${{ matrix.environment }}-${{ matrix.model }}
          path: artifacts/
```

### Example 8: Scheduled Regression Testing

```yaml
name: Daily Regression Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:

jobs:
  regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate Tests from Last 24h Changes
        uses: aevsai/monkey-test@v0.6
        with:
          from-commit: HEAD~10
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          max-test-cases: 20
          timeout: 600

      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: regression-${{ github.run_id }}
          path: |
            .monkey-test-generated/
            artifacts/
            test-results.json

      - name: Notify on Failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🚨 Regression Tests Failed',
              body: `Regression tests failed on ${new Date().toISOString()}\n\nCheck [workflow run](${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId})`,
              labels: ['bug', 'regression']
            });
```

### Example 9: Conditional Testing

```yaml
name: Smart Testing

on:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check Changed Files
        id: changes
        run: |
          CHANGED_FILES=$(git diff --name-only ${{ github.event.pull_request.base.sha }} ${{ github.sha }})
          echo "files=$CHANGED_FILES" >> $GITHUB_OUTPUT
          
          if echo "$CHANGED_FILES" | grep -q "frontend/"; then
            echo "has_frontend=true" >> $GITHUB_OUTPUT
          fi
          
          if echo "$CHANGED_FILES" | grep -q "api/"; then
            echo "has_api=true" >> $GITHUB_OUTPUT
          fi

      # Only generate tests if frontend changed
      - name: Generate Frontend Tests
        if: steps.changes.outputs.has_frontend == 'true'
        uses: aevsai/monkey-test@v0.6
        with:
          from-commit: ${{ github.event.pull_request.base.sha }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          max-test-cases: 10

      # Run manual tests if API changed
      - name: Run Manual API Tests
        if: steps.changes.outputs.has_api == 'true'
        uses: aevsai/monkey-test@v0.6
        with:
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          test-directory: tests/api
```

### Example 10: Cost-Optimized Preview

```yaml
name: Cost-Optimized Testing

on:
  pull_request:

jobs:
  # Cheap preview (OpenAI only, no execution)
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Preview Tests (GPT-3.5)
        uses: aevsai/monkey-test@v0.6
        with:
          from-commit: ${{ github.event.pull_request.base.sha }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          generate-only: true
          test-generation-model: gpt-3.5-turbo
          max-test-cases: 5

      - name: Upload Preview
        uses: actions/upload-artifact@v4
        with:
          name: preview
          path: .monkey-test-generated/

  # Full execution (on approval)
  execute:
    needs: preview
    runs-on: ubuntu-latest
    environment: production  # Requires approval
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate and Execute (GPT-4)
        uses: aevsai/monkey-test@v0.6
        with:
          from-commit: ${{ github.event.pull_request.base.sha }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          test-generation-model: gpt-4-turbo-preview
          max-test-cases: 10
```

## Troubleshooting

### Common Issues

**Action fails with "api-key required"**
- Ensure `BROWSER_USE_API_KEY` secret is set
- Check that secret name matches in workflow

**Action fails with "openai-api-key required"**
- Set `OPENAI_API_KEY` secret for diff mode
- Ensure you're using `from-commit` input

**No tests generated**
- Check if diff is empty (no changes)
- Verify commit reference is valid
- Check OpenAI API quota

**Tests fail to execute**
- Verify `BROWSER_USE_API_KEY` is valid
- Check timeout settings (increase if needed)
- Review test logs in artifacts

## Support

- **Documentation**: https://github.com/aevsai/monkey-test/blob/main/README.md
- **Issues**: https://github.com/aevsai/monkey-test/issues
- **Examples**: https://github.com/aevsai/monkey-test/tree/main/examples

## Version Compatibility

- `v0.6+`: Diff-based test generation support
- `v0.5`: Standard mode only
- Latest: `@v0.6` or `@main`

## Migration from v0.5

### Before (v0.5)
```yaml
- uses: aevsai/monkey-test@v0.5
  with:
    api-key: ${{ secrets.BROWSER_USE_API_KEY }}
    test-directory: tests
```

### After (v0.6 - Same behavior)
```yaml
- uses: aevsai/monkey-test@v0.6
  with:
    api-key: ${{ secrets.BROWSER_USE_API_KEY }}
    test-directory: tests
```

### New Feature (v0.6 - Diff mode)
```yaml
- uses: aevsai/monkey-test@v0.6
  with:
    from-commit: main
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    api-key: ${{ secrets.BROWSER_USE_API_KEY }}
```

**Backward compatible**: All v0.5 workflows work with v0.6!

---

**Last Updated**: January 2024  
**Action Version**: v0.6