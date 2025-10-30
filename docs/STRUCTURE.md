# Repository Structure

This document explains the organization of the MonkeyTest repository.

## Overview

MonkeyTest is structured as a **reusable GitHub Action** with all action files at the repository root. This follows GitHub Actions best practices for standalone actions that can be referenced directly by other repositories.

## Directory Tree

```
monkeytest/
├── action.yml                      # ⭐ Action definition (GitHub Actions entry point)
├── Dockerfile                      # 🐳 Container definition
├── requirements.txt                # 📦 Python dependencies
├── .dockerignore                   # 🚫 Docker build exclusions
├── .gitignore                      # 🚫 Git exclusions
│
├── src/                            # 📁 Source Code
│   └── run_tests.py               # 🐍 Main test runner script (407 lines)
│
├── .github/                        # 📁 GitHub Configuration
│   └── workflows/                  
│       └── example-browser-tests.yml  # 📋 Example workflow
│
├── tests/                          # 📁 Example Test Cases
│   └── examples/
│       ├── hackernews-search.md    # 📝 Data extraction example
│       ├── form-validation.md      # 📝 Form testing example
│       └── simple-page-check.md    # 📝 Basic verification example
│
├── scripts/                        # 📁 Utility Scripts
│   └── test-local.sh              # 🔧 Local testing helper script
│
├── .zed/                           # 📁 Development Plans
│   └── plans/
│       └── browser-use-github-action.md  # 📋 Implementation plan
│
└── Documentation/                  # 📁 (Files at root)
    ├── README.md                   # 📖 Main documentation
    ├── GETTING_STARTED.md          # 🚀 Setup guide
    ├── ARCHITECTURE.md             # 🏗️  Technical architecture
    ├── DOCKER_IMPLEMENTATION.md    # 🐳 Docker details
    ├── CONTRIBUTING.md             # 🤝 Contribution guide
    ├── PROJECT_SUMMARY.md          # 📊 Complete project summary
    ├── CHANGELOG.md                # 📝 Version history
    ├── STRUCTURE.md                # 📋 This file
    └── LICENSE                     # ⚖️  MIT License
```

## Key Files Explained

### Action Entry Points (Root Level)

#### `action.yml`
**Purpose**: Defines the GitHub Action interface  
**Type**: YAML configuration  
**Location**: Repository root (required by GitHub Actions)  
**Key content**:
- Action metadata (name, description, branding)
- Input definitions (api-key, test-directory, etc.)
- Output definitions (results, test counts)
- Docker configuration (`using: "docker"`, `image: "Dockerfile"`)

#### `Dockerfile`
**Purpose**: Defines the container environment  
**Type**: Docker configuration  
**Base Image**: `python:3.11-slim`  
**Key layers**:
1. Base Python 3.11 image
2. Install dependencies from requirements.txt
3. Copy source code from src/
4. Set entrypoint to run_tests.py

#### `requirements.txt`
**Purpose**: Lists Python dependencies  
**Dependencies**:
- `browser-use-sdk` - Browser Use API client
- `pyyaml` - YAML parsing
- `python-frontmatter` - Markdown frontmatter extraction
- `requests` - HTTP client

### Source Code

#### `src/run_tests.py`
**Purpose**: Main test runner implementation  
**Lines**: 407  
**Language**: Python 3.11+  
**Key classes**:
- `TestResult` - Test result data structure
- `BrowserUseTestRunner` - Main runner class

**Key functions**:
- `validate_config()` - Validates environment variables
- `initialize_client()` - Sets up Browser Use client
- `find_test_files()` - Discovers markdown test files
- `parse_test_case()` - Parses markdown with frontmatter
- `execute_test()` - Runs a single test via Browser Use API
- `generate_report()` - Creates JSON summary
- `run()` - Main entry point

### Example Tests

#### `tests/examples/hackernews-search.md`
Demonstrates data extraction from Hacker News

#### `tests/examples/form-validation.md`
Shows multi-step form testing with validation checks

#### `tests/examples/simple-page-check.md`
Basic page load verification - great for beginners

### Documentation

#### `README.md`
Main project documentation with quick start guide

#### `GETTING_STARTED.md`
Step-by-step setup instructions for beginners

#### `ARCHITECTURE.md`
Technical architecture, data flows, and system design

#### `DOCKER_IMPLEMENTATION.md`
Deep dive into Docker container implementation

#### `CONTRIBUTING.md`
Guidelines for contributing to the project

## Why This Structure?

### Action Files at Root

GitHub Actions recommends placing action files at the repository root for standalone actions:

✅ **Easier to reference**: `uses: username/monkeytest@v1`  
✅ **Clearer purpose**: Entire repo is the action  
✅ **Standard practice**: Follows GitHub Actions conventions  
✅ **Simpler paths**: No nested directories to navigate  

**Alternative** (not used here):
```
.github/actions/my-action/action.yml  # For repository-specific actions
```

### Source Code in `src/`

Keeps the root clean while organizing application code:

✅ **Clear separation**: Action config (root) vs application code (src/)  
✅ **Standard convention**: Common in Python projects  
✅ **Scalability**: Easy to add more modules in src/  
✅ **Clean root**: Documentation and config at top level  

