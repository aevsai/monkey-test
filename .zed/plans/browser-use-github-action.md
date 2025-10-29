# Browser Use GitHub Action - Implementation Plan

## Understanding the Task

Create a **reusable Docker-based GitHub Action** that:
- Runs in an isolated Docker container
- Action files located at repository root (following GitHub Actions best practices)
- Accepts Browser Use Cloud API key as input
- Accepts a directory path containing markdown files with test case descriptions
- Runs a Python script using Browser Use Cloud API to execute automated browser tests
- Each markdown file represents a test case with instructions for the AI agent
- Reports test results back to GitHub Actions

## Questions & Considerations

1. **Markdown Format**: Define a standard format for test case markdown files
2. **Test Execution**: Sequential or parallel test execution?
3. **Result Reporting**: How to report test results (action outputs, artifacts, annotations)?
4. **Failure Handling**: Should action fail if any test fails?
5. **API Model Selection**: Which LLM model to use (browser-use-llm, gpt-4.1, etc.)?
6. **Session Management**: Use auto-session (simple) or custom sessions (advanced)?
7. **Output Files**: Should we save screenshots/outputs from Browser Use?

## Edge Cases & Error Handling

- Empty or non-existent test directory
- Invalid markdown format in test files
- API authentication failures
- Browser Use API rate limits
- Network connectivity issues
- Task timeout handling
- Invalid task instructions

## Implementation Checklist

### Phase 1: Project Structure
- [x] Create action files at repository root (not in .github/actions/)
- [x] Create `action.yml` at root with inputs, outputs, and metadata
- [x] Create `Dockerfile` at root for container
- [x] Create `.dockerignore` at root for efficient builds
- [x] Create `requirements.txt` at root for Python dependencies
- [x] Create `src/` directory for source code organization
- [x] Create main Python script `src/run_tests.py`

### Phase 2: Action Definition (action.yml)
- [x] Define input: `api-key` (required, secret)
- [x] Define input: `test-directory` (required, path to markdown files)
- [x] Define input: `llm-model` (optional, default: browser-use-llm)
- [x] Define input: `fail-on-error` (optional, default: true)
- [x] Define input: `timeout` (optional, default: 300 seconds)
- [x] Define output: `results` (JSON string with test results)
- [x] Define output: `total-tests` (number)
- [x] Define output: `passed-tests` (number)
- [x] Define output: `failed-tests` (number)
- [x] Set up Docker container action with Python 3.11

### Phase 3: Python Script (run_tests.py)
- [x] Parse command line arguments
- [x] Initialize Browser Use SDK client
- [x] Scan test directory for markdown files
- [x] Define markdown test case format parser
- [x] Create function to execute single test case
- [x] Handle task creation and completion
- [x] Stream task progress and log to console
- [x] Collect test results (pass/fail/error)
- [x] Handle output files (screenshots, data)
- [x] Generate summary report
- [x] Save results as JSON
- [x] Exit with appropriate code based on results

### Phase 4: Markdown Test Case Format
- [x] Define standard format with frontmatter metadata
- [x] Support fields: `name`, `description`, `task`, `expected_output` (optional)
- [x] Support fields: `timeout`, `llm_model` (optional overrides)
- [x] Support input files reference

### Phase 5: Error Handling & Logging
- [x] Validate API key before starting
- [x] Handle file I/O errors
- [x] Handle API errors gracefully
- [x] Log detailed progress to GitHub Actions
- [x] Catch and report timeout errors
- [x] Provide actionable error messages

### Phase 6: Documentation
- [x] Create README.md with usage examples
- [x] Document markdown test case format
- [x] Provide example test cases
- [x] Document inputs/outputs
- [x] Add troubleshooting section

### Phase 7: Testing & Refinement
- [ ] Test with single test case (requires Browser Use API key)
- [ ] Test with multiple test cases (requires Browser Use API key)
- [ ] Test with invalid inputs
- [ ] Test with API failures
- [ ] Test timeout handling
- [ ] Verify output format

**Note**: Testing requires actual Browser Use API key and would be done by the user after deployment.

