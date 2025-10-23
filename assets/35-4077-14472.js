(function () {
  'use strict';

  // Initialize Screen 35 from Figma JSON
  function init() {
    var rootEl = document.getElementById('screen-root');
    if (!rootEl) return;

    // Helpers
    function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
    function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
    function tryFocus(el) { if (!el) return; try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (_) { } } }

    // Attachments JSON path (absolute in workspace for fetch)
    var jsonPath = '/home/kavia/workspace/code-generation/attachments/screen_4077:14472.json';

    // Apply absolute frame for a node relative to base
    function applyAbsFrame(el, bb, base) {
      if (!el || !bb) return;
      var left = Math.round(bb.x - base.x);
      var top = Math.round(bb.y - base.y);
      el.style.position = 'absolute';
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      el.style.width = Math.round(bb.width) + 'px';
      el.style.height = Math.round(bb.height) + 'px';
    }

    // Set element background-image or image src based on JSON path conventions
    function setImgSrc(el, path, isBg) {
      if (!el || !path) return;
      // The system requires using figmaimages/filename.ext (no leading slash)
      // If path includes directories, just keep it as provided when it already starts with figmaimages/
      var finalPath = path;
      // Normalize: if path contains '/figmaimages/' or 'assets/figmaimages/' keep from 'figmaimages/'
      var idx = finalPath.lastIndexOf('figmaimages/');
      if (idx > -1) finalPath = finalPath.slice(idx);
      // If path is a full filesystem path, extract filename
      if (finalPath.indexOf('figmaimages/') !== 0) {
        var fname = String(path).split('/').pop();
        finalPath = 'figmaimages/' + fname;
      }
      if (isBg) {
        el.style.backgroundImage = 'url("' + finalPath + '")';
        el.style.backgroundRepeat = 'no-repeat';
        el.style.backgroundPosition = 'center';
        el.style.backgroundSize = 'cover';
      } else {
        el.src = finalPath;
      }
    }

    // Extract image fills path if present
    function getImagePathFromFills(fills) {
      if (!fills || !fills.length) return '';
      var img = fills.find(function (f) { return f.type === 'IMAGE' || f.type === 'BITMAP'; });
      return img ? (img.imageRefPath || img.image_path || img.path || '') : '';
    }

    function applyFromJson(data) {
      // Find main frame
      var frame = data.root || (data.document || data);
      if (frame && frame.type !== 'container' && frame.children) {
        // some schemas: { document: { children: [...] } }
        var cand = (frame.children || []).find(function (n) { return (n.figma_type === 'FRAME' || n.type === 'container') && n.dimensions && Math.round(n.dimensions.width) === 1920; });
        if (cand) frame = cand;
      }
      // Base origin from root.dimensions (Figma FRAME absolute)
      var base = { x: 17311, y: 23318, width: 1920, height: 1080 };
      if (data.root && data.root.dimensions) {
        base.x = data.root.dimensions.x;
        base.y = data.root.dimensions.y;
        base.width = data.root.dimensions.width;
        base.height = data.root.dimensions.height;
      }

      // 1) Background image: look for a node named "image" with VECTOR type that spans full frame (likely exported as image)
      var bgNode = null;
      function walk(node) {
        if (!node) return;
        if (node.name && /image/i.test(node.name) && node.dimensions && Math.round(node.dimensions.width) === 1920 && Math.round(node.dimensions.height) === 1080) {
          bgNode = bgNode || node;
        }
        if (node.children) node.children.forEach(walk);
      }
      walk(data.root);

      var bgImgEl = qs('#bg-image');
      if (bgImgEl) {
        // this export JSON does not include an explicit imagePath for background.
        // If a 'fills' image is not provided, leave blank.
        // Some generators add image_path on higher nodes; attempt to locate any child with image_path or fills image.
        var imgPath = '';
        function findAnyImage(node) {
          if (!node) return;
          if (node.imagePath || node.image_path) { imgPath = node.imagePath || node.image_path; return; }
          if (node.fills) {
            var p = getImagePathFromFills(node.fills);
            if (p) { imgPath = p; return; }
          }
          if (node.children) for (var i=0;i<node.children.length;i++){ if (imgPath) break; findAnyImage(node.children[i]); }
        }
        findAnyImage(bgNode || data.root);
        if (imgPath) {
          setImgSrc(bgImgEl, imgPath, false);
        } else {
          // Leave as empty, CSS background stays black/gradient
        }
      }

      // 2) Assign text content from JSON text nodes
      var textNodes = [];
      (function collectText(node) {
        if (!node) return;
        if (node.type === 'text' || node.figma_type === 'TEXT') textNodes.push(node);
        if (node.children) node.children.forEach(collectText);
      })(data.root);

      function findTextByTypo(typokey) {
        return (textNodes.find(function(n){ return n.typography_ref === typokey; }) || {}).text || '';
      }
      function findTextByExact(exact) {
        return (textNodes.find(function(n){ return (n.text || '').trim() === exact; }) || {}).text || '';
      }
      function findFirst(regex) {
        var n = textNodes.find(function(t){ return regex.test((t.text || '').trim()); });
        return n ? (n.text || '').trim() : '';
      }

      // Specific nodes in JSON carry exact strings:
      // Channel number (typo_149), Channel name (typo_165), Program name (typo_166)
      var channelNumberText = findTextByTypo('typo_149') || findFirst(/^\d{1,4}$/) || '242';
      var channelNameText = findTextByTypo('typo_165') || findFirst(/^[A-Z0-9]{2,8}$/) || 'TNT';
      var programText = findTextByTypo('typo_166') || findFirst(/gladiador|gladiator/i) || 'Gladiador II';

      // Meta: title 'Gladiator II' (typo_167), duration '2 h 28 min' (typo_167), genres (typo_167)
      var titleText = findFirst(/Gladiator II/i) || 'Gladiator II';
      var durationText = findFirst(/^\s*\d+\s*h\s*\d+\s*min\s*$/i) || '2 h 28 min';
      var genresText = findFirst(/acci|acción|aventura|drama|comedia/i) || 'Acción, aventura, drama';
      // Age tag: '+ 16 Años' (typo_168)
      var ageText = findFirst(/\+\s*1[036]\s*año/i) || '+ 16 Años';
      // Later tag (typo_169)
      var laterText = findFirst(/más\s*tarde/i) || 'MÁS TARDE';
      // Start/end hours (typo_167)
      var startText = findTextByExact('20:00') || findFirst(/^\d{1,2}:\d{2}$/) || '20:00';
      var endText = findTextByExact('22:20') || '22:20';
      // Description (typo_171)
      var descriptionText = '';
      (function pickDesc(){
        var maxLen = 0; var pick = '';
        textNodes.forEach(function(t){
          var s = (t.text || '').trim();
          if (t.typography_ref === 'typo_171') { if (s.length > maxLen) { maxLen = s.length; pick = s; } }
        });
        descriptionText = pick || descriptionText;
      })();
      // Date hour (typo_173) and date (typo_146)
      var dateHourText = findTextByTypo('typo_173') || '20:44';
      var dateText = findTextByTypo('typo_146') || '7 abr.';

      // Apply to DOM
      var chNumEl = qs('.channel-number');
      var chNameEl = qs('.channel-name');
      var programNameEl = qs('.program-name');
      var metaTitleEl = qs('.meta-text.title');
      var metaDurationEl = qs('.meta-text.duration');
      var metaGenresEl = qs('.meta-text.genres');
      var ageEl = qs('.tag-age');
      var laterEl = qs('.tag-later');
      var startEl = qs('.hour.start');
      var endEl = qs('.hour.end');
      var descEl = qs('.textbox3lines');
      var dateHourEl = qs('#system-date .date-hour');
      var dateEl = qs('#system-date .date');

      if (chNumEl) chNumEl.textContent = channelNumberText;
      if (chNameEl) chNameEl.textContent = channelNameText;
      if (programNameEl) programNameEl.textContent = programText;
      if (metaTitleEl) metaTitleEl.textContent = titleText;
      if (metaDurationEl) metaDurationEl.textContent = durationText;
      if (metaGenresEl) metaGenresEl.textContent = genresText;
      if (ageEl) ageEl.textContent = ageText;
      if (laterEl) laterEl.textContent = laterText;
      if (startEl) startEl.textContent = startText;
      if (endEl) endEl.textContent = endText;
      if (descEl && descriptionText) descEl.textContent = descriptionText;
      if (dateHourEl) dateHourEl.textContent = dateHourText;
      if (dateEl) dateEl.textContent = dateText;

      // Panel buttons: collect short labels from JSON (typo_172 likely)
      var panelButtons = qsa('.panel-btn').slice(0, 6);
      if (panelButtons.length) {
        var labels = [];
        textNodes.forEach(function(n){
          var s = (n.text || '').trim();
          if (!s) return;
          // keep short one-line labels for tiles
          if (s.length <= 18 && /^[\wÁÉÍÓÚÜÑáéíóúüñ0-9 \-\/\.:]+$/.test(s)) {
            if (labels.indexOf(s) === -1) labels.push(s);
          }
        });
        panelButtons.forEach(function(btn, i){
          var txt = qs('.panel-btn-text', btn);
          if (txt) txt.textContent = labels[i] || txt.textContent || '';
        });

        // Icons: collect any vector/icon fills that might reference exported images; JSON uses VECTOR icons without file paths.
        // If any item nodes include image fills with path, assign to panel-btn-icon background.
        function collectImageNodes(node, acc) {
          if (!node) return acc;
          if (node.fills) {
            var p = getImagePathFromFills(node.fills);
            if (p) acc.push({ node: node, path: p });
          }
          if (node.children) node.children.forEach(function(c){ collectImageNodes(c, acc); });
          return acc;
        }
        var imageNodes = collectImageNodes(data.root, []);
        panelButtons.forEach(function(btn, i){
          var iconEl = qs('.panel-btn-icon', btn);
          if (!iconEl) return;
          var p = imageNodes[i] && imageNodes[i].path;
          if (p) {
            setImgSrc(iconEl, p, true);
            iconEl.style.backgroundSize = '28px 28px';
          }
        });
      }

      // Tab focus indices
      var focusables = qsa('[tabindex], button');
      focusables.forEach(function (el, i) {
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
        el.setAttribute('data-idx', String(i));
      });
      function getIdx(el) {
        var v = parseInt(el && el.getAttribute('data-idx') || '-1', 10);
        return isNaN(v) ? -1 : v;
      }
      function focusAt(index) {
        if (!focusables.length) return;
        var i = ((index % focusables.length) + focusables.length) % focusables.length;
        tryFocus(focusables[i]);
      }

      // DPAD/keyboard fallback
      document.addEventListener('keydown', function (e) {
        var key = e.key || '';
        if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown' || key === 'Enter' || key === ' ' || key === 'Spacebar') {
          e.preventDefault();
        }
        var active = document.activeElement;
        var idx = getIdx(active);
        if (idx < 0) { focusAt(0); return; }

        if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
          if (active && typeof active.click === 'function') active.click();
          return;
        }
        if (key === 'ArrowLeft' || key === 'ArrowUp') { focusAt(idx - 1); return; }
        if (key === 'ArrowRight' || key === 'ArrowDown') { focusAt(idx + 1); return; }
      }, true);

      // Initial focus
      tryFocus(qs('.panel-btn-1') || qs('.program-name') || qsa('[tabindex]')[0]);
    }

    // Load JSON
    fetch(jsonPath).then(function (r) {
      if (!r.ok) throw new Error('fetch failed');
      return r.json();
    }).then(function (data) {
      applyFromJson(data);
    }).catch(function () {
      // Fallback without JSON — leave defaults
      applyFromJson({});
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
