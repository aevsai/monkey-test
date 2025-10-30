# Fix Dockerfile for TypeScript

## Understanding
The current Dockerfile is configured for Python (python:3.11-slim base image, requirements.txt, pip, Python entrypoint), but the project is actually a TypeScript/Node.js application. The project uses:
- TypeScript with compilation to JavaScript (dist/ directory)
- pnpm as package manager (pnpm-lock.yaml present)
- Node.js >=18.0.0
- Entry point: dist/index.js (compiled from src/index.ts)
- Build step: `tsc` to compile TypeScript to JavaScript

## Questions/Considerations
- Should we use multi-stage build to reduce final image size?
- Should we copy dist/ directly or build inside container?
- Should we use pnpm, npm, or yarn in container?
- What Node.js version (18, 20, or 21)?
- Need to check .dockerignore to see what's excluded

## Edge Cases
- Ensure node_modules are properly installed
- Ensure dist/ is either copied or built in container
- Handle pnpm installation if we choose to use it
- Ensure executable permissions for dist/index.js
- Consider both production and development scenarios

## Implementation Plan

- [x] Change base image from `python:3.11-slim` to `node:20-slim` (using LTS version)
- [x] Update metadata labels to reflect TypeScript/Node.js
- [x] Remove Python-specific commands (pip, requirements.txt)
- [x] Add pnpm installation (matching package.json packageManager version)
- [x] Copy package.json and pnpm-lock.yaml for better layer caching
- [x] Install Node.js dependencies using pnpm
- [x] Copy source code (src/)
- [x] Build TypeScript to JavaScript (run tsc)
- [x] Clean up dev dependencies to reduce image size
- [x] Update entrypoint to use node with dist/index.js
- [x] Consider multi-stage build for smaller final image (optional optimization)
- [x] Update .dockerignore to exclude Node.js specific files instead of Python files

## Alternative Approach
If dist/ is already built and committed, we could skip the build step and just copy dist/ directly. However, building in Docker is more reliable and ensures consistency.

## Implementation Summary
✅ **Completed:** Multi-stage Dockerfile created with:
- **Stage 1 (Builder):** Installs all dependencies, builds TypeScript
- **Stage 2 (Production):** Only production dependencies + compiled dist/
- Uses pnpm@8.15.0 as specified in package.json
- Proper layer caching with package files copied first
- Entrypoint set to `node /action/dist/index.js`

✅ **Also Updated:** .dockerignore file to exclude Node.js/TypeScript specific files (node_modules, tests, IDE files, etc.) and removed Python-specific exclusions.