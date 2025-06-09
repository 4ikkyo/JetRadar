// events.js
import { fetchWatchlist, addWallet, setCurrentTelegramUser } from './watchlist.js';
import {
    showWalletDetails,
    showWatchlistScreen,
    renderTransactionHistory,
    refreshGraphFiltersAndFetchData,
    saveAliasAndGroup
} from './details.js';
import { ui, setLoadingState } from './uiElements.js';
import { t, applyTranslations, initLanguageSwitcher, applyTelegramTheme } from './lang.js';
import { createWalletListItem, showAlert } from './utils.js';
import { fetchAPI } from './api.js';

let currentTelegramUser = null; // Храним данные пользователя Telegram

/**
 * Базовая точка входа: инициализируем WebApp, навешиваем все обработчики.
 * @param {object} tg - Объект Telegram WebApp.
 */
export function initApp(tg) {
  tg.ready(); // Сообщаем Telegram, что WebApp готов
  tg.expand(); // Растягиваем WebApp на весь экран

  // Устанавливаем текущую тему и язык
  applyTelegramTheme();
  initLanguageSwitcher(); // Инициализирует и применяет переводы в первый раз
  applyTranslations(); // Применяем переводы ко всему документу

  // Получаем данные пользователя Telegram
  if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    currentTelegramUser = tg.initDataUnsafe.user;
    setCurrentTelegramUser(currentTelegramUser); // Передаем в watchlist.js
    const userName = currentTelegramUser.username
      ? `@${currentTelegramUser.username}`
      : `${currentTelegramUser.first_name || ''} ${currentTelegramUser.last_name || ''}`.trim();
    ui.userInfoP.textContent = t('user_greeting', { name: userName, id: currentTelegramUser.id, default: `User: ${userName} (ID: ${currentTelegramUser.id})` });
  } else {
    // Тестовый режим или ошибка получения пользователя
    const testUserId = '51527252';
    currentTelegramUser = { id: testUserId, first_name: "Test", last_name: "User" }; // Фиктивный пользователь
    setCurrentTelegramUser(currentTelegramUser);
    ui.userInfoP.textContent = t('test_mode', { id: testUserId });
    console.warn('Telegram user data not available. Running in test mode.');
  }

  // --- Обработчик для кнопки "Назад" Telegram ---
  tg.BackButton.onClick(() => {
    // Проверяем, виден ли экран деталей
    const isDetailsVisible = ui.walletDetailsSection.style.display === 'block';
    if (isDetailsVisible) {
      showWatchlistScreen(tg);
    } else {
      // Если мы на главном экране, то кнопка "Назад" должна закрывать WebApp
      // Однако, Telegram сам обрабатывает это, если кнопка видима.
      // Если вы хотите кастомное поведение (например, подтверждение), можно добавить здесь.
      // tg.close(); // Обычно не нужно, если BackButton видна и мы не на экране деталей
    }
  });


  // --- Секция «Добавить кошелек» ---
  if (ui.addWalletButton) {
    ui.addWalletButton.addEventListener('click', () => addWallet(tg));
  }
  if (ui.walletAddressInput) {
      ui.walletAddressInput.addEventListener('keypress', e => {
          if (e.key === 'Enter') ui.addWalletButton.click();
      });
  }
   if (ui.walletAliasInput) {
      ui.walletAliasInput.addEventListener('keypress', e => {
          if (e.key === 'Enter') ui.addWalletButton.click();
      });
  }


  // --- Секция «Поиск» ---
  if (ui.searchButton && ui.searchInput && ui.searchResultsUl) {
    ui.searchButton.addEventListener('click', () => performSearch(tg));
    ui.searchInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') performSearch(tg);
    });
  }

  // --- Секция «Watchlist» ---
  if (ui.refreshWatchlistButton) {
    ui.refreshWatchlistButton.addEventListener('click', () => fetchWatchlist(tg));
  }
  // Клик на элемент списка Watchlist (делегирование событий)
  // Перенесено в fetchWatchlist, где создаются элементы


  // --- Секция «Детали кошелька» ---
  // Кнопка "Сохранить" для метки/группы
  if (ui.saveAliasGroupButton) {
    ui.saveAliasGroupButton.addEventListener('click', saveAliasAndGroup);
  }

  // Фильтры истории транзакций
  if (ui.txSortSelect) {
    ui.txSortSelect.addEventListener('change', () => {
      console.log('txSortSelect change', ui.txSortSelect.value);
      renderTransactionHistory();
    });
  }
  if (ui.txTypeFilter) {
    ui.txTypeFilter.addEventListener('change', () => {
      console.log('txTypeFilter change', ui.txTypeFilter.value);
      renderTransactionHistory();
    });
  }

  // Фильтры графа
  if (ui.applyGraphFiltersButton) {
    ui.applyGraphFiltersButton.addEventListener('click', refreshGraphFiltersAndFetchData);
  }
  // Можно добавить обработчики onchange для чекбоксов и инпута графа,
  // чтобы кнопка "Применить" становилась активной или для мгновенного обновления (если нужно)
  // Например:
  // const graphFilterElements = [ui.filterIncomingCheckbox, ui.filterOutgoingCheckbox, ui.filterJettonCheckbox, ui.minAmountInput];
  // graphFilterElements.forEach(el => {
  //   if (el) el.addEventListener('change', () => { /* логика активации кнопки "Применить" */ });
  // });


  // Первоначальная загрузка Watchlist
  if (currentTelegramUser && currentTelegramUser.id) {
    fetchWatchlist(tg);
  } else {
    showAlert(t('telegram_id_missing_on_init', { default: 'Не удалось определить пользователя Telegram при инициализации.' }), 'error');
  }

  // Обработка URL-параметра для глубокой ссылки на граф (если нужно)
  handleUrlParams(tg);

  // Слушаем событие смены языка для обновления UI, если нужно (например, тексты кнопок)
  document.addEventListener('languageChanged', () => {
    // Обновить тексты, которые не обновляются через data-i18n, если такие есть
    // Например, текст на кнопках, который устанавливается динамически
    if (ui.addWalletButton.dataset.originalText) { // Если кнопка в состоянии загрузки
        ui.addWalletButton.dataset.originalText = t('add_wallet');
    } else {
        ui.addWalletButton.innerHTML = t('add_wallet');
    }
    // ... и для других кнопок/элементов по аналогии
  });
}

