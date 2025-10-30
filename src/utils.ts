/**
 * Utility functions for Browser Use Test Runner
 */

import * as fs from "fs/promises";


/**
 * Check if a file or directory exists
 */
export async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Ignore error if directory already exists
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
      throw error;
    }
  }
}

/**
 * Format duration in seconds to a human-readable string
 */
export function formatDuration(seconds: number): string {
  return `${seconds.toFixed(2)}s`;
}

/**
 * Format success rate as percentage
 */
export function formatSuccessRate(passed: number, total: number): string {
  if (total === 0) return "0%";
  return `${((passed / total) * 100).toFixed(1)}%`;
}

/**
 * Set GitHub Actions output variable
 */
export async function setGitHubOutput(name: string, value: string): Promise<void> {
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (!githubOutput) return;

  try {
    // Handle multiline values
    if (value.includes("\n")) {
      const delimiter = "EOF";
      const output = `${name}<<${delimiter}\n${value}\n${delimiter}\n`;
      await fs.appendFile(githubOutput, output);
    } else {
      await fs.appendFile(githubOutput, `${name}=${value}\n`);
    }
  } catch (error) {
    console.warn(`⚠️  Warning: Failed to set GitHub output '${name}':`, error);
  }
}

/**
 * Sanitize a string for use as a filename
 */
export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Get status icon for test result
 */
export function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    passed: "✅",
    failed: "❌",
    error: "⚠️",
    pending: "⏳",
  };
  return icons[status] || "❓";
}

/**
 * Create a horizontal separator line
 */
export function separator(length: number = 80): string {
  return "=".repeat(length);
}

/**
 * Truncate string to max length with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}