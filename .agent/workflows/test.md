---
description: Run tests for the project
---

# Testing Workflow

This workflow runs the test suite for the project.

## Steps

// turbo
1. **Install dependencies**
   ```bash
   npm install
   ```

// turbo
2. **Run all tests**
   ```bash
   npm test
   ```

// turbo
3. **Run tests in watch mode** (for development)
   ```bash
   npm test -- --watch
   ```

// turbo
4. **Run tests with coverage**
   ```bash
   npm test -- --coverage
   ```

## Notes
- Tests should be run before committing changes
- Watch mode is useful during development for immediate feedback
- Coverage reports help identify untested code
- Check the test configuration in `package.json` or test config files
