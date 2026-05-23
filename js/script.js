/* ============================================================
   Life Dashboard — js/script.js
   Single-file vanilla JS: no frameworks, no build tools.
   ============================================================ */

'use strict';

// ============================================================
// STORAGE KEYS
// ============================================================
const KEY_TASKS   = 'ld-tasks';
const KEY_LINKS   = 'ld-links';
const KEY_THEME   = 'ld-theme';
const KEY_NAME    = 'ld-name';
const KEY_POMODORO = 'ld-pomodoro';

// ============================================================
// HELPERS
// ============================================================
function storageGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage write failed:', e);
  }
}

// ============================================================
// STATE
// ============================================================
let tasks         = storageGet(KEY_TASKS, []);
let links         = storageGet(KEY_LINKS, []);
let currentFilter = 'all';

// ── Timer state ──
let pomodoroMinutes = storageGet(KEY_POMODORO, 25);
let timerTotal      = pomodoroMinutes * 60;   // seconds
let timerRemaining  = timerTotal;
let timerInterval   = null;
let timerRunning    = false;

// ── Settings state ──
let userName = storageGet(KEY_NAME, '');

// ============================================================
// GREETING MODULE
// ============================================================
function getGreeting(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function getGreetingEmoji(hour) {
  if (hour < 12) return '☀️';
  if (hour < 17) return '🌤️';
  if (hour < 21) return '🌆';
  return '🌙';
}

function updateGreeting() {
  const now  = new Date();
  const hour = now.getHours();

  // Time
  const hh = String(hour).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('greeting-time').textContent = `${hh}:${mm}:${ss}`;

  // Date
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  document.getElementById('greeting-date').textContent = dateStr;

  // Greeting text
  const name    = userName ? `, ${userName}` : '';
  const emoji   = getGreetingEmoji(hour);
  const greeting = getGreeting(hour);
  document.getElementById('greeting-text').textContent = `${greeting}${name}! ${emoji}`;
}

// ============================================================
// THEME MODULE
// ============================================================
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('theme-toggle').textContent = theme === 'dark' ? '☀️' : '🌙';
  document.getElementById('theme-toggle').title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next    = current === 'dark' ? 'light' : 'dark';
  storageSet(KEY_THEME, next);
  applyTheme(next);
}

// ============================================================
// TIMER MODULE
// ============================================================
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function renderTimerDisplay() {
  const el = document.getElementById('timer-display');
  el.textContent = formatTime(timerRemaining);
  el.classList.toggle('running', timerRunning && timerRemaining > 0);
  el.classList.toggle('finished', timerRemaining === 0);
}

function timerTick() {
  if (timerRemaining <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning  = false;
    renderTimerDisplay();
    return;
  }
  timerRemaining--;
  renderTimerDisplay();
}

function startTimer() {
  if (timerRunning) return;
  if (timerRemaining <= 0) timerRemaining = timerTotal;
  timerRunning = true;
  timerInterval = setInterval(timerTick, 1000);
  renderTimerDisplay();
}

function stopTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning  = false;
  renderTimerDisplay();
}

function resetTimer() {
  stopTimer();
  timerRemaining = timerTotal;
  renderTimerDisplay();
}

function applyPomodoroMinutes(minutes) {
  const parsed = parseInt(minutes, 10);
  if (isNaN(parsed) || parsed < 1 || parsed > 120) return;
  pomodoroMinutes = parsed;
  timerTotal      = pomodoroMinutes * 60;
  storageSet(KEY_POMODORO, pomodoroMinutes);
  resetTimer();
}

// ============================================================
// TASK MANAGER MODULE
// ============================================================
function saveTasks() { storageSet(KEY_TASKS, tasks); }

function createTask(title) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    title: title.trim(),
    completed: false,
    createdAt: Date.now(),
  };
}

function addTask(title) {
  if (!title.trim()) return;
  tasks.push(createTask(title));
  saveTasks();
  renderTasks();
}

function updateTask(id, newTitle) {
  if (!newTitle.trim()) return;
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  t.title = newTitle.trim();
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  t.completed = !t.completed;
  saveTasks();
  renderTasks();
}

