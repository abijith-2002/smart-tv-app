# My New Project — Tizen TV (Web App) Emulator Guide

This folder is a Tizen Web Application project tailored for Samsung TV emulator compatibility.

Contents:
- config.xml (profile=tv, entry=index.html, tizen:application metadata, icon, privileges/features)
- index.html (loads tv-navigation.js and app.js, TV-safe key handling)
- home.html, login.html, my-plan.html (TV-friendly pages with DPAD focus)
- tv-navigation.js (DPAD focus and back handling without non-TV APIs)
- app.js (page logic; safe key handling)
- icon.png (app icon referenced by config.xml)
- style.css (TV-safe styles)

## Prerequisites
- Tizen Studio installed (latest).
- Samsung Certificate Manager to create a certificate profile.
- Samsung TV Emulator (installed via Tizen Package Manager).

## Importing the Project (Web App profile)
1. Open Tizen Studio.
2. File > Import > Tizen > Tizen Project.
3. Choose "Existing Project" and select this directory:
   - smart-tv-app/my_new_project
4. Ensure the project type is "Web Application" and Profile is set to "tv".
5. Confirm config.xml shows:
   - <content src="index.html" />
   - <tizen:profile name="tv" />
   - <tizen:application id="my.new.project.app" package="my.new.project" required_version="6.0" />
   - <icon src="icon.png" />
   - Privileges: http://tizen.org/privilege/internet
   - Features: http://tizen.org/feature/screen.size.all and http://tizen.org/feature/tv
   - tizen:setting includes screen-orientation="landscape", context-menu="disable"

## Create Certificate
1. Tools > Certificate Manager.
2. Create a new Certificate Profile (Samsung TV).
3. Assign the profile to this project: Right-click project > Properties > Tizen > Certificate.
4. Make sure the certificate profile is active.

## Build .wgt package
- Right-click the project in the Project Explorer.
- Select Build Signed Package (or Build Package).
- Tizen Studio will generate a .wgt file under:
  - project/.build or project/bin (varies by version) with the widget package.

## Run on TV Emulator
1. Launch the TV Emulator from Tizen Studio:
   - Tools > Emulator Manager > TV Profile > Start an emulator instance (e.g., TV-6.0).
2. After emulator boots, ensure it’s connected (green indicator).
3. Right-click project > Run As > Tizen Web Application.
4. The emulator should install and launch the app automatically.

## Focus and Remote (DPAD) Behavior
- Arrow keys: navigate focus across buttons/cards (implemented in tv-navigation.js).
- Enter/OK: activates focused element via click().
- Back/Escape: handled with tizenhwkey (back) and keydown fallbacks to navigate back logically.
- No reliance on non-TV APIs (no webOS/SAPIs). window.tizen is not required for basic DPAD.

## Common Troubleshooting

1) Project import errors (Malformed IRI or invalid IDs)
- Ensure config.xml widget@id is a valid IRI-like token: id="my.new.project"
- Ensure tizen:application has a valid id, e.g., id="my.new.project.app"
- Profile must be <tizen:profile name="tv" />

2) Icon not found
- The icon path is relative to this folder and must exist: icon.png
- If you customize icons, update both:
  - <icon src="icon.png" />
  - <tizen:icon section="tv" src="icon.png" />

3) App launches but DPAD focus doesn’t move
- Confirm pages include tv-navigation.js before app.js
- Ensure focusable elements have tabindex="0" and data-focusable="true" (home/login pages) or are actual button elements.
- Avoid relying on Tab; DPAD navigation is implemented. We trap Tab to emulate TV feel when testing on desktop.
- Check CSS: excessive focus outlines or :focus styles can be disabled by Tizen CSS. Our styles use border/box-shadow for visibility.

4) Back button doesn’t exit current page
- tv-navigation.js listens for tizenhwkey 'back' and keydown Escape/Backspace.
- Make sure the emulator window has focus and the app is the active scene.
- For home page, back returns to index (splash). From other pages, back returns to home.

5) Build/Run fails due to privileges or features
- Verify privileges include internet if content fetch is needed (present by default).
- Verify features include:
  - http://tizen.org/feature/screen.size.all
  - http://tizen.org/feature/tv

## Notes
- This is a standard Tizen Web App structure. A .tproject file is not required to run; Tizen Studio can import from standard webapp files.
- Key handling is TV-safe and does not require non-TV-specific APIs.

Happy developing!
