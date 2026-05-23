# Design Document: To-Do List Life Dashboard

## Overview

The To-Do List Life Dashboard is a single-page, browser-based productivity application delivered as three static files. It requires no build tools, no package manager, and no server. The entire application state is managed in memory during a session and persisted to the browser's LocalStorage API. The architecture follows a simple Model-View-Controller pattern implemented in a single JavaScript file, keeping the codebase minimal and easy to understand.

---

## Architecture

The application follows a lightweight MVC pattern within a single JavaScript file:

- **Model** — The in-memory task array and all functions that read/write it (`TaskManager`)
- **View** — DOM manipulation functions that render the current state (`UIRenderer`)
- **Controller** — Event listeners that wire user interactions to model mutations and view updates

The render cycle is unidirectional:

```
User Action → Controller → TaskManager (mutate model) → Storage (persist) → UIRenderer (re-render)
```

Every state mutation triggers a full re-render of the task list and summary section. Because the task list is expected to be small (personal use), this is performant without any virtual DOM or diffing strategy.

### File Structure

```
index.html        ← Application shell, semantic HTML structure
css/
  style.css       ← All styles, CSS variables, layout, responsive rules
js/
  script.js       ← All JavaScript: data model, TaskManager, Storage, UIRenderer, Controller
```

No other files are required. No build step is needed.

---

## Components and Interfaces

### index.html

The HTML file provides the semantic structure. JavaScript and CSS are referenced via relative paths. No inline styles or inline scripts are used.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Life Dashboard</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <div class="app-container">

    <!-- Header -->
    <header class="app-header">
      <h1>Life Dashboard</h1>
    </header>

    <!-- Dashboard Summary -->
    <section class="dashboard-summary" aria-label="Task summary">
      <div class="summary-counts">
        <div class="count-card" id="count-total">
          <span class="count-number">0</span>
          <span class="count-label">Total</span>
        </div>
        <div class="count-card" id="count-active">
          <span class="count-number">0</span>
          <span class="count-label">Active</span>
        </div>
        <div class="count-card" id="count-completed">
          <span class="count-number">0</span>
          <span class="count-label">Done</span>
        </div>
      </div>
      <div class="progress-bar-container" aria-label="Progress">
        <div class="progress-bar" id="progress-bar" role="progressbar"
             aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
      </div>
    </section>

    <!-- Add Task Form -->
    <section class="add-task-section" aria-label="Add task">
      <form id="add-task-form" class="add-task-form">
        <input
          type="text"
          id="task-input"
          class="task-input"
          placeholder="Add a new task…"
          autocomplete="off"
          aria-label="New task title"
        />
        <button type="submit" class="btn btn-primary" aria-label="Add task">Add</button>
      </form>
    </section>

    <!-- Filter Controls -->
    <nav class="filter-nav" aria-label="Task filters">
      <button class="filter-btn active" data-filter="all">All</button>
      <button class="filter-btn" data-filter="active">Active</button>
      <button class="filter-btn" data-filter="completed">Completed</button>
      <button class="btn btn-danger" id="clear-completed-btn" hidden>
        Clear Completed
      </button>
    </nav>

    <!-- Task List -->
    <main>
      <ul class="task-list" id="task-list" aria-label="Task list" aria-live="polite"></ul>
      <p class="empty-state" id="empty-state" hidden>No tasks yet. Add one above!</p>
    </main>

  </div>
  <script src="js/script.js"></script>
</body>
</html>
```

**Key structural decisions:**
- `aria-live="polite"` on the task list announces changes to screen readers.
- The `hidden` attribute on `#empty-state` and `#clear-completed-btn` is toggled by JavaScript.
- All interactive elements use semantic HTML (`<button>`, `<form>`, `<input>`).

### Task List Item Template

Each task is rendered as a `<li>` element. The template (built in JavaScript) is:

