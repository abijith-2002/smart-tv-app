(function () {
  'use strict';

  // Key maps for cross-device support
  const KEY = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    ENTER: 13,
    BACK: 10009 // Samsung tizenhwkey code
  };

  // Safely register Tizen keys (arrows/enter/back typically don't need registration)
  function registerTizenKeysSafe() {
    try {
      if (typeof window !== 'undefined' && window.tizen && tizen.tvinputdevice && typeof tizen.tvinputdevice.registerKey === 'function') {
        // Only register keys that sometimes require registration. MediaPlayPause for demo.
        tizen.tvinputdevice.registerKey('MediaPlayPause');
      }
    } catch (e) {
      // Ignore on non-Tizen environments
      console.warn('tizen.tvinputdevice.registerKey failed or not available:', e);
    }
  }

  // Prevent default browser scrolling on arrow keys to keep TV-like behavior
  function preventArrowScroll(e) {
    const kc = e.keyCode || 0;
    if (kc === KEY.LEFT || kc === KEY.RIGHT || kc === KEY.UP || kc === KEY.DOWN) {
      e.preventDefault();
    }
  }

  // PUBLIC_INTERFACE
  function init(options) {
    /**
     * Initialize TV navigation on a page.
     * options:
     *  - page: 'landing' | 'home'
     *  - grid: { rows: number, cols: number }
     *  - containerSelector: string selector for the container that holds focusable elements
     *  - focusSelector: string selector for focusable elements within the container
     *  - initialIndex: number (default 0)
     */
    if (!options) return;

    registerTizenKeysSafe();

    const page = options.page || 'landing';
    const initialIndex = typeof options.initialIndex === 'number' ? options.initialIndex : 0;

    // Collect focusables in DOM order
    const container = document.querySelector(options.containerSelector || 'body');
    const focusables = Array.from(container.querySelectorAll(options.focusSelector || '.focusable'));

    if (focusables.length === 0) return;

    // Assign data-focus-index if not present so we have predictable order
    focusables.forEach((el, idx) => {
      if (!el.hasAttribute('data-focus-index')) {
        el.setAttribute('data-focus-index', String(idx));
      }
    });

    // Sort by data-focus-index to allow custom traversal order if authored
    focusables.sort((a, b) => {
      const ai = parseInt(a.getAttribute('data-focus-index') || '0', 10);
      const bi = parseInt(b.getAttribute('data-focus-index') || '0', 10);
      if (ai === bi) return 0;
      return ai < bi ? -1 : 1;
    });

    let currentIndex = Math.min(Math.max(initialIndex, 0), focusables.length - 1);

    // Apply tabindex and initial focus
    focusables.forEach((el, idx) => {
      el.setAttribute('tabindex', idx === currentIndex ? '0' : '-1');
      el.classList.toggle('focused', idx === currentIndex);
    });
    try {
      focusables[currentIndex].focus({ preventScroll: true });
    } catch (e) {
      try { focusables[currentIndex].focus(); } catch (_) {}
    }

    // Helper to compute next index in a conceptual grid
    const rows = (options.grid && options.grid.rows) ? options.grid.rows : 1;
    const cols = (options.grid && options.grid.cols) ? options.grid.cols : focusables.length;

    function getRowCol(index) {
      const r = Math.floor(index / cols);
      const c = index % cols;
      return { r, c };
    }
    function toIndex(r, c) {
      return r * cols + c;
    }

    function moveFocus(dir) {
      let nextIndex = currentIndex;
      const { r, c } = getRowCol(currentIndex);

      if (dir === 'left') {
        if (c > 0) nextIndex = toIndex(r, c - 1);
      } else if (dir === 'right') {
        if (c < cols - 1 && toIndex(r, c + 1) < focusables.length) nextIndex = toIndex(r, c + 1);
      } else if (dir === 'up') {
        if (r > 0 && toIndex(r - 1, c) < focusables.length) nextIndex = toIndex(r - 1, c);
      } else if (dir === 'down') {
        if (r < rows - 1 && toIndex(r + 1, c) < focusables.length) nextIndex = toIndex(r + 1, c);
      }

      if (nextIndex !== currentIndex) {
        // Update tabindex and CSS state
        focusables[currentIndex].setAttribute('tabindex', '-1');
        focusables[currentIndex].classList.remove('focused');

        currentIndex = nextIndex;

        focusables[currentIndex].setAttribute('tabindex', '0');
        focusables[currentIndex].classList.add('focused');
        try {
          focusables[currentIndex].focus({ preventScroll: true });
        } catch (e) {
          try { focusables[currentIndex].focus(); } catch (_) {}
        }

        // Ensure focused item is visible if inside scrollable row
        const parentRow = focusables[currentIndex].closest('.card-row');
        if (parentRow) {
          const el = focusables[currentIndex];
          const rect = el.getBoundingClientRect();
          const parentRect = parentRow.getBoundingClientRect();
          if (rect.right > parentRect.right) {
            parentRow.scrollBy({ left: rect.right - parentRect.right + 16, behavior: 'smooth' });
          } else if (rect.left < parentRect.left) {
            parentRow.scrollBy({ left: rect.left - parentRect.left - 16, behavior: 'smooth' });
          }
        }
      }
    }

    function activate() {
      const el = focusables[currentIndex];
      // Trigger click for uniform handling
      if (el) el.click();
    }

    function onKeyDown(e) {
      const code = e.keyCode;
      const key = e.key;

      // Normalize enter and back handling
      if (code === KEY.LEFT || key === 'ArrowLeft') {
        preventArrowScroll(e); moveFocus('left'); return;
      }
      if (code === KEY.RIGHT || key === 'ArrowRight') {
        preventArrowScroll(e); moveFocus('right'); return;
      }
      if (code === KEY.UP || key === 'ArrowUp') {
        preventArrowScroll(e); moveFocus('up'); return;
      }
      if (code === KEY.DOWN || key === 'ArrowDown') {
        preventArrowScroll(e); moveFocus('down'); return;
      }
      if (code === KEY.ENTER || key === 'Enter') {
        e.preventDefault(); activate(); return;
      }
      // Some Samsung keyboards send Backspace as back in webview
      if (code === KEY.BACK || key === 'Backspace') {
        e.preventDefault();
        if (page === 'home') {
          window.location.href = 'index.html';
        } else {
          try {
            if (window.tizen && tizen.application) {
              const app = tizen.application.getCurrentApplication();
              app.exit();
            } else if (history.length > 1) {
              history.back();
            }
          } catch (err) {
            console.warn('Back handling error:', err);
          }
        }
        return;
      }
    }

    document.addEventListener('keydown', onKeyDown, { passive: false });

    // Handle Tizen back key if available to return to landing or exit (10009)
    document.addEventListener('tizenhwkey', function (e) {
      if (e && (e.keyName === 'back' || e.keyName === 'BACK' || e.keyCode === 10009)) {
        e.preventDefault();
        if (page === 'home') {
          window.location.href = 'index.html';
        } else {
          // On landing, attempt to exit app (if platform supports), else no-op
          try {
            if (typeof window !== 'undefined' && window.tizen && tizen.application) {
              const app = tizen.application.getCurrentApplication();
              app.exit();
            } else if (history.length > 1) {
              history.back();
            }
          } catch (err) {
            console.warn('Back handling error:', err);
          }
        }
      }
    });
    // Also guard generic keydown for 10009 keyCode sent via keyboard events on some firmwares
    document.addEventListener('keydown', function (e) {
      if ((e.keyCode === 10009)) {
        e.preventDefault();
        if (page === 'home') {
          window.location.href = 'index.html';
        } else {
          try {
            if (typeof window !== 'undefined' && window.tizen && tizen.application) {
              const app = tizen.application.getCurrentApplication();
              app.exit();
            } else if (history.length > 1) {
              history.back();
            }
          } catch (err) {
            console.warn('Back handling error:', err);
          }
        }
      }
    }, { passive: false });

    // Expose a small API for debugging if needed
    return {
      getIndex: () => currentIndex,
      getFocusables: () => focusables.slice()
    };
  }

  // PUBLIC_INTERFACE
  window.TVApp = {
    /** Initialize TV navigation for current page. */
    init
  };

  // Prevent default scroll behavior on space/arrow keys globally
  window.addEventListener('keydown', function (e) {
    const kc = e.keyCode || 0;
    if (kc === KEY.LEFT || kc === KEY.RIGHT || kc === KEY.UP || kc === KEY.DOWN || e.key === ' ') {
      e.preventDefault();
    }
  }, { passive: false });
})();
