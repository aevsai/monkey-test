# MonkeyTest Architecture

## System Overview

MonkeyTest is a Docker-based GitHub Action that bridges the gap between human-readable test specifications and AI-powered browser automation using Browser Use Cloud.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Developer                                │
│                                                                   │
│  Writes test cases in markdown → Pushes to GitHub               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Actions                               │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Workflow Triggered (push/PR/schedule/manual)            │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Checkout Code                                           │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  MonkeyTest Action (root: action.yml)                   │  │
│  │                                                           │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │ 1. Build Docker Image (Dockerfile)                 │ │  │
│  │  │    - Python 3.11 slim base                         │ │  │
│  │  │    - Install dependencies                          │ │  │
│  │  │    - Copy run_tests.py                             │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │ 2. Run Container                                   │ │  │
│  │  │    - Mount workspace                               │ │  │
│  │  │    - Set environment variables                     │ │  │
│  │  │    - Execute run_tests.py                          │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Upload Artifacts (results + outputs)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Results     │
                    │   Comments    │
                    │   Artifacts   │
                    └───────────────┘
```

## Component Architecture

### 1. Test Runner (run_tests.py)

```
┌─────────────────────────────────────────────────────────────┐
│                     Test Runner Process                      │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Initialize                                             │ │
│  │  • Validate environment variables                       │ │
│  │  • Check API key                                        │ │
│  │  • Verify test directory exists                         │ │
│  └──────────────────────┬──────────────────────────────────┘ │
│                         │                                     │
│                         ▼                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Create Browser Use Client                              │ │
│  │  • Initialize SDK with API key                          │ │
│  │  • Prepare for task execution                           │ │
│  └──────────────────────┬──────────────────────────────────┘ │
│                         │                                     │
│                         ▼                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Discover Test Files                                    │ │
│  │  • Scan test directory for *.md files                   │ │
│  │  • Sort alphabetically for consistency                  │ │
│  └──────────────────────┬──────────────────────────────────┘ │
│                         │                                     │
│                         ▼                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  For Each Test File                                     │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │ Parse Test Case                                  │  │ │
│  │  │ • Extract YAML frontmatter                       │  │ │
│  │  │ • Parse markdown content                         │  │ │
│  │  │ • Extract task instructions                      │  │ │
│  │  └────────────┬─────────────────────────────────────┘  │ │
│  │               │                                          │ │
│  │               ▼                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │ Execute Test                                     │  │ │
│  │  │ • Create Browser Use task                        │  │ │
│  │  │ • Stream progress updates                        │  │ │
│  │  │ • Wait for completion                            │  │ │
│  │  │ • Handle timeout                                 │  │ │
│  │  └────────────┬─────────────────────────────────────┘  │ │
│  │               │                                          │ │
│  │               ▼                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │ Collect Results                                  │  │ │
│  │  │ • Capture output                                 │  │ │
│  │  │ • Download output files                          │  │ │
│  │  │ • Record duration                                │  │ │
│  │  │ • Handle errors                                  │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────┬──────────────────────────────────┘ │
│                           │                                     │
│                           ▼                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Generate Report                                        │ │
│  │  • Calculate summary statistics                         │ │
│  │  • Format results as JSON                               │ │
│  │  • Print summary to console                             │ │
│  └──────────────────────┬──────────────────────────────────┘ │
│                         │                                     │
│                         ▼                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Save Results                                           │ │
│  │  • Write test-results.json                              │ │
│  │  • Set GitHub Actions outputs                           │ │
│  │  • Exit with appropriate code                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2. Test Case Flow

```
┌──────────────────────────────────────────────────────────────┐
│                   Markdown Test File                          │
│                                                                │
│  ---                                                           │
│  name: "Test Name"                                            │
│  description: "What this tests"                               │
│  timeout: 120                                                 │
│  llm_model: "browser-use-llm"                                │
│  ---                                                           │
│                                                                │
│  # Task                                                        │
│                                                                │
│  Instructions for the AI agent...                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         │ Parse with python-frontmatter
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   Parsed Test Case Object                     │
│                                                                │
│  {                                                             │
│    "name": "Test Name",                                       │
│    "description": "What this tests",                          │
│    "task": "Instructions for the AI agent...",               │
│    "timeout": 120,                                            │
│    "llm_model": "browser-use-llm",                           │
│    "input_files": [],                                         │
│    "expected_output": null                                    │
│  }                                                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         │ Pass to Browser Use API
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   Browser Use Cloud                           │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Create Task                                          │   │
│  │  • task: "Instructions..."                            │   │
│  │  • llm: "browser-use-llm"                            │   │
│  │  • inputFiles: []                                     │   │
│  └────────────────────┬──────────────────────────────────┘   │
│                       │                                       │
│                       ▼                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AI Agent Execution                                   │   │
│  │  • Launch browser                                     │   │
│  │  • Interpret instructions                             │   │
│  │  • Navigate and interact                              │   │
│  │  • Extract data                                       │   │
│  │  • Take screenshots                                   │   │
│  └────────────────────┬──────────────────────────────────┘   │
│                       │                                       │
│                       ▼                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Task Result                                          │   │
│  │  • status: "finished"                                 │   │
│  │  • output: "Test results..."                          │   │
│  │  • outputFiles: [screenshots, data]                   │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         │ Return to test runner
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   Test Result Object                          │
│                                                                │
│  {                                                             │
│    "name": "Test Name",                                       │
│    "file_path": "tests/test.md",                             │
│    "status": "passed",                                        │
│    "output": "Test results...",                               │
│    "error": null,                                             │
│    "duration": 12.45,                                         │
│    "task_id": "task_abc123",                                  │
│    "output_files": ["file_id_1", "file_id_2"]               │
│  }                                                             │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User Input (Markdown) → Parse → API Request → Browser Use Cloud
                                                      ↓
                                                AI Agent
                                                      ↓
                                              Real Browser
                                                      ↓
                                                Web Actions
                                                      ↓
GitHub Outputs ← Format ← Process ← API Response ← Results
```

