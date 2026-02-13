# Coding Guidelines

## Overview

This document outlines the coding style and quality principles for the TODO app. All contributors should follow these guidelines to ensure a consistent, readable, and maintainable codebase.

## General Formatting

- Use **2 spaces** for indentation (no tabs).
- Lines should not exceed **100 characters** in length.
- End every file with a single newline character.
- Remove trailing whitespace from all lines.
- Use **single quotes** for strings in JavaScript/JSX (e.g., `'hello'` instead of `"hello"`).
- Always include semicolons at the end of statements.
- Use **camelCase** for variable and function names (e.g., `todoItem`, `handleClick`).
- Use **PascalCase** for React component names and class names (e.g., `TodoList`, `TaskItem`).
- Use **UPPER_SNAKE_CASE** for constants (e.g., `MAX_TASKS`, `API_BASE_URL`).

## Import Organization

Organize imports in the following order, separated by a blank line between groups:

1. **Node.js built-in modules** (e.g., `path`, `fs`)
2. **Third-party packages** (e.g., `express`, `react`)
3. **Internal modules / project files** (e.g., `./components/TodoList`, `../utils/helpers`)
4. **Styles and assets** (e.g., `./App.css`)

Example:

```javascript
import React, { useState } from 'react';

import TodoList from './components/TodoList';
import { formatDate } from '../utils/helpers';

import './App.css';
```

## Code Quality Principles

### DRY (Don't Repeat Yourself)

- Extract shared logic into reusable utility functions or custom hooks.
- Avoid copy-pasting code blocks; if the same pattern appears more than twice, refactor it into a shared abstraction.

### KISS (Keep It Simple, Stupid)

- Prefer straightforward, readable solutions over clever or overly compact code.
- Write code that a new contributor can understand without extensive context.

### Single Responsibility

- Each function, module, or component should have one clear purpose.
- If a function is doing too many things, split it into smaller, focused functions.

### Meaningful Naming

- Use descriptive, intention-revealing names for variables, functions, and files.
- Avoid abbreviations unless they are widely understood (e.g., `id`, `url`, `API`).
- Boolean variables should read as a yes/no question: `isLoading`, `hasError`, `canEdit`.

## Linting and Formatting

- Use **ESLint** to enforce code quality and catch common issues.
- Use a consistent ESLint configuration across both frontend and backend packages.
- Run the linter before committing code. Ideally, integrate it into your editor for real-time feedback.
- All linter warnings and errors should be resolved before merging code.

## Comments and Documentation

- Write comments to explain **why** something is done, not **what** the code does (the code itself should be clear enough for that).
- Use JSDoc-style comments for public functions and APIs:

```javascript
/**
 * Marks a todo as completed if all its tasks are checked.
 * @param {string} todoId - The ID of the todo to update.
 * @returns {object} The updated todo object.
 */
function completeTodo(todoId) {
  // ...
}
```

- Remove commented-out code before merging; use version control to retrieve old code if needed.

## Error Handling

- Always handle errors explicitly; never silently swallow exceptions.
- Use `try/catch` for async operations and provide meaningful error messages.
- In Express route handlers, pass errors to the error-handling middleware using `next(err)`.
- On the frontend, display user-friendly error messages and log detailed errors to the console.

## React-Specific Guidelines

- Prefer **functional components** and **hooks** over class components.
- Keep component files focused: one component per file.
- Destructure props at the function parameter level for clarity.
- Use `key` props properly when rendering lists (avoid using array indices as keys when items can be reordered or deleted).
- Lift state up only when necessary; keep state as close to where it's used as possible.

## Backend-Specific Guidelines

- Use **Express Router** to organize routes into logical groups.
- Validate request input early in the handler and return clear error responses (with appropriate HTTP status codes).
- Keep route handlers thin: delegate business logic to service or utility functions.
- Use environment variables for configuration (ports, secrets, external URLs); never hard-code sensitive values.

## Version Control Practices

- Write clear, concise commit messages that describe **what** changed and **why**.
- Keep commits focused: one logical change per commit.
- Use feature branches and pull requests for all changes.
