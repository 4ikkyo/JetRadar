// lang.js

// Импортируем ui для доступа к setLoadingState, если он будет использоваться здесь
// import { ui, setLoadingState } from './uiElements.js'; // setLoadingState здесь не нужен

const translations = {
  ru: {
    app_title: 'JetRadar',
    loading_user: 'Загрузка пользователя...',
    test_mode: 'ТЕСТОВЫЙ РЕЖИМ (ID: {id})',
    loading: 'Загрузка...',
    error_generic: 'Произошла ошибка. Попробуйте еще раз.',

    // Секция «Добавить»
    add_wallet_header: 'Добавить кошелек',
    add_wallet: 'Добавить',
    refresh_watchlist: 'Обновить',
    loading_wallet_list: 'Загрузка списка кошельков...',
    no_wallets: 'Ваш список наблюдения пуст. Добавьте кошелек.',
    wallet_list_load_error: 'Не удалось загрузить список наблюдения.',
    enter_wallet_address: 'Пожалуйста, введите адрес кошелька.',
    invalid_ton_address: 'Неверный формат TON адреса.',
    telegram_id_missing: 'Ошибка: ID пользователя Telegram не определен.',
    telegram_id_missing_on_init: 'Не удалось определить пользователя Telegram при инициализации.',
    add_wallet_success: 'Кошелек успешно добавлен.',
    add_wallet_error: 'Ошибка при добавлении кошелька: {message}',

    // Секция «Поиск»
    search_header: 'Поиск кошелька',
    search: 'Поиск',
    search_min_chars: 'Введите минимум 3 символа для поиска.',
    search_error: 'Ошибка поиска.',
    search_none_found: 'Ничего не найдено.',
    search_loading: 'Поиск...',
    placeholder_search: 'Поиск по адресу или метке...',
    placeholder_wallet_address: 'Адрес кошелька (UQ... или EQ...)',
    placeholder_wallet_alias: 'Метка (опционально)',
    placeholder_wallet_group: 'Группа (опционально)',

    // Секция «Watchlist»
    watchlist_header: 'Список наблюдения',

    // Секция «Детали»
    wallet_details_header: 'Детали кошелька',
    address_label: 'Адрес',
    balance: 'Баланс',
    tx_count: 'Кол-во транзакций',
    last_activity: 'Последняя активность',
    is_scam: 'Скам?',
    alias: 'Метка',
    group: 'Группа',
    edit_alias_group_header: 'Изменить метку/группу',
    save: 'Сохранить изменения',
    save_success: 'Метка и группа сохранены.',
    save_error: 'Ошибка при сохранении: {message}',
    back_to_watchlist: 'Назад к списку', // Для кнопки Telegram

    // История транзакций
    tx_history_header: 'История транзакций',
    tx_latest: 'последние',
    loading_tx_history: 'Загрузка истории транзакций...',
    no_tx_history: 'История транзакций пуста.',
    no_tx_matching_filters: 'Нет транзакций, соответствующих фильтрам.',
    tx_history_error: 'Не удалось загрузить историю транзакций.',
    sort_desc: 'Сначала новые',
    sort_asc: 'Сначала старые',
    filter_all_types: 'Все типы',
    filter_ton: 'TON переводы',
    filter_jetton_transfers: 'Jetton переводы',
    filter_swaps: 'Обмены',
    filter_nft: 'NFT переводы',
    tx_fee: 'Комиссия',
    tx_sender: 'Отправитель',
    tx_recipient: 'Получатель',
    tx_comment: 'Комментарий',
    tx_details_ton_sent: '{amount} TON отправлено {to}',
    tx_details_ton_received: '{amount} TON получено от {from}',
    tx_details_jetton_sent: '{amount} {symbol} отправлено {to}',
    tx_details_jetton_received: '{amount} {symbol} получено от {from}',
    tx_details_nft_sent: 'NFT "{name}" отправлен {to}',
    tx_details_nft_received: 'NFT "{name}" получен от {from}',
    tx_details_swap: 'Обмен {amountIn} {symbolIn} на {amountOut} {symbolOut}',
    tx_type_TonTransfer: 'Перевод TON',
    tx_type_JettonTransfer: 'Перевод Jetton',
    tx_type_NftTransfer: 'Перевод NFT',
    tx_type_JettonSwap: 'Обмен Jetton',
    tx_type_Unknown: 'Неизвестная операция',


    // Граф
    graph_header: 'Граф транзакций',
    loading_graph: 'Загрузка графа...',
    graph_data_error: 'Не удалось загрузить данные для графа. {message}',
    no_graph_data: 'Нет данных для построения графа.',
    insufficient_graph_data: 'Недостаточно данных для графа.',
    filter_incoming: 'Входящие',
    filter_outgoing: 'Исходящие',
    filter_jetton_only: 'Только Jetton',
    min_amount_placeholder: 'Мин. сумма TON',
    apply_filters: 'Применить',
    graph_node_tooltip_title: 'Адрес: {address}',
    graph_node_tooltip_alias: 'Метка: {alias}',
    graph_node_tooltip_in_tx: 'Входящих TX: {count} ({volume} TON)',
    graph_node_tooltip_out_tx: 'Исходящих TX: {count} ({volume} TON)',
    graph_edge_tooltip_volume: 'Объем: {volume}',
    graph_edge_tooltip_count: 'Транзакций: {count}',


    // Общие UI элементы
    close: 'Закрыть',
    confirm_delete_wallet_title: 'Удалить кошелек?',
    confirm_delete_wallet_text: 'Вы уверены, что хотите удалить кошелек {aliasOrAddress} из списка наблюдения?',
    delete: 'Удалить',
    cancel: 'Отмена',
    wallet_deleted_success: 'Кошелек удален.',
    wallet_deleted_error: 'Ошибка при удалении кошелька.',
  },
  uk: {
    // ... Украинские переводы ...
    app_title: 'JetRadar',
    loading_user: 'Завантаження користувача...',
    test_mode: 'ТЕСТОВИЙ РЕЖИМ (ID: {id})',
    loading: 'Завантаження...',
    error_generic: 'Сталася помилка. Спробуйте ще раз.',
    add_wallet_header: 'Додати гаманець',
    add_wallet: 'Додати',
    refresh_watchlist: 'Оновити',
    loading_wallet_list: 'Завантаження списку гаманців...',
    no_wallets: 'Ваш список спостереження порожній. Додайте гаманець.',
    wallet_list_load_error: 'Не вдалося завантажити список спостереження.',
    enter_wallet_address: 'Будь ласка, введіть адресу гаманця.',
    invalid_ton_address: 'Невірний формат TON адреси.',
    telegram_id_missing: 'Помилка: ID користувача Telegram не визначено.',
    telegram_id_missing_on_init: 'Не вдалося визначити користувача Telegram під час ініціалізації.',
    add_wallet_success: 'Гаманець успішно додано.',
    add_wallet_error: 'Помилка при додаванні гаманця: {message}',
    search_header: 'Пошук гаманця',
    search: 'Пошук',
    search_min_chars: 'Введіть мінімум 3 символи для пошуку.',
    search_error: 'Помилка пошуку.',
    search_none_found: 'Нічого не знайдено.',
    search_loading: 'Пошук...',
    placeholder_search: 'Пошук за адресою або міткою...',
    placeholder_wallet_address: 'Адреса гаманця (UQ... або EQ...)',
    placeholder_wallet_alias: 'Мітка (опціонально)',
    placeholder_wallet_group: 'Група (опціонально)',
    watchlist_header: 'Список спостереження',
    wallet_details_header: 'Деталі гаманця',
    address_label: 'Адреса',
    balance: 'Баланс',
    tx_count: 'К-ть транзакцій',
    last_activity: 'Остання активність',
    is_scam: 'Скам?',
    alias: 'Мітка',
    group: 'Група',
    edit_alias_group_header: 'Змінити мітку/групу',
    save: 'Зберегти зміни',
    save_success: 'Мітку та групу збережено.',
    save_error: 'Помилка при збереженні: {message}',
    back_to_watchlist: 'Назад до списку',
    tx_history_header: 'Історія транзакцій',
    tx_latest: 'останні',
    loading_tx_history: 'Завантаження історії транзакцій...',
    no_tx_history: 'Історія транзакцій порожня.',
    no_tx_matching_filters: 'Немає транзакцій, що відповідають фільтрам.',
    tx_history_error: 'Не вдалося завантажити історію транзакцій.',
    sort_desc: 'Спочатку нові',
    sort_asc: 'Спочатку старі',
    filter_all_types: 'Всі типи',
    filter_ton: 'TON перекази',
    filter_jetton_transfers: 'Jetton перекази',
    filter_swaps: 'Обміни',
    filter_nft: 'NFT перекази',
    tx_fee: 'Комісія',
    tx_sender: 'Відправник',
    tx_recipient: 'Отримувач',
    tx_comment: 'Коментар',
    tx_type_TonTransfer: 'Переказ TON',
    tx_type_JettonTransfer: 'Переказ Jetton',
    tx_type_NftTransfer: 'Переказ NFT',
    tx_type_JettonSwap: 'Обмін Jetton',
    tx_type_Unknown: 'Невідома операція',
    graph_header: 'Граф транзакцій',
    loading_graph: 'Завантаження графа...',
    graph_data_error: 'Не вдалося завантажити дані для графа. {message}',
    no_graph_data: 'Немає даних для побудови графа.',
    insufficient_graph_data: 'Недостатньо даних для графа.',
    filter_incoming: 'Вхідні',
    filter_outgoing: 'Вихідні',
    filter_jetton_only: 'Лише Jetton',
    min_amount_placeholder: 'Мін. сума TON',
    apply_filters: 'Застосувати',
    close: 'Закрити',
    confirm_delete_wallet_title: 'Видалити гаманець?',
    confirm_delete_wallet_text: 'Ви впевнені, що хочете видалити гаманець {aliasOrAddress} зі списку спостереження?',
    delete: 'Видалити',
    cancel: 'Скасувати',
    wallet_deleted_success: 'Гаманець видалено.',
    wallet_deleted_error: 'Помилка при видаленні гаманця.',
  },
  en: {
    // ... English translations ...
    app_title: 'JetRadar',
    loading_user: 'Loading user...',
    test_mode: 'TEST MODE (ID: {id})',
    loading: 'Loading...',
    error_generic: 'An error occurred. Please try again.',
    add_wallet_header: 'Add Wallet',
    add_wallet: 'Add',
    refresh_watchlist: 'Refresh',
    loading_wallet_list: 'Loading watchlist...',
    no_wallets: 'Your watchlist is empty. Add a wallet.',
    wallet_list_load_error: 'Failed to load watchlist.',
    enter_wallet_address: 'Please enter a wallet address.',
    invalid_ton_address: 'Invalid TON address format.',
    telegram_id_missing: 'Error: Telegram User ID not defined.',
    telegram_id_missing_on_init: 'Failed to determine Telegram user during initialization.',
    add_wallet_success: 'Wallet added successfully.',
    add_wallet_error: 'Error adding wallet: {message}',
    search_header: 'Search Wallet',
    search: 'Search',
    search_min_chars: 'Enter at least 3 characters to search.',
    search_error: 'Search error.',
    search_none_found: 'Nothing found.',
    search_loading: 'Searching...',
    placeholder_search: 'Search by address or alias...',
    placeholder_wallet_address: 'Wallet Address (UQ... or EQ...)',
    placeholder_wallet_alias: 'Alias (optional)',
    placeholder_wallet_group: 'Group (optional)',
    watchlist_header: 'Watchlist',
    wallet_details_header: 'Wallet Details',
    address_label: 'Address',
    balance: 'Balance',
    tx_count: 'Transactions',
    last_activity: 'Last Activity',
    is_scam: 'Scam?',
    alias: 'Alias',
    group: 'Group',
    edit_alias_group_header: 'Edit Alias/Group',
    save: 'Save Changes',
    save_success: 'Alias and group saved.',
    save_error: 'Error saving: {message}',
    back_to_watchlist: 'Back to Watchlist',
    tx_history_header: 'Transaction History',
    tx_latest: 'latest',
    loading_tx_history: 'Loading transaction history...',
    no_tx_history: 'Transaction history is empty.',
    no_tx_matching_filters: 'No transactions match the filters.',
    tx_history_error: 'Failed to load transaction history.',
    sort_desc: 'Newest first',
    sort_asc: 'Oldest first',
    filter_all_types: 'All types',
    filter_ton: 'TON Transfers',
    filter_jetton_transfers: 'Jetton Transfers',
    filter_swaps: 'Swaps',
    filter_nft: 'NFT Transfers',
    tx_fee: 'Fee',
    tx_sender: 'Sender',
    tx_recipient: 'Recipient',
    tx_comment: 'Comment',
    tx_type_TonTransfer: 'TON Transfer',
    tx_type_JettonTransfer: 'Jetton Transfer',
    tx_type_NftTransfer: 'NFT Transfer',
    tx_type_JettonSwap: 'Jetton Swap',
    tx_type_Unknown: 'Unknown Operation',
    graph_header: 'Transaction Graph',
    loading_graph: 'Loading graph...',
    graph_data_error: 'Failed to load graph data. {message}',
    no_graph_data: 'No data to build graph.',
    insufficient_graph_data: 'Not enough data for graph.',
    filter_incoming: 'Incoming',
    filter_outgoing: 'Outgoing',
    filter_jetton_only: 'Jetton only',
    min_amount_placeholder: 'Min TON amount',
    apply_filters: 'Apply',
    close: 'Close',
    confirm_delete_wallet_title: 'Delete Wallet?',
    confirm_delete_wallet_text: 'Are you sure you want to delete wallet {aliasOrAddress} from your watchlist?',
    delete: 'Delete',
    cancel: 'Cancel',
    wallet_deleted_success: 'Wallet deleted.',
    wallet_deleted_error: 'Error deleting wallet.',
  }
};

