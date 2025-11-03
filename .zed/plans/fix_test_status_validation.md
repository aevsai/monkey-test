# Fix Test Status Validation

## Problem Understanding
Currently, test cases are marked as "passed" whenever the Browser Use task finishes, regardless of whether the task actually completed successfully or met the expected output criteria. The test executor doesn't have a reliable way to determine if the Browser Use agent successfully completed the task or encountered issues.

**Additional Issue**: Error "400 another task already spawned in this session" occurs because Browser Use sessions can only run one task at a time, and we're trying to reuse sessions that still have active tasks.

## Edge Cases and Considerations
1. **Status Tag Parsing**: Need to reliably extract the status tag from output
2. **Status Values**: Support three states: completed, failed, not-finished
3. **Missing Status Tag**: Handle cases where agent doesn't include the tag
4. **Multiple Status Tags**: Handle edge case of multiple tags in output
5. **Case Sensitivity**: Status values should be case-insensitive
6. **Output Format**: Tag should be easy for both AI and humans to use
7. **Backward Compatibility**: Existing tests should still work

## New Approach: Standardized Status Tag

Instead of trying to parse various failure indicators, we'll instruct the Browser Use agent to include a standardized status tag in its output:

```
<status>completed</status>  - Task completed successfully
<status>failed</status>     - Task failed or encountered errors
<status>not-finished</status> - Task didn't complete in time
```

## Plan

- [x] Revert complex validation logic from test-executor.ts
- [x] Update task instructions to require status tag in output
- [x] Implement status tag parser utility function
- [x] Update test executor to extract and validate status tag
- [x] Handle missing status tag gracefully (default to old behavior)
- [x] Update example tests to include status tag in their instructions
- [x] Test the changes with various scenarios
- [x] Update documentation
- [x] Fix session reuse bug - create fresh sessions for each test instead of pooling
- [x] Change not-finished to not count as failure

## Implementation Strategy

1. **Modify task instructions**: Prepend instructions to all tasks requiring the status tag
2. **Parse status tag**: Create utility function to extract status from output
3. **Validate based on status**:
   - `completed` → passed
   - `failed` → failed
   - `not-finished` → failed or timeout
   - Missing tag → fallback to current behavior (finished = passed)
4. **Clear reporting**: Log the detected status for debugging

## Attempts Tracking

### Attempt 1: Complex pattern matching (REPLACED)
- What: Tried to detect various failure patterns in output
- Status: **REPLACED** with cleaner approach
- Issues: Too complex, not reliable, hard to maintain

### Attempt 2: Standardized status tag approach ✅
- What: Instruct Browser Use to include `<status>` tag in output
- Status: **COMPLETED**
- Changes made:
  1. **utils.ts**: Added `parseStatusTag()` function to extract status from output
     - Matches `<status>VALUE</status>` pattern (case-insensitive)
     - Returns 'completed', 'failed', 'not-finished', or null
  2. **test-executor.ts**: Modified task instruction builder
     - Automatically appends status tag requirement to all tasks
     - Explains the three status values to the Browser Use agent
  3. **test-executor.ts**: Updated status determination logic
     - Parses status tag from task output
     - `<status>completed</status>` → test passes
     - `<status>failed</status>` → test fails with error message
     - `<status>not-finished</status>` → test fails with error message
     - No status tag → defaults to passed (backward compatibility)
  4. **tests/examples/*.md**: Updated all example tests
     - Added status tag instructions to task sections
     - Updated expected output sections to include status tag
  5. **README.md**: Added comprehensive documentation
     - New "Status Tag Requirement" section explaining the feature
     - Updated example tests to show status tag usage
     - Added tips for using status tags in best practices
- Result: Tests now properly pass/fail based on Browser Use agent's explicit status indication
- Build: ✅ Successful
- TypeCheck: ✅ Passed
- Diagnostics: ✅ No errors or warnings

### Attempt 3: Fix session reuse bug ✅
- What: Fix "400 another task already spawned in this session" error
- Status: **COMPLETED**
- Root cause: Browser Use sessions can only run one task at a time. Session pool reuse doesn't work because:
  1. Multiple tests try to use the same session concurrently (even with concurrency limits)
  2. Sessions aren't properly cleaned up between tests
  3. Tasks may still be active in the session when next test tries to use it
- Solution: Create a fresh session for each test instead of session pooling
- Changes made:
  1. **index.ts**: Removed session pool (`sessionPool` array) and replaced with active session tracking (`activeSessions` Set)
  2. **index.ts**: Removed `createSessionPool()`, `getSessionFromPool()`, and `resetSession()` methods
  3. **index.ts**: Updated `runAllTests()` to no longer create session pool upfront
  4. **test-executor.ts**: Changed `executeTest()` signature to accept `client` instead of `session`
  5. **test-executor.ts**: Added session creation at start of each test
  6. **test-executor.ts**: Added `finally` block to always cleanup (stop) session after test completes
  7. **test-executor.ts**: Added optional callbacks `onSessionCreated` and `onSessionClosed` for tracking
  8. **index.ts**: Updated `stopAllActiveSessions()` to work with Set of session IDs
- Result: Each test now gets a fresh session that is properly cleaned up after completion, preventing the "400 another task already spawned" error
- Build: ✅ Successful
- TypeCheck: ✅ Passed
- Diagnostics: ✅ No errors or warnings

### Attempt 4: Make not-finished not count as failure ✅
- What: Change behavior so tests with `<status>not-finished</status>` don't cause the whole test run to fail
- Status: **COMPLETED**
- Rationale: "not-finished" tests are different from "failed" tests - they indicate the task couldn't be completed (e.g., network issues, site down) rather than the task completing with errors
- Changes made:
  1. **types.ts**: Added "not-finished" as a valid TestStatus type
  2. **test-executor.ts**: Changed not-finished status from "failed" to "not-finished"
  3. **test-executor.ts**: Updated console message to show "⚠️ Test NOT FINISHED" instead of "❌ Test FAILED"
  4. **types.ts**: Added `notFinished` count to TestSummary interface
  5. **reporter.ts**: Added not-finished counting in generateReport()
  6. **reporter.ts**: Display not-finished count in summary with cyan color
  7. **utils.ts**: Added "🔄" icon for not-finished status
  8. **index.ts**: Updated getExitCode() to NOT fail on not-finished tests
  9. **index.ts**: Added message showing not-finished count without treating as failure
  10. **github-actions.ts**: Added not_finished_tests to exported statistics
  11. **action.yml**: Added not-finished-tests output
- Result: Tests with `<status>not-finished</status>` are tracked separately and don't cause exit code 1
- Exit codes now:
  - 0: All tests passed (or only not-finished)
  - 1: Tests failed (failed or timeout status)
  - 2: Tests encountered errors
- Build: ✅ Successful
- TypeCheck: ✅ Passed
- Diagnostics: ✅ No errors or warnings
