import { SONY_IRCC_CODES, IrccKey } from '../constants/irccCodes';
import { TvAppInfo } from '../types';

/**
 * Helper to execute fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 3500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Gửi lệnh IRCC qua giao thức SOAP XML tới TV Sony BRAVIA
 */
export async function sendIrcc(
  tvIp: string,
  psk: string,
  codeOrKey: IrccKey | string
): Promise<{ success: boolean; error?: string }> {
  if (!tvIp) {
    return { success: false, error: 'Chưa cấu hình địa chỉ IP của TV' };
  }

  const irccCode = (SONY_IRCC_CODES as Record<string, string>)[codeOrKey] || codeOrKey;
  const url = `http://${tvIp.trim()}/sony/ircc`;

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
      headers: {
        'Content-Type': 'text/xml; charset=UTF-8',
        SOAPACTION: '"urn:schemas-sony-com:service:IRCC:1#X_SendIRCC"',
        'X-Auth-PSK': psk.trim(),
      },
      body: xmlBody,
    });

    if (response.ok) {
      return { success: true };
    }

    if (response.status === 403 || response.status === 401) {
      return { success: false, error: 'Sai Pre-Shared Key (PSK) hoặc TV từ chối xác thực' };
    }

    return { success: false, error: `Lỗi HTTP ${response.status}` };
  } catch (e: any) {
    const message = e.name === 'AbortError' ? 'Hết thời gian kết nối tới TV (Timeout)' : (e.message || 'Không thể kết nối tới TV');
    return { success: false, error: message };
  }
}

/**
 * Kiểm tra kết nối tới TV và lấy thông tin model TV
 */
export async function checkTvConnection(
  tvIp: string,
  psk: string
): Promise<{ success: boolean; model?: string; error?: string }> {
  if (!tvIp) {
    return { success: false, error: 'Vui lòng nhập IP của TV' };
  }

  const url = `http://${tvIp.trim()}/sony/system`;
  const payload = {
    method: 'getSystemInformation',
    id: 1,
    params: [],
    version: '1.0',
  };

  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-PSK': psk.trim(),
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 403 || response.status === 401) {
      return { success: false, error: 'Sai Pre-Shared Key (PSK). Hãy kiểm tra cài đặt trên TV' };
    }

    if (!response.ok) {
      return { success: false, error: `TV trả về mã lỗi HTTP ${response.status}` };
    }

    const data = await response.json();
    if (data.result && data.result[0]) {
      const model = data.result[0].model || 'Sony BRAVIA TV';
      return { success: true, model };
    }

    return { success: true, model: 'Sony BRAVIA' };
  } catch (e: any) {
    const message = e.name === 'AbortError' ? 'Timeout: Không tìm thấy TV ở IP này' : 'Không thể kết nối. Đảm bảo TV đã bật và cùng mạng Wi-Fi';
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
  if (!tvIp) {
    return { success: false, apps: [], error: 'Chưa có IP TV' };
  }

  const url = `http://${tvIp.trim()}/sony/appControl`;
  const payload = {
    method: 'getApplicationList',
    id: 60,
    params: [],
    version: '1.0',
  };

  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-PSK': psk.trim(),
      },
      body: JSON.stringify(payload),
    }, 4500);

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
  if (!tvIp) return { success: false, error: 'Chưa có IP TV' };

  const url = `http://${tvIp.trim()}/sony/appControl`;
  const payload = {
    method: 'setActiveApp',
    id: 601,
    params: [{ uri }],
    version: '1.0',
  };

  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-PSK': psk.trim(),
      },
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
  if (!tvIp) return { success: false, error: 'Chưa có IP TV' };

  const url = `http://${tvIp.trim()}/sony/appControl`;
  const payload = {
    method: 'setTextForm',
    id: 602,
    params: [{ text }],
    version: '1.0',
  };

  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-PSK': psk.trim(),
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) return { success: true };
    return { success: false, error: `TV không trong trạng thái nhập liệu (Mã lỗi ${response.status})` };
  } catch (e: any) {
    return { success: false, error: e.message || 'Lỗi gửi văn bản' };
  }
}
