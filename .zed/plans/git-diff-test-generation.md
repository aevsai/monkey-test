# Git Diff Test Generation Feature

## Overview
Add ability to generate test cases from git commit diffs using LLM, execute them, and save as GitHub Actions artifacts.

## Understanding
- Accept git commit reference as input (CLI argument)
- Generate diff between HEAD and specified commit
- Send diff to LLM with prompt to generate test cases
- Parse LLM response (XML format: `<testplan><testcase>...</testcase></testplan>`)
- Convert test cases to markdown format compatible with existing test runner
- Execute generated tests through existing pipeline
- Save generated test cases as artifacts
- Display results in GitHub Actions summary

## Checklist

### Phase 1: Git Integration
- [x] Add CLI argument `--from-commit <ref>` to specify commit reference
- [x] Create `src/git-diff.ts` module for git operations
- [x] Implement function to validate git repository
- [x] Implement function to validate commit reference exists
- [x] Implement function to get diff between HEAD and commit
- [x] Add error handling for invalid commits, non-git directories
- [x] Filter out binary files from diff
- [x] Add option to limit diff size (handle large diffs)

### Phase 2: LLM Test Generation
- [x] Create `src/test-generator.ts` module
- [x] Design prompt template for LLM to generate test cases from diff
- [x] Implement function to call LLM with diff and prompt
- [x] Add XML parser to extract `<testplan>` and `<testcase>` elements
- [x] Validate generated test case structure
- [x] Handle LLM errors (API failures, rate limits, invalid responses)
- [x] Add retry logic for LLM calls
- [x] Convert XML test cases to markdown format

### Phase 3: Test Case Processing
- [x] Create temporary directory for generated test cases
- [x] Save generated markdown test files to temp directory
- [x] Integrate generated tests into existing test discovery
- [x] Add flag to run ONLY generated tests or ALL tests (existing + generated)
- [x] Clean up temporary test files after execution

### Phase 4: GitHub Actions Integration
- [x] Create `src/github-actions.ts` module
- [x] Implement function to detect GitHub Actions environment
- [x] Add function to save test cases as artifacts (write to specified directory)
- [x] Implement GitHub Actions summary generation using `$GITHUB_STEP_SUMMARY`
- [x] Format test results as markdown table for summary
- [x] Add statistics (passed/failed/errors) to summary
- [x] Include links to artifacts in summary

### Phase 5: Configuration & CLI
- [x] Update `src/config.ts` to add new options:
  - [x] `fromCommit` (commit reference)
  - [x] `generateOnly` (generate without executing)
  - [x] `artifactDir` (where to save artifacts)
  - [x] `testGenerationModel` (LLM model for generation, can differ from execution)
- [x] Update CLI argument parsing in `src/index.ts`
- [x] Add help text for new options
- [x] Update config validation

### Phase 6: Main Flow Integration
- [x] Update `BrowserUseTestRunner` class to check for `--from-commit` mode
- [x] Add new method `runDiffBasedTests()` (renamed from `generateAndRunTestsFromDiff()`)
- [x] Branch execution flow: standard mode vs diff-generation mode
- [x] Ensure both modes use same result reporting
- [x] Handle artifact saving in both CI and local environments

### Phase 7: Error Handling & Edge Cases
- [x] Handle empty diffs (no changes)
- [x] Handle LLM generating zero test cases
- [x] Handle malformed XML from LLM
- [x] Handle git command failures
- [x] Add validation for generated test case content
- [x] Provide meaningful error messages for each failure scenario

### Phase 8: Output & Artifacts
- [x] Create artifact directory structure (e.g., `artifacts/generated-tests/`, `artifacts/results/`)
- [x] Save raw diff to artifacts
- [x] Save raw LLM response to artifacts
- [x] Save generated test cases (markdown) to artifacts
- [x] Save test execution results to artifacts
- [x] Add timestamps to artifact files

## Files Created
- ✅ `src/git-diff.ts` - Git operations (170 lines)
- ✅ `src/test-generator.ts` - LLM test generation (358 lines)
- ✅ `src/github-actions.ts` - GitHub Actions integration (323 lines)
- ✅ `.github/workflows/diff-test.yml` - GitHub Actions workflow
- ✅ `docs/diff-testing-guide.md` - Comprehensive usage guide

## Files Modified
- ✅ `src/index.ts` - Added new execution mode with `runDiffBasedTests()`
- ✅ `src/config.ts` - Added new configuration options and CLI parsing
- ✅ `src/types.ts` - Added types for generated tests
- ✅ `README.md` - Added documentation for diff-based testing

## Dependencies Added
- ✅ `simple-git@3.29.0` - Git operations
- ✅ `fast-xml-parser@5.3.0` - XML parsing for LLM responses
- ✅ `openai@6.7.0` - OpenAI API client for test generation

## Implementation Notes

### Key Features Implemented
1. **Git Integration**: Full git diff extraction with binary filtering and size limits
2. **LLM Test Generation**: GPT-4 integration with retry logic and error handling
3. **XML Parsing**: Robust XML parser with validation and fallback handling
4. **GitHub Actions**: Complete CI/CD integration with artifacts and summaries
5. **CLI Enhancement**: Help text, argument parsing, and dual-mode operation

### Error Handling Implemented
- Invalid commit references
- Empty diffs
- Git repository validation
- LLM API failures with retry
- Malformed XML parsing
- Test generation failures

### Testing Status
- ✅ TypeScript compilation successful
- ✅ Build successful
- ⚠️ Runtime testing needed with actual git commits
- ⚠️ GitHub Actions workflow needs testing in CI environment

## Next Steps (Optional Enhancements)
- [ ] Add support for multiple LLM providers (Anthropic, etc.)
- [ ] Add caching for LLM responses
- [ ] Add test case quality scoring
- [ ] Add ability to regenerate specific tests
- [ ] Add interactive mode for test review
- [ ] Add test case templates customization