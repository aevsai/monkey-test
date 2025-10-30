# Modern TypeScript Setup with Bundler

## Understanding the Requirement

The user wants a modern TypeScript configuration where:
- **Development**: Use `tsx` to run `.ts` files directly (fast, no build step)
- **Production**: Build to `.js` files using a bundler (optimized, performant)
- **Imports**: No file extensions in imports (cleaner, works with bundler resolution)
- **TypeScript**: Used only for type-checking (`noEmit: true`)
- **Bundler**: Handles actual compilation (esbuild/tsup)

## Current vs Target Configuration

### Current tsconfig.json
```json
{
  "module": "ESNext",
  "moduleResolution": "bundler",
  "outDir": "./dist",
  "noEmit": false  // TypeScript emits files
}
```

### Target tsconfig.json (Modern Pattern)
```json
{
  "module": "Preserve",
  "moduleResolution": "Bundler", 
  "noEmit": true,  // TypeScript only type-checks
  "target": "ES2022"
}
```

## Questions/Considerations
- Which bundler: tsup (zero-config, recommended) or esbuild (more control)?
- Should we bundle to single file or preserve module structure?
- Keep source maps for debugging?
- Handle shebang (`#!/usr/bin/env node`) in output?

## Edge Cases
- Shebang must be preserved in built output for CLI
- External dependencies shouldn't be bundled
- Need to mark output as executable
- Source maps needed for error debugging

## Implementation Plan

### Phase 1: Update TypeScript Configuration
- [x] Update tsconfig.json to use modern pattern
  - Change `"module"` to `"Preserve"`
  - Change `"moduleResolution"` to `"Bundler"`
  - Set `"noEmit": true`
  - Update other options for modern setup
  - Remove `outDir` (bundler handles this)

### Phase 2: Add Bundler (tsup)
- [ ] Add `tsup` to devDependencies
- [ ] Create `tsup.config.ts` configuration
  - Entry point: `src/index.ts`
  - Output: `dist/index.js`
  - Format: ESM
  - Target: node20
  - External: all dependencies (don't bundle node_modules)
  - Sourcemap: true
  - Clean: true

### Phase 3: Update Build Scripts
- [ ] Change `"build"` script from `tsc` to `tsup`
- [ ] Keep `"dev"` script as `tsx src/index.ts`
- [ ] Keep `"typecheck"` script as `tsc --noEmit`

### Phase 4: Update Dockerfile
- [ ] Use multi-stage build
- [ ] Stage 1: Install deps + build with tsup
- [ ] Stage 2: Copy built files + prod deps only
- [ ] Entrypoint: `node /action/dist/index.js`

### Phase 5: Clean Up Import Extensions
- [ ] Remove `.js` extensions from remaining files:
  - `src/test-executor.ts`
  - `src/test-parser.ts`
- [ ] Ensure all imports use no extensions

## Benefits of This Approach
✅ **Fast development**: tsx runs TypeScript instantly
✅ **Optimized production**: Bundled and minified output
✅ **Clean imports**: No file extensions needed
✅ **Type safety**: TypeScript for type-checking
✅ **Modern standard**: Follows current best practices
✅ **Smaller Docker images**: Single bundled file

## Implementation Order
1. Install tsup
2. Update tsconfig.json
3. Create tsup.config.ts
4. Update package.json scripts
5. Clean up remaining .js extensions in imports
6. Update Dockerfile for production build
7. Test both dev and production modes