(function () {
  'use strict';

  // Utility helpers
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function tryFocus(el) {
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (_) { } }
    try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { }
  }
  function pageName() {
    var n = (window.location.pathname || '').split('/').pop() || 'index.html';
    return n.toLowerCase();
  }
  function isIndexPage() { return pageName() === 'index.html'; }
  function isHomePage() { return pageName() === 'home.html'; }
  function isLoginPage() { return pageName() === 'login.html'; }
  function isMyPlanPage() { return pageName() === 'myplan.html' || pageName() === 'my-plan.html'; }
  function isVideoDetailPage() { return pageName() === 'video-detail.html'; }

  var Keys = {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    ENTER: 'Enter',
    SPACE: ' ',
    BACK: 'Backspace',
    HOME: 'Home',
    PLAY: 'MediaPlay',
    PAUSE: 'MediaPause',
    PLAY_PAUSE: 'MediaPlayPause',
    STOP: 'MediaStop',
    FAST_FORWARD: 'MediaFastForward',
    REWIND: 'MediaRewind'
  };

  var lastKeyTime = 0;
  function debounceKey(interval) {
    var now = Date.now();
    if (now - lastKeyTime < interval) return true;
    lastKeyTime = now;
    return false;
  }

  // PUBLIC_INTERFACE
  /**
   * FocusManager centralizes focusable collection and movement using [data-focus]
   */
  var FocusManager = (function () {
    function sortByIndex(nodes) {
      return nodes.sort(function (a, b) {
        var ai = parseInt(a.getAttribute('data-focus-index') || '0', 10);
        var bi = parseInt(b.getAttribute('data-focus-index') || '0', 10);
        if (isNaN(ai)) ai = 0;
        if (isNaN(bi)) bi = 0;
        if (ai !== bi) return ai - bi;
        // fallback to DOM order
        var pos = a.compareDocumentPosition(b);
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
        if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        return 0;
      });
    }

    function FocusManager() {
      this.container = null;
      this.items = [];
      this.currentIndex = 0;
    }

    // PUBLIC_INTERFACE
    FocusManager.prototype.init = function (containerEl) {
      /** Initializes FocusManager with a container. Focus is trapped within this visible container. */
      this.container = containerEl || document.body;
      var nodes = qsa('[data-focus="true"]', this.container);
      nodes.forEach(function (el, i) {
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
        // ensure ARIA role for buttons/anchors
        if (el.tagName === 'A' && !el.getAttribute('role')) el.setAttribute('role', 'button');
      });
      this.items = sortByIndex(nodes);
      // annotate internal order for resilience
      this.items.forEach(function (el, i) { el.setAttribute('data-focus-order', String(i)); });
    };

    // PUBLIC_INTERFACE
    FocusManager.prototype.focusFirst = function () {
      /** Focus the first focusable element */
      if (!this.items.length) return;
      this.currentIndex = 0;
      tryFocus(this.items[0]);
    };

    // PUBLIC_INTERFACE
    FocusManager.prototype.focusByIndex = function (i) {
      /** Focus by index with wrap-around */
      if (!this.items.length) return;
      var len = this.items.length;
      var idx = ((i % len) + len) % len;
      this.currentIndex = idx;
      tryFocus(this.items[idx]);
    };

    // PUBLIC_INTERFACE
    FocusManager.prototype.move = function (delta) {
      /** Move focus linearly by delta with wrap-around */
      if (!this.items.length) return;
      var active = document.activeElement;
      var idx = this.items.indexOf(active);
      if (idx < 0) idx = this.currentIndex;
      this.focusByIndex(idx + delta);
    };

    // PUBLIC_INTERFACE
    FocusManager.prototype.moveGrid = function (dir) {
      /** Optional grid movement; for now fallback to linear */
      if (dir === 'left') this.move(-1);
      else if (dir === 'right') this.move(1);
      else if (dir === 'up') this.move(-1);
      else if (dir === 'down') this.move(1);
    };

    // PUBLIC_INTERFACE
    FocusManager.prototype.handleKeydown = function (e) {
      /** Handle keydown for DPAD/Enter/Back within the current container */
      var key = e.key || '';
      var op = null;
      if (key === Keys.LEFT) op = 'LEFT';
      else if (key === Keys.RIGHT) op = 'RIGHT';
      else if (key === Keys.UP) op = 'UP';
      else if (key === Keys.DOWN) op = 'DOWN';
      else if (key === Keys.ENTER || key === 'Spacebar' || key === Keys.SPACE) op = 'ENTER';
      else if (key === Keys.HOME) op = 'HOME';
      else if (key === 'Escape' || key === 'BrowserBack' || key === 'GoBack' || key === Keys.BACK) op = 'BACK';
      else if (key === Keys.PLAY || key === Keys.PAUSE || key === Keys.PLAY_PAUSE || key === Keys.STOP || key === Keys.FAST_FORWARD || key === Keys.REWIND) op = 'MEDIA';

      if (!op) return false;

      e.preventDefault();
      if (debounceKey(40)) { /* allow some repeat */ }

      if (op === 'LEFT') { this.moveGrid('left'); return true; }
      if (op === 'RIGHT') { this.moveGrid('right'); return true; }
      if (op === 'UP') { this.moveGrid('up'); return true; }
      if (op === 'DOWN') { this.moveGrid('down'); return true; }
      if (op === 'ENTER') {
        var a = document.activeElement;
        if (a && typeof a.click === 'function') { a.click(); return true; }
        var href = a && a.getAttribute && a.getAttribute('href');
        if (href) { window.location.href = href; return true; }
        return true;
      }
      if (op === 'BACK') {
        handleBackNavigation();
        return true;
      }
      // MEDIA/HOME no-op by default
      return false;
    };

    return FocusManager;
  })();

  // Focus memory per page for restoration
  var FocusMemory = {
    lastByPage: {},
    save: function () {
      var name = pageName();
      this.lastByPage[name] = document.activeElement || null;
    },
    restoreOr: function (fallbackEl) {
      var name = pageName();
      var el = this.lastByPage[name];
      if (el && document.body.contains(el)) {
        tryFocus(el);
      } else {
        tryFocus(fallbackEl);
      }
    }
  };

  // PUBLIC_INTERFACE
  /**
   * Handle back navigation based on current page in the flow
   */
  function handleBackNavigation() {
    if (isVideoDetailPage()) {
      window.location.href = 'home.html';
    } else if (isHomePage()) {
      window.location.href = 'index.html';
    } else if (isLoginPage() || isMyPlanPage()) {
      window.location.href = 'home.html';
    } else {
      window.location.href = 'home.html';
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Install global dispatcher that delegates to FocusManager when a focus container is present
   */
  function installGlobalKeyDispatcher(activeManager) {
    document.addEventListener('tizenhwkey', function (ev) {
      try {
        if (ev && ev.keyName === 'back') {
          ev.preventDefault();
          handleBackNavigation();
        }
      } catch (e) { }
    });

    document.addEventListener('keydown', function (e) {
      var key = e.key || '';
      if (key === 'Tab') {
        // Trap focus: prevent tabbing to browser chrome
        e.preventDefault();
        // Use manager to move focus forward/backward
        if (e.shiftKey && activeManager) { activeManager.move(-1); }
        else if (activeManager) { activeManager.move(1); }
        return;
      }
      if (activeManager) {
        var handled = activeManager.handleKeydown(e);
        if (handled) return;
      }
      // Fallback Enter/Back if not handled
      if (key === 'Enter' || key === ' ') {
        e.preventDefault();
        var a = document.activeElement;
        if (a && typeof a.click === 'function') a.click();
      } else if (key === 'Escape' || key === 'Backspace' || key === 'GoBack' || key === 'BrowserBack') {
        e.preventDefault();
        handleBackNavigation();
      }
    }, true);
  }

  // Page bootstrap using FocusManager
  function boot() {
    var container = qs('[data-focus-container="true"]') || document.body;
    var fm = new FocusManager();
    fm.init(container);

    // Initial focus strategy per page
    if (isIndexPage()) {
      // Splash has no focusable buttons now; don't force focus. Let auto-navigation proceed.
      var first = qs('[data-focus="true"][data-focus-index="0"]', container) || fm.items[0] || null;
      if (first) { tryFocus(first); }
    } else if (isHomePage()) {
      // Try restore or first menu item
      var menuFirst = qs('.top-menu .menu-item');
      FocusMemory.restoreOr(menuFirst || fm.items[0]);
    } else if (isLoginPage() || isMyPlanPage() || isVideoDetailPage()) {
      FocusMemory.restoreOr(fm.items[0] || null);
    } else {
      if (fm.items[0]) tryFocus(fm.items[0]);
    }

    installGlobalKeyDispatcher(fm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // PUBLIC_INTERFACE
  /**
   * Static TV app with centralized FocusManager for DPAD and accessibility.
   */
})();
