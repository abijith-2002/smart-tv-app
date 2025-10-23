(function () {
  'use strict';

  // Utility helpers
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
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
  function isVideoDetailPage() { return pageName() === 'video-detail.html'; }
  function isLoginPage() { return pageName() === 'login.html'; }
  function isMyPlanPage() { return pageName() === 'myplan.html' || pageName() === 'my-plan.html'; }

  // Tizen key code map and safe access
  var TIZEN = (function () {
    try { return window.tizen || null; } catch (e) { return null; }
  })();
  
  // Key constants for Samsung TV remotes
  var Keys = {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    ENTER: 'Enter',
    SPACE: ' ',
    BACK: 'Backspace', // desktop fallback
    // Media keys (no-op)
    PLAY: 'MediaPlay',
    PAUSE: 'MediaPause',
    PLAY_PAUSE: 'MediaPlayPause',
    STOP: 'MediaStop',
    FAST_FORWARD: 'MediaFastForward',
    REWIND: 'MediaRewind',
    HOME: 'Home'
  };

  // Debounce to prevent key repeat overload on TVs
  var lastKeyTime = 0;
  function debounceKey(interval) {
    var now = Date.now();
    if (now - lastKeyTime < interval) return true;
    lastKeyTime = now;
    return false;
  }

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
   * Global key dispatcher for TV and desktop. Handles DPAD, Enter/Space, Return, media keys noop.
   * Pages register their own handlers; we stop propagation when handled.
   */
  function installGlobalKeyDispatcher(handler) {
    // Tizen hw back
    document.addEventListener('tizenhwkey', function (ev) {
      try {
        if (ev && ev.keyName === 'back') {
          ev.preventDefault();
          if (handler && handler({ type: 'BACK' })) return;
          // default fallback: navigate based on current page
          handleBackNavigation();
        }
      } catch (e) { }
    });

    document.addEventListener('keydown', function (e) {
      var key = e.key || '';
      // prevent heavy repeats
      if (debounceKey(40)) { /* allow some repeats while still responsive */ }

      // normalize operation
      var op = null;
      if (key === Keys.LEFT) op = 'LEFT';
      else if (key === Keys.RIGHT) op = 'RIGHT';
      else if (key === Keys.UP) op = 'UP';
      else if (key === Keys.DOWN) op = 'DOWN';
      else if (key === Keys.ENTER || key === 'Spacebar' || key === Keys.SPACE) op = 'ENTER';
      else if (key === Keys.HOME) op = 'HOME';
      else if (key === Keys.PLAY || key === Keys.PAUSE || key === Keys.PLAY_PAUSE || key === Keys.STOP || key === Keys.FAST_FORWARD || key === Keys.REWIND) op = 'MEDIA';
      else if (key === 'Escape' || key === 'BrowserBack' || key === 'GoBack' || key === Keys.BACK) op = 'BACK';
      else if (/^[0-9]$/.test(key)) op = 'NUM'; // ignore numeric unless focused element handles it

      if (!op) return; // ignore other keys

      // prevent default navigation/scroll
      e.preventDefault();

      if (op === 'MEDIA' || op === 'HOME' || op === 'NUM') {
        // No-op by default
        return;
      }

      if (handler) {
        var handled = handler({ type: op, event: e, active: document.activeElement });
        if (handled) return;
      }

      // If not handled:
      if (op === 'BACK') {
        handleBackNavigation();
      } else if (op === 'ENTER') {
        var a = document.activeElement;
        if (!a) return;
        if (typeof a.click === 'function') a.click();
        else {
          var href = a.getAttribute && a.getAttribute('href');
          if (href) window.location.href = href;
        }
      }
    }, true);
  }

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
      // Default to home
      window.location.href = 'home.html';
    }
  }

  function activate(el) {
    if (!el) return;
    if (typeof el.click === 'function') { el.click(); return; }
    var href = el.getAttribute && el.getAttribute('href');
    if (href) window.location.href = href;
  }

  // PUBLIC_INTERFACE
  /**
   * Initialize Video Detail page: panel buttons navigation and back to home
   */
  function initVideoDetail() {
    var panelButtons = qsa('.button[data-action]');
    var topMenuItems = qsa('.top-menu .menu-item');
    var backBtn = qs('.back-btn');
    
    // Make all panel buttons focusable
    panelButtons.forEach(function (btn, idx) {
      if (!btn.hasAttribute('tabindex')) btn.setAttribute('tabindex', '0');
      btn.setAttribute('data-idx', String(idx));
    });

    // Set initial focus to first panel button
    var initialFocus = panelButtons[0] || backBtn || topMenuItems[0];
    tryFocus(initialFocus);

    // Handle button actions
    panelButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.getAttribute('data-action');
        switch (action) {
          case 'play':
            // Navigate to video player or show placeholder
            window.location.href = 'video.html';
            break;
          case 'schedule':
            alert('Scheduled for later viewing');
            break;
          case 'info':
            alert('More information about this content');
            break;
          case 'favorite':
            alert('Added to favorites');
            break;
          case 'share':
            alert('Share functionality');
            break;
          case 'options':
            alert('Additional options');
            break;
        }
      });
    });

    installGlobalKeyDispatcher(function (inp) {
      var a = inp.active || document.activeElement;
      if (!a) return false;

      FocusMemory.save();

      if (inp.type === 'ENTER') {
        activate(a);
        return true;
      }

      // Panel buttons navigation
      if (panelButtons.indexOf(a) !== -1) {
        var currentIdx = parseInt(a.getAttribute('data-idx') || '0');
        if (inp.type === 'LEFT' && currentIdx > 0) {
          tryFocus(panelButtons[currentIdx - 1]);
          return true;
        } else if (inp.type === 'RIGHT' && currentIdx < panelButtons.length - 1) {
          tryFocus(panelButtons[currentIdx + 1]);
          return true;
        } else if (inp.type === 'UP') {
          tryFocus(backBtn || topMenuItems[0]);
          return true;
        }
      }

      // Top menu navigation
      if (topMenuItems.indexOf(a) !== -1) {
        var menuIdx = topMenuItems.indexOf(a);
        if (inp.type === 'LEFT' && menuIdx > 0) {
          tryFocus(topMenuItems[menuIdx - 1]);
          return true;
        } else if (inp.type === 'RIGHT' && menuIdx < topMenuItems.length - 1) {
          tryFocus(topMenuItems[menuIdx + 1]);
          return true;
        } else if (inp.type === 'DOWN') {
          tryFocus(panelButtons[0]);
          return true;
        }
      }

      // Back button
      if (a === backBtn) {
        if (inp.type === 'LEFT') {
          tryFocus(topMenuItems[topMenuItems.length - 1]);
          return true;
        } else if (inp.type === 'DOWN') {
          tryFocus(panelButtons[0]);
          return true;
        }
      }

      if (inp.type === 'BACK') {
        window.location.href = 'home.html';
        return true;
      }

      return false;
    });
  }

  // Page-specific initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (isVideoDetailPage()) {
        initVideoDetail();
      } else {
        // For other pages, just install basic dispatcher for back navigation
        installGlobalKeyDispatcher(function () { return false; });
      }
    });
  } else {
    if (isVideoDetailPage()) {
      initVideoDetail();
    } else {
      installGlobalKeyDispatcher(function () { return false; });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Multi-screen TV app with remote navigation support and Figma integration.
   */
})();
