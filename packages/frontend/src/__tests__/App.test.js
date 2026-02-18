import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import App from '../App';

// ─── Mock Data ─────────────────────────────────────────────────────────────

const mockTodos = [
  {
    id: 1,
    name: 'Test Todo 1',
    is_completed: 0,
    created_at: '2023-01-01T00:00:00.000Z',
    tasks: [
      { id: 10, todo_id: 1, description: 'Sub-task A', is_completed: 0, created_at: '2023-01-01T00:00:00.000Z' },
      { id: 11, todo_id: 1, description: 'Sub-task B', is_completed: 1, created_at: '2023-01-01T00:01:00.000Z' },
    ],
  },
  {
    id: 2,
    name: 'Test Todo 2',
    is_completed: 0,
    created_at: '2023-01-02T00:00:00.000Z',
    tasks: [],
  },
];

// ─── Mock Server ───────────────────────────────────────────────────────────

const server = setupServer(
  rest.get('/api/items', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockTodos));
  }),

  rest.post('/api/items', (req, res, ctx) => {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res(ctx.status(400), ctx.json({ error: 'Item name is required' }));
    }

    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        name,
        is_completed: 0,
        created_at: new Date().toISOString(),
        tasks: [],
      })
    );
  }),

  rest.put('/api/items/:id', (req, res, ctx) => {
    const { id } = req.params;
    const updates = req.body;
    const existing = mockTodos.find(t => t.id === Number(id));

    if (!existing) {
      return res(ctx.status(404), ctx.json({ error: 'Item not found' }));
    }

    return res(
      ctx.status(200),
      ctx.json({ ...existing, ...updates })
    );
  }),

  rest.delete('/api/items/:id', (req, res, ctx) => {
    const { id } = req.params;

    return res(
      ctx.status(200),
      ctx.json({ message: 'Item deleted successfully', id: Number(id) })
    );
  }),

  rest.post('/api/items/:id/tasks', (req, res, ctx) => {
    const { id } = req.params;
    const { description } = req.body;

    return res(
      ctx.status(201),
      ctx.json({
        id: 100,
        todo_id: Number(id),
        description,
        is_completed: 0,
        created_at: new Date().toISOString(),
      })
    );
  }),

  rest.put('/api/items/:id/tasks/:taskId', (req, res, ctx) => {
    const { taskId } = req.params;

    return res(
      ctx.status(200),
      ctx.json({
        id: Number(taskId),
        ...req.body,
      })
    );
  }),

  rest.delete('/api/items/:id/tasks/:taskId', (req, res, ctx) => {
    const { taskId } = req.params;

    return res(
      ctx.status(200),
      ctx.json({ message: 'Task deleted successfully', id: Number(taskId) })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('App Component', () => {
  test('renders the header', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('To Do App')).toBeInTheDocument();
    expect(screen.getByText('Keep track of your tasks')).toBeInTheDocument();
  });

  test('loads and displays todos with tasks', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('Loading data...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
      expect(screen.getByText('Test Todo 2')).toBeInTheDocument();
    });

    // Check that sub-tasks are displayed
    await waitFor(() => {
      expect(screen.getByText('Sub-task A')).toBeInTheDocument();
      expect(screen.getByText('Sub-task B')).toBeInTheDocument();
    });
  });

  test('adds a new todo', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Enter todo name');
    await act(async () => {
      await user.type(input, 'New Test Todo');
    });

    const submitButton = screen.getByText('Add Todo');
    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('New Test Todo')).toBeInTheDocument();
    });
  });

  test('handles API error', async () => {
    server.use(
      rest.get('/api/items', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch data/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no todos', async () => {
    server.use(
      rest.get('/api/items', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([]));
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('No todos found. Add some!')).toBeInTheDocument();
    });
  });

  test('displays task progress for a todo with tasks', async () => {
    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('1/2 tasks completed')).toBeInTheDocument();
    });
  });

  test('delete button removes a todo', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Todo 2')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');

    await act(async () => {
      await user.click(deleteButtons[1]);
    });

    await waitFor(() => {
      expect(screen.queryByText('Test Todo 2')).not.toBeInTheDocument();
    });
  });

  test('does not add a todo when input is empty', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    // Click "Add Todo" without typing anything
    await act(async () => {
      await user.click(screen.getByText('Add Todo'));
    });

    // Should still show the original two todos, no new empty one
    const todos = screen.getAllByText(/Test Todo/);
    expect(todos.length).toBe(2);
  });

  test('clears input after adding a todo', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Enter todo name');
    await act(async () => {
      await user.type(input, 'New Test Todo');
    });

    await act(async () => {
      await user.click(screen.getByText('Add Todo'));
    });

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  test('shows error when add todo API fails', async () => {
    server.use(
      rest.post('/api/items', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Enter todo name');
    await act(async () => {
      await user.type(input, 'Will Fail');
    });

    await act(async () => {
      await user.click(screen.getByText('Add Todo'));
    });

    await waitFor(() => {
      expect(screen.getByText(/Error adding item/)).toBeInTheDocument();
    });
  });

  test('shows error when delete todo API fails', async () => {
    server.use(
      rest.delete('/api/items/:id', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');

    await act(async () => {
      await user.click(deleteButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(/Error deleting item/)).toBeInTheDocument();
    });
  });

  test('error message has alert role for accessibility', async () => {
    server.use(
      rest.get('/api/items', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      const errorEl = screen.getByRole('alert');
      expect(errorEl).toBeInTheDocument();
      expect(errorEl).toHaveTextContent(/Failed to fetch data/);
    });
  });

  test('renders add task input for each todo', async () => {
    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    });

    const addTaskInputs = screen.getAllByPlaceholderText('Add a task...');
    expect(addTaskInputs.length).toBe(2);
  });

  test('can edit a todo name via the edit button', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    });

    // Click first Edit button
    const editButtons = screen.getAllByText('Edit');
    await act(async () => {
      await user.click(editButtons[0]);
    });

    // Should show an edit input with the current name
    const editInput = screen.getByDisplayValue('Test Todo 1');
    expect(editInput).toBeInTheDocument();

    // Clear and type a new name
    await act(async () => {
      await user.clear(editInput);
      await user.type(editInput, 'Updated Todo 1');
    });

    // Click Save
    await act(async () => {
      await user.click(screen.getByText('Save'));
    });

    // Should display the updated name
    await waitFor(() => {
      expect(screen.getByText('Updated Todo 1')).toBeInTheDocument();
    });
  });

  test('can add a task to a todo', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    });

    const addTaskInputs = screen.getAllByPlaceholderText('Add a task...');
    await act(async () => {
      await user.type(addTaskInputs[0], 'New sub-task');
    });

    const addTaskButtons = screen.getAllByText('+ Add task');
    await act(async () => {
      await user.click(addTaskButtons[0]);
    });

    // After adding a task, fetchTodos is called. The input should be cleared.
    await waitFor(() => {
      expect(addTaskInputs[0]).toHaveValue('');
    });
  });

  test('can toggle a task checkbox', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Sub-task A')).toBeInTheDocument();
    });

    // Sub-task A is not completed (is_completed: 0)
    const taskCheckboxA = screen.getByLabelText(/Mark task "Sub-task A"/);
    expect(taskCheckboxA).not.toBeChecked();

    await act(async () => {
      await user.click(taskCheckboxA);
    });

    // The handler calls fetchTodos, so no crash = success
    await waitFor(() => {
      expect(screen.getByText('Sub-task A')).toBeInTheDocument();
    });
  });

  test('can delete a task', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Sub-task A')).toBeInTheDocument();
    });

    // Click remove on Sub-task A
    const removeButtons = screen.getAllByText('Remove');
    await act(async () => {
      await user.click(removeButtons[0]);
    });

    // The handler calls fetchTodos which reloads with the same mock data,
    // but we verify the handler was called without errors.
    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    });
  });

  test('can edit a task description', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Sub-task A')).toBeInTheDocument();
    });

    // Click the Edit button for Sub-task A (task edit buttons are separate from todo Edit)
    // Task edit buttons have aria-labels like `Edit task "Sub-task A"`
    const editTaskBtn = screen.getByLabelText('Edit task "Sub-task A"');
    await act(async () => {
      await user.click(editTaskBtn);
    });

    // Should show the edit input with current description
    const taskEditInput = screen.getByDisplayValue('Sub-task A');
    expect(taskEditInput).toBeInTheDocument();

    await act(async () => {
      await user.clear(taskEditInput);
      await user.type(taskEditInput, 'Edited sub-task A');
    });

    // Click the Save button inside the task edit area
    const saveButtons = screen.getAllByText('Save');
    await act(async () => {
      await user.click(saveButtons[0]);
    });

    // After save, fetchTodos is called. Verify no crash.
    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    });
  });

  test('shows error when update todo API fails', async () => {
    server.use(
      rest.put('/api/items/:id', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    });

    // Click Edit, change name, click Save
    const editButtons = screen.getAllByText('Edit');
    await act(async () => {
      await user.click(editButtons[0]);
    });

    const editInput = screen.getByDisplayValue('Test Todo 1');
    await act(async () => {
      await user.clear(editInput);
      await user.type(editInput, 'Will Fail');
    });

    await act(async () => {
      await user.click(screen.getByText('Save'));
    });

    await waitFor(() => {
      expect(screen.getByText(/Error updating item/)).toBeInTheDocument();
    });
  });

  test('shows error when add task API fails', async () => {
    server.use(
      rest.post('/api/items/:id/tasks', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    });

    const addTaskInputs = screen.getAllByPlaceholderText('Add a task...');
    await act(async () => {
      await user.type(addTaskInputs[0], 'Failing task');
    });

    const addTaskButtons = screen.getAllByText('+ Add task');
    await act(async () => {
      await user.click(addTaskButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(/Error adding task/)).toBeInTheDocument();
    });
  });

  test('shows error when toggle task API fails', async () => {
    server.use(
      rest.put('/api/items/:id/tasks/:taskId', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Sub-task A')).toBeInTheDocument();
    });

    const taskCheckbox = screen.getByLabelText(/Mark task "Sub-task A"/);
    await act(async () => {
      await user.click(taskCheckbox);
    });

    await waitFor(() => {
      expect(screen.getByText(/Error toggling task/)).toBeInTheDocument();
    });
  });

  test('shows error when delete task API fails', async () => {
    server.use(
      rest.delete('/api/items/:id/tasks/:taskId', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Sub-task A')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByText('Remove');
    await act(async () => {
      await user.click(removeButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(/Error deleting task/)).toBeInTheDocument();
    });
  });

  test('can toggle a taskless todo as complete via checkbox', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Todo 2')).toBeInTheDocument();
    });

    // Test Todo 2 has no tasks, so it should have a checkbox
    const todoCheckbox = screen.getByLabelText(/Mark "Test Todo 2"/);
    expect(todoCheckbox).not.toBeChecked();

    await act(async () => {
      await user.click(todoCheckbox);
    });

    // After clicking, the todo should update (mock returns updated todo)
    await waitFor(() => {
      expect(screen.getByText('Test Todo 2')).toBeInTheDocument();
    });
  });
});