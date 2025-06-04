// watchlist.js
import { fetchAPI } from './api.js';
import { ui } from './uiElements.js';
import { t } from './lang.js';
import { createWalletListItem } from './utils.js';

/**
 * Загружает Watchlist (GET /wallet) и рендерит список в ui.walletListUl.
 */
export async function fetchWatchlist(tg, telegramUserId) {
  setLoadingState(true, 'walletList');
  const result = await fetchAPI('/wallet', 'GET', null, telegramUserId);
  setLoadingState(false, 'walletList');

  ui.walletListUl.innerHTML = '';

  if (result.error) {
    ui.walletListUl.innerHTML = `<li>${t('wallet_list_load_error')}</li>`;
    return;
  }
  const wallets = Array.isArray(result) ? result : [];
  if (wallets.length === 0) {
    ui.walletListUl.innerHTML = `<li>${t('no_wallets')}</li>`;
    return;
  }
  wallets.forEach(wallet => {
    const li = createWalletListItem(wallet);
    ui.walletListUl.appendChild(li);
  });
}

/**
 * Добавляет новый кошелек (POST /wallet/add), затем обновляет Watchlist.
 */
export async function addWallet(tg, telegramUserId) {
  const address = ui.walletAddressInput.value.trim();
  const alias = ui.walletAliasInput.value.trim();

  if (!address) {
    tg.showAlert(t('enter_wallet_address'));
    return;
  }
  // Простейшая валидация TON-адреса
  if (!/^(UQ|EQ)/.test(address) || address.length < 48) {
    tg.showAlert(t('invalid_ton_address'));
    return;
  }
  if (!telegramUserId) {
    tg.showAlert(t('telegram_id_missing'));
    return;
  }

  setLoadingState(true, 'addWalletButton');
  const payload = {
    telegram_user_id: telegramUserId,
    address,
    alias: alias || null,
    username:
      tg.initDataUnsafe?.user?.username ||
      `${tg.initDataUnsafe?.user?.first_name || ''} ${tg.initDataUnsafe?.user?.last_name || ''}`.trim()
  };
  const result = await fetchAPI('/wallet/add', 'POST', payload, telegramUserId);
  setLoadingState(false, 'addWalletButton');

  if (result.error) {
    tg.showAlert(`${t('add_wallet_error')}: ${result.message}`);
    return;
  }
  tg.HapticFeedback.notificationOccurred('success');
  tg.showAlert(t('add_wallet_success'));
  ui.walletAddressInput.value = '';
  ui.walletAliasInput.value = '';
  await fetchWatchlist(tg, telegramUserId);
}

/**
 * Ставит «загрузку» на кнопку/список.
 */
function setLoadingState(isLoading, elementContext) {
  let buttonEl = null;
  let originalText = '';
  if (elementContext === 'addWalletButton') {
    buttonEl = ui.addWalletButton;
    originalText = t('add_wallet');
  } else if (['refreshWatchlistButton', 'walletList'].includes(elementContext)) {
    buttonEl = ui.refreshWatchlistButton;
    originalText = t('refresh_watchlist');
  }

  if (buttonEl) {
    buttonEl.disabled = isLoading;
    buttonEl.textContent = isLoading ? t('loading') : originalText;
  }

  if (elementContext === 'walletList' && isLoading) {
    ui.walletListUl.innerHTML = `<li>${t('loading_wallet_list')}</li>`;
  }
}