```html
<li class="task-item [completed]" data-id="{id}">
  <input type="checkbox" class="task-checkbox" [checked] aria-label="Mark complete" />
  <span class="task-title">{title}</span>
  <div class="task-actions">
    <button class="btn btn-edit" aria-label="Edit task">Edit</button>
    <button class="btn btn-delete" aria-label="Delete task">Delete</button>
  </div>
</li>
```

When in edit mode, the `<span class="task-title">` is replaced with:

```html
<input type="text" class="task-edit-input" value="{title}" aria-label="Edit task title" />
<button class="btn btn-save" aria-label="Save edit">Save</button>
<button class="btn btn-cancel" aria-label="Cancel edit">Cancel</button>
```

---

## Data Models

### Task Object

All tasks are stored as plain JavaScript objects. The schema is:

```js
{
  id: string,          // Unique identifier — Date.now().toString(36) + random suffix
  title: string,       // Non-empty task title (trimmed)
  completed: boolean,  // false = active, true = done
  createdAt: number    // Unix timestamp in milliseconds (Date.now())
}
```

### Application State

The in-memory state held in `js/script.js`:

```js
let tasks = [];           // Array of Task objects (source of truth)
let currentFilter = 'all'; // 'all' | 'active' | 'completed'
```

### LocalStorage Schema

- **Key**: `"life-dashboard-tasks"` (fixed string constant)
- **Value**: JSON-serialized array of Task objects

```js
// Write
localStorage.setItem('life-dashboard-tasks', JSON.stringify(tasks));

// Read
const raw = localStorage.getItem('life-dashboard-tasks');
tasks = raw ? JSON.parse(raw) : [];
```

---

## JavaScript Architecture (`js/script.js`)

The single JavaScript file is organized into four logical sections separated by comments:

### 1. Constants and State

```js
const STORAGE_KEY = 'life-dashboard-tasks';
let tasks = [];
let currentFilter = 'all';
```

### 2. Storage Module

```js
function saveTasks() { /* serialize tasks to LocalStorage */ }
function loadTasks() { /* deserialize from LocalStorage, handle errors */ }
```

`loadTasks` wraps `JSON.parse` in a try/catch. On any parse error, it resets `tasks` to `[]`.

### 3. TaskManager Module

```js
function createTask(title)          // Returns new Task object; does NOT mutate tasks[]
function addTask(title)             // Validates, creates, pushes to tasks[], saves, re-renders
function updateTask(id, newTitle)   // Validates, mutates task in tasks[], saves, re-renders
function deleteTask(id)             // Removes task from tasks[], saves, re-renders
function toggleTask(id)             // Flips task.completed, saves, re-renders
function clearCompleted()           // Filters out completed tasks, saves, re-renders
```

### 4. UIRenderer Module

```js
function render()                   // Master render: calls renderTaskList + renderSummary
function renderTaskList()           // Filters tasks by currentFilter, builds DOM list
function renderSummary()            // Updates count cards and progress bar
function renderTaskItem(task)       // Returns a <li> DOM element for a task
function setFilter(filter)          // Updates currentFilter, updates active button, re-renders
function showEditMode(li, task)     // Replaces task title span with edit input
function hideEditMode(li, task)     // Restores task title span from edit input
```

### 5. Controller (Event Listeners)

Wired up inside a `DOMContentLoaded` listener:

```js
document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  render();

  // Add task form submit
  document.getElementById('add-task-form').addEventListener('submit', ...);

  // Filter buttons (event delegation on .filter-nav)
  document.querySelector('.filter-nav').addEventListener('click', ...);

  // Task list interactions (event delegation on #task-list)
  document.getElementById('task-list').addEventListener('click', ...);
  document.getElementById('task-list').addEventListener('change', ...);

  // Clear completed
  document.getElementById('clear-completed-btn').addEventListener('click', ...);
});
```

Event delegation is used for the task list to avoid attaching/detaching listeners on every render.

---

