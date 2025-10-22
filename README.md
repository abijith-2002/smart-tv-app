# Samsung-My-TV Zip Packaging

## Download ZIP

Generate a Samsung-My-TV.zip archive at the repository root for easy download.

Preferred (cross‑platform via Node.js):
1) Install dependencies
- npm install

2) Run the zip script
- npm run zip:tizen

3) Result
- A file named Samsung-My-TV.zip will appear at the repository root.

Fallback (macOS/Linux without Node.js):
- Ensure zip is installed (e.g., sudo apt-get install zip or brew install zip)
- Run:
  - bash ./zip_tizen.sh

Windows (PowerShell) alternative without Node.js:
- In PowerShell at the repository root:
  - Compress-Archive -Path "Samsung-My-TV\\*" -DestinationPath "Samsung-My-TV.zip" -Force

Notes:
- The archive contains the Samsung-My-TV directory as the root folder inside the zip.
- Re-running the script overwrites any existing Samsung-My-TV.zip.
