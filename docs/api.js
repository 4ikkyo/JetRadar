// api.js
// Assuming API_BASE_URL will be correctly imported from a config.js file
// For this example, I'll define it here if config.js is not part of the immediate context.
// import { API_BASE_URL } from './config.js';
const API_BASE_URL = 'http://127.0.0.1:8000'; // Fallback or ensure './config.js' exists and is correct

/**
 * Выполняет fetch с таймаутом (по умолчанию 10 секунд).
 * Если запрос длится дольше – бросает AbortError.
 */
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 10000 } = options; // 10 seconds timeout
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
    // console.error("Fetch timeout or aborted:", err); // Log abort error specifically
    throw err; // Re-throw to be caught by fetchAPI
  }
}

/**
 * Универсальная обёртка для запросов к API.
 * @param {string} endpoint — строка вида '/wallet' или '/wallet/add'
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {Object|null} body — для GET: будет собран в query-параметры, для POST/PUT: JSON-тело
 * @param {string|number|null} telegramUserId — ID пользователя Telegram.
 * Для GET добавляется в query-параметры.
 * Для POST/PUT/DELETE НЕ добавляется автоматически этой функцией;
 * если нужен, он должен быть частью 'body' или добавлен в headers вручную.
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
    headers: {
      'Content-Type': 'application/json',
      // Если ваш Python-сервер требует CORS и куки или специфические заголовки, добавьте их сюда.
      // 'X-Telegram-User-Id': telegramUserId ? String(telegramUserId) : undefined, // Пример добавления как заголовок
    }
  };

  // Удаляем undefined заголовки, если есть
  // for (const key in options.headers) {
  //   if (options.headers[key] === undefined) {
  //     delete options.headers[key];
  //   }
  // }


  if (method === 'GET') {
    const params = new URLSearchParams();
    if (telegramUserId) { // Добавляем telegram_user_id для GET запросов
      params.append('telegram_user_id', String(telegramUserId));
    }
    if (body && typeof body === 'object') {
      Object.entries(body).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          params.append(k, String(v));
        }
      });
    }
    const qs = params.toString();
    if (qs) {
      url += `?${qs}`;
    }
  } else { // POST, PUT, DELETE
    // Для POST/PUT, telegram_user_id должен быть частью объекта `body`, если его ожидает бэкенд в теле.
    // Эта функция fetchAPI его сама в тело не добавляет.
    if (body && typeof body === 'object') {
      options.body = JSON.stringify(body);
    } else if (body) {
        // Если body не объект, но существует (например, просто строка для какого-то редкого случая)
        options.body = body;
    }
  }

  console.log(`Calling API: ${method} ${url}`, body ? `Payload: ${JSON.stringify(body)}` : '');


  try {
    const response = await fetchWithTimeout(url, options); // Используем fetchWithTimeout

    if (!response.ok) {
      let errMsg = `HTTP error ${response.status}: ${response.statusText}`;
      let errData = { message: errMsg }; // default error data
      try {
        // Попытка получить более детальную ошибку из JSON ответа
        const apiError = await response.json();
        if (apiError && (apiError.detail || apiError.message)) {
          errMsg = apiError.detail || apiError.message;
          errData = apiError;
        }
      } catch (e) {
        // Игнорируем ошибку парсинга JSON, если тело ответа не JSON или пустое
        // console.warn("Could not parse error response as JSON:", e);
      }
      console.error(`API Error for ${method} ${url}:`, response.status, errMsg, errData);
      return { error: true, message: errMsg, status: response.status, data: errData };
    }

    if (response.status === 204) { // No Content
      return { success: true, data: null, status: response.status };
    }

    const data = await response.json();
    // console.log(`API Success for ${method} ${url}:`, data);
    return data; // Успешный ответ от API (предполагается, что он не содержит { error: true })

  } catch (error) {
    // console.error(`Network or other error for ${method} ${url}:`, error);
    if (error.name === 'AbortError') {
      return { error: true, message: 'Request timed out after 10 seconds.', status: 408 };
    }
    return { error: true, message: error.message || 'A network error occurred.', status: 0 }; // status 0 for network errors
  }
}