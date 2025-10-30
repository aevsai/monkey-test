# Troubleshooting Guide for MonkeyTest GitHub Action

This guide will help you diagnose and fix common issues when using the MonkeyTest GitHub Action.

## Quick Checklist

Before diving into specific issues, verify these basics:

- [ ] Repository has been pushed to GitHub
- [ ] `action.yml` exists at the repository root
- [ ] `Dockerfile` exists at the repository root
- [ ] GitHub Actions is enabled in repository settings
- [ ] `BROWSER_USE_API_KEY` secret is configured
- [ ] Workflow file syntax is valid YAML
- [ ] You have a valid Browser Use API key

## Common Issues and Solutions

### 1. "Can't find 'action.yml', 'action.yaml' or 'Dockerfile'"

**Symptom**: Workflow fails with error about missing action definition.

**Cause**: GitHub can't locate the action files in your repository.

**Solutions**:

#### Option A: Using the action in the same repository (local action)

```yaml
- name: Checkout code
  uses: actions/checkout@v4  # REQUIRED - must checkout first!

- name: Run Browser Tests
  uses: ./  # Reference local action
  with:
    api-key: ${{ secrets.BROWSER_USE_API_KEY }}
    test-directory: tests
```

**Key point**: You MUST use `actions/checkout@v4` before using `uses: ./`

#### Option B: Using the action from another repository

1. Create a release tag in the action repository:
   ```bash
   git tag -a v1 -m "Release version 1"
   git push origin v1
   ```

2. Reference the action with the tag:
   ```yaml
   - uses: aevsai/monkey-test@v1
     with:
       api-key: ${{ secrets.BROWSER_USE_API_KEY }}
       test-directory: tests
   ```

3. You don't need `actions/checkout` when using external actions (unless you need your own test files)

#### Option C: Using specific branch

```yaml
- uses: aevsai/monkey-test@main
  with:
    api-key: ${{ secrets.BROWSER_USE_API_KEY }}
    test-directory: tests
```

### 2. "Invalid workflow file" or YAML Syntax Errors

**Symptom**: Workflow doesn't appear in Actions tab, or shows syntax error.

**Cause**: Invalid YAML syntax in workflow file.

**Solutions**:

1. **Check indentation** - YAML is sensitive to spaces:
   ```yaml
   # ✅ Correct
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
   
   # ❌ Wrong (inconsistent indentation)
   jobs:
    test:
       runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
   ```

2. **Validate your YAML**:
   - Use a YAML linter online: https://www.yamllint.com/
   - Use VS Code with YAML extension
   - Check GitHub's workflow editor for real-time validation

3. **Common YAML mistakes**:
   - Missing colons after keys
   - Using tabs instead of spaces
   - Incorrect string quoting
   - Missing required fields

### 3. "Secret BROWSER_USE_API_KEY not found"

**Symptom**: Workflow runs but fails with authentication or missing environment variable error.

**Cause**: Secret not configured or incorrectly named.

**Solutions**:

1. **Add the secret to your repository**:
   - Go to repository Settings
   - Click "Secrets and variables" → "Actions"
   - Click "New repository secret"
   - Name: `BROWSER_USE_API_KEY` (exact match required)
   - Value: Your Browser Use API key from https://cloud.browser-use.com

2. **Verify secret name matches**:
   ```yaml
   # Secret name in workflow MUST match exactly
   with:
     api-key: ${{ secrets.BROWSER_USE_API_KEY }}
   ```

3. **For organization secrets**: Ensure the secret is accessible to your repository

4. **Get a Browser Use API key**:
   - Sign up at https://cloud.browser-use.com
   - Navigate to API Keys section
   - Generate a new API key
   - Copy and save it securely

### 4. Docker Build Failures

**Symptom**: Workflow fails during "Build and run Docker container" step.

**Cause**: Docker image fails to build from Dockerfile.

**Solutions**:

1. **Test Docker build locally**:
   ```bash
   cd /path/to/monkey-test
   docker build -t monkeytest-test .
   ```

2. **Check Dockerfile paths**:
   - Verify all files referenced in `COPY` commands exist
   - Ensure `src/` directory and `run_tests.py` exist
   - Verify `requirements.txt` is present

3. **Verify requirements.txt**:
   ```bash
   # Test installing dependencies locally
   pip install -r requirements.txt
   ```

4. **Check for Python dependency conflicts**:
   - Use specific versions in `requirements.txt`
   - Avoid version conflicts between packages

5. **Review Docker logs**:
   - Click on the failed workflow run
   - Expand the failing step
   - Look for specific error messages

### 5. Tests Timeout or Take Too Long

**Symptom**: Tests run but timeout before completion.

**Cause**: Tests are too complex, website is slow, or default timeout is too short.

**Solutions**:

1. **Increase timeout in workflow**:
   ```yaml
   - uses: aevsai/monkey-test@v1
     with:
       api-key: ${{ secrets.BROWSER_USE_API_KEY }}
       test-directory: tests
       timeout: 600  # 10 minutes instead of default 5
   ```

2. **Increase timeout in test file**:
   ```markdown
   ---
   name: "Long Running Test"
   timeout: 600
   ---
   
   # Task
   ...
   ```

3. **Simplify test instructions**:
   - Break complex tests into smaller ones
   - Be more specific with instructions
   - Avoid vague directions like "explore the site"

4. **Check website availability**:
   - Ensure target website is accessible
   - Test website loading speed manually

### 6. Tests Fail with "Task Failed" or Error Messages

**Symptom**: Tests execute but return failure status.

**Cause**: AI agent couldn't complete the task or website structure doesn't match expectations.

**Solutions**:

1. **Review test instructions**:
   - Be specific and clear
   - Include exact element descriptions
   - Provide full URLs

