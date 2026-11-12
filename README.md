# Tic Tac Toe (React + Capacitor + Unity Ads)

- **vs Computer** (Easy / Medium / Hard – Hard is unbeatable) or **2 Players**
- Unity Ads: **Banner** (bottom), **Interstitial** (every 3 finished rounds), **Rewarded** (Hint button)
- Custom app icon and splash assets stored in `assets/`.
- GitHub Actions builds an **APK** (Android) and an **IPA** (iOS)

## Unity Ads setup
1. In the Unity Dashboard create an Android and an iOS game, copy both **Game IDs**.
2. In GitHub: *Settings > Secrets and variables > Actions > Variables* add
   `UNITY_ANDROID_GAME_ID`, `UNITY_IOS_GAME_ID`, and (for release) `UNITY_TEST_MODE = false`.
3. Placement IDs default to `Banner_Android`, `Interstitial_Android`, `Rewarded_Android` (and `_iOS`). Change them in `src/adsConfig.js` if yours differ.

Keep test mode ON while developing. Before publishing, add a privacy/consent flow (GDPR/ATT) as Unity and the stores require.

## GitHub Actions
Push to `main`/`master` (or run manually) → workflow **Build Android APK + iOS IPA**. Download:
- `tictactoe-android-apk` → `app-debug.apk`
- `tictactoe-ios-ipa` → `tictactoe-unsigned.ipa` (or `tictactoe-signed.ipa` if signing secrets exist)

**iOS signing.** Without secrets the IPA is *unsigned*: it can't be installed directly; re-sign it with Sideloadly / AltStore / your own tooling. For a signed IPA add these secrets: `IOS_CERT_P12_BASE64`, `IOS_CERT_PASSWORD`, `IOS_PROFILE_BASE64`, `IOS_TEAM_ID` (and optional variable `EXPORT_METHOD`: `app-store`, `ad-hoc`, `development`). The bundle ID in `capacitor.config.json` must match your provisioning profile.

## Run locally
```
npm install
npm run dev
```
In the browser the ads are simulated (test banner + fake full-screen ads) so you can see the design.
