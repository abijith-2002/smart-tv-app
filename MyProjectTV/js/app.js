(function () {
  'use strict';

  // Basic focus manager for TV apps
  const KEY = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    ENTER: 13
  };

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

    const page = options.page || 'landing';
    const initialIndex = typeof options.initialIndex === 'number' ? options.initialIndex : 0;

    // Collect focusables in DOM order
    const container = document.querySelector(options.containerSelector || 'body');
    const focusables = Array.from(container.querySelectorAll(options.focusSelector || '.focusable'));

    if (focusables.length === 0) return;

    let currentIndex = Math.min(Math.max(initialIndex, 0), focusables.length - 1);

    // Apply tabindex and initial focus
    focusables.forEach((el, idx) => {
      el.setAttribute('tabindex', idx === currentIndex ? '0' : '-1');
      el.classList.toggle('focused', idx === currentIndex);
    });
    focusables[currentIndex].focus();

    // Helper to compute next index in a conceptual grid
    const rows = options.grid?.rows || 1;
    const cols = options.grid?.cols || focusables.length;
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
        focusables[currentIndex].focus({ preventScroll: true });

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
      switch (e.keyCode) {
        case KEY.LEFT:
          e.preventDefault(); moveFocus('left'); break;
        case KEY.RIGHT:
          e.preventDefault(); moveFocus('right'); break;
        case KEY.UP:
          e.preventDefault(); moveFocus('up'); break;
        case KEY.DOWN:
          e.preventDefault(); moveFocus('down'); break;
        case KEY.ENTER:
          e.preventDefault(); activate(); break;
        default:
          break;
      }
    }

    document.addEventListener('keydown', onKeyDown);

    // Handle Tizen back key if available to return to landing or exit
    document.addEventListener('tizenhwkey', function (e) {
      if (e.keyName === 'back' || e.keyName === 'BACK' || e.keyCode === 10009) {
        if (page === 'home') {
          // Navigate back to landing page
          window.location.href = 'index.html';
        } else {
          // On landing, attempt to exit app (if platform supports), else no-op
          try {
            if (window.tizen && tizen.application) {
              const app = tizen.application.getCurrentApplication();
              app.exit();
            } else {
              // Fallback: history.back if landed from within the app
              if (history.length > 1) history.back();
            }
          } catch (err) {
            // Ignore if not supported
            console.warn('Back handling error:', err);
          }
        }
      }
    });

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
})();
