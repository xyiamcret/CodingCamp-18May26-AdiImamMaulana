# Implementation Plan: To-Do List Life Dashboard

## Overview

Implement the To-Do List Life Dashboard as three static files: `index.html`, `css/style.css`, and `js/script.js`. No build tools, no frameworks, no dependencies. The implementation follows the MVC pattern described in the design document, with all JavaScript in a single file organized into Storage, TaskManager, UIRenderer, and Controller sections.

---

## Tasks

- [ ] 1. Create the project file structure and HTML shell
  - Create `index.html` at the project root with the full semantic HTML structure from the design document
  - Include `<link rel="stylesheet" href="css/style.css" />` in `<head>`
  - Include `<script src="js/script.js"></script>` at the end of `<body>`
  - Add all sections: `.app-header`, `.dashboard-summary`, `.add-task-section`, `.filter-nav`, `#task-list`, `#empty-state`
  - Create `css/style.css` as an empty file
  - Create `js/script.js` as an empty file
  - _Requirements: 8.1, TC-1, TC-3_

- [ ] 2. Implement CSS styles in `css/style.css`
  - [ ] 2.1 Define CSS custom properties on `:root`
    - Add all color, spacing, typography, and border-radius variables from the design document
    - _Requirements: 8.2_
  - [ ] 2.2 Implement base and layout styles
    - Style `body`, `.app-container` (max-width 640px, centered), `.app-header`
    - Style `.dashboard-summary`, `.summary-counts`, `.count-card` (flexbox row)
    - Style `.progress-bar-container` and `.progress-bar` (height, background, transition)
    - Style `.add-task-form` (flexbox row, input grows, button fixed)
    - Style `.filter-nav` (flexbox row, gap)
    - Style `.task-list` (unstyled list), `.task-item` (flexbox row, border, border-radius)
    - Style `.empty-state` (centered, muted color)
    - _Requirements: 8.3, 8.4_
  - [ ] 2.3 Implement component-specific styles
    - Style `.task-checkbox`, `.task-title`, `.task-actions`
    - Style `.task-item.completed .task-title` (line-through, muted color)
    - Style `.btn`, `.btn-primary`, `.btn-danger`, `.btn-edit`, `.btn-delete`, `.btn-save`, `.btn-cancel`
    - Style `.filter-btn` and `.filter-btn.active` (highlighted state)
    - Style `.task-edit-input` (inline edit field)
    - _Requirements: 4.2, 6.5, 8.3_
  - [ ] 2.4 Implement responsive styles
    - Add `@media (max-width: 600px)` breakpoint
    - Stack `.summary-counts` vertically, stack `.add-task-form` vertically, wrap `.filter-nav`
    - _Requirements: 8.5_

- [ ] 3. Implement the JavaScript foundation in `js/script.js`
  - [ ] 3.1 Define constants and application state
    - Define `const STORAGE_KEY = 'life-dashboard-tasks'`
    - Define `let tasks = []` and `let currentFilter = 'all'`
    - _Requirements: 5.3_
  - [ ] 3.2 Implement the Storage module
    - Implement `saveTasks()`: serializes `tasks` to JSON and writes to LocalStorage under `STORAGE_KEY`; wraps `setItem` in try/catch and logs on quota error
    - Implement `loadTasks()`: reads from LocalStorage, parses JSON, assigns to `tasks`; wraps in try/catch and resets `tasks = []` on any parse error
    - _Requirements: 5.1, 5.3, 5.4_
  - [ ]* 3.3 Write property test for LocalStorage round-trip (Property 5)
    - **Property 5: LocalStorage round-trip consistency**
    - **Validates: Requirements 1.5, 2.4, 3.3, 4.3, 5.3**
    - For any array of task objects, `saveTasks()` then `loadTasks()` must produce a deeply equal array