function clearCompleted() {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderTasks();
}

// ============================================================
// TASK RENDERER MODULE
// ============================================================
function renderTaskItem(task) {
  const li = document.createElement('li');
  li.className = 'task-item' + (task.completed ? ' completed' : '');
  li.dataset.id = task.id;

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'task-checkbox';
  cb.checked = task.completed;
  cb.setAttribute('aria-label', 'Mark complete');

  const span = document.createElement('span');
  span.className = 'task-title';
  span.textContent = task.title;

  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn-edit btn-sm';
  editBtn.setAttribute('aria-label', 'Edit task');
  editBtn.textContent = 'Edit';

  const delBtn = document.createElement('button');
  delBtn.className = 'btn btn-delete btn-sm';
  delBtn.setAttribute('aria-label', 'Delete task');
  delBtn.textContent = 'Del';

  actions.append(editBtn, delBtn);
  li.append(cb, span, actions);
  return li;
}

function renderTasks() {
  const filtered = tasks.filter(t => {
    if (currentFilter === 'active')    return !t.completed;
    if (currentFilter === 'completed') return  t.completed;
    return true;
  });

  const list = document.getElementById('task-list');
  list.innerHTML = '';
  filtered.forEach(t => list.appendChild(renderTaskItem(t)));

  document.getElementById('empty-state').hidden = filtered.length > 0;

  // Summary
  const total     = tasks.length;
  const done      = tasks.filter(t => t.completed).length;
  const active    = total - done;
  const pct       = total > 0 ? Math.floor((done / total) * 100) : 0;

  document.getElementById('count-total').textContent  = total;
  document.getElementById('count-active').textContent = active;
  document.getElementById('count-done').textContent   = done;

  const bar = document.getElementById('progress-bar');
  bar.style.width = `${pct}%`;
  bar.setAttribute('aria-valuenow', pct);

  document.getElementById('clear-completed-btn').hidden = done === 0;
}

function showEditMode(li, task) {
  const span    = li.querySelector('.task-title');
  const actions = li.querySelector('.task-actions');

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'task-edit-input';
  input.value = task.title;
  input.setAttribute('aria-label', 'Edit task title');
  li.replaceChild(input, span);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-save btn-sm';
  saveBtn.setAttribute('aria-label', 'Save');
  saveBtn.textContent = 'Save';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-cancel btn-sm';
  cancelBtn.setAttribute('aria-label', 'Cancel');
  cancelBtn.textContent = 'Cancel';

  actions.innerHTML = '';
  actions.append(saveBtn, cancelBtn);
  input.focus();
  input.select();
}

function hideEditMode(li, task) {
  const input   = li.querySelector('.task-edit-input');
  const actions = li.querySelector('.task-actions');

  const span = document.createElement('span');
  span.className = 'task-title';
  span.textContent = task.title;
  li.replaceChild(span, input);

  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn-edit btn-sm';
  editBtn.setAttribute('aria-label', 'Edit task');
  editBtn.textContent = 'Edit';

  const delBtn = document.createElement('button');
  delBtn.className = 'btn btn-delete btn-sm';
  delBtn.setAttribute('aria-label', 'Delete task');
  delBtn.textContent = 'Del';

  actions.innerHTML = '';
  actions.append(editBtn, delBtn);
}

