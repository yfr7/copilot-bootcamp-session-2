import React, { useState } from 'react';

import TaskList from './TaskList';

/**
 * Renders a single todo item card with its checklist of tasks.
 * @param {object} props
 * @param {object} props.todo - The todo object with tasks array.
 * @param {Function} props.onDelete - Callback to delete the todo.
 * @param {Function} props.onUpdate - Callback to update the todo.
 * @param {Function} props.onAddTask - Callback to add a task to the todo.
 * @param {Function} props.onToggleTask - Callback to toggle a task's completion.
 * @param {Function} props.onDeleteTask - Callback to delete a task.
 * @param {Function} props.onUpdateTask - Callback to update a task description.
 */
function TodoItem({
  todo,
  onDelete,
  onUpdate,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(todo.name);
  const isCompleted = todo.is_completed === 1;

  const handleEditSubmit = (e) => {
    e.preventDefault();

    if (editName.trim() === '') {
      return;
    }

    onUpdate(todo.id, { name: editName.trim() });
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditName(todo.name);
    setIsEditing(false);
  };

  const handleToggleComplete = () => {
    if (todo.tasks && todo.tasks.length > 0) {
      return;
    }

    onUpdate(todo.id, { is_completed: !isCompleted });
  };

  return (
    <li className={`todo-card ${isCompleted ? 'todo-completed' : ''}`}>
      <div className="todo-header">
        <div className="todo-title-area">
          {todo.tasks && todo.tasks.length === 0 && (
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={handleToggleComplete}
              className="todo-checkbox"
              aria-label={`Mark "${todo.name}" as ${isCompleted ? 'incomplete' : 'complete'}`}
            />
          )}
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="edit-form">
              <label htmlFor={`edit-todo-${todo.id}`} className="sr-only">
                Edit todo name
              </label>
              <input
                id={`edit-todo-${todo.id}`}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="edit-input"
                autoFocus
              />
              <button type="submit" className="btn-primary btn-sm">
                Save
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={handleEditCancel}
              >
                Cancel
              </button>
            </form>
          ) : (
            <span
              className={`todo-name ${isCompleted ? 'completed-text' : ''}`}
              onDoubleClick={() => setIsEditing(true)}
              title="Double-click to edit"
            >
              {todo.name}
            </span>
          )}
        </div>
        <div className="todo-actions">
          {!isEditing && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setIsEditing(true)}
              aria-label={`Edit "${todo.name}"`}
            >
              Edit
            </button>
          )}
          <button
            type="button"
            className="btn-danger btn-sm"
            onClick={() => onDelete(todo.id)}
            aria-label={`Delete "${todo.name}"`}
          >
            Delete
          </button>
        </div>
      </div>
      <TaskList
        todoId={todo.id}
        tasks={todo.tasks || []}
        onAddTask={onAddTask}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        onUpdateTask={onUpdateTask}
      />
    </li>
  );
}

export default TodoItem;
