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

    function updateTime() {
      var now = new Date();
      var timeEl = document.getElementById('el-I4077-14476-456-15482-1-482');
      var dateEl = document.getElementById('el-I4077-14476-456-15483-1-483');

      if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short'
        });
      }
    }

    updateTime();
    setInterval(updateTime, 60000);

    var replayBtn = document.getElementById('el-I4077-14475-456-11843');
    var recordBtn = document.getElementById('el-I4077-14475-456-11845');

    if (replayBtn) {
      replayBtn.addEventListener('click', function() {
        alert('Replay functionality - would restart the content');
      });
    }

    if (recordBtn) {
      recordBtn.addEventListener('click', function() {
        alert('Record functionality - would schedule recording');
      });
    }

    var iconBtns = [replayBtn, recordBtn].filter(Boolean);
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
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
