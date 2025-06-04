// lang.js
const translations = {
  ru: {
    app_title: 'JetRadar',
    loading_user: 'Загрузка пользователя...',
    test_mode: 'ТЕСТОВЫЙ РЕЖИМ (ID: {id})',

    // Секция «Добавить»
    add_wallet: 'Добавить',
    refresh_watchlist: 'Обновить список',
    loading_wallet_list: 'Загрузка списка кошельков...',
    no_wallets: 'Ваш Watchlist пуст. Добавьте кошелек выше.',
    wallet_list_load_error: 'Не удалось загрузить Watchlist или ошибка сервера.',

    enter_wallet_address: 'Пожалуйста, введите адрес кошелька.',
    invalid_ton_address: 'Адрес кошелька не похож на действительный TON-адрес.',
    telegram_id_missing: 'Ошибка: ID пользователя Telegram не определено.',

    loading: 'Загрузка...',
    add_wallet_success: 'Кошелек успешно добавлен.',
    add_wallet_error: 'Ошибка при добавлении кошелька',

    // Секция «Поиск»
    search: 'Поиск',
    search_min_chars: 'Введите минимум 3 символа для поиска.',
    search_error: 'Ошибка поиска.',
    search_none_found: 'Ничего не найдено.',
    search_loading: 'Поиск...',

    // Секция «Детали»
    loading_tx_history: 'Загрузка истории транзакций...',
    no_tx_history: 'История транзакций пуста.',
    tx_history_error: 'Не удалось загрузить историю транзакций или неверный формат.',

    loading_graph: 'Загрузка графа...',
    graph_data_error: 'Не удалось загрузить данные для графа.',
    no_graph_data: 'Нет данных для построения графа.',
    insufficient_graph_data: 'Недостаточно данных для графа (только исходный кошелек).',

    save: 'Сохранить',
    save_success: 'Метка и группа сохранены.',
    save_error: 'Ошибка при сохранении метки/группы',

    back: 'Назад',

    balance: 'Баланс',
    tx_count: 'Кол-во транзакций',
    last_activity: 'Последняя активность',
    is_scam: 'Скам?',
    alias: 'Метка',
    group: 'Группа',

    placeholder_search: 'Поиск кошелька...',
    placeholder_wallet_address: 'Адрес кошелька',
    placeholder_wallet_alias: 'Метка (опционально)',

    graph: 'Граф транзакций',

    // Для деталей транзакций:
    unknown: 'Неизвестно',
    unknown_date: 'Дата неизвестна',
    no_actions_event: 'Событие без действий',
    ton_transfer: 'TON Transfer',
    jetton_transfer: 'Jetton Transfer',
    nft_transfer: 'NFT Transfer',
    swap_action: 'Swap',
    operation_type: 'Тип операции',
    no_details: 'Детали не указаны',
  },
  uk: {
    app_title: 'JetRadar',
    loading_user: 'Завантаження користувача...',
    test_mode: 'ТЕСТОВИЙ РЕЖИМ (ID: {id})',

    add_wallet: 'Додати',
    refresh_watchlist: 'Оновити список',
    loading_wallet_list: 'Завантаження списку гаманців...',
    no_wallets: 'Ваш Watchlist порожній. Додайте гаманець вище.',
    wallet_list_load_error: 'Не вдалося завантажити Watchlist або помилка сервера.',

    enter_wallet_address: 'Будь ласка, введіть адресу гаманця.',
    invalid_ton_address: 'Адреса гаманця не схожа на дійсну TON-адресу.',
    telegram_id_missing: 'Помилка: ID користувача Telegram не визначено.',

    loading: 'Завантаження...',
    add_wallet_success: 'Гаманець успішно додано.',
    add_wallet_error: 'Помилка при додаванні гаманця',

    search: 'Пошук',
    search_min_chars: 'Введіть мінімум 3 символи для пошуку.',
    search_error: 'Помилка пошуку.',
    search_none_found: 'Нічого не знайдено.',
    search_loading: 'Пошук...',

    loading_tx_history: 'Завантаження історії транзакцій...',
    no_tx_history: 'Історія транзакцій порожня.',
    tx_history_error: 'Не вдалося завантажити історію транзакцій або неправильний формат.',

    loading_graph: 'Завантаження графа...',
    graph_data_error: 'Не вдалося завантажити дані для графа.',
    no_graph_data: 'Немає даних для побудови графа.',
    insufficient_graph_data: 'Недостатньо даних для графа (тільки вихідний гаманець).',

    save: 'Зберегти',
    save_success: 'Мітка та група збережені.',
    save_error: 'Помилка при збереженні мітки/групи',

    back: 'Назад',

    balance: 'Баланс',
    tx_count: 'К-ть транзакцій',
    last_activity: 'Остання активність',
    is_scam: 'Скам?',
    alias: 'Мітка',
    group: 'Група',

    placeholder_search: 'Пошук гаманця...',
    placeholder_wallet_address: 'Адреса гаманця',
    placeholder_wallet_alias: 'Мітка (опціонально)',

    graph: 'Граф транзакцій',

    unknown: 'Невідомо',
    unknown_date: 'Дата невідома',
    no_actions_event: 'Подія без дій',
    ton_transfer: 'TON Transfer',
    jetton_transfer: 'Jetton Transfer',
    nft_transfer: 'NFT Transfer',
    swap_action: 'Swap',
    operation_type: 'Тип операції',
    no_details: 'Деталі не вказані',
  },
  en: {
    app_title: 'JetRadar',
    loading_user: 'Loading user...',
    test_mode: 'TEST MODE (ID: {id})',

    add_wallet: 'Add Wallet',
    refresh_watchlist: 'Refresh List',
    loading_wallet_list: 'Loading wallet list...',
    no_wallets: 'Your watchlist is empty. Add a wallet above.',
    wallet_list_load_error: 'Failed to load watchlist or server error.',

    enter_wallet_address: 'Please enter a wallet address.',
    invalid_ton_address: 'The wallet address does not look like a valid TON address.',
    telegram_id_missing: 'Error: Telegram user ID is not defined.',

    loading: 'Loading...',
    add_wallet_success: 'Wallet added successfully.',
    add_wallet_error: 'Error adding wallet',

    search: 'Search',
    search_min_chars: 'Please enter at least 3 characters to search.',
    search_error: 'Search error.',
    search_none_found: 'Nothing found.',
    search_loading: 'Searching...',

    loading_tx_history: 'Loading transaction history...',
    no_tx_history: 'Transaction history is empty.',
    tx_history_error: 'Failed to load transaction history or invalid format.',

    loading_graph: 'Loading graph...',
    graph_data_error: 'Failed to load graph data.',
    no_graph_data: 'No data to construct a graph.',
    insufficient_graph_data: 'Not enough data for graph (only the source wallet).',

    save: 'Save',
    save_success: 'Alias and group saved.',
    save_error: 'Error saving alias/group',

    back: 'Back',

    balance: 'Balance',
    tx_count: 'Transaction Count',
    last_activity: 'Last Activity',
    is_scam: 'Is Scam?',
    alias: 'Alias',
    group: 'Group',

    placeholder_search: 'Search wallet...',
    placeholder_wallet_address: 'Wallet Address',
    placeholder_wallet_alias: 'Alias (optional)',

    graph: 'Transaction Graph',

    unknown: 'Unknown',
    unknown_date: 'Unknown date',
    no_actions_event: 'Event without actions',
    ton_transfer: 'TON Transfer',
    jetton_transfer: 'Jetton Transfer',
    nft_transfer: 'NFT Transfer',
    swap_action: 'Swap',
    operation_type: 'Operation type',
    no_details: 'No details provided',
  }
};