### Examples in `tests/`

Example test cases are kept separate:

✅ **Clear purpose**: Obviously examples, not production tests  
✅ **Easy to find**: Standard location for test files  
✅ **Safe to modify**: Users can experiment without breaking action  
✅ **Documentation**: Serve as working examples  

## File Sizes

| File | Lines | Type |
|------|-------|------|
| `src/run_tests.py` | 407 | Python |
| `action.yml` | 54 | YAML |
| `Dockerfile` | 24 | Docker |
| `README.md` | 360+ | Markdown |
| `GETTING_STARTED.md` | 480+ | Markdown |
| `ARCHITECTURE.md` | 600+ | Markdown |
| `DOCKER_IMPLEMENTATION.md` | 415 | Markdown |
| **Total** | **~4,100+** | Various |

## Docker Build Context

When building the Docker image, these files are included:

```
Build Context:
├── Dockerfile              ← Instructions
├── requirements.txt        ← Copied to /action/
├── src/                    ← Copied to /action/src/
│   └── run_tests.py

Excluded (via .dockerignore):
├── .git/                   ← Git history
├── .github/                ← Workflows
├── tests/                  ← Examples
├── scripts/                ← Helper scripts
├── *.md                    ← Documentation
└── __pycache__/            ← Python cache
```

## Usage Patterns

### As a Remote Action

Users reference your action directly:

```yaml
# Their repository: .github/workflows/test.yml
- uses: yourusername/monkeytest@v1
  with:
    api-key: ${{ secrets.BROWSER_USE_API_KEY }}
    test-directory: tests
```

GitHub Actions will:
1. Clone the monkeytest repository
2. Find `action.yml` at root
3. Build Docker image from `Dockerfile`
4. Run container with mounted workspace

### As a Local Action

For development or customization:

```yaml
# From within monkeytest repository
- uses: ./
  with:
    api-key: ${{ secrets.BROWSER_USE_API_KEY }}
    test-directory: tests/examples
```

### As a Forked Action

Users can fork and customize:

```yaml
# Their repository
- uses: their-username/monkeytest@main
  with:
    api-key: ${{ secrets.BROWSER_USE_API_KEY }}
    test-directory: tests
```

## Development Workflow

### Local Development

```bash
# 1. Make changes to src/run_tests.py
vim src/run_tests.py

# 2. Test locally with Docker
docker build -t monkeytest-dev .
docker run -e BROWSER_USE_API_KEY="..." monkeytest-dev

# 3. Test with example workflow
git commit -am "Update test runner"
git push
# Workflow runs automatically
```

### Adding New Features

```bash
# 1. Update src/run_tests.py
# 2. Update action.yml if adding inputs/outputs
# 3. Update Dockerfile if changing dependencies
# 4. Update documentation
# 5. Add examples to tests/examples/
# 6. Update CHANGELOG.md
```

## Navigation Guide

**Want to...** | **Go to...**
---|---
Use this action | `README.md`
Learn how to set up | `GETTING_STARTED.md`
Understand how it works | `ARCHITECTURE.md`
Learn about Docker | `DOCKER_IMPLEMENTATION.md`
Contribute | `CONTRIBUTING.md`
See the action definition | `action.yml`
Read the source code | `src/run_tests.py`
See examples | `tests/examples/`
Run tests locally | `scripts/test-local.sh`

## Best Practices

### ✅ Do

- Keep action.yml at repository root
- Put source code in src/ directory
- Document all inputs and outputs
- Provide working examples
- Keep Dockerfile optimized
- Use .dockerignore to minimize build context

### ❌ Don't

- Put action.yml in nested directories (for standalone actions)
- Hardcode secrets or API keys
- Include large files in Docker context
- Skip documentation
- Mix test code with source code

## Comparison: Action Location Patterns

### Pattern 1: Root (MonkeyTest - Current) ✅

```
repo/
├── action.yml          ← Action definition
├── Dockerfile
├── src/
│   └── code.py
└── README.md
```

**Usage**: `uses: username/repo@v1`  
**Best for**: Standalone, reusable actions (recommended)

### Pattern 2: .github/actions/ (Alternative)

```
repo/
├── .github/
│   └── actions/
│       └── my-action/
│           ├── action.yml
│           └── code.py
└── README.md
```

**Usage**: `uses: username/repo/.github/actions/my-action@v1`  
**Best for**: Repository-specific actions, multiple actions in one repo

### Pattern 3: Subdirectory (Less Common)

```
repo/
├── action/
│   ├── action.yml
│   └── code.py
└── README.md
```

**Usage**: `uses: username/repo/action@v1`  
**Best for**: Action as part of larger project

## Summary

MonkeyTest uses **Pattern 1** (action at root) because:

1. **It's a standalone action** - The entire purpose is to be a reusable action
2. **Easier to reference** - Simple `uses:` path
3. **Industry standard** - Follows GitHub's recommendations
4. **Clear structure** - Clean separation of concerns
5. **Easy to find** - Everything important is at the root

This structure makes MonkeyTest easy to use, understand, and contribute to.