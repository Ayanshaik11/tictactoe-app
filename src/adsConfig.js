// Unity Ads configuration
const env = import.meta.env;

export const UNITY = {
  // Test mode ON  -> only test ads (no revenue). Set UNITY_TEST_MODE=false for real ads.
  testMode: (env.VITE_UNITY_TEST_MODE ?? 'true') !== 'false',
  android: {
    // Your real Android Game ID (matches the Unity dashboard).
    gameId: env.VITE_UNITY_ANDROID_GAME_ID || '800436253',
    // Placement IDs MUST match the dashboard exactly (your dashboard uses the BP_ prefix).
    banner: env.VITE_UNITY_ANDROID_BANNER || 'BP_Banner_Android',
    interstitial: env.VITE_UNITY_ANDROID_INTERSTITIAL || 'BP_Interstitial_Android',
    rewarded: env.VITE_UNITY_ANDROID_REWARDED || 'BP_Rewarded_Android',
  },
  ios: {
    gameId: env.VITE_UNITY_IOS_GAME_ID || '7654321',
    banner: env.VITE_UNITY_IOS_BANNER || 'Banner_iOS',
    interstitial: env.VITE_UNITY_IOS_INTERSTITIAL || 'Interstitial_iOS',
    rewarded: env.VITE_UNITY_IOS_REWARDED || 'Rewarded_iOS',
  },
};

export const INTERSTITIAL_EVERY = 3;
