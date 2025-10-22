(function() {
  // PUBLIC_INTERFACE
  /** Initialize TV remote/keyboard navigation on Home page. */
  function initFocusManager() {
    const focusables = Array.from(document.querySelectorAll('[tabindex="0"]'));
    // Define ordered groups
    const groupsOrder = ['menu', 'banner', 'rail-0', 'rail-1', 'rail-2', 'rail-3', 'rail-4', 'subs'];

    // Build group map
    const groups = {};
    groupsOrder.forEach(g => groups[g] = []);
    focusables.forEach(el => {
      const g = el.getAttribute('data-group');
      if (g && groups[g]) {
        groups[g].push(el);
      }
    });

    // Sort each group's items by data-index
    Object.keys(groups).forEach(g => {
      groups[g].sort((a, b) => {
        const ia = parseInt(a.getAttribute('data-index') || '0', 10);
        const ib = parseInt(b.getAttribute('data-index') || '0', 10);
        return ia - ib;
      });
    });

    // Helpers to get indices
    function getCurrent() {
      const active = document.activeElement;
      if (!active) return { groupIdx: 0, itemIdx: 0, el: groups[groupsOrder[0]][0] };
      const g = active.getAttribute('data-group');
      const idx = parseInt(active.getAttribute('data-index') || '0', 10);
      const groupIdx = g ? groupsOrder.indexOf(g) : 0;
      return { groupIdx, itemIdx: idx, el: active };
    }

    function focusAt(groupIdx, itemIdx) {
      if (groupIdx < 0) groupIdx = 0;
      if (groupIdx > groupsOrder.length - 1) groupIdx = groupsOrder.length - 1;
      const groupName = groupsOrder[groupIdx];
      const list = groups[groupName];
      if (!list || list.length === 0) return;
      if (itemIdx < 0) itemIdx = 0;
      if (itemIdx > list.length - 1) itemIdx = list.length - 1;
      const el = list[itemIdx];
      if (el) {
        el.focus({ preventScroll: true });
        // If element is inside a horizontally scrollable rail, ensure visibility
        const railRow = el.closest('.rail-row, .plans');
        if (railRow) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    }

    // Default focus: first menu item
    const firstMenu = groups['menu'] && groups['menu'][0];
    if (firstMenu) firstMenu.focus();

    // Click actions for menu
    groups['menu'].forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        if (action === 'login') {
          window.location.href = 'login.html';
        } else if (action === 'myplan') {
          window.location.href = 'my-plan.html';
        } else if (action === 'settings') {
          alert('Settings coming soon');
        } else {
          // home: no-op
        }
      });
    });

    // Enter key handling for cards/plans/banner
    function handleEnter(el) {
      const g = el.getAttribute('data-group');
      const action = el.getAttribute('data-action');
      if (g === 'menu') {
        el.click();
        return;
      }
      if (g === 'banner') {
        if (el.classList.contains('primary-btn')) {
          alert('Playing featured...');
        } else {
          alert('More info coming soon');
        }
        return;
      }
      if (g && g.startsWith('rail-')) {
        alert('Open content detail');
        return;
      }
      if (g === 'subs') {
        alert('Plan selected');
        return;
      }
      if (action === 'settings') {
        alert('Settings coming soon');
      }
    }

    // Handle key navigation
    document.addEventListener('keydown', (e) => {
      const key = e.key;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter'].includes(key)) {
        e.preventDefault();
      }
      const { groupIdx, itemIdx, el } = getCurrent();

      if (key === 'Enter') {
        if (el) handleEnter(el);
        return;
      }

      if (key === 'ArrowLeft') {
        // move within group to previous item
        focusAt(groupIdx, itemIdx - 1);
      } else if (key === 'ArrowRight') {
        // move within group to next item
        focusAt(groupIdx, itemIdx + 1);
      } else if (key === 'ArrowDown') {
        // move to next group, keep same index if possible
        focusAt(groupIdx + 1, itemIdx);
      } else if (key === 'ArrowUp') {
        // move to previous group
        focusAt(groupIdx - 1, itemIdx);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFocusManager);
  } else {
    initFocusManager();
  }
})();
