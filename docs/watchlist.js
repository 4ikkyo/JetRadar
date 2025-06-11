// watchlist.js
import { fetchAPI } from './api.js';
import { ui, setLoadingState } from './uiElements.js';
import { t } from './lang.js';
import { createWalletListItem, isValidTonAddress, showAlert, showConfirmationModal } from './utils.js';
import { showWalletDetails } from './details.js'; // Для перехода к деталям после клика

let currentTelegramUser = null; // Будет установлен в initApp

export function setCurrentTelegramUser(user) {
    currentTelegramUser = user;
}

/**
 * Загружает Watchlist (GET /wallet) и рендерит список в ui.walletListUl.
 * @param {object} tg - Объект Telegram WebApp.
 */
export async function fetchWatchlist(tg) {
  if (!currentTelegramUser?.id) {
    console.error("Telegram User ID is missing in fetchWatchlist");
    ui.walletListUl.innerHTML = `<li>${t('telegram_id_missing')}</li>`;
    return;
  }
  setLoadingState(ui.walletListContainer, true, 'container');
  setLoadingState(ui.refreshWatchlistButton, true, 'button', t('refresh_watchlist'));

  const result = await fetchAPI('/wallet', 'GET', null, currentTelegramUser.id);

  setLoadingState(ui.walletListContainer, false, 'container');
  setLoadingState(ui.refreshWatchlistButton, false, 'button', t('refresh_watchlist'));
  ui.walletListUl.innerHTML = '';

  if (result.error) {
    ui.walletListUl.innerHTML = `<li class="tx-empty">${t('wallet_list_load_error')}</li>`;
    showAlert(`${t('wallet_list_load_error')}: ${result.message}`, 'error');
    return;
  }

  const wallets = Array.isArray(result) ? result : [];
  if (wallets.length === 0) {
    ui.walletListUl.innerHTML = `<li class="tx-empty">${t('no_wallets')}</li>`;
    return;
  }

  wallets.forEach(wallet => {
    const li = createWalletListItem(wallet, (address, aliasOrAddress) => {
        showConfirmationModal(
            t('confirm_delete_wallet_title'),
            t('confirm_delete_wallet_text', { aliasOrAddress }),
            async () => {
                await deleteWalletFromWatchlist(tg, address); // --- здесь удаление ---
            }
        );
    });
    li.addEventListener('click', () => {
        showWalletDetails(wallet, tg, currentTelegramUser.id, () => fetchWatchlist(tg));
    });
    ui.walletListUl.appendChild(li);
  });
}

/**
 * Добавляет новый кошелек (POST /wallet/add), затем обновляет Watchlist.
 * @param {object} tg - Объект Telegram WebApp.
 */
export async function addWallet(tg) {
  if (!currentTelegramUser?.id) {
    showAlert(t('telegram_id_missing'), 'error');
    return;
  }

  const address = ui.walletAddressInput.value.trim();
  const alias = ui.walletAliasInput.value.trim();

  if (!address) {
    showAlert(t('enter_wallet_address'), 'error');
    ui.walletAddressInput.focus();
    return;
  }
  if (!isValidTonAddress(address)) {
    showAlert(t('invalid_ton_address'), 'error');
    ui.walletAddressInput.focus();
    return;
  }

  setLoadingState(ui.addWalletButton, true, 'button', t('add_wallet'));

  // --- добавляем telegram_user_id вручную в body ---
  const payload = {
    telegram_user_id: currentTelegramUser.id,
    address,
    alias: alias || null,
  };

  const result = await fetchAPI('/wallet/add', 'POST', payload, null); // передавать telegramUserId в 4-м аргументе не нужно, т.к. мы вручную включили его в payload
  setLoadingState(ui.addWalletButton, false, 'button', t('add_wallet'));

  if (result.error) {
    showAlert(`${t('add_wallet_error', { message: result.message || t('error_generic') })}`, 'error');
    return;
  }

  showAlert(t('add_wallet_success'), 'success');
  ui.walletAddressInput.value = '';
  ui.walletAliasInput.value = '';
  await fetchWatchlist(tg);
}


/**
 * Удаляет кошелек из Watchlist (DELETE /wallet/delete).
 * @param {object} tg - Объект Telegram WebApp.
 * @param {string} address - Адрес кошелька для удаления.
 */
async function deleteWalletFromWatchlist(tg, address) {
  if (!currentTelegramUser?.id) {
    showAlert(t('telegram_id_missing'), 'error');
    return;
  }

  setLoadingState(ui.walletListContainer, true, 'container');

  // --- здесь тоже добавляем telegram_user_id в тело DELETE-запроса ---
  const payload = {
    telegram_user_id: currentTelegramUser.id,
    address,
  };
  const result = await fetchAPI('/wallet/delete', 'DELETE', payload, null);

  setLoadingState(ui.walletListContainer, false, 'container');
  if (result.error) {
    showAlert(`${t('wallet_deleted_error')}: ${result.message}`, 'error');
    return;
  }

  showAlert(t('wallet_deleted_success'), 'success');
  await fetchWatchlist(tg);
}
