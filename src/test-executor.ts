/**
 * Test executor for Browser Use tests
 */

import * as fs from "fs/promises";
import * as path from "path";
import { BrowserUseClient } from "browser-use-sdk";
import { TestCase, TestResult, Config } from "./types";
import {
  ensureDir,
  sanitizeFilename,
  truncate,
  separator,
  parseStatusTag,
} from "./utils";

/**
 * Execute a single test case with a fresh session
 */
export async function executeTest(
  client: BrowserUseClient,
  testCase: TestCase,
  filePath: string,
  config: Config,
  onSessionCreated?: (sessionId: string) => void,
  onSessionClosed?: (sessionId: string) => void
): Promise<TestResult> {
  const result: TestResult = {
    name: testCase.name,
    filePath,
    status: "pending",
    duration: 0,
    outputFiles: [],
  };

  console.log(`\n${separator()}`);
  console.log(`🧪 Running test: ${testCase.name}`);
  console.log(`📄 File: ${filePath}`);
  if (testCase.description) {
    console.log(`📝 Description: ${testCase.description}`);
  }
  console.log(separator());

  const startTime = Date.now();

  let session: any = null;

  try {
    // Create a fresh session for this test
    console.log(`🔧 Creating new session for test...`);
    session = await client.sessions.createSession();
    console.log(`✅ Session created: ${session.id}`);

    // Track the session
    if (onSessionCreated) {
      onSessionCreated(session.id);
    }

    // Create task in the session
    console.log(`🚀 Creating Browser Use task in session ${session.id}...`);
    console.log(`📋 Task instructions: ${truncate(testCase.task, 200)}...`);

    // Build task instructions with status tag requirement
    let taskInstructions = testCase.task;

    // Prepend base URL context if configured
    if (config.baseUrl) {
      taskInstructions = `Conduct testing at: ${config.baseUrl}\n\n${taskInstructions}`;
      console.log(`🌐 Base URL: ${config.baseUrl}`);
    }

    // Add status tag requirement to all tasks
    const statusTagInstruction = `\n\nIMPORTANT: You must include a status tag in your response to indicate the result:\n- <status>completed</status> if the task was completed successfully till the last step\n- <status>failed</status> if the task failed or encountered errors\n- <status>not-finished</status> if the task could not be completed\n`;
    taskInstructions = taskInstructions + statusTagInstruction;

    const taskParams: any = {
      sessionId: session.id,
      task: taskInstructions,
    };

    // Only add llm if it's a supported model (optional field)
    // The SDK expects specific model names, but allows custom models too
    if (testCase.llmModel) {
      taskParams.llm = testCase.llmModel;
    }

    // Add input files if specified
    if (testCase.inputFiles.length > 0) {
      taskParams.inputFiles = testCase.inputFiles;
      console.log(`📎 Input files: ${testCase.inputFiles.join(", ")}`);
    }

    const task = await client.tasks.createTask(taskParams);
    result.taskId = task.id;

    console.log(`✅ Task created: ${task.id}`);
    console.log(`⏳ Waiting for task completion (timeout: ${testCase.timeout}s)...`);

    // Watch task status changes and wait for completion
    let lastStatus: string | undefined;
    let taskResult;
    let finalStatus: string | undefined;

    for await (const update of task.watch()) {
      if (update.event === 'status') {
        const status = update.data.status;
        if (status !== lastStatus) {
          console.log(`📊 Status: ${status}`);
          lastStatus = status;
        }

        // Check if task is complete
        if (status === "finished" || status === "stopped") {
          taskResult = update.data;
          finalStatus = status;
          break;
        }
      }
    }

    if (!taskResult) {
      throw new Error("Task did not complete successfully");
    }

    result.duration = (Date.now() - startTime) / 1000;
    result.output = taskResult.output;

    // Determine final status based on task completion
    if (finalStatus === "finished") {
      // Parse status tag from output
      const statusTag = parseStatusTag(taskResult.output || "");

      if (statusTag === "completed") {
        result.status = "passed";
        console.log(`✅ Test PASSED in ${result.duration.toFixed(2)}s`);
        console.log(`📊 Status tag: <status>completed</status>`);
        console.log(`📤 Output: ${taskResult.output}`);
      } else if (statusTag === "failed") {
        result.status = "failed";
        result.error = "Browser Use reported task failure (status tag: failed)";
        console.log(`❌ Test FAILED in ${result.duration.toFixed(2)}s`);
        console.log(`📊 Status tag: <status>failed</status>`);
        console.log(`💥 Reason: ${result.error}`);
        console.log(`📤 Output: ${taskResult.output}`);
      } else if (statusTag === "not-finished") {
        result.status = "not-finished";
        result.error = "Browser Use could not complete the task (status tag: not-finished)";
        console.log(`⚠️  Test NOT FINISHED in ${result.duration.toFixed(2)}s`);
        console.log(`📊 Status tag: <status>not-finished</status>`);
        console.log(`💥 Reason: ${result.error}`);
        console.log(`📤 Output: ${taskResult.output}`);
      } else {
        // No status tag found - default to passed for backward compatibility
        result.status = "passed";
        console.log(`✅ Test PASSED in ${result.duration.toFixed(2)}s`);
        console.log(`⚠️  Warning: No status tag found in output (defaulting to passed)`);
        console.log(`📤 Output: ${taskResult.output}`);
      }
    } else if (finalStatus === "stopped") {
      // Task was stopped - likely due to timeout or manual intervention
      if (result.duration >= testCase.timeout) {
        result.status = "timeout";
        result.error = `Test exceeded timeout of ${testCase.timeout}s`;
        console.log(`⏱️  Test TIMEOUT after ${result.duration.toFixed(2)}s`);
        console.log(`💥 Error: ${result.error}`);
      } else {
        result.status = "failed";
        result.error = "Task was stopped before completion";
        console.log(`❌ Test FAILED in ${result.duration.toFixed(2)}s`);
        console.log(`💥 Error: ${result.error}`);
      }
    } else {
      result.status = "failed";
      result.error = `Unexpected task status: ${finalStatus}`;
      console.log(`❌ Test FAILED in ${result.duration.toFixed(2)}s`);
      console.log(`💥 Error: ${result.error}`);
    }

    // Handle output files (only for passed tests)
    if (result.status === "passed" && taskResult.outputFiles && taskResult.outputFiles.length > 0) {
      result.outputFiles = taskResult.outputFiles.map((file: any) => file.id);
      console.log(`📁 Output files: ${taskResult.outputFiles.length}`);

      if (config.saveOutputs) {
        await saveOutputFiles(
          client,
          task.id,
          taskResult.outputFiles,
          testCase.name,
          config.outputDir
        );
      }
    }
  } catch (error) {
    result.duration = (Date.now() - startTime) / 1000;
    result.status = "failed";
    result.error = error instanceof Error ? error.message : String(error);

    console.log(`❌ Test FAILED in ${result.duration.toFixed(2)}s`);
    console.log(`💥 Error: ${result.error}`);
  } finally {
    // Always cleanup session after test completes
    if (session) {
      try {
        console.log(`🧹 Cleaning up session ${session.id}...`);
        await client.sessions.updateSession(session.id, { action: "stop" });
        console.log(`✅ Session ${session.id} stopped`);

        // Untrack the session
        if (onSessionClosed) {
          onSessionClosed(session.id);
        }
      } catch (error) {
        console.warn(`⚠️  Warning: Failed to cleanup session ${session.id}:`, error);
      }
    }
  }

  return result;
}

/**
 * Save output files from a Browser Use task
 */
async function saveOutputFiles(
  client: BrowserUseClient,
  taskId: string,
  outputFiles: Array<any>,
  testName: string,
  outputDir: string
): Promise<void> {
  try {
    const testOutputDir = path.join(outputDir, sanitizeFilename(testName));
    await ensureDir(testOutputDir);

    for (const fileObj of outputFiles) {
      try {
        // Get presigned URL for download
        const urlResponse = await client.files.getTaskOutputFilePresignedUrl(
          taskId,
          fileObj.id
        );

        // Fetch the file content from the presigned URL
        const response = await fetch(urlResponse.downloadUrl);
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`);
        }

        const fileData = await response.arrayBuffer();
        const filePath = path.join(testOutputDir, fileObj.name);

        await fs.writeFile(filePath, Buffer.from(fileData));
        console.log(`💾 Saved output file: ${filePath}`);
      } catch (error) {
        console.warn(
          `⚠️  Warning: Failed to save output file '${fileObj.name}':`,
          error
        );
      }
    }
  } catch (error) {
    console.warn(`⚠️  Warning: Failed to save output files:`, error);
  }
}
