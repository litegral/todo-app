const state = {
  todos: [],
  filter: 'all',
};

const els = {
  composer: document.getElementById('composer'),
  input: document.getElementById('new-todo'),
  list: document.getElementById('list'),
  empty: document.getElementById('empty'),
  error: document.getElementById('error'),
  summary: document.getElementById('summary'),
  clearCompleted: document.getElementById('clear-completed'),
  filters: document.querySelectorAll('.filter'),
  template: document.getElementById('todo-template'),
};

function showError(message) {
  els.error.textContent = message;
  els.error.hidden = false;
}

function clearError() {
  els.error.hidden = true;
  els.error.textContent = '';
}

function visibleTodos() {
  if (state.filter === 'active') {
    return state.todos.filter((todo) => !todo.completed);
  }
  if (state.filter === 'completed') {
    return state.todos.filter((todo) => todo.completed);
  }
  return state.todos;
}

function renderSummary() {
  const remaining = state.todos.filter((todo) => !todo.completed).length;
  const total = state.todos.length;

  if (total === 0) {
    els.summary.textContent = 'Nothing yet';
  } else if (remaining === 0) {
    els.summary.textContent = 'All done';
  } else {
    els.summary.textContent = `${remaining} of ${total} left`;
  }

  els.clearCompleted.disabled = remaining === total;
}

function renderFilters() {
  els.filters.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.filter === state.filter);
  });
}

function createTodoElement(todo) {
  const node = els.template.content.firstElementChild.cloneNode(true);
  const title = node.querySelector('.todo__title');
  const checkbox = node.querySelector('.todo__checkbox');

  node.dataset.id = String(todo.id);
  node.classList.toggle('todo--completed', todo.completed);
  title.textContent = todo.title;
  checkbox.checked = todo.completed;
  checkbox.setAttribute('aria-label', `Mark "${todo.title}" as complete`);

  return node;
}

function renderList() {
  const todos = visibleTodos();

  els.list.replaceChildren(...todos.map(createTodoElement));
  els.empty.hidden = todos.length > 0;
  els.list.hidden = todos.length === 0;
}

function render() {
  renderSummary();
  renderFilters();
  renderList();
}

async function refresh() {
  state.todos = await window.api.todos.list();
  render();
}

async function run(action) {
  clearError();
  try {
    await action();
  } catch (error) {
    showError(error.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, ''));
  }
}

function startEditing(item, todo) {
  if (item.querySelector('.todo__edit-input')) {
    return;
  }

  const input = document.createElement('input');
  input.className = 'todo__edit-input';
  input.type = 'text';
  input.maxLength = 200;
  input.value = todo.title;

  const title = item.querySelector('.todo__title');
  title.replaceWith(input);
  input.focus();
  input.select();

  let finished = false;

  const cancel = () => {
    if (finished) return;
    finished = true;
    input.replaceWith(title);
  };

  const commit = async () => {
    if (finished) return;
    finished = true;

    const nextTitle = input.value.trim();

    if (!nextTitle || nextTitle === todo.title) {
      cancel();
      return;
    }

    await run(async () => {
      await window.api.todos.update(todo.id, nextTitle);
      await refresh();
    });
  };

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    }
  });
  input.addEventListener('blur', commit);
}

els.composer.addEventListener('submit', (event) => {
  event.preventDefault();

  const title = els.input.value.trim();
  if (!title) {
    return;
  }

  els.input.value = '';

  run(async () => {
    await window.api.todos.create(title);
    await refresh();
  });
});

els.list.addEventListener('change', (event) => {
  if (!event.target.classList.contains('todo__checkbox')) {
    return;
  }

  const item = event.target.closest('.todo');
  const id = Number(item.dataset.id);
  const todo = state.todos.find((entry) => entry.id === id);
  if (!todo) {
    return;
  }

  run(async () => {
    await window.api.todos.setCompleted(id, !todo.completed);
    await refresh();
  });
});

els.list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }

  const item = button.closest('.todo');
  const id = Number(item.dataset.id);
  const todo = state.todos.find((entry) => entry.id === id);
  if (!todo) {
    return;
  }

  if (button.dataset.action === 'edit') {
    startEditing(item, todo);
    return;
  }

  run(async () => {
    await window.api.todos.remove(id);
    await refresh();
  });
});

els.filters.forEach((button) => {
  button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    render();
  });
});

els.clearCompleted.addEventListener('click', () => {
  run(async () => {
    await window.api.todos.clearCompleted();
    await refresh();
  });
});

run(refresh);
