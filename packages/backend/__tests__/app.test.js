const request = require('supertest');
const { app, db } = require('../src/app');

// Close the database connection after all tests
afterAll(() => {
  if (db) {
    db.close();
  }
});

// Test helpers
const createItem = async (name = 'Temp Item to Delete') => {
  const response = await request(app)
    .post('/api/items')
    .send({ name })
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  return response.body;
};

const createTask = async (todoId, description = 'Test Task') => {
  const response = await request(app)
    .post(`/api/items/${todoId}/tasks`)
    .send({ description })
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  return response.body;
};

describe('API Endpoints', () => {
  describe('GET /api/items', () => {
    it('should return all items with tasks', async () => {
      const response = await request(app).get('/api/items');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check if items have the expected structure
      const item = response.body[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('created_at');
      expect(item).toHaveProperty('is_completed');
      expect(item).toHaveProperty('tasks');
      expect(Array.isArray(item.tasks)).toBe(true);
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item with empty tasks', async () => {
      const newItem = { name: 'Test Item' };
      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newItem.name);
      expect(response.body).toHaveProperty('created_at');
      expect(response.body.is_completed).toBe(0);
      expect(response.body.tasks).toEqual([]);
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });

    it('should return 400 if name is empty', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });

    it('should return 400 if name is a non-string type', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: 123 })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Item name is required');
    });

    it('should return 400 if name is whitespace only', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: '   ' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Item name is required');
    });

    it('should trim whitespace from name', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: '  Trimmed Name  ' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Trimmed Name');
    });
  });

  describe('PUT /api/items/:id', () => {
    it('should update a todo name', async () => {
      const item = await createItem('Original Name');

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: 'Updated Name' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      // Verify the update persisted by re-fetching
      const getResponse = await request(app).get('/api/items');
      const found = getResponse.body.find(t => t.id === item.id);
      expect(found.name).toBe('Updated Name');
    });

    it('should toggle todo completion manually when no tasks', async () => {
      const item = await createItem('Manual Complete');

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ is_completed: true })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.is_completed).toBe(1);

      // Toggle back to incomplete
      const response2 = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ is_completed: false })
        .set('Accept', 'application/json');

      expect(response2.status).toBe(200);
      expect(response2.body.is_completed).toBe(0);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .put('/api/items/999999')
        .send({ name: 'Updated' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app)
        .put('/api/items/abc')
        .send({ name: 'Updated' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid item ID is required');
    });

    it('should return 400 for empty name', async () => {
      const item = await createItem('Will Try Empty');

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Item name cannot be empty');
    });

    it('should return 400 for whitespace-only name', async () => {
      const item = await createItem('Will Try Whitespace');

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: '   ' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Item name cannot be empty');
    });

    it('should return updated item with tasks array', async () => {
      const item = await createItem('Todo With Tasks For Update');
      await createTask(item.id, 'Task X');

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: 'Renamed' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Renamed');
      expect(Array.isArray(response.body.tasks)).toBe(true);
      expect(response.body.tasks.length).toBe(1);
      expect(response.body.tasks[0].description).toBe('Task X');
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete an existing item', async () => {
      const item = await createItem('Item To Be Deleted');

      const deleteResponse = await request(app).delete(`/api/items/${item.id}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toEqual({ message: 'Item deleted successfully', id: item.id });

      const deleteAgain = await request(app).delete(`/api/items/${item.id}`);
      expect(deleteAgain.status).toBe(404);
      expect(deleteAgain.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 404 when item does not exist', async () => {
      const response = await request(app).delete('/api/items/999999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app).delete('/api/items/abc');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid item ID is required');
    });

    it('should also delete associated tasks', async () => {
      const item = await createItem('Todo with tasks');
      await createTask(item.id, 'Task A');
      await createTask(item.id, 'Task B');

      const deleteResponse = await request(app).delete(`/api/items/${item.id}`);
      expect(deleteResponse.status).toBe(200);

      // Verify tasks were also deleted
      const tasksResponse = await request(app).get(`/api/items/${item.id}/tasks`);
      expect(tasksResponse.status).toBe(404);
    });
  });
});

describe('Task API Endpoints', () => {
  describe('GET /api/items/:id/tasks', () => {
    it('should return tasks for a todo', async () => {
      const item = await createItem('Todo for tasks');
      await createTask(item.id, 'Task 1');
      await createTask(item.id, 'Task 2');

      const response = await request(app).get(`/api/items/${item.id}/tasks`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('description', 'Task 1');
    });

    it('should return empty array when todo has no tasks', async () => {
      const item = await createItem('Empty Todo');

      const response = await request(app).get(`/api/items/${item.id}/tasks`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 404 for non-existent todo', async () => {
      const response = await request(app).get('/api/items/999999/tasks');
      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid item ID format', async () => {
      const response = await request(app).get('/api/items/abc/tasks');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid item ID is required');
    });
  });

  describe('POST /api/items/:id/tasks', () => {
    it('should add a task to a todo', async () => {
      const item = await createItem('Todo for new task');

      const response = await request(app)
        .post(`/api/items/${item.id}/tasks`)
        .send({ description: 'New Task' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.description).toBe('New Task');
      expect(response.body.is_completed).toBe(0);
      expect(response.body.todo_id).toBe(item.id);
    });

    it('should return 400 if description is missing', async () => {
      const item = await createItem('Todo for bad task');

      const response = await request(app)
        .post(`/api/items/${item.id}/tasks`)
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Task description is required');
    });

    it('should return 400 if description is empty string', async () => {
      const item = await createItem('Todo for empty desc');

      const response = await request(app)
        .post(`/api/items/${item.id}/tasks`)
        .send({ description: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Task description is required');
    });

    it('should return 404 for adding task to non-existent todo', async () => {
      const response = await request(app)
        .post('/api/items/999999/tasks')
        .send({ description: 'Orphan task' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 400 for adding task with invalid todo ID', async () => {
      const response = await request(app)
        .post('/api/items/abc/tasks')
        .send({ description: 'Bad ID task' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid item ID is required');
    });

    it('should trim whitespace from task description', async () => {
      const item = await createItem('Todo for trim task');

      const response = await request(app)
        .post(`/api/items/${item.id}/tasks`)
        .send({ description: '  Trimmed task  ' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.description).toBe('Trimmed task');
    });

    it('should revert completed todo when new task is added', async () => {
      const item = await createItem('Completed Todo');

      // Manually mark as completed
      await request(app)
        .put(`/api/items/${item.id}`)
        .send({ is_completed: true });

      // Add a new uncompleted task - should revert completion
      await request(app)
        .post(`/api/items/${item.id}/tasks`)
        .send({ description: 'New unchecked task' });

      const todoResponse = await request(app).get('/api/items');
      const updatedTodo = todoResponse.body.find(t => t.id === item.id);
      expect(updatedTodo.is_completed).toBe(0);
    });
  });

  describe('PUT /api/items/:id/tasks/:taskId', () => {
    it('should update task description', async () => {
      const item = await createItem('Todo for task update');
      const task = await createTask(item.id, 'Original Task');

      const response = await request(app)
        .put(`/api/items/${item.id}/tasks/${task.id}`)
        .send({ description: 'Updated Task' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.description).toBe('Updated Task');
    });

    it('should toggle task completion', async () => {
      const item = await createItem('Todo for toggle');
      const task = await createTask(item.id, 'Toggle Task');

      const response = await request(app)
        .put(`/api/items/${item.id}/tasks/${task.id}`)
        .send({ is_completed: true })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.is_completed).toBe(1);
    });

    it('should auto-complete todo when all tasks are checked', async () => {
      const item = await createItem('Auto-complete Todo');
      const task1 = await createTask(item.id, 'Task A');
      const task2 = await createTask(item.id, 'Task B');

      // Complete both tasks
      await request(app)
        .put(`/api/items/${item.id}/tasks/${task1.id}`)
        .send({ is_completed: true });

      await request(app)
        .put(`/api/items/${item.id}/tasks/${task2.id}`)
        .send({ is_completed: true });

      // Verify todo is now completed
      const todoResponse = await request(app).get('/api/items');
      const updatedTodo = todoResponse.body.find(t => t.id === item.id);
      expect(updatedTodo.is_completed).toBe(1);
    });

    it('should revert todo completion when a task is unchecked', async () => {
      const item = await createItem('Revert Todo');
      const task1 = await createTask(item.id, 'Task A');
      const task2 = await createTask(item.id, 'Task B');

      // Complete both tasks
      await request(app)
        .put(`/api/items/${item.id}/tasks/${task1.id}`)
        .send({ is_completed: true });

      await request(app)
        .put(`/api/items/${item.id}/tasks/${task2.id}`)
        .send({ is_completed: true });

      // Uncheck one task
      await request(app)
        .put(`/api/items/${item.id}/tasks/${task1.id}`)
        .send({ is_completed: false });

      // Verify todo is now incomplete
      const todoResponse = await request(app).get('/api/items');
      const updatedTodo = todoResponse.body.find(t => t.id === item.id);
      expect(updatedTodo.is_completed).toBe(0);
    });

    it('should return 404 for non-existent task', async () => {
      const item = await createItem('Todo for missing task');

      const response = await request(app)
        .put(`/api/items/${item.id}/tasks/999999`)
        .send({ description: 'Updated' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Task not found');
    });

    it('should return 400 for empty task description on update', async () => {
      const item = await createItem('Todo for empty desc update');
      const task = await createTask(item.id, 'Original');

      const response = await request(app)
        .put(`/api/items/${item.id}/tasks/${task.id}`)
        .send({ description: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Task description cannot be empty');
    });

    it('should return 400 for invalid task ID format', async () => {
      const item = await createItem('Todo for bad task id');

      const response = await request(app)
        .put(`/api/items/${item.id}/tasks/xyz`)
        .send({ is_completed: true })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid task ID is required');
    });

    it('should return 400 for invalid item ID format on task update', async () => {
      const response = await request(app)
        .put('/api/items/abc/tasks/1')
        .send({ description: 'Updated' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid item ID is required');
    });
  });

  describe('DELETE /api/items/:id/tasks/:taskId', () => {
    it('should delete a task', async () => {
      const item = await createItem('Todo for task delete');
      const task = await createTask(item.id, 'Task to delete');

      const response = await request(app)
        .delete(`/api/items/${item.id}/tasks/${task.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Task deleted successfully',
        id: task.id,
      });

      // Verify the task is actually gone
      const tasksResponse = await request(app).get(`/api/items/${item.id}/tasks`);
      expect(tasksResponse.body.length).toBe(0);
    });

    it('should return 404 for non-existent task', async () => {
      const item = await createItem('Todo for missing task delete');

      const response = await request(app)
        .delete(`/api/items/${item.id}/tasks/999999`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Task not found');
    });

    it('should return 400 for invalid task ID format', async () => {
      const item = await createItem('Todo for bad task ID delete');

      const response = await request(app)
        .delete(`/api/items/${item.id}/tasks/xyz`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid task ID is required');
    });

    it('should return 400 for invalid item ID format', async () => {
      const response = await request(app)
        .delete('/api/items/abc/tasks/1');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid item ID is required');
    });

    it('should auto-complete todo when deleting the only incomplete task', async () => {
      const item = await createItem('Auto-complete on delete');
      const task1 = await createTask(item.id, 'Completed task');
      const task2 = await createTask(item.id, 'Incomplete task');

      // Complete only the first task
      await request(app)
        .put(`/api/items/${item.id}/tasks/${task1.id}`)
        .send({ is_completed: true });

      // Verify todo is still incomplete (task2 is not completed)
      let todoResponse = await request(app).get('/api/items');
      let todo = todoResponse.body.find(t => t.id === item.id);
      expect(todo.is_completed).toBe(0);

      // Delete the only incomplete task
      await request(app).delete(`/api/items/${item.id}/tasks/${task2.id}`);

      // Verify todo is now auto-completed (only completed tasks remain)
      todoResponse = await request(app).get('/api/items');
      todo = todoResponse.body.find(t => t.id === item.id);
      expect(todo.is_completed).toBe(1);
    });
  });
});