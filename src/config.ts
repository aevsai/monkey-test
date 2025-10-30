/**
 * Configuration management for Browser Use Test Runner
 */

import { Config } from "./types";

/**
 * Load configuration from environment variables
 */
export function loadConfig(): Config {
  const apiKey = process.env.BROWSER_USE_API_KEY || "";
  const testDirectory = process.env.TEST_DIRECTORY || "tests";
  const llmModel = process.env.LLM_MODEL || "browser-use-llm";
  const failOnError = process.env.FAIL_ON_ERROR !== "false";
  const timeout = parseInt(process.env.TIMEOUT || "300", 10);
  const saveOutputs = process.env.SAVE_OUTPUTS !== "false";
  const outputDir = process.env.OUTPUT_DIR || "browser-use-outputs";
  const maxConcurrency = parseInt(process.env.MAX_CONCURRENCY || "3", 10);

  return {
    apiKey,
    testDirectory,
    llmModel,
    failOnError,
    timeout,
    saveOutputs,
    outputDir,
    maxConcurrency,
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: Config): {
  valid: boolean;
  error?: string;
} {
  if (!config.apiKey) {
    return {
      valid: false,
      error: "BROWSER_USE_API_KEY environment variable is not set",
    };
  }

  if (config.timeout <= 0) {
    return {
      valid: false,
      error: "TIMEOUT must be a positive number",
    };
  }

  if (config.maxConcurrency <= 0) {
    return {
      valid: false,
      error: "MAX_CONCURRENCY must be a positive number",
    };
  }

  return { valid: true };
}