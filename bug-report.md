# Bug Report

## Bug 1: Pagination skips the first page of tasks

### Expected Behavior

When requesting:

`GET /tasks?page=1&limit=2`

the API should return the first two tasks.

For example, if the tasks are:

1. Task A
2. Task B
3. Task C
4. Task D

then page 1 with a limit of 2 should return:

* Task A
* Task B

Page 2 should return:

* Task C
* Task D

### Actual Behavior

The pagination logic was calculating the offset as:

```js
const offset = page * limit;
```

For page 1 with a limit of 2, this gives:

```text
offset = 1 * 2
offset = 2
```

Because array indexes start from 0, this caused page 1 to start from the third task instead of the first task.

### How It Was Discovered

I found this while writing the unit test for the `getPaginated` function in `taskService.js`.

The test created four tasks and expected:

```text
page 1, limit 2 → Task A, Task B
page 2, limit 2 → Task C, Task D
```

The page 1 test failed with the original implementation, which showed that the pagination offset was incorrect.

### Fix

The calculation was changed to:

```js
const offset = (page - 1) * limit;
```

This makes:

```text
page 1 → offset 0
page 2 → offset 2
page 3 → offset 4
```

which gives the expected pagination behavior.

### Test Added

A unit test was added to verify that the correct tasks are returned for page 1 and page 2.

---

## Other Behaviors Noted

During testing, a few areas of the existing implementation stood out but were not changed because they were outside the required scope of the assignment.

### Status Filtering

The current status filter uses partial matching:

```js
tasks.filter((t) => t.status.includes(status))
```

I would clarify whether the API is expected to support only exact status values such as:

```text
todo
in_progress
done
```

before changing this behavior.

### Pagination Parameters

Invalid pagination parameters currently fall back to default values through `parseInt()` and `||`.

I would confirm the expected behavior for values such as:

```text
?page=abc
?limit=-1
?limit=0
```

before changing the validation rules.

### PUT Update Fields

The update operation accepts the fields passed to it and merges them into the task object.

Before production, I would confirm which task properties should be allowed to be updated by clients so that fields such as `id` and `createdAt` cannot be modified unintentionally.
