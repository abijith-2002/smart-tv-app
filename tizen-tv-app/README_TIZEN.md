# Tizen TV Web App (Samsung TV, Tizen 9.0)

This folder contains a ready-to-import Tizen TV Web Application project targeting Samsung Smart TV (Tizen 9.0).

Structure:
- config.xml — Tizen Web App manifest (profile=tv, required_version=9.0)
- icons/
  - tizen.png (256x256 app icon)
  - tizen-512.png (512x512 high-res icon)
- web/ — your existing static Smart TV app (index.html, css, js, images, etc.)

Entry point is web/index.html. All asset references should be relative so they work inside the packaged app.

Import and Run in Tizen Studio:
1) Open Tizen Studio.
2) File > Import > Tizen > Tizen Project > Existing Project > Browse… and select the tizen-tv-app folder.
3) After import, right‑click the project > Properties > Tizen > Web:
   - Profile: TV
   - API Version: 9.0
4) Certificates:
   - Tools > Certificate Manager
   - Create a Samsung certificate profile (Author + Distributor/Samsung if targeting real TV).
5) Emulator:
   - Launch the Samsung TV emulator (Tizen 9.0 TV) from Tools > Emulator Manager (or use a real device with Developer Mode).
6) Build and Run:
   - Right‑click the project > Build Project (generates a .wgt)
   - Right‑click the project > Run As > Tizen Web Application
   - Select the TV emulator (or your device) as the target.

Notes:
- Privileges included: 
  - http://tizen.org/privilege/internet
  - http://tizen.org/privilege/tv.inputdevice
- Features included:
  - http://tizen.org/feature/screen.size.large
  - http://tizen.org/feature/tv.samsung (remove if your SDK flags it as unknown)
- App runs full‑screen, landscape, and handles TV remote keys (arrows, Enter/OK, Back). 
- If you need to change app ID or name, edit config.xml (widget@id, <name/>, <tizen:application/>).

Troubleshooting:
- If “feature not recognized” occurs for tv.samsung, delete that <feature> line and rebuild.
- If remote keys don’t respond in the emulator, ensure the emulator window has focus and that hwkey-event is enabled (it is set in config.xml).
- For real devices, ensure Developer Mode is enabled on the TV and the device is added in Device Manager.

Next steps (optional):
- Replace icons/tizen.png and icons/tizen-512.png with your branded PNGs.
- Update author, license, and description fields in config.xml.
