# MyTV - Tizen TV Web Project

This folder is a ready-to-import Tizen Web Application project for Samsung Smart TV.

Contents:
- config.xml (TV profile, valid app/package IDs, splash entry)
- index.html (splash screen auto-redirects to home.html after ~3s)
- home.html (top menu, banner, content rails with local assets, remote navigation)
- login.html (TV-friendly form with focus styles)
- myplan.html (placeholder page)
- style.css (shared, TV-friendly styles and strong focus outlines)
- app.js (remote/keyboard navigation across menu and rails)
- icons/app-icon-96.png, icons/app-icon-192.png
- assets/images/* placeholder images

Import in Tizen Studio:
1. Open Tizen Studio.
2. File > Import > Tizen > Tizen Project.
3. Choose "Existing Project" and select the smart-tv-app folder.
4. Ensure Profile is set to "tv" and config.xml shows your app details.
5. Right-click the project > Run As > Tizen Web Application to launch in TV Emulator or device.

Notes:
- Entry page: index.html (splash). It redirects to home.html after ~3 seconds.
- Navigation:
  - Arrow keys move focus across menu and rails.
  - Enter/Space activates focused items/links.
  - Back key on Home returns to index (splash).
- Local assets are referenced with relative paths compatible with Tizen packaging.
- Settings menu item is a placeholder and does not navigate.

Troubleshooting:
- If you see "Malformed IRI" during import, ensure config.xml `widget@id` uses a valid IRI-like token (we use "mytv.app" which is acceptable) and `tizen:application@id` is unique.
- Do not use unsupported CSS like scroll-margin; margins are used as fallbacks with @supports for gap where available.
