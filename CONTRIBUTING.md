# Contributing to MonkeyTest

Thank you for considering contributing to MonkeyTest! We welcome contributions from the community to make this project better.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members
- Be patient and understanding

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Environment details** (OS, Python version, Browser Use SDK version)
- **Test case** that demonstrates the issue
- **Error messages and logs**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case** - why is this enhancement needed?
- **Expected behavior** - what should happen?
- **Alternative solutions** you've considered
- **Examples** from other projects (if applicable)

### Contributing Code

1. **Fork the repository** and create a branch from `main`
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Submit a pull request**

### Adding Example Tests

We love contributions of example test cases! To add examples:

1. Create a markdown test file in `tests/examples/`
2. Follow the [test case format](.github/actions/browser-use-test/README.md#test-case-format)
3. Include clear instructions and expected outputs
4. Test it with a real Browser Use API key
5. Submit a PR with your example

## Development Setup

### Prerequisites

- Python 3.11 or higher
- Git
- A Browser Use Cloud account and API key

### Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/monkeytest.git
   cd monkeytest
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r .github/actions/browser-use-test/requirements.txt
   pip install pytest black flake8 mypy  # Development tools
   ```

4. **Set up environment variables**:
   ```bash
   export BROWSER_USE_API_KEY="your-api-key-here"
   export TEST_DIRECTORY="tests/examples"
   ```

5. **Run tests locally**:
   ```bash
   python .github/actions/browser-use-test/run_tests.py
   ```

## Submitting Changes

### Pull Request Process

1. **Update the README** if you're adding features or changing behavior
2. **Update the documentation** in `.github/actions/browser-use-test/README.md`
3. **Add or update tests** if applicable
4. **Follow the coding standards** (see below)
5. **Write clear commit messages** (see below)
6. **Ensure all tests pass**
7. **Request review** from maintainers

### Commit Message Guidelines

Use clear, descriptive commit messages:

```
<type>: <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style/formatting (no functional changes)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat: add support for custom headers in test cases

- Allow users to specify HTTP headers in test frontmatter
- Update parser to extract headers field
- Pass headers to Browser Use API

Closes #123
```

```
fix: handle empty test directory gracefully

Previously would crash with error, now shows helpful message
and exits cleanly.
```

### Branch Naming

Use descriptive branch names:

- `feature/add-custom-headers`
- `fix/empty-directory-crash`
- `docs/update-readme`
- `test/add-login-examples`

## Coding Standards

### Python Style Guide

We follow PEP 8 with some modifications:

- **Line length**: 88 characters (Black default)
- **Indentation**: 4 spaces
- **Quotes**: Double quotes for strings
- **Imports**: Group standard library, third-party, and local imports

### Code Formatting

Use [Black](https://github.com/psf/black) for code formatting:

```bash
black .github/actions/browser-use-test/run_tests.py
```

### Linting

Use [Flake8](https://flake8.pycqa.org/) for linting:

```bash
flake8 .github/actions/browser-use-test/run_tests.py --max-line-length=88
```

### Type Hints

Use type hints for function parameters and return values:

```python
def parse_test_case(file_path: Path) -> Optional[Dict[str, Any]]:
    """Parse a markdown test case file."""
    # Implementation
```

### Documentation Strings

Use docstrings for all public functions and classes:

```python
def execute_test(self, file_path: Path, test_case: Dict[str, Any]) -> TestResult:
    """
    Execute a single test case.
    
    Args:
        file_path: Path to the test case file
        test_case: Parsed test case dictionary
        
    Returns:
        TestResult object with execution results
    """
    # Implementation
```

## Testing Guidelines

### Manual Testing

Before submitting changes:

1. Test with a **single test case**
2. Test with **multiple test cases**
3. Test with **invalid markdown** (should handle gracefully)
4. Test with **missing API key** (should show clear error)
5. Test **timeout scenarios**
6. Test **various LLM models** if model-related changes

### Test Case Requirements

When adding example tests:

- Must be **self-contained** (no external dependencies)
- Must use **publicly accessible URLs**
- Should complete in **reasonable time** (< 2 minutes preferred)
- Must include **clear expected outputs**
- Should demonstrate **best practices**

### Running Specific Tests

```bash
# Run single test
export TEST_DIRECTORY="tests/examples"
python .github/actions/browser-use-test/run_tests.py

# Test specific file
mkdir test-temp
cp tests/examples/simple-page-check.md test-temp/
export TEST_DIRECTORY="test-temp"
python .github/actions/browser-use-test/run_tests.py
```

## Documentation

### When to Update Documentation

Update documentation when you:

- Add new features or inputs
- Change existing behavior
- Add new test case formats
- Fix bugs that were unclear in docs
- Add examples

### Documentation Files to Update

- `README.md` - Project overview and quick start
- `.github/actions/browser-use-test/README.md` - Action documentation
- `GETTING_STARTED.md` - Beginner's guide
- Test examples in `tests/examples/`

### Documentation Style

- Use clear, simple language
- Include code examples
- Provide context and rationale
- Add screenshots/diagrams when helpful
- Keep it up-to-date with code changes

## Project Structure

Understanding the project structure:

```
monkeytest/
├── .github/
│   ├── actions/
│   │   └── browser-use-test/     # The GitHub Action
│   │       ├── action.yml         # Action definition
│   │       ├── run_tests.py       # Main test runner
│   │       ├── requirements.txt   # Python dependencies
│   │       └── README.md          # Action docs
│   └── workflows/
│       └── example-browser-tests.yml  # Example workflow
├── tests/
│   └── examples/                  # Example test cases
├── .zed/
│   └── plans/                     # Implementation plans
├── README.md                      # Main documentation
├── GETTING_STARTED.md             # Getting started guide
├── CONTRIBUTING.md                # This file
└── LICENSE                        # MIT License
```

## Areas for Contribution

We especially welcome contributions in these areas:

### High Priority

- **More example test cases** - Real-world scenarios
- **Error handling improvements** - Better error messages
- **Performance optimizations** - Faster test execution
- **Better logging** - More detailed progress information

### Medium Priority

- **Test result formatters** - HTML, JUnit XML, etc.
- **Parallel test execution** - Run multiple tests concurrently
- **Test dependencies** - Run tests in specific order
- **Custom validators** - Validate test outputs against schemas

### Nice to Have

- **VS Code extension** - Better markdown test editing
- **Test generator** - Generate test templates
- **Browser Use session management** - Reuse sessions across tests
- **Advanced reporting** - Graphs, trends, history

## Community

### Where to Ask Questions

- **GitHub Discussions** - General questions and ideas
- **GitHub Issues** - Bug reports and feature requests
- **Pull Request Comments** - Code review discussions

### Recognition

Contributors will be:

- Listed in release notes
- Credited in documentation updates
- Acknowledged in the README (for significant contributions)

## Release Process

Maintainers handle releases:

1. Update version numbers
2. Update CHANGELOG
3. Create release notes
4. Tag release
5. Publish to relevant platforms

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

If you have questions about contributing, please:

1. Check existing documentation
2. Search closed issues
3. Ask in GitHub Discussions
4. Open a new issue with the "question" label

Thank you for contributing to MonkeyTest! 🐵🧪