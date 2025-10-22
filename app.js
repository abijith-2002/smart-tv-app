(function () {
  'use strict';

  // Helpers
  function qs(sel, ctx){ return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx){ return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
  function tryFocus(el){
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch(e){ el.focus(); }
    try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch(e){}
  }
  function isHomePage(){
    var name = (window.location.pathname || '').split('/').pop() || 'index.html';
    return name.toLowerCase() === 'home.html';
  }
  function isIndexPage(){
    var name = (window.location.pathname || '').split('/').pop() || 'index.html';
    return name.toLowerCase() === 'index.html';
  }

  // PUBLIC_INTERFACE
  /**
   * Initialize TV navigation for Home page with menu and multiple rails.
   * - ArrowLeft/Right navigate within menu or within a rail.
   * - ArrowUp/Down move between menu and rails.
   * - Enter/Space activates focused item.
   * - Initial focus: first menu item on load.
   */
  function initHomeNavigation(){
    var menuItems = qsa('.top-menu .menu-item');
    var rails = qsa('.rail-row, .plans'); // include subscriptions plans row
    var currentSection = 'menu'; // 'menu' or rail index number
    var currentRail = 0;
    var railIndices = []; // per-rail item index

    // prepare rail indices
    for (var r = 0; r < rails.length; r++){
      railIndices[r] = 0;
    }

    // initial focus: first menu item
    if (menuItems.length) { tryFocus(menuItems[0]); }

    function activate(el){
      if (!el) return;
      if (typeof el.click === 'function') { el.click(); return; }
      var href = el.getAttribute && el.getAttribute('href');
      if (href) { window.location.href = href; }
    }

    function focusMenu(idx){
      if (!menuItems.length) return;
      var i = clamp(idx, 0, menuItems.length - 1);
      tryFocus(menuItems[i]);
    }

    function focusRailItem(railIdx, itemIdx){
      var row = rails[railIdx];
      if (!row) return;
      var items = qsa('.card, .plan-card', row);
      if (!items.length) return;
      var i = clamp(itemIdx, 0, items.length - 1);
      railIndices[railIdx] = i;
      tryFocus(items[i]);
    }

    function findRailIndexForEl(el){
      for (var i = 0; i < rails.length; i++){
        if (rails[i].contains(el)) return i;
      }
      return -1;
    }

    document.addEventListener('keydown', function(e){
      var key = e.key;
      if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown' ||
          key === 'Enter' || key === ' ' || key === 'Spacebar') {
        e.preventDefault();
      } else {
        return;
      }

      var active = document.activeElement;

      if (key === 'Enter' || key === ' ' || key === 'Spacebar'){
        activate(active);
        return;
      }

      // Determine context: menu or which rail
      var inMenu = menuItems.indexOf(active) !== -1;
      var railIdx = findRailIndexForEl(active);

      if (inMenu) currentSection = 'menu';
      else if (railIdx >= 0) { currentSection = railIdx; currentRail = railIdx; }

      if (key === 'ArrowDown'){
        if (currentSection === 'menu'){
          // Move focus to first rail item of rail 0
          currentSection = 0;
          currentRail = 0;
          focusRailItem(currentRail, railIndices[currentRail] || 0);
        } else if (typeof currentSection === 'number'){
          // move to next rail if exists
          var next = currentSection + 1;
          if (next < rails.length){
            currentSection = next;
            currentRail = next;
            focusRailItem(currentRail, railIndices[currentRail] || 0);
          }
        }
        return;
      }

      if (key === 'ArrowUp'){
        if (typeof currentSection === 'number'){
          if (currentSection === 0){
            currentSection = 'menu';
            focusMenu(0);
          } else {
            var prev = currentSection - 1;
            if (prev >= 0){
              currentSection = prev;
              currentRail = prev;
              focusRailItem(currentRail, railIndices[currentRail] || 0);
            }
          }
        }
        return;
      }

      if (key === 'ArrowLeft'){
        if (currentSection === 'menu'){
          var mIdx = menuItems.indexOf(active);
          if (mIdx > 0) focusMenu(mIdx - 1);
        } else if (typeof currentSection === 'number'){
          // move left within current rail
          var row = rails[currentRail];
          if (!row) return;
          var items = qsa('.card, .plan-card', row);
          var idx = items.indexOf(active);
          if (idx > 0){
            focusRailItem(currentRail, idx - 1);
          }
        }
        return;
      }

      if (key === 'ArrowRight'){
        if (currentSection === 'menu'){
          var mIdx2 = menuItems.indexOf(active);
          if (mIdx2 < menuItems.length - 1) focusMenu(mIdx2 + 1);
        } else if (typeof currentSection === 'number'){
          var row2 = rails[currentRail];
          if (!row2) return;
          var items2 = qsa('.card, .plan-card', row2);
          var idx2 = items2.indexOf(active);
          if (idx2 < items2.length - 1){
            focusRailItem(currentRail, idx2 + 1);
          }
        }
        return;
      }
    });

    // Tizen back behavior: from home, go to index splash
    document.addEventListener('tizenhwkey', function (ev) {
      try {
        if (ev && ev.keyName === 'back') {
          ev.preventDefault();
          window.location.href = 'index.html';
        }
      } catch (e) {}
    });
  }

  // Simple fallback navigation for non-home pages (existing behavior)
  function initSimplePageNavigation(){
    var focusables = qsa('[data-focusable="true"], [role="button"][tabindex="0"], a.page-link, .primary-btn, .menu-item, input, button');
    focusables.forEach(function(el, i){
      if (!el.hasAttribute('data-index')) el.setAttribute('data-index', String(i));
    });
    function getIndex(el){ var idx = el && el.getAttribute ? parseInt(el.getAttribute('data-index') || '-1', 10) : -1; return isNaN(idx) ? -1 : idx; }
    function focusAt(index){
      if (!focusables.length) return;
      var i = clamp(index, 0, focusables.length - 1);
      tryFocus(focusables[i]);
    }
    if (focusables.length) tryFocus(focusables[0]);

    function activate(el){
      if (!el) return;
      if (typeof el.click === 'function') { el.click(); return; }
      var href = el.getAttribute && el.getAttribute('href');
      if (href) window.location.href = href;
    }

    document.addEventListener('keydown', function(e){
      var key = e.key;
      if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown' ||
          key === 'Enter' || key === ' ' || key === 'Spacebar') {
        e.preventDefault();
      } else {
        return;
      }
      var idx = getIndex(document.activeElement);
      if (key === 'Enter' || key === ' ' || key === 'Spacebar') { activate(document.activeElement); return; }
      if (key === 'ArrowLeft' || key === 'ArrowUp') { focusAt(idx - 1); }
      if (key === 'ArrowRight' || key === 'ArrowDown') { focusAt(idx + 1); }
    });

    document.addEventListener('tizenhwkey', function (ev) {
      try {
        if (ev && ev.keyName === 'back') {
          ev.preventDefault();
          var name = (window.location.pathname || '').split('/').pop() || 'index.html';
          if (name !== 'index.html') window.location.href = 'home.html';
          else window.location.href = 'about:blank';
        }
      } catch (e) {}
    });
  }

  // Init per page
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){
      if (isHomePage()) initHomeNavigation();
      else if (isIndexPage()) { /* splash handles itself */ }
      else initSimplePageNavigation();
    });
  } else {
    if (isHomePage()) initHomeNavigation();
    else if (isIndexPage()) { /* splash handles itself */ }
    else initSimplePageNavigation();
  }

  // PUBLIC_INTERFACE
  /**
   * This app is static and TV-friendly. Routes: index.html (splash), home.html, login.html, myplan.html.
   */
})();
