// Unity Ads settings. Replace the Game IDs with the ones from the Unity Dashboard
// (or set them as GitHub repository variables, see README).
// Placement IDs below are Unity's defaults; change them if you renamed yours.
const env = import.meta.env;

export const UNITY = {
  testMode: (env.VITE_UNITY_TEST_MODE ?? 'true') !== 'false',
  android: {
    gameId: env.VITE_UNITY_ANDROID_GAME_ID || '1234567',
    banner: 'Banner_Android',
    interstitial: 'Interstitial_Android',
    rewarded: 'Rewarded_Android',
  },
  ios: {
    gameId: env.VITE_UNITY_IOS_GAME_ID || '7654321',
    banner: 'Banner_iOS',
    interstitial: 'Interstitial_iOS',
    rewarded: 'Rewarded_iOS',
  },
};

// Show an interstitial every N finished rounds.
export const INTERSTITIAL_EVERY = 3;
