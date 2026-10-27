import { NativeModules } from 'react-native';
import { SONY_IRCC_CODES, IrccKey } from '../constants/irccCodes';
import { TvAppInfo } from '../types';

const CLIENT_ID = 'SonyBraviaRemote:iPhone';
const CLIENT_NICKNAME = 'iPhone Remote (Sony BRAVIA)';

let cachedAuthCookie = '';
let activeProtocol: 'androidtv' | 'bravia_http' = 'androidtv';

function getAndroidTvNativeModule(): any | null {
  try {
    return NativeModules?.AndroidTvRemote ?? null;
  } catch {
    return null;
  }
}

export const DEFAULT_ANDROID_TV_APPS: TvAppInfo[] = [
  {
    title: 'YouTube',
    uri: 'https://www.youtube.com',
  },
  {
    title: 'Netflix',
    uri: 'https://www.netflix.com/title',
  },
  {
    title: 'FPT Play',
    uri: 'market://launch?id=com.fplay.activity',
  },
  {
    title: 'VTV Go',
    uri: 'market://launch?id=vn.vtv.vtvgoTV',
  },
  {
    title: 'VieON',
    uri: 'market://launch?id=vn.danet.vieon.tv',
  },
  {
    title: 'TV360 (Viettel)',
    uri: 'market://launch?id=com.viettel.tv360.tv',
  },
  {
    title: 'Spotify',
    uri: 'https://open.spotify.com',
  },
  {
    title: 'Prime Video',
    uri: 'https://app.primevideo.com',
  },
  {
    title: 'Google Play Store',
    uri: 'market://home',
  },
  {
    title: 'Kodi',
    uri: 'market://launch?id=org.xbmc.kodi',
  },
  {
    title: 'VLC Media Player',
    uri: 'market://launch?id=org.videolan.vlc',
  },
  {
    title: 'Plex',
    uri: 'market://launch?id=com.plexapp.android',
  },
];

export function setCachedAuthCookie(cookie?: string) {
  if (cookie) {
    cachedAuthCookie = cookie;
  }
}

export function normalizeIp(ip: string): string {
  return ip.trim().replace(/,/g, '.').replace(/[^0-9.:]/g, '');
}

function encodeBase64(input: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input;
  let output = '';
  for (
    let block = 0, charCode, i = 0, map = chars;
    str.charAt(i | 0) || ((map = '='), i % 1);
    output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
  ) {
    charCode = str.charCodeAt((i += 3 / 4));
    block = (block << 8) | charCode;
  }
  return output;
}

function buildAuthHeaders(psk?: string, extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  if (psk && psk.trim()) {
    headers['X-Auth-PSK'] = psk.trim();
  }
  if (cachedAuthCookie) {
    headers['Cookie'] = cachedAuthCookie;
  }
  return headers;
}

function captureCookieFromResponse(response: Response): string | undefined {
  const setCookie = response.headers.get('set-cookie') || response.headers.get('Set-Cookie');
  if (setCookie) {
    const match = setCookie.match(/auth=[^;]+/);
    const cookieVal = match ? match[0] : setCookie.split(';')[0];
    if (cookieVal) {
      cachedAuthCookie = cookieVal;
      return cookieVal;
    }
  }
  return undefined;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 3500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    captureCookieFromResponse(response);
    return response;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Gửi mã ghép nối (6 ký tự chữ/số hiển thị trên TV Android TV hoặc 4 số Bravia)
 */
export async function requestTvPairing(
  tvIp: string,
  pin?: string
): Promise<{ paired: boolean; needsPin?: boolean; cookie?: string; model?: string; error?: string }> {
  const cleanIp = normalizeIp(tvIp);
  if (!cleanIp) {
    return { paired: false, error: 'Vui lòng nhập địa chỉ IP của TV' };
  }

  const atvMod = getAndroidTvNativeModule();
  if (atvMod && pin && pin.trim()) {
    try {
      const res = await atvMod.sendPairingCode(pin.trim().toUpperCase());
      if (res && res.success) {
        activeProtocol = 'androidtv';
        return {
          paired: true,
          model: res.model || 'Sony BRAVIA KD-49X7500H',
        };
      }
      return {
        paired: false,
        needsPin: true,
        error: res?.error || 'Mã PIN không đúng hoặc đã hết hạn. Hãy bấm Kết nối thử lại để lấy mã mới.',
      };
    } catch (e: any) {
      return {
        paired: false,
        needsPin: true,
        error: e?.message || 'Lỗi xác thực mã PIN với TV',
      };
    }
  }

  // Fallback sang Sony Bravia /sony/accessControl nếu dùng HTTP Bravia
  const url = `http://${cleanIp}/sony/accessControl`;
  const payload = {
    method: 'actRegister',
    id: 1,
    version: '1.0',
    params: [
      {
        clientid: CLIENT_ID,
        nickname: CLIENT_NICKNAME,
        level: 'private',
      },
      [
        {
          value: 'yes',
          function: 'WOL',
        },
      ],
    ],
  };

  const headers: Record<string, string> = buildAuthHeaders('', {
    'Content-Type': 'application/json',
  });

  if (pin && pin.trim()) {
    headers['Authorization'] = `Basic ${encodeBase64(':' + pin.trim())}`;
  }

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      },
      5000
    );

    const newCookie = captureCookieFromResponse(response);

    if (response.ok) {
      activeProtocol = 'bravia_http';
      return { paired: true, cookie: newCookie || cachedAuthCookie };
    }

    if (response.status === 401 || response.status === 403) {
      activeProtocol = 'bravia_http';
      return {
        paired: false,
        needsPin: true,
        error: pin
          ? 'Mã PIN không đúng. Vui lòng nhập lại mã PIN trên màn hình TV.'
          : 'TV đang hiển thị mã PIN trên màn hình. Hãy nhập mã đó vào ô bên dưới!',
      };
    }

    return { paired: false, error: `TV trả về mã HTTP ${response.status}` };
  } catch (e: any) {
    return {
      paired: false,
      error: 'Không thể kết nối tới TV',
    };
  }
}

