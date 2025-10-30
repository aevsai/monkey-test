# Fix ESM Module Resolution Issue

## Understanding the Problem
The application is failing at runtime in Docker with:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/action/dist/config' imported from /action/dist/index.js
```

This is a TypeScript ES Module (ESM) issue. The project uses:
- `"type": "module"` in package.json (ESM mode)
- TypeScript with `"module": "ESNext"` and `"moduleResolution": "bundler"`
- Some files have `.js` extensions in imports, others don't

**Root Cause:** Inconsistent import extensions. Node.js ESM requires explicit file extensions (`.js`) in imports, but `index.ts` is missing them while other files have them.

## Questions/Considerations
- Should we fix all imports to include `.js` extensions?
- Should we change `moduleResolution` from "bundler" to "node16"/"nodenext"?
- Should we use a bundler (esbuild) instead?
- Do we need to update tsconfig to enforce this?

## Edge Cases
- All relative imports must have `.js` extension (even though source is `.ts`)
- TypeScript doesn't rewrite import paths, so `.js` is correct even for `.ts` sources
- Must check all files for consistency
- External package imports (like 'browser-use-sdk') don't need extensions

## Files with Correct Imports (have .js extensions)
- ✅ src/config.ts - uses `"./types.js"`
- ✅ src/reporter.ts - uses `"./types.js"` and `"./utils.js"`
- ✅ src/test-executor.ts - uses `"./types.js"` and `"./utils.js"`
- ✅ src/test-parser.ts - uses `"./types.js"`

## Files with Incorrect Imports (missing .js extensions)
- ❌ src/index.ts - uses `"./config"`, `"./test-parser"`, `"./test-executor"`, `"./reporter"`, `"./utils"`, `"./types"`

## Implementation Plan

### Final Approach: Use esbuild for Production, tsx for Development (SELECTED)
User wants:
- ✅ Development: Reference `.ts` files (no extensions)
- ✅ Production: Build to `.js` for performance
- ✅ Current imports without `.js` extensions should work

**Solution:** Use esbuild which handles `"moduleResolution": "bundler"` properly

- [x] Remove `.js` extensions from all imports (config.ts, reporter.ts, etc.)
- [ ] Add esbuild to devDependencies
- [ ] Update build script to use esbuild instead of tsc
- [ ] Configure esbuild to bundle with proper format (ESM)
- [ ] Update Dockerfile to use esbuild for building
- [ ] Keep multi-stage build for optimization
- [ ] Test build output

**Benefits:**
- ✅ Development uses tsx with `.ts` files (no extensions needed)
- ✅ Production builds to optimized `.js` 
- ✅ Works with existing `"moduleResolution": "bundler"` in tsconfig
- ✅ Handles extensionless imports automatically
- ✅ Creates optimized bundle for Docker
- ✅ No[ ] Update Dockerfile build command

## Recommendation
**Use Approach 1 (tsx)** - User wants to preserve TypeScript files, tsx runs .ts directly without compilation, already in dependencies.

## Implementation Steps
1. Revert .js extensions from index.ts back to no extensions
2. Update Dockerfile to use tsx instead of node
3. Remove build stage from Dockerfile
4. Test in Docker