## CSS Architecture (`css/style.css`)

### CSS Custom Properties

All design tokens are defined on `:root`:

```css
:root {
  --color-bg: #f5f5f5;
  --color-surface: #ffffff;
  --color-primary: #4a90e2;
  --color-primary-hover: #357abd;
  --color-danger: #e74c3c;
  --color-text: #333333;
  --color-text-muted: #888888;
  --color-border: #e0e0e0;
  --color-completed: #aaaaaa;
  --color-progress-bg: #e0e0e0;
  --color-progress-fill: #4a90e2;

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  --font-family: 'Segoe UI', system-ui, sans-serif;
  --font-size-base: 16px;
  --font-size-sm: 14px;
  --font-size-lg: 20px;
  --font-size-xl: 28px;

  --border-radius: 8px;
  --shadow: 0 2px 8px rgba(0,0,0,0.08);
}
```

### Layout

- `.app-container`: max-width 640px, centered with `margin: 0 auto`, padding on sides.
- `.dashboard-summary`: flexbox row for count cards; progress bar below.
- `.add-task-form`: flexbox row — input grows, button fixed width.
- `.filter-nav`: flexbox row, wraps on small screens.
- `.task-list`: unstyled list, each item is a flexbox row.

### Responsive Breakpoint

```css
@media (max-width: 600px) {
  .summary-counts { flex-direction: column; }
  .add-task-form { flex-direction: column; }
  .filter-nav { flex-wrap: wrap; }
}
```

### Completed Task Styling

