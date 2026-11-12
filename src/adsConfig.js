// Unity Ads configuration
const env = import.meta.env;

export const UNITY = {
  testMode: (env.VITE_UNITY_TEST_MODE ?? 'true') !== 'false',
  android: {
    gameId: env.VITE_UNITY_ANDROID_GAME_ID || '800436253',
    banner: 'BP_Banner_Android',
    interstitial: 'BP_Interstitial_Android',
    rewarded: 'BP_Rewarded_Android',
  },
  ios: {
    gameId: env.VITE_UNITY_IOS_GAME_ID || '7654321',
    banner: 'Banner_iOS',
    interstitial: 'Interstitial_iOS',
    rewarded: 'Rewarded_iOS',
  },
};

export const INTERSTITIAL_EVERY = 3;
