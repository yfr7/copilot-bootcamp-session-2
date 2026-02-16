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
});