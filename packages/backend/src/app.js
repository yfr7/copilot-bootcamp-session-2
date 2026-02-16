const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize in-memory SQLite database
const db = new Database(':memory:');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    todo_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    is_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (todo_id) REFERENCES items(id) ON DELETE CASCADE
  )
`);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Prepared statements
const insertItemStmt = db.prepare('INSERT INTO items (name) VALUES (?)');
const insertTaskStmt = db.prepare(
  'INSERT INTO tasks (todo_id, description) VALUES (?, ?)'
);

// Insert some initial data
const initialItems = ['Item 1', 'Item 2', 'Item 3'];

initialItems.forEach(item => {
  insertItemStmt.run(item);
});

console.log('In-memory database initialized with sample data');

/**
 * Recalculates and updates the completion status of a todo based on its tasks.
 * If all tasks are completed, the todo is marked as completed.
 * If any task is incomplete, the todo is marked as incomplete.
 * A todo with no tasks retains its current status.
 * @param {number} todoId - The ID of the todo to update.
 */
const updateTodoCompletionStatus = (todoId) => {
  const tasks = db.prepare('SELECT * FROM tasks WHERE todo_id = ?').all(todoId);

  if (tasks.length === 0) {
    return;
  }

  const allCompleted = tasks.every(task => task.is_completed === 1);
  db.prepare('UPDATE items SET is_completed = ? WHERE id = ?')
    .run(allCompleted ? 1 : 0, todoId);
};

/**
 * Fetches a todo item with its associated tasks.
 * @param {number} id - The ID of the todo.
 * @returns {object|undefined} The todo with tasks array, or undefined.
 */
const getTodoWithTasks = (id) => {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);

  if (!item) {
    return undefined;
  }

  const tasks = db.prepare(
    'SELECT * FROM tasks WHERE todo_id = ? ORDER BY created_at ASC'
  ).all(id);

  return { ...item, tasks };
};

// ─── Todo API Routes ─────────────────────────────────────────────────────────

app.get('/api/items', (req, res) => {
  try {
    const items = db.prepare(
      'SELECT * FROM items ORDER BY created_at DESC'
    ).all();

    const itemsWithTasks = items.map(item => {
      const tasks = db.prepare(
        'SELECT * FROM tasks WHERE todo_id = ? ORDER BY created_at ASC'
      ).all(item.id);

      return { ...item, tasks };
    });

    res.json(itemsWithTasks);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/api/items', (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const result = insertItemStmt.run(name.trim());
    const id = result.lastInsertRowid;
    const newItem = getTodoWithTasks(id);

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.put('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existingItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);

    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const { name, is_completed } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Item name cannot be empty' });
      }

      db.prepare('UPDATE items SET name = ? WHERE id = ?').run(name.trim(), id);
    }

    if (is_completed !== undefined) {
      const completedValue = is_completed ? 1 : 0;
      db.prepare('UPDATE items SET is_completed = ? WHERE id = ?')
        .run(completedValue, id);
    }

    const updatedItem = getTodoWithTasks(parseInt(id));
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.delete('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existingItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);

    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Delete associated tasks first, then the item
    db.prepare('DELETE FROM tasks WHERE todo_id = ?').run(id);
    const result = db.prepare('DELETE FROM items WHERE id = ?').run(id);

    if (result.changes > 0) {
      res.json({ message: 'Item deleted successfully', id: parseInt(id) });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// ─── Task API Routes ─────────────────────────────────────────────────────────

app.get('/api/items/:id/tasks', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existingItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);

    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const tasks = db.prepare(
      'SELECT * FROM tasks WHERE todo_id = ? ORDER BY created_at ASC'
    ).all(id);

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/items/:id/tasks', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existingItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);

    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const { description } = req.body;

    if (!description || typeof description !== 'string' || description.trim() === '') {
      return res.status(400).json({ error: 'Task description is required' });
    }

    const result = insertTaskStmt.run(parseInt(id), description.trim());
    const taskId = result.lastInsertRowid;
    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

    // Adding a new (uncompleted) task may revert a completed todo
    updateTodoCompletionStatus(parseInt(id));

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/items/:id/tasks/:taskId', (req, res) => {
  try {
    const { id, taskId } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    if (!taskId || isNaN(parseInt(taskId))) {
      return res.status(400).json({ error: 'Valid task ID is required' });
    }

    const existingTask = db.prepare(
      'SELECT * FROM tasks WHERE id = ? AND todo_id = ?'
    ).get(taskId, id);

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { description, is_completed } = req.body;

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim() === '') {
        return res.status(400).json({ error: 'Task description cannot be empty' });
      }

      db.prepare('UPDATE tasks SET description = ? WHERE id = ?')
        .run(description.trim(), taskId);
    }

    if (is_completed !== undefined) {
      const completedValue = is_completed ? 1 : 0;
      db.prepare('UPDATE tasks SET is_completed = ? WHERE id = ?')
        .run(completedValue, taskId);
    }

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

    // Recalculate todo completion status
    updateTodoCompletionStatus(parseInt(id));

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/items/:id/tasks/:taskId', (req, res) => {
  try {
    const { id, taskId } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    if (!taskId || isNaN(parseInt(taskId))) {
      return res.status(400).json({ error: 'Valid task ID is required' });
    }

    const existingTask = db.prepare(
      'SELECT * FROM tasks WHERE id = ? AND todo_id = ?'
    ).get(taskId, id);

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);

    // Recalculate todo completion status after removing a task
    updateTodoCompletionStatus(parseInt(id));

    res.json({ message: 'Task deleted successfully', id: parseInt(taskId) });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = { app, db, insertItemStmt, insertTaskStmt };