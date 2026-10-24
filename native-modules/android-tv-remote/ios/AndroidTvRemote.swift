import Foundation
import Security
import AndroidTVRemoteControl

@objc(AndroidTvRemote)
class AndroidTvRemote: RCTEventEmitter {
  private let queue = DispatchQueue(label: "com.bravia.remote.androidtv")
  private var pairingManager: PairingManager?
  private var remoteManager: RemoteManager?
  private var currentHost: String = ""
  private var detectedModel: String = "Sony BRAVIA KD-49X7500H"
  private var isPairedAndConnected: Bool = false
  private var hasListeners: Bool = false

  private var connectResolver: RCTPromiseResolveBlock?
  private var pairingResolver: RCTPromiseResolveBlock?
  private var didTriggerPairingFallback: Bool = false

  private static let certDerBase64 = "MIIDrTCCApWgAwIBAgIUdXqOrzbxY7zFsbNRjRiiOGpEK+AwDQYJKoZIhvcNAQELBQAwZjELMAkGA1UEBhMCVk4xDDAKBgNVBAgMA0hDTTEMMAoGA1UEBwwDSENNMRMwEQYDVQQKDApTb255UmVtb3RlMQwwCgYDVQQLDANpT1MxGDAWBgNVBAMMD2FuZHJvaWR0dnJlbW90ZTAeFw0yNjEwMjQxODI2NDFaFw0zNjEwMjExODI2NDFaMGYxCzAJBgNVBAYTAlZOMQwwCgYDVQQIDANIQ00xDDAKBgNVBAcMA0hDTTETMBEGA1UECgwKU29ueVJlbW90ZTEMMAoGA1UECwwDaU9TMRgwFgYDVQQDDA9hbmRyb2lkdHZyZW1vdGUwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCr6XETBVNO/tWhBpbz/FxsikQQUt3GOObmFnjDHXHQ9k/8U0WJAfQLnSPjUCHROwU2rePZIZ/pubhrmpSBrHXTpSz7x8n6vk9Vd2YoRVTz1eSdhRJ0MZyWz7wKlDFSS8gRRygqYTUw6Eo932WTq7oXCtj47VTFTIxkG+9t05QNByd9aLzNl7z5dieJX2w6VmVhi4QD0f/k4HPH2tSVI9XDZuFTIiyi4U0mtKDLOmziTz2oYYmAowBHqJxXPTF3lydwH3jGPTlZcbNUGXVeSMXNnNWXjOeu8s+J/ELcDPBnPAViz86eTFuH5xmQFjOG1rDKHr4RQIwqmxQQ/aA897DhAgMBAAGjUzBRMB0GA1UdDgQWBBRwoIXvdN/acTJaSNLsQmTB2e1n3DAfBgNVHSMEGDAWgBRwoIXvdN/acTJaSNLsQmTB2e1n3DAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQAx4ZozqU/Ttq7EB/STwUuali+S88npyLMLWRu4IG5Jvjld+luQAzhcZB8Mb8JQuXr+rfC+SGq7/ZaFMGtnUpQA4Aay6th4gAri1aFDV/hoAls/B7jx8rHdn354a9Xx1v7/g7YauLJ/45wZsJn2AEoX8vVjfP4u3Qm7Zi7XygR0QpBgzJ/nWsdouLSzeP7+qM7YhsdZyfjT3qNGC3EvYgTFro4LCdGxBeBbBUY0wJun2F+MNX8IDBp9eR5vEBbo8XJNA14l0kW7cS0Ez3XFrHK+yaY8Vwpi76LBind1K36uVYe3iCPYTowRNwK16SMHP1OOsTfVNQjX7Ss2hlA5+m7f"

  private static let certP12Base64 = "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"

  override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  override func supportedEvents() -> [String]! {
    return ["AndroidTvRemoteState"]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  private func ensureManagersInitialized() {
    if remoteManager != nil && pairingManager != nil {
      return
    }

    let tempDir = FileManager.default.temporaryDirectory
    let derUrl = tempDir.appendingPathComponent("sony_atv_cert.der")
    let p12Url = tempDir.appendingPathComponent("sony_atv_cert.p12")

    if let derData = Data(base64Encoded: AndroidTvRemote.certDerBase64) {
      try? derData.write(to: derUrl, options: .atomic)
    }
    if let p12Data = Data(base64Encoded: AndroidTvRemote.certP12Base64) {
      try? p12Data.write(to: p12Url, options: .atomic)
    }

    let cryptoManager = CryptoManager()
    cryptoManager.clientPublicCertificate = {
      return CertManager().getSecKey(derUrl)
    }

    let tlsManager = TLSManager {
      return CertManager().cert(p12Url, "")
    }

    tlsManager.secTrustClosure = { secTrust in
      cryptoManager.serverPublicCertificate = {
        if #available(iOS 14.0, *) {
          guard let key = SecTrustCopyKey(secTrust) else {
            return .Error(.secTrustCopyKeyError)
          }
          return .Result(key)
        } else {
          guard let key = SecTrustCopyPublicKey(secTrust) else {
            return .Error(.secTrustCopyKeyError)
          }
          return .Result(key)
        }
      }
    }

    pairingManager = PairingManager(tlsManager, cryptoManager, DefaultLogger())
    remoteManager = RemoteManager(
      tlsManager,
      CommandNetwork.DeviceInfo("SonyBraviaRemote", "iPhone", "1.0.0", "com.bravia.remote", "100"),
      DefaultLogger()
    )
  }

