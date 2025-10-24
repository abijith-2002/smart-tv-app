# App Icons for Tizen Packaging

This folder must contain valid PNG images for Tizen/Samsung TV packaging.

Required sizes currently referenced:
- 96x96: app-icon-96.png
- 192x192: app-icon-192.png
- 512x512: app-icon-512.png

These files are currently placeholders in this repository. Replace them with real PNG icons of the exact sizes listed above before packaging with Tizen Studio.

If you add or change icons, ensure config.xml files reference the correct paths:
- /smart-tv-app/config.xml: uses icons/app-icon-192.png and includes a tizen:icon section="tv".
- /smart-tv-app/MyProjectTV/config.xml: uses icons/app-icon-96.png and icons/app-icon-192.png.
