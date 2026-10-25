import Foundation
import Network
import Security
import CryptoKit
import AndroidTVRemoteControl

@objc(AndroidTvRemote)
class AndroidTvRemote: RCTEventEmitter {
  private let queue = DispatchQueue(label: "com.bravia.remote.androidtv")

  private var remoteConnection: NWConnection?
  private var pairingConnection: NWConnection?

  private var remoteBuffer = Data()
  private var pairingBuffer = Data()

  private var currentHost: String = ""
  private var detectedModel: String = "Sony BRAVIA KD-49X7500H"
  private var isPairedAndConnected: Bool = false
  private var didHandshakeOn6466: Bool = false
  private var hasListeners: Bool = false

  private var connectResolver: RCTPromiseResolveBlock?
  private var pairingResolver: RCTPromiseResolveBlock?
  private var didTriggerPairingFallback: Bool = false
  private var remoteRetryCount: Int = 0
  private var pendingPairingCode: String = ""

  private struct PendingSend {
    let conn: NWConnection
    let lengthData: Data
    let bodyData: Data
  }
  private var pendingSends: [PendingSend] = []
  private var isSendingFrame: Bool = false

  private let cryptoManager = CryptoManager()
  private var pairingTlsManager: TLSManager?
  private var remoteTlsManager: TLSManager?

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
    if pairingTlsManager != nil && remoteTlsManager != nil {
      return
    }

    let docDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first ?? FileManager.default.temporaryDirectory
    let derUrl = docDir.appendingPathComponent("sony_atv_cert.der")
    let p12Url = docDir.appendingPathComponent("sony_atv_cert.p12")

    if let derData = Data(base64Encoded: AndroidTvRemote.certDerBase64) {
      try? derData.write(to: derUrl, options: .atomic)
    }
    if let p12Data = Data(base64Encoded: AndroidTvRemote.certP12Base64) {
      try? p12Data.write(to: p12Url, options: .atomic)
    }

    cryptoManager.clientPublicCertificate = {
      return CertManager().getSecKey(derUrl)
    }

    let pTls = TLSManager {
      return CertManager().cert(p12Url, "")
    }
    pTls.secTrustClosure = { [weak self] secTrust in
      self?.cryptoManager.serverPublicCertificate = {
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
    pairingTlsManager = pTls

    let rTls = TLSManager {
      return CertManager().cert(p12Url, "")
    }
    remoteTlsManager = rTls
  }

  private func makeTlsParameters(forPairing: Bool) -> NWParameters? {
    ensureManagersInitialized()
    let docDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first ?? FileManager.default.temporaryDirectory
    let p12Url = docDir.appendingPathComponent("sony_atv_cert.p12")

    switch CertManager().cert(p12Url, "") {
    case .Result(let rawItems):
      guard let items = rawItems as? [[String: Any]],
            let cfIdentity = items.first?[kSecImportItemIdentity as String] as? CFTypeRef,
            CFGetTypeID(cfIdentity) == SecIdentityGetTypeID() else {
        return nil
      }
      let clientIdentity = cfIdentity as! SecIdentity
      guard let secIdentity = sec_identity_create(clientIdentity) else {
        return nil
      }

      let tlsOptions = NWProtocolTLS.Options()
      sec_protocol_options_set_verify_block(tlsOptions.securityProtocolOptions, { [weak self] (_, sec_trust, completionHandler) in
        if forPairing {
          let serverTrust = sec_trust_copy_ref(sec_trust).takeRetainedValue()
          self?.pairingTlsManager?.secTrustClosure?(serverTrust)
        }
        completionHandler(true)
      }, queue)

      sec_protocol_options_set_challenge_block(tlsOptions.securityProtocolOptions, { (_, completionHandler) in
        completionHandler(secIdentity)
      }, queue)

      let tcpOptions = NWProtocolTCP.Options()
      tcpOptions.enableKeepalive = true
      tcpOptions.keepaliveIdle = 5
      tcpOptions.keepaliveInterval = 5
      tcpOptions.keepaliveCount = 3
      tcpOptions.noDelay = true

      return NWParameters(tls: tlsOptions, tcp: tcpOptions)
    case .Error(_):
      return nil
    }
  }

  // MARK: - Varint Helpers

  private func encodeVarint(_ value: Int) -> [UInt8] {
    if value < 128 {
      return [UInt8(value)]
    }
    var bytes: [UInt8] = []
    var val = value
    while val != 0 {
      var b = UInt8(val & 0x7F)
      val >>= 7
      if val != 0 {
        b |= 0x80
      }
      bytes.append(b)
    }
    return bytes
  }

  private func extractNextFrame(_ buffer: inout Data) -> Data? {
    guard !buffer.isEmpty else { return nil }
    let bytes = [UInt8](buffer)
    var lengthValue = 0
    var shift = 0
    var headerLen = 0

    for i in 0..<min(bytes.count, 5) {
      let b = Int(bytes[i])
      lengthValue |= (b & 0x7F) << shift
      headerLen += 1
      if (b & 0x80) == 0 {
        if lengthValue <= 0 {
          buffer.removeFirst(headerLen)
          return Data()
        }
        if buffer.count >= headerLen + lengthValue {
          let frame = buffer.subdata(in: headerLen..<(headerLen + lengthValue))
          buffer.removeFirst(headerLen + lengthValue)
          return frame
        } else {
          return nil
        }
      }
      shift += 7
    }

    if bytes.count >= 5 {
      buffer.removeAll()
    }
    return nil
  }

  private func isHostMarkedPaired(_ host: String) -> Bool {
    guard !host.isEmpty else { return false }
    return UserDefaults.standard.bool(forKey: "sony_atv_paired_\(host)")
  }

  private func setHostMarkedPaired(_ host: String, _ paired: Bool) {
    guard !host.isEmpty else { return }
    UserDefaults.standard.set(paired, forKey: "sony_atv_paired_\(host)")
  }

  private func sendFramed(_ conn: NWConnection?, payload: [UInt8]) {
    guard let conn = conn, !payload.isEmpty else { return }
    let lengthData = Data(encodeVarint(payload.count))
    let bodyData = Data(payload)
    pendingSends.append(PendingSend(conn: conn, lengthData: lengthData, bodyData: bodyData))
    processNextSend()
  }

  private func processNextSend() {
    guard !isSendingFrame, !pendingSends.isEmpty else { return }
    isSendingFrame = true
    let item = pendingSends.removeFirst()
    item.conn.send(content: item.lengthData, completion: .contentProcessed({ [weak self] err in
      guard let self = self else { return }
      if err != nil {
        self.queue.async {
          self.isSendingFrame = false
          self.processNextSend()
        }
        return
      }
      item.conn.send(content: item.bodyData, completion: .contentProcessed({ [weak self] _ in
        guard let self = self else { return }
        self.queue.async {
          self.isSendingFrame = false
          self.processNextSend()
        }
      }))
    }))
  }

  private func sendFramed(_ conn: NWConnection?, data: Data) {
    sendFramed(conn, payload: [UInt8](data))
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

  // MARK: - React Native Exports

  @objc func connect(
    _ host: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    queue.async { [weak self] in
      guard let self = self else { return }
      self.ensureManagersInitialized()

      let cleanHost = host.trimmingCharacters(in: .whitespacesAndNewlines)
      guard !cleanHost.isEmpty else {
        resolve(["status": "error", "error": "Địa chỉ IP trống"])
        return
      }

      // Nếu đang kết nối ổn định với chính IP này rồi thì KHÔNG ngắt kết nối (tránh làm TV đòi mã PIN mới!)
      if (self.isPairedAndConnected || self.didHandshakeOn6466) && self.currentHost == cleanHost && self.remoteConnection != nil {
        resolve([
          "status": "connected",
          "model": self.detectedModel
        ])
        return
      }

      self.currentHost = cleanHost
      self.connectResolver = resolve
      self.didTriggerPairingFallback = false
      self.remoteRetryCount = 0

      self.queue.asyncAfter(deadline: .now() + 12.0) { [weak self] in
        guard let self = self else { return }
        if self.connectResolver != nil {
          self.resolveConnectOnce([
            "status": "error",
            "error": "Hết thời gian kết nối tới TV (\(cleanHost))."
          ])
        }
      }

      self.startRemoteConnection(host: cleanHost, allowPairingFallback: true)
    }
  }

  // MARK: - Port 6466 (Remote Control Session)

  private func disconnectRemote() {
    remoteConnection?.stateUpdateHandler = nil
    remoteConnection?.cancel()
    remoteConnection = nil
    remoteBuffer.removeAll()
    pendingSends.removeAll()
    isSendingFrame = false
  }

  private func handleRemoteDisconnect(host: String, allowPairingFallback: Bool) {
    let wasConnectedThisSession = self.didHandshakeOn6466 || self.isPairedAndConnected
    self.isPairedAndConnected = false
    self.disconnectRemote()

    if wasConnectedThisSession {
      // Đã từng bắt tay thành công trong phiên này -> Chỉ tự động kết nối lại cổng 6466, TUYỆT ĐỐI KHÔNG gọi cổng 6467 (tránh đòi mã PIN mới)
      self.queue.asyncAfter(deadline: .now() + 1.0) { [weak self] in
        guard let self = self, !self.currentHost.isEmpty, !self.isPairedAndConnected else { return }
        self.startRemoteConnection(host: self.currentHost, allowPairingFallback: false)
      }
      return
    }

    // Nếu trước đó IP này đã lưu trạng thái ghép nối thành công trong UserDefaults, thử kết nối lại cổng 6466 thêm 1 lần trước khi fallback sang 6467
    if self.isHostMarkedPaired(host) && self.remoteRetryCount < 1 {
      self.remoteRetryCount += 1
      self.queue.asyncAfter(deadline: .now() + 0.6) { [weak self] in
        guard let self = self, !self.isPairedAndConnected else { return }
        self.startRemoteConnection(host: host, allowPairingFallback: allowPairingFallback)
      }
      return
    }

    if allowPairingFallback && !self.didTriggerPairingFallback && self.connectResolver != nil {
      self.setHostMarkedPaired(host, false)
      self.didTriggerPairingFallback = true
      self.startPairingFlow(host: host)
    }
  }

  private func startRemoteConnection(host: String, allowPairingFallback: Bool) {
    disconnectRemote()
    didHandshakeOn6466 = false

    guard let tlsParams = makeTlsParameters(forPairing: false) else {
      resolveConnectOnce(["status": "error", "error": "Không thể khởi tạo chứng chỉ TLS"])
      return
    }

    let conn = NWConnection(
      host: NWEndpoint.Host(host),
      port: NWEndpoint.Port(integerLiteral: 6466),
      using: tlsParams
    )
    remoteConnection = conn

    conn.stateUpdateHandler = { [weak self] state in
      guard let self = self else { return }
      self.queue.async {
        switch state {
        case .ready:
          self.receiveRemoteLoop()
        case .waiting(_), .failed(_), .cancelled:
          self.handleRemoteDisconnect(host: host, allowPairingFallback: allowPairingFallback)
        default:
          break
        }
      }
    }

    conn.start(queue: queue)
  }

  private func receiveRemoteLoop() {
    guard let conn = remoteConnection else { return }
    conn.receive(minimumIncompleteLength: 1, maximumLength: 2048) { [weak self] data, _, isComplete, error in
      guard let self = self else { return }
      self.queue.async {
        if let data = data, !data.isEmpty {
          self.remoteBuffer.append(data)
          while let frame = self.extractNextFrame(&self.remoteBuffer) {
            if !frame.isEmpty {
              self.handleRemoteFrame(frame)
            }
          }
        }

        if error != nil || isComplete {
          self.handleRemoteDisconnect(host: self.currentHost, allowPairingFallback: true)
          return
        }

        self.receiveRemoteLoop()
      }
    }
  }

  private func handleRemoteFrame(_ frame: Data) {
    let bytes = [UInt8](frame)
    guard !bytes.isEmpty else { return }

    // Bất kỳ gói tin hợp lệ nào từ cổng 6466 đều chứng tỏ TV đã chấp nhận chứng chỉ ghép nối!
    didHandshakeOn6466 = true
    setHostMarkedPaired(currentHost, true)

    // 1. Kiểm tra gói tin Ping từ TV (tag 0x42 = 66) -> Phản hồi Pong (tag 0x4a = 74) ngay lập tức để giữ kết nối vĩnh viễn
    if bytes[0] == 0x42 {
      replyPong(fromPingFrame: bytes)
      return
    }

    // 2. Gói cấu hình đầu tiên từ TV (tag 0x0a = 10: RemoteConfigure)
    if bytes[0] == 0x0a {
      let devInfo = CommandNetwork.DeviceInfo("SonyBraviaRemote", "Apple", "1.0.0", "com.bravia.remote", "100")
      let firstReq = buildFirstConfigRequest(deviceInfo: devInfo)
      sendFramed(remoteConnection, payload: firstReq)
      return
    }

    // 3. Gói kích hoạt từ TV (tag 0x12 = 18: RemoteSetActive)
    if bytes[0] == 0x12 {
      let secondReq: [UInt8] = [0x12, 0x03, 0x08, 0xee, 0x04]
      sendFramed(remoteConnection, payload: secondReq)
      markRemoteConnected()
      return
    }

    // 4. Các gói trạng thái khác sau khi kết nối (Volume, App hiện tại, Nguồn...)
    if !isPairedAndConnected {
      markRemoteConnected()
    }
  }

  private func replyPong(fromPingFrame bytes: [UInt8]) {
    // Format Ping frame: [0x42, subLen, 0x08, <varint_val1_bytes...>, (optional 0x10, ...)]
    guard bytes.count >= 4, bytes[2] == 0x08 else {
      let fallbackPong: [UInt8] = [0x4a, 0x02, 0x08, 0x00]
      sendFramed(remoteConnection, payload: fallbackPong)
      return
    }

    var val1Bytes: [UInt8] = []
    for i in 3..<bytes.count {
      let b = bytes[i]
      val1Bytes.append(b)
      if (b & 0x80) == 0 {
        break
      }
    }

    var pongPayload: [UInt8] = [0x4a, UInt8(1 + val1Bytes.count), 0x08]
    pongPayload.append(contentsOf: val1Bytes)
    sendFramed(remoteConnection, payload: pongPayload)
  }

  private func buildFirstConfigRequest(deviceInfo: CommandNetwork.DeviceInfo) -> [UInt8] {
    let modelBytes = [UInt8](deviceInfo.model.utf8)
    let vendorBytes = [UInt8](deviceInfo.vendor.utf8)
    let versionBytes = [UInt8](deviceInfo.version.utf8)
    let appNameBytes = [UInt8](deviceInfo.appName.utf8)
    let buildBytes = [UInt8](deviceInfo.appBuild.utf8)

    var inner: [UInt8] = []
    inner.append(0x0a)
    inner.append(contentsOf: encodeVarint(modelBytes.count))
    inner.append(contentsOf: modelBytes)

    inner.append(0x12)
    inner.append(contentsOf: encodeVarint(vendorBytes.count))
    inner.append(contentsOf: vendorBytes)

    inner.append(contentsOf: [0x18, 0x01, 0x22])
    inner.append(contentsOf: encodeVarint(buildBytes.count))
    inner.append(contentsOf: buildBytes)

    inner.append(0x2a)
    inner.append(contentsOf: encodeVarint(appNameBytes.count))
    inner.append(contentsOf: appNameBytes)

    inner.append(0x32)
    inner.append(contentsOf: encodeVarint(versionBytes.count))
    inner.append(contentsOf: versionBytes)

    var outer: [UInt8] = [0x08, 0xee, 0x04, 0x12]
    outer.append(contentsOf: encodeVarint(inner.count))
    outer.append(contentsOf: inner)

    var packet: [UInt8] = [0x0a]
    packet.append(contentsOf: encodeVarint(outer.count))
    packet.append(contentsOf: outer)
    return packet
  }

  private func markRemoteConnected() {
    isPairedAndConnected = true
    setHostMarkedPaired(currentHost, true)
    resolveConnectOnce([
      "status": "connected",
      "model": detectedModel
    ])
    resolvePairingOnce([
      "success": true,
      "model": detectedModel
    ])
    if hasListeners {
      sendEvent(withName: "AndroidTvRemoteState", body: [
        "state": "connected",
        "model": detectedModel
      ])
    }
  }

  // MARK: - Port 6467 (Pairing Session)

  private func disconnectPairing() {
    pairingConnection?.stateUpdateHandler = nil
    pairingConnection?.cancel()
    pairingConnection = nil
    pairingBuffer.removeAll()
    pendingSends.removeAll()
    isSendingFrame = false
  }

  private func startPairingFlow(host: String) {
    disconnectPairing()

    guard let tlsParams = makeTlsParameters(forPairing: true) else {
      resolveConnectOnce([
        "status": "error",
        "error": "Không thể tạo kết nối ghép nối TLS tới TV."
      ])
      return
    }

    let conn = NWConnection(
      host: NWEndpoint.Host(host),
      port: NWEndpoint.Port(integerLiteral: 6467),
      using: tlsParams
    )
    pairingConnection = conn

    conn.stateUpdateHandler = { [weak self] state in
      guard let self = self else { return }
      self.queue.async {
        switch state {
        case .ready:
          // Gửi PairingRequest
          let clientBytes = [UInt8]("SonyBraviaRemote".utf8)
          let serviceBytes = [UInt8]("iPhone Remote".utf8)
          var namesSub: [UInt8] = [0x0a]
          namesSub.append(contentsOf: self.encodeVarint(serviceBytes.count))
          namesSub.append(contentsOf: serviceBytes)
          namesSub.append(0x12)
          namesSub.append(contentsOf: self.encodeVarint(clientBytes.count))
          namesSub.append(contentsOf: clientBytes)

          var req: [UInt8] = [0x10, 0xc8, 0x01, 0x08, 0x02, 0x52]
          req.append(contentsOf: self.encodeVarint(namesSub.count))
          req.append(contentsOf: namesSub)

          self.sendFramed(self.pairingConnection, payload: req)
          self.receivePairingLoop(host: host)

        case .waiting(_), .failed(_), .cancelled:
          self.disconnectPairing()
          if self.connectResolver != nil {
            self.resolveConnectOnce([
              "status": "error",
              "error": "Không thể kết nối tới TV tại IP \(host)."
            ])
          }
        default:
          break
        }
      }
    }

    conn.start(queue: queue)
  }

  private func receivePairingLoop(host: String) {
    guard let conn = pairingConnection else { return }
    conn.receive(minimumIncompleteLength: 1, maximumLength: 1024) { [weak self] data, _, isComplete, error in
      guard let self = self else { return }
      self.queue.async {
        if let data = data, !data.isEmpty {
          self.pairingBuffer.append(data)
          while let frame = self.extractNextFrame(&self.pairingBuffer) {
            if !frame.isEmpty {
              self.handlePairingFrame(frame, host: host)
            }
          }
        }

        if error != nil || isComplete {
          return
        }

        if self.pairingConnection != nil {
          self.receivePairingLoop(host: host)
        }
      }
    }
  }

  private func handlePairingFrame(_ frame: Data, host: String) {
    let bytes = [UInt8](frame)
    // Kiểm tra Status.ok = 200 ([0x10, 0xc8, 0x01])
    let isStatusOk = bytes.count >= 5 && bytes[0] == 0x08 && bytes[1] == 0x02 && bytes[2] == 0x10 && bytes[3] == 0xc8 && bytes[4] == 0x01

    guard isStatusOk else {
      disconnectPairing()
      resolvePairingOnce([
        "success": false,
        "error": "Mã ghép nối không đúng hoặc đã hết hạn trên TV. Hãy bấm Kết nối thử lại."
      ])
      return
    }

    // 1. PairingAck (chứa 0x5a) -> Gửi OptionRequest
    if bytes.contains(0x5a) && !bytes.contains(0xa2) && !bytes.contains(0xfa) && !bytes.contains(0xca) {
      let optionReq: [UInt8] = [0x08, 0x02, 0x10, 0xc8, 0x01, 0xa2, 0x01, 0x08, 0x0a, 0x04, 0x08, 0x03, 0x10, 0x06, 0x18, 0x01]
      sendFramed(pairingConnection, payload: optionReq)
      return
    }

    // 2. OptionAck (chứa 0xa2, 0x01) -> Gửi ConfigurationRequest
    if bytes.count >= 7 && bytes[5] == 0xa2 && bytes[6] == 0x01 {
      let configReq: [UInt8] = [0x08, 0x02, 0x10, 0xc8, 0x01, 0xf2, 0x01, 0x08, 0x0a, 0x04, 0x08, 0x03, 0x10, 0x06, 0x10, 0x01]
      sendFramed(pairingConnection, payload: configReq)
      return
    }

    // 3. ConfigurationAck (chứa 0xfa, 0x01) -> TV đang hiển thị mã PIN 6 ký tự trên màn hình!
    if bytes.count >= 7 && bytes[5] == 0xfa && bytes[6] == 0x01 {
      resolveConnectOnce([
        "status": "waiting_pin",
        "model": detectedModel
      ])
      if hasListeners {
        sendEvent(withName: "AndroidTvRemoteState", body: [
          "state": "waiting_pin"
        ])
      }
      return
    }

    // 4. SecretAck (chứa 0xca, 0x02) -> Đã xác thực mã PIN thành công 100%!
    if bytes.count >= 7 && bytes[5] == 0xca && bytes[6] == 0x02 {
      setHostMarkedPaired(host, true)
      disconnectPairing()
      // Chờ 300ms để TV lưu chứng chỉ vào KeyStore rồi mở kết nối điều khiển bền vững trên cổng 6466
      queue.asyncAfter(deadline: .now() + 0.3) { [weak self] in
        guard let self = self else { return }
        self.startRemoteConnection(host: host, allowPairingFallback: false)
      }
      // Nếu cổng 6466 cần thêm thời gian, đảm bảo resolvePairingOnce được gọi khi hoàn tất
      queue.asyncAfter(deadline: .now() + 2.5) { [weak self] in
        guard let self = self else { return }
        if self.pairingResolver != nil {
          self.isPairedAndConnected = true
          self.resolvePairingOnce([
            "success": true,
            "model": self.detectedModel
          ])
        }
      }
      return
    }
  }

  @objc func sendPairingCode(
    _ code: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    queue.async { [weak self] in
      guard let self = self else { return }
      let cleanCode = code.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
      self.pendingPairingCode = cleanCode
      self.pairingResolver = resolve

      guard let secretBytes = self.computePairingSecret(code: cleanCode) else {
        self.resolvePairingOnce([
          "success": false,
          "error": "Mã ghép nối không hợp lệ (hãy nhập đúng 6 ký tự 0-9, A-F trên TV)."
        ])
        return
      }

      var secretReq: [UInt8] = [0x08, 0x02, 0x10, 0xc8, 0x01, 0xc2, 0x02, UInt8(secretBytes.count + 2), 0x0a, UInt8(secretBytes.count)]
      secretReq.append(contentsOf: secretBytes)
      self.sendFramed(self.pairingConnection, payload: secretReq)

      self.queue.asyncAfter(deadline: .now() + 8.0) { [weak self] in
        guard let self = self else { return }
        if self.pairingResolver != nil {
          if self.isPairedAndConnected || self.didHandshakeOn6466 {
            self.resolvePairingOnce([
              "success": true,
              "model": self.detectedModel
            ])
          } else {
            self.resolvePairingOnce([
              "success": false,
              "error": "Hết thời gian xác thực mã PIN. Hãy bấm Kết nối thử lại."
            ])
          }
        }
      }
    }
  }

  private func computePairingSecret(code: String) -> [UInt8]? {
    guard code.count == 6,
          let firstByte = UInt8(String(code.prefix(2)), radix: 16),
          let secondByte = UInt8(String(code.dropFirst(2).prefix(2)), radix: 16),
          let thirdByte = UInt8(String(code.suffix(2)), radix: 16) else {
      return nil
    }

    guard let clientCertRes = cryptoManager.clientPublicCertificate?(),
          let serverCertRes = cryptoManager.serverPublicCertificate?() else {
      return nil
    }

    guard case .Result(let clientKey) = clientCertRes,
          case .Result(let serverKey) = serverCertRes,
          let clientComp = extractRsaComponents(clientKey),
          let serverComp = extractRsaComponents(serverKey) else {
      return nil
    }

    var sha = CryptoKit.SHA256()
    sha.update(data: clientComp.mod)
    sha.update(data: clientComp.exp)
    sha.update(data: serverComp.mod)
    sha.update(data: serverComp.exp)
    sha.update(data: Data([secondByte, thirdByte]))

    let digest = [UInt8](sha.finalize())
    guard digest.first == firstByte else {
      return nil
    }
    return digest
  }

  private func extractRsaComponents(_ publicKey: SecKey) -> (mod: Data, exp: Data)? {
    guard let attrs = SecKeyCopyAttributes(publicKey) as? [String: Any],
          let keySize = attrs[kSecAttrKeySizeInBits as String] as? Int,
          let pubData = attrs[kSecValueData as String] as? Data,
          pubData.count >= 13 else {
      return nil
    }
    var modulus = pubData.subdata(in: 8..<(pubData.count - 5))
    if modulus.count > keySize / 8 {
      modulus.removeFirst(1)
    }
    let exponent = pubData.subdata(in: (pubData.count - 3)..<pubData.count)
    return (modulus, exponent)
  }

  // MARK: - Key Mapping & Commands

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
        self.sendFramed(self.remoteConnection, data: DeepLink("https://www.netflix.com/title").data)
        resolve(["success": true])
        return
      }
      if keyName == "YouTube" {
        self.sendFramed(self.remoteConnection, data: DeepLink("https://www.youtube.com").data)
        resolve(["success": true])
        return
      }
      if keyName == "GooglePlay" {
        self.sendFramed(self.remoteConnection, data: DeepLink("market://home").data)
        resolve(["success": true])
        return
      }

      guard let mappedKey = self.mapKey(keyName) else {
        resolve(["success": false, "error": "Phím chưa được hỗ trợ: \(keyName)"])
        return
      }

      let keyPacket = KeyPress(mappedKey).data

      if (!self.isPairedAndConnected || self.remoteConnection == nil) && !self.currentHost.isEmpty {
        self.startRemoteConnection(host: self.currentHost, allowPairingFallback: false)
        self.queue.asyncAfter(deadline: .now() + 0.5) { [weak self] in
          guard let self = self else { return }
          self.sendFramed(self.remoteConnection, data: keyPacket)
          resolve(["success": true])
        }
        return
      }

      self.sendFramed(self.remoteConnection, data: keyPacket)
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
      self.sendFramed(self.remoteConnection, data: DeepLink(deepLink).data)
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
        self.sendFramed(self.remoteConnection, data: DeepLink(trimmed).data)
        resolve(["success": true])
        return
      }

      let normalized = trimmed.folding(options: .diacriticInsensitive, locale: .current)
        .replacingOccurrences(of: "đ", with: "d")
        .replacingOccurrences(of: "Đ", with: "d")

      let chars = Array(normalized)
      for (index, ch) in chars.enumerated() {
        if let key = self.mapCharToKey(ch) {
          self.queue.asyncAfter(deadline: .now() + Double(index) * 0.06) { [weak self] in
            guard let self = self else { return }
            self.sendFramed(self.remoteConnection, data: KeyPress(key).data)
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
      self?.disconnectRemote()
      self?.disconnectPairing()
      self?.isPairedAndConnected = false
      resolve(["success": true])
    }
  }
}