  private func resolveConnectOnce(_ payload: [String: Any]) {
    if let resolver = connectResolver {
      connectResolver = nil
      resolver(payload)
    }
  }

  private func resolvePairingOnce(_ payload: [String: Any]) {
    if let resolver = pairingResolver {
      pairingResolver = nil
      resolver(payload)
    }
  }

  @objc func connect(
    _ host: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    queue.async { [weak self] in
      guard let self = self else { return }
      self.ensureManagersInitialized()

      let cleanHost = host.trimmingCharacters(in: .whitespacesAndNewlines)
      self.currentHost = cleanHost
      self.connectResolver = resolve
      self.didTriggerPairingFallback = false

      // Timeout guard after 12 seconds
      self.queue.asyncAfter(deadline: .now() + 12.0) { [weak self] in
        guard let self = self else { return }
        if self.connectResolver != nil {
          self.resolveConnectOnce([
            "status": "error",
            "error": "Hết thời gian kết nối tới TV (\(cleanHost)). Hãy kiểm tra IP TV và Wi-Fi."
          ])
        }
      }

      self.remoteManager?.disconnect()
      self.pairingManager?.disconnect()

      self.remoteManager?.stateChanged = { [weak self] remoteState in
        guard let self = self else { return }
        self.queue.async {
          switch remoteState {
          case .fisrtConfigMessageReceived(let info):
            let vendor = info.vendor.trimmingCharacters(in: .whitespaces)
            let model = info.model.trimmingCharacters(in: .whitespaces)
            if !model.isEmpty {
              self.detectedModel = vendor.isEmpty ? model : "\(vendor) \(model)"
            }
          case .paired(let runningApp):
            self.isPairedAndConnected = true
            self.resolveConnectOnce([
              "status": "connected",
              "model": self.detectedModel,
              "runningApp": runningApp ?? ""
            ])
            self.resolvePairingOnce([
              "success": true,
              "model": self.detectedModel
            ])
            if self.hasListeners {
              self.sendEvent(withName: "AndroidTvRemoteState", body: [
                "state": "connected",
                "model": self.detectedModel
              ])
            }
          case .error(_):
            self.isPairedAndConnected = false
            if !self.didTriggerPairingFallback && self.connectResolver != nil {
              self.didTriggerPairingFallback = true
              self.startPairingFlow(host: cleanHost)
            }
          default:
            break
          }
        }
      }

      self.remoteManager?.connect(cleanHost, timeout: 8)
    }
  }

  private func startPairingFlow(host: String) {
    pairingManager?.disconnect()
    pairingManager?.stateChanged = { [weak self] pairingState in
      guard let self = self else { return }
      self.queue.async {
        switch pairingState {
        case .waitingCode:
          self.resolveConnectOnce([
            "status": "waiting_pin",
            "model": self.detectedModel
          ])
          if self.hasListeners {
            self.sendEvent(withName: "AndroidTvRemoteState", body: [
              "state": "waiting_pin"
            ])
          }
        case .successPaired:
          self.remoteManager?.connect(host, timeout: 10)
          self.queue.asyncAfter(deadline: .now() + 2.5) { [weak self] in
            guard let self = self else { return }
            if self.pairingResolver != nil {
              self.isPairedAndConnected = true
              self.resolvePairingOnce([
                "success": true,
                "model": self.detectedModel
              ])
            }
          }
        case .error(let err):
          if self.connectResolver != nil {
            self.resolveConnectOnce([
              "status": "error",
              "error": "Không thể kết nối tới TV tại IP \(host). Đảm bảo TV đang bật và chung mạng Wi-Fi."
            ])
          }
          if self.pairingResolver != nil {
            // Even if SecretResponse had a varint split, test connecting on port 6466 before failing
            self.remoteManager?.connect(host, timeout: 8)
            self.queue.asyncAfter(deadline: .now() + 2.5) { [weak self] in
              guard let self = self else { return }
              if self.pairingResolver != nil {
                self.resolvePairingOnce([
                  "success": false,
                  "error": "Mã PIN không đúng hoặc đã hết hạn (\(err.localizedDescription)). Hãy thử lại."
                ])
              }
            }
          }
        default:
          break
        }
      }
    }

    pairingManager?.connect(host, "SonyBraviaRemote", "iPhone Remote", timeout: 10)
  }

