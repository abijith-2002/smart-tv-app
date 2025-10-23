/**
 * PUBLIC_INTERFACE
 * FocusManager: Handles DPAD/keyboard navigation across elements with class 'focusable'
 */
const FocusManager = (() => {
  /** Internal state */
  let current = null;
  let container = document;

  function setFocus(el) {
    if (!el) return;
    if (current && current.classList) current.classList.remove('focused');
    current = el;
    if (current && current.classList) current.classList.add('focused');
    if (current && typeof current.focus === 'function') current.focus();
  }

  function getAllFocusable() {
    return Array.from(container.querySelectorAll('.focusable, input, button, [tabindex]'))
      .filter(el => !el.disabled && el.tabIndex !== -1 && el.offsetParent !== null);
  }

  function move(dir) {
    const focusables = getAllFocusable();
    if (!current) {
      setFocus(focusables[0]);
      return;
    }
    const rect = current.getBoundingClientRect();
    const candidates = focusables.filter(el => el !== current);
    let best = null;
    let bestScore = Infinity;

    candidates.forEach(el => {
      const r = el.getBoundingClientRect();
      const dx = r.left - rect.left;
      const dy = r.top - rect.top;

      // Filter by direction
      if (dir === 'left' && r.right > rect.left) return;
      if (dir === 'right' && r.left < rect.right) return;
      if (dir === 'up' && r.bottom > rect.top) return;
      if (dir === 'down' && r.top < rect.bottom) return;

      const distance = Math.hypot(dx, dy);
      if (distance < bestScore) {
        bestScore = distance;
        best = el;
      }
    });

    if (best) setFocus(best);
  }

  function activate(el = current) {
    if (!el) return;
    const action = el.dataset && el.dataset.action;
    if (action) {
      AppRouter.trigger(action, el);
    } else if (typeof el.click === 'function') {
      el.click();
    }
  }

  function onKey(e) {
    const k = e.key;
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Escape','Backspace'].includes(k)) {
      e.preventDefault();
    }
    switch (k) {
      case 'ArrowLeft': return move('left');
      case 'ArrowRight': return move('right');
      case 'ArrowUp': return move('up');
      case 'ArrowDown': return move('down');
      case 'Enter': return activate();
      case 'Escape':
      case 'Backspace':
        if (typeof AppRouter.back === 'function') AppRouter.back();
        else history.back();
        return;
    }
  }

  // PUBLIC_INTERFACE
  function init({ container: c = document, initial = null } = {}) {
    /** Initialize focus manager. */
    container = c || document;
    document.addEventListener('keydown', onKey);
    if (initial) setFocus(initial);
    else setFocus(getAllFocusable()[0]);
  }

  return { init, setFocus };
})();

/**
 * PUBLIC_INTERFACE
 * AppRouter: Simple action dispatcher for data-action attributes.
 */
const AppRouter = (() => {
  const actions = new Map();

  // PUBLIC_INTERFACE
  function register(name, handler) {
    /** Register an action handler by name. */
    actions.set(name, handler);
  }

  // PUBLIC_INTERFACE
  function trigger(name, el) {
    /** Trigger an action by name. */
    const handler = actions.get(name);
    if (!handler) return;
    if (name.startsWith('goto:')) handler();
    else handler(el);
  }

  // PUBLIC_INTERFACE
  function back() {
    /** Navigate back with history fallback. */
    if (document.referrer) history.back();
    else window.location.href = 'home.html';
  }

  return { register, trigger, back };
})();

/**
 * PUBLIC_INTERFACE
 * Toast: Minimal feedback utility
 */
const Toast = (() => {
  let el = null;
  function ensure() {
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
  }
  // PUBLIC_INTERFACE
  function show(msg, timeout = 1800) {
    /** Show a toast message temporarily. */
    ensure();
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), timeout);
  }
  return { show };
})();