### Phase 8: Docker Container
- [x] Create Dockerfile with Python 3.11 slim base
- [x] Set up efficient layer caching (requirements first)
- [x] Configure Docker entrypoint
- [x] Create .dockerignore for build optimization
- [x] Update action.yml to use Docker instead of composite
- [x] Update documentation to reflect Docker approach
- [x] Update example workflows for Docker container
- [x] Test Docker build locally

### Phase 9: Repository Restructuring (NEW)
- [x] Move action files from .github/actions/ to repository root
- [x] Place action.yml at root (GitHub Actions best practice)
- [x] Place Dockerfile at root
- [x] Place requirements.txt at root
- [x] Create src/ directory for source code
- [x] Move run_tests.py to src/run_tests.py
- [x] Update Dockerfile to reference src/ directory
- [x] Update .dockerignore for new structure
- [x] Delete old .github/actions/browser-use-test/ directory
- [x] Update all documentation to reflect new structure
- [x] Update example workflows to use ./ instead of nested path
- [x] Update local testing scripts for new paths
- [x] Create STRUCTURE.md documenting repository organization

## Markdown Test Case Format (Proposed)

```markdown
---
name: "Search Hacker News"
description: "Verify search functionality on Hacker News"
timeout: 120
llm_model: "browser-use-llm"
---

# Task

Search for top 10 posts about "AI" on Hacker News and return their titles and URLs.

# Expected Output (Optional)

Should return a list of 10 items with title and URL fields.
```

## Implementation Details

### Dependencies
- `browser-use-sdk` - Browser Use Python SDK
- `pyyaml` - Parse markdown frontmatter
- `python-frontmatter` - Markdown frontmatter extraction
- `requests` - HTTP client

### Docker Container
- **Base Image**: python:3.11-slim
- **Size**: ~150-200MB (optimized)
- **Build Time**: ~30s first build, ~5s with cache
- **Benefits**: Consistency, isolation, portability

### Exit Codes
- 0: All tests passed
- 1: One or more tests failed (if fail-on-error=true)
- 2: Configuration/setup error

### Output Artifacts
- `test-results.json` - Detailed test results
- `browser-use-outputs/` - Directory with screenshots and output files from tasks

## Potential Improvements (Future)

- Support for test prerequisites/setup tasks
- Test dependencies (run X before Y)
- Parallel test execution option
- Custom result validators
- Integration with GitHub Check Runs API
- Support for Browser Use Sessions and Profiles
- Test retries on failure
- Performance metrics collection
- Multi-architecture Docker builds (ARM support)
- Docker image publishing to registry for faster pulls

## Implementation Notes

### Why Docker Container?

Docker container actions provide several advantages over composite actions:

1. **Consistency**: Identical environment locally and in CI/CD
2. **Isolation**: No conflicts with other actions or host system
3. **Portability**: Works anywhere Docker runs
4. **Version Control**: Entire environment is versioned
5. **Simplicity**: No need to install Python/dependencies in workflow
6. **Security**: Isolated execution environment

### Docker vs Composite

**Composite Action** (original approach):
- Uses `actions/setup-python@v5`
- Installs dependencies on each run
- Relies on runner's Python
- Faster initial setup (no image build)

**Docker Action** (current approach):
- Self-contained image
- Pre-installed dependencies
- Consistent Python version
- Better isolation
- **Recommended for Python actions**

The Docker approach is better suited for Python-based actions and provides more reliability.

### Repository Structure

The action is structured with files at the repository root:

```
monkeytest/
├── action.yml              # Action definition (root)
├── Dockerfile              # Container definition (root)
├── requirements.txt        # Dependencies (root)
├── .dockerignore          # Build optimization
├── src/                   # Source code directory
│   └── run_tests.py       # Main test runner
├── tests/examples/         # Example test cases
├── .github/workflows/      # CI/CD workflows only
└── docs/                  # Documentation files
```

This follows GitHub Actions best practices for standalone reusable actions:
- **Easier to reference**: `uses: username/monkeytest@v1`
- **Clearer purpose**: Entire repository is the action
- **Standard practice**: Follows GitHub's recommendations
- **Simpler paths**: No nested directories to navigate

Alternative structure (not used):
```
repo/.github/actions/my-action/action.yml  # For repo-specific actions
```