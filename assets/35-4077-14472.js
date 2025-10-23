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

    // Icon buttons: basic keyboard activation (Replay and Record)
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
      btn.addEventListener('click', function(){ /* placeholder: wire to app actions if needed */ });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