- [ ] 4. Implement the TaskManager module in `js/script.js`
  - [ ] 4.1 Implement `createTask(title)`
    - Returns a new task object: `{ id, title: title.trim(), completed: false, createdAt: Date.now() }`
    - `id` generated as `Date.now().toString(36) + Math.random().toString(36).slice(2)`
    - Does NOT mutate `tasks[]`
    - _Requirements: 1.4_
  - [ ]* 4.2 Write property test for new task structural invariant (Property 4)
    - **Property 4: New task structural invariant**
    - **Validates: Requirements 1.4**
    - For any valid title, `createTask` must return an object with non-empty string `id`, numeric `createdAt`, and `completed === false`
  - [ ] 4.3 Implement `addTask(title)`
    - Trims title; if empty, returns early without mutation
    - Calls `createTask`, pushes to `tasks[]`, calls `saveTasks()`, calls `render()`
    - _Requirements: 1.1, 1.2, 1.5_
  - [ ]* 4.4 Write property tests for task addition (Properties 1 and 2)
    - **Property 1: Valid task addition grows the list**
    - **Validates: Requirements 1.1**
    - **Property 2: Whitespace titles are rejected**
    - **Validates: Requirements 1.2**
  - [ ] 4.5 Implement `updateTask(id, newTitle)`
    - Trims newTitle; if empty, returns early without mutation
    - Finds task by id; if not found, returns early
    - Updates `task.title`; calls `saveTasks()`, calls `render()`
    - _Requirements: 2.2, 2.3, 2.4_
  - [ ]* 4.6 Write property test for task edit (Property 6)
    - **Property 6: Edit updates the correct task title**
    - **Validates: Requirements 2.3**
    - For any task and valid new title, only that task's title changes; all others are unchanged
  - [ ] 4.7 Implement `deleteTask(id)`
    - Filters `tasks[]` to remove the task with matching id; calls `saveTasks()`, calls `render()`
    - _Requirements: 3.1, 3.3_
  - [ ]* 4.8 Write property test for task deletion (Property 7)
    - **Property 7: Delete removes exactly one task**
    - **Validates: Requirements 3.1**
    - For any list with ≥1 task, deleting by id produces a list one shorter with no task having that id
  - [ ] 4.9 Implement `toggleTask(id)`
    - Finds task by id; flips `task.completed`; calls `saveTasks()`, calls `render()`
    - _Requirements: 4.1, 4.3_
  - [ ]* 4.10 Write property test for toggle involution (Property 8)
    - **Property 8: Toggle completion is an involution**
    - **Validates: Requirements 4.1**
    - For any task, toggling twice returns to original `completed` value
  - [ ] 4.11 Implement `clearCompleted()`
    - Filters `tasks[]` to keep only tasks where `completed === false`; calls `saveTasks()`, calls `render()`
    - _Requirements: 9.1, 9.3_
  - [ ]* 4.12 Write property test for clear completed (Property 13)
    - **Property 13: Clear completed leaves only active tasks**
    - **Validates: Requirements 9.1**
    - For any task list, after `clearCompleted()` every remaining task has `completed === false`

