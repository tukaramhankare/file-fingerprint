# FileFingerprint

A fully offline, client-side checksum and file-fingerprint verification tool. Runs entirely in the browser — no backend, no external API calls, no network requests of any kind. Files never leave your device.

**Live demo:** https://tukaramhankare.github.io/file-fingerprint/

## What it does

FileFingerprint generates cryptographic checksums for one or many files at once, lets you export those fingerprints for safekeeping, and later re-imports them to verify whether files have changed, gone missing, or been added — using exact-match hash comparison only.

- Select a single folder (including all subfolders) or individual files
- Generate checksums using MD5, SHA-1, SHA-256, and/or SHA-512 — choose any combination
- View per-file results: name, relative path, size, and every computed hash
- Export results as a plain `.txt` file (classic `hash  algorithm  path` format, readable by any tool) or as JSON (`.json` / `.fpj`)
- Import a previously exported fingerprint file and compare it against a fresh scan to detect:
  - **Match** — file is unchanged
  - **Modified** — file exists but its hash has changed
  - **Missing** — file was present before, not found now
  - **New** — file exists now but wasn't in the imported set

## Why no API

Every hash is computed locally using the browser's native Web Crypto API (`crypto.subtle.digest`) for SHA-1/256/512, and a self-contained, dependency-free MD5 implementation (`md5.js`) for MD5 — since Web Crypto doesn't support MD5 natively. There is no server, no build step, and no third-party service involved at any point. The only "API" used is the browser's own built-in JavaScript APIs for reading local files and computing hashes — nothing is sent over a network.

## How to use it

1. Open `index.html` in a modern browser (Chrome or Edge recommended for full folder-selection support).
2. Go to **01 Scan**, select a folder or individual files, choose which hash algorithms to compute, and click **Generate fingerprints**.
3. View results in **02 Results**. Export as `.txt`, `.fpj`, or `.json`.
4. To verify files later, go to **03 Compare / Import**, import a previously exported fingerprint file, run a new scan on the same location, and click **Compare** to see what changed.

## Browser compatibility

Folder selection relies on the `webkitdirectory` attribute, which is well supported in Chrome, Edge, and most Chromium-based browsers. Safari and some Firefox versions have inconsistent support for recursive folder selection — individual file selection works everywhere.

## Files

| File | Purpose |
|---|---|
| `index.html` | App structure and layout |
| `style.css` | Styling, responsive layout for mobile/tablet/desktop |
| `app.js` | Scanning, hashing orchestration, export, import, and comparison logic |
| `md5.js` | Standalone MD5 implementation (RFC 1321), no external dependencies |

## About

Built and maintained by **Tukaram Hankare** — Farmer · Coder · Web Developer, based in Solapur, Maharashtra, India.

- GitHub: https://github.com/tukaramhankare/
- Project showcase: https://tukaramhankare.github.io/master-package/

## License

Apache License 2.0