/**
 * Kiểm tra kết nối tới TV Sony KD-49X7500H:
 * 1. Ưu tiên giao thức Android TV Remote v2 (Cổng 6466 / 6467 — có sẵn trên mọi TV Sony KD-49X7500H không cần bật IP Control).
 * 2. Tự động kiểm tra thêm cổng 8008 (Chromecast/DIAL) và cổng 80 (/sony/system) làm dự phòng.
 */
export async function checkTvConnection(
  tvIp: string,
  psk: string
): Promise<{ success: boolean; model?: string; needsPinPairing?: boolean; cookie?: string; error?: string }> {
  const cleanIp = normalizeIp(tvIp);
  if (!cleanIp) {
    return { success: false, error: 'Vui lòng nhập địa chỉ IP của TV' };
  }

  // 0. Kiểm tra nhanh cổng 8008 (Eureka / Cast Info) để lấy tên TV thật (VD: "TV phòng khách")
  let eurekaTvName = '';
  try {
    const eurekaRes = await fetchWithTimeout(
      `http://${cleanIp}:8008/setup/eureka_info`,
      { method: 'GET' },
      2200
    );
    if (eurekaRes.ok) {
      const eurekaJson = await eurekaRes.json();
      if (eurekaJson && eurekaJson.name) {
        eurekaTvName = `${eurekaJson.name} (Sony KD-49X7500H)`;
      } else {
        eurekaTvName = 'Sony BRAVIA KD-49X7500H';
      }
    }
  } catch {}

  // 1. Thử kết nối qua giao thức gốc Android TV Remote v2 (Port 6466 / 6467) cho Sony KD-49X7500H
  const atvMod = getAndroidTvNativeModule();
  if (atvMod) {
    try {
      const atvRes = await atvMod.connect(cleanIp);
      if (atvRes && atvRes.status === 'connected') {
        activeProtocol = 'androidtv';
        return {
          success: true,
          model: eurekaTvName || atvRes.model || 'Sony BRAVIA KD-49X7500H',
        };
      }
      if (atvRes && atvRes.status === 'waiting_pin') {
        activeProtocol = 'androidtv';
        return {
          success: false,
          needsPinPairing: true,
          model: eurekaTvName || atvRes.model || 'Sony BRAVIA KD-49X7500H',
          error:
            'Màn hình TV Sony vừa hiện mã ghép nối (6 ký tự chữ/số). Hãy nhập mã đó vào ô bên dưới để kết nối!',
        };
      }
    } catch {}
  }

  // 2. Thử kết nối qua cổng 80 (/sony/system) nếu TV hỗ trợ Bravia HTTP hoặc người dùng nhập PSK
  try {
    const response = await fetchWithTimeout(
      `http://${cleanIp}/sony/system`,
      {
        method: 'POST',
        headers: buildAuthHeaders(psk, {
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          method: 'getSystemInformation',
          id: 1,
          params: [],
          version: '1.0',
        }),
      },
      3000
    );

    if (response.ok || response.status === 401 || response.status === 403) {
      activeProtocol = 'bravia_http';
      let model = 'Sony BRAVIA KD-49X7500H';
      try {
        const data = await response.json();
        if (data.result && data.result[0] && data.result[0].model) {
          model = data.result[0].model;
        }
      } catch {}

      if ((!psk || !psk.trim()) && !cachedAuthCookie) {
        const pairResult = await requestTvPairing(cleanIp);
        if (pairResult.paired) {
          return { success: true, model, cookie: pairResult.cookie };
        }
        if (pairResult.needsPin) {
          return {
            success: false,
            model,
            needsPinPairing: true,
            error: pairResult.error,
          };
        }
      }

      return { success: true, model };
    }
  } catch {}

  return {
    success: false,
    error: `Không tìm thấy TV tại IP ${cleanIp}. Hãy đảm bảo TV đang bật, cùng mạng Wi-Fi với iPhone và bạn đã cho phép quyền "Mạng cục bộ (Local Network)" trong Cài đặt iPhone.`,
  };
}

/**
 * Gửi lệnh điều khiển tới TV (Tự động dùng Android TV Remote v2 Port 6466 hoặc Bravia IRCC)
 */
export async function sendIrcc(
  tvIp: string,
  psk: string,
  codeOrKey: IrccKey | string
): Promise<{ success: boolean; error?: string }> {
  const cleanIp = normalizeIp(tvIp);
  if (!cleanIp) {
    return { success: false, error: 'Chưa cấu hình địa chỉ IP của TV' };
  }

  const atvMod = getAndroidTvNativeModule();
  if (atvMod && activeProtocol === 'androidtv') {
    try {
      const res = await atvMod.sendKey(String(codeOrKey));
      if (res && res.success) {
        return { success: true };
      }
    } catch (e: any) {
      // Tự động chuyển tiếp sang Bravia IRCC nếu Android TV Remote tạm gián đoạn
    }
  }

  const irccCode = (SONY_IRCC_CODES as Record<string, string>)[codeOrKey] || codeOrKey;
  const url = `http://${cleanIp}/sony/ircc`;

  const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <s:Body>
    <u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1">
      <IRCCCode>${irccCode}</IRCCCode>
    </u:X_SendIRCC>
  </s:Body>
</s:Envelope>`;

  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: buildAuthHeaders(psk, {
        'Content-Type': 'text/xml; charset=UTF-8',
        SOAPACTION: '"urn:schemas-sony-com:service:IRCC:1#X_SendIRCC"',
      }),
      body: xmlBody,
    });

    if (response.ok) {
      return { success: true };
    }

    return { success: false, error: `Lỗi HTTP ${response.status}` };
  } catch (e: any) {
    return { success: false, error: 'Không thể gửi lệnh tới TV' };
  }
}

/**
 * Lấy danh sách ứng dụng trên TV (Hỗ trợ cả Android TV DeepLink cho KD-49X7500H và /sony/appControl)
 */
export async function getTvApps(
  tvIp: string,
  psk: string
): Promise<{ success: boolean; apps: TvAppInfo[]; error?: string }> {
  const cleanIp = normalizeIp(tvIp);
  if (!cleanIp) {
    return { success: false, apps: DEFAULT_ANDROID_TV_APPS, error: 'Chưa có IP TV' };
  }

  if (activeProtocol === 'androidtv') {
    return { success: true, apps: DEFAULT_ANDROID_TV_APPS };
  }

  const url = `http://${cleanIp}/sony/appControl`;
  const payload = {
    method: 'getApplicationList',
    id: 60,
    params: [],
    version: '1.0',
  };

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: buildAuthHeaders(psk, {
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(payload),
      },
      3500
    );

    if (response.ok) {
      const data = await response.json();
      if (data.result && Array.isArray(data.result[0])) {
        const apps: TvAppInfo[] = data.result[0].map((item: any) => ({
          title: item.title,
          uri: item.uri,
          icon: item.icon,
        }));
        return { success: true, apps };
      }
    }
  } catch {}

  return { success: true, apps: DEFAULT_ANDROID_TV_APPS };
}

/**
 * Khởi chạy một ứng dụng trên TV
 */
export async function launchTvApp(
  tvIp: string,
  psk: string,
  uri: string
): Promise<{ success: boolean; error?: string }> {
  const cleanIp = normalizeIp(tvIp);
  if (!cleanIp) return { success: false, error: 'Chưa có IP TV' };

  const atvMod = getAndroidTvNativeModule();
  if (atvMod && activeProtocol === 'androidtv') {
    try {
      await atvMod.launchApp(uri);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Không thể mở ứng dụng' };
    }
  }

  const url = `http://${cleanIp}/sony/appControl`;
  const payload = {
    method: 'setActiveApp',
    id: 601,
    params: [{ uri }],
    version: '1.0',
  };

  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: buildAuthHeaders(psk, {
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(payload),
    });

    if (response.ok) return { success: true };
    return { success: false, error: `Lỗi ${response.status}` };
  } catch (e: any) {
    return { success: false, error: e.message || 'Lỗi gửi lệnh mở app' };
  }
}

/**
 * Gửi chuỗi ký tự hoặc Link vào TV
 */
export async function sendTextToTv(
  tvIp: string,
  psk: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  const cleanIp = normalizeIp(tvIp);
  if (!cleanIp) return { success: false, error: 'Chưa có IP TV' };

  const atvMod = getAndroidTvNativeModule();
  if (atvMod && activeProtocol === 'androidtv') {
    try {
      await atvMod.sendText(text);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Lỗi gửi văn bản tới TV' };
    }
  }

  const url = `http://${cleanIp}/sony/appControl`;
  const payload = {
    method: 'setTextForm',
    id: 602,
    params: [{ text }],
    version: '1.0',
  };

  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: buildAuthHeaders(psk, {
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(payload),
    });

    if (response.ok) return { success: true };
    return { success: false, error: `TV không trong trạng thái nhập liệu (Mã lỗi ${response.status})` };
  } catch (e: any) {
    return { success: false, error: e.message || 'Lỗi gửi văn bản' };
  }
}
