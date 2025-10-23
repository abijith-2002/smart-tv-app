(function () {
  'use strict';

  // Utility helpers
  function qs(sel, ctx){ return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx){ return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
  function tryFocus(el){
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch(e){ try { el.focus(); } catch(_){} }
    try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch(e){}
  }
  function pageName(){
    var n = (window.location.pathname || '').split('/').pop() || 'index.html';
    return n.toLowerCase();
  }
  function isIndexPage(){ return pageName() === 'index.html'; }
  function isHomePage(){ return pageName() === 'home.html'; }
  function isLoginPage(){ return pageName() === 'login.html'; }
  function isMyPlanPage(){ return pageName() === 'myplan.html' || pageName() === 'my-plan.html'; }
  function isVideoDetailPage(){ return pageName() === 'video-detail.html'; }

  // Tizen key code map and safe access
  var TIZEN = (function(){
    try { return window.tizen || null; } catch(e){ return null; }
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
  function debounceKey(interval){
    var now = Date.now();
    if (now - lastKeyTime < interval) return true;
    lastKeyTime = now;
    return false;
  }

  // Focus memory per page for restoration
  var FocusMemory = {
    lastByPage: {},
    save: function(){
      var name = pageName();
      this.lastByPage[name] = document.activeElement || null;
    },
    restoreOr: function(fallbackEl){
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
  function installGlobalKeyDispatcher(handler){
    // Tizen hw back
    document.addEventListener('tizenhwkey', function (ev) {
      try {
        if (ev && ev.keyName === 'back') {
          ev.preventDefault();
          if (handler && handler({ type:'BACK' })) return;
          // default fallback: navigate in the flow
          if (isVideoDetailPage()) window.location.href = 'home.html';
          else if (isHomePage()) window.location.href = 'index.html';
          else window.location.href = 'home.html';
        }
      } catch (e) {}
    });

    document.addEventListener('keydown', function(e){
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

      if (handler){
        var handled = handler({ type: op, event: e, active: document.activeElement });
        if (handled) return;
      }

      // If not handled:
      if (op === 'BACK'){
        if (isVideoDetailPage()) window.location.href = 'home.html';
        else if (isHomePage()) window.location.href = 'index.html';
        else window.location.href = 'home.html';
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

  function activate(el){
    if (!el) return;
    if (typeof el.click === 'function') { el.click(); return; }
    var href = el.getAttribute && el.getAttribute('href');
    if (href) window.location.href = href;
  }

  // PUBLIC_INTERFACE
  /**
   * Initialize Splash page: 5s timer with CSS fade-out, Back/Escape to cancel navigation.
   */
  function initSplash(){
    var navigationCancelled = false;
    var navigationTimeout;
    
    var skipToHome = function(){
      if (!navigationCancelled) {
        // add fade-out class and navigate after short delay
        var body = document.body;
        if (body) body.classList.add('fade-out');
        setTimeout(function(){ window.location.href = 'home.html'; }, 450);
      }
    };
    
    var cancelNavigation = function(){
      navigationCancelled = true;
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
      }
    };
    
    // auto timer - 5 seconds instead of 3
    navigationTimeout = setTimeout(skipToHome, 5000);
    
    // key handling: Back/Escape cancels navigation, Enter still works for Login button
    installGlobalKeyDispatcher(function(inp){
      if (inp.type === 'BACK'){
        cancelNavigation();
        return true; // handled - don't exit app
      }
      if (inp.type === 'ENTER'){
        // Let the inline script handle Enter for Login button
        return false;
      }
      return false;
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Initialize Home navigation with menu and rails, wrapping, row/column movement,
   * focus restore, and Enter activation. Up/Down switches between menu and rails,
   * Left/Right moves within rail; at ends, Up/Down jumps rails, and wrapping within menu/rails.
   */
  function initHome(){
    var menuItems = qsa('.top-menu .menu-item');
    var rails = qsa('.rail-row, .plans'); // include plan row
    var railIndices = new Array(rails.length);
    for (var i=0;i<railIndices.length;i++) railIndices[i] = 0;

    // Determine initial focus: restore or first menu
    var initial = menuItems[0] || null;
    FocusMemory.restoreOr(initial);

    function focusMenu(idx){
      if (!menuItems.length) return;
      var i = ((idx % menuItems.length) + menuItems.length) % menuItems.length; // wrap
      tryFocus(menuItems[i]);
    }
    function focusRailItem(rIdx, itemIdx){
      var row = rails[rIdx];
      if (!row) return;
      var items = qsa('.card, .plan-card', row);
      if (!items.length) return;
      var i = ((itemIdx % items.length) + items.length) % items.length; // wrap
      railIndices[rIdx] = i;
      try {
        // keep rail visible without CSS scroll-margin shorthand
        items[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
      } catch(e){}
      tryFocus(items[i]);
    }
    function findRailIndexForEl(el){
      for (var j=0;j<rails.length;j++){ if (rails[j].contains(el)) return j; }
      return -1;
    }
    function inMenu(el){ return menuItems.indexOf(el) !== -1; }

    installGlobalKeyDispatcher(function(inp){
      var a = inp.active || document.activeElement;
      if (!a) return false;

      // Persist last focused
      FocusMemory.save();

      if (inp.type === 'ENTER'){
        activate(a);
        return true;
      }

      // Determine context
      var currentInMenu = inMenu(a);
      var currentRail = findRailIndexForEl(a);

      if (inp.type === 'UP'){
        if (currentInMenu){
          // stay in menu; wrap leftmost -> last
          var mIdxUp = menuItems.indexOf(a);
          focusMenu(mIdxUp - 1);
          return true;
        } else if (currentRail >= 0){
          if (currentRail === 0){
            // move to menu and try keep approximate index
            focusMenu(0);
          } else {
            // move to previous rail and try align by item index
            var prev = currentRail - 1;
            focusRailItem(prev, railIndices[prev] || 0);
          }
          return true;
        }
      }

      if (inp.type === 'DOWN'){
        if (currentInMenu){
          // go to first rail, keep last index used for that rail
          var target = 0;
          focusRailItem(target, railIndices[target] || 0);
          return true;
        } else if (currentRail >= 0){
          var next = currentRail + 1;
          if (next < rails.length){
            focusRailItem(next, railIndices[next] || 0);
          } else {
            // at last rail, stay
            focusRailItem(currentRail, railIndices[currentRail] || 0);
          }
          return true;
        }
      }

      if (inp.type === 'LEFT'){
        if (currentInMenu){
          var mIdxL = menuItems.indexOf(a);
          focusMenu(mIdxL - 1); // wraps via focusMenu
          return true;
        } else if (currentRail >= 0){
          var row = rails[currentRail];
          var items = qsa('.card, .plan-card', row);
          var idx = items.indexOf(a);
          focusRailItem(currentRail, idx - 1); // wraps inside function
          return true;
        }
      }

      if (inp.type === 'RIGHT'){
        if (currentInMenu){
          var mIdxR = menuItems.indexOf(a);
          focusMenu(mIdxR + 1);
          return true;
        } else if (currentRail >= 0){
          var row2 = rails[currentRail];
          var items2 = qsa('.card, .plan-card', row2);
          var idx2 = items2.indexOf(a);
          focusRailItem(currentRail, idx2 + 1);
          return true;
        }
      }

      if (inp.type === 'BACK'){
        // From home to splash
        window.location.href = 'index.html';
        return true;
      }

      return false;
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Initialize Login page: menu focus, form inputs/buttons TV friendly, return to home.
   */
  function initLogin(){
    var menuItems = qsa('.top-menu .menu-item');
    var focusables = qsa('.auth-input, .auth-submit, .secondary-link').concat(menuItems);
    // annotate indices for simple linear navigation
    focusables.forEach(function(el, i){ if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0'); el.setAttribute('data-idx', String(i)); });

    FocusMemory.restoreOr(menuItems[1] || focusables[0] || null);

    installGlobalKeyDispatcher(function(inp){
      var a = document.activeElement;
      FocusMemory.save();

      if (inp.type === 'ENTER'){
        if (a && a.tagName === 'INPUT') return true; // let form handle
        activate(a);
        return true;
      }
      // simple linear navigation across focusables with wrapping
      function getIdx(el){ var v = parseInt(el && el.getAttribute('data-idx') || '-1', 10); return isNaN(v) ? -1 : v; }
      function focusAt(index){
        if (!focusables.length) return;
        var i = ((index % focusables.length) + focusables.length) % focusables.length;
        tryFocus(focusables[i]);
      }
      var idx = getIdx(a);
      if (idx < 0) { focusAt(0); return true; }

      if (inp.type === 'LEFT' || inp.type === 'UP'){ focusAt(idx - 1); return true; }
      if (inp.type === 'RIGHT' || inp.type === 'DOWN'){ focusAt(idx + 1); return true; }

      if (inp.type === 'BACK'){
        window.location.href = 'home.html';
        return true;
      }
      return false;
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Initialize My Plan page: menu and back navigation with focus restore.
   */
  function initMyPlan(){
    var menuItems = qsa('.top-menu .menu-item');
    var focusables = qsa('.primary-btn, .page-link, .menu-item');
    focusables.forEach(function(el, i){ if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0'); el.setAttribute('data-idx', String(i)); });

    // try to focus "My Plan" menu or first focusable
    var activeMenu = null;
    for (var m=0;m<menuItems.length;m++){ if (menuItems[m].textContent && /plan/i.test(menuItems[m].textContent)) { activeMenu = menuItems[m]; break; } }
    FocusMemory.restoreOr(activeMenu || focusables[0] || null);

    installGlobalKeyDispatcher(function(inp){
      var a = document.activeElement;
      FocusMemory.save();

      if (inp.type === 'ENTER'){ activate(a); return true; }
      if (inp.type === 'BACK'){ window.location.href = 'home.html'; return true; }

      function getIdx(el){ var v = parseInt(el && el.getAttribute('data-idx') || '-1', 10); return isNaN(v) ? -1 : v; }
      function focusAt(index){
        if (!focusables.length) return;
        var i = ((index % focusables.length) + focusables.length) % focusables.length;
        tryFocus(focusables[i]);
      }
      var idx = getIdx(a);
      if (idx < 0) { focusAt(0); return true; }
      if (inp.type === 'LEFT' || inp.type === 'UP'){ focusAt(idx - 1); return true; }
      if (inp.type === 'RIGHT' || inp.type === 'DOWN'){ focusAt(idx + 1); return true; }
      return false;
    });
  }

  // Bootstrapping per page
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){
      if (isIndexPage()) initSplash();
      else if (isHomePage()) initHome();
      else if (isLoginPage()) initLogin();
      else if (isMyPlanPage()) initMyPlan();
      else {
        // default: simple dispatcher for pages without custom logic
        installGlobalKeyDispatcher(function(){ return false; });
      }
    });
  } else {
    if (isIndexPage()) initSplash();
    else if (isHomePage()) initHome();
    else if (isLoginPage()) initLogin();
    else if (isMyPlanPage()) initMyPlan();
    else {
      installGlobalKeyDispatcher(function(){ return false; });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Static TV app with Tizen/desktop remote support and focus management.
   */
})();