let currentLang = localStorage.getItem('jetradar_lang') || 'ru';

/**
 * Получить перевод по ключу, подставить параметры вида {id}.
 * @param {string} key
 * @param {Object<string, string|number>} [params={}]
 * @returns {string}
 */
export function t(key, params = {}) {
  const dictionary = translations[currentLang] || translations.en; // Fallback to English
  let text = dictionary[key] || key; // Fallback to key itself if not found
  Object.keys(params).forEach(paramKey => {
    text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(params[paramKey]));
  });
  return text;
}

/**
 * Применяет переводы к элементам с data-i18n и data-i18n-placeholder.
 */
export function applyTranslations() {
  const dict = translations[currentLang] || translations.en;
  if (!dict) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key]) el.textContent = t(key); // Use t() for potential params in future
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (dict[key] && el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.placeholder = t(key);
    }
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    if (dict[key] && el instanceof HTMLElement) {
        el.title = t(key);
    }
  });
  // Обновляем заголовок страницы
  document.title = t('app_title');
}

/**
 * Инициализирует переключатель языка <select id="languageSwitcher">.
 * Сохраняет выбор в localStorage и сразу применяет переводы.
 */
export function initLanguageSwitcher() {
  const select = document.getElementById('languageSwitcher');
  if (!select) return;
  select.value = currentLang;
  select.addEventListener('change', (event) => {
    if (event.target instanceof HTMLSelectElement) {
        currentLang = event.target.value;
        localStorage.setItem('jetradar_lang', currentLang);
        applyTranslations();
        // Опционально: уведомить другие части приложения о смене языка, если нужно
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: currentLang } }));
    }
  });
}

