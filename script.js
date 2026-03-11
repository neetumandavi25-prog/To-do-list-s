const STORAGE_KEY = "todo-list:data";

const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const todoList = document.getElementById("todoList");
const filters = document.querySelectorAll(".filters .chip");
const clearCompletedBtn = document.getElementById("clearCompleted");
const clearAllBtn = document.getElementById("clearAll");
const summary = document.getElementById("summary");
const todayLabel = document.getElementById("today");
const prioritySelect = document.getElementById("prioritySelect");

let tasks = loadTasks();
let currentFilter = "all";

// seed with a few examples on first load so the UI feels obvious
if (tasks.length === 0) {
  tasks = [
    { id: "demo-1", title: "Add your first real task", completed: false, priority: "normal", createdAt: Date.now() },
    { id: "demo-2", title: "Tick the box to complete", completed: false, priority: "low", createdAt: Date.now() },
    { id: "demo-3", title: "Double-click to edit text", completed: false, priority: "high", createdAt: Date.now() }
  ];
  saveTasks();
}

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function setToday() {
  const now = new Date();
  todayLabel.textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}

function addTask() {
  const title = taskInput.value.trim();
  if (!title) return;

  tasks.unshift({
    id: crypto.randomUUID(),
    title,
    completed: false,
    priority: prioritySelect.value,
    createdAt: Date.now()
  });

  taskInput.value = "";
  saveTasks();
  render();
}

function updateSummary() {
  const remaining = tasks.filter(t => !t.completed).length;
  summary.textContent = `${remaining} task${remaining === 1 ? "" : "s"} left`;
}

function render() {
  const filtered = tasks.filter(t => {
    if (currentFilter === "active") return !t.completed;
    if (currentFilter === "completed") return t.completed;
    return true;
  });

  todoList.innerHTML = "";

  filtered.forEach(task => {
    const li = document.createElement("li");
    li.className = `todo-item ${task.completed ? "completed" : ""}`;
    li.dataset.id = task.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.ariaLabel = `Mark ${task.title} as ${task.completed ? "active" : "completed"}`;

    const content = document.createElement("div");
    const title = document.createElement("p");
    title.className = "title";
    title.textContent = task.title;
    content.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "meta";
    const priority = document.createElement("span");
    priority.className = `priority ${task.priority}`;
    priority.textContent = task.priority;
    const created = document.createElement("span");
    created.textContent = formatDate(task.createdAt);
    meta.append(priority, created);
    content.appendChild(meta);

    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn edit-btn";
    editBtn.title = "Edit task";
    editBtn.textContent = "Edit";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "icon-btn delete-btn";
    deleteBtn.title = "Delete task";
    deleteBtn.textContent = "Del";

    li.append(checkbox, content, editBtn, deleteBtn);
    todoList.appendChild(li);
  });

  if (filtered.length === 0) {
    const empty = document.createElement("li");
    empty.className = "todo-item";
    empty.innerHTML = "<p class=\"title\">No tasks here. Add one above.</p>";
    todoList.appendChild(empty);
  }

  updateSummary();
}

function setFilter(value) {
  currentFilter = value;
  filters.forEach(btn => btn.classList.toggle("active", btn.dataset.filter === value));
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

function toggleTask(id, checked) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = checked;
  saveTasks();
  render();
}

function clearCompleted() {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  render();
}

function clearAll() {
  tasks = [];
  saveTasks();
  render();
}

function startEdit(id, titleElement) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const input = document.createElement("input");
  input.type = "text";
  input.value = task.title;
  input.maxLength = 120;
  input.className = "edit-input";
  input.style.width = "100%";
  titleElement.replaceWith(input);
  input.focus();

  const finish = () => {
    const value = input.value.trim();
    task.title = value || task.title;
    saveTasks();
    render();
  };

  input.addEventListener("blur", finish);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      finish();
    } else if (e.key === "Escape") {
      render();
    }
  });
}

// Event wiring
addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", e => {
  if (e.key === "Enter") addTask();
});

filters.forEach(btn =>
  btn.addEventListener("click", () => setFilter(btn.dataset.filter))
);

clearCompletedBtn.addEventListener("click", clearCompleted);
clearAllBtn.addEventListener("click", clearAll);

todoList.addEventListener("click", e => {
  const li = e.target.closest(".todo-item");
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.matches('input[type="checkbox"]')) {
    toggleTask(id, e.target.checked);
  } else if (e.target.title === "Delete task") {
    deleteTask(id);
  } else if (e.target.title === "Edit task") {
    const titleEl = li.querySelector(".title");
    startEdit(id, titleEl);
  }
});

todoList.addEventListener("dblclick", e => {
  const titleEl = e.target.closest(".title");
  if (!titleEl) return;
  const li = titleEl.closest(".todo-item");
  startEdit(li.dataset.id, titleEl);
});

setToday();
taskInput.focus();
render();
