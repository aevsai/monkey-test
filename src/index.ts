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
import { getGitDiff, getCommitInfo } from "./git-diff";
import { generateTestCasesFromDiff, saveArtifacts } from "./test-generator";
import { publishToGitHubActions, exportTestStatistics, addAnnotation } from "./github-actions";

/**
 * Main test runner class
 */
class BrowserUseTestRunner {
  private config;
  private client: BrowserUseClient | null = null;
  private results: TestResult[] = [];
  private sessionPool: Array<{ id: string; session: any }> = [];

  constructor() {
    this.config = loadConfig();
  }

  /**
   * Print help message
   */
  private printHelp(): void {
    console.log(`
🐒 Monkey Test - Browser Use Test Runner

USAGE:
  monkey-test [OPTIONS]

OPTIONS:
  --from-commit <ref>      Generate tests from git diff (commit reference)
  --url <url>              Base URL where the application is deployed
  --context-file <path>    Path to context file describing the solution being tested
  --generate-only          Only generate tests, don't execute them
  --help                   Show this help message

ENVIRONMENT VARIABLES:
  BROWSER_USE_API_KEY        API key for Browser Use (required for standard mode)
  OPENAI_API_KEY             API key for OpenAI (required for --from-commit mode)
  BASE_URL                   Base URL where application is deployed (optional)
  CONTEXT_FILE               Path to context file describing the solution (optional)
  TEST_DIRECTORY             Directory containing test files (default: tests)
  LLM_MODEL                  LLM model for test execution (default: browser-use-llm)
  TEST_GENERATION_MODEL      LLM model for test generation (default: gpt-4-turbo-preview)
  TIMEOUT                    Test timeout in seconds (default: 300)
  MAX_CONCURRENCY            Max concurrent tests (default: 3)
  MAX_DIFF_SIZE              Max diff size in characters (default: 100000)
  MAX_TEST_CASES             Max test cases to generate (default: 10)
  ARTIFACT_DIR               Directory for artifacts (default: artifacts)
  OUTPUT_DIR                 Directory for test outputs (default: browser-use-outputs)
  FAIL_ON_ERROR              Exit with error on test failure (default: true)
  SAVE_OUTPUTS               Save test outputs (default: true)

EXAMPLES:
  # Run existing tests
  monkey-test

  # Run tests against a specific deployment
  monkey-test --url https://staging.example.com

  # Generate tests from git diff
  monkey-test --from-commit main --url https://staging.example.com

  # Generate tests with context file for better accuracy
  monkey-test --from-commit main --context-file ./docs/app-context.md

  # Generate tests only (don't execute)
  monkey-test --from-commit HEAD~3 --generate-only
`);
  }

  /**
   * Run diff-based test generation and execution
   */
  private async runDiffBasedTests(): Promise<void> {
    if (!this.config.fromCommit) {
      throw new Error("fromCommit not specified");
    }

    console.log(`\n🔍 Generating tests from git diff...`);
    console.log(`📍 From commit: ${this.config.fromCommit}`);

    // Get commit info
    let commitInfo;
    try {
      commitInfo = await getCommitInfo(this.config.fromCommit);
      console.log(`📝 Commit: ${commitInfo.hash} by ${commitInfo.author}`);
      console.log(`📅 Date: ${commitInfo.date}`);
      console.log(`💬 Message: ${commitInfo.message}`);
    } catch (error) {
      console.error(`❌ Failed to get commit info: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Get git diff
    console.log(`\n📊 Getting git diff...`);
    const diffResult = await getGitDiff({
      fromCommit: this.config.fromCommit,
      maxDiffSize: this.config.maxDiffSize,
    });

    console.log(`✅ Diff retrieved:`);
    console.log(`   Files changed: ${diffResult.filesChanged.length}`);
    console.log(`   Insertions: +${diffResult.insertions}`);
    console.log(`   Deletions: -${diffResult.deletions}`);
    console.log(`   From: ${diffResult.fromCommit}`);
    console.log(`   To: ${diffResult.toCommit}`);

    // Generate test cases using LLM
    console.log(`\n🤖 Generating test cases using LLM...`);
    const generationResult = await generateTestCasesFromDiff(diffResult, {
      apiKey: this.config.openaiApiKey!,
      model: this.config.testGenerationModel,
      maxTestCases: this.config.maxTestCases,
      outputDir: '.monkey-test-generated',
      baseUrl: this.config.baseUrl,
      contextFile: this.config.contextFile,
    });

    console.log(`✅ Generated ${generationResult.testCases.length} test case(s)`);
    generationResult.testCases.forEach((tc, i) => {
      console.log(`   ${i + 1}. ${tc.name}`);
    });

    // Save artifacts
    console.log(`\n💾 Saving artifacts...`);
    await saveArtifacts(diffResult, generationResult.rawResponse, this.config.artifactDir!);

    // If generate-only mode, stop here
    if (this.config.generateOnly) {
      console.log(`\n✅ Test generation complete (generate-only mode)`);
      console.log(`📁 Generated test files: ${generationResult.testFilePaths.length}`);
      generationResult.testFilePaths.forEach(path => {
        console.log(`   - ${path}`);
      });
      return;
    }

    // Execute generated tests
    console.log(`\n🧪 Executing generated tests...`);
    
    // Override test directory to use generated tests
    this.config.testDirectory = '.monkey-test-generated';

    // Initialize client for test execution
    this.initializeClient();

    // Run the generated tests
    await this.runAllTests();

    // Generate and save report
    const report = generateReport(this.results);
    printSummary(report);
    await saveResults(report);

    // Publish to GitHub Actions if running in CI
    await publishToGitHubActions(report, {
      artifactDir: this.config.artifactDir,
      fromCommit: diffResult.fromCommit,
      toCommit: diffResult.toCommit,
      diffStats: {
        filesChanged: diffResult.filesChanged.length,
        insertions: diffResult.insertions,
        deletions: diffResult.deletions,
      },
    });

    // Export statistics
    exportTestStatistics(report);

    // Add annotations for failed tests
    const failedTests = this.results.filter(r => r.status === 'failed' || r.status === 'error' || r.status === 'timeout');
    if (failedTests.length > 0) {
      addAnnotation('error', `${failedTests.length} test(s) failed`, {
        title: 'Test Failures',
      });
    }
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

    // Skip test directory check if using diff-based generation
    if (!this.config.fromCommit) {
      const testDirExists = await exists(this.config.testDirectory);
      if (!testDirExists) {
        console.error(`❌ Error: Test directory '${this.config.testDirectory}' does not exist`);
        return false;
      }
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
   * Create session pool for reuse
   */
  private async createSessionPool(): Promise<void> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }

    console.log(`\n🔧 Creating session pool with ${this.config.maxConcurrency} session(s)...`);
    
    for (let i = 0; i < this.config.maxConcurrency; i++) {
      try {
        const session = await this.client.sessions.createSession();
        this.sessionPool.push({ id: session.id, session });
        console.log(`✅ Session ${i + 1}/${this.config.maxConcurrency} created: ${session.id}`);
      } catch (error) {
        console.error(`❌ Failed to create session ${i + 1}:`, error);
        throw new Error(`Failed to create session pool: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    console.log(`✅ Session pool ready with ${this.sessionPool.length} session(s)\n`);
  }

  /**
   * Get a session from the pool (round-robin)
   */
  private getSessionFromPool(index: number): any {
    if (this.sessionPool.length === 0) {
      throw new Error("Session pool is empty");
    }
    const poolIndex = index % this.sessionPool.length;
    const poolEntry = this.sessionPool[poolIndex];
    if (!poolEntry) {
      throw new Error(`No session found at pool index ${poolIndex}`);
    }
    return poolEntry.session;
  }

  /**
   * Reset session state between tests
   */
  private async resetSession(session: any): Promise<void> {
    try {
      // Optionally navigate to about:blank or perform other cleanup
      // For now, we'll just verify the session is still active
      // The Browser Use API will handle session state management
      console.log(`🔄 Reusing session: ${session.id}`);
    } catch (error) {
      console.warn(`⚠️  Warning: Failed to reset session ${session.id}:`, error);
      // Continue anyway - the test executor will handle any issues
    }
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
      baseUrl: this.config.baseUrl,
    });

    // Create session pool upfront
    await this.createSessionPool();

    // Run tests concurrently with max concurrency limit
    this.results = await runWithConcurrency(
      testFiles,
      this.config.maxConcurrency,
      async (testFile: string, index: number) => {
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

        // Get a session from the pool for this test
        const session = this.getSessionFromPool(index);
        
        try {
          // Reset/prepare session for reuse
          await this.resetSession(session);

          const result = await executeTest(
            this.client!,
            session,
            testCase,
            testFile,
            this.config
          );

          return result;
        } catch (error) {
          // Handle test execution errors
          return {
            name: testCase.name,
            filePath: testFile,
            status: "error",
            error: error instanceof Error ? error.message : String(error),
            duration: 0,
            outputFiles: [],
          } as TestResult;
        }
      }
    );
  }

  /**
   * Stop all sessions in the pool (for graceful shutdown)
   */
  private async stopAllActiveSessions(): Promise<void> {
    if (this.sessionPool.length === 0) {
      return;
    }

    console.log(`\n🛑 Stopping ${this.sessionPool.length} session(s) from pool...`);
    
    const stopPromises = this.sessionPool.map(async ({ id }) => {
      try {
        await this.client!.sessions.updateSession(id, { action: "stop" });
        console.log(`✅ Stopped session: ${id}`);
      } catch (error) {
        console.warn(`⚠️  Failed to stop session ${id}:`, error);
      }
    });

    await Promise.allSettled(stopPromises);
    this.sessionPool = [];
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

    if (summary.failed > 0 || summary.timeouts > 0) {
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
    // Check for help flag
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      this.printHelp();
      return 0;
    }

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
      // Check if using diff-based test generation
      if (this.config.fromCommit) {
        await this.runDiffBasedTests();

        // If generate-only, return success
        if (this.config.generateOnly) {
          return 0;
        }

        // Otherwise, get exit code from results
        const report = generateReport(this.results);
        return this.getExitCode(report);
      }

      // Standard mode: run existing tests
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
