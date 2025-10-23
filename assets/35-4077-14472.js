(function () {
  'use strict';

  // PUBLIC_INTERFACE
  /**
   * Screen 35 bootstrap:
   * - Applies fluid scale to 1920x1080 absolute layout using CSS transform
   * - Assigns background image if any imagePath is found in JSON (optional)
   * - Adds keyboard focus handling for small icon buttons
   * - Ensures no console errors if JSON/assets are missing
   */
  function init() {
    var screen = document.getElementById('screen-35-4077-14472');
    if (!screen) return;

    var root = document.getElementById('el-4077-14472');
    if (!root) return;

    // Scaling: fit the 1920x1080 canvas inside the .screen element
    var BASE_W = 1920, BASE_H = 1080;
    screen.setAttribute('data-base-width', String(BASE_W));

    function applyScale() {
      try {
        var rect = screen.getBoundingClientRect();
        var scale = Math.min(rect.width / BASE_W, rect.height / BASE_H);
        root.style.transform = 'scale(' + scale + ')';
        root.style.webkitTransform = 'scale(' + scale + ')';
      } catch (e) {}
    }

    // Debounced resize/observer
    var rafId = 0;
    function scheduleScale() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(applyScale);
    }
    window.addEventListener('resize', scheduleScale);
    scheduleScale();

    // Attempt to read the attachments JSON to find any imagePath for background/icons
    var jsonPath = '/home/kavia/workspace/code-generation/attachments/screen_4077:14472.json';

    function setBackgroundFromPath(path) {
      if (!path) return;
      var fname = String(path).split('/').pop();
      // The request asked to use /assets/figmaimages/ if images exist; we place relative to repo root (assets/figmaimages)
      var rel = 'assets/figmaimages/' + fname;
      var bgDiv = document.getElementById('el-4077-14473');
      var bgImg = document.getElementById('el-4077-14473-img');
      if (bgDiv) {
        bgDiv.style.backgroundImage = 'url("' + rel + '")';
        bgDiv.style.backgroundRepeat = 'no-repeat';
        bgDiv.style.backgroundPosition = 'center';
        bgDiv.style.backgroundSize = 'cover';
      }
      if (bgImg) {
        bgImg.src = rel;
        bgImg.style.display = 'block';
      }
    }

    function findAnyImage(node) {
      var found = '';
      function walk(n) {
        if (!n || found) return;
        if (n.imagePath || n.image_path) { found = n.imagePath || n.image_path; return; }
        if (n.fills && Array.isArray(n.fills)) {
          var img = n.fills.find(function(f){ return f.type === 'IMAGE' || f.type === 'BITMAP'; });
          if (img && (img.imageRefPath || img.image_path || img.path)) {
            found = img.imageRefPath || img.image_path || img.path;
            return;
          }
        }
        if (n.children) n.children.forEach(walk);
      }
      walk(node);
      return found;
    }

    fetch(jsonPath)
      .then(function(r){ return r.ok ? r.json() : Promise.reject(); })
      .then(function(data){
        var imgPath = findAnyImage(data && data.root || data || {});
        if (imgPath) setBackgroundFromPath(imgPath);
      })
      .catch(function(){
        // No images provided, leave default gradient/black
      });

    // Focus management for small icon buttons to ensure visible outline and keyboard activation
    var iconBtns = [
      document.getElementById('el-I4077-14475-456-11843'),
      document.getElementById('el-I4077-14475-456-11845')
    ].filter(Boolean);

    iconBtns.forEach(function(btn, idx){
      if (!btn.hasAttribute('tabindex')) btn.setAttribute('tabindex','0');
      btn.addEventListener('keydown', function(e){
        var k = e.key || '';
        if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
          e.preventDefault();
          try { btn.click(); } catch(_){}
        }
        if (k === 'ArrowRight') {
          e.preventDefault();
          var next = iconBtns[idx+1] || iconBtns[0];
          try { next.focus(); } catch(_){}
        }
        if (k === 'ArrowLeft') {
          e.preventDefault();
          var prev = iconBtns[idx-1] || iconBtns[iconBtns.length-1];
          try { prev.focus(); } catch(_){}
        }
      });
      // Placeholder click handlers (no-op)
      btn.addEventListener('click', function(){ /* no-op to avoid console errors */ });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
