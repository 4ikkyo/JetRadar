// events.js
import { fetchWatchlist, addWallet } from './watchlist.js';
import { showWalletDetails, showWatchlistScreen } from './details.js';
import { ui } from './uiElements.js';
import { t } from './lang.js';
import { createWalletListItem } from './utils.js';
import { fetchAPI } from './api.js';

/**
 * Базовая точка входа: инициализируем WebApp, навешиваем все обработчики.
 */
export function initApp(tg) {
  tg.ready();
  tg.expand();

  let telegramUserId = null;

  if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    telegramUserId = tg.initDataUnsafe.user.id;
    const user = tg.initDataUnsafe.user;
    const userName =
      user.username || `${user.first_name} ${user.last_name || ''}`.trim();
    ui.userInfoP.textContent = `Пользователь: ${userName} (ID: ${telegramUserId})`;
  } else {
    telegramUserId = 591582190; // Тестовый ID
    ui.userInfoP.textContent = t('test_mode', { id: telegramUserId });
  }

  // --- Навешиваем кнопку Back, которая ведёт:
  // --- * Если на главном экране: tg.close()
  // --- * Если на экране деталей: возвращает на главный
  if (ui.globalBackButton) {
    ui.globalBackButton.addEventListener('click', () => {
      const isDetailsVisible = !ui.walletDetailsSection.classList.contains('hidden');
      if (isDetailsVisible) {
        // Сейчас открыт экран «Детали» → возвращаем на главный
        showWatchlistScreen(tg, telegramUserId);
      } else {
        // Уже на главном экране → закрываем WebApp
        tg.close();
      }
    });
  }

  // Сразу загружаем Watchlist
  fetchWatchlist(tg, telegramUserId);

  // Кнопки «Добавить кошелек» и «Обновить список»
  if (ui.addWalletButton) {
    ui.addWalletButton.addEventListener('click', () =>
      addWallet(tg, telegramUserId)
    );
  }
  if (ui.refreshWatchlistButton) {
    ui.refreshWatchlistButton.addEventListener('click', () =>
      fetchWatchlist(tg, telegramUserId)
    );
  }

  // Клик на <li> из Watchlist
  if (ui.walletListUl) {
    ui.walletListUl.addEventListener('click', event => {
      const li = event.target.closest('li');
      if (!li) return;
      const address = li.dataset.address;
      const alias = li.dataset.alias;
      const group = li.dataset.group;
      const wallet = { address, alias, group };
      showWalletDetails(wallet, tg, telegramUserId, fetchWatchlist);
    });
  }

  // Кнопка «Назад» внутри экрана деталей
  if (ui.backToWatchlistButton) {
    ui.backToWatchlistButton.addEventListener('click', () => {
      showWatchlistScreen(tg, telegramUserId);
    });
  }
  tg.BackButton.onClick(() => {
    showWatchlistScreen(tg, telegramUserId);
  });

  // Навешиваем логику поиска (если все элементы присутствуют)
  if (ui.searchButton && ui.searchInput && ui.searchResultsUl) {
    ui.searchButton.addEventListener('click', () =>
      performSearch(tg, telegramUserId)
    );
    ui.searchInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') performSearch(tg, telegramUserId);
    });
  }

  // Обработка URL-параметра graph_target (глубокая ссылка)
  handleUrlParams(tg, telegramUserId);
}

/**
 * Если в URL есть ?graph_target=..., сразу показываем экран деталей.
 */
function handleUrlParams(tg, telegramUserId) {
  const urlParams = new URLSearchParams(window.location.search);
  const graphTargetAddress = urlParams.get('graph_target');
  if (graphTargetAddress && telegramUserId) {
    const pseudoWallet = {
      address: graphTargetAddress,
      alias: `Graph: ${graphTargetAddress.substring(0, 6)}…`,
      group: ''
    };
    showWalletDetails(pseudoWallet, tg, telegramUserId, fetchWatchlist);
  }
}

/**
 * Функция поиска кошельков (GET /wallet/wallets/search?query=...).
 */
async function performSearch(tg, telegramUserId) {
  const query = ui.searchInput.value.trim();
  if (query.length < 3) {
    ui.searchResultsUl.innerHTML = `<li>${t('search_min_chars')}</li>`;
    return;
  }
  if (!telegramUserId) {
    ui.searchResultsUl.innerHTML = `<li>${t('telegram_id_missing')}</li>`;
    return;
  }
  setSearchLoading(true);
  ui.searchResultsUl.innerHTML = `<li>${t('search_loading')}</li>`;

  const result = await fetchAPI(
    '/wallet/wallets/search',
    'GET',
    { query },
    telegramUserId
  );
  setSearchLoading(false);

  ui.searchResultsUl.innerHTML = '';
  if (result.error) {
    ui.searchResultsUl.innerHTML = `<li>${t('search_error')}</li>`;
    return;
  }
  const results = Array.isArray(result) ? result : [];
  if (results.length > 0) {
    results.forEach(wallet => {
      const li = createWalletListItem(wallet);
      li.addEventListener('click', () => {
        showWalletDetails(wallet, tg, telegramUserId, fetchWatchlist);
      });
      ui.searchResultsUl.appendChild(li);
    });
  } else {
    ui.searchResultsUl.innerHTML = `<li>${t('search_none_found')}</li>`;
  }
}

function setSearchLoading(isLoading) {
  ui.searchButton.disabled = isLoading;
  ui.searchButton.textContent = isLoading ? t('loading') : t('search');
}

