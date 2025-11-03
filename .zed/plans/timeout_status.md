# Add Timeout/Incomplete Status for Test Cases

## Overview
Add a new status type to handle cases where the Browser Use agent wasn't able to finish a test case within the timeout period or when the task doesn't complete successfully.

## Current Behavior
- Only 4 status types: "pending", "passed", "failed", "error"
- When agent can't finish, it throws an error and gets marked as "failed"
- No distinction between test failure and test timeout/incomplete

## Desired Behavior
- Add "timeout" status for when agent can't complete within timeout
- Distinguish between actual test failures and incomplete executions
- Better reporting and handling of timeout scenarios

## Implementation Checklist

- [x] Update TestStatus type definition
  - [x] Add "timeout" to the union type in types.ts

- [x] Update test-executor.ts
  - [x] Add timeout detection logic
  - [x] Check task status for timeout/incomplete scenarios
  - [x] Set status to "timeout" when appropriate
  - [x] Handle "stopped" status separately from "finished"

- [x] Update reporter.ts
  - [x] Add timeout counter in TestSummary
  - [x] Update generateReport to count timeout tests
  - [x] Update printSummary to display timeout tests
  - [x] Add timeout section to GitHub Actions summary

- [x] Update utils.ts
  - [x] Add timeout icon (⏱️ or ⌛) to getStatusIcon

- [x] Update github-actions.ts
  - [x] Include timeout tests in failed tests filter
  - [x] Add timeout count to test statistics
  - [x] Update annotations to include timeout info

- [x] Update index.ts
  - [x] Include timeout in failed tests filter
  - [x] Update exit code logic to handle timeouts

- [x] Update action.yml outputs
  - [x] Add timeout-tests output

- [ ] Test the implementation
  - [ ] Verify timeout status is correctly detected
  - [ ] Check timeout displays correctly in console
  - [ ] Ensure GitHub Actions summary includes timeouts
  - [ ] Verify exit code handles timeouts as failures
## Technical Details

### Status Values
- `"pending"` - Test is waiting to run
- `"passed"` - Test completed successfully
- `"failed"` - Test failed (assertion error, task error, etc.)
- `"error"` - Test encountered system error (parse error, session error)
- `"timeout"` - Agent couldn't complete within timeout period

### Detection Logic
```typescript
// In test-executor.ts
if (status === "finished") {
  // Task completed - mark as passed
} else if (status === "stopped") {
  // Check if stopped due to timeout or other reason
  // If timeout exceeded, mark as "timeout"
  // Otherwise mark as "failed"
}
```

### Summary Update
```typescript
interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  errors: number;
  timeouts: number;  // NEW
  successRate: string;
}
```

## Corner Cases

1. **Task stopped but not due to timeout**: Mark as "failed" with appropriate error message
2. **Task times out at exactly the limit**: Still count as timeout
3. **Task status is neither finished nor stopped**: Mark as "error"
4. **Timeout during session creation**: Mark as "error" not "timeout"

## Success Criteria

- Tests that exceed timeout are marked with "timeout" status
- Timeout icon (⏱️) displays in console output
- Test summary includes timeout count
- GitHub Actions summary shows timeout tests separately
- Exit code properly handles timeout scenarios (treat as failure)
- Timeout tests are distinguishable from regular failures in reports

## Implementation Summary

### Changes Made

1. **Updated `types.ts`**
   - Added "timeout" to TestStatus union type
   - Added `timeouts: number` to TestSummary interface

2. **Updated `test-executor.ts`**
   - Added timeout detection logic in task completion handling
   - Checks if task status is "finished" or "stopped"
   - For "stopped" status, compares duration against timeout limit
   - Sets status to "timeout" when duration >= test timeout
   - Added `finalStatus` tracking to distinguish completion types
   - Only saves output files for passed tests

3. **Updated `reporter.ts`**
   - Added timeout counting in generateReport()
   - Added timeout display in printSummary() with magenta color
   - Added timeout color handling for individual test results

4. **Updated `utils.ts`**
   - Added timeout icon ⏱️ to getStatusIcon()

5. **Updated `github-actions.ts`**
   - Added Timeouts column to summary table
   - Included timeout in failed tests filter
   - Added timeout emoji (⏱️) to getStatusEmoji()
   - Added timeout_tests to exportTestStatistics()

6. **Updated `index.ts`**
   - Included timeout in failed tests filter for annotations
   - Updated exit code logic to treat timeouts as failures

7. **Updated `action.yml`**
   - Added timeout-tests output parameter

### Build Status
✅ TypeScript compilation successful
✅ Build completed without errors
✅ No diagnostics errors or warnings