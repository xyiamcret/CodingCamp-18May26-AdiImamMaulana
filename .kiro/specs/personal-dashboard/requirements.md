# Requirements Document

## Introduction

The To-Do List Life Dashboard is a browser-based personal productivity application that helps users manage daily tasks and life goals. It runs entirely in the browser with no backend server, using HTML, CSS, and vanilla JavaScript. All data is persisted client-side via the browser's LocalStorage API. The application is delivered as three files: `index.html`, `css/style.css`, and `js/script.js`.

## Glossary

- **Dashboard**: The main single-page view of the application showing task summary and task list.
- **Task**: A to-do item with a title, optional description, completion status, and creation timestamp.
- **Task_Manager**: The JavaScript module responsible for creating, reading, updating, and deleting tasks.
- **Storage**: The browser LocalStorage API used to persist task data client-side.
- **Filter**: A view mode that controls which subset of tasks is displayed (All, Active, Completed).
- **Progress_Bar**: A visual indicator showing the ratio of completed tasks to total tasks.
- **UI_Renderer**: The JavaScript module responsible for updating the DOM to reflect current application state.
- **Validator**: The JavaScript logic responsible for checking that task input meets required constraints before saving.

---

## Requirements

### Requirement 1: Add a New Task

**User Story:** As a user, I want to add new tasks to my dashboard, so that I can capture things I need to accomplish.

#### Acceptance Criteria

1. WHEN a user types a task title in the input field and submits the form, THE Task_Manager SHALL create a new task object and add it to the task list.
2. WHEN a user attempts to submit a task with an empty or whitespace-only title, THE Validator SHALL prevent the submission and maintain the current task list state.
3. WHEN a new task is successfully added, THE UI_Renderer SHALL clear the input field and return focus to it for the next entry.
4. WHEN a new task is created, THE Task_Manager SHALL assign it a unique identifier, a creation timestamp, and a default completion status of false.
5. WHEN a new task is added, THE Storage SHALL persist the updated task list to LocalStorage immediately.

---

### Requirement 2: Edit an Existing Task

**User Story:** As a user, I want to edit the title of an existing task, so that I can correct mistakes or update task details.

#### Acceptance Criteria

1. WHEN a user activates the edit action on a task, THE UI_Renderer SHALL display an editable input field pre-filled with the current task title.
2. WHEN a user submits the edited title, THE Validator SHALL reject the update if the new title is empty or whitespace-only and preserve the original title.
3. WHEN a user submits a valid edited title, THE Task_Manager SHALL update the task's title in the task list.
4. WHEN a task title is successfully updated, THE Storage SHALL persist the updated task list to LocalStorage immediately.
5. WHEN a user cancels an edit action, THE UI_Renderer SHALL restore the original task display without modifying the task data.

---

### Requirement 3: Delete a Task

**User Story:** As a user, I want to delete tasks from my dashboard, so that I can remove items that are no longer relevant.

#### Acceptance Criteria

1. WHEN a user activates the delete action on a task, THE Task_Manager SHALL remove that task from the task list.
2. WHEN a task is deleted, THE UI_Renderer SHALL remove the task's element from the DOM immediately.
3. WHEN a task is deleted, THE Storage SHALL persist the updated task list to LocalStorage immediately.

---

### Requirement 4: Mark Tasks as Complete or Incomplete

**User Story:** As a user, I want to mark tasks as complete or incomplete, so that I can track my progress.

#### Acceptance Criteria

1. WHEN a user toggles the completion checkbox on a task, THE Task_Manager SHALL update that task's completion status to the opposite of its current value.
2. WHEN a task's completion status changes, THE UI_Renderer SHALL apply a visual distinction (such as strikethrough styling) to completed tasks.
3. WHEN a task's completion status changes, THE Storage SHALL persist the updated task list to LocalStorage immediately.
4. WHEN a user marks all tasks as complete, THE UI_Renderer SHALL reflect that all tasks are visually styled as completed.

