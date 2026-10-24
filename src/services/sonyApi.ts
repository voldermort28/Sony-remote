import { SONY_IRCC_CODES, IrccKey } from '../constants/irccCodes';
import { TvAppInfo } from '../types';

const CLIENT_ID = 'SonyBraviaRemote:iPhone';
const CLIENT_NICKNAME = 'iPhone Remote (Sony BRAVIA)';

let cachedAuthCookie = '';

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

/**
 * Helper to execute fetch with timeout and cookie support
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 4000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      signal: controller.signal,
    });
    captureCookieFromResponse(response);
    return response;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Gửi yêu cầu ghép nối (actRegister) chỉ cần IP.
 * Nếu TV chưa ghép nối với iPhone này, TV sẽ tự động hiện mã PIN 4 số lên màn hình TV.
 */
export async function requestTvPairing(
  tvIp: string,
  pin?: string
): Promise<{ paired: boolean; needsPin?: boolean; cookie?: string; error?: string }> {
  const cleanIp = normalizeIp(tvIp);
  if (!cleanIp) {
    return { paired: false, error: 'Vui lòng nhập địa chỉ IP của TV' };
  }

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
      6000
    );

    const newCookie = captureCookieFromResponse(response);

    if (response.ok) {
      return { paired: true, cookie: newCookie || cachedAuthCookie };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        paired: false,
        needsPin: true,
        error: pin
          ? 'Mã PIN không đúng hoặc đã hết hạn. Vui lòng nhập mã PIN 4 số mới trên TV.'
          : 'TV đang hiển thị mã PIN 4 số trên màn hình. Hãy nhập mã đó vào ô bên dưới!',
      };
    }

    return { paired: false, error: `TV trả về mã HTTP ${response.status}` };
  } catch (e: any) {
    return {
      paired: false,
      error: e.name === 'AbortError' ? 'Hết thời gian chờ phản hồi từ TV' : 'Không thể kết nối tới TV',
    };
  }
}

/**
 * Gửi lệnh IRCC qua giao thức SOAP XML tới TV Sony BRAVIA (Hỗ trợ cả IP-only Cookie và PSK)
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

    if (response.status === 403 || response.status === 401) {
      return {
        success: false,
        error: 'Chưa ghép nối với TV. Vui lòng vào Cài đặt → Bấm Kết nối để nhập mã PIN trên TV.',
      };
    }

    return { success: false, error: `Lỗi HTTP ${response.status}` };
  } catch (e: any) {
    const message =
      e.name === 'AbortError'
        ? 'Hết thời gian kết nối tới TV (Timeout)'
        : e.message || 'Không thể kết nối tới TV';
    return { success: false, error: message };
  }
}

/**
 * Kiểm tra kết nối tới TV chỉ bằng địa chỉ IP (và tự động kích hoạt ghép nối mã PIN nếu cần)
 */
export async function checkTvConnection(
  tvIp: string,
  psk: string
): Promise<{ success: boolean; model?: string; needsPinPairing?: boolean; cookie?: string; error?: string }> {
  const cleanIp = normalizeIp(tvIp);
  if (!cleanIp) {
    return { success: false, error: 'Vui lòng nhập địa chỉ IP của TV' };
  }

  const url = `http://${cleanIp}/sony/system`;
  const payload = {
    method: 'getSystemInformation',
    id: 1,
    params: [],
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

    if (!response.ok && response.status !== 401 && response.status !== 403) {
      return { success: false, error: `TV trả về mã lỗi HTTP ${response.status}` };
    }

    let model = 'Sony BRAVIA KD-49X7500H';
    try {
      const data = await response.json();
      if (data.result && data.result[0] && data.result[0].model) {
        model = data.result[0].model;
      }
    } catch {}

    // Nếu người dùng không nhập PSK, tự động kiểm tra/đăng ký quyền điều khiển qua IP (actRegister)
    if (!psk || !psk.trim()) {
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
      // Nếu TV không yêu cầu accessControl (Authentication = None), vẫn cho phép kết nối thành công
      return { success: true, model };
    }

    return { success: true, model };
  } catch (e: any) {
    const message =
      e.name === 'AbortError'
        ? `Không tìm thấy TV tại địa chỉ IP ${cleanIp}. Hãy kiểm tra TV đang bật và cùng mạng Wi-Fi.`
        : 'Không thể kết nối. Đảm bảo TV đang bật và iPhone chung mạng Wi-Fi với TV.';
    return { success: false, error: message };
  }
}

/**
 * Lấy danh sách ứng dụng đã cài trên Sony TV qua API /sony/appControl
 */
export async function getTvApps(
  tvIp: string,
  psk: string
): Promise<{ success: boolean; apps: TvAppInfo[]; error?: string }> {
  const cleanIp = normalizeIp(tvIp);
  if (!cleanIp) {
    return { success: false, apps: [], error: 'Chưa có IP TV' };
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
      4500
    );

    if (!response.ok) {
      return { success: false, apps: [], error: `Lỗi ${response.status}` };
    }

    const data = await response.json();
    if (data.result && Array.isArray(data.result[0])) {
      const apps: TvAppInfo[] = data.result[0].map((item: any) => ({
        title: item.title,
        uri: item.uri,
        icon: item.icon,
      }));
      return { success: true, apps };
    }

    return { success: false, apps: [], error: 'Không đọc được danh sách app từ TV' };
  } catch (e: any) {
    return { success: false, apps: [], error: e.message || 'Lỗi kết nối' };
  }
}

/**
 * Khởi chạy một ứng dụng trên TV theo URI
 */
export async function launchTvApp(
  tvIp: string,
  psk: string,
  uri: string
): Promise<{ success: boolean; error?: string }> {
  const cleanIp = normalizeIp(tvIp);
  if (!cleanIp) return { success: false, error: 'Chưa có IP TV' };

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
 * Gửi chuỗi ký tự vào ô Text Form của TV Sony
 */
export async function sendTextToTv(
  tvIp: string,
  psk: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  const cleanIp = normalizeIp(tvIp);
  if (!cleanIp) return { success: false, error: 'Chưa có IP TV' };

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