## Class Diagram

```
┌─────────────────────────────────────────────┐
│            TestResult                        │
├─────────────────────────────────────────────┤
│ + name: str                                  │
│ + file_path: str                             │
│ + status: str                                │
│ + output: Any                                │
│ + error: Optional[str]                       │
│ + duration: float                            │
│ + task_id: Optional[str]                     │
│ + output_files: List[str]                    │
├─────────────────────────────────────────────┤
│ + to_dict() -> Dict[str, Any]               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│       BrowserUseTestRunner                   │
├─────────────────────────────────────────────┤
│ - api_key: str                               │
│ - test_directory: str                        │
│ - llm_model: str                             │
│ - fail_on_error: bool                        │
│ - timeout: int                               │
│ - save_outputs: bool                         │
│ - client: BrowserUseClient                   │
│ - results: List[TestResult]                  │
│ - output_dir: Path                           │
├─────────────────────────────────────────────┤
│ + validate_config() -> bool                  │
│ + initialize_client() -> None                │
│ + find_test_files() -> List[Path]           │
│ + parse_test_case(Path) -> Dict              │
│ + execute_test(Path, Dict) -> TestResult    │
│ + run_all_tests() -> None                    │
│ + generate_report() -> Dict                  │
│ + print_summary(Dict) -> None                │
│ + save_results(Dict, str) -> None            │
│ + run() -> int                               │
│ - _save_output_files(List, str) -> None     │
│ - _set_github_output(str, str) -> None       │
└─────────────────────────────────────────────┘
```

## Integration Points

### 1. GitHub Actions Integration

```yaml
# action.yml at repository root defines the interface
runs:
  using: "docker"
  image: "Dockerfile"
  
inputs:
  api-key         → Environment: BROWSER_USE_API_KEY
  test-directory  → Environment: TEST_DIRECTORY
  llm-model       → Environment: LLM_MODEL
  timeout         → Environment: TIMEOUT
  fail-on-error   → Environment: FAIL_ON_ERROR
  save-outputs    → Environment: SAVE_OUTPUTS

↓ Docker container starts ↓
↓ run_tests.py reads environment ↓

outputs:
  results         ← GITHUB_OUTPUT file
  total-tests     ← GITHUB_OUTPUT file
  passed-tests    ← GITHUB_OUTPUT file
  failed-tests    ← GITHUB_OUTPUT file
  results-file    ← GITHUB_OUTPUT file
```

### 2. Browser Use SDK Integration

```python
# Python SDK wraps REST API
BrowserUseClient(api_key)
    ↓
client.tasks.createTask(task, llm)
    ↓
task.stream()  # Server-sent events
    ↓
task.complete()  # Wait for finish
    ↓
client.files.download(file_id)
```

### 3. File System Integration

```
Host (GitHub Actions Runner)
├── /github/workspace/           ← Mounted into container
│   ├── action.yml               ← Action definition
│   ├── Dockerfile               ← Container definition
│   ├── requirements.txt         ← Dependencies list
│   ├── src/
│   │   └── run_tests.py         ← Test runner
│   ├── tests/                   ← TEST_DIRECTORY
│   │   └── *.md                 ← Test cases (input)
│   ├── test-results.json        ← Results (output)
│   └── browser-use-outputs/     ← Screenshots (output)
│       └── test_name/
│           └── *.png, *.csv, etc.

Docker Container
├── /action/
│   ├── requirements.txt         ← Dependencies
│   ├── src/
│   │   └── run_tests.py         ← Test runner
│   └── (installed packages)
└── /github/workspace/           ← Mounted from host
    └── (repository files)
```

## Error Handling Strategy

```
┌─────────────────────────────────────────────┐
│         Error Type                           │
├─────────────────────────────────────────────┤
│  Configuration Error                         │
│  • Missing API key                           │
│  • Invalid test directory                    │
│  • Invalid environment variables             │
│  → Exit Code: 2                              │
│  → Stop immediately                          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Test Parsing Error                          │
│  • Invalid YAML frontmatter                  │
│  • Missing required fields                   │
│  • Malformed markdown                        │
│  → Mark test as 'error'                      │
│  → Continue with next test                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  API Error                                   │
│  • Authentication failure                    │
│  • Rate limit exceeded                       │
│  • Network timeout                           │
│  • Task execution failure                    │
│  → Mark test as 'failed'                     │
│  → Log error details                         │
│  → Continue with next test                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Test Failure                                │
│  • Test completed but failed                 │
│  • Assertions not met                        │
│  • Expected output not matched               │
│  → Mark test as 'failed'                     │
│  → Capture output and error                  │
│  → Exit Code: 1 (if fail-on-error=true)      │
└─────────────────────────────────────────────┘
```