/**
 * Функция поиска кошельков.
 * @param {object} tg - Объект Telegram WebApp.
 */
async function performSearch(tg) {
  if (!currentTelegramUser?.id) {
    showAlert(t('telegram_id_missing'), 'error');
    return;
  }

  const query = ui.searchInput.value.trim();
  if (query.length < 3) {
    ui.searchResultsUl.innerHTML = `<li class="tx-empty">${t('search_min_chars')}</li>`;
    return;
  }

  setLoadingState(ui.searchButton, true, 'button', t('search'));
  setLoadingState(ui.searchResultsContainer, true, 'container');
  ui.searchResultsUl.innerHTML = ''; // Очищаем перед загрузкой

  const result = await fetchAPI(
    '/wallet/wallets/search', // Предполагаем, что такой эндпоинт есть
    'GET',
    { query },
    currentTelegramUser.id
  );

  setLoadingState(ui.searchButton, false, 'button', t('search'));
  setLoadingState(ui.searchResultsContainer, false, 'container');

  if (result.error) {
    ui.searchResultsUl.innerHTML = `<li class="tx-empty">${t('search_error')}: ${result.message}</li>`;
    return;
  }

  const results = Array.isArray(result) ? result : [];
  if (results.length > 0) {
    results.forEach(wallet => {
      const li = createWalletListItem(wallet); // onDelete здесь не нужен для результатов поиска
      li.addEventListener('click', () => {
        // Передаем fetchWatchlist как callback, если поиск может добавить кошелек в watchlist
        // или если нужно обновить watchlist после каких-то действий на экране деталей
        showWalletDetails(wallet, tg, currentTelegramUser.id, () => fetchWatchlist(tg));
      });
      ui.searchResultsUl.appendChild(li);
    });
  } else {
    ui.searchResultsUl.innerHTML = `<li class="tx-empty">${t('search_none_found')}</li>`;
  }
}

/**
 * Обрабатывает URL-параметры для глубоких ссылок (например, ?address=...).
 * @param {object} tg - Объект Telegram WebApp.
 */
function handleUrlParams(tg) {
  const urlParams = new URLSearchParams(window.location.search);
  const targetAddress = urlParams.get('address') || urlParams.get('graph_target');

  if (targetAddress && currentTelegramUser?.id) {
    // Создаем псевдо-объект кошелька для отображения деталей
    // Можно сначала попытаться найти его в watchlist или через API для получения alias/group
    const pseudoWallet = {
      address: targetAddress,
      // alias: `From URL: ${targetAddress.substring(0, 6)}…`,
      // group: ''
    };
    // Передаем fetchWatchlist как callback
    showWalletDetails(pseudoWallet, tg, currentTelegramUser.id, () => fetchWatchlist(tg));
  }
}
