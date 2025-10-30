# Quick Reference: Diff-Based Test Generation

## Installation

```bash
cd monkey-test
pnpm install
pnpm build
```

## Required Setup

```bash
# For test generation
export OPENAI_API_KEY="sk-..."

# For test execution
export BROWSER_USE_API_KEY="bu_..."
```

## Basic Commands

```bash
# Standard mode - run existing tests
monkey-test

# Generate tests from commit diff
monkey-test --from-commit <ref>

# Generate only (no execution)
monkey-test --from-commit <ref> --generate-only

# Show help
monkey-test --help
```

## Commit References

```bash
# Branch names
--from-commit main
--from-commit develop

# Relative references
--from-commit HEAD~1    # 1 commit ago
--from-commit HEAD~3    # 3 commits ago
--from-commit HEAD^     # Parent commit

# Commit SHA
--from-commit abc123

# Tags
--from-commit v1.0.0
```

## Environment Variables (Quick)

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | OpenAI API key (required for diff mode) |
| `BROWSER_USE_API_KEY` | - | Browser Use API key (required for execution) |
| `TEST_GENERATION_MODEL` | `gpt-4-turbo-preview` | Model for generation |
| `MAX_TEST_CASES` | `10` | Max tests to generate |
| `MAX_DIFF_SIZE` | `100000` | Max diff size (chars) |
| `MAX_CONCURRENCY` | `3` | Concurrent test execution |
| `TIMEOUT` | `300` | Test timeout (seconds) |
| `ARTIFACT_DIR` | `artifacts` | Artifact storage |

## Common Use Cases

### Preview Tests (No Execution)
```bash
OPENAI_API_KEY="sk-..." \
  monkey-test --from-commit main --generate-only

# View generated tests
ls .monkey-test-generated/
cat .monkey-test-generated/*.md
```

### Generate and Execute
```bash
OPENAI_API_KEY="sk-..." \
BROWSER_USE_API_KEY="bu_..." \
  monkey-test --from-commit main
```

### PR Testing
```bash
# Get base commit
BASE=$(git merge-base HEAD origin/main)

# Generate tests
monkey-test --from-commit $BASE
```

### Custom Configuration
```bash
MAX_TEST_CASES=20 \
MAX_DIFF_SIZE=200000 \
TEST_GENERATION_MODEL="gpt-4" \
  monkey-test --from-commit HEAD~5
```

## Output Locations

```
artifacts/                           # Artifacts
├── diff-<timestamp>.txt            # Git diff
├── llm-response-<timestamp>.txt    # LLM response
├── test-results-<timestamp>.json   # Results (JSON)
└── test-results-<timestamp>.md     # Results (Markdown)

.monkey-test-generated/             # Generated tests
├── 1-test-name.md
├── 2-another-test.md
└── ...

browser-use-outputs/                # Test outputs
└── <test-name>/
    ├── screenshot-1.png
    └── output.txt
```

## GitHub Actions Setup

### 1. Add Secrets
Repository Settings → Secrets and variables → Actions:
- `OPENAI_API_KEY`
- `BROWSER_USE_API_KEY`

### 2. Use Workflow
File already exists: `.github/workflows/diff-test.yml`

### 3. Trigger
- Automatic: On PR or push to main/develop
- Manual: Actions tab → "Diff-Based Test Generation" → Run workflow

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "OPENAI_API_KEY not set" | `export OPENAI_API_KEY="sk-..."` |
| "Not a git repository" | Run from git repository root |
| "Invalid commit reference" | Check: `git log --oneline` |
| "No changes found" | Diff is empty, try different commit |
| "Failed to parse XML" | Retry or change model |
| "Diff size exceeds limit" | Increase `MAX_DIFF_SIZE` |

## Cost Estimation

### OpenAI
- **GPT-4 Turbo**: ~$0.10-0.30 per generation
- **GPT-3.5 Turbo**: ~$0.01-0.03 per generation

### Browser Use
- Varies by plan (check pricing page)

### Tips
- Use `--generate-only` to preview without execution cost
- Use GPT-3.5 for simple changes
- Set `MAX_TEST_CASES` to limit generation

## Workflow

```
1. Make code changes
2. Commit changes
3. Generate tests: monkey-test --from-commit main --generate-only
4. Review tests in .monkey-test-generated/
5. Execute tests: monkey-test --from-commit main
6. Check results in artifacts/
7. (Optional) Push to trigger GitHub Actions
```

## Examples

### Example 1: Quick Preview
```bash
# Generate tests without running
OPENAI_API_KEY="sk-..." \
  monkey-test --from-commit main --generate-only

# Count generated tests
ls .monkey-test-generated/*.md | wc -l
```

### Example 2: Full Test Run
```bash
# Set both keys
export OPENAI_API_KEY="sk-..."
export BROWSER_USE_API_KEY="bu_..."

# Run against main
monkey-test --from-commit main

# Check results
cat artifacts/test-results-*.md
```

### Example 3: Testing Last N Commits
```bash
# Test last 3 commits
monkey-test --from-commit HEAD~3

# Test last 5 commits with more tests
MAX_TEST_CASES=15 \
  monkey-test --from-commit HEAD~5
```

### Example 4: Feature Branch
```bash
# On feature branch
git checkout feature/new-feature

# Test against main
monkey-test --from-commit origin/main

# Or against develop
monkey-test --from-commit origin/develop
```

## Key Files

| File | Purpose |
|------|---------|
| `README.md` | Main documentation |
| `docs/diff-testing-guide.md` | Comprehensive guide (679 lines) |
| `docs/QUICK_REFERENCE.md` | This file |
| `.github/workflows/diff-test.yml` | CI/CD workflow |
| `examples/diff-test-demo.sh` | Demo script |
| `IMPLEMENTATION_SUMMARY.md` | Implementation details |

## Demo Script

```bash
# Run interactive demo
./examples/diff-test-demo.sh
```

## Support

- **Issues**: https://github.com/yourusername/monkey-test/issues
- **Documentation**: `docs/` directory
- **Examples**: `examples/` directory

## Cheat Sheet

```bash
# Most common commands
monkey-test --help                              # Help
monkey-test                                     # Run existing tests
monkey-test --from-commit main --generate-only  # Preview
monkey-test --from-commit main                  # Generate + Run
monkey-test --from-commit HEAD~1                # Last commit

# With options
MAX_TEST_CASES=5 monkey-test --from-commit main
TEST_GENERATION_MODEL="gpt-3.5-turbo" monkey-test --from-commit main
MAX_CONCURRENCY=5 monkey-test --from-commit main

# Check outputs
ls .monkey-test-generated/                      # Generated tests
ls artifacts/                                   # Artifacts
cat artifacts/test-results-*.md                 # Results
```

## Next Steps

1. Read: `docs/diff-testing-guide.md` for details
2. Try: `examples/diff-test-demo.sh` for hands-on
3. Setup: GitHub Actions for automation
4. Customize: Adjust environment variables
5. Integrate: Add to your CI/CD pipeline

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Status**: Production Ready