2. **Check AI output**:
   - Download artifacts to see what the agent saw
   - Review screenshots if available
   - Read error messages in test results

3. **Verify website is accessible**:
   - Test URL manually
   - Check for login requirements
   - Verify no CAPTCHA or anti-bot protection

4. **Adjust LLM model**:
   ```yaml
   with:
     llm-model: "gpt-4.1"  # Use more capable model
   ```

### 7. "No test files found" or Empty Results

**Symptom**: Action runs but reports zero tests.

**Cause**: Test directory doesn't exist or contains no valid test files.

**Solutions**:

1. **Verify test directory path**:
   ```yaml
   with:
     test-directory: tests/examples  # Must be relative path
   ```

2. **Check test files exist**:
   ```bash
   ls -la tests/examples/
   ```

3. **Ensure test files are markdown** (`.md` extension)

4. **Verify test file format**:
   ```markdown
   ---
   name: "Test Name"
   description: "Test description"
   ---
   
   # Task
   
   Your test instructions here.
   ```

5. **Commit and push test files**:
   ```bash
   git add tests/
   git commit -m "Add test files"
   git push
   ```

### 8. Action Works Locally but Fails in GitHub Actions

**Symptom**: Tests pass when run locally but fail in CI.

**Cause**: Environment differences between local and GitHub Actions.

**Solutions**:

1. **Check environment variables**:
   - Ensure all required secrets are set in GitHub
   - Verify environment variable names match

2. **Network access**:
   - GitHub Actions may have different network configuration
   - Some websites may block GitHub's IP ranges

3. **Timing differences**:
   - GitHub Actions runners may be slower
   - Increase timeouts for CI environment

4. **File paths**:
   - Use relative paths, not absolute
   - Ensure path separators are correct (/ not \)

### 9. Permission Denied or Access Errors

**Symptom**: Workflow fails with permission errors.

**Cause**: Insufficient permissions for workflow or action.

**Solutions**:

1. **Check workflow permissions**:
   - Go to Settings → Actions → General
   - Under "Workflow permissions", ensure appropriate access

2. **For private repositories**:
   - Verify action repository is accessible
   - Consider making action repository public

3. **For organization repositories**:
   - Check organization-level action policies
   - Verify action is allowed to run

### 10. Artifacts Not Uploaded

**Symptom**: Test results or screenshots are missing.

**Cause**: Artifact upload configuration or missing files.

**Solutions**:

1. **Ensure save-outputs is enabled**:
   ```yaml
   with:
     save-outputs: true
   ```

2. **Add artifact upload step**:
   ```yaml
   - name: Upload Test Artifacts
     if: always()  # Run even if tests fail
     uses: actions/upload-artifact@v4
     with:
       name: test-results
       path: |
         test-results.json
         browser-use-outputs/
   ```

3. **Check artifact retention**:
   - Artifacts expire based on retention settings
   - Default is 90 days for public repos

## Advanced Troubleshooting

### Enable Debug Logging

Add these secrets to get more detailed logs:

1. Go to Settings → Secrets and variables → Actions
2. Add secret: `ACTIONS_STEP_DEBUG` = `true`
3. Add secret: `ACTIONS_RUNNER_DEBUG` = `true`
4. Re-run workflow to see debug output

### Test Docker Container Locally

```bash
# Build the image
docker build -t monkeytest .

# Run interactively
docker run -it --rm \
  -e BROWSER_USE_API_KEY="your-api-key" \
  -e TEST_DIRECTORY="tests/examples" \
  -v $(pwd)/tests:/action/tests \
  monkeytest
```

### Validate Action Definition

Check `action.yml` syntax:

```bash
# Install yq (YAML processor)
brew install yq  # macOS
# or apt-get install yq  # Linux

# Validate YAML
yq eval action.yml
```

### Review GitHub Actions Logs

1. Go to your repository on GitHub
2. Click "Actions" tab
3. Click on the failed workflow run
4. Expand each step to see detailed logs
5. Look for red error messages
6. Check the "Set up job" step for runner info

## Getting Help

If you're still stuck:

1. **Check existing issues**: https://github.com/aevsai/monkey-test/issues
2. **Create a new issue** with:
   - Complete error message
   - Workflow file content
   - Test file content (if applicable)
   - Link to failed workflow run (if public repo)
3. **Include environment details**:
   - Repository type (public/private)
   - Runner type (GitHub-hosted/self-hosted)
   - Any custom configuration

## Best Practices

### ✅ Do's

- Always use `actions/checkout@v4` before `uses: ./`
- Set explicit timeouts for long-running tests
- Use meaningful test and workflow names
- Keep test instructions clear and specific
- Version your action with tags (v1, v1.0.0, etc.)
- Test locally before pushing to GitHub
- Review logs when things fail

### ❌ Don'ts

- Don't hardcode API keys in workflow files
- Don't use absolute file paths
- Don't write tests that are too vague
- Don't forget to commit and push test files
- Don't ignore workflow validation errors
- Don't use the action without checking it out first (for local actions)

## Quick Start Workflow Template

Here's a minimal, working workflow to get started:

```yaml
name: Browser Tests

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run tests
        uses: ./
        with:
          api-key: ${{ secrets.BROWSER_USE_API_KEY }}
          test-directory: tests/examples
          timeout: 300
      
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: results
          path: test-results.json
```

Save this as `.github/workflows/test.yml`, configure your secret, and push!

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Browser Use Documentation](https://docs.cloud.browser-use.com)
- [Docker Documentation](https://docs.docker.com/)
- [YAML Syntax Guide](https://yaml.org/spec/1.2/spec.html)

---

**Still having issues?** Open an issue with details and we'll help you debug!