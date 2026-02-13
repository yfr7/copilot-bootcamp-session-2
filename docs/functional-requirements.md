# Functional Requirements

## FR-1: Todo Management

### FR-1.1: Task Checklist within a Todo

**Description:** A Todo item can contain a list of tasks (checklist). Each task is an individual actionable item that can be checked off independently.

**Acceptance Criteria:**

1. A Todo may have zero or more tasks associated with it.
2. Each task has a description and a completion status (checked/unchecked).
3. Users can add, edit, and remove tasks from a Todo.
4. Users can toggle the checked/unchecked state of each individual task.
5. When **all** tasks within a Todo are checked, the Todo is automatically marked as completed.
6. If a completed Todo has a task unchecked (e.g., a new task is added or an existing one is unchecked), the Todo reverts to an incomplete state.
7. A Todo with no tasks follows standard manual completion behavior.
