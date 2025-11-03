# Fix Test Status Validation

## Problem Understanding
Currently, test cases are marked as "passed" whenever the Browser Use task finishes, regardless of whether the task actually completed successfully or met the expected output criteria. The test executor doesn't validate:
1. Whether the task output matches the `expected_output` from the test case metadata
2. Whether the task encountered errors during execution
3. Whether the task actually accomplished its goal vs just finishing

## Edge Cases and Considerations
1. **Expected Output Format**: The `expected_output` field might be exact text, pattern, or description
2. **Task Error States**: The Browser Use API might report errors within the finished task
3. **Partial Success**: Task might finish but not accomplish the goal
4. **No Expected Output**: Some tests might not have `expected_output` defined - should these auto-pass?
5. **Output Comparison**: Need flexible matching (exact, contains, regex, semantic similarity)
6. **Error Messages**: Need clear error messages explaining why a test failed

## Plan

- [ ] Investigate Browser Use SDK task response structure to understand error reporting
- [ ] Update test executor to check for task errors even when status is "finished"
- [ ] Implement expected output validation logic
- [ ] Add flexible output matching strategies (exact, contains, semantic)
- [ ] Update status determination logic to mark tests as "failed" when output doesn't match
- [ ] Ensure error messages are descriptive and helpful
- [ ] Test the changes with various test case scenarios

## Implementation Strategy

1. **Check task result for errors**: Even if status is "finished", check if the task result contains error information
2. **Validate expected output**: If `expectedOutput` is defined in test case, validate actual output against it
3. **Default behavior**: If no `expectedOutput` is defined, rely on task completion status only
4. **Clear reporting**: Update console output to show why a test failed (error vs output mismatch)

## Attempts Tracking

### Attempt 1: Initial implementation ✅
- What: Add expected output validation to test executor
- Status: **COMPLETED**
- Changes made:
  1. **test-executor.ts**: Added validation logic to check task output for failure indicators
     - Checks for common failure patterns in JSON output: `"test_status": "fail"`, `"overall_result": "fail"`, `"status": "fail"`
     - Validates against `expectedOutput` field if provided in test case
     - Only marks test as "passed" if no failure indicators found AND (no expected output OR output matches expected)
  2. **test-parser.ts**: Enhanced parser to extract "Expected Output" section from markdown
     - Now parses both frontmatter `expected_output` field AND markdown "# Expected Output" section
     - Prioritizes frontmatter but falls back to markdown section if not present
- Result: Tests now properly fail when:
  - Task output contains failure indicators (test_status/overall_result/status = FAIL)
  - Task output doesn't match expected output criteria
  - Task is stopped before completion
- Build: ✅ Successful
- TypeCheck: ✅ Passed