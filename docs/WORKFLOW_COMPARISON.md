# Workflow Comparison: Standard vs Diff-Based Testing

Visual comparison of the two testing modes available in MonkeyTest.

## Quick Comparison Table

| Feature | Standard Mode | Diff-Based Mode |
|---------|--------------|-----------------|
| **Test Source** | Pre-written markdown files | Auto-generated from git diff |
| **Setup Complexity** | Low (just write tests) | Medium (needs OpenAI API) |
| **API Keys Required** | Browser Use only | Browser Use + OpenAI |
| **Use Case** | Manual test scenarios | PR/commit testing |
| **Cost** | Browser Use execution only | OpenAI generation + Browser Use execution |
| **Speed** | Fast (no generation) | Slower (generation + execution) |
| **Test Quality** | Human-curated | AI-generated (variable) |
| **Maintenance** | Manual updates needed | Automatic for code changes |

## Mode 1: Standard Mode (v0.5 Compatible)

### Use Case
Run pre-written test cases from your repository.

### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Standard Mode Flow                        │
└─────────────────────────────────────────────────────────────┘

Developer writes tests manually
    │
    ├─ Create tests/login.md
    ├─ Create tests/checkout.md
    └─ Create tests/search.md
    │
    v
┌──────────────────────────┐
│  Push to Repository      │
└────────────┬─────────────┘
             │
             v
┌──────────────────────────┐
│  GitHub Actions Trigger  │
└────────────┬─────────────┘
             │
             v
┌──────────────────────────┐
│  Checkout Repository     │
└────────────┬─────────────┘
             │
             v
┌──────────────────────────┐
│  Run MonkeyTest Action   │
│  with test-directory     │
└────────────┬─────────────┘
             │
             v
┌──────────────────────────┐
│  Browser Use reads       │
│  markdown test files     │
└────────────┬─────────────┘
             │
             v
┌──────────────────────────┐
│  Execute tests           │
│  (Browser automation)    │
└────────────┬─────────────┘
             │
             v
┌──────────────────────────┐
│  Collect results         │
│  Generate report         │
└────────────┬─────────────┘
             │
             v
    Upload Artifacts
    Show Summary
    ✅ Done!
```

### Example Workflow

```yaml
name: Standard Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Tests
        uses: aevsai/monkey-test@v0.6
        with:
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          test-directory: tests

      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results.json
```

### Pros ✅
- Simple setup
- Predictable tests
- Human-curated quality
- Fast execution
- Lower cost (no LLM generation)
- Full control over test scenarios

### Cons ❌
- Manual test writing required
- Tests can become outdated
- Doesn't scale with rapid development
- Requires test maintenance

---

## Mode 2: Diff-Based Mode (v0.6 New Feature)

### Use Case
Automatically generate tests from code changes in PRs or commits.

### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   Diff-Based Mode Flow                       │
└─────────────────────────────────────────────────────────────┘

Developer makes code changes
    │
    ├─ Modify src/login.tsx
    ├─ Update api/checkout.ts
    └─ Change components/search.tsx
    │
    v
┌──────────────────────────┐
│  Create PR / Push        │
└────────────┬─────────────┘
             │
             v
┌──────────────────────────┐
│  GitHub Actions Trigger  │
└────────────┬─────────────┘
             │
             v
┌──────────────────────────┐
│  Checkout with History   │
│  (fetch-depth: 0)        │
└────────────┬─────────────┘
             │
             v
┌──────────────────────────┐
│  Extract Git Diff        │
│  (compare commits)       │
└────────────┬─────────────┘
             │
             v
┌──────────────────────────┐
│  Send Diff to GPT-4      │
│  with prompt             │
└────────────┬─────────────┘
             │
             v
┌──────────────────────────┐
│  LLM analyzes changes    │
│  Generates test cases    │
│  Returns XML             │
└────────────┬─────────────┘
             │
             v
┌──────────────────────────┐
│  Parse XML response      │
│  Convert to markdown     │
└────────────┬─────────────┘
             │
             v
┌──────────────────────────┐
│  Save generated tests    │
│  to temp directory       │
└────────────┬─────────────┘
             │
             v
┌──────────────────────────┐
│  Execute generated tests │
│  (Browser Use)           │
└────────────┬─────────────┘
             │
             v
┌──────────────────────────┐
│  Collect results         │
│  Save artifacts          │
└────────────┬─────────────┘
             │
             v
    Upload Artifacts
    - Generated tests
    - Diff
    - LLM response
    - Test results
    Comment on PR
    ✅ Done!
```

### Example Workflow

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
          max-test-cases: 10

      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: auto-test-results
          path: |
            .monkey-test-generated/
            artifacts/
            test-results.json
```

### Pros ✅
- Zero manual test writing
- Tests always match code changes
- Scales automatically with development
- Fresh perspective from AI
- Documents what changed
- Catches edge cases you might miss

### Cons ❌
- Requires OpenAI API key
- Higher cost (LLM + execution)
- Slower (generation step)
- AI-generated quality varies
- May generate irrelevant tests
- Requires review of generated tests

---

## Hybrid Approach (Recommended)

Combine both modes for comprehensive coverage!

### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Hybrid Testing Flow                      │
└─────────────────────────────────────────────────────────────┘

    Pull Request Created
            │
            ├─────────────────────┐
            │                     │
            v                     v
    ┌───────────────┐     ┌──────────────┐
    │  Job 1:       │     │  Job 2:      │
    │  Manual Tests │     │  Auto Tests  │
    └───────┬───────┘     └──────┬───────┘
            │                     │
            │                     │
    Run existing tests    Generate from diff
    from tests/           Execute generated
            │                     │
            └─────────┬───────────┘
                      │
                      v
              ┌───────────────┐
              │  Job 3:       │
              │  Combine      │
              │  Report       │
              └───────────────┘
                      │
                      v
              Comprehensive
              Test Coverage!
```

