/**
 * Test parser for markdown test case files
 */

import * as fs from "fs/promises";
import * as path from "path";
import matter from "gray-matter";
import { TestCase, TestMetadata } from "./types";

/**
 * Parse a markdown test case file
 */
export async function parseTestCase(
  filePath: string,
  defaultTimeout: number,
  defaultLlmModel: string
): Promise<TestCase | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const parsed = matter(content);
    
    const metadata = parsed.data as TestMetadata;
    let taskContent = parsed.content.trim();

    // If content has sections, look for "# Task" or "## Task" section
    if (taskContent.includes("# Task") || taskContent.includes("## Task")) {
      const taskLines: string[] = [];
      const lines = taskContent.split("\n");
      let inTaskSection = false;

      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();
        if (trimmed === "# task" || trimmed === "## task") {
          inTaskSection = true;
          continue;
        } else if (line.trim().startsWith("#") && inTaskSection) {
          // New section started
          break;
        } else if (inTaskSection) {
          taskLines.push(line);
        }
      }

      if (taskLines.length > 0) {
        taskContent = taskLines.join("\n").trim();
      }
    }

    // If no task content found, return null
    if (!taskContent) {
      console.warn(`⚠️  Warning: Test case '${filePath}' has no task content`);
      return null;
    }

    // Build test case object
    const testCase: TestCase = {
      name: metadata.name || path.basename(filePath, path.extname(filePath)),
      description: metadata.description || "",
      task: taskContent,
      timeout: metadata.timeout || defaultTimeout,
      llmModel: metadata.llm_model || defaultLlmModel,
      inputFiles: metadata.input_files || [],
      expectedOutput: metadata.expected_output,
    };

    return testCase;
  } catch (error) {
    console.error(`❌ Error parsing test case '${filePath}':`, error);
    return null;
  }
}

/**
 * Find all markdown test files in a directory
 */
export async function findTestFiles(testDirectory: string): Promise<string[]> {
  try {
    const files: string[] = [];
    
    async function walk(dir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (ext === ".md" || ext === ".markdown") {
            files.push(fullPath);
          }
        }
      }
    }
    
    await walk(testDirectory);
    return files.sort();
  } catch (error) {
    console.error(`❌ Error finding test files in '${testDirectory}':`, error);
    return [];
  }
}