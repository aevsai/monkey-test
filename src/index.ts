#!/usr/bin/env node
/**
 * Browser Use Test Runner - Main Entry Point
 * Executes browser tests using Browser Use AI agent based on markdown test cases.
 */

import { BrowserUseClient } from "browser-use-sdk";
import { loadConfig, validateConfig } from "./config";
import { findTestFiles, parseTestCase } from "./test-parser";
import { executeTest } from "./test-executor";
import { generateReport, printSummary, saveResults, printConfig, printHeader } from "./reporter";
import { exists } from "./utils";
import { TestResult } from "./types";

/**
 * Main test runner class
 */
class BrowserUseTestRunner {
  private config;
  private client: BrowserUseClient | null = null;
  private results: TestResult[] = [];

  constructor() {
    this.config = loadConfig();
  }

  /**
   * Validate configuration
   */
  private async validateSetup(): Promise<boolean> {
    const validation = validateConfig(this.config);
    if (!validation.valid) {
      console.error(`❌ Error: ${validation.error}`);
      return false;
    }

    const testDirExists = await exists(this.config.testDirectory);
    if (!testDirExists) {
      console.error(`❌ Error: Test directory '${this.config.testDirectory}' does not exist`);
      return false;
    }

    return true;
  }

  /**
   * Initialize Browser Use client
   */
  private initializeClient(): void {
    console.log(`🔧 Initializing Browser Use client...`);
    this.client = new BrowserUseClient({
      apiKey: this.config.apiKey,
    });
    console.log("✅ Browser Use client initialized successfully\n");
  }

  /**
   * Run all tests
   */
  private async runAllTests(): Promise<void> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }

    const testFiles = await findTestFiles(this.config.testDirectory);

    if (testFiles.length === 0) {
      console.warn("⚠️  No test files found!");
      return;
    }

    console.log(`📁 Found ${testFiles.length} test file(s) in '${this.config.testDirectory}'`);

    printConfig({
      llmModel: this.config.llmModel,
      timeout: this.config.timeout,
      saveOutputs: this.config.saveOutputs,
      testDirectory: this.config.testDirectory,
    });

    for (const testFile of testFiles) {
      const testCase = await parseTestCase(
        testFile,
        this.config.timeout,
        this.config.llmModel
      );

      if (!testCase) {
        // Create error result for unparseable test
        const result: TestResult = {
          name: "invalid",
          filePath: testFile,
          status: "error",
          error: "Failed to parse test case",
          duration: 0,
          outputFiles: [],
        };
        this.results.push(result);
        continue;
      }

      const result = await executeTest(
        this.client,
        testCase,
        testFile,
        this.config
      );
      this.results.push(result);
    }
  }

  /**
   * Determine exit code based on results
   */
  private getExitCode(report: any): number {
    const { summary } = report;

    if (summary.errors > 0) {
      console.log("⚠️  Some tests encountered errors");
      return 2;
    }

    if (summary.failed > 0) {
      if (this.config.failOnError) {
        console.log("❌ Tests failed - exiting with error code");
        return 1;
      } else {
        console.log("⚠️  Tests failed but fail-on-error is disabled");
        return 0;
      }
    }

    console.log("✅ All tests passed!");
    return 0;
  }

  /**
   * Main entry point
   */
  async run(): Promise<number> {
    printHeader();

    // Validate configuration
    if (!(await this.validateSetup())) {
      return 2;
    }

    try {
      // Initialize client
      this.initializeClient();

      // Run all tests
      await this.runAllTests();

      // Generate and save report
      const report = generateReport(this.results);
      printSummary(report);
      await saveResults(report);

      // Determine exit code
      return this.getExitCode(report);
    } catch (error) {
      console.error(`\n❌ Fatal error:`, error);
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }
      return 2;
    }
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const runner = new BrowserUseTestRunner();
  const exitCode = await runner.run();
  process.exit(exitCode);
}

// Run the test runner
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(2);
});
