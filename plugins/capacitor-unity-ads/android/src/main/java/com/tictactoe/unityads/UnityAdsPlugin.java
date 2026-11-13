package com.tictactoe.unityads;

import android.app.Activity;
import android.util.Log;
import android.view.Gravity;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.widget.FrameLayout;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.unity3d.ads.UnityAds;
import com.unity3d.ads.IUnityAdsInitializationListener;
import com.unity3d.ads.IUnityAdsLoadListener;
import com.unity3d.ads.IUnityAdsShowListener;
import com.unity3d.services.banners.BannerView;
import com.unity3d.services.banners.BannerErrorInfo;
import com.unity3d.services.banners.UnityBannerSize;

@CapacitorPlugin(name = "UnityAds")
public class UnityAdsPlugin extends Plugin {
    private static final String TAG = "UnityAdsPlugin";
    private BannerView bannerView;

    @PluginMethod
    public void initialize(PluginCall call) {
        String gameId = call.getString("gameId");
        Boolean testMode = call.getBoolean("testMode", true);

        if (gameId == null || gameId.trim().isEmpty()) {
            call.reject("Missing Unity Game ID");
            return;
        }

        Log.i(TAG, "Initializing game=" + gameId + " testMode=" + testMode);

        UnityAds.initialize(getContext(), gameId, testMode,
            new IUnityAdsInitializationListener() {
                @Override
                public void onInitializationComplete() {
                    Log.i(TAG, "Initialization successful");
                    call.resolve();
                }

                @Override
                public void onInitializationFailed(
                    UnityAds.UnityAdsInitializationError error,
                    String message
                ) {
                    Log.e(TAG, "Init failed: " + error + " " + message);
                    call.reject("Init failed: " + error + " " + message);
                }
            });
    }

    @PluginMethod
    public void loadAd(PluginCall call) {
        String id = call.getString("placementId");

        if (id == null || id.isEmpty()) {
            call.reject("Missing placement ID");
            return;
        }

        Log.i(TAG, "Loading: " + id);

        UnityAds.load(id, new IUnityAdsLoadListener() {
            @Override
            public void onUnityAdsAdLoaded(String placement) {
                Log.i(TAG, "Loaded: " + placement);
                call.resolve();
            }

            @Override
            public void onUnityAdsFailedToLoad(
                String placement,
                UnityAds.UnityAdsLoadError error,
                String message
            ) {
                Log.e(TAG, "Load failed: " + placement + " " + error + " " + message);
                call.reject("Load failed: " + placement + " " + error + " " + message);
            }
        });
    }

    @PluginMethod
    public void showAd(PluginCall call) {
        String id = call.getString("placementId");
        Activity activity = getActivity();

        if (id == null || id.isEmpty() || activity == null) {
            call.reject("Invalid placement or unavailable Activity");
            return;
        }

        activity.runOnUiThread(() ->
            UnityAds.show(activity, id, new IUnityAdsShowListener() {
                @Override
                public void onUnityAdsShowFailure(
                    String placement,
                    UnityAds.UnityAdsShowError error,
                    String message
                ) {
                    Log.e(TAG, "Show failed: " + placement + " " + error + " " + message);
                    call.reject("Show failed: " + error + " " + message);
                }

                @Override
                public void onUnityAdsShowStart(String placement) {
                    Log.i(TAG, "Show started: " + placement);
                }

                @Override
                public void onUnityAdsShowClick(String placement) {}

                @Override
                public void onUnityAdsShowComplete(
                    String placement,
                    UnityAds.UnityAdsShowCompletionState state
                ) {
                    JSObject result = new JSObject();
                    result.put("completed",
                        state == UnityAds.UnityAdsShowCompletionState.COMPLETED);
                    call.resolve(result);
                }
            })
        );
    }

    @PluginMethod
    public void showBanner(PluginCall call) {
        String id = call.getString("placementId");
        int widthDp = call.getInt("width", 320);
        int heightDp = call.getInt("height", 50);
        Activity activity = getActivity();

        if (id == null || id.isEmpty() || activity == null) {
            call.reject("Invalid banner placement or Activity");
            return;
        }

        activity.runOnUiThread(() -> {
            try {
                if (bannerView != null) {
                    ViewParent parent = bannerView.getParent();
                    if (parent instanceof ViewGroup) {
                        ((ViewGroup) parent).removeView(bannerView);
                    }
                    bannerView.destroy();
                    bannerView = null;
                }

                Log.i(TAG, "Banner request: " + id + " " + widthDp + "x" + heightDp + "dp");

                BannerView view = new BannerView(
                    activity,
                    id,
                    new UnityBannerSize(widthDp, heightDp)
                );

                view.setListener(new BannerView.IListener() {
                    @Override
                    public void onBannerLoaded(BannerView banner) {
                        activity.runOnUiThread(() -> {
                            float density = activity.getResources()
                                .getDisplayMetrics().density;

                            int widthPx = Math.round(widthDp * density);
                            int heightPx = Math.round(heightDp * density);

                            FrameLayout.LayoutParams params =
                                new FrameLayout.LayoutParams(
                                    widthPx,
                                    heightPx,
                                    Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL
                                );

                            activity.addContentView(banner, params);
                            bannerView = banner;

                            Log.i(TAG, "Banner loaded and attached: " + id);
                            call.resolve();
                        });
                    }

                    @Override
                    public void onBannerFailedToLoad(
                        BannerView banner,
                        BannerErrorInfo error
                    ) {
                        Log.e(TAG, "Banner failed: " + id + " " + error.errorMessage);
                        banner.destroy();
                        call.reject("Banner failed: " + error.errorMessage);
                    }

                    @Override
                    public void onBannerShown(BannerView banner) {
                        Log.i(TAG, "Banner shown: " + id);
                    }

                    @Override
                    public void onBannerClick(BannerView banner) {}

                    @Override
                    public void onBannerLeftApplication(BannerView banner) {}
                });

                view.load();

            } catch (Exception e) {
                Log.e(TAG, "Banner exception", e);
                call.reject("Banner exception: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void hideBanner(PluginCall call) {
        Activity activity = getActivity();

        if (activity == null) {
            call.reject("Activity unavailable");
            return;
        }

        activity.runOnUiThread(() -> {
            if (bannerView != null) {
                ViewParent parent = bannerView.getParent();

                if (parent instanceof ViewGroup) {
                    ((ViewGroup) parent).removeView(bannerView);
                }

                bannerView.destroy();
                bannerView = null;
            }

            call.resolve();
        });
    }
}
