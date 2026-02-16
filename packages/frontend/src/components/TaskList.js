import React, { useState } from 'react';

/**
 * Renders the checklist (sub-tasks) for a todo item.
 * @param {object} props
 * @param {number} props.todoId - The parent todo's ID.
 * @param {Array} props.tasks - Array of task objects.
 * @param {Function} props.onAddTask - Callback to add a task.
 * @param {Function} props.onToggleTask - Callback to toggle a task.
 * @param {Function} props.onDeleteTask - Callback to delete a task.
 * @param {Function} props.onUpdateTask - Callback to update a task description.
 */
function TaskList({
  todoId,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
}) {
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskDesc, setEditTaskDesc] = useState('');

  const handleAddTask = (e) => {
    e.preventDefault();

    if (newTaskDesc.trim() === '') {
      return;
    }

    onAddTask(todoId, newTaskDesc.trim());
    setNewTaskDesc('');
  };

  const handleStartEdit = (task) => {
    setEditingTaskId(task.id);
    setEditTaskDesc(task.description);
  };

  const handleSaveEdit = (taskId) => {
    if (editTaskDesc.trim() === '') {
      return;
    }

    onUpdateTask(todoId, taskId, { description: editTaskDesc.trim() });
    setEditingTaskId(null);
    setEditTaskDesc('');
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditTaskDesc('');
  };

  const completedCount = tasks.filter(t => t.is_completed === 1).length;

  return (
    <div className="task-list">
      {tasks.length > 0 && (
        <p className="task-progress">
          {completedCount}/{tasks.length} tasks completed
        </p>
      )}
      <ul className="tasks" role="list">
        {tasks.map(task => (
          <li key={task.id} className="task-item">
            <input
              type="checkbox"
              checked={task.is_completed === 1}
              onChange={() => onToggleTask(todoId, task.id, !task.is_completed)}
              className="task-checkbox"
              aria-label={`Mark task "${task.description}" as ${task.is_completed ? 'incomplete' : 'complete'}`}
            />
            {editingTaskId === task.id ? (
              <span className="task-edit-area">
                <label htmlFor={`edit-task-${task.id}`} className="sr-only">
                  Edit task description
                </label>
                <input
                  id={`edit-task-${task.id}`}
                  type="text"
                  value={editTaskDesc}
                  onChange={(e) => setEditTaskDesc(e.target.value)}
                  className="task-edit-input"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveEdit(task.id);
                    }

                    if (e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn-primary btn-xs"
                  onClick={() => handleSaveEdit(task.id)}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-xs"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              </span>
            ) : (
              <>
                <span
                  className={`task-description ${task.is_completed === 1 ? 'completed-text' : ''}`}
                  onDoubleClick={() => handleStartEdit(task)}
                  title="Double-click to edit"
                >
                  {task.description}
                </span>
                <span className="task-actions">
                  <button
                    type="button"
                    className="btn-secondary btn-xs"
                    onClick={() => handleStartEdit(task)}
                    aria-label={`Edit task "${task.description}"`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-danger btn-xs"
                    onClick={() => onDeleteTask(todoId, task.id)}
                    aria-label={`Delete task "${task.description}"`}
                  >
                    Remove
                  </button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={handleAddTask} className="add-task-form">
        <label htmlFor={`add-task-${todoId}`} className="sr-only">
          Add a new task
        </label>
        <input
          id={`add-task-${todoId}`}
          type="text"
          value={newTaskDesc}
          onChange={(e) => setNewTaskDesc(e.target.value)}
          placeholder="Add a task..."
          className="add-task-input"
        />
        <button type="submit" className="btn-primary btn-xs">
          + Add task
        </button>
      </form>
    </div>
  );
}

export default TaskList;
