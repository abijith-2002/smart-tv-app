(function(){
  'use strict';

  // PUBLIC_INTERFACE
  /**
   * Title Card page script:
   * - Parses ?id= or ?src=&title=&poster=&desc= query params
   * - Loads inline catalog fallback for id lookup
   * - Renders poster, title, description, submeta
   * - Play navigates to video.html with src/title params
   * - Remote/keyboard navigation: Enter activates, Back/Escape/Tizen back return to home, arrow keys move across actions
   */
  function initTitleCard(){
    var qs = function(sel, ctx){ return (ctx || document).querySelector(sel); };
    var qsa = function(sel, ctx){ return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
    var tryFocus = function(el){ if(!el) return; try{ el.focus({preventScroll:true}); }catch(e){ try{ el.focus(); }catch(_){} } };
    var params = new URLSearchParams(window.location.search);

    // Minimal inline catalog. If present, id lookup overrides query params.
    var catalog = {
      trending1: {
        id: 'trending1',
        title: 'Skyline Chase',
        src: 'assets/images/placeholder/trending1.jpg',
        poster: 'assets/images/placeholder/trending1.jpg',
        desc: 'A high-octane pursuit across neon skylines where every turn raises the stakes.',
        runtime: '1h 48m',
        tags: ['Action', 'Thriller']
      },
      trending2: {
        id: 'trending2',
        title: 'Whisper Woods',
        src: 'assets/images/placeholder/trending2.jpg',
        poster: 'assets/images/placeholder/trending2.jpg',
        desc: 'An eerie tale woven through ancient trees where silence hides secrets.',
        runtime: '2h 02m',
        tags: ['Horror', 'Mystery']
      },
      trending3: {
        id: 'trending3',
        title: 'Blue Horizon',
        src: 'assets/images/placeholder/trending3.jpg',
        poster: 'assets/images/placeholder/trending3.jpg',
        desc: 'An inspiring journey across the open sea, testing courage and friendship.',
        runtime: '1h 36m',
        tags: ['Drama', 'Adventure']
      }
    };

    function getFromParams(){
      var data = {
        id: params.get('id') || '',
        title: params.get('title') || '',
        src: params.get('src') || '',
        poster: params.get('poster') || '',
        desc: params.get('desc') || '',
        runtime: params.get('runtime') || '',
        tags: (params.get('tags') || '').split(',').filter(Boolean)
      };
      return data;
    }

    function resolveData(){
      var id = params.get('id');
      if (id && catalog[id]){
        return catalog[id];
      }
      var p = getFromParams();
      // Fallbacks if not enough data
      if (!p.poster && p.src) p.poster = p.src;
      if (!p.title) p.title = 'Untitled';
      if (!p.desc) p.desc = 'No description available.';
      if (!p.runtime) p.runtime = '—';
      if (!p.tags || !p.tags.length) p.tags = ['General'];
      return p;
    }

    var data = resolveData();

    // Render
    var posterEl = qs('#heroPoster');
    var titleEl = qs('#heroTitle');
    var descEl = qs('#heroDesc');
    var runtimeEl = qs('#heroRuntime');
    var tagsEl = qs('#heroTags');
    var playBtn = qs('#playBtn');
    var addBtn = qs('#addBtn');
    var infoBtn = qs('#infoBtn');
    var backBtn = qs('#backBtn');

    if (posterEl) posterEl.src = data.poster || 'assets/images/thumb-1.jpg';
    if (posterEl) posterEl.alt = (data.title || 'Poster') + ' poster';
    if (titleEl) titleEl.textContent = data.title || 'Title';
    if (descEl) descEl.textContent = data.desc || '';
    if (runtimeEl) runtimeEl.textContent = data.runtime || '—';
    if (tagsEl) tagsEl.textContent = (data.tags || []).join(' • ');

    function toVideoHref(){
      var sp = new URLSearchParams();
      if (data.src) sp.set('src', data.src);
      if (data.title) sp.set('title', data.title);
      return 'video.html?' + sp.toString();
    }

    // Wire Play to video.html
    if (playBtn){
      playBtn.setAttribute('href', toVideoHref());
      playBtn.addEventListener('click', function(ev){
        ev.preventDefault();
        window.location.href = toVideoHref();
      });
    }

    // Add to List placeholder
    if (addBtn){
      addBtn.addEventListener('click', function(ev){
        ev.preventDefault();
        try { alert('Added to your list (placeholder)'); } catch(e){}
      });
    }

    // More Info placeholder
    if (infoBtn){
      infoBtn.addEventListener('click', function(ev){
        ev.preventDefault();
        try { alert('More info coming soon'); } catch(e){}
      });
    }

    // Back button behavior
    if (backBtn){
      backBtn.addEventListener('click', function(ev){
        ev.preventDefault();
        // Go back if possible; else go home
        if (window.history.length > 1) window.history.back();
        else window.location.href = 'home.html';
      });
    }

    // Focus order for actions
    var focusables = [playBtn, addBtn, infoBtn].filter(Boolean);
    focusables.forEach(function(el, i){
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      el.setAttribute('data-idx', String(i));
    });

    // Use global key dispatcher if available from app.js
    var usedGlobal = false;
    try {
      // app.js installs a global dispatcher; we re-register a handler by calling it again if exposed.
      // Since app.js auto-installs dispatcher with per-page init, we attach an additional keydown here for local navigation.
      usedGlobal = true;
    } catch(e){ usedGlobal = false; }

    // Local key handling to ensure DPAD works even if app.js doesn’t know this page
    document.addEventListener('keydown', function(e){
      var key = e.key || '';
      if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown' ||
          key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Escape' || key === 'Backspace'){
        e.preventDefault();
      }

      var active = document.activeElement;

      function getIdx(el){
        var v = parseInt(el && el.getAttribute('data-idx') || '-1', 10);
        return isNaN(v) ? -1 : v;
      }
      function focusAt(index){
        if (!focusables.length) return;
        var i = ((index % focusables.length) + focusables.length) % focusables.length;
        tryFocus(focusables[i]);
      }

      if (key === 'Escape' || key === 'Backspace'){
        if (window.history.length > 1) window.history.back();
        else window.location.href = 'home.html';
        return;
      }

      if (key === 'Enter' || key === ' ' || key === 'Spacebar'){
        if (active && typeof active.click === 'function') active.click();
        return;
      }

      // Horizontal action list
      if (key === 'ArrowLeft' || key === 'ArrowRight'){
        var idx = getIdx(active);
        if (idx < 0) { focusAt(0); return; }
        if (key === 'ArrowLeft') focusAt(idx - 1);
        else focusAt(idx + 1);
        return;
      }

      // Up/Down keep within actions, but try to stay on Play for accessibility
      if (key === 'ArrowUp' || key === 'ArrowDown'){
        var current = getIdx(active);
        if (current < 0) { focusAt(0); return; }
        // Keep same index; if that fails, default to Play
        focusAt(current);
        return;
      }
    }, true);

    // Initial focus to Play
    tryFocus(playBtn || addBtn || infoBtn);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initTitleCard);
  } else {
    initTitleCard();
  }
})();
