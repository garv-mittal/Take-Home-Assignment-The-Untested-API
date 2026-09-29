const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('create creates a task with defaults', () => {
    const task = taskService.create({ title: 'First task' });

    expect(task).toEqual(expect.objectContaining({
      title: 'First task',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      completedAt: null,
    }));

    expect(task.id).toBeDefined();
    expect(task.createdAt).toBeDefined();
  });

  test('create preserves supplied fields', () => {
    const task = taskService.create({
      title: 'Build API',
      description: 'Write routes',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2030-01-01T00:00:00.000Z',
    });

    expect(task.description).toBe('Write routes');
    expect(task.status).toBe('in_progress');
    expect(task.priority).toBe('high');
    expect(task.dueDate).toBe('2030-01-01T00:00:00.000Z');
  });

  test('getAll returns all tasks without exposing the array itself', () => {
    taskService.create({ title: 'A' });
    taskService.create({ title: 'B' });

    const result = taskService.getAll();
    result.pop();

    expect(result).toHaveLength(1);
    expect(taskService.getAll()).toHaveLength(2);
  });

  test('findById returns a task or undefined', () => {
    const task = taskService.create({ title: 'Find me' });

    expect(taskService.findById(task.id)).toEqual(task);
    expect(taskService.findById('missing-id')).toBeUndefined();
  });

  test('getByStatus filters tasks by status', () => {
    taskService.create({ title: 'Todo task', status: 'todo' });
    taskService.create({
      title: 'In progress task',
      status: 'in_progress',
    });

    expect(
      taskService.getByStatus('todo').map((task) => task.title)
    ).toEqual(['Todo task']);

    expect(
      taskService.getByStatus('in_progress').map((task) => task.title)
    ).toEqual(['In progress task']);
  });

  test('getPaginated returns the correct page', () => {
    taskService.create({ title: 'A' });
    taskService.create({ title: 'B' });
    taskService.create({ title: 'C' });
    taskService.create({ title: 'D' });

    expect(
      taskService.getPaginated(1, 2).map((task) => task.title)
    ).toEqual(['A', 'B']);

    expect(
      taskService.getPaginated(2, 2).map((task) => task.title)
    ).toEqual(['C', 'D']);
  });

  test('update changes an existing task', () => {
    const task = taskService.create({ title: 'Old title' });

    const updated = taskService.update(task.id, {
      title: 'New title',
      priority: 'high',
    });

    expect(updated).toEqual(
      expect.objectContaining({
        title: 'New title',
        priority: 'high',
      })
    );

    expect(taskService.findById(task.id).title).toBe('New title');
  });

  test('update returns null for a missing task', () => {
    expect(
      taskService.update('missing-id', { title: 'New title' })
    ).toBeNull();
  });

  test('remove deletes an existing task', () => {
    const task = taskService.create({ title: 'Delete me' });

    expect(taskService.remove(task.id)).toBe(true);
    expect(taskService.findById(task.id)).toBeUndefined();
  });

  test('remove returns false for a missing task', () => {
    expect(taskService.remove('missing-id')).toBe(false);
  });

  test('completeTask marks a task done and sets completedAt', () => {
    const task = taskService.create({
      title: 'Finish me',
      priority: 'high',
    });

    const completed = taskService.completeTask(task.id);

    expect(completed.status).toBe('done');
    expect(completed.completedAt).toEqual(expect.any(String));
  });

  test('completeTask returns null for a missing task', () => {
    expect(taskService.completeTask('missing-id')).toBeNull();
  });

  test('getStats returns status counts and excludes completed overdue tasks', () => {
    taskService.create({
      title: 'Todo',
      status: 'todo',
      dueDate: '2000-01-01T00:00:00.000Z',
    });

    taskService.create({
      title: 'In progress',
      status: 'in_progress',
      dueDate: '2000-01-01T00:00:00.000Z',
    });

    taskService.create({
      title: 'Done',
      status: 'done',
      dueDate: '2000-01-01T00:00:00.000Z',
    });

    taskService.create({
      title: 'Future',
      status: 'todo',
      dueDate: '2999-01-01T00:00:00.000Z',
    });

    expect(taskService.getStats()).toEqual({
      todo: 2,
      in_progress: 1,
      done: 1,
      overdue: 2,
    });
  });
});