  @objc func sendPairingCode(
    _ code: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    queue.async { [weak self] in
      guard let self = self else { return }
      let cleanCode = code.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
      self.pairingResolver = resolve

      self.queue.asyncAfter(deadline: .now() + 8.0) { [weak self] in
        guard let self = self else { return }
        if self.pairingResolver != nil {
          if self.isPairedAndConnected {
            self.resolvePairingOnce([
              "success": true,
              "model": self.detectedModel
            ])
          } else {
            self.resolvePairingOnce([
              "success": false,
              "error": "Hết thời gian xác thực mã PIN. Hãy bấm Kết nối thử lại để lấy mã mới."
            ])
          }
        }
      }

      self.pairingManager?.sendSecret(cleanCode)
    }
  }

  private func mapKey(_ keyName: String) -> Key? {
    switch keyName {
    case "Power", "PowerOff", "Standby":
      return .KEYCODE_POWER
    case "Up":
      return .KEYCODE_DPAD_UP
    case "Down":
      return .KEYCODE_DPAD_DOWN
    case "Left":
      return .KEYCODE_DPAD_LEFT
    case "Right":
      return .KEYCODE_DPAD_RIGHT
    case "Confirm", "Enter":
      return .KEYCODE_DPAD_CENTER
    case "Home":
      return .KEYCODE_HOME
    case "Return", "Exit":
      return .KEYCODE_BACK
    case "Options", "ActionMenu":
      return .KEYCODE_MENU
    case "Help":
      return .KEYCODE_INFO
    case "Display":
      return .KEYCODE_GUIDE
    case "VolumeUp":
      return .KEYCODE_VOLUME_UP
    case "VolumeDown":
      return .KEYCODE_VOLUME_DOWN
    case "Mute":
      return .KEYCODE_MUTE
    case "Audio":
      return .KEYCODE_MEDIA_AUDIO_TRACK
    case "ChannelUp":
      return .KEYCODE_CHANNEL_UP
    case "ChannelDown":
      return .KEYCODE_CHANNEL_DOWN
    case "PrevChannel":
      return .KEYCODE_LAST_CHANNEL
    case "Play":
      return .KEYCODE_MEDIA_PLAY
    case "Pause":
      return .KEYCODE_MEDIA_PAUSE
    case "Stop":
      return .KEYCODE_MEDIA_STOP
    case "Rewind":
      return .KEYCODE_MEDIA_REWIND
    case "FastForward":
      return .KEYCODE_MEDIA_FAST_FORWARD
    case "Prev":
      return .KEYCODE_MEDIA_PREVIOUS
    case "Next":
      return .KEYCODE_MEDIA_NEXT
    case "Input":
      return .KEYCODE_TV_INPUT
    case "Hdmi1":
      return .KEYCODE_TV_INPUT_HDMI_1
    case "Hdmi2":
      return .KEYCODE_TV_INPUT_HDMI_2
    case "Hdmi3":
      return .KEYCODE_TV_INPUT_HDMI_3
    case "Hdmi4":
      return .KEYCODE_TV_INPUT_HDMI_4
    case "Red":
      return .KEYCODE_PROG_RED
    case "Green":
      return .KEYCODE_PROG_GREEN
    case "Yellow":
      return .KEYCODE_PROG_YELLOW
    case "Blue":
      return .KEYCODE_PROG_BLUE
    case "Num0":
      return .KEYCODE_0
    case "Num1":
      return .KEYCODE_1
    case "Num2":
      return .KEYCODE_2
    case "Num3":
      return .KEYCODE_3
    case "Num4":
      return .KEYCODE_4
    case "Num5":
      return .KEYCODE_5
    case "Num6":
      return .KEYCODE_6
    case "Num7":
      return .KEYCODE_7
    case "Num8":
      return .KEYCODE_8
    case "Num9":
      return .KEYCODE_9
    case "Dot":
      return .KEYCODE_PERIOD
    case "SubTitle":
      return .KEYCODE_CAPTIONS
    default:
      return nil
    }
  }

