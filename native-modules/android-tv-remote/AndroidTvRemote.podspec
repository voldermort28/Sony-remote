Pod::Spec.new do |s|
  s.name         = "AndroidTvRemote"
  s.version      = "1.0.0"
  s.summary      = "Android TV Remote v2 Native Module (Port 6466/6467 mTLS) for Sony BRAVIA Android TV"
  s.homepage     = "https://github.com/voldermort28/Sony-remote"
  s.license      = "MIT"
  s.authors      = "SonyRemote"
  s.platforms    = { :ios => "15.1" }
  s.source       = { :http => "file:///tmp" }
  s.swift_version = "5.0"
  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.dependency "React-Core"
  s.dependency "AndroidTVRemoteControl", "~> 2.4.16"
end
