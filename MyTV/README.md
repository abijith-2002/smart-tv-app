# MyTV — Tizen Web TV Project

This folder is a self-contained Tizen Web Application project for Samsung Smart TV (profile: tv). Import it directly into Tizen Studio and run in the TV emulator or device.

## Project Metadata

- Profile: `tv`
- Widget ID: `mytv.app`
- Application ID: `mytv.app.Main`
- Version: `1.0.0`
- Entry (content src): `index.html`
- Icons: `icon.png` (256x256 placeholder), `icons/app-icon-96.png`, `icons/app-icon-192.png`

## Structure

- `config.xml` — Tizen app manifest (profile tv, metadata, start file)
- `index.html` — Landing/Splash (auto-redirects to home after 5s; DPAD supported)
- `home.html` — Main rails page with cards and menu (DPAD navigation)
- `login.html` — TV-friendly login form UI
- `myplan.html` — Placeholder page
- `video-detail.html` — Integrated Figma-like video detail screen (assets-based)
- `video.html` — Simple player shell (for demo navigation)
- `css/` — Styles (styles.css + style.css from the project)
- `js/app.js` — Centralized remote/keyboard navigation and focus management
- `assets/` — Screen-specific CSS/JS and images
  - `assets/common.css`, `assets/35-4077-14472.css`, `assets/35-4077-14472.js`
  - `assets/images/*` (posters/backgrounds/thumbs)
- `icons/` — Additional icon sizes
- `icon.png` — 256×256 placeholder icon (replace with your branded icon as needed)

All paths are relative to this `MyTV` folder. No references go outside.

## Import in Tizen Studio

1. Open Tizen Studio.
2. File > Import > Tizen > Tizen Project > "Existing Project".
3. Select the `MyTV` folder.
4. Confirm Profile is `tv` in `config.xml`.
5. Right-click the imported project > Run As > Tizen Web Application.

If you need to test on a device:
- Ensure a Samsung TV/Tizen device is in developer mode and connected.
- Add the device in Tizen Studio Device Manager.
- Run As > Tizen Web Application (Device).

## Remote/Keyboard Navigation

- Arrow keys: Move focus across menu, buttons, and rails.
- Enter/Space: Activate focused item.
- Back/Escape or Tizen back hardware key: Navigate back along the flow.
  - From video-detail: back -> home.html
  - From home: back -> index.html
  - From login/myplan: back -> home.html

## Notes

- This is a static demo app. No privileged APIs are needed at the moment.
- If you add features that require network or device capabilities, update `config.xml` with proper `<tizen:privilege>` entries (e.g., internet).
- Replace `icon.png` with your own 256×256 icon (PNG, square) when branding.

## Troubleshooting

- Malformed IRI: Ensure `widget@id` uses a valid token (this project uses `mytv.app`).
- White screen: Confirm `content src="index.html"` is present and all asset paths are relative and exist within `MyTV/`.
- DPAD not moving focus: Ensure elements have `tabindex="0"` and `data-focus="true"` when needed. `js/app.js` handles most navigation cases.