let currentLang = localStorage.getItem('lang') || 'ru';

/**
 * Получить перевод по ключу, подставить параметры вида {id}.
 * @param {string} key
 * @param {Object} params
 * @returns {string}
 */
export function t(key, params = {}) {
  const dictionary = translations[currentLang];
  if (!dictionary) return key;
  let text = dictionary[key] || key;
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });
  return text;
}

/**
 * Применяет переводы к элементам с data-i18n и data-i18n-placeholder.
 */
export function applyTranslations() {
  const dict = translations[currentLang];
  if (!dict) return;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (dict[key]) el.placeholder = dict[key];
  });
}

/**
 * Инициализирует переключатель языка <select id="languageSwitcher">.
 * Сохраняет выбор в localStorage и сразу применяет переводы.
 */
export function initLanguageSwitcher() {
  const select = document.getElementById('languageSwitcher');
  if (!select) return;
  select.value = currentLang;
  select.addEventListener('change', () => {
    currentLang = select.value;
    localStorage.setItem('lang', currentLang);
    applyTranslations();
  });
}

/**
 * Подставляет тёмную тему, если Telegram WebApp вернул соответствующий параметр.
 */
export function applyTelegramTheme() {
  const themeParams = window.Telegram?.WebApp?.themeParams || {};
  if (
    themeParams.color_scheme === 'dark' ||
    (themeParams.bg_color && themeParams.bg_color.toLowerCase() === '#1c1c1e')
  ) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}
