/**
 * GitHub Actions integration for artifacts and summaries
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { TestReport } from './types';
import { existsSync } from 'fs';

/**
 * Check if running in GitHub Actions environment
 */
export function isGitHubActions(): boolean {
  return process.env.GITHUB_ACTIONS === 'true';
}

/**
 * Get GitHub Actions workspace directory
 */
export function getGitHubWorkspace(): string | null {
  return process.env.GITHUB_WORKSPACE || null;
}

/**
 * Get GitHub Actions step summary file path
 */
export function getStepSummaryFile(): string | null {
  return process.env.GITHUB_STEP_SUMMARY || null;
}

/**
 * Write content to GitHub Actions step summary
 */
export async function writeStepSummary(content: string): Promise<void> {
  const summaryFile = getStepSummaryFile();
  
  if (!summaryFile) {
    console.warn('⚠️  GITHUB_STEP_SUMMARY not set, skipping summary');
    return;
  }

  try {
    // Append to summary file
    await writeFile(summaryFile, content + '\n', { flag: 'a' });
    console.log('✅ Written to GitHub Actions step summary');
  } catch (error) {
    console.error('❌ Failed to write step summary:', error);
  }
}

/**
 * Generate markdown summary for test results
 */
export function generateTestSummaryMarkdown(report: TestReport, options?: {
  title?: string;
  fromCommit?: string;
  toCommit?: string;
  diffStats?: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
}): string {
  const { summary, results } = report;
  const title = options?.title || '🧪 Test Results';

  let markdown = `## ${title}\n\n`;

  // Add diff information if provided
  if (options?.fromCommit && options?.toCommit) {
    markdown += `**Generated from Git Diff:**\n`;
    markdown += `- From: \`${options.fromCommit}\`\n`;
    markdown += `- To: \`${options.toCommit}\`\n`;
    
    if (options.diffStats) {
      markdown += `- Files changed: ${options.diffStats.filesChanged}\n`;
      markdown += `- Insertions: +${options.diffStats.insertions}\n`;
      markdown += `- Deletions: -${options.diffStats.deletions}\n`;
    }
    
    markdown += '\n';
  }

  // Summary statistics
  markdown += `### Summary\n\n`;
  markdown += `| Total | ✅ Passed | ❌ Failed | ⚠️ Errors | Success Rate |\n`;
  markdown += `|-------|----------|----------|-----------|-------------|\n`;
  markdown += `| ${summary.total} | ${summary.passed} | ${summary.failed} | ${summary.errors} | ${summary.successRate} |\n\n`;

  // Detailed results
  if (results.length > 0) {
    markdown += `### Test Cases\n\n`;
    markdown += `| Status | Name | Duration | Details |\n`;
    markdown += `|--------|------|----------|--------|\n`;

    for (const result of results) {
      const statusEmoji = getStatusEmoji(result.status);
      const duration = `${result.duration}s`;
      const name = result.name || 'Unknown';
      const details = result.error ? truncate(result.error, 100) : result.output ? truncate(result.output, 50) : '-';

      markdown += `| ${statusEmoji} | ${escapeMarkdown(name)} | ${duration} | ${escapeMarkdown(details)} |\n`;
    }

    markdown += '\n';
  }

  // Failed tests details
  const failedTests = results.filter(r => r.status === 'failed' || r.status === 'error');
  if (failedTests.length > 0) {
    markdown += `### ❌ Failed Tests Details\n\n`;

    for (const result of failedTests) {
      markdown += `#### ${escapeMarkdown(result.name)}\n\n`;
      markdown += `**File:** \`${result.filePath}\`\n\n`;
      markdown += `**Status:** ${result.status}\n\n`;
      
      if (result.error) {
        markdown += `**Error:**\n\`\`\`\n${result.error}\n\`\`\`\n\n`;
      }
      
      if (result.output) {
        markdown += `**Output:**\n\`\`\`\n${truncate(result.output, 500)}\n\`\`\`\n\n`;
      }
    }
  }

  return markdown;
}

/**
 * Get emoji for test status
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'passed':
      return '✅';
    case 'failed':
      return '❌';
    case 'error':
      return '⚠️';
    case 'pending':
      return '⏳';
    default:
      return '❓';
  }
}

/**
 * Escape markdown special characters
 */
function escapeMarkdown(text: string): string {
  return text.replace(/[|\\`*_{}[\]()#+\-.!]/g, '\\$&');
}

/**
 * Truncate text to max length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

/**
 * Save test results as GitHub Actions artifacts
 */
export async function saveTestArtifacts(
  report: TestReport,
  artifactDir: string
): Promise<string[]> {
  await mkdir(artifactDir, { recursive: true });

  const savedPaths: string[] = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Save JSON report
  const jsonPath = join(artifactDir, `test-results-${timestamp}.json`);
  await writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
  savedPaths.push(jsonPath);
  console.log(`💾 Saved test results (JSON): ${jsonPath}`);

  // Save markdown report
  const markdownPath = join(artifactDir, `test-results-${timestamp}.md`);
  const markdown = generateTestSummaryMarkdown(report);
  await writeFile(markdownPath, markdown, 'utf-8');
  savedPaths.push(markdownPath);
  console.log(`💾 Saved test results (Markdown): ${markdownPath}`);

  // Save individual test outputs
  for (const result of report.results) {
    if (result.output) {
      const sanitizedName = result.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const outputPath = join(artifactDir, `output-${sanitizedName}-${timestamp}.txt`);
      await writeFile(outputPath, result.output, 'utf-8');
      savedPaths.push(outputPath);
    }
  }

  return savedPaths;
}

/**
 * Publish test results to GitHub Actions
 */
export async function publishToGitHubActions(
  report: TestReport,
  options?: {
    artifactDir?: string;
    fromCommit?: string;
    toCommit?: string;
    diffStats?: {
      filesChanged: number;
      insertions: number;
      deletions: number;
    };
  }
): Promise<void> {
  if (!isGitHubActions()) {
    console.log('ℹ️  Not running in GitHub Actions, skipping publication');
    return;
  }

  console.log('\n🚀 Publishing results to GitHub Actions...');

  // Generate and write step summary
  const summaryMarkdown = generateTestSummaryMarkdown(report, {
    title: '🧪 Monkey Test Results',
    fromCommit: options?.fromCommit,
    toCommit: options?.toCommit,
    diffStats: options?.diffStats,
  });

  await writeStepSummary(summaryMarkdown);

  // Save artifacts if directory provided
  if (options?.artifactDir) {
    await saveTestArtifacts(report, options.artifactDir);
  }

  console.log('✅ Published to GitHub Actions');
}

/**
 * Add annotation to GitHub Actions workflow
 */
export function addAnnotation(
  level: 'notice' | 'warning' | 'error',
  message: string,
  options?: {
    file?: string;
    line?: number;
    title?: string;
  }
): void {
  if (!isGitHubActions()) {
    return;
  }

  let annotation = `::${level}`;
  
  if (options?.file) {
    annotation += ` file=${options.file}`;
  }
  
  if (options?.line) {
    annotation += `,line=${options.line}`;
  }
  
  if (options?.title) {
    annotation += `,title=${options.title}`;
  }
  
  annotation += `::${message}`;
  
  console.log(annotation);
}

/**
 * Set output variable for GitHub Actions
 */
export function setOutput(name: string, value: string): void {
  if (!isGitHubActions()) {
    return;
  }

  const outputFile = process.env.GITHUB_OUTPUT;
  
  if (outputFile && existsSync(outputFile)) {
    // Write to GITHUB_OUTPUT file
    const content = `${name}=${value}\n`;
    writeFile(outputFile, content, { flag: 'a' }).catch(error => {
      console.error('Failed to set output:', error);
    });
  } else {
    // Fallback to old format
    console.log(`::set-output name=${name}::${value}`);
  }
}

/**
 * Add summary statistics as outputs
 */
export function exportTestStatistics(report: TestReport): void {
  if (!isGitHubActions()) {
    return;
  }

  const { summary } = report;
  
  setOutput('total_tests', String(summary.total));
  setOutput('passed_tests', String(summary.passed));
  setOutput('failed_tests', String(summary.failed));
  setOutput('error_tests', String(summary.errors));
  setOutput('success_rate', summary.successRate);
  
  console.log('✅ Exported test statistics as outputs');
}