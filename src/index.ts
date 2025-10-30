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
import { exists, runWithConcurrency } from "./utils";
import { TestResult } from "./types";

/**
 * Main test runner class
 */
class BrowserUseTestRunner {
  private config;
  private client: BrowserUseClient | null = null;
  private results: TestResult[] = [];
  private activeSessions: Set<string> = new Set();

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
   * Run all tests with concurrent execution
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
      maxConcurrency: this.config.maxConcurrency,
    });

    // Run tests concurrently with max concurrency limit
    this.results = await runWithConcurrency(
      testFiles,
      this.config.maxConcurrency,
      async (testFile: string) => {
        const testCase = await parseTestCase(
          testFile,
          this.config.timeout,
          this.config.llmModel
        );

        if (!testCase) {
          // Create error result for unparseable test
          return {
            name: "invalid",
            filePath: testFile,
            status: "error",
            error: "Failed to parse test case",
            duration: 0,
            outputFiles: [],
          } as TestResult;
        }

        // Create a dedicated session for this test
        let session: any = null;
        try {
          console.log(`\n🔧 Creating session for test: ${testCase.name}...`);
          session = await this.client!.sessions.createSession();
          this.activeSessions.add(session.id);
          console.log(`✅ Session created: ${session.id}`);

          const result = await executeTest(
            this.client!,
            session,
            testCase,
            testFile,
            this.config
          );

          return result;
        } catch (error) {
          // Handle session creation or test execution errors
          return {
            name: testCase.name,
            filePath: testFile,
            status: "error",
            error: error instanceof Error ? error.message : String(error),
            duration: 0,
            outputFiles: [],
          } as TestResult;
        } finally {
          // Always stop the session after test completes
          if (session && session.id) {
            try {
              await this.client!.sessions.updateSession(session.id, { action: "stop" });
              this.activeSessions.delete(session.id);
              console.log(`🛑 Session stopped: ${session.id}`);
            } catch (stopError) {
              console.warn(`⚠️  Warning: Failed to stop session ${session.id}:`, stopError);
              this.activeSessions.delete(session.id);
            }
          }
        }
      }
    );
  }

  /**
   * Stop all active sessions (for graceful shutdown)
   */
  private async stopAllActiveSessions(): Promise<void> {
    if (this.activeSessions.size === 0) {
      return;
    }

    console.log(`\n🛑 Stopping ${this.activeSessions.size} active session(s)...`);
    
    const stopPromises = Array.from(this.activeSessions).map(async (sessionId) => {
      try {
        await this.client!.sessions.updateSession(sessionId, { action: "stop" });
        console.log(`✅ Stopped session: ${sessionId}`);
      } catch (error) {
        console.warn(`⚠️  Failed to stop session ${sessionId}:`, error);
      }
    });

    await Promise.allSettled(stopPromises);
    this.activeSessions.clear();
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

    // Setup graceful shutdown handler
    const shutdownHandler = async () => {
      console.log("\n\n⚠️  Received interrupt signal - shutting down gracefully...");
      await this.stopAllActiveSessions();
      process.exit(130); // Standard exit code for SIGINT
    };

    process.on("SIGINT", shutdownHandler);
    process.on("SIGTERM", shutdownHandler);

    // Validate configuration
    if (!(await this.validateSetup())) {
      return 2;
    }

    try {
      // Initialize client
      this.initializeClient();

      // Run all tests (with concurrency)
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
    } finally {
      // Ensure all sessions are stopped
      await this.stopAllActiveSessions();
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
