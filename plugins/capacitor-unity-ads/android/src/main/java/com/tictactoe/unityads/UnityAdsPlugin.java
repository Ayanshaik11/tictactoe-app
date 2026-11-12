package com.tictactoe.unityads;

import android.app.Activity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.unity3d.ads.UnityAds;
import com.unity3d.ads.IUnityAdsInitializationListener;
import com.unity3d.ads.IUnityAdsLoadListener;
import com.unity3d.ads.IUnityAdsShowListener;

@CapacitorPlugin(name = "UnityAds")
public class UnityAdsPlugin extends Plugin {

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

        if (placementId == null) {
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

        if (placementId == null) {
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
        call.resolve();
    }

    @PluginMethod
    public void hideBanner(PluginCall call) {
        call.resolve();
    }
}
