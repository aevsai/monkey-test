---
name: "Form Validation Test"
description: "Test form validation on a contact form with various input scenarios"
timeout: 150
llm_model: "browser-use-llm"
---

# Task

Navigate to https://www.selenium.dev/selenium/web/web-form.html and test the form validation:

1. **Test Empty Form Submission**:
   - Leave all fields empty
   - Click the Submit button
   - Check if validation errors appear

2. **Test Valid Input**:
   - Fill in "Text input" field with: "John Doe"
   - Fill in "Password" field with: "SecurePass123"
   - Fill in "Textarea" field with: "This is a test message"
   - Select an option from the "Dropdown" (any option)
   - Check the first checkbox
   - Click Submit
   - Verify if submission succeeds

3. **Extract Results**:
   - Note the URL after submission
   - Note any success or error messages displayed

Return the results as a JSON object with the following format:
```json
{
  "empty_form_test": {
    "submitted": true/false,
    "validation_errors": ["list of any validation messages"]
  },
  "valid_input_test": {
    "submitted": true/false,
    "success_message": "any success message shown",
    "final_url": "URL after submission"
  }
}
```

After the JSON, include a status tag indicating the test result:
- If both tests behave as expected, include: <status>completed</status>
- If either test fails, include: <status>failed</status>
- If you couldn't complete the tests, include: <status>not-finished</status>

# Expected Output

The form should prevent empty submission and show validation errors. With valid input, the form should submit successfully and redirect or show a success message.

The response should include <status>completed</status> tag if both tests pass as expected.