---
name: "Simple Page Load Test"
description: "Verify that Example Domain page loads correctly with all key elements"
timeout: 60
llm_model: "browser-use-llm"
---

# Task

Navigate to https://example.com and verify the following:

1. The page loads successfully (no error messages)
2. The page title contains "Example Domain"
3. There is a main heading (h1) that says "Example Domain"
4. There is at least one paragraph of text explaining that the domain is for examples
5. There is a link with the text "More information..." that points to iana.org

Return the verification results as a JSON object:
```json
{
  "page_loaded": true/false,
  "title_correct": true/false,
  "heading_found": true/false,
  "paragraph_found": true/false,
  "link_found": true/false,
  "link_url": "actual URL of the link"
}
```

After the JSON, include a status tag indicating the test result:
- If all checks pass, include: <status>completed</status>
- If any check fails, include: <status>failed</status>
- If you couldn't complete the checks, include: <status>not-finished</status>

# Expected Output

All checks should pass. The page should load successfully with all expected elements present.

The response should include <status>completed</status> tag if successful.