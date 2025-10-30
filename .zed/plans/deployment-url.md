# Deployment URL Specification

## Understanding
Add ability to specify a URL where code is deployed, which will be used during test generation and execution. This allows tests to target specific deployment environments.

## Questions & Considerations
- Should URL be required or optional?
- What's the default behavior if no URL is provided?
- Should URL be validated (format check)?
- Should it support multiple URLs (staging, production)?
- Should the URL be passed to the LLM during test generation?
- Should generated test cases include the URL?

## Edge Cases
- Invalid URL format
- URL with/without trailing slash consistency
- URL with query parameters or fragments
- Localhost URLs during development
- Missing protocol (http/https)

## Implementation Checklist

- [x] Add URL configuration option
  - [x] Add `DEPLOYED_URL` or `BASE_URL` environment variable to config.ts
  - [x] Add `--url` command-line flag support
  - [ ] Add URL validation (optional format check)
  - [x] Add to config type definition
  
- [x] Update test generation
  - [x] Pass deployment URL to LLM prompt in test-generator.ts
  - [x] Include URL in generated test case metadata
  - [x] Update test case template to reference base URL
  
- [x] Update test execution
  - [x] Make deployment URL available to test executor
  - [x] Pass URL to Browser Use session/task
  - [x] Ensure URL is used as starting point for tests
  
- [x] Update documentation
  - [x] Add URL option to help message in index.ts
  - [x] Document environment variable usage
  - [x] Add examples with URL specification
  - [x] Add base-url parameter to GitHub Action (action.yml)
  
- [x] Update types
  - [x] Add baseUrl to Config type
  - [x] Add baseUrl to TestCase type if needed
  
- [x] Testing
  - [x] Fixed Docker container to install git for diff functionality
  - [x] Fixed Docker working directory for GitHub Actions workspace
  - [x] Verify URL is properly passed through pipeline
  - [x] Test with and without URL specified
  - [ ] Test URL validation if implemented

## Notes
- Prefer `BASE_URL` as environment variable name (common convention)
- Make it optional with sensible defaults
- Consider storing in test case metadata for traceability

## Docker Fix for Git Operations
When running in GitHub Actions with Docker:
- Git must be installed in the container (`apt-get install git`)
- Working directory must be `/github/workspace` (where repo is mounted)
- Application files installed at `/app/dist` to avoid conflicts
- GitHub Actions automatically mounts workspace with full git history if `fetch-depth: 0` is set