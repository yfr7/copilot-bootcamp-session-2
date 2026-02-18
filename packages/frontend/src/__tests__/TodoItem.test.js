import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TodoItem from '../components/TodoItem';

// ─── Default Props Factory ─────────────────────────────────────────────────

const createTodo = (overrides = {}) => ({
  id: 1,
  name: 'Test Todo',
  is_completed: 0,
  created_at: '2023-01-01T00:00:00.000Z',
  tasks: [],
  ...overrides,
});

const noop = () => {};

const defaultProps = {
  onDelete: jest.fn(),
  onUpdate: jest.fn(),
  onAddTask: jest.fn(),
  onToggleTask: jest.fn(),
  onDeleteTask: jest.fn(),
  onUpdateTask: jest.fn(),
};

const renderTodoItem = (todoOverrides = {}, propOverrides = {}) => {
  const todo = createTodo(todoOverrides);
  const props = { ...defaultProps, ...propOverrides, todo };

  // Reset all mocks before each render
  Object.values(defaultProps).forEach(fn => fn.mockClear());

  return render(
    <ul>
      <TodoItem {...props} />
    </ul>
  );
};

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('TodoItem Component', () => {
  test('renders todo name', () => {
    renderTodoItem({ name: 'Buy groceries' });

    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
  });

  test('renders Edit and Delete buttons', () => {
    renderTodoItem();

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  test('calls onDelete when Delete button is clicked', async () => {
    const onDelete = jest.fn();
    const user = userEvent.setup();
    renderTodoItem({ id: 42 }, { onDelete });

    await act(async () => {
      await user.click(screen.getByText('Delete'));
    });

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(42);
  });

  test('shows checkbox for todo with no tasks', () => {
    renderTodoItem({ tasks: [] });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  test('does not show checkbox for todo with tasks', () => {
    renderTodoItem({
      tasks: [
        { id: 10, todo_id: 1, description: 'Task A', is_completed: 0, created_at: '2023-01-01T00:00:00.000Z' },
      ],
    });

    // The only checkboxes should be task checkboxes, not the todo-level one
    const checkboxes = screen.getAllByRole('checkbox');
    // Task checkbox exists, but not the todo-level one
    expect(checkboxes.length).toBe(1);
    expect(checkboxes[0]).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Task A')
    );
  });

  test('calls onUpdate to toggle completion when checkbox clicked (no tasks)', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();
    renderTodoItem({ id: 5, tasks: [], is_completed: 0 }, { onUpdate });

    await act(async () => {
      await user.click(screen.getByRole('checkbox'));
    });

    expect(onUpdate).toHaveBeenCalledWith(5, { is_completed: true });
  });

  test('applies completed styles when todo is completed', () => {
    renderTodoItem({ is_completed: 1 });

    expect(screen.getByText('Test Todo')).toHaveClass('completed-text');
  });

  test('enters edit mode when Edit button is clicked', async () => {
    const user = userEvent.setup();
    renderTodoItem({ name: 'Original' });

    await act(async () => {
      await user.click(screen.getByText('Edit'));
    });

    // Edit input should appear with current name
    const input = screen.getByDisplayValue('Original');
    expect(input).toBeInTheDocument();
    // Save and Cancel buttons should appear
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    // Edit button should be hidden while editing
    expect(screen.queryByRole('button', { name: /^Edit/ })).not.toBeInTheDocument();
  });

  test('calls onUpdate with new name when Save is clicked', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();
    renderTodoItem({ id: 7, name: 'Old Name' }, { onUpdate });

    await act(async () => {
      await user.click(screen.getByText('Edit'));
    });

    const input = screen.getByDisplayValue('Old Name');
    await act(async () => {
      await user.clear(input);
      await user.type(input, 'New Name');
    });

    await act(async () => {
      await user.click(screen.getByText('Save'));
    });

    expect(onUpdate).toHaveBeenCalledWith(7, { name: 'New Name' });
  });

  test('reverts name and exits edit mode on Cancel', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();
    renderTodoItem({ name: 'Keep Me' }, { onUpdate });

    await act(async () => {
      await user.click(screen.getByText('Edit'));
    });

    const input = screen.getByDisplayValue('Keep Me');
    await act(async () => {
      await user.clear(input);
      await user.type(input, 'Changed');
    });

    await act(async () => {
      await user.click(screen.getByText('Cancel'));
    });

    // Should show original name, not the changed one
    expect(screen.getByText('Keep Me')).toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  test('does not call onUpdate when saving empty name', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();
    renderTodoItem({ name: 'Non-empty' }, { onUpdate });

    await act(async () => {
      await user.click(screen.getByText('Edit'));
    });

    const input = screen.getByDisplayValue('Non-empty');
    await act(async () => {
      await user.clear(input);
    });

    await act(async () => {
      await user.click(screen.getByText('Save'));
    });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  test('renders sub-tasks when todo has tasks', () => {
    renderTodoItem({
      tasks: [
        { id: 10, todo_id: 1, description: 'Sub-task A', is_completed: 0, created_at: '2023-01-01T00:00:00.000Z' },
        { id: 11, todo_id: 1, description: 'Sub-task B', is_completed: 1, created_at: '2023-01-01T00:01:00.000Z' },
      ],
    });

    expect(screen.getByText('Sub-task A')).toBeInTheDocument();
    expect(screen.getByText('Sub-task B')).toBeInTheDocument();
    expect(screen.getByText('1/2 tasks completed')).toBeInTheDocument();
  });

  test('has accessible aria-labels on buttons', () => {
    renderTodoItem({ name: 'My Task' });

    expect(
      screen.getByRole('button', { name: 'Edit "My Task"' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete "My Task"' })
    ).toBeInTheDocument();
  });
});
