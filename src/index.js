// PUBLIC_INTERFACE
function initApp() {
    /**
     * Initialize the Smart TV App root UI with centered layout and two buttons.
     * This serves as a placeholder entry for the webpack build.
     */
    const root = document.getElementById('root');
    if (!root) {
        const fallback = document.createElement('div');
        fallback.textContent = 'Root element not found.';
        document.body.appendChild(fallback);
        return;
    }

    // Styles
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --primary: #1e3c72;
        --secondary: #2a5298;
        --accent: #396afc;
        --bg: #0f2027;
        --text: #e6eef7;
      }
      * { box-sizing: border-box; }
      body, html, #root {
        margin: 0;
        height: 100%;
        background: radial-gradient(1200px 600px at 50% 20%, rgba(57,106,252,0.15), transparent 60%) , linear-gradient(135deg, var(--bg), #09141a 70%);
        color: var(--text);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;
      }
      .container {
        height: 100%;
        display: grid;
        place-items: center;
        padding: 24px;
      }
      .card {
        width: min(92vw, 780px);
        border-radius: 24px;
        padding: 48px 40px;
        background: linear-gradient(160deg, rgba(30,60,114,0.35), rgba(42,82,152,0.25));
        border: 1px solid rgba(255,255,255,0.08);
        backdrop-filter: blur(8px);
        box-shadow: 0 10px 40px rgba(0,0,0,0.45);
        text-align: center;
      }
      h1 {
        margin: 0 0 16px;
        font-size: clamp(28px, 6vw, 48px);
        letter-spacing: 0.5px;
      }
      p.sub {
        margin: 0 0 32px;
        opacity: 0.85;
        font-size: clamp(14px, 2.2vw, 18px);
      }
      .actions {
        display: flex;
        gap: 20px;
        justify-content: center;
        flex-wrap: wrap;
      }
      .btn {
        cursor: pointer;
        min-width: 180px;
        padding: 16px 28px;
        border-radius: 999px;
        border: 2px solid transparent;
        font-weight: 700;
        font-size: 18px;
        transition: transform 0.1s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        outline: none;
      }
      .btn:focus-visible {
        box-shadow: 0 0 0 4px rgba(57,106,252,0.35);
      }
      .btn.primary {
        background: linear-gradient(135deg, var(--primary), var(--accent));
        color: white;
      }
      .btn.primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 20px rgba(57,106,252,0.35);
      }
      .btn.secondary {
        background: transparent;
        color: var(--text);
        border-color: rgba(255,255,255,0.2);
      }
      .btn.secondary:hover {
        border-color: rgba(255,255,255,0.35);
        transform: translateY(-1px);
      }
      .hint {
        margin-top: 18px;
        opacity: 0.7;
        font-size: 14px;
      }
    `;
    document.head.appendChild(style);

    // UI
    const container = document.createElement('div');
    container.className = 'container';

    const card = document.createElement('div');
    card.className = 'card';

    const title = document.createElement('h1');
    title.textContent = 'Smart TV App';

    const sub = document.createElement('p');
    sub.className = 'sub';
    sub.textContent = 'Welcome! Use your remote or keyboard arrows to navigate.';

    const actions = document.createElement('div');
    actions.className = 'actions';

    const loginBtn = document.createElement('button');
    loginBtn.className = 'btn primary';
    loginBtn.textContent = 'Login';

    const signupBtn = document.createElement('button');
    signupBtn.className = 'btn secondary';
    signupBtn.textContent = 'Signup';

    actions.appendChild(loginBtn);
    actions.appendChild(signupBtn);

    const hint = document.createElement('div');
    hint.className = 'hint';
    hint.textContent = 'Hint: Tab/Shift+Tab or Arrow keys to move, Enter to activate.';

    card.appendChild(title);
    card.appendChild(sub);
    card.appendChild(actions);
    card.appendChild(hint);
    container.appendChild(card);
    root.appendChild(container);

    // Simple navigation (placeholder)
    const navigate = (path) => {
      // For now just log. If using separate pages, you can set window.location = 'login.html' etc.
      console.log('Navigate to:', path);
      alert(`Navigate to: ${path}`);
    };

    loginBtn.addEventListener('click', () => navigate('/login'));
    signupBtn.addEventListener('click', () => navigate('/signup'));

    // Basic remote/keyboard navigation
    const buttons = [loginBtn, signupBtn];
    let focusedIndex = 0;
    const focusButton = (idx) => {
      buttons[focusedIndex].blur();
      focusedIndex = ((idx % buttons.length) + buttons.length) % buttons.length;
      buttons[focusedIndex].focus();
    };
    // Initial focus for TV remote feel
    focusButton(0);

    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'Tab':
          if (e.shiftKey || e.key !== 'Tab') {
            e.preventDefault();
            focusButton(focusedIndex - 1);
          }
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          focusButton(focusedIndex + 1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          buttons[focusedIndex].click();
          break;
      }
    });
}

document.addEventListener('DOMContentLoaded', initApp);
