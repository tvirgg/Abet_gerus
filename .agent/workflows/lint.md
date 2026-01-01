---
description: Lint and format code
---

# Linting and Formatting Workflow

This workflow checks and fixes code quality issues.

## Steps

// turbo
1. **Install dependencies**
   ```bash
   npm install
   ```

// turbo
2. **Run linter**
   ```bash
   npm run lint
   ```

// turbo
3. **Fix auto-fixable issues**
   ```bash
   npm run lint -- --fix
   ```

// turbo
4. **Format code** (if using Prettier)
   ```bash
   npm run format
   ```

## Notes
- Linting helps maintain code quality and consistency
- Many issues can be auto-fixed with the `--fix` flag
- Configure linting rules in `.eslintrc` or similar config files
- Format on save in your editor for best experience
