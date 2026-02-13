# Testing Guidelines

## Overview

This document defines the testing strategy and guidelines for the TODO app. All contributors should follow these practices to ensure code quality, reliability, and maintainability.

## Testing Philosophy

- **Test early, test often:** Write tests alongside new features, not as an afterthought.
- **Test behavior, not implementation:** Focus on what the code does, not how it does it internally.
- **Keep tests maintainable:** Tests should be easy to read, understand, and update as the codebase evolves.
- **Aim for confidence, not just coverage:** Prioritize meaningful tests that catch real bugs over chasing a coverage number.

## Test Types

### Unit Tests

- **Scope:** Individual functions, utilities, and components in isolation.
- **Tools:** Jest (backend and frontend), React Testing Library (frontend components).
- **Requirements:**
  - All new utility functions and helpers must have unit tests.
  - React components should be tested for correct rendering and user interactions.
  - Mock external dependencies (API calls, databases) to keep tests fast and isolated.
- **Naming Convention:** Test files should be placed in a `__tests__/` directory adjacent to the source code, or use the `.test.js` suffix.

### Integration Tests

- **Scope:** Interactions between multiple modules, such as API route handlers with their middleware, or frontend components that interact with the backend API.
- **Tools:** Jest, Supertest (for Express API testing).
- **Requirements:**
  - API endpoints should have integration tests that verify request/response behavior, including error cases.
  - Frontend integration tests should verify that components work correctly together (e.g., form submission updating a list).
  - Use realistic test data that mirrors production scenarios.

### End-to-End (E2E) Tests

- **Scope:** Complete user workflows from the UI through the backend and back.
- **Tools:** To be determined (e.g., Cypress, Playwright) in a future session.
- **Requirements:**
  - Critical user flows should have E2E coverage (e.g., adding a todo, completing a task, deleting a todo).
  - E2E tests should run against a test environment that closely mirrors production.

## Best Practices

### Writing Tests

1. **Arrange-Act-Assert (AAA) pattern:** Structure each test with a clear setup, action, and verification phase.
2. **One assertion per concept:** Each test should verify a single behavior or outcome.
3. **Descriptive test names:** Use names that describe the scenario and expected result, e.g., `should mark todo as completed when all tasks are checked`.
4. **Avoid test interdependence:** Tests should not depend on the state left by other tests. Each test should set up its own preconditions.
5. **Use factories or fixtures:** Create reusable test data builders to reduce duplication.

### Test Coverage

- All new features must include appropriate tests before being merged.
- Bug fixes should include a regression test that reproduces the original bug.
- Aim for at least **80%** code coverage across the project, but prioritize meaningful coverage over hitting a number.

### Running Tests

- Run `npm test` from the project root to execute all tests across both packages.
- Run tests for a specific package by navigating to `packages/frontend` or `packages/backend` and running `npm test`.
- Tests must pass before code can be merged into the main branch.

## Test Organization

```
packages/
  backend/
    __tests__/          # Backend test files
      app.test.js
    src/
  frontend/
    src/
      __tests__/        # Frontend test files
        App.test.js
      setupTests.js     # Test environment setup
```

## Continuous Integration

- All tests run automatically on every push and pull request via GitHub Actions.
- Failing tests block merges to the main branch.
- Test results should be visible in the PR checks.