/**
 * Применяет тему Telegram (светлую/темную) к CSS переменным.
 */
export function applyTelegramTheme() {
  const tg = window.Telegram?.WebApp;
  if (!tg) {
    console.warn('Telegram WebApp object not found. Using default light theme.');
    document.documentElement.setAttribute('data-theme', 'light'); // Default
    return;
  }

  const themeParams = tg.themeParams;
  const colorScheme = tg.colorScheme; // 'light' or 'dark'

  // Устанавливаем data-theme атрибут для CSS :root[data-theme="dark"]
  document.documentElement.setAttribute('data-theme', colorScheme);

  // Обновляем CSS переменные напрямую из themeParams
  // Это дает более точное соответствие теме Telegram
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty('--tg-theme-bg-color', themeParams.bg_color || (colorScheme === 'dark' ? '#000000' : '#F9F9F9'));
  rootStyle.setProperty('--tg-theme-text-color', themeParams.text_color || (colorScheme === 'dark' ? '#FFFFFF' : '#000000'));
  rootStyle.setProperty('--tg-theme-hint-color', themeParams.hint_color || (colorScheme === 'dark' ? '#8D8D93' : '#8A8A8E'));
  rootStyle.setProperty('--tg-theme-link-color', themeParams.link_color || '#007AFF');
  rootStyle.setProperty('--tg-theme-button-color', themeParams.button_color || '#007AFF');
  rootStyle.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#FFFFFF');
  rootStyle.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color || (colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF'));
  // Дополнительные переменные, если они есть в themeParams или нужны для вашего дизайна
  rootStyle.setProperty('--tg-theme-header-bg-color', themeParams.header_bg_color || themeParams.secondary_bg_color || (colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF'));
  rootStyle.setProperty('--tg-theme-section-bg-color', themeParams.section_bg_color || themeParams.secondary_bg_color || (colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF'));
  rootStyle.setProperty('--tg-theme-destructive-text-color', themeParams.destructive_text_color || '#FF3B30');

  // Обновляем цвета границ, если они не предоставлены напрямую
  const borderColor = colorScheme === 'dark' ? '#38383A' : '#E0E0E0';
  rootStyle.setProperty('--border-color-light', borderColor); // Обновляем и для светлой темы на всякий случай
  rootStyle.setProperty('--border-color-dark', borderColor);

  // Обновляем цвета для элементов списка
  const itemBg = themeParams.secondary_bg_color || (colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF');
  const itemHoverBg = colorScheme === 'dark' ? '#2C2C2E' : '#EFEFF4';
  rootStyle.setProperty('--item-bg-light', itemBg);
  rootStyle.setProperty('--item-hover-bg-light', itemHoverBg);
  rootStyle.setProperty('--item-bg-dark', itemBg);
  rootStyle.setProperty('--item-hover-bg-dark', itemHoverBg);


  // Уведомляем Telegram о готовности, если это еще не сделано
  // tg.ready(); // Обычно вызывается один раз при инициализации приложения
}
