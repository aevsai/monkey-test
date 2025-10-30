/**
 * Reporter for test results
 */

import * as fs from "fs/promises";
import chalk from "chalk";
import { TestResult, TestReport, TestSummary } from "./types";
import {
  formatDuration,
  formatSuccessRate,
  getStatusIcon,
  separator,
  setGitHubOutput,
} from "./utils";

/**
 * Generate test results report
 */
export function generateReport(results: TestResult[]): TestReport {
  const total = results.length;
  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const errors = results.filter((r) => r.status === "error").length;

  const summary: TestSummary = {
    total,
    passed,
    failed,
    errors,
    successRate: formatSuccessRate(passed, total),
  };

  return {
    summary,
    results,
  };
}

/**
 * Print test summary to console with colors
 */
export function printSummary(report: TestReport): void {
  const { summary, results } = report;

  console.log(`\n${separator()}`);
  console.log(chalk.bold("📊 TEST SUMMARY"));
  console.log(separator());
  console.log(`Total Tests:    ${summary.total}`);
  console.log(chalk.green(`✅ Passed:      ${summary.passed}`));
  console.log(chalk.red(`❌ Failed:      ${summary.failed}`));
  console.log(chalk.yellow(`⚠️  Errors:      ${summary.errors}`));
  console.log(`Success Rate:   ${summary.successRate}`);
  console.log(`${separator()}\n`);

  // Print individual test results
  if (results.length > 0) {
    console.log("📋 Individual Test Results:");
    for (const result of results) {
      const icon = getStatusIcon(result.status);
      const duration = formatDuration(result.duration);
      const statusColor =
        result.status === "passed"
          ? chalk.green
          : result.status === "failed"
          ? chalk.red
          : chalk.yellow;

      console.log(
        `  ${icon} ${statusColor(result.name)} ${chalk.gray(`(${duration})`)}`
      );

      if (result.error) {
        console.log(chalk.red(`      Error: ${result.error}`));
      }
    }
    console.log();
  }
}

/**
 * Save test results to JSON file
 */
export async function saveResults(
  report: TestReport,
  outputFile: string = "test-results.json"
): Promise<void> {
  try {
    await fs.writeFile(outputFile, JSON.stringify(report, null, 2), "utf-8");
    console.log(`💾 Results saved to: ${outputFile}`);

    // Set GitHub Actions outputs
    await setGitHubOutput("results", JSON.stringify(report));
    await setGitHubOutput("total-tests", String(report.summary.total));
    await setGitHubOutput("passed-tests", String(report.summary.passed));
    await setGitHubOutput("failed-tests", String(report.summary.failed));
    await setGitHubOutput("results-file", outputFile);
  } catch (error) {
    console.warn(`⚠️  Warning: Failed to save results:`, error);
  }
}

/**
 * Print configuration info
 */
export function printConfig(config: {
  llmModel: string;
  timeout: number;
  saveOutputs: boolean;
  testDirectory: string;
  maxConcurrency: number;
}): void {
  console.log(`\n🎯 Starting test execution...`);
  console.log(`📁 Test directory: ${config.testDirectory}`);
  console.log(`⚙️  LLM Model: ${config.llmModel}`);
  console.log(`⏱️  Timeout: ${config.timeout}s per test`);
  console.log(`💾 Save outputs: ${config.saveOutputs}`);
  console.log(`🔀 Max concurrent tests: ${config.maxConcurrency}`);
}

/**
 * Print header
 */
export function printHeader(): void {
  console.log(chalk.bold.blue("🚀 Browser Use Test Runner"));
  console.log(`${separator()}\n`);
}