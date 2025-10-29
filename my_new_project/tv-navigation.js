(function () {
  'use strict';

  // PUBLIC_INTERFACE
  /**
   * FocusManager centralizes focusable collection and movement using [data-focusable]
   * Handles Arrow keys, Enter/Space to click, and Back/Escape including Tizen back key.
   */
  var TVNavigation = (function () {
    var Keys = {
      LEFT: 'ArrowLeft',
      RIGHT: 'ArrowRight',
      UP: 'ArrowUp',
      DOWN: 'ArrowDown',
      ENTER: 'Enter',
      SPACE: ' ',
      BACK: 'Backspace'
    };

    var lastKeyTime = 0;
    function debounceKey(interval) {
      var now = Date.now();
      if (now - lastKeyTime < interval) return true;
      lastKeyTime = now;
      return false;
    }

    function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
    function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
    function tryFocus(el) {
      if (!el) return;
      try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (_) {} }
      try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) {}
    }

    function pageName() {
      var n = (window.location.pathname || '').split('/').pop() || 'index.html';
      return n.toLowerCase();
    }
    function isIndexPage() { return pageName() === 'index.html'; }
    function isHomePage() { return pageName() === 'home.html'; }
    function isLoginPage() { return pageName() === 'login.html'; }
    function isMyPlanPage() { return pageName() === 'myplan.html' || pageName() === 'my-plan.html'; }

    function handleBackNavigation() {
      if (isHomePage()) {
        window.location.href = 'index.html';
      } else if (isLoginPage() || isMyPlanPage()) {
        window.location.href = 'home.html';
      } else {
        // Default: go back if possible, else home
        if (window.history.length > 1) window.history.back();
        else window.location.href = 'home.html';
      }
    }

    function FocusManager() {
      this.container = null;
      this.items = [];
      this.currentIndex = 0;
    }

    // PUBLIC_INTERFACE
    FocusManager.prototype.init = function (containerEl) {
      /** Initializes FocusManager with a container. Focus is within container. */
      this.container = containerEl || document.body;
      // Collect all interactive elements marked with data-focusable="true"
      var nodes = qsa('[data-focusable="true"]', this.container);

      nodes.forEach(function (el) {
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
        // Provide role if anchor used like a button
        if (el.tagName === 'A' && !el.getAttribute('role')) el.setAttribute('role', 'button');
      });

      // Sort by data-focus-index if provided, else DOM order
      nodes.sort(function (a, b) {
        var ai = parseInt(a.getAttribute('data-focus-index') || '0', 10);
        var bi = parseInt(b.getAttribute('data-focus-index') || '0', 10);
        ai = isNaN(ai) ? 0 : ai;
        bi = isNaN(bi) ? 0 : bi;
        if (ai !== bi) return ai - bi;
        var pos = a.compareDocumentPosition(b);
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
        if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        return 0;
      });

      this.items = nodes;
      var self = this;

      // Add keydown trap on container to handle DPAD
      this._onKeydown = function (e) {
        var key = e.key || '';
        var op = null;
        if (key === Keys.LEFT) op = 'LEFT';
        else if (key === Keys.RIGHT) op = 'RIGHT';
        else if (key === Keys.UP) op = 'UP';
        else if (key === Keys.DOWN) op = 'DOWN';
        else if (key === Keys.ENTER || key === 'Spacebar' || key === Keys.SPACE) op = 'ENTER';
        else if (key === 'Escape' || key === 'BrowserBack' || key === 'GoBack' || key === Keys.BACK) op = 'BACK';

        if (!op) return;

        // Prevent default page scroll/tab behavior
        e.preventDefault();
        if (debounceKey(40)) { /* allow some repeat but throttle */ }

        if (op === 'LEFT') { self.move(-1); return; }
        if (op === 'RIGHT') { self.move(1); return; }
        if (op === 'UP') { self.move(-1); return; }
        if (op === 'DOWN') { self.move(1); return; }

        if (op === 'ENTER') {
          var a = document.activeElement;
          if (a && typeof a.click === 'function') a.click();
          else {
            var href = a && a.getAttribute && a.getAttribute('href');
            if (href) window.location.href = href;
          }
          return;
        }
        if (op === 'BACK') {
          handleBackNavigation();
          return;
        }
      };

      this.container.addEventListener('keydown', this._onKeydown, true);

      // Tizen hardware back
      document.addEventListener('tizenhwkey', function (ev) {
        try {
          if (ev && ev.keyName === 'back') {
            ev.preventDefault();
            handleBackNavigation();
          }
        } catch (e) {}
      });
    };

    // PUBLIC_INTERFACE
    FocusManager.prototype.destroy = function () {
      if (this.container && this._onKeydown) {
        this.container.removeEventListener('keydown', this._onKeydown, true);
      }
    };

    // PUBLIC_INTERFACE
    FocusManager.prototype.focusFirst = function () {
      if (!this.items.length) return;
      this.currentIndex = 0;
      tryFocus(this.items[0]);
    };

    // PUBLIC_INTERFACE
    FocusManager.prototype.focusByIndex = function (i) {
      if (!this.items.length) return;
      var len = this.items.length;
      var idx = ((i % len) + len) % len;
      this.currentIndex = idx;
      tryFocus(this.items[idx]);
    };

    // PUBLIC_INTERFACE
    FocusManager.prototype.move = function (delta) {
      if (!this.items.length) return;
      var active = document.activeElement;
      var idx = this.items.indexOf(active);
      if (idx < 0) idx = this.currentIndex;
      this.focusByIndex(idx + delta);
    };

    // PUBLIC_INTERFACE
    /**
     * Initialize for current page: sets initial focus to the first primary action where possible.
     * It expects container element with data-focus-container="true" (fallback to body).
     */
    function init() {
      var container = qs('[data-focus-container="true"]') || document.body;
      var fm = new FocusManager();
      fm.init(container);

      // Initial focus strategy: prioritize elements with data-primary="true" then data-focus-index="0"
      var initial =
        qs('[data-focusable="true"][data-primary="true"]', container) ||
        qs('[data-focusable="true"][data-focus-index="0"]', container) ||
        (fm.items && fm.items[0]) ||
        null;

      if (initial) {
        tryFocus(initial);
      } else {
        fm.focusFirst();
      }

      // Trap Tab to ensure TV feel in browser
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') {
          e.preventDefault();
          if (e.shiftKey) fm.move(-1);
          else fm.move(1);
        }
      }, true);

      // Expose instance for debugging
      window.__TVFocusManager = fm;
    }

    return {
      FocusManager: FocusManager,
      init: init
    };
  })();

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', TVNavigation.init);
  } else {
    TVNavigation.init();
  }

  // Expose globally
  window.TVNavigation = TVNavigation;
})();
