(function () {
  'use strict';

  // PUBLIC_INTERFACE
  /**
   * Initialize TV-remote/keyboard navigation for focusable elements on the page.
   * Behavior:
   * - Focusables are any element with [data-focusable="true"] or [role="button"] with tabindex="0".
   * - ArrowLeft/Right/Up/Down: moves focus horizontally within the current row group.
   *   Since the layout is simple (two CTAs), arrows move between items by index.
   * - Enter/Space: activates (click) the focused control.
   * - Tab: left as a fallback to move focus by browser default.
   * - On load: first focusable element receives focus.
   */
  function initSimpleFocusNavigation() {
    // Collect focusables in document order
    var focusables = Array.prototype.slice.call(
      document.querySelectorAll('[data-focusable="true"], [role="button"][tabindex="0"]')
    );

    // Index assignments if not present
    for (var i = 0; i < focusables.length; i++) {
      if (!focusables[i].hasAttribute('data-index')) {
        focusables[i].setAttribute('data-index', String(i));
      }
    }

    function getIndex(el) {
      var idx = el && el.getAttribute ? el.getAttribute('data-index') : null;
      var n = idx !== null ? parseInt(idx, 10) : -1;
      return isNaN(n) ? -1 : n;
    }

    function clamp(val, min, max) {
      return Math.max(min, Math.min(max, val));
    }

    function focusAt(index) {
      if (!focusables.length) return;
      var i = clamp(index, 0, focusables.length - 1);
      var el = focusables[i];
      if (el && el.focus) {
        // preventScroll for smoother TV UIs (supported in modern webviews; if not supported it is ignored)
        try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
      }
    }

    function currentIndex() {
      var active = document.activeElement;
      var idx = getIndex(active);
      if (idx >= 0) return idx;
      return 0;
    }

    // Initial focus
    if (focusables.length) {
      focusAt(0);
    }

    // Activation helper
    function activate(el) {
      if (!el) return;
      // Trigger click for anchors/buttons
      if (typeof el.click === 'function') {
        el.click();
      } else {
        // As a fallback, follow href if anchor
        var href = el.getAttribute && el.getAttribute('href');
        if (href) window.location.href = href;
      }
    }

    // Key handling for remote/keyboard
    document.addEventListener('keydown', function (e) {
      var key = e.key;
      // Arrow and Enter/Space keys are handled
      if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown' ||
          key === 'Enter' || key === ' ' || key === 'Spacebar') {
        e.preventDefault();
      } else {
        return; // let other keys work normally (including Tab)
      }

      var idx = currentIndex();

      if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
        activate(document.activeElement);
        return;
      }

      // For a simple 2-button layout, treat any arrow as left/right navigation.
      if (key === 'ArrowLeft' || key === 'ArrowUp') {
        focusAt(idx - 1);
      } else if (key === 'ArrowRight' || key === 'ArrowDown') {
        focusAt(idx + 1);
      }
    });

    // Tizen remote back key (optional graceful behavior)
    document.addEventListener('tizenhwkey', function (ev) {
      try {
        if (ev && ev.keyName === 'back') {
          ev.preventDefault();
          // If not index, navigate back to index.html; else attempt to exit app
          var name = (window.location.pathname || '').split('/').pop() || 'index.html';
          if (name !== 'index.html') {
            window.location.href = 'index.html';
          } else {
            try {
              if (typeof tizen !== 'undefined' && tizen.application) {
                tizen.application.getCurrentApplication().exit();
              } else {
                window.location.href = 'about:blank';
              }
            } catch (e) {
              window.location.href = 'about:blank';
            }
          }
        }
      } catch (e) { /* ignore */ }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSimpleFocusNavigation);
  } else {
    initSimpleFocusNavigation();
  }

  // PUBLIC_INTERFACE
  /**
   * This app is designed to be served as a static site. No external dependencies are required.
   * Pages: index.html (root), login.html, signup.html share this JS and style.css.
   */
})();