  @objc func sendKey(
    _ keyName: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    queue.async { [weak self] in
      guard let self = self else { return }
      self.ensureManagersInitialized()

      if keyName == "Netflix" {
        self.remoteManager?.send(DeepLink("https://www.netflix.com/title"))
        resolve(["success": true])
        return
      }
      if keyName == "YouTube" {
        self.remoteManager?.send(DeepLink("https://www.youtube.com"))
        resolve(["success": true])
        return
      }
      if keyName == "GooglePlay" {
        self.remoteManager?.send(DeepLink("market://home"))
        resolve(["success": true])
        return
      }

      guard let mappedKey = self.mapKey(keyName) else {
        resolve(["success": false, "error": "Phím chưa được hỗ trợ: \(keyName)"])
        return
      }

      if !self.isPairedAndConnected && !self.currentHost.isEmpty {
        self.remoteManager?.connect(self.currentHost, timeout: 6)
        self.queue.asyncAfter(deadline: .now() + 0.6) { [weak self] in
          self?.remoteManager?.send(KeyPress(mappedKey))
          resolve(["success": true])
        }
        return
      }

      self.remoteManager?.send(KeyPress(mappedKey))
      resolve(["success": true])
    }
  }

  @objc func launchApp(
    _ deepLink: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    queue.async { [weak self] in
      guard let self = self else { return }
      self.ensureManagersInitialized()
      self.remoteManager?.send(DeepLink(deepLink))
      resolve(["success": true])
    }
  }

  private func mapCharToKey(_ ch: Character) -> Key? {
    let lower = String(ch).lowercased()
    switch lower {
    case "a": return .KEYCODE_A
    case "b": return .KEYCODE_B
    case "c": return .KEYCODE_C
    case "d": return .KEYCODE_D
    case "e": return .KEYCODE_E
    case "f": return .KEYCODE_F
    case "g": return .KEYCODE_G
    case "h": return .KEYCODE_H
    case "i": return .KEYCODE_I
    case "j": return .KEYCODE_J
    case "k": return .KEYCODE_K
    case "l": return .KEYCODE_L
    case "m": return .KEYCODE_M
    case "n": return .KEYCODE_N
    case "o": return .KEYCODE_O
    case "p": return .KEYCODE_P
    case "q": return .KEYCODE_Q
    case "r": return .KEYCODE_R
    case "s": return .KEYCODE_S
    case "t": return .KEYCODE_T
    case "u": return .KEYCODE_U
    case "v": return .KEYCODE_V
    case "w": return .KEYCODE_W
    case "x": return .KEYCODE_X
    case "y": return .KEYCODE_Y
    case "z": return .KEYCODE_Z
    case "0": return .KEYCODE_0
    case "1": return .KEYCODE_1
    case "2": return .KEYCODE_2
    case "3": return .KEYCODE_3
    case "4": return .KEYCODE_4
    case "5": return .KEYCODE_5
    case "6": return .KEYCODE_6
    case "7": return .KEYCODE_7
    case "8": return .KEYCODE_8
    case "9": return .KEYCODE_9
    case " ": return .KEYCODE_SPACE
    case ".": return .KEYCODE_PERIOD
    case ",": return .KEYCODE_COMMA
    case "-": return .KEYCODE_MINUS
    case "/": return .KEYCODE_SLASH
    case "@": return .KEYCODE_AT
    default: return nil
    }
  }

  @objc func sendText(
    _ text: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    queue.async { [weak self] in
      guard let self = self else { return }
      self.ensureManagersInitialized()
      let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)

      if trimmed.lowercased().hasPrefix("http://") ||
         trimmed.lowercased().hasPrefix("https://") ||
         trimmed.lowercased().hasPrefix("market://") ||
         trimmed.lowercased().hasPrefix("vnd.youtube") {
        self.remoteManager?.send(DeepLink(trimmed))
        resolve(["success": true])
        return
      }

      // Normalize Vietnamese diacritics to ASCII for keycode typing
      let normalized = trimmed.folding(options: .diacriticInsensitive, locale: .current)
        .replacingOccurrences(of: "đ", with: "d")
        .replacingOccurrences(of: "Đ", with: "d")

      let chars = Array(normalized)
      for (index, ch) in chars.enumerated() {
        if let key = self.mapCharToKey(ch) {
          self.queue.asyncAfter(deadline: .now() + Double(index) * 0.06) { [weak self] in
            self?.remoteManager?.send(KeyPress(key))
          }
        }
      }
      resolve(["success": true])
    }
  }

  @objc func disconnect(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    queue.async { [weak self] in
      self?.remoteManager?.disconnect()
      self?.pairingManager?.disconnect()
      self?.isPairedAndConnected = false
      resolve(["success": true])
    }
  }
}
