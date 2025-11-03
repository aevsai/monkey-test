# Add Context File Support for Test Generation

## Understanding the Task

The goal is to allow users to provide an optional context file that contains a description of the solution/application being tested. This context would help the LLM generate more accurate and relevant test cases by understanding:
- What the application does
- Architecture/technical stack
- Key features and workflows
- Domain-specific terminology
- Testing priorities

## Considerations

1. **Where to accept this parameter?** - Should be in `TestGenerationOptions` interface
2. **How to read the file?** - Need to add file reading logic
3. **How to integrate into prompt?** - The context should be added to the LLM prompt in a clear section
4. **Error handling** - What if the file doesn't exist or can't be read?
5. **Optional vs required** - Should be optional to maintain backward compatibility
6. **File format** - Should accept plain text/markdown files

## Edge Cases

- File path is provided but file doesn't exist
- File exists but is empty
- File is too large and could exceed token limits
- Invalid file path format
- File encoding issues

## Implementation Checklist

### Core Test Generator Changes
- [x] Add `contextFile?: string` parameter to `TestGenerationOptions` interface
- [x] Import `readFile` from 'fs/promises'
- [x] Create helper function `readContextFile(filePath?: string): Promise<string | null>` to read the context file with error handling
- [x] Modify `buildTestGenerationPrompt()` to accept an optional `contextContent` parameter
- [x] Update the prompt template to include a "Solution Context" section when context is provided
- [x] Update `generateTestCasesFromDiff()` to:
  - [x] Read the context file if provided
  - [x] Pass context content to `buildTestGenerationPrompt()`
  - [x] Log when context file is being used
- [x] Add appropriate error handling for file reading failures (warns but continues)

### GitHub Action Integration
- [x] Add `context-file` input to action.yml inputs section
- [x] Add `CONTEXT_FILE` environment variable mapping in action.yml run step
- [x] Add `contextFile?: string` to Config interface in types.ts
- [x] Update config.ts to read CONTEXT_FILE environment variable
- [x] Add support for --context-file CLI argument in config.ts
- [x] Update index.ts to pass contextFile to generateTestCasesFromDiff
- [x] Update help message in index.ts to document the new option

## What Was Changed

### Core Test Generator (test-generator.ts)
1. Added `contextFile?: string` to `TestGenerationOptions` interface
2. Imported `readFile` from 'fs/promises'
3. Created `readContextFile()` helper function that:
   - Returns null if no file path provided
   - Attempts to read file with UTF-8 encoding
   - Handles errors gracefully with warning message
   - Returns null if file is empty
4. Modified `buildTestGenerationPrompt()` to:
   - Accept optional `contextContent` parameter
   - Include "Solution Context" section in prompt when context is provided
   - Place context section before base URL and git diff sections
5. Updated `generateTestCasesFromDiff()` to:
   - Call `readContextFile()` with the provided context file path
   - Log when context file is being used
   - Pass context content to prompt builder

### GitHub Action Integration
6. **action.yml**:
   - Added `context-file` input with description
   - Mapped it to `CONTEXT_FILE` environment variable in the run step
7. **types.ts**:
   - Added `contextFile?: string` to Config interface
8. **config.ts**:
   - Added reading of `CONTEXT_FILE` environment variable
   - Added support for `--context-file` CLI argument
   - Included `contextFile` in returned config object
9. **index.ts**:
   - Updated `generateTestCasesFromDiff()` call to pass `contextFile` from config
   - Updated help message to document the new `--context-file` option
   - Added `CONTEXT_FILE` to environment variables documentation
   - Added example usage with context file

## Usage in GitHub Action

```yaml
- name: Run Monkey Test
  uses: your-org/monkey-test@v1
  with:
    from-commit: 'main'
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    base-url: 'https://staging.example.com'
    context-file: './docs/app-context.md'  # ← New parameter
```

## Usage in CLI

```bash
# With environment variable
CONTEXT_FILE=./docs/app-context.md monkey-test --from-commit main

# With CLI argument
monkey-test --from-commit main --context-file ./docs/app-context.md
```

## Example Context File

Created `examples/context-file-example.md` demonstrating best practices for context files:
- Application overview and technical stack
- Key features and user workflows
- Important URLs and routes
- Testing priorities
- Known constraints and test data
- Domain-specific terminology

## Documentation Updates

Updated README.md with:
- Added `context-file` to GitHub Action inputs table
- Added `CONTEXT_FILE` to environment variables reference
- Added new section "Using Context Files for Better Test Generation" with:
  - Example context file creation
  - Usage examples (CLI and environment variable)
  - Guidelines on what to include
  - Reference to example file
- Updated CLI usage examples to show context-file option
- Updated example GitHub Actions workflow

## Result

✅ **Feature fully implemented and documented across all integration points:**

### Core Implementation
- ✅ Test generator accepts and uses context files
- ✅ Graceful error handling (warns but continues if file missing)
- ✅ Context content included in LLM prompt

### Integration Points
- ✅ GitHub Action exposes `context-file` input parameter
- ✅ CLI supports `--context-file` argument
- ✅ Environment variable `CONTEXT_FILE` supported
- ✅ Proper flow: action.yml → config.ts → index.ts → test-generator.ts

### Documentation
- ✅ README updated with usage examples
- ✅ Help message includes new option
- ✅ Example context file created
- ✅ Best practices documented

### Quality
- ✅ No TypeScript errors or warnings
- ✅ Backward compatible - all existing workflows continue to work
- ✅ Type-safe implementation
- ✅ Consistent with existing code patterns

The feature is ready for production use! 🎉