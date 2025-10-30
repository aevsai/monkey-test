/**
 * Type definitions for Browser Use Test Runner
 */

export type TestStatus = "pending" | "passed" | "failed" | "error";

export interface TestMetadata {
  name?: string;
  description?: string;
  timeout?: number;
  llm_model?: string;
  input_files?: string[];
  expected_output?: string;
}

export interface TestCase {
  name: string;
  description: string;
  task: string;
  timeout: number;
  llmModel: string;
  inputFiles: string[];
  expectedOutput?: string;
}

export interface TestResult {
  name: string;
  filePath: string;
  status: TestStatus;
  output?: string;
  error?: string;
  duration: number;
  taskId?: string;
  outputFiles: string[];
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  errors: number;
  successRate: string;
}

export interface TestReport {
  summary: TestSummary;
  results: TestResult[];
}

export interface Config {
  apiKey: string;
  testDirectory: string;
  llmModel: string;
  failOnError: boolean;
  timeout: number;
  saveOutputs: boolean;
  outputDir: string;
}

// SDK types are imported from browser-use-sdk
// We only define types specific to our test runner here