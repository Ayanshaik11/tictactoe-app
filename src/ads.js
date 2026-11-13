import { AdMob, AdmobConsentStatus } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { ADMOB } from './adsConfig';

const native = Capacitor.isNativePlatform();
let initialized = false;
let initializing = null;

const options = (adId) => ({
  adId,
  isTesting: ADMOB.testing,
});

export async function initAds() {
  if (!native || initialized) return;
  if (initializing) return initializing;

  initializing = (async () => {
    try {
      let consent = await AdMob.requestConsentInfo();

      if (
        consent.isConsentFormAvailable &&
        consent.status === AdmobConsentStatus.REQUIRED
      ) {
        consent = await AdMob.showConsentForm();
      }

      if (!consent.canRequestAds) return;

      await AdMob.initialize();
      initialized = true;
      prepareInterstitial();
      prepareRewarded();
    } catch (error) {
      console.error('[AdMob] Initialization:', error);
    } finally {
      initializing = null;
    }
  })();

  return initializing;
}

export async function prepareInterstitial() {
  if (!native || !initialized) return;
  try {
    await AdMob.prepareInterstitial(options(ADMOB.interstitial));
  } catch (error) {
    console.error('[AdMob] Interstitial load:', error);
  }
}

export async function showInterstitial() {
  if (!native || !initialized) return 'unavailable';
  try {
    await AdMob.showInterstitial();
    prepareInterstitial();
    return 'completed';
  } catch (error) {
    console.error('[AdMob] Interstitial show:', error);
    prepareInterstitial();
    return 'unavailable';
  }
}

export async function prepareRewarded() {
  if (!native || !initialized) return;
  try {
    await AdMob.prepareRewardVideoAd(options(ADMOB.rewarded));
  } catch (error) {
    console.error('[AdMob] Rewarded load:', error);
  }
}

export async function showRewarded() {
  if (!native || !initialized) return 'unavailable';
  try {
    const reward = await AdMob.showRewardVideoAd();
    prepareRewarded();
    return reward ? 'completed' : 'skipped';
  } catch (error) {
    console.error('[AdMob] Rewarded show:', error);
    prepareRewarded();
    return 'unavailable';
  }
}
