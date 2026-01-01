---
description: Build the project for production
---

# Production Build Workflow

This workflow builds the project for production deployment.

## Steps

// turbo
1. **Install dependencies**
   ```bash
   npm install
   ```

// turbo
2. **Run production build**
   ```bash
   npm run build
   ```

3. **Verify build output**
   - Check the build output directory (usually `dist/` or `build/`)
   - Ensure there are no build errors
   - Review any warnings that may need attention

// turbo
4. **Preview production build** (optional)
   ```bash
   npm run preview
   ```

## Notes
- The build process compiles and optimizes all assets
- Build artifacts are typically placed in a `dist/` or `build/` directory
- Always test the production build before deploying
