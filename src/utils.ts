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
    timeout: "⏱️",
    "not-finished": "🔄",
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

/**
 * Parse status tag from Browser Use output
 * Expected format: <status>completed</status> or <status>failed</status> or <status>not-finished</status>
 * 
 * @param output The output string from Browser Use task
 * @returns The status value ('completed', 'failed', 'not-finished') or null if not found
 */
export function parseStatusTag(output: string): 'completed' | 'failed' | 'not-finished' | null {
  if (!output) return null;
  
  // Match <status>VALUE</status> tag (case-insensitive)
  const match = output.match(/<status>\s*([^<]+?)\s*<\/status>/i);
  if (!match || !match[1]) return null;
  
  const status = match[1].trim().toLowerCase();
  
  // Validate status value
  if (status === 'completed' || status === 'failed' || status === 'not-finished') {
    return status;
  }
  
  return null;
}

/**
 * Run async tasks with concurrency limit
 * Similar to p-limit but simplified for our use case
 */
export async function runWithConcurrency<T, R>(
  items: T[],
  maxConcurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  const executing: Promise<void>[] = [];

  for (let i = 0; i < items.length; i++) {
    const currentIndex = i;
    const item = items[currentIndex];
    
    if (item === undefined) {
      throw new Error(`Item at index ${currentIndex} is undefined`);
    }
    
    const promise = (async () => {
      results[currentIndex] = await fn(item, currentIndex);
    })().then(() => {
      // Remove this promise from executing array when done
      const index = executing.indexOf(promise);
      if (index > -1) {
        executing.splice(index, 1);
      }
    });
    
    executing.push(promise);
    
    // When we reach max concurrency, wait for one to finish
    if (executing.length >= maxConcurrency) {
      await Promise.race(executing);
    }
  }
  
  // Wait for all remaining tasks to complete
  await Promise.all(executing);
  
  return results;
}
