# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Parallel test execution support
- Test dependencies and ordering
- Custom result validators
- HTML and JUnit XML report formats
- Browser Use Session and Profile management
- Test retry mechanism on failure
- Performance metrics collection
- VS Code extension for test authoring

## [1.0.0] - 2024-01-XX

### Added
- Initial release of MonkeyTest GitHub Action
- Reusable GitHub Action for Browser Use AI-powered testing
- Markdown-based test case format with YAML frontmatter
- Support for multiple LLM models (browser-use-llm, gpt-4.1, claude-sonnet-4, gemini-flash-latest, o3)
- Sequential test execution with real-time progress streaming
- Comprehensive error handling and validation
- JSON test results output
- GitHub Actions outputs for workflow integration
- Automatic artifact upload (results and output files)
- Screenshot and output file handling
- Configurable timeouts per test
- Configurable fail-on-error behavior
- Console logging with emoji indicators
- Test summary statistics

### Documentation
- Complete README with quick start guide
- Action-specific documentation with examples
- GETTING_STARTED guide for beginners
- CONTRIBUTING guidelines for contributors
- Example test cases:
  - Hacker News search and data extraction
  - Form validation testing
  - Simple page verification
- Example GitHub Actions workflow
- Troubleshooting guide
- Tips for writing effective tests

### Examples
- Three comprehensive test case examples
- Full workflow example with PR comments and issue creation
- Local testing setup with Docker and Python
- Multiple workflow integration patterns

### Infrastructure
- Python 3.11+ support
- Browser Use SDK integration
- YAML frontmatter parsing
- Markdown content extraction
- GitHub Actions composite action
- Artifact management
- MIT License

## Project Structure

```
v1.0.0
├── Core Action
│   ├── action.yml (85 lines)
│   ├── run_tests.py (407 lines)
│   ├── requirements.txt (4 dependencies)
│   └── README.md (516 lines)
├── Documentation
│   ├── README.md (320 lines)
│   ├── GETTING_STARTED.md (439 lines)
│   ├── CONTRIBUTING.md (376 lines)
│   ├── PROJECT_SUMMARY.md (379 lines)
│   └── CHANGELOG.md (this file)
├── Examples
│   ├── hackernews-search.md
│   ├── form-validation.md
│   ├── simple-page-check.md
│   └── example-browser-tests.yml (150 lines)
└── Configuration
    ├── .gitignore
    ├── LICENSE
    └── Implementation plan
```

## Version History

### v1.0.0 - Initial Release
- First stable release
- Production-ready
- Comprehensive documentation
- Example test cases
- Full GitHub Actions integration

---

## Notes

### What Changed in Each Version

For detailed information about changes in each version:
- See [GitHub Releases](https://github.com/yourusername/monkeytest/releases)
- See [Commits](https://github.com/yourusername/monkeytest/commits/main)

### Upgrade Instructions

When upgrading between versions:
1. Check the CHANGELOG for breaking changes
2. Update your `action.yml` reference in workflows
3. Review and update test cases if format changed
4. Test in a development environment first

### Support

- For bugs: [Open an issue](https://github.com/yourusername/monkeytest/issues)
- For questions: [GitHub Discussions](https://github.com/yourusername/monkeytest/discussions)
- For contributions: See [CONTRIBUTING.md](CONTRIBUTING.md)

---

[Unreleased]: https://github.com/yourusername/monkeytest/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/monkeytest/releases/tag/v1.0.0