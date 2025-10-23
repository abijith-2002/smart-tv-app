(function () {
  'use strict';

  function init() {
    var screen = document.getElementById('screen-35-4077-14472');
    if (!screen) return;

    var root = document.getElementById('el-4077-14472');
    if (!root) return;

    var BASE_W = 1920, BASE_H = 1080;

    function applyScale() {
      try {
        var rect = screen.getBoundingClientRect();
        var scale = Math.min(rect.width / BASE_W, rect.height / BASE_H);
        root.style.transform = 'scale(' + scale + ')';
        root.style.webkitTransform = 'scale(' + scale + ')';
      } catch (e) {}
    }

    var rafId = 0;
    function scheduleScale() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(applyScale);
    }
    window.addEventListener('resize', scheduleScale);
    scheduleScale();

    // Try to locate any imagePath in the JSON (none provided for this screen, but future-proof)
    var jsonPath = './figma_screen_4077-14472.json'; // indirect; we attempt to fetch from attachments path too
    // Primary: attempt absolute path present in workspace
    var tryPaths = [
      '/home/kavia/workspace/code-generation/attachments/screen_4077:14472.json',
      jsonPath
    ];

    function setBackgroundFromPath(path) {
      if (!path) return;
      var fname = String(path).split('/').pop();
      var rel = 'figmaimages/' + fname; // as per dynamic resolver requirement
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
            found = img.imageRefPath || img.image_path || img.path; return;
          }
        }
        if (n.children) n.children.forEach(walk);
      }
      walk(node);
      return found;
    }

    function fetchJSONSequential(paths, idx) {
      if (idx >= paths.length) return Promise.reject();
      return fetch(paths[idx])
        .then(function(r){ return r.ok ? r.json() : Promise.reject(); })
        .catch(function(){ return fetchJSONSequential(paths, idx+1); });
    }

    fetchJSONSequential(tryPaths, 0)
      .then(function(data){
        var imgPath = findAnyImage(data && data.root || data || {});
        if (imgPath) setBackgroundFromPath(imgPath);
      })
      .catch(function(){ /* no-op if not found */ });

    // Icon buttons: basic keyboard activation
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
      btn.addEventListener('click', function(){ /* no-op placeholder */ });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
