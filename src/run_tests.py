#!/usr/bin/env python3
"""
Browser Use Test Runner
Executes browser tests using Browser Use AI agent based on markdown test cases.
"""

import os
import sys
import json
import glob
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
import frontmatter
from browser_use import BrowserUseClient


class TestResult:
    """Represents the result of a single test case."""

    def __init__(self, name: str, file_path: str):
        self.name = name
        self.file_path = file_path
        self.status = "pending"  # pending, passed, failed, error
        self.output = None
        self.error = None
        self.duration = 0.0
        self.task_id = None
        self.output_files = []

    def to_dict(self) -> Dict[str, Any]:
        """Convert test result to dictionary."""
        return {
            "name": self.name,
            "file_path": self.file_path,
            "status": self.status,
            "output": self.output,
            "error": self.error,
            "duration": self.duration,
            "task_id": self.task_id,
            "output_files": self.output_files,
        }


class BrowserUseTestRunner:
    """Main test runner for Browser Use tests."""

    def __init__(self):
        self.api_key = os.getenv("BROWSER_USE_API_KEY")
        self.test_directory = os.getenv("TEST_DIRECTORY", "tests")
        self.llm_model = os.getenv("LLM_MODEL", "browser-use-llm")
        self.fail_on_error = os.getenv("FAIL_ON_ERROR", "true").lower() == "true"
        self.timeout = int(os.getenv("TIMEOUT", "300"))
        self.save_outputs = os.getenv("SAVE_OUTPUTS", "true").lower() == "true"

        self.client = None
        self.results: List[TestResult] = []
        self.output_dir = Path("browser-use-outputs")

    def validate_config(self) -> bool:
        """Validate configuration and API key."""
        if not self.api_key:
            print("❌ Error: BROWSER_USE_API_KEY environment variable is not set")
            return False

        if not os.path.exists(self.test_directory):
            print(f"❌ Error: Test directory '{self.test_directory}' does not exist")
            return False

        return True

    def initialize_client(self):
        """Initialize Browser Use client."""
        try:
            print(f"🔧 Initializing Browser Use client...")
            self.client = BrowserUseClient(api_key=self.api_key)
            print("✅ Browser Use client initialized successfully")
        except Exception as e:
            print(f"❌ Failed to initialize Browser Use client: {e}")
            raise

    def find_test_files(self) -> List[Path]:
        """Find all markdown test files in the test directory."""
        test_dir = Path(self.test_directory)
        patterns = ["**/*.md", "**/*.markdown"]

        test_files = []
        for pattern in patterns:
            test_files.extend(test_dir.glob(pattern))

        # Sort for consistent ordering
        test_files = sorted(set(test_files))

        print(f"📁 Found {len(test_files)} test file(s) in '{self.test_directory}'")
        return test_files

    def parse_test_case(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """Parse a markdown test case file."""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                post = frontmatter.load(f)

            # Get metadata from frontmatter
            metadata = post.metadata
            content = post.content.strip()

            # Extract task from content
            task = content

            # If content has sections, look for "# Task" section
            if "# Task" in content or "## Task" in content:
                lines = content.split("\n")
                task_lines = []
                in_task_section = False

                for line in lines:
                    if line.strip().lower() in ["# task", "## task"]:
                        in_task_section = True
                        continue
                    elif line.strip().startswith("#") and in_task_section:
                        break
                    elif in_task_section:
                        task_lines.append(line)

                if task_lines:
                    task = "\n".join(task_lines).strip()

            test_case = {
                "name": metadata.get("name", file_path.stem),
                "description": metadata.get("description", ""),
                "task": task,
                "timeout": metadata.get("timeout", self.timeout),
                "llm_model": metadata.get("llm_model", self.llm_model),
                "input_files": metadata.get("input_files", []),
                "expected_output": metadata.get("expected_output", None),
            }

            if not test_case["task"]:
                print(f"⚠️  Warning: Test case '{file_path}' has no task content")
                return None

            return test_case

        except Exception as e:
            print(f"❌ Error parsing test case '{file_path}': {e}")
            return None

    def execute_test(self, file_path: Path, test_case: Dict[str, Any]) -> TestResult:
        """Execute a single test case."""
        result = TestResult(test_case["name"], str(file_path))

        print(f"\n{'='*80}")
        print(f"🧪 Running test: {test_case['name']}")
        print(f"📄 File: {file_path}")
        if test_case["description"]:
            print(f"📝 Description: {test_case['description']}")
        print(f"{'='*80}")

        start_time = time.time()

        try:
            # Create task
            print(f"🚀 Creating Browser Use task...")
            print(f"📋 Task instructions: {test_case['task'][:200]}...")

            task_params = {"task": test_case["task"], "llm": test_case["llm_model"]}

            # Add input files if specified
            if test_case["input_files"]:
                task_params["inputFiles"] = test_case["input_files"]
                print(f"📎 Input files: {test_case['input_files']}")

            task = self.client.tasks.createTask(**task_params)
            result.task_id = task.id

            print(f"✅ Task created: {task.id}")
            print(
                f"⏳ Waiting for task completion (timeout: {test_case['timeout']}s)..."
            )

            # Stream task progress
            last_status = None
            for update in task.stream():
                if update.status != last_status:
                    print(f"📊 Status: {update.status}")
                    last_status = update.status

                if update.status in ["finished", "stopped"]:
                    break

            # Complete task and get result
            task_result = task.complete()

            result.duration = time.time() - start_time
            result.output = task_result.output
            result.status = "passed"

            print(f"✅ Test PASSED in {result.duration:.2f}s")
            print(f"📤 Output: {result.output}")

            # Handle output files
            if hasattr(task_result, "outputFiles") and task_result.outputFiles:
                result.output_files = [f.id for f in task_result.outputFiles]
                print(f"📁 Output files: {len(task_result.outputFiles)}")

                if self.save_outputs:
                    self._save_output_files(task_result.outputFiles, test_case["name"])

        except Exception as e:
            result.duration = time.time() - start_time
            result.status = "failed"
            result.error = str(e)

            print(f"❌ Test FAILED in {result.duration:.2f}s")
            print(f"💥 Error: {result.error}")

        return result

    def _save_output_files(self, output_files: List[Any], test_name: str):
        """Save output files from Browser Use task."""
        try:
            test_output_dir = self.output_dir / test_name.replace(" ", "_").lower()
            test_output_dir.mkdir(parents=True, exist_ok=True)

            for file_obj in output_files:
                try:
                    file_data = self.client.files.download(file_obj.id)
                    file_path = test_output_dir / file_obj.name

                    with open(file_path, "wb") as f:
                        f.write(file_data)

                    print(f"💾 Saved output file: {file_path}")
                except Exception as e:
                    print(
                        f"⚠️  Warning: Failed to save output file '{file_obj.name}': {e}"
                    )

        except Exception as e:
            print(f"⚠️  Warning: Failed to save output files: {e}")

    def run_all_tests(self):
        """Run all tests in the test directory."""
        test_files = self.find_test_files()

        if not test_files:
            print("⚠️  No test files found!")
            return

        print(f"\n🎯 Starting test execution...")
        print(f"⚙️  LLM Model: {self.llm_model}")
        print(f"⏱️  Timeout: {self.timeout}s per test")
        print(f"💾 Save outputs: {self.save_outputs}")

        for test_file in test_files:
            test_case = self.parse_test_case(test_file)

            if not test_case:
                result = TestResult("invalid", str(test_file))
                result.status = "error"
                result.error = "Failed to parse test case"
                self.results.append(result)
                continue

            result = self.execute_test(test_file, test_case)
            self.results.append(result)

    def generate_report(self) -> Dict[str, Any]:
        """Generate test results report."""
        total = len(self.results)
        passed = sum(1 for r in self.results if r.status == "passed")
        failed = sum(1 for r in self.results if r.status == "failed")
        errors = sum(1 for r in self.results if r.status == "error")

        report = {
            "summary": {
                "total": total,
                "passed": passed,
                "failed": failed,
                "errors": errors,
                "success_rate": f"{(passed/total*100):.1f}%" if total > 0 else "0%",
            },
            "results": [r.to_dict() for r in self.results],
        }

        return report

    def print_summary(self, report: Dict[str, Any]):
        """Print test summary to console."""
        summary = report["summary"]

        print(f"\n{'='*80}")
        print("📊 TEST SUMMARY")
        print(f"{'='*80}")
        print(f"Total Tests:    {summary['total']}")
        print(f"✅ Passed:      {summary['passed']}")
        print(f"❌ Failed:      {summary['failed']}")
        print(f"⚠️  Errors:      {summary['errors']}")
        print(f"Success Rate:   {summary['success_rate']}")
        print(f"{'='*80}\n")

        # Print individual test results
        if self.results:
            print("📋 Individual Test Results:")
            for result in self.results:
                status_icon = {
                    "passed": "✅",
                    "failed": "❌",
                    "error": "⚠️",
                    "pending": "⏳",
                }.get(result.status, "❓")

                print(f"  {status_icon} {result.name} ({result.duration:.2f}s)")
                if result.error:
                    print(f"      Error: {result.error}")

    def save_results(
        self, report: Dict[str, Any], output_file: str = "test-results.json"
    ):
        """Save test results to JSON file."""
        try:
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2)

            print(f"💾 Results saved to: {output_file}")

            # Set GitHub Actions output
            self._set_github_output("results", json.dumps(report))
            self._set_github_output("total-tests", str(report["summary"]["total"]))
            self._set_github_output("passed-tests", str(report["summary"]["passed"]))
            self._set_github_output("failed-tests", str(report["summary"]["failed"]))
            self._set_github_output("results-file", output_file)

        except Exception as e:
            print(f"⚠️  Warning: Failed to save results: {e}")

    def _set_github_output(self, name: str, value: str):
        """Set GitHub Actions output variable."""
        github_output = os.getenv("GITHUB_OUTPUT")
        if github_output:
            try:
                with open(github_output, "a") as f:
                    # Handle multiline values
                    if "\n" in value:
                        delimiter = "EOF"
                        f.write(f"{name}<<{delimiter}\n{value}\n{delimiter}\n")
                    else:
                        f.write(f"{name}={value}\n")
            except Exception as e:
                print(f"⚠️  Warning: Failed to set GitHub output '{name}': {e}")

    def run(self) -> int:
        """Main entry point for test runner."""
        print("🚀 Browser Use Test Runner")
        print(f"{'='*80}\n")

        # Validate configuration
        if not self.validate_config():
            return 2

        try:
            # Initialize client
            self.initialize_client()

            # Run all tests
            self.run_all_tests()

            # Generate and save report
            report = self.generate_report()
            self.print_summary(report)
            self.save_results(report)

            # Determine exit code
            summary = report["summary"]

            if summary["errors"] > 0:
                print("⚠️  Some tests encountered errors")
                return 2

            if summary["failed"] > 0:
                if self.fail_on_error:
                    print("❌ Tests failed - exiting with error code")
                    return 1
                else:
                    print("⚠️  Tests failed but fail-on-error is disabled")
                    return 0

            print("✅ All tests passed!")
            return 0

        except Exception as e:
            print(f"\n❌ Fatal error: {e}")
            import traceback

            traceback.print_exc()
            return 2


def main():
    """Main entry point."""
    runner = BrowserUseTestRunner()
    exit_code = runner.run()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