### Example Hybrid Workflow

```yaml
name: Comprehensive Testing

on:
  pull_request:
    branches: [main]

jobs:
  # Critical manual tests (always run)
  manual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Manual Tests
        uses: aevsai/monkey-test@v0.6
        with:
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          test-directory: tests/critical

      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: manual-results
          path: test-results.json

  # Auto-generated tests (from changes)
  auto-tests:
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
          max-test-cases: 5

      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: auto-results
          path: |
            .monkey-test-generated/
            test-results.json

  # Combined report
  report:
    needs: [manual-tests, auto-tests]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4

      - name: Create Report
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            
            let comment = '## 🧪 Test Results\n\n';
            
            // Manual tests
            if (fs.existsSync('manual-results/test-results.json')) {
              const manual = JSON.parse(fs.readFileSync('manual-results/test-results.json'));
              comment += `### Manual Tests\n`;
              comment += `- Total: ${manual.summary.total}\n`;
              comment += `- Passed: ${manual.summary.passed}\n`;
              comment += `- Failed: ${manual.summary.failed}\n\n`;
            }
            
            // Auto tests
            if (fs.existsSync('auto-results/test-results.json')) {
              const auto = JSON.parse(fs.readFileSync('auto-results/test-results.json'));
              comment += `### Auto-Generated Tests\n`;
              comment += `- Total: ${auto.summary.total}\n`;
              comment += `- Passed: ${auto.summary.passed}\n`;
              comment += `- Failed: ${auto.summary.failed}\n\n`;
            }
            
            await github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

---

## Cost Comparison

### Standard Mode
```
Cost per PR = Browser Use execution cost only

Example:
- 10 tests
- ~30 seconds each
- Browser Use: $X per minute
= 10 × 0.5 min × $X = 5X cost
```

### Diff-Based Mode
```
Cost per PR = OpenAI generation + Browser Use execution

Example:
- Generate 5 tests (GPT-4 Turbo)
  - Input: ~3K tokens × $0.01/1K = $0.03
  - Output: ~2K tokens × $0.03/1K = $0.06
  - Generation cost: ~$0.09
- Execute 5 tests
  - 5 × 0.5 min × $X = 2.5X cost
= $0.09 + 2.5X total cost
```

### Hybrid Mode
```
Cost per PR = Standard + Diff-Based

Example:
- 5 critical manual tests = 2.5X
- 5 auto-generated tests = $0.09 + 2.5X
= $0.09 + 5X total cost
```

### Cost Optimization Tips

1. **Use `generate-only` for preview** (no execution cost)
2. **Use GPT-3.5 for simple changes** (~90% cheaper generation)
3. **Limit `max-test-cases`** (fewer tests = lower cost)
4. **Use conditional execution** (only on certain file changes)
5. **Require approval for full runs** (use GitHub environments)

---

## When to Use Which Mode

### Use Standard Mode When:
- ✅ You have well-defined test scenarios
- ✅ Tests are stable and rarely change
- ✅ You want full control over test quality
- ✅ Cost is a primary concern
- ✅ Speed is critical
- ✅ Testing production-critical flows

### Use Diff-Based Mode When:
- ✅ Rapid development with frequent changes
- ✅ PR review process benefits from auto-tests
- ✅ You want to catch regressions automatically
- ✅ Documentation of changes is valuable
- ✅ Team is comfortable reviewing AI-generated tests
- ✅ Testing new features before manual tests exist

### Use Hybrid Mode When:
- ✅ You want best of both worlds
- ✅ Critical paths need manual tests
- ✅ New changes need automatic coverage
- ✅ Maximum test coverage is goal
- ✅ Budget allows for both approaches

---

## Migration Path

### Step 1: Start with Standard Mode (v0.5)
```yaml
- uses: aevsai/monkey-test@v0.5
  with:
    api-key: ${{ secrets.BROWSER_USE_API_KEY }}
    test-directory: tests
```

### Step 2: Add Diff-Based Preview (v0.6)
```yaml
# Keep existing tests
- uses: aevsai/monkey-test@v0.6
  with:
    api-key: ${{ secrets.BROWSER_USE_API_KEY }}
    test-directory: tests

# Add preview job
- uses: aevsai/monkey-test@v0.6
  with:
    from-commit: main
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    generate-only: true
```

### Step 3: Enable Full Auto-Testing (v0.6)
```yaml
# Manual tests
- uses: aevsai/monkey-test@v0.6
  with:
    api-key: ${{ secrets.BROWSER_USE_API_KEY }}
    test-directory: tests

# Auto tests
- uses: aevsai/monkey-test@v0.6
  with:
    from-commit: main
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    api-key: ${{ secrets.BROWSER_USE_API_KEY }}
```

---

## Summary

| Aspect | Standard | Diff-Based | Hybrid |
|--------|----------|------------|--------|
| **Setup Effort** | High | Low | Medium |
| **Runtime Cost** | Low | Medium | High |
| **Test Quality** | High | Variable | High |
| **Maintenance** | High | Low | Medium |
| **Coverage** | Manual | Automatic | Both |
| **Best For** | Stable apps | Rapid dev | Production |

**Recommendation**: Start with Standard mode, add Diff-Based previews, then upgrade to Hybrid for production.

---

**Version**: 1.0.0  
**Last Updated**: January 2024