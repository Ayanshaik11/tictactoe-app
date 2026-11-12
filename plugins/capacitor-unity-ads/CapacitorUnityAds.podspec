Pod::Spec.new do |s|
  s.name = 'CapacitorUnityAds'
  s.version = '1.0.0'
  s.summary = 'Unity Ads plugin for Capacitor'
  s.license = 'MIT'
  s.homepage = 'https://github.com/example/capacitor-unity-ads'
  s.author = 'tictactoe'
  s.source = { :git => 'https://github.com/example/capacitor-unity-ads.git', :tag => s.version.to_s }
  s.source_files = 'ios/Sources/**/*.{swift,h,m}'
  s.ios.deployment_target = '13.0'
  s.dependency 'Capacitor'
  s.dependency 'UnityAds', '~> 4.12'
  s.swift_version = '5.1'
end