---

### Requirement 5: Persist Data via LocalStorage

**User Story:** As a user, I want my tasks to be saved automatically, so that my data is not lost when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN the application loads, THE Storage SHALL read the task list from LocalStorage and THE UI_Renderer SHALL display all previously saved tasks.
2. WHEN LocalStorage contains no saved data, THE UI_Renderer SHALL display an empty task list with a prompt to add the first task.
3. WHEN any task is created, updated, or deleted, THE Storage SHALL serialize the full task list to a JSON string and write it to LocalStorage under a fixed key.
4. IF LocalStorage data is corrupted or unparseable, THEN THE Storage SHALL discard the corrupted data and initialize with an empty task list.

---

### Requirement 6: Filter and View Tasks

**User Story:** As a user, I want to filter my task list by status, so that I can focus on active work or review completed items.

#### Acceptance Criteria

1. THE UI_Renderer SHALL display three filter options: All, Active, and Completed.
2. WHEN a user selects the "All" filter, THE UI_Renderer SHALL display every task regardless of completion status.
3. WHEN a user selects the "Active" filter, THE UI_Renderer SHALL display only tasks where completion status is false.
4. WHEN a user selects the "Completed" filter, THE UI_Renderer SHALL display only tasks where completion status is true.
5. WHEN a filter is selected, THE UI_Renderer SHALL visually highlight the active filter to indicate the current view.
6. WHEN a task is added, edited, deleted, or toggled, THE UI_Renderer SHALL re-apply the currently active filter so the displayed list remains consistent.

---

### Requirement 7: Dashboard Overview

**User Story:** As a user, I want to see a summary of my tasks at a glance, so that I can understand my overall progress without scrolling through the full list.

#### Acceptance Criteria

1. THE UI_Renderer SHALL display the total number of tasks, the number of completed tasks, and the number of active (incomplete) tasks in a summary section.
2. WHEN the task list changes, THE UI_Renderer SHALL update the task counts in the summary section immediately.
3. THE UI_Renderer SHALL display a Progress_Bar that visually represents the ratio of completed tasks to total tasks.
4. WHEN there are no tasks, THE Progress_Bar SHALL display at 0% fill.
5. WHEN all tasks are completed, THE Progress_Bar SHALL display at 100% fill.
6. WHEN the task list changes, THE UI_Renderer SHALL update the Progress_Bar fill percentage immediately.

---

### Requirement 8: Clean Single-File UI

**User Story:** As a user, I want a clean, minimal, and visually clear interface, so that I can use the dashboard without distraction or confusion.

#### Acceptance Criteria

1. THE UI_Renderer SHALL render all visual output using styles defined exclusively in `css/style.css`.
2. THE Dashboard SHALL use CSS custom properties (variables) for colors, spacing, and typography to ensure visual consistency.
3. THE Dashboard SHALL apply a clear visual hierarchy so that the task input, summary section, filter controls, and task list are each visually distinct.
4. THE Dashboard SHALL use readable typography with sufficient contrast between text and background.
5. WHERE the viewport width is 600px or below, THE Dashboard SHALL adapt its layout so that all controls and content remain usable without horizontal scrolling.

---

### Requirement 9: Clear Completed Tasks

**User Story:** As a user, I want to remove all completed tasks at once, so that I can quickly clean up my dashboard.

#### Acceptance Criteria

1. WHEN a user activates the "Clear Completed" action, THE Task_Manager SHALL remove all tasks whose completion status is true from the task list.
2. WHEN completed tasks are cleared, THE UI_Renderer SHALL remove their elements from the DOM immediately.
3. WHEN completed tasks are cleared, THE Storage SHALL persist the updated task list to LocalStorage immediately.
4. WHEN there are no completed tasks, THE UI_Renderer SHALL disable or hide the "Clear Completed" control.