```css
.task-item.completed .task-title {
  text-decoration: line-through;
  color: var(--color-completed);
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The following properties are derived from the acceptance criteria. Because this application is pure in-memory JavaScript logic (TaskManager, Storage serialization, UIRenderer filtering), property-based testing is appropriate for the core logic layer. The recommended library is **fast-check** (JavaScript), loaded via CDN in a test HTML file, with a minimum of 100 iterations per property.

---

### Property 1: Valid task addition grows the list

*For any* non-empty, non-whitespace task title, calling `addTask` should increase the length of the task list by exactly 1.

**Validates: Requirements 1.1**

---

### Property 2: Whitespace titles are rejected

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), calling `addTask` should leave the task list unchanged.

**Validates: Requirements 1.2, 2.2**

---

### Property 3: Input field is cleared after valid addition

*For any* valid task title submitted via the add form, the task input field value should be an empty string after the operation completes.

**Validates: Requirements 1.3**

---

### Property 4: New task structural invariant

*For any* valid task title, the task object created by `createTask` must have a non-empty string `id`, a numeric `createdAt` timestamp, and `completed === false`.

**Validates: Requirements 1.4**

---

### Property 5: LocalStorage round-trip consistency

*For any* array of task objects, serializing the array to LocalStorage via `saveTasks` and then deserializing via `loadTasks` should produce an array that is deeply equal to the original.

**Validates: Requirements 1.5, 2.4, 3.3, 4.3, 5.3**

---

### Property 6: Edit updates the correct task title

*For any* task in the list and any valid new title string, calling `updateTask(id, newTitle)` should result in exactly that task having the new title, with all other tasks unchanged.

**Validates: Requirements 2.3**

---

### Property 7: Delete removes exactly one task

*For any* task list with at least one task, deleting a task by its id should result in a list that is exactly one element shorter and does not contain any task with that id.

**Validates: Requirements 3.1**

---

### Property 8: Toggle completion is an involution

*For any* task, toggling its completion status twice should return it to its original completion state (toggle is its own inverse).

**Validates: Requirements 4.1**

---

### Property 9: Filter consistency

*For any* task list with mixed completion statuses and any filter value ('all', 'active', 'completed'), the tasks returned by the filter function must satisfy:
- 'all': returned count equals total task count
- 'active': all returned tasks have `completed === false`
- 'completed': all returned tasks have `completed === true`

**Validates: Requirements 6.2, 6.3, 6.4**

---

### Property 10: Filter re-applied after mutation

*For any* active filter and any task mutation (add, delete, toggle), the rendered task list must still satisfy the filter predicate after the mutation.

**Validates: Requirements 6.6**

---

### Property 11: Summary counts are always correct

*For any* task list with N total tasks and K completed tasks, the rendered summary must show total = N, completed = K, and active = N − K.

**Validates: Requirements 7.1, 7.2**

---

### Property 12: Progress bar percentage is always correct

*For any* task list with N total tasks and K completed tasks (N > 0), the progress bar fill must equal ⌊(K / N) × 100⌋ percent. When N = 0, the fill must be 0%.

**Validates: Requirements 7.3, 7.4, 7.5, 7.6**

---

### Property 13: Clear completed leaves only active tasks

*For any* task list, calling `clearCompleted` should result in a list where every remaining task has `completed === false`.

**Validates: Requirements 9.1**

---

### Property 14: Clear Completed button hidden when no completed tasks exist

*For any* task list where no task has `completed === true`, the Clear Completed button must be hidden or disabled after rendering.

**Validates: Requirements 9.4**

---

**Property Reflection (Redundancy Check):**

- Properties 7.1 and 7.2 (summary counts) are unified into Property 11 — "counts are always correct for any list state" subsumes "counts update on change."
- Properties 7.3, 7.4, 7.5, 7.6 are unified into Property 12 — the general formula covers the 0% and 100% edge cases when the generator includes empty and all-complete lists.
- Property 5 (LocalStorage round-trip) covers 1.5, 2.4, 3.3, 4.3, and 5.3 — all are the same serialization invariant applied after different mutations.
- Properties 1.2 and 2.2 (whitespace rejection) are unified into Property 2.

---

## Error Handling

| Scenario | Handling |
|---|---|
| Empty/whitespace task title on add | `Validator` trims input; if empty, prevents form submission; no state change |
| Empty/whitespace title on edit | `Validator` trims input; if empty, cancels save; original title preserved |
| Corrupted LocalStorage data | `loadTasks` wraps `JSON.parse` in try/catch; on error, resets `tasks = []` |
| Task id not found on update/delete/toggle | Function exits early with no state change; no error thrown |
| LocalStorage quota exceeded | `saveTasks` wraps `setItem` in try/catch; logs warning to console; in-memory state remains valid |

---

## Testing Strategy

### Dual Testing Approach

**Unit / Example Tests** — Verify specific behaviors with concrete inputs:
- App initializes with empty list when LocalStorage is empty
- Edit mode shows pre-filled input with current title
- Cancel edit restores original display
- Filter buttons receive active CSS class when selected
- Completed tasks receive the `completed` CSS class
- Corrupted LocalStorage is handled gracefully

**Property-Based Tests** — Verify universal properties across generated inputs:
- Use **fast-check** (loaded via CDN in a test HTML file, or via `npm install --save-dev fast-check` if a minimal test runner is desired)
- Minimum **100 iterations** per property test
- Each property test is tagged with a comment referencing the design property number

**Tag format:**
```js
// Feature: personal-dashboard, Property N: <property text>
```

### Property Test Configuration

```js
// Example using fast-check
import fc from 'fast-check';

// Feature: personal-dashboard, Property 2: Whitespace titles are rejected
fc.assert(
  fc.property(
    fc.stringOf(fc.constantFrom(' ', '\t', '\n')),
    (whitespaceTitle) => {
      const before = tasks.length;
      addTask(whitespaceTitle);
      return tasks.length === before;
    }
  ),
  { numRuns: 100 }
);
```

### What Is NOT Property-Tested

- CSS styling and visual hierarchy (manual review)
- Responsive layout at 600px breakpoint (manual review or browser DevTools)
- DOM structure of `index.html` (code inspection)
- Accessibility attributes (manual review with screen reader or axe tool)