## Performance Considerations

### Sequential Execution

```
Test 1 → Wait → Test 2 → Wait → Test 3 → Wait → Done
  ↓                ↓                ↓
 30s              45s              20s
                                        Total: 95s
```

**Pros:**
- Simple to implement
- Easy to debug
- Predictable resource usage
- Clear logs

**Cons:**
- Slower for many tests
- No parallelization

### Future: Parallel Execution

```
Test 1 ──→ 30s ──→┐
Test 2 ──→ 45s ──→┼──→ Done
Test 3 ──→ 20s ──→┘
                    Total: 45s
```

## Security Architecture

### Secrets Management

```
GitHub Repository Secrets
         ↓
   BROWSER_USE_API_KEY
         ↓
   GitHub Actions Runner (encrypted)
         ↓
   Environment Variable (runtime only)
         ↓
   Python Script (in memory)
         ↓
   HTTPS → Browser Use API
```

### Best Practices

- API key never logged
- API key never in source code
- API key never in artifacts
- HTTPS for all API calls
- Secure credential handling in tests

## Extensibility Points

### 1. Custom LLM Models

```python
# Add new model support
llm_model: "new-model-name"
```

### 2. Custom Output Formats

```python
# Extend generate_report()
def generate_html_report():
    # Format as HTML
    pass
```

### 3. Custom Validators

```python
# Add output validation
def validate_output(output, expected):
    # Custom validation logic
    pass
```

### 4. Test Hooks

```python
# Before/after test hooks
def before_test(test_case):
    # Setup logic
    pass

def after_test(result):
    # Cleanup logic
    pass
```

## Monitoring and Observability

### Logs

```
Console Output
├── Initialization logs
├── Test discovery logs
├── Per-test execution logs
│   ├── Task creation
│   ├── Progress updates
│   └── Completion/failure
├── Summary statistics
└── Artifact locations
```

### Metrics

```
test-results.json
├── summary.total
├── summary.passed
├── summary.failed
├── summary.errors
├── summary.success_rate
└── results[].duration
```

### Artifacts

```
GitHub Actions Artifacts
├── test-results.json     (Always)
└── browser-use-outputs/  (If save-outputs=true)
    ├── test1/
    │   ├── screenshot.png
    │   └── data.csv
    └── test2/
        └── report.pdf
```

## Deployment Model

```
Developer → Git Push → GitHub Repository
                            ↓
                    GitHub Actions
                            ↓
                     Checkout Code
                            ↓
                   Build Docker Image
                     (from Dockerfile at root)
                            ↓
                   - Python 3.11 slim
                   - Install dependencies
                   - Copy src/run_tests.py
                            ↓
                  Run Docker Container
                   - Mount workspace
                   - Set env variables
                   - Execute tests
                            ↓
              Container writes results
              to mounted workspace
                            ↓
              Upload Artifacts
                            ↓
               Set Outputs
                            ↓
          (Optional) Comment PR
                            ↓
        (Optional) Create Issue
```

## Docker Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Container                          │
│                                                               │
│  Base: python:3.11-slim                                      │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Layer 1: Base OS (Debian slim)                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Layer 2: Python 3.11 + pip                            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Layer 3: Dependencies (cached)                        │ │
│  │  - browser-use-sdk                                     │ │
│  │  - pyyaml                                              │ │
│  │  - python-frontmatter                                  │ │
│  │  - requests                                            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Layer 4: Application                                  │ │
│  │  - src/run_tests.py                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  Entrypoint: python /action/src/run_tests.py                │
│                                                               │
│  Mounted: /github/workspace → Host repository               │
└─────────────────────────────────────────────────────────────┘
```

### Benefits of Docker Container Approach

1. **Consistency**: Identical environment locally and in CI/CD
2. **Isolation**: No conflicts with host system or other actions
3. **Portability**: Works anywhere Docker runs
4. **Fast Builds**: Layer caching speeds up subsequent runs
5. **Version Control**: Docker image is versioned with code
6. **Security**: Isolated execution environment

## Summary

MonkeyTest provides a clean, simple architecture that:

1. **Abstracts complexity** - Markdown → AI-powered automation
2. **Integrates seamlessly** - Native Docker-based GitHub Actions support
3. **Handles errors gracefully** - Multiple layers of error handling
4. **Scales incrementally** - Start simple, add complexity as needed
5. **Provides observability** - Clear logs, metrics, and artifacts
6. **Remains extensible** - Multiple extension points for customization
7. **Ensures consistency** - Docker container provides identical environment

The architecture balances simplicity for users (write markdown) with power for advanced use cases (custom models, outputs, validators), all within an isolated Docker container.