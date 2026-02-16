import React, { useState, useEffect, useCallback } from 'react';

import TodoItem from './components/TodoItem';

import './App.css';

const API_BASE_URL = '/api/items';

function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState('');

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(API_BASE_URL);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      setTodos(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data: ' + err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newItem.trim()) {
      return;
    }

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItem }),
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      const result = await response.json();
      setTodos((prev) => [result, ...prev]);
      setNewItem('');
      setError(null);
    } catch (err) {
      setError('Error adding item: ' + err.message);
      console.error('Error adding item:', err);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      setTodos((prev) => prev.filter(item => item.id !== itemId));
      setError(null);
    } catch (err) {
      setError('Error deleting item: ' + err.message);
      console.error('Error deleting item:', err);
    }
  };

  const handleUpdateTodo = async (itemId, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      const updatedTodo = await response.json();
      setTodos((prev) =>
        prev.map(item => (item.id === itemId ? updatedTodo : item))
      );
      setError(null);
    } catch (err) {
      setError('Error updating item: ' + err.message);
      console.error('Error updating item:', err);
    }
  };

  const handleAddTask = async (todoId, description) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${todoId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error('Failed to add task');
      }

      // Re-fetch to get updated todo with completion status
      await fetchTodos();
      setError(null);
    } catch (err) {
      setError('Error adding task: ' + err.message);
      console.error('Error adding task:', err);
    }
  };

  const handleToggleTask = async (todoId, taskId, isCompleted) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/${todoId}/tasks/${taskId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_completed: isCompleted }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to toggle task');
      }

      // Re-fetch to get updated todo with completion status
      await fetchTodos();
      setError(null);
    } catch (err) {
      setError('Error toggling task: ' + err.message);
      console.error('Error toggling task:', err);
    }
  };

  const handleDeleteTask = async (todoId, taskId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/${todoId}/tasks/${taskId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      // Re-fetch to get updated todo with completion status
      await fetchTodos();
      setError(null);
    } catch (err) {
      setError('Error deleting task: ' + err.message);
      console.error('Error deleting task:', err);
    }
  };

  const handleUpdateTask = async (todoId, taskId, updates) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/${todoId}/tasks/${taskId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      await fetchTodos();
      setError(null);
    } catch (err) {
      setError('Error updating task: ' + err.message);
      console.error('Error updating task:', err);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>To Do App</h1>
        <p>Keep track of your tasks</p>
      </header>

      <main>
        <section className="add-item-section">
          <h2>Add New Todo</h2>
          <form onSubmit={handleSubmit} className="add-todo-form">
            <label htmlFor="new-todo-input" className="sr-only">
              New todo name
            </label>
            <input
              id="new-todo-input"
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Enter todo name"
            />
            <button type="submit" className="btn-primary">
              Add Todo
            </button>
          </form>
        </section>

        <section className="items-section">
          <h2>My Todos</h2>
          {loading && <p className="loading-text">Loading data...</p>}
          {error && <p className="error" role="alert">{error}</p>}
          {!loading && !error && (
            <ul className="todo-list" role="list">
              {todos.length > 0 ? (
                todos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onDelete={handleDelete}
                    onUpdate={handleUpdateTodo}
                    onAddTask={handleAddTask}
                    onToggleTask={handleToggleTask}
                    onDeleteTask={handleDeleteTask}
                    onUpdateTask={handleUpdateTask}
                  />
                ))
              ) : (
                <p className="empty-state">No todos found. Add some!</p>
              )}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;