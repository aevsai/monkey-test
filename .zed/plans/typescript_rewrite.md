# Rewrite Project to TypeScript with pnpm

## Understanding the task:
Convert the entire Python-based Browser Use test runner to TypeScript using pnpm and the browser-use-sdk package. The TypeScript version should maintain all existing functionality while using the correct SDK API.

## Key requirements from correct example:
```typescript
import { BrowserUseClient } from "browser-use-sdk";
const client = new BrowserUseClient({ apiKey: "bu_..." });
const task = await client.tasks.createTask({ task: "..." });
const result = await task.complete();
```

## Features to maintain:
- Read markdown test files with frontmatter
- Parse test case metadata and task instructions
- Execute tests using BrowserUseClient
- Stream task progress
- Handle input/output files
- Generate JSON reports
- Print colored console output
- Support environment variable configuration
- GitHub Actions integration (GITHUB_OUTPUT)
- Timeout handling
- Error handling and reporting

## Project structure:
```
monkey-test/
├── src/
│   ├── index.ts              # Main entry point
│   ├── types.ts              # TypeScript interfaces
│   ├── config.ts             # Configuration management
│   ├── test-parser.ts        # Markdown parser
│   ├── test-executor.ts      # Test execution logic
│   ├── reporter.ts           # Report generation
│   └── utils.ts              # Utility functions
├── tests/                    # Test markdown files (existing)
├── browser-use-outputs/      # Output directory
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

## Edge cases and considerations:
- Handle missing API key gracefully
- Support both BROWSER_USE_API_KEY env var and config
- Parse frontmatter correctly with proper types
- Handle malformed markdown files
- Stream progress updates with proper async handling
- Download and save output files correctly
- Handle task timeouts
- Proper error handling for network issues
- Cross-platform file path handling
- GitHub Actions output format (multiline support)

## Checklist:

### Project Setup
- [x] Create package.json with dependencies
- [x] Set up TypeScript configuration (tsconfig.json)
- [x] Update .gitignore for Node.js/TypeScript
- [x] Add build and run scripts

### Core Implementation
- [x] Create types.ts with all interfaces
- [x] Create config.ts for environment configuration
- [x] Create test-parser.ts for markdown parsing
- [x] Create test-executor.ts for test execution
- [x] Create reporter.ts for report generation
- [x] Create utils.ts for helper functions
- [x] Create index.ts as main entry point

### Testing & Validation
- [x] Test markdown file parsing
- [x] Test task execution with BrowserUseClient
- [x] Test report generation
- [x] Test GitHub Actions output
- [x] Test error handling

## Dependencies needed:
- `browser-use-sdk` - Browser Use SDK
- `gray-matter` - Frontmatter parsing
- `glob` - File pattern matching
- `chalk` - Terminal colors
- TypeScript dev dependencies

## Implementation notes:
1. Use async/await throughout
2. Proper error handling with try/catch
3. Type-safe interfaces for all data structures
4. Use ES modules (import/export)
5. Follow TypeScript best practices
6. Keep code modular and testable