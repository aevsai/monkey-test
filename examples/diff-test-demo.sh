#!/bin/bash
# Diff-Based Test Generation Demo Script
# This script demonstrates how to use MonkeyTest's diff-based test generation

set -e  # Exit on error

echo "🐒 MonkeyTest Diff-Based Test Generation Demo"
echo "=============================================="
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    echo "Please run this script from the monkey-test directory"
    exit 1
fi

# Check for required environment variables
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY not set"
    echo "Please set your OpenAI API key:"
    echo "  export OPENAI_API_KEY='sk-...'"
    exit 1
fi

if [ -z "$BROWSER_USE_API_KEY" ]; then
    echo "⚠️  Warning: BROWSER_USE_API_KEY not set"
    echo "Test execution will be skipped (generation only)"
    GENERATE_ONLY="--generate-only"
else
    GENERATE_ONLY=""
fi

# Build the project if needed
if [ ! -d "dist" ]; then
    echo "📦 Building project..."
    pnpm install
    pnpm build
    echo ""
fi

# Clean up previous runs
rm -rf .monkey-test-generated artifacts 2>/dev/null || true

echo "📋 Demo Scenarios:"
echo "  1. Generate tests from last commit"
echo "  2. Generate tests from main branch"
echo "  3. Preview tests only (no execution)"
echo ""

# Scenario 1: Test from last commit
echo "=========================================="
echo "Scenario 1: Generate tests from last commit"
echo "=========================================="
echo ""
echo "Command: monkey-test --from-commit HEAD~1 $GENERATE_ONLY"
echo ""

read -p "Press Enter to continue..."

node dist/index.js --from-commit HEAD~1 $GENERATE_ONLY

echo ""
echo "✅ Scenario 1 complete!"
echo ""

# Show generated files
if [ -d ".monkey-test-generated" ]; then
    echo "📁 Generated test files:"
    ls -lh .monkey-test-generated/
    echo ""

    # Show first test case
    FIRST_TEST=$(ls .monkey-test-generated/*.md 2>/dev/null | head -1)
    if [ -n "$FIRST_TEST" ]; then
        echo "📄 First test case preview:"
        echo "---"
        head -n 30 "$FIRST_TEST"
        echo "---"
        echo ""
    fi
fi

# Show artifacts
if [ -d "artifacts" ]; then
    echo "🗄️  Artifacts created:"
    ls -lh artifacts/
    echo ""
fi

# Cleanup for next scenario
if [ "$#" -eq 0 ]; then
    read -p "Clean up and continue to next scenario? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf .monkey-test-generated artifacts
        echo ""

        # Scenario 2: Test from main branch
        echo "=========================================="
        echo "Scenario 2: Preview tests from main branch"
        echo "=========================================="
        echo ""
        echo "Command: monkey-test --from-commit main --generate-only"
        echo ""

        read -p "Press Enter to continue..."

        node dist/index.js --from-commit main --generate-only || {
            echo "⚠️  Note: This might fail if there are no changes from main"
        }

        echo ""
        echo "✅ Scenario 2 complete!"
        echo ""

        # Show statistics
        if [ -d ".monkey-test-generated" ]; then
            TEST_COUNT=$(ls .monkey-test-generated/*.md 2>/dev/null | wc -l)
            echo "📊 Statistics:"
            echo "  - Tests generated: $TEST_COUNT"
            echo ""
        fi
    fi
fi

# Summary
echo "=========================================="
echo "Demo Complete! 🎉"
echo "=========================================="
echo ""
echo "What you've learned:"
echo "  ✓ How to generate tests from git diffs"
echo "  ✓ How to preview tests without execution"
echo "  ✓ Where to find generated tests and artifacts"
echo ""
echo "Next steps:"
echo "  1. Review generated tests in .monkey-test-generated/"
echo "  2. Edit tests if needed"
echo "  3. Run with Browser Use API key to execute tests"
echo "  4. Set up GitHub Actions for automated testing"
echo ""
echo "Documentation:"
echo "  - README.md"
echo "  - docs/diff-testing-guide.md"
echo "  - .github/workflows/diff-test.yml"
echo ""
echo "Commands to try:"
echo "  # Generate only"
echo "  monkey-test --from-commit main --generate-only"
echo ""
echo "  # Generate and execute"
echo "  monkey-test --from-commit main"
echo ""
echo "  # Custom settings"
echo "  MAX_TEST_CASES=20 monkey-test --from-commit HEAD~5"
echo ""
echo "Happy testing! 🐒"
