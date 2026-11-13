import Foundation
import Capacitor
import UnityAds

@objc(UnityAdsPlugin)
public class UnityAdsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "UnityAdsPlugin"
    public let jsName = "UnityAds"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "initialize", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadAd", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showAd", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showBanner", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hideBanner", returnType: CAPPluginReturnPromise)
    ]

    private var banner: UADSBannerView?
    // Keep delegates alive until their callbacks fire
    private var handlers = Set<NSObject>()

    @objc func initialize(_ call: CAPPluginCall) {
        guard let gameId = call.getString("gameId"), !gameId.isEmpty else {
            call.reject("gameId is required"); return
        }
        if UnityAds.isInitialized() { call.resolve(); return }
        let h = InitHandler(call) { [weak self] h in self?.handlers.remove(h) }
        handlers.insert(h)
        UnityAds.initialize(gameId, testMode: call.getBool("testMode") ?? true, initializationDelegate: h)
    }

    @objc func loadAd(_ call: CAPPluginCall) {
        guard let id = call.getString("placementId") else { call.reject("placementId is required"); return }
        let h = LoadHandler(call) { [weak self] h in self?.handlers.remove(h) }
        handlers.insert(h)
        UnityAds.load(id, loadDelegate: h)
    }

    @objc func showAd(_ call: CAPPluginCall) {
        guard let id = call.getString("placementId") else { call.reject("placementId is required"); return }
        DispatchQueue.main.async {
            guard let vc = self.bridge?.viewController else { call.reject("No view controller"); return }
            let h = ShowHandler(call) { [weak self] h in self?.handlers.remove(h) }
            self.handlers.insert(h)
            UnityAds.show(vc, placementId: id, showDelegate: h)
        }
    }

    @objc func showBanner(_ call: CAPPluginCall) {
        guard let id = call.getString("placementId") else { call.reject("placementId is required"); return }
        let w = CGFloat(call.getInt("width") ?? 320)
        let h = CGFloat(call.getInt("height") ?? 50)
        DispatchQueue.main.async {
            guard let root = self.bridge?.viewController?.view else { call.reject("No view"); return }
            self.banner?.removeFromSuperview()
            let b = UADSBannerView(placementId: id, size: CGSize(width: w, height: h))
            b.translatesAutoresizingMaskIntoConstraints = false
            root.addSubview(b)
            NSLayoutConstraint.activate([
                b.centerXAnchor.constraint(equalTo: root.centerXAnchor),
                b.bottomAnchor.constraint(equalTo: root.safeAreaLayoutGuide.bottomAnchor),
                b.widthAnchor.constraint(equalToConstant: w),
                b.heightAnchor.constraint(equalToConstant: h)
            ])
            b.load()
            self.banner = b
            call.resolve()
        }
    }

    @objc func hideBanner(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.banner?.removeFromSuperview()
            self.banner = nil
            call.resolve()
        }
    }
}

private class InitHandler: NSObject, UnityAdsInitializationDelegate {
    let call: CAPPluginCall; let done: (NSObject) -> Void
    init(_ call: CAPPluginCall, _ done: @escaping (NSObject) -> Void) { self.call = call; self.done = done }
    func initializationComplete() { call.resolve(); done(self) }
    func initializationFailed(_ error: UnityAdsInitializationError, withMessage message: String) {
        call.reject("Init failed: \(message)"); done(self)
    }
}

private class LoadHandler: NSObject, UnityAdsLoadDelegate {
    let call: CAPPluginCall; let done: (NSObject) -> Void
    init(_ call: CAPPluginCall, _ done: @escaping (NSObject) -> Void) { self.call = call; self.done = done }
    func unityAdsAdLoaded(_ placementId: String) { call.resolve(); done(self) }
    func unityAdsAdFailed(toLoad placementId: String, withError error: UnityAdsLoadError, withMessage message: String) {
        call.reject("Load failed: \(message)"); done(self)
    }
}

private class ShowHandler: NSObject, UnityAdsShowDelegate {
    let call: CAPPluginCall; let done: (NSObject) -> Void
    init(_ call: CAPPluginCall, _ done: @escaping (NSObject) -> Void) { self.call = call; self.done = done }
    func unityAdsShowComplete(_ placementId: String, withFinish state: UnityAdsShowCompletionState) {
        // 1 == completed, 0 == skipped
        call.resolve(["completed": state.rawValue == 1]); done(self)
    }
    func unityAdsShowFailed(_ placementId: String, withError error: UnityAdsShowError, withMessage message: String) {
        call.reject("Show failed: \(message)"); done(self)
    }
    func unityAdsShowStart(_ placementId: String) {}
    func unityAdsShowClick(_ placementId: String) {}
}