- [ ] 5. Checkpoint — Ensure all TaskManager logic is correct
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement the UIRenderer module in `js/script.js`
  - [ ] 6.1 Implement `renderSummary()`
    - Counts total, completed, and active tasks from `tasks[]`
    - Updates `#count-total`, `#count-active`, `#count-completed` span text
    - Calculates progress percentage: `tasks.length > 0 ? Math.floor((completed / tasks.length) * 100) : 0`
    - Sets `#progress-bar` width via inline style and updates `aria-valuenow`
    - Shows/hides `#clear-completed-btn` based on whether any completed tasks exist
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 9.4_
  - [ ]* 6.2 Write property tests for summary counts and progress bar (Properties 11 and 12)
    - **Property 11: Summary counts are always correct**
    - **Validates: Requirements 7.1, 7.2**
    - **Property 12: Progress bar percentage is always correct**
    - **Validates: Requirements 7.3, 7.4, 7.5, 7.6**
  - [ ]* 6.3 Write property test for Clear Completed button visibility (Property 14)
    - **Property 14: Clear Completed button hidden when no completed tasks exist**
    - **Validates: Requirements 9.4**
  - [ ] 6.4 Implement `renderTaskItem(task)`
    - Creates and returns a `<li class="task-item [completed]" data-id="{id}">` element
    - Contains: checkbox (checked if completed), title span, Edit button, Delete button
    - _Requirements: 4.2, 8.3_
  - [ ] 6.5 Implement `renderTaskList()`
    - Filters `tasks[]` by `currentFilter` ('all', 'active', 'completed')
    - Clears `#task-list` innerHTML
    - Appends a `renderTaskItem` for each filtered task
    - Shows/hides `#empty-state` based on whether the filtered list is empty
    - _Requirements: 6.2, 6.3, 6.4, 5.2_
  - [ ]* 6.6 Write property tests for filter consistency (Properties 9 and 10)
    - **Property 9: Filter consistency**
    - **Validates: Requirements 6.2, 6.3, 6.4**
    - **Property 10: Filter re-applied after mutation**
    - **Validates: Requirements 6.6**
  - [ ] 6.7 Implement `render()`
    - Calls `renderTaskList()` then `renderSummary()`
    - _Requirements: 7.2, 7.6_
  - [ ] 6.8 Implement `setFilter(filter)`
    - Updates `currentFilter`
    - Removes `active` class from all `.filter-btn` elements; adds it to the matching button
    - Calls `render()`
    - _Requirements: 6.1, 6.5_
  - [ ] 6.9 Implement `showEditMode(li, task)` and `hideEditMode(li, task)`
    - `showEditMode`: replaces title span with a text input pre-filled with `task.title`, swaps Edit/Delete buttons for Save/Cancel
    - `hideEditMode`: restores original title span and Edit/Delete buttons
    - _Requirements: 2.1, 2.5_

- [ ] 7. Implement the Controller (event listeners) in `js/script.js`
  - [ ] 7.1 Wire up the add-task form submit handler
    - Reads `#task-input` value; calls `addTask(value)`; clears and focuses `#task-input`
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ]* 7.2 Write property test for input cleared after addition (Property 3)
    - **Property 3: Input field is cleared after valid addition**
    - **Validates: Requirements 1.3**
  - [ ] 7.3 Wire up filter button click handler (event delegation on `.filter-nav`)
    - On click of `.filter-btn`, reads `data-filter` attribute; calls `setFilter(filter)`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [ ] 7.4 Wire up task list interactions (event delegation on `#task-list`)
    - On checkbox `change`: calls `toggleTask(id)` using `li.dataset.id`
    - On Edit button click: calls `showEditMode(li, task)`
    - On Delete button click: calls `deleteTask(id)`
    - On Save button click: reads edit input value; calls `updateTask(id, newTitle)`; calls `hideEditMode`
    - On Cancel button click: calls `hideEditMode(li, task)`
    - _Requirements: 2.1, 2.3, 2.5, 3.1, 4.1_
  - [ ] 7.5 Wire up Clear Completed button click handler
    - Calls `clearCompleted()`
    - _Requirements: 9.1, 9.2, 9.3_
  - [ ] 7.6 Wire up `DOMContentLoaded` initialization
    - Calls `loadTasks()` then `render()` to restore persisted state on page load
    - _Requirements: 5.1, 5.2_

- [ ] 8. Final Checkpoint — Ensure all tests pass and the app works end-to-end
  - Ensure all tests pass, ask the user if questions arise.
  - Open `index.html` directly in a browser (no server needed) and verify:
    - Tasks can be added, edited, deleted, and toggled
    - Filters work correctly
    - Summary counts and progress bar update correctly
    - Data persists after page refresh
    - Layout is usable at narrow viewport widths

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All implementation is in exactly three files: `index.html`, `css/style.css`, `js/script.js`
- No build tools, package manager, or server is required — open `index.html` directly in a browser
- Property tests reference the design document property numbers for traceability
- Use **fast-check** for property-based tests (load via CDN in a separate `test.html` if desired)
- Each property test must run a minimum of 100 iterations (`{ numRuns: 100 }`)
- Tag format for property tests: `// Feature: personal-dashboard, Property N: <property text>`
