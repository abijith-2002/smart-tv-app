# MyProjectTV (Tizen Web TV)

A simple smart TV web app with login and signup flows, DPAD/keyboard navigation, and a home grid.

## Import into Tizen Studio

1. Open Tizen Studio.
2. File > Import > Tizen > Tizen Project.
3. Choose `Select root directory` and browse to:
   `<repo-root>/smart-tv-app/MyProjectTV`
4. Ensure the project `MyProjectTV` is detected and press Finish.

## Run on Emulator or TV

1. Start the Tizen TV Emulator (TV profile).
2. Right-click the `MyProjectTV` project > Run As > Tizen Web Application.

## Project Structure

- config.xml (profile=tv, content=index.html)
- index.html (landing; auto-routes to login or home; no buttons)
- home.html, login.html, signup.html, myplan.html, video-detail.html, video.html
- js/app.js (FocusManager, AppRouter, Toast; DPAD handling)
- css/styles.css, css/style.css
- assets/common.css, assets/images/*
- icons/* (app icons)

## Remote Navigation

- Arrow keys: move focus
- Enter: activate focused item
- Back/Escape: go back (history) or return to home

## Notes

- No references to paths outside `MyProjectTV`. All assets are relative.
- Session is a simple `localStorage` key: `mptv_session`.
- You can zip with Tizen Studio packaging or existing scripts outside this folder if needed.