function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.filter-btn[data-filter="${filter}"]`).classList.add('active');
  renderTasks();
}

// ============================================================
// QUICK LINKS MODULE
// ============================================================
function saveLinks() { storageSet(KEY_LINKS, links); }

function addLink(name, url) {
  name = name.trim();
  url  = url.trim();
  if (!name || !url) return false;
  // Ensure protocol
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  links.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), name, url });
  saveLinks();
  renderLinks();
  return true;
}

function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

function renderLinks() {
  const grid  = document.getElementById('links-grid');
  const empty = document.getElementById('links-empty');
  grid.innerHTML = '';

  if (links.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  links.forEach(link => {
    const chip = document.createElement('div');
    chip.className = 'link-chip-wrapper';
    chip.style.display = 'inline-flex';
    chip.style.alignItems = 'center';

    const a = document.createElement('a');
    a.href   = link.url;
    a.target = '_blank';
    a.rel    = 'noopener noreferrer';
    a.className = 'link-chip';
    a.textContent = link.name;

    const delBtn = document.createElement('button');
    delBtn.className = 'link-delete-btn';
    delBtn.setAttribute('aria-label', `Remove ${link.name}`);
    delBtn.textContent = '✕';
    delBtn.dataset.id  = link.id;

    chip.append(a, delBtn);
    grid.appendChild(chip);
  });
}

// ============================================================
// SETTINGS MODULE
// ============================================================
function openSettings() {
  const modal = document.getElementById('settings-modal');
  document.getElementById('input-name').value     = userName;
  document.getElementById('input-pomodoro').value = pomodoroMinutes;
  modal.hidden = false;
}

function closeSettings() {
  document.getElementById('settings-modal').hidden = true;
}

// ============================================================
// CONTROLLER — EVENT WIRING
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

  // ── Apply saved theme ──
  applyTheme(storageGet(KEY_THEME, 'light'));

  // ── Start clock ──
  updateGreeting();
  setInterval(updateGreeting, 1000);

  // ── Initial renders ──
  renderTimerDisplay();
  renderTasks();
  renderLinks();

  // ── Theme toggle ──
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // ── Settings open/close ──
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('settings-close').addEventListener('click', closeSettings);
  document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('settings-modal')) closeSettings();
  });

  // ── Save name ──
  document.getElementById('save-name-btn').addEventListener('click', () => {
    userName = document.getElementById('input-name').value.trim();
    storageSet(KEY_NAME, userName);
    updateGreeting();
    closeSettings();
  });

  // ── Save pomodoro duration ──
  document.getElementById('save-pomodoro-btn').addEventListener('click', () => {
    applyPomodoroMinutes(document.getElementById('input-pomodoro').value);
    closeSettings();
  });

  // ── Timer controls ──
  document.getElementById('timer-start').addEventListener('click', startTimer);
  document.getElementById('timer-stop').addEventListener('click', stopTimer);
  document.getElementById('timer-reset').addEventListener('click', resetTimer);

  // ── Add task form ──
  document.getElementById('add-task-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('task-input');
    addTask(input.value);
    input.value = '';
    input.focus();
  });

  // ── Filter buttons ──
  document.querySelector('.filter-nav').addEventListener('click', (e) => {
    if (e.target.matches('.filter-btn')) setFilter(e.target.dataset.filter);
  });

  // ── Task list interactions (event delegation) ──
  document.getElementById('task-list').addEventListener('click', (e) => {
    const li = e.target.closest('.task-item');
    if (!li) return;
    const id   = li.dataset.id;
    const task = tasks.find(t => t.id === id);

    if (e.target.matches('.btn-edit')) {
      showEditMode(li, task);
    } else if (e.target.matches('.btn-delete')) {
      deleteTask(id);
    } else if (e.target.matches('.btn-save')) {
      const val = li.querySelector('.task-edit-input').value;
      updateTask(id, val);
      const updated = tasks.find(t => t.id === id);
      if (updated) hideEditMode(li, updated);
    } else if (e.target.matches('.btn-cancel')) {
      hideEditMode(li, task);
    }
  });

  document.getElementById('task-list').addEventListener('change', (e) => {
    if (e.target.matches('.task-checkbox')) {
      const li = e.target.closest('.task-item');
      if (li) toggleTask(li.dataset.id);
    }
  });

  // ── Clear completed ──
  document.getElementById('clear-completed-btn').addEventListener('click', clearCompleted);

  // ── Add link form ──
  document.getElementById('add-link-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('link-name-input');
    const urlInput  = document.getElementById('link-url-input');
    if (addLink(nameInput.value, urlInput.value)) {
      nameInput.value = '';
      urlInput.value  = '';
      nameInput.focus();
    }
  });

  // ── Delete link (event delegation on grid) ──
  document.getElementById('links-grid').addEventListener('click', (e) => {
    if (e.target.matches('.link-delete-btn')) {
      deleteLink(e.target.dataset.id);
    }
  });

});
