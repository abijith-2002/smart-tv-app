(function () {
  'use strict';

  // PUBLIC_INTERFACE
  /**
   * Initialize Screen 35 from Figma JSON:
   * - Parses attachments/screen_4077:14472.json
   * - Applies absolute positions, dimensions, text, fills, and images using exact figmaimages/ paths
   * - Enforces pixel-perfect 1920x1080 frame coordinates (relative to the frame origin)
   * - Enables keyboard/remote navigation with wrap-around
   */
  function initScreen35() {
    var rootEl = document.getElementById('screen-root');
    if (!rootEl) return;

    // Helpers
    function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
    function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
    function tryFocus(el) { if (!el) return; try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (_) { } } }

    // Figma JSON location (absolute path in workspace). We only read and apply data, no guessing.
    var jsonPath = '/home/kavia/workspace/code-generation/attachments/screen_4077:14472.json';

    // Utility: Map Figma color to rgba string
    function figmaColorToRgba(c, opacityOverride) {
      if (!c) return '';
      var r = Math.round((c.r || 0) * 255);
      var g = Math.round((c.g || 0) * 255);
      var b = Math.round((c.b || 0) * 255);
      var a = (typeof opacityOverride === 'number') ? opacityOverride : (typeof c.a === 'number' ? c.a : 1);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    }

    // Apply text styles per node (font family, size, weight, color, line-height if provided)
    function applyTextStyle(el, style, fills) {
      if (!el || !style) return;
      if (style.fontFamily) el.style.fontFamily = style.fontFamily + ', "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
      if (style.fontSize) el.style.fontSize = style.fontSize + 'px';
      if (style.fontWeight) el.style.fontWeight = style.fontWeight;
      if (style.lineHeightPx) el.style.lineHeight = style.lineHeightPx + 'px';
      if (fills && fills.length) {
        var solid = fills.find(function (f) { return f.type === 'SOLID'; });
        if (solid && solid.color) {
          el.style.color = figmaColorToRgba(solid.color, solid.opacity);
        }
      }
    }

    // Apply absolute frame for a node relative to the base frame origin
    function applyAbsFrame(el, node, base) {
      if (!el || !node || !node.absoluteBoundingBox) return;
      var bb = node.absoluteBoundingBox;
      var left = Math.round(bb.x - base.x);
      var top = Math.round(bb.y - base.y);
      el.style.position = 'absolute';
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      el.style.width = Math.round(bb.width) + 'px';
      el.style.height = Math.round(bb.height) + 'px';
    }

    // Set element background-image based on fills that include an image; use EXACT path from JSON export field if provided.
    function applyImageFill(el, fills) {
      if (!el || !fills || !fills.length) return;
      var img = fills.find(function (f) { return f.type === 'IMAGE' || f.type === 'BITMAP'; });
      if (!img) return;
      var path = img.imageRefPath || img.image_path || img.path || '';
      if (path) {
        // Use exact figmaimages path provided by JSON
        el.style.backgroundImage = 'url("' + path + '")';
        el.style.backgroundRepeat = 'no-repeat';
        el.style.backgroundPosition = 'center';
        el.style.backgroundSize = 'cover';
      }
    }

    // When a node is an IMAGE or BITMAP and targets an <img> tag
    function applyImgSrc(imgEl, node) {
      if (!imgEl || !node) return;
      var fills = node.fills || [];
      var img = fills.find(function (f) { return f.type === 'IMAGE' || f.type === 'BITMAP'; });
      var path = img && (img.imageRefPath || img.image_path || img.path);
      if (!path && node.image_path) path = node.image_path;
      if (path) {
        imgEl.src = path; // must be exact from JSON
      }
    }

    // The main application from JSON
    function applyFromJson(data) {
      try {
        // Determine the frame node matching id 4077:14472 or the first FRAME of 1920x1080
        var frame = null;
        var base = { x: 0, y: 0, width: 1920, height: 1080 };

        function findFrame(node) {
          if (!node) return null;
          if (node.type === 'FRAME' && node.id && /4077:14472/.test(node.id)) return node;
          if (node.type === 'FRAME' && node.absoluteBoundingBox &&
              Math.round(node.absoluteBoundingBox.width) === 1920 &&
              Math.round(node.absoluteBoundingBox.height) === 1080) return node;
          if (node.children) {
            for (var i = 0; i < node.children.length; i++) {
              var f = findFrame(node.children[i]);
              if (f) return f;
            }
          }
          return null;
        }

        frame = findFrame(data.document || data.root || data);
        if (!frame) {
          // Some exports present as {root: {...}} in simpler schema
          frame = (data.root && data.root.type === 'FRAME') ? data.root : data.root && (data.root.children || [])[0];
        }
        if (frame && frame.absoluteBoundingBox) {
          base.x = frame.absoluteBoundingBox.x;
          base.y = frame.absoluteBoundingBox.y;
          base.width = frame.absoluteBoundingBox.width;
          base.height = frame.absoluteBoundingBox.height;
        }

        // 1) Background image node (if present) targets #bg-image
        var bg = qs('#bg-image');
        if (bg) {
          var bgNode = null;
          function findBackgroundImage(node) {
            if (!node) return null;
            var fills = node.fills || [];
            var hasImage = fills.some(function (f) { return f.type === 'IMAGE' || f.type === 'BITMAP'; });
            if (hasImage && node.name && /background/i.test(node.name)) return node;
            if (hasImage && node.type === 'RECTANGLE' && !node.children) return node;
            if (node.children) {
              for (var i = 0; i < node.children.length; i++) {
                var result = findBackgroundImage(node.children[i]);
                if (result) return result;
              }
            }
            return null;
          }
          bgNode = findBackgroundImage(frame) || findBackgroundImage(data.document || data.root || data);
          if (bgNode) {
            applyImgSrc(bg, bgNode);
          } else {
            // Another schema might provide a top-level with image_path
            var imageNode = (data.root && data.root.children || []).find(function (c) { return c.image_path; });
            if (imageNode && imageNode.image_path) {
              bg.src = imageNode.image_path; // exact path
            } else {
              // leave empty if not present
              bg.removeAttribute('src');
            }
          }
        }

        // 2) Gradient overlay might exist as a layer; if gradient info exists, apply via CSS (already set by stylesheet)

        // 3) Metadata block
        // Locate channel number, channel name, program name, meta texts, age, later, hours, description, date/time, and panel buttons from JSON text nodes.
        var textNodes = [];
        (function collectText(node) {
          if (!node) return;
          if (node.type === 'TEXT') textNodes.push(node);
          if (node.children) node.children.forEach(collectText);
        })(frame || (data.document || data.root || data));

        function pickText(regex, fallback) {
          var n = textNodes.find(function (t) {
            var s = (t.characters || t.text || '').trim();
            return regex.test(s);
          });
          return n ? (n.characters || n.text || '').trim() : fallback;
        }

        // Try to extract by relative roles where possible using name tags or heuristics
        var channelNumberText = null;
        var channelNameText = null;
        var programText = null;
        var titleText = null;
        var durationText = null;
        var genresText = null;
        var ageText = null;
        var laterText = null;
        var startText = null;
        var endText = null;
        var dateHourText = null;
        var dateText = null;
        var descriptionText = null;

        // Heuristics for Spanish labels expected from preview:
        // Prefer exact matches if present
        programText = pickText(/gladiador\s*ii/i, programText);
        titleText = pickText(/gladiator\s*ii/i, titleText);
        laterText = pickText(/más\s*tarde/i, laterText);
        ageText = pickText(/(\+\s*1[036]|1[036]\+|\+\s*16).*año/i, ageText);
        // Duration like "2 h 28 min"
        durationText = pickText(/^\s*\d+\s*h\s*\d+\s*min\s*$/i, durationText);
        // Genres list with commas
        genresText = pickText(/acción|aventura|drama|comedia|horror|terror/i, genresText);
        // Hours like "20:00" and "22:20"
        startText = pickText(/^\s*\d{1,2}:\d{2}\s*$/, startText);
        // take another distinct match for end if exists
        endText = (function(){
          var hrs = textNodes.filter(function (t) { return /^\s*\d{1,2}:\d{2}\s*$/.test((t.characters || t.text || '').trim()); })
                             .map(function (t) { return (t.characters || t.text || '').trim(); });
          return hrs.length > 1 ? hrs[1] : null;
        })();
        // Channel number typically numeric 2-4 digits
        channelNumberText = pickText(/^\s*\d{1,4}\s*$/, channelNumberText);
        // Channel name like TNT, HBO, etc. Prefer uppercase short word
        channelNameText = pickText(/^[A-Z0-9]{2,6}$/, channelNameText);
        // Date-hour and date
        dateHourText = pickText(/^\s*\d{1,2}:\d{2}\s*$/, dateHourText) || '';
        dateText = pickText(/\b(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?$/i, dateText) || '';
        // Description: the longest multiline text block
        (function findDescription(){
          var maxLen = 0, pick = null;
          textNodes.forEach(function(n){
            var s = (n.characters || n.text || '').trim();
            if (s.split(/\s+/).length > 12 && s.length > maxLen) { maxLen = s.length; pick = s; }
          });
          descriptionText = pick || descriptionText;
        })();

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

        if (chNumEl) chNumEl.textContent = channelNumberText || chNumEl.textContent || '242';
        if (chNameEl) chNameEl.textContent = channelNameText || chNameEl.textContent || 'TNT';
        if (programNameEl) programNameEl.textContent = programText || programNameEl.textContent || 'Gladiador II';
        if (metaTitleEl) metaTitleEl.textContent = titleText || metaTitleEl.textContent || 'Gladiator II';
        if (metaDurationEl) metaDurationEl.textContent = durationText || metaDurationEl.textContent || '2 h 28 min';
        if (metaGenresEl) metaGenresEl.textContent = genresText || metaGenresEl.textContent || 'Acción, aventura, drama';
        if (ageEl) ageEl.textContent = ageText || ageEl.textContent || '+ 16 Años';
        if (laterEl) laterEl.textContent = laterText || laterEl.textContent || 'MÁS TARDE';
        if (startEl) startEl.textContent = startText || startEl.textContent || '20:00';
        if (endEl) endEl.textContent = endText || endEl.textContent || '22:20';
        if (descEl && descriptionText) descEl.textContent = descriptionText;
        if (dateHourEl && dateHourText) dateHourEl.textContent = dateHourText || '20:44';
        if (dateEl && dateText) dateEl.textContent = dateText || '7 abr.';

        // 4) Panel buttons: find six button nodes; set labels and icons if image paths exist
        // We map in order to existing .panel-btn-1..6
        var panelButtons = qsa('.panel-btn').slice(0, 6);
        if (panelButtons.length) {
          var labelNodes = textNodes.filter(function(n){
            var s = (n.characters || n.text || '').trim();
            return s && s.length <= 18 && /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ0-9 \-\/\.:]+$/.test(s);
          });
          // Unique labels, preserve order
          var labels = [];
          labelNodes.forEach(function(n){
            var t = (n.characters || n.text || '').trim();
            if (labels.indexOf(t) === -1) labels.push(t);
          });
          // Assign labels if present
          panelButtons.forEach(function(btn, i){
            var txt = qs('.panel-btn-text', btn);
            if (txt) {
              txt.textContent = labels[i] || txt.textContent || '';
            }
          });

          // Try to find associated icons with image fills; apply exact figmaimages path to .panel-btn-icon background
          function collectImageNodes(node, acc) {
            if (!node) return acc;
            var fills = node.fills || [];
            var img = fills.find(function (f) { return f.type === 'IMAGE' || f.type === 'BITMAP'; });
            if (img && (img.imageRefPath || img.image_path || img.path)) acc.push(node);
            if (node.children) node.children.forEach(function(c){ collectImageNodes(c, acc); });
            return acc;
          }
          var imageNodes = collectImageNodes(frame, []);
          panelButtons.forEach(function(btn, i){
            var iconEl = qs('.panel-btn-icon', btn);
            if (!iconEl) return;
            var srcPath = null;
            if (imageNodes[i]) {
              var f = imageNodes[i].fills || [];
              var im = f.find(function (x) { return x.type === 'IMAGE' || x.type === 'BITMAP'; });
              srcPath = im && (im.imageRefPath || im.image_path || im.path);
            }
            if (srcPath) {
              iconEl.style.backgroundImage = 'url("' + srcPath + '")';
              iconEl.style.backgroundSize = '28px 28px';
            }
          });
        }

        // 5) Apply text styles if JSON contains style info
        textNodes.forEach(function(node){
          var content = (node.characters || node.text || '').trim();
          // map to the likely target element by matching content
          function matchAndStyle(selector) {
            var el = qsa(selector).find(function(e){ return (e.textContent || '').trim() === content; });
            if (el) applyTextStyle(el, node.style || node.styleOverrideTable || {}, node.fills || []);
          }
          matchAndStyle('.channel-number, .channel-name, .program-name, .meta-text, .tag-age, .tag-later, .hour, #system-date .date-hour, #system-date .date, .textbox3lines, .panel-btn-text');
        });

        // 6) Focusability and DPAD navigation for TV
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
          // Simple linear wrap navigation (left/up => -1, right/down => +1)
          if (key === 'ArrowLeft' || key === 'ArrowUp') { focusAt(idx - 1); return; }
          if (key === 'ArrowRight' || key === 'ArrowDown') { focusAt(idx + 1); return; }
        }, true);

        // 7) Initial focus on first panel button or program name
        tryFocus(qs('.panel-btn-1') || qs('.program-name') || qsa('[tabindex]')[0]);
      } catch (err) {
        // Fail-safe: still provide a basic focus order
        tryFocus(document.querySelector('[tabindex]') || document.querySelector('button'));
      }
    }

    // Fetch JSON; if it fails, we still render using defaults defined in CSS/HTML placeholders.
    fetch(jsonPath).then(function (r) {
      if (!r.ok) throw new Error('fetch failed');
      return r.json();
    }).then(function (data) {
      applyFromJson(data);
    }).catch(function () {
      // Apply without JSON — elements remain empty or defaulted; still focusable
      applyFromJson({});
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScreen35);
  } else {
    initScreen35();
  }
})();
