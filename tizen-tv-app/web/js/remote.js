(function () {
  'use strict';

  // PUBLIC_INTERFACE
  /**
   * initRemoteNavigation
   * Set up Samsung Tizen TV remote key handling for focusable elements.
   *
   * - Recognizes Arrow keys, Enter/OK, and Return/Back via event.key or keyCode.
   * - Focusable elements must have [data-focusable].
   * - Maintains a simple linear focus order; supports row/col layout if data-grid attributes provided.
   * - Adds/removes a focus ring and aria-selected on the focused element.
   * - Enter triggers click on the focused element.
   * - Back attempts history.back() if possible; otherwise no-op (documented below).
   *
   * PUBLIC_INTERFACE
   * @param {Object} [options]
   * @param {Element|Document} [options.scope=document] - Scope to search for focusables.
   * @param {function(string, HTMLElement): boolean} [options.onNavigate] - Optional callback on navigation events ('UP','DOWN','LEFT','RIGHT','ENTER','BACK'). Return true to stop default.
   * @param {HTMLElement} [options.initialFocus] - Element to focus initially. Defaults to first [data-focusable].
   * @returns {{destroy: function, focusNext: function, focusPrev: function, getFocused: function}}
   */
  function initRemoteNavigation(options) {
    options = options || {};
    var scope = options.scope || document;

    // Key codes for Tizen 9.0 Samsung TV remotes and browser fallback
    var KEYCODES = {
      LEFT: 37,   // ArrowLeft
      UP: 38,     // ArrowUp
      RIGHT: 39,  // ArrowRight
      DOWN: 40,   // ArrowDown
      ENTER: 13,  // Enter/OK
      RETURN: 10009 // Tizen RETURN/BACK key
    };

    // Util: get all focusables within scope
    function getFocusables() {
      return Array.prototype.slice.call(scope.querySelectorAll('[data-focusable]'));
    }

    // Util: try focusing an element and apply focus styles
    function tryFocus(el) {
      if (!el || !scope.contains(el)) return;
      // Clear previous focus state
      getFocusables().forEach(function (n) {
        n.classList.remove('is-focused');
        n.removeAttribute('aria-selected');
      });
      try {
        el.focus({ preventScroll: true });
      } catch (e) {
        try { el.focus(); } catch (_) {}
      }
      // Add visual and aria states
      el.classList.add('is-focused');
      el.setAttribute('aria-selected', 'true');
      // Ensure visibility
      try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) {}
    }

    // Util: get currently focused focusable (by class or activeElement)
    function getFocused() {
      var current = scope.querySelector('[data-focusable].is-focused');
      if (current) return current;
      var ae = document.activeElement;
      if (ae && ae.hasAttribute && ae.hasAttribute('data-focusable')) return ae;
      return null;
    }

    // Simple linear focus helpers
    function focusNext() {
      var items = getFocusables();
      if (!items.length) return;
      var current = getFocused();
      var idx = current ? items.indexOf(current) : -1;
      var next = items[(idx + 1 + items.length) % items.length];
      tryFocus(next);
    }

    function focusPrev() {
      var items = getFocusables();
      if (!items.length) return;
      var current = getFocused();
      var idx = current ? items.indexOf(current) : 0;
      var prev = items[(idx - 1 + items.length) % items.length];
      tryFocus(prev);
    }

    // Optional 2D navigation if coordinates are declared on elements
    // data-col and data-row can guide LEFT/RIGHT/UP/DOWN moves within a simple grid
    function navigateDpad(dir) {
      var items = getFocusables();
      if (!items.length) return false;
      var current = getFocused();
      if (!current) { tryFocus(items[0]); return true; }

      var curRow = parseInt(current.getAttribute('data-row') || '0', 10);
      var curCol = parseInt(current.getAttribute('data-col') || '0', 10);
      var haveGrid = items.some(function (n) { return n.hasAttribute('data-row') || n.hasAttribute('data-col'); });

      if (!haveGrid) {
        // Fallback to simple linear order
        if (dir === 'LEFT' || dir === 'UP') focusPrev();
        else if (dir === 'RIGHT' || dir === 'DOWN') focusNext();
        return true;
      }

      // Find candidate best match by row/col
      var target = null;
      var bestScore = Infinity;

      items.forEach(function (n) {
        if (n === current) return;
        var r = parseInt(n.getAttribute('data-row') || '0', 10);
        var c = parseInt(n.getAttribute('data-col') || '0', 10);
        var dr = r - curRow;
        var dc = c - curCol;

        if (dir === 'LEFT' && dc >= 0) return;
        if (dir === 'RIGHT' && dc <= 0) return;
        if (dir === 'UP' && dr >= 0) return;
        if (dir === 'DOWN' && dr <= 0) return;

        // Score by Manhattan distance, prefer primary axis
        var primary = (dir === 'LEFT' || dir === 'RIGHT') ? Math.abs(dc) : Math.abs(dr);
        var secondary = (dir === 'LEFT' || dir === 'RIGHT') ? Math.abs(dr) : Math.abs(dc);
        var score = primary * 10 + secondary;
        if (score < bestScore) {
          bestScore = score;
          target = n;
        }
      });

      if (target) {
        tryFocus(target);
        return true;
      }

      // If no grid target, fallback to linear
      if (dir === 'LEFT' || dir === 'UP') focusPrev();
      else if (dir === 'RIGHT' || dir === 'DOWN') focusNext();
      return true;
    }

    // Normalize KeyboardEvent to an operation string
    function toOp(e) {
      var k = e.key || '';
      var code = typeof e.keyCode === 'number' ? e.keyCode : -1;

      // Prefer key, fallback to keyCode
      if (k === 'ArrowLeft' || code === KEYCODES.LEFT) return 'LEFT';
      if (k === 'ArrowUp' || code === KEYCODES.UP) return 'UP';
      if (k === 'ArrowRight' || code === KEYCODES.RIGHT) return 'RIGHT';
      if (k === 'ArrowDown' || code === KEYCODES.DOWN) return 'DOWN';
      if (k === 'Enter' || k === 'OK' || code === KEYCODES.ENTER) return 'ENTER';
      // Browser back keys
      if (k === 'Escape' || k === 'Backspace' || k === 'BrowserBack' || k === 'GoBack' || code === KEYCODES.RETURN) return 'BACK';
      return null;
    }

    // Keydown listener
    function onKeydown(e) {
      var op = toOp(e);
      if (!op) return;

      // prevent default scrolling/behavior for DPAD/Enter/Back
      e.preventDefault();

      // Allow host to intercept
      if (typeof options.onNavigate === 'function') {
        try {
          var stop = !!options.onNavigate(op, getFocused());
          if (stop) return;
        } catch (err) { /* ignore */ }
      }

      // Default operations
      if (op === 'ENTER') {
        var a = getFocused();
        if (!a) { // if nothing focused, focus first focusable
          var items = getFocusables();
          if (items.length) tryFocus(items[0]);
          return;
        }
        // Trigger click
        if (typeof a.click === 'function') a.click();
        return;
      }

      if (op === 'BACK') {
        // Back: try history.back() if possible
        if (window.history && window.history.length > 1) {
          window.history.back();
        } else {
          // No-op in web preview. On real devices you may close the app using:
          // if (window.tizen && tizen.application) tizen.application.getCurrentApplication().exit();
        }
        return;
      }

      // Directional navigation
      navigateDpad(op);
    }

    // Tizen hardware back
    function onTizenHWKey(ev) {
      try {
        if (ev && ev.keyName === 'back') {
          ev.preventDefault();
          // Delegate to generic BACK processing
          onKeydown({ key: 'Escape', keyCode: KEYCODES.RETURN, preventDefault: function () {} });
        }
      } catch (e) { /* ignore */ }
    }

    // Initial focus setup
    (function initFocus() {
      var initial = options.initialFocus;
      if (!initial) {
        var items = getFocusables();
        if (items.length) initial = items[0];
      }
      if (initial) tryFocus(initial);
    })();

    document.addEventListener('keydown', onKeydown, true);
    document.addEventListener('tizenhwkey', onTizenHWKey, true);

    // Style suggestion: Provide a baseline focus ring via CSS.
    injectDefaultStyles();

    return {
      // PUBLIC_INTERFACE
      destroy: function () {
        document.removeEventListener('keydown', onKeydown, true);
        document.removeEventListener('tizenhwkey', onTizenHWKey, true);
      },
      // PUBLIC_INTERFACE
      focusNext: focusNext,
      // PUBLIC_INTERFACE
      focusPrev: focusPrev,
      // PUBLIC_INTERFACE
      getFocused: getFocused
    };
  }

  // Inject minimal default focus styles (only once)
  var __stylesInjected = false;
  function injectDefaultStyles() {
    if (__stylesInjected) return;
    __stylesInjected = true;
    var css = '' +
      '[data-focusable]{ outline: none; border: 2px solid transparent; }' +
      '[data-focusable].is-focused, [data-focusable][aria-selected="true"]{' +
      '  box-shadow: 0 0 0 4px rgba(255,209,102,0.35);' +
      '  border-color: #ffd166;' +
      '}' +
      '';
    var style = document.createElement('style');
    style.type = 'text/css';
    style.setAttribute('data-remote-styles', 'true');
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  // Expose API globally
  window.RemoteNav = {
    // PUBLIC_INTERFACE
    initRemoteNavigation: initRemoteNavigation
  };
})();
