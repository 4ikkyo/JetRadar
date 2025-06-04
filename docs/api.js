// api.js
import { API_BASE_URL } from './config.js';

/**
 * Выполняет fetch с таймаутом (по умолчанию 10 секунд).
 * Если запрос длится дольше – бросает AbortError.
 */
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 10000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Универсальная обёртка для запросов к API.
 * @param {string} endpoint — строка вида '/wallet' или '/wallet/add'
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {Object|null} body — для GET: будет собран в query-параметры, для POST/PUT: JSON-тело
 * @param {number|null} telegramUserId — если требуется передавать Telegram user ID
 * @returns {Promise<Object>} — либо распарсенный JSON, либо { error: true, message, status? }
 */
export async function fetchAPI(endpoint, method = 'GET', body = null, telegramUserId = null) {
  if (!endpoint.startsWith('/')) {
    console.warn(`Endpoint должен начинаться с '/'. Автоматически добавляю слэш.`);
    endpoint = `/${endpoint}`;
  }
  let url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (method === 'GET') {
    const params = new URLSearchParams();
    if (telegramUserId) {
      params.append('telegram_user_id', telegramUserId);
    }
    if (body && typeof body === 'object') {
      Object.entries(body).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          params.append(k, v);
        }
      });
    }
    const qs = params.toString();
    if (qs) {
      url += `?${qs}`;
    }
  } else {
    if (body && typeof body === 'object') {
      options.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetchWithTimeout(url, options);
    if (!response.ok) {
      let errMsg = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errData = await response.json();
        if (errData.detail) {
          errMsg = errData.detail;
        }
      } catch (_) { }
      return { error: true, message: errMsg, status: response.status };
    }
    if (response.status === 204) {
      return { success: true };
    }
    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      return { error: true, message: 'Request timeout' };
    }
    console.error('Fetch API error:', error);
    return { error: true, message: error.message };
  }
}
