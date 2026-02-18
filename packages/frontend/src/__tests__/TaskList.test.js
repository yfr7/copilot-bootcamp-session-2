import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TaskList from '../components/TaskList';

// ─── Default Props Factory ─────────────────────────────────────────────────

const createTask = (overrides = {}) => ({
  id: 10,
  todo_id: 1,
  description: 'Test Task',
  is_completed: 0,
  created_at: '2023-01-01T00:00:00.000Z',
  ...overrides,
});

const defaultProps = {
  todoId: 1,
  tasks: [],
  onAddTask: jest.fn(),
  onToggleTask: jest.fn(),
  onDeleteTask: jest.fn(),
  onUpdateTask: jest.fn(),
};

const renderTaskList = (propOverrides = {}) => {
  const props = { ...defaultProps, ...propOverrides };

  // Reset all function mocks before each render
  defaultProps.onAddTask.mockClear();
  defaultProps.onToggleTask.mockClear();
  defaultProps.onDeleteTask.mockClear();
  defaultProps.onUpdateTask.mockClear();

  return render(<TaskList {...props} />);
};

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('TaskList Component', () => {
  test('renders "Add a task..." input', () => {
    renderTaskList();

    expect(screen.getByPlaceholderText('Add a task...')).toBeInTheDocument();
    expect(screen.getByText('+ Add task')).toBeInTheDocument();
  });

  test('does not show progress text when there are no tasks', () => {
    renderTaskList({ tasks: [] });

    expect(screen.queryByText(/tasks completed/)).not.toBeInTheDocument();
  });

  test('shows progress text when tasks exist', () => {
    renderTaskList({
      tasks: [
        createTask({ id: 1, is_completed: 1 }),
        createTask({ id: 2, is_completed: 0 }),
        createTask({ id: 3, is_completed: 1 }),
      ],
    });

    expect(screen.getByText('2/3 tasks completed')).toBeInTheDocument();
  });

  test('renders all tasks with checkboxes', () => {
    renderTaskList({
      tasks: [
        createTask({ id: 1, description: 'Alpha', is_completed: 0 }),
        createTask({ id: 2, description: 'Beta', is_completed: 1 }),
      ],
    });

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(2);
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });

  test('completed task has strikethrough class', () => {
    renderTaskList({
      tasks: [createTask({ id: 1, description: 'Done', is_completed: 1 })],
    });

    expect(screen.getByText('Done')).toHaveClass('completed-text');
  });

  test('incomplete task does not have strikethrough class', () => {
    renderTaskList({
      tasks: [createTask({ id: 1, description: 'Pending', is_completed: 0 })],
    });

    expect(screen.getByText('Pending')).not.toHaveClass('completed-text');
  });

  test('calls onAddTask when submitting a new task', async () => {
    const onAddTask = jest.fn();
    const user = userEvent.setup();
    renderTaskList({ todoId: 5, onAddTask });

    const input = screen.getByPlaceholderText('Add a task...');
    await act(async () => {
      await user.type(input, 'New Task');
    });

    await act(async () => {
      await user.click(screen.getByText('+ Add task'));
    });

    expect(onAddTask).toHaveBeenCalledTimes(1);
    expect(onAddTask).toHaveBeenCalledWith(5, 'New Task');
  });

  test('clears input after successful task submission', async () => {
    const user = userEvent.setup();
    renderTaskList();

    const input = screen.getByPlaceholderText('Add a task...');
    await act(async () => {
      await user.type(input, 'New Task');
    });

    await act(async () => {
      await user.click(screen.getByText('+ Add task'));
    });

    expect(input).toHaveValue('');
  });

  test('does not call onAddTask when submitting empty description', async () => {
    const onAddTask = jest.fn();
    const user = userEvent.setup();
    renderTaskList({ onAddTask });

    await act(async () => {
      await user.click(screen.getByText('+ Add task'));
    });

    expect(onAddTask).not.toHaveBeenCalled();
  });

  test('does not call onAddTask when submitting whitespace-only description', async () => {
    const onAddTask = jest.fn();
    const user = userEvent.setup();
    renderTaskList({ onAddTask });

    const input = screen.getByPlaceholderText('Add a task...');
    await act(async () => {
      await user.type(input, '   ');
    });

    await act(async () => {
      await user.click(screen.getByText('+ Add task'));
    });

    expect(onAddTask).not.toHaveBeenCalled();
  });

  test('calls onToggleTask when checkbox is clicked', async () => {
    const onToggleTask = jest.fn();
    const user = userEvent.setup();
    renderTaskList({
      todoId: 3,
      tasks: [createTask({ id: 7, description: 'Toggle Me', is_completed: 0 })],
      onToggleTask,
    });

    await act(async () => {
      await user.click(screen.getByRole('checkbox'));
    });

    expect(onToggleTask).toHaveBeenCalledTimes(1);
    expect(onToggleTask).toHaveBeenCalledWith(3, 7, true);
  });

  test('calls onToggleTask to uncheck when completed task is clicked', async () => {
    const onToggleTask = jest.fn();
    const user = userEvent.setup();
    renderTaskList({
      todoId: 3,
      tasks: [createTask({ id: 7, description: 'Uncheck Me', is_completed: 1 })],
      onToggleTask,
    });

    await act(async () => {
      await user.click(screen.getByRole('checkbox'));
    });

    expect(onToggleTask).toHaveBeenCalledWith(3, 7, false);
  });

  test('calls onDeleteTask when Remove button is clicked', async () => {
    const onDeleteTask = jest.fn();
    const user = userEvent.setup();
    renderTaskList({
      todoId: 2,
      tasks: [createTask({ id: 9, description: 'Delete Me' })],
      onDeleteTask,
    });

    await act(async () => {
      await user.click(screen.getByText('Remove'));
    });

    expect(onDeleteTask).toHaveBeenCalledTimes(1);
    expect(onDeleteTask).toHaveBeenCalledWith(2, 9);
  });

  test('enters edit mode when Edit button is clicked', async () => {
    const user = userEvent.setup();
    renderTaskList({
      tasks: [createTask({ id: 1, description: 'Edit Me' })],
    });

    await act(async () => {
      await user.click(screen.getByText('Edit'));
    });

    expect(screen.getByDisplayValue('Edit Me')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('saves edited task description', async () => {
    const onUpdateTask = jest.fn();
    const user = userEvent.setup();
    renderTaskList({
      todoId: 4,
      tasks: [createTask({ id: 8, description: 'Old Desc' })],
      onUpdateTask,
    });

    await act(async () => {
      await user.click(screen.getByText('Edit'));
    });

    const input = screen.getByDisplayValue('Old Desc');
    await act(async () => {
      await user.clear(input);
      await user.type(input, 'New Desc');
    });

    await act(async () => {
      await user.click(screen.getByText('Save'));
    });

    expect(onUpdateTask).toHaveBeenCalledWith(4, 8, { description: 'New Desc' });
  });

  test('cancels edit and reverts to original description', async () => {
    const onUpdateTask = jest.fn();
    const user = userEvent.setup();
    renderTaskList({
      tasks: [createTask({ id: 1, description: 'Original' })],
      onUpdateTask,
    });

    await act(async () => {
      await user.click(screen.getByText('Edit'));
    });

    const input = screen.getByDisplayValue('Original');
    await act(async () => {
      await user.clear(input);
      await user.type(input, 'Changed');
    });

    await act(async () => {
      await user.click(screen.getByText('Cancel'));
    });

    // Should show original text again
    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(onUpdateTask).not.toHaveBeenCalled();
  });

  test('does not save empty task description', async () => {
    const onUpdateTask = jest.fn();
    const user = userEvent.setup();
    renderTaskList({
      tasks: [createTask({ id: 1, description: 'Non-empty' })],
      onUpdateTask,
    });

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

    expect(onUpdateTask).not.toHaveBeenCalled();
  });

  test('has accessible aria-labels on task checkboxes', () => {
    renderTaskList({
      tasks: [createTask({ id: 1, description: 'Accessible Task', is_completed: 0 })],
    });

    expect(
      screen.getByLabelText('Mark task "Accessible Task" as complete')
    ).toBeInTheDocument();
  });

  test('has accessible aria-labels on task action buttons', () => {
    renderTaskList({
      tasks: [createTask({ id: 1, description: 'My Task' })],
    });

    expect(
      screen.getByRole('button', { name: 'Edit task "My Task"' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete task "My Task"' })
    ).toBeInTheDocument();
  });
});
