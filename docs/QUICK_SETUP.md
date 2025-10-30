# Quick Setup Guide - MonkeyTest GitHub Action

## 🚀 5-Minute Setup

### Step 1: Get Your API Key
1. Go to https://cloud.browser-use.com
2. Sign up or log in
3. Navigate to API Keys
4. Generate a new API key
5. **Copy it** (you'll need it in Step 3)

### Step 2: Fix and Push Your Code

```bash
# Navigate to your repository
cd /Users/eaa/Development/monkey-test

# Add and commit the changes
git add README.md TROUBLESHOOTING.md .zed/plans/fix-github-action.md
git commit -m "Fix merge conflict and add documentation"

# Push to GitHub
git push origin main
```

### Step 3: Add Secret to GitHub

1. Go to your repository: https://github.com/aevsai/monkey-test
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions** (in left sidebar)
4. Click **New repository secret** button
5. Fill in:
   - **Name**: `BROWSER_USE_API_KEY` (must match exactly!)
   - **Secret**: Paste your API key from Step 1
6. Click **Add secret**

### Step 4: Run Your First Test

1. Go to **Actions** tab in your repository
2. Click **Example Browser Tests** workflow (left sidebar)
3. Click **Run workflow** button (right side)
4. Select branch: **main**
5. Click green **Run workflow** button
6. Wait ~1-2 minutes for results

### Step 5: Check Results

- ✅ **Green checkmark** = Tests passed!
- ❌ **Red X** = Tests failed (click to see logs)
- Click on the workflow run to see:
  - Detailed logs for each step
  - Test results
  - Downloadable artifacts

## 🔧 What If It Fails?

### Error: "Secret BROWSER_USE_API_KEY not found"
- Double-check secret name is **exactly** `BROWSER_USE_API_KEY`
- Make sure you added it to **repository secrets**, not environment secrets

### Error: "Can't find 'action.yml'"
- Verify you pushed all changes: `git push origin main`
- Make sure `action.yml` exists in repository root
- Check the workflow file has `uses: actions/checkout@v4` before `uses: ./`

### Error: Docker build failed
- Check the workflow logs for specific error
- See **TROUBLESHOOTING.md** for detailed solutions

### Tests timeout
- Increase timeout in workflow:
  ```yaml
  with:
    timeout: 600  # 10 minutes
  ```

## 📖 Full Documentation

- **TROUBLESHOOTING.md** - Detailed solutions for all common issues
- **GETTING_STARTED.md** - Complete setup guide
- **README.md** - Full feature documentation

## ✅ Quick Verification Checklist

Before running the action, verify:

- [ ] Code pushed to GitHub (`git push origin main`)
- [ ] `BROWSER_USE_API_KEY` secret added in repository settings
- [ ] GitHub Actions enabled (Settings → Actions → General)
- [ ] Example test files exist in `tests/examples/`
- [ ] Workflow file exists at `.github/workflows/example-browser-tests.yml`

## 🎯 Next Steps

Once your first test runs successfully:

1. **Create your own tests** in `tests/` directory
2. **Customize the workflow** for your needs
3. **Create a release tag** to use from other repos:
   ```bash
   git tag -a v1 -m "Release version 1"
   git push origin v1
   ```
4. **Use in other repositories**:
   ```yaml
   - uses: aevsai/monkey-test@v1
     with:
       api-key: ${{ secrets.BROWSER_USE_API_KEY }}
       test-directory: tests
   ```

## 💡 Example Test File

Create `tests/my-test.md`:

```markdown
---
name: "My First Test"
description: "Check if example.com loads"
timeout: 60
---

# Task

Navigate to https://example.com and verify:
1. The page title is "Example Domain"
2. There is a heading with text "Example Domain"
3. The page loads successfully

Return "PASS" if all checks succeed, otherwise return "FAIL" with details.
```

Commit and push:
```bash
git add tests/my-test.md
git commit -m "Add my first test"
git push origin main
```

The workflow will run automatically!

## 🆘 Need Help?

1. Check **TROUBLESHOOTING.md** for detailed solutions
2. Review workflow logs in GitHub Actions tab
3. Open an issue: https://github.com/aevsai/monkey-test/issues

---

**That's it!** You should now have a working GitHub Action. 🎉