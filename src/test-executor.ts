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
} from "./utils";

/**
 * Execute a single test case with a dedicated session
 */
export async function executeTest(
  client: BrowserUseClient,
  session: any,
  testCase: TestCase,
  filePath: string,
  config: Config
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

  try {
    // Create task in the provided session
    console.log(`🚀 Creating Browser Use task in session ${session.id}...`);
    console.log(`📋 Task instructions: ${truncate(testCase.task, 200)}...`);

    // Prepend base URL context if configured
    let taskInstructions = testCase.task;
    if (config.baseUrl) {
      taskInstructions = `Conduct testing at: ${config.baseUrl}\n\n${testCase.task}`;
      console.log(`🌐 Base URL: ${config.baseUrl}`);
    }

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
      // Check if the task output indicates failure
      const outputLower = (taskResult.output || "").toLowerCase();
      const hasFailureIndicator = 
        outputLower.includes('"test_status": "fail"') ||
        outputLower.includes('"test_status":"fail"') ||
        outputLower.includes('"overall_result": "fail"') ||
        outputLower.includes('"overall_result":"fail"') ||
        outputLower.includes('"status": "fail"') ||
        outputLower.includes('"status":"fail"') ||
        outputLower.includes('test_status: fail') ||
        outputLower.includes('overall_result: fail') ||
        outputLower.includes('status: fail') ||
        /test[_\s]?status['":\s]*fail/i.test(taskResult.output || "") ||
        /overall[_\s]?result['":\s]*fail/i.test(taskResult.output || "");

      // Check if task output indicates failure
      if (hasFailureIndicator) {
        result.status = "failed";
        result.error = "Test output indicates failure (test_status or overall_result is FAIL)";
        console.log(`❌ Test FAILED in ${result.duration.toFixed(2)}s`);
        console.log(`💥 Reason: ${result.error}`);
        console.log(`📤 Output: ${taskResult.output}`);
      } else if (testCase.expectedOutput) {
        // Validate against expected output if provided
        const expectedLower = testCase.expectedOutput.toLowerCase();
        const actualLower = outputLower;
        
        // Simple validation: check if key phrases from expected output are present
        const isValid = 
          actualLower.includes(expectedLower) ||
          expectedLower.split(/[,.\n]/).filter(phrase => phrase.trim().length > 5)
            .every(phrase => actualLower.includes(phrase.trim().toLowerCase()));
        
        if (isValid) {
          result.status = "passed";
          console.log(`✅ Test PASSED in ${result.duration.toFixed(2)}s`);
          console.log(`📤 Output matches expected criteria`);
          console.log(`📤 Output: ${taskResult.output}`);
        } else {
          result.status = "failed";
          result.error = "Test output does not match expected output";
          console.log(`❌ Test FAILED in ${result.duration.toFixed(2)}s`);
          console.log(`💥 Expected: ${testCase.expectedOutput}`);
          console.log(`📤 Actual: ${taskResult.output}`);
        }
      } else {
        // No expected output and no failure indicators - mark as passed
        result.status = "passed";
        console.log(`✅ Test PASSED in ${result.duration.toFixed(2)}s`);
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