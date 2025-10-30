/**
 * LLM-based test generation from git diffs
 */

import OpenAI from 'openai';
import { XMLParser } from 'fast-xml-parser';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { GitDiffResult } from './git-diff';

export interface GeneratedTestCase {
  name: string;
  description: string;
  task: string;
  expectedOutput?: string;
}

export interface TestGenerationOptions {
  apiKey: string;
  model?: string;
  maxTestCases?: number;
  outputDir?: string;
  baseUrl?: string;
}

export interface TestGenerationResult {
  testCases: GeneratedTestCase[];
  rawResponse: string;
  testFilePaths: string[];
}

/**
 * Generate test cases from git diff using LLM
 */
export async function generateTestCasesFromDiff(
  diffResult: GitDiffResult,
  options: TestGenerationOptions
): Promise<TestGenerationResult> {
  console.log('🤖 Generating test cases from diff using LLM...');

  const openai = new OpenAI({
    apiKey: options.apiKey,
  });

  const model = options.model || 'gpt-4-turbo-preview';
  const maxTestCases = options.maxTestCases || 10;

  // Build prompt
  const prompt = buildTestGenerationPrompt(diffResult, maxTestCases, options.baseUrl);

  console.log(`📝 Prompt length: ${prompt.length} characters`);
  console.log(`🔧 Using model: ${model}`);

  // Call LLM with retries
  let rawResponse: string;
  try {
    rawResponse = await callLLMWithRetry(openai, model, prompt);
  } catch (error) {
    throw new Error(`Failed to generate test cases: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log(`✅ Received response from LLM (${rawResponse.length} characters)`);

  // Parse XML response
  const testCases = parseTestCasesFromXML(rawResponse);

  if (testCases.length === 0) {
    throw new Error('No test cases generated from LLM response');
  }

  console.log(`✅ Parsed ${testCases.length} test case(s) from response`);

  // Convert to markdown and save
  const testFilePaths = await saveTestCasesAsMarkdown(
    testCases,
    options.outputDir || '.monkey-test-generated',
    options.baseUrl
  );

  return {
    testCases,
    rawResponse,
    testFilePaths,
  };
}

/**
 * Build prompt for LLM to generate test cases
 */
function buildTestGenerationPrompt(diffResult: GitDiffResult, maxTestCases: number, baseUrl?: string): string {
  const baseUrlSection = baseUrl 
    ? `**Deployment URL:**
The application is deployed at: ${baseUrl}
ALL tests MUST start by navigating to this URL. Include "Navigate to ${baseUrl}" or "Visit ${baseUrl}" at the beginning of each test task.

` 
    : '';

  return `You are a QA engineer tasked with creating browser-based test cases from code changes.

${baseUrlSection}**Git Diff Summary:**
- From commit: ${diffResult.fromCommit}
- To commit: ${diffResult.toCommit}
- Files changed: ${diffResult.filesChanged.length}
- Insertions: ${diffResult.insertions}
- Deletions: ${diffResult.deletions}

**Changed Files:**
${diffResult.filesChanged.map(f => `- ${f}`).join('\n')}

**Full Diff:**
\`\`\`diff
${diffResult.diff}
\`\`\`

**Your Task:**
Analyze the code changes and generate up to ${maxTestCases} browser-based test cases that verify the changes work correctly. Focus on:
1. New features or UI changes
2. Modified behavior or logic
3. Bug fixes that need verification
4. Integration points between components
5. User-facing functionality

**Important Guidelines:**
- Each test should be executable in a browser environment${baseUrl ? ` starting at ${baseUrl}` : ''}
- Write clear, specific tasks that can be automated
- Include expected outcomes where applicable
- Focus on end-to-end user scenarios
- Prioritize critical functionality over minor changes
- If changes are backend-only or non-testable in browser, generate fewer tests

**Output Format:**
You MUST respond with valid XML in the following format:

<testplan>
  <testcase>
    <name>Test Case Name</name>
    <description>Brief description of what this test verifies</description>
    <task>Detailed step-by-step instructions for the browser automation agent. Be specific about URLs to visit, buttons to click, forms to fill, etc.</task>
    <expected_output>What the successful test outcome should look like (optional)</expected_output>
  </testcase>
  <testcase>
    <name>Another Test Case</name>
    <description>Another test description</description>
    <task>Another set of detailed instructions...</task>
  </testcase>
</testplan>

Generate the test cases now:`;
}

/**
 * Call LLM with retry logic
 */
async function callLLMWithRetry(
  openai: OpenAI,
  model: string,
  prompt: string,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Calling LLM (attempt ${attempt}/${maxRetries})...`);

      const response = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a QA engineer who generates browser test cases from code changes. Always respond with valid XML in the specified format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_completion_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      return content;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`⚠️  Attempt ${attempt} failed: ${lastError.message}`);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Failed to call LLM after retries');
}

/**
 * Parse test cases from XML response
 */
function parseTestCasesFromXML(xmlResponse: string): GeneratedTestCase[] {
  // Extract XML content if wrapped in markdown code blocks
  let xmlContent = xmlResponse.trim();
  
  const xmlMatch = xmlContent.match(/```(?:xml)?\s*([\s\S]*?)\s*```/);
  if (xmlMatch && xmlMatch[1]) {
    xmlContent = xmlMatch[1];
  }

  // Try to find <testplan> tags
  const testplanMatch = xmlContent.match(/<testplan>([\s\S]*)<\/testplan>/);
  if (testplanMatch) {
    xmlContent = `<testplan>${testplanMatch[1]}</testplan>`;
  }

  // Parse XML
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: true,
    trimValues: true,
  });

  let parsed;
  try {
    parsed = parser.parse(xmlContent);
  } catch (error) {
    console.error('❌ Failed to parse XML response');
    console.error('Raw response:', xmlResponse);
    throw new Error(`Invalid XML response: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Extract test cases
  const testCases: GeneratedTestCase[] = [];
  
  if (!parsed.testplan) {
    throw new Error('No <testplan> element found in response');
  }

  const testcaseData = parsed.testplan.testcase;
  
  if (!testcaseData) {
    throw new Error('No <testcase> elements found in response');
  }

  // Handle single test case or array
  const testcaseArray = Array.isArray(testcaseData) ? testcaseData : [testcaseData];

  for (const tc of testcaseArray) {
    if (!tc.name || !tc.task) {
      console.warn('⚠️  Skipping invalid test case (missing name or task):', tc);
      continue;
    }

    testCases.push({
      name: String(tc.name).trim(),
      description: tc.description ? String(tc.description).trim() : '',
      task: String(tc.task).trim(),
      expectedOutput: tc.expected_output ? String(tc.expected_output).trim() : undefined,
    });
  }

  return testCases;
}

/**
 * Convert test cases to markdown format and save to files
 */
async function saveTestCasesAsMarkdown(
  testCases: GeneratedTestCase[],
  outputDir: string,
  baseUrl?: string
): Promise<string[]> {
  // Create output directory
  await mkdir(outputDir, { recursive: true });

  const filePaths: string[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    if (!tc) {
      console.warn(`⚠️  Skipping undefined test case at index ${i}`);
      continue;
    }
    
    const sanitizedName = tc.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const filename = `${i + 1}-${sanitizedName}.md`;
    const filepath = join(outputDir, filename);

    // Generate markdown content
    const markdown = generateMarkdownTestCase(tc, baseUrl);

    // Write file
    await writeFile(filepath, markdown, 'utf-8');
    filePaths.push(filepath);

    console.log(`💾 Saved test case: ${filename}`);
  }

  return filePaths;
}

/**
 * Generate markdown test case from generated test case
 */
function generateMarkdownTestCase(testCase: GeneratedTestCase, baseUrl?: string): string {
  const baseUrlSection = baseUrl 
    ? `## Test URL

Conduct testing at: **${baseUrl}**

`
    : '';

  let markdown = `---
name: ${testCase.name}
description: ${testCase.description}
---

# ${testCase.name}

${testCase.description}

${baseUrlSection}## Task

${testCase.task}
`;

  if (testCase.expectedOutput) {
    markdown += `
## Expected Output

${testCase.expectedOutput}
`;
  }

  return markdown;
}

/**
 * Save raw artifacts (diff and LLM response)
 */
export async function saveArtifacts(
  diffResult: GitDiffResult,
  rawResponse: string,
  artifactDir: string
): Promise<void> {
  await mkdir(artifactDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Save diff
  const diffPath = join(artifactDir, `diff-${timestamp}.txt`);
  const diffContent = `From: ${diffResult.fromCommit}
To: ${diffResult.toCommit}
Files changed: ${diffResult.filesChanged.length}
Insertions: ${diffResult.insertions}
Deletions: ${diffResult.deletions}

Changed files:
${diffResult.filesChanged.map(f => `  ${f}`).join('\n')}

${diffResult.diff}
`;
  await writeFile(diffPath, diffContent, 'utf-8');
  console.log(`💾 Saved diff artifact: ${diffPath}`);

  // Save raw LLM response
  const responsePath = join(artifactDir, `llm-response-${timestamp}.txt`);
  await writeFile(responsePath, rawResponse, 'utf-8');
  console.log(`💾 Saved LLM response artifact: ${responsePath}`);
}