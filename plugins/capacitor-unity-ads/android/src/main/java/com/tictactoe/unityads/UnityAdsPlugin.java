package com.tictactoe.unityads;

import android.app.Activity;
import android.view.Gravity;
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

    private BannerView bannerView;

    @PluginMethod
    public void initialize(PluginCall call) {
        String gameId = call.getString("gameId");
        Boolean testMode = call.getBoolean("testMode", true);

        if (gameId == null || gameId.isEmpty()) {
            call.reject("Unity Ads Game ID is missing");
            return;
        }

        UnityAds.initialize(
            getContext(),
            gameId,
            testMode,
            new IUnityAdsInitializationListener() {
                @Override
                public void onInitializationComplete() {
                    call.resolve();
                }

                @Override
                public void onInitializationFailed(
                    UnityAds.UnityAdsInitializationError error,
                    String message
                ) {
                    call.reject(message);
                }
            }
        );
    }

    @PluginMethod
    public void loadAd(PluginCall call) {
        String placementId = call.getString("placementId");

        if (placementId == null || placementId.isEmpty()) {
            call.reject("Placement ID is missing");
            return;
        }

        UnityAds.load(placementId, new IUnityAdsLoadListener() {
            @Override
            public void onUnityAdsAdLoaded(String placement) {
                call.resolve();
            }

            @Override
            public void onUnityAdsFailedToLoad(
                String placement,
                UnityAds.UnityAdsLoadError error,
                String message
            ) {
                call.reject(message);
            }
        });
    }

    @PluginMethod
    public void showAd(PluginCall call) {
        String placementId = call.getString("placementId");

        if (placementId == null || placementId.isEmpty()) {
            call.reject("Placement ID is missing");
            return;
        }

        Activity activity = getActivity();

        activity.runOnUiThread(() -> {
            UnityAds.show(activity, placementId, new IUnityAdsShowListener() {
                @Override
                public void onUnityAdsShowFailure(
                    String placement,
                    UnityAds.UnityAdsShowError error,
                    String message
                ) {
                    call.reject(message);
                }

                @Override
                public void onUnityAdsShowStart(String placement) {}

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
            });
        });
    }

    @PluginMethod
    public void showBanner(PluginCall call) {
        String placementId = call.getString("placementId");

        if (placementId == null || placementId.isEmpty()) {
            call.reject("Banner placement ID is missing");
            return;
        }

        int width = call.getInt("width", 320);
        int height = call.getInt("height", 50);

        Activity activity = getActivity();

        activity.runOnUiThread(() -> {
            try {
                if (bannerView != null) {
                    bannerView.destroy();
                    bannerView = null;
                }

                BannerView newBanner = new BannerView(
                    activity,
                    placementId,
                    new UnityBannerSize(width, height)
                );

                newBanner.setListener(new BannerView.IListener() {
                    @Override
                    public void onBannerLoaded(BannerView view) {
                        activity.runOnUiThread(() -> {
                            FrameLayout.LayoutParams params =
                                new FrameLayout.LayoutParams(
                                    width,
                                    height,
                                    Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL
                                );

                            activity.addContentView(view, params);
                            bannerView = view;
                            call.resolve();
                        });
                    }

                    @Override
                    public void onBannerFailedToLoad(
                        BannerView view,
                        BannerErrorInfo errorInfo
                    ) {
                        view.destroy();
                        call.reject("Banner load failed: " + errorInfo.errorMessage);
                    }

                    @Override
                    public void onBannerShown(BannerView view) {}

                    @Override
                    public void onBannerClick(BannerView view) {}

                    @Override
                    public void onBannerLeftApplication(BannerView view) {}
                });

                newBanner.load();

            } catch (Exception e) {
                call.reject("Banner error: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void hideBanner(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (bannerView != null) {
                bannerView.destroy();
                bannerView = null;
            }
            call.resolve();
        });
    }
}
