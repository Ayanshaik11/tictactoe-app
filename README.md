# Tic Tac Toe (React + Capacitor)

Simple two-player X/O game built with React, packaged as an Android APK via Capacitor.

## Build the APK with GitHub Actions
1. Push this project to a GitHub repo (branch `main` or `master`).
2. Open the **Actions** tab, then the **Build Android APK** workflow (it also runs on every push; you can start it manually with *Run workflow*).
3. When it finishes, download the **tictactoe-debug-apk** artifact, unzip it and install `app-debug.apk` on your phone.

## Run locally
```
npm install
npm run dev
```

The `android/` folder is generated in CI with `npx cap add android`. To change the app name or ID, edit `capacitor.config.json`.
