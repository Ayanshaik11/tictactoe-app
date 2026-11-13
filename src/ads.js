import { Capacitor, registerPlugin } from '@capacitor/core';
import { UNITY } from './adsConfig';

const UnityAds = registerPlugin('UnityAds');
const platform = Capacitor.getPlatform();
export const isNative = Capacitor.isNativePlatform();
const cfg = UNITY[platform];

const ready = { interstitial: false, rewarded: false };
let simulator = null;
let initialized = false;
let initializing = false;

export const bannerHeight = () => window.innerWidth >= 728 ? 90 : 50;
export const bannerWidth = () => window.innerWidth >= 728 ? 728 : 320;

function logError(action, error, placementId = '') {
  console.error(`[UnityAds] ${action} failed`, {
    platform,
    gameId: cfg?.gameId,
    placementId,
    testMode: UNITY.testMode,
    error,
  });
}

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
    console.log(`[UnityAds] ${kind} loaded: ${cfg[kind]}`);
  } catch (e) {
    ready[kind] = false;
    logError(`${kind} load`, e, cfg[kind]);
    setTimeout(() => preload(kind), 15000);
  }
}

async function loadBanner() {
  try {
    await UnityAds.showBanner({
      placementId: cfg.banner,
      width: bannerWidth(),
      height: bannerHeight(),
    });
    console.log(`[UnityAds] Banner requested: ${cfg.banner}`);
  } catch (e) {
    logError('Banner load', e, cfg.banner);
    setTimeout(loadBanner, 15000);
  }
}

export async function initAds() {
  document.documentElement.style.setProperty('--ad-h', `${bannerHeight()}px`);

  if (!isNative) {
    ready.interstitial = ready.rewarded = true;
    return;
  }

  if (initialized || initializing) return;
  initializing = true;

  try {
    console.log('[UnityAds] Initializing', {
      platform,
      gameId: cfg.gameId,
      banner: cfg.banner,
      interstitial: cfg.interstitial,
      rewarded: cfg.rewarded,
      testMode: UNITY.testMode,
    });

    await UnityAds.initialize({
      gameId: cfg.gameId,
      testMode: UNITY.testMode,
    });

    initialized = true;
    console.log('[UnityAds] Initialization successful');

    loadBanner();
    preload('interstitial');
    preload('rewarded');
  } catch (e) {
    logError('Initialization', e);
    setTimeout(initAds, 15000);
  } finally {
    initializing = false;
  }
}

async function show(kind) {
  if (!isNative) {
    return simulator ? simulator(kind) : 'completed';
  }

  if (!ready[kind]) {
    preload(kind);
    console.warn(`[UnityAds] ${kind} not ready`);
    return 'unavailable';
  }

  ready[kind] = false;

  try {
    const r = await UnityAds.showAd({ placementId: cfg[kind] });
    return r && r.completed ? 'completed' : 'skipped';
  } catch (e) {
    logError(`${kind} show`, e, cfg[kind]);
    return 'unavailable';
  } finally {
    preload(kind);
  }
}

export const showInterstitial = () => show('interstitial');
export const showRewarded = () => show('rewarded');
