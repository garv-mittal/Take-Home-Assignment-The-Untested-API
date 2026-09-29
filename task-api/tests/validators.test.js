const {
  validateCreateTask,
  validateUpdateTask,
} = require('../src/utils/validators');

describe('validators', () => {
  describe('validateCreateTask', () => {
    test('accepts a valid task', () => {
      expect(
        validateCreateTask({
          title: 'Task',
          status: 'todo',
          priority: 'high',
          dueDate: '2030-01-01T00:00:00.000Z',
        })
      ).toBeNull();
    });

    test('rejects missing or blank title', () => {
      expect(validateCreateTask({}))
        .toBe('title is required and must be a non-empty string');

      expect(validateCreateTask({ title: '   ' }))
        .toBe('title is required and must be a non-empty string');

      expect(validateCreateTask({ title: 123 }))
        .toBe('title is required and must be a non-empty string');
    });

    test('rejects invalid status', () => {
      expect(
        validateCreateTask({
          title: 'Task',
          status: 'blocked',
        })
      ).toBe('status must be one of: todo, in_progress, done');
    });

    test('rejects invalid priority', () => {
      expect(
        validateCreateTask({
          title: 'Task',
          priority: 'urgent',
        })
      ).toBe('priority must be one of: low, medium, high');
    });

    test('rejects invalid due date', () => {
      expect(
        validateCreateTask({
          title: 'Task',
          dueDate: 'not-a-date',
        })
      ).toBe('dueDate must be a valid ISO date string');
    });
  });

  describe('validateUpdateTask', () => {
    test('accepts an empty update', () => {
      expect(validateUpdateTask({})).toBeNull();
    });

    test('rejects blank title', () => {
      expect(
        validateUpdateTask({ title: '   ' })
      ).toBe('title must be a non-empty string');
    });

    test('rejects invalid status', () => {
      expect(
        validateUpdateTask({ status: 'blocked' })
      ).toBe('status must be one of: todo, in_progress, done');
    });

    test('rejects invalid priority', () => {
      expect(
        validateUpdateTask({ priority: 'urgent' })
      ).toBe('priority must be one of: low, medium, high');
    });

    test('rejects invalid due date', () => {
      expect(
        validateUpdateTask({ dueDate: 'not-a-date' })
      ).toBe('dueDate must be a valid ISO date string');
    });

    test('accepts fields that are omitted from an update', () => {
      expect(
        validateUpdateTask({
          title: 'Updated',
          status: 'done',
          priority: 'low',
          dueDate: null,
        })
      ).toBeNull();
    });
  });
});