import { Capacitor, registerPlugin } from '@capacitor/core';
import { UNITY } from './adsConfig';

const UnityAds = registerPlugin('UnityAds');
const platform = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'
export const isNative = Capacitor.isNativePlatform();
const cfg = UNITY[platform];

const ready = { interstitial: false, rewarded: false };
let simulator = null; // used in the browser so the ad UI can be previewed

export const bannerHeight = () => (window.innerWidth >= 728 ? 90 : 50);
export const bannerWidth = () => (window.innerWidth >= 728 ? 728 : 320);

/** Browser only: App registers a function that fakes full-screen ads. */
export function setAdSimulator(fn) {
  simulator = fn;
}

async function preload(kind) {
  if (!isNative) {
    ready[kind] = true;
    return;
  }
  try {
    await UnityAds.loadAd({ placementId: cfg[kind] });
    ready[kind] = true;
  } catch (e) {
    ready[kind] = false;
    setTimeout(() => preload(kind), 15000); // retry later
  }
}

export async function initAds() {
  document.documentElement.style.setProperty('--ad-h', `${bannerHeight()}px`);
  if (!isNative) {
    ready.interstitial = ready.rewarded = true;
    return;
  }
  try {
    await UnityAds.initialize({ gameId: cfg.gameId, testMode: UNITY.testMode });
    UnityAds.showBanner({
      placementId: cfg.banner,
      width: bannerWidth(),
      height: bannerHeight(),
    }).catch(() => {});
    preload('interstitial');
    preload('rewarded');
  } catch (e) {
    console.warn('Unity Ads init failed', e);
  }
}

/** Resolves to 'completed' | 'skipped' | 'unavailable'. */
async function show(kind) {
  if (!isNative) return simulator ? simulator(kind) : 'completed';
  if (!ready[kind]) {
    preload(kind);
    return 'unavailable';
  }
  ready[kind] = false;
  try {
    const r = await UnityAds.showAd({ placementId: cfg[kind] });
    return r && r.completed ? 'completed' : 'skipped';
  } catch (e) {
    return 'unavailable';
  } finally {
    preload(kind);
  }
}

export const showInterstitial = () => show('interstitial');
export const showRewarded = () => show('rewarded');
