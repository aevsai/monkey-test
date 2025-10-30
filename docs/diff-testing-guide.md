# Diff-Based Test Generation Guide

Comprehensive guide for using MonkeyTest's AI-powered test generation from git diffs.

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [GitHub Actions Setup](#github-actions-setup)
- [Advanced Usage](#advanced-usage)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)

## Overview

Diff-based test generation automatically creates browser test cases by analyzing code changes between git commits. The system uses GPT-4 to understand your changes and generate relevant end-to-end tests.

### Key Benefits

- **Automatic Test Coverage**: Tests are generated for every code change
- **Time Saving**: No manual test writing for routine changes
- **Consistent Quality**: AI ensures comprehensive test coverage
- **CI/CD Integration**: Seamless GitHub Actions integration
- **Documentation**: Generated tests serve as documentation for changes

### When to Use

✅ **Good Use Cases:**
- New feature development
- UI changes and updates
- API endpoint additions/modifications
- Bug fixes that need regression testing
- Refactoring with behavioral changes

❌ **Not Ideal For:**
- Pure refactoring (no behavior change)
- Configuration file changes
- Documentation-only updates
- Internal implementation details
- Non-user-facing changes

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    Diff-Based Test Generation Flow              │
└─────────────────────────────────────────────────────────────────┘

1. Git Diff Extraction
   ├─ Compare HEAD with specified commit
   ├─ Filter binary files
   ├─ Collect file changes, insertions, deletions
   └─ Truncate if exceeds max size

2. LLM Analysis (GPT-4)
   ├─ Send diff with context
   ├─ AI analyzes code changes
   ├─ Identifies testable functionality
   └─ Generates test cases in XML format

3. XML Parsing & Validation
   ├─ Parse <testplan><testcase>...</testcase></testplan>
   ├─ Extract test name, description, task
   ├─ Validate test case structure
   └─ Handle parsing errors

4. Markdown Conversion
   ├─ Convert XML to markdown format
   ├─ Add frontmatter metadata
   ├─ Save to .monkey-test-generated/ directory
   └─ Create one .md file per test

5. Test Execution (Optional)
   ├─ Initialize Browser Use client
   ├─ Run generated tests concurrently
   ├─ Capture screenshots and outputs
   └─ Collect results

6. Artifact Generation
   ├─ Save git diff
   ├─ Save raw LLM response
   ├─ Save generated test files
   ├─ Save execution results (JSON + MD)
   └─ Upload to GitHub Actions (if CI)

7. Reporting
   ├─ Generate test summary
   ├─ Create GitHub Actions summary
   ├─ Comment on pull requests
   ├─ Add annotations for failures
   └─ Export statistics as outputs
```

## Prerequisites

### Required Tools

- **Node.js 18+**: Runtime environment
- **pnpm 8+**: Package manager
- **Git**: Version control (obviously!)
- **Browser Use API Key**: Get from [Browser Use Cloud](https://cloud.browser-use.com)
- **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com)

### Required Access

- Git repository with commit history
- API credits for OpenAI (test generation)
- API credits for Browser Use (test execution)

## Quick Start

### 1. Install MonkeyTest

```bash
cd monkey-test
pnpm install
pnpm build
```

### 2. Set Environment Variables

```bash
export OPENAI_API_KEY="sk-your-openai-key"
export BROWSER_USE_API_KEY="bu_your-browser-use-key"
```

### 3. Run Your First Diff Test

```bash
# Generate and run tests from changes since main branch
monkey-test --from-commit main
```

### 4. Preview Generated Tests (No Execution)

```bash
# Only generate tests, don't run them
monkey-test --from-commit main --generate-only

# View the generated tests
ls -la .monkey-test-generated/
cat .monkey-test-generated/1-*.md
```

## Configuration

### Environment Variables

#### Required for Diff Mode

```bash
# OpenAI API key for test generation
export OPENAI_API_KEY="sk-..."

# Browser Use API key for test execution
export BROWSER_USE_API_KEY="bu_..."
```

#### Optional Configuration

```bash
# LLM Model Selection
export TEST_GENERATION_MODEL="gpt-4-turbo-preview"  # Model for generating tests
export LLM_MODEL="browser-use-llm"                   # Model for executing tests

# Test Generation Limits
export MAX_TEST_CASES=10          # Max number of tests to generate
export MAX_DIFF_SIZE=100000       # Max diff size in characters (100KB)

# Execution Settings
export MAX_CONCURRENCY=3          # Max concurrent test execution
export TIMEOUT=300                # Test timeout in seconds

# Output Directories
export ARTIFACT_DIR="./artifacts"                # Artifact storage
export OUTPUT_DIR="./browser-use-outputs"        # Test outputs

# Behavior Flags
export FAIL_ON_ERROR=true         # Exit with error if tests fail
export SAVE_OUTPUTS=true          # Save test outputs
```

### Command Line Arguments

```bash
# Specify commit reference
monkey-test --from-commit <commit-ref>

# Generate only (no execution)
monkey-test --from-commit <commit-ref> --generate-only

# Show help
monkey-test --help
```

### Commit Reference Formats

```bash
# Branch name
monkey-test --from-commit main
monkey-test --from-commit develop

# Relative references
monkey-test --from-commit HEAD~1    # 1 commit ago
monkey-test --from-commit HEAD~3    # 3 commits ago
monkey-test --from-commit HEAD^     # Parent commit

# Commit SHA
monkey-test --from-commit abc123def
monkey-test --from-commit abc123def456789

# Tags
monkey-test --from-commit v1.0.0
monkey-test --from-commit release-2024-01
```

## GitHub Actions Setup

### Step 1: Add Repository Secrets

Go to your repository settings → Secrets and variables → Actions:

1. Add `OPENAI_API_KEY`: Your OpenAI API key
2. Add `BROWSER_USE_API_KEY`: Your Browser Use API key

### Step 2: Create Workflow File

The workflow file is already provided at `.github/workflows/diff-test.yml`.

### Step 3: Workflow Configuration

The workflow includes two jobs:

#### Job 1: `generate-and-test`
- Generates tests from PR/commit diff
- Executes the tests
- Uploads artifacts
- Comments on PRs with results

#### Job 2: `generate-only`
- Preview job that only generates tests
- Runs on PRs to show what tests would be created
- Faster feedback without full execution

### Step 4: Customize Workflow (Optional)

Edit `.github/workflows/diff-test.yml`:

```yaml
# Change model
- name: Generate and run tests
  env:
    TEST_GENERATION_MODEL: gpt-4-turbo-preview  # or gpt-4, gpt-3.5-turbo

# Change concurrency
- name: Generate and run tests
  env:
    MAX_CONCURRENCY: 5  # Run more tests in parallel

# Change test limits
- name: Generate and run tests
  env:
    MAX_TEST_CASES: 20  # Generate more tests
    MAX_DIFF_SIZE: 200000  # Allow larger diffs
```

## Advanced Usage

### Scenario 1: Testing Feature Branches

```bash
# Compare feature branch against main
git checkout feature/new-ui
monkey-test --from-commit main
```

### Scenario 2: Testing Specific Commit Range

```bash
# Test changes in last 5 commits
monkey-test --from-commit HEAD~5

# Test changes since specific commit
monkey-test --from-commit abc123
```

### Scenario 3: Custom Test Generation Model

```bash
# Use GPT-3.5 for faster/cheaper generation
TEST_GENERATION_MODEL="gpt-3.5-turbo" \
  monkey-test --from-commit main --generate-only

# Use GPT-4 for better quality
TEST_GENERATION_MODEL="gpt-4" \
  monkey-test --from-commit main
```

### Scenario 4: Large Diffs

```bash
# Increase diff size limit for large changes
MAX_DIFF_SIZE=500000 MAX_TEST_CASES=20 \
  monkey-test --from-commit main
```

### Scenario 5: Local Testing Before CI

```bash
# 1. Generate tests locally
monkey-test --from-commit main --generate-only

# 2. Review generated tests
ls .monkey-test-generated/
cat .monkey-test-generated/*.md

# 3. Edit if needed
vim .monkey-test-generated/1-test-name.md

# 4. Run edited tests manually
TEST_DIRECTORY=.monkey-test-generated monkey-test
```

### Scenario 6: Integration with Pre-commit Hooks

Create `.git/hooks/pre-push`:

```bash
#!/bin/bash
# Generate tests before pushing

echo "Generating tests from changes..."
OPENAI_API_KEY="${OPENAI_API_KEY}" \
  monkey-test --from-commit origin/main --generate-only

if [ $? -eq 0 ]; then
  echo "✅ Tests generated successfully"
  exit 0
else
  echo "❌ Test generation failed"
  exit 1
fi
```

## Best Practices

### 1. Commit Reference Selection

**For PRs:**
```bash
# Use PR base branch
monkey-test --from-commit origin/main
```

**For Development:**
```bash
# Test recent changes
monkey-test --from-commit HEAD~1
```

**For Releases:**
```bash
# Test against last release
monkey-test --from-commit v1.0.0
```

### 2. Test Generation Limits

- **Small changes (1-5 files)**: `MAX_TEST_CASES=5`
- **Medium changes (5-15 files)**: `MAX_TEST_CASES=10`
- **Large changes (15+ files)**: `MAX_TEST_CASES=20`

### 3. Model Selection

- **Development/Preview**: `gpt-3.5-turbo` (faster, cheaper)
- **Production/CI**: `gpt-4-turbo-preview` (higher quality)
- **Critical features**: `gpt-4` (most thorough)

### 4. Cost Optimization

```bash
# Preview tests without execution to save Browser Use credits
monkey-test --from-commit main --generate-only

# Use smaller models for simple changes
TEST_GENERATION_MODEL="gpt-3.5-turbo" monkey-test --from-commit main

# Limit test count for large diffs
MAX_TEST_CASES=5 monkey-test --from-commit main
```

### 5. Review Generated Tests

Always review generated tests before relying on them:

```bash
# Generate without running
monkey-test --from-commit main --generate-only

# Review each test
for file in .monkey-test-generated/*.md; do
  echo "=== $file ==="
  cat "$file"
  echo ""
done
```

### 6. Combine with Manual Tests

```bash
# Keep manual tests in tests/
# Generated tests go to .monkey-test-generated/

# Run both:
monkey-test                          # Manual tests
monkey-test --from-commit main       # Generated tests
```

## Troubleshooting

### Issue: "OPENAI_API_KEY environment variable is required"

**Solution:**
```bash
export OPENAI_API_KEY="sk-your-key-here"
```

### Issue: "Not a git repository"

**Solution:**
```bash
# Ensure you're in a git repository
git status

# Initialize git if needed
git init
```

### Issue: "Invalid commit reference: main"

**Solution:**
```bash
# Check available branches
git branch -a

# Use correct branch name
monkey-test --from-commit origin/main
```

### Issue: "No changes found between commits"

**Cause:** The diff is empty (comparing identical commits)

**Solution:**
```bash
# Check what would be compared
git diff HEAD main

# Try different reference
monkey-test --from-commit HEAD~1
```

### Issue: "Failed to parse XML response"

**Cause:** LLM generated invalid XML

**Solutions:**
1. Try running again (LLMs can occasionally fail)
2. Check your OpenAI API credits
3. Try different model: `TEST_GENERATION_MODEL="gpt-4"`
4. Reduce diff size: `MAX_DIFF_SIZE=50000`

### Issue: "Diff size exceeds max size"

**Solution:**
```bash
# Increase limit
MAX_DIFF_SIZE=200000 monkey-test --from-commit main

# Or reduce commit range
monkey-test --from-commit HEAD~1  # Instead of HEAD~10
```

### Issue: "No test cases generated from LLM response"

**Causes:**
- Changes are not testable in browser (backend-only, config files)
- LLM couldn't identify testable scenarios
- API rate limit reached

**Solutions:**
```bash
# Check the raw LLM response
cat artifacts/llm-response-*.txt

# Try with more test cases allowed
MAX_TEST_CASES=20 monkey-test --from-commit main

# Use better model
TEST_GENERATION_MODEL="gpt-4" monkey-test --from-commit main
```

### Issue: GitHub Actions workflow fails

**Check:**
1. Secrets are set correctly (OPENAI_API_KEY, BROWSER_USE_API_KEY)
2. Workflow has proper permissions
3. Repository has sufficient history (fetch-depth: 0)
4. Check workflow logs for specific error

## Examples

### Example 1: Simple Feature Branch Test

```bash
# Create feature branch
git checkout -b feature/add-login

# Make changes
# ... code changes ...
git add .
git commit -m "Add login functionality"

# Generate tests comparing to main
monkey-test --from-commit main

# Review results
ls .monkey-test-generated/
cat artifacts/test-results-*.md
```

### Example 2: PR Preview

```bash
# On PR branch
git checkout feature/new-dashboard

# Preview what tests would be generated
OPENAI_API_KEY="sk-..." \
  monkey-test --from-commit origin/main --generate-only

# Review generated tests
cat .monkey-test-generated/*.md

# If satisfied, run them
BROWSER_USE_API_KEY="bu_..." \
  monkey-test --from-commit origin/main
```

### Example 3: Release Testing

```bash
# Test all changes since last release
monkey-test --from-commit v1.0.0

# Save results
mkdir -p release-tests/
cp -r .monkey-test-generated/ release-tests/generated-tests/
cp -r artifacts/ release-tests/artifacts/
```

### Example 4: Incremental Testing

```bash
# Test each commit separately
for commit in $(git rev-list HEAD~5..HEAD); do
  echo "Testing commit $commit"
  monkey-test --from-commit $commit^ --generate-only
  mv .monkey-test-generated ".monkey-test-generated-$commit"
done
```

### Example 5: Custom Prompt (Advanced)

Modify `src/test-generator.ts` to customize the LLM prompt:

```typescript
function buildTestGenerationPrompt(diffResult: GitDiffResult, maxTestCases: number): string {
  return `You are a QA engineer specializing in e-commerce testing.
  
Focus on:
- Shopping cart functionality
- Payment flows
- Product search and filtering
- User account management

Generate ${maxTestCases} test cases for these changes:

${diffResult.diff}
`;
}
```

## Workflow Outputs

### Artifacts Generated

```
artifacts/
├── diff-<timestamp>.txt              # Git diff used
├── llm-response-<timestamp>.txt      # Raw LLM output
├── test-results-<timestamp>.json     # Test results (JSON)
└── test-results-<timestamp>.md       # Test results (Markdown)

.monkey-test-generated/
├── 1-test-case-name.md              # Generated test 1
├── 2-another-test.md                # Generated test 2
└── ...

browser-use-outputs/
└── <test-name>/
    ├── screenshot-1.png             # Screenshots
    └── output.txt                   # Test output
```

### GitHub Actions Outputs

**Available Outputs:**
- `total_tests`: Total number of tests
- `passed_tests`: Number of passed tests
- `failed_tests`: Number of failed tests
- `error_tests`: Number of error tests
- `success_rate`: Success rate percentage

**Use in subsequent steps:**
```yaml
- name: Check test results
  run: |
    echo "Total: ${{ steps.test.outputs.total_tests }}"
    echo "Passed: ${{ steps.test.outputs.passed_tests }}"
    if [ "${{ steps.test.outputs.failed_tests }}" -gt 0 ]; then
      echo "Tests failed!"
      exit 1
    fi
```

## API Cost Estimation

### OpenAI Costs (Test Generation)

**GPT-4 Turbo:**
- Input: ~$0.01 per 1K tokens
- Output: ~$0.03 per 1K tokens
- Typical diff: 2-5K tokens
- Typical response: 1-3K tokens
- **Cost per generation: ~$0.10-0.30**

**GPT-3.5 Turbo:**
- Input: ~$0.0005 per 1K tokens
- Output: ~$0.0015 per 1K tokens
- **Cost per generation: ~$0.01-0.03**

### Browser Use Costs (Test Execution)

- Varies by plan
- Typically per-task or per-minute pricing
- Check [Browser Use Pricing](https://browser-use.com/pricing)

### Cost Optimization Tips

1. Use `--generate-only` for previews (no Browser Use cost)
2. Use GPT-3.5 for simple changes
3. Set `MAX_TEST_CASES` to limit generation
4. Use `MAX_DIFF_SIZE` to limit input tokens
5. Run tests on-demand vs. every commit

## Support

- **GitHub Issues**: [Create an issue](https://github.com/yourusername/monkey-test/issues)
- **Documentation**: [Main README](../README.md)
- **Browser Use Docs**: [Browser Use Documentation](https://docs.browser-use.com)

## License

MIT License - see LICENSE file for details