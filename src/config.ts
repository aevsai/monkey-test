/**
 * Configuration management for Browser Use Test Runner
 */

import { Config } from "./types";

/**
 * Load configuration from environment variables and CLI args
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
  const baseUrl = process.env.BASE_URL || getCliArg("--url");

  // Diff-based test generation options
  const fromCommit = process.env.FROM_COMMIT || getCliArg("--from-commit");
  const openaiApiKey = process.env.OPENAI_API_KEY || "";
  const testGenerationModel = process.env.TEST_GENERATION_MODEL || "gpt-4-turbo-preview";
  const generateOnly = process.env.GENERATE_ONLY === "true" || hasCliFlag("--generate-only");
  const artifactDir = process.env.ARTIFACT_DIR || "artifacts";
  const maxDiffSize = parseInt(process.env.MAX_DIFF_SIZE || "100000", 10);
  const maxTestCases = parseInt(process.env.MAX_TEST_CASES || "10", 10);
  const contextFile = process.env.CONTEXT_FILE || getCliArg("--context-file");

  return {
    apiKey,
    testDirectory,
    llmModel,
    failOnError,
    timeout,
    saveOutputs,
    outputDir,
    maxConcurrency,
    fromCommit,
    openaiApiKey,
    testGenerationModel,
    generateOnly,
    artifactDir,
    maxDiffSize,
    maxTestCases,
    baseUrl,
    contextFile,
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: Config): {
  valid: boolean;
  error?: string;
} {
  // If using diff-based generation, validate OpenAI key
  if (config.fromCommit) {
    if (!config.openaiApiKey) {
      return {
        valid: false,
        error: "OPENAI_API_KEY environment variable is required when using --from-commit",
      };
    }
  } else {
    // Standard mode requires Browser Use API key
    if (!config.apiKey) {
      return {
        valid: false,
        error: "BROWSER_USE_API_KEY environment variable is not set",
      };
    }
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

  if (config.maxDiffSize && config.maxDiffSize <= 0) {
    return {
      valid: false,
      error: "MAX_DIFF_SIZE must be a positive number",
    };
  }

  if (config.maxTestCases && config.maxTestCases <= 0) {
    return {
      valid: false,
      error: "MAX_TEST_CASES must be a positive number",
    };
  }

  return { valid: true };
}

/**
 * Get CLI argument value
 */
function getCliArg(flag: string): string | undefined {
  const args = process.argv;
  const flagIndex = args.indexOf(flag);
  
  if (flagIndex !== -1 && flagIndex + 1 < args.length) {
    return args[flagIndex + 1];
  }
  
  return undefined;
}

/**
 * Check if CLI flag is present
 */
function hasCliFlag(flag: string): boolean {
  return process.argv.includes(flag);
}