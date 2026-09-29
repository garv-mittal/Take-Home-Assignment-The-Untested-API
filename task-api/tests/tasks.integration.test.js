const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Task API integration tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('GET /tasks', () => {
    test('returns all tasks', async () => {
      await request(app)
        .post('/tasks')
        .send({ title: 'A' })
        .expect(201);

      await request(app)
        .post('/tasks')
        .send({ title: 'B' })
        .expect(201);

      const response = await request(app)
        .get('/tasks')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    test('filters by status', async () => {
      await request(app)
        .post('/tasks')
        .send({
          title: 'Todo',
          status: 'todo',
        })
        .expect(201);

      await request(app)
        .post('/tasks')
        .send({
          title: 'Done',
          status: 'done',
        })
        .expect(201);

      const response = await request(app)
        .get('/tasks?status=todo')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('todo');
    });

    test('supports pagination', async () => {
      await request(app)
        .post('/tasks')
        .send({ title: 'A' })
        .expect(201);

      await request(app)
        .post('/tasks')
        .send({ title: 'B' })
        .expect(201);

      await request(app)
        .post('/tasks')
        .send({ title: 'C' })
        .expect(201);

      const response = await request(app)
        .get('/tasks?page=1&limit=2')
        .expect(200);

      expect(response.body.map((task) => task.title))
        .toEqual(['A', 'B']);
    });

    test('falls back to default pagination values when pagination params are invalid', async () => {
      await request(app)
        .post('/tasks')
        .send({ title: 'A' })
        .expect(201);

      const response = await request(app)
        .get('/tasks?page=abc&limit=abc')
        .expect(200);

      expect(response.body).toHaveLength(1);
    });
  });

  describe('GET /tasks/stats', () => {
    test('returns counts and overdue count', async () => {
      await request(app)
        .post('/tasks')
        .send({
          title: 'Todo',
          status: 'todo',
          dueDate: '2000-01-01T00:00:00.000Z',
        })
        .expect(201);

      await request(app)
        .post('/tasks')
        .send({
          title: 'Done',
          status: 'done',
          dueDate: '2000-01-01T00:00:00.000Z',
        })
        .expect(201);

      const response = await request(app)
        .get('/tasks/stats')
        .expect(200);

      expect(response.body).toEqual({
        todo: 1,
        in_progress: 0,
        done: 1,
        overdue: 1,
      });
    });
  });

  describe('POST /tasks', () => {
    test('creates a task', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          title: 'Build API',
          description: 'Implement endpoints',
          priority: 'high',
        })
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          title: 'Build API',
          description: 'Implement endpoints',
          priority: 'high',
          status: 'todo',
          completedAt: null,
        })
      );

      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    test('returns 400 for invalid title', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({ title: '   ' })
        .expect(400);

      expect(response.body.error)
        .toBe('title is required and must be a non-empty string');
    });

    test('returns 400 for invalid status', async () => {
      await request(app)
        .post('/tasks')
        .send({
          title: 'Task',
          status: 'blocked',
        })
        .expect(400);
    });

    test('returns 400 for invalid priority', async () => {
      await request(app)
        .post('/tasks')
        .send({
          title: 'Task',
          priority: 'urgent',
        })
        .expect(400);
    });

    test('returns 400 for invalid due date', async () => {
      await request(app)
        .post('/tasks')
        .send({
          title: 'Task',
          dueDate: 'not-a-date',
        })
        .expect(400);
    });
  });

  describe('PUT /tasks/:id', () => {
    test('updates an existing task', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Old title' })
        .expect(201);

      const response = await request(app)
        .put(`/tasks/${created.body.id}`)
        .send({
          title: 'New title',
          priority: 'high',
        })
        .expect(200);

      expect(response.body.title).toBe('New title');
      expect(response.body.priority).toBe('high');
    });

    test('returns 400 for invalid update data', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Task' })
        .expect(201);

      await request(app)
        .put(`/tasks/${created.body.id}`)
        .send({ title: '   ' })
        .expect(400);
    });

    test('returns 404 when updating a missing task', async () => {
      const response = await request(app)
        .put('/tasks/missing-id')
        .send({ title: 'New title' })
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('DELETE /tasks/:id', () => {
    test('deletes an existing task', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Delete me' })
        .expect(201);

      await request(app)
        .delete(`/tasks/${created.body.id}`)
        .expect(204);

      expect(
        (await request(app).get('/tasks')).body
      ).toEqual([]);
    });

    test('returns 404 for a missing task', async () => {
      await request(app)
        .delete('/tasks/missing-id')
        .expect(404);
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    test('marks a task as complete', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Complete me' })
        .expect(201);

      const response = await request(app)
        .patch(`/tasks/${created.body.id}/complete`)
        .expect(200);

      expect(response.body.status).toBe('done');
      expect(response.body.completedAt).toEqual(expect.any(String));
    });

    test('returns 404 for a missing task', async () => {
      await request(app)
        .patch('/tasks/missing-id/complete')
        .expect(404);
    });
  });

    describe('PATCH /tasks/:id/assign', () => {
    test('assigns an unassigned task', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Assign me' })
        .expect(201);

      const response = await request(app)
        .patch(`/tasks/${created.body.id}/assign`)
        .send({ assignee: 'Garv' })
        .expect(200);

      expect(response.body.assignee).toBe('Garv');
    });

    test('trims surrounding whitespace from the assignee name', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Assign me' })
        .expect(201);

      const response = await request(app)
        .patch(`/tasks/${created.body.id}/assign`)
        .send({ assignee: '  Garv  ' })
        .expect(200);

      expect(response.body.assignee).toBe('Garv');
    });

    test('returns 400 for a missing or empty assignee', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Assign me' })
        .expect(201);

      await request(app)
        .patch(`/tasks/${created.body.id}/assign`)
        .send({})
        .expect(400);

      await request(app)
        .patch(`/tasks/${created.body.id}/assign`)
        .send({ assignee: '   ' })
        .expect(400);

      await request(app)
        .patch(`/tasks/${created.body.id}/assign`)
        .send({ assignee: 123 })
        .expect(400);
    });

    test('returns 404 when assigning a missing task', async () => {
      await request(app)
        .patch('/tasks/missing-id/assign')
        .send({ assignee: 'Garv' })
        .expect(404);
    });

    test('returns 409 when a task is already assigned', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Assign twice' })
        .expect(201);

      await request(app)
        .patch(`/tasks/${created.body.id}/assign`)
        .send({ assignee: 'First' })
        .expect(200);

      const response = await request(app)
        .patch(`/tasks/${created.body.id}/assign`)
        .send({ assignee: 'Second' })
        .expect(409);

      expect(response.body.error)
        .toBe('Task is already assigned');
    });
  });
});