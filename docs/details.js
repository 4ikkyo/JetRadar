// details.js
import { fetchAPI } from './api.js';
import { ui, setLoadingState } from './uiElements.js';
import { t } from './lang.js';
import { generateAndDisplayVisGraph } from './graph.js';
import { TRANSACTION_HISTORY_LIMIT } from './config.js';
import { formatTimestamp, shortenAddress, showAlert } from './utils.js';

let currentHistoryEvents = [];
let currentWalletAddressForDetails = null; // Чтобы избежать конфликта имен
let currentTelegramUserIdForDetails = null;
let currentTgForDetails = null;
let currentFetchWatchlistCallback = null;


/**
 * Отображает экран «Детали кошелька».
 * @param {{ address: string, alias?: string, group?: string }} wallet - Данные кошелька.
 * @param {object} tg - Объект Telegram WebApp.
 * @param {string|number} telegramUserId - ID пользователя.
 * @param {Function} fetchWatchlistCallback - Callback для обновления Watchlist после сохранения.
 */
export async function showWalletDetails(wallet, tg, telegramUserId, fetchWatchlistCallback) {
  currentWalletAddressForDetails = wallet.address;
  // --- сохраняем telegramUserId в локальную переменную для последующих запросов ---
  currentTelegramUserIdForDetails = telegramUserId;
  currentTgForDetails = tg;
  currentFetchWatchlistCallback = fetchWatchlistCallback;

  ui.addWalletSection.style.display       = 'none';
  ui.watchlistSection.style.display       = 'none';
  ui.searchSection.style.display          = 'none';
  ui.walletDetailsSection.style.display   = 'block';

  window.scrollTo(0, 0);

  ui.detailsAddressSpan.textContent       = wallet.address;
  ui.summaryAliasSpan.textContent         = wallet.alias || '-';
  ui.editAliasInput.value                 = wallet.alias || '';
  ui.summaryGroupSpan.textContent         = wallet.group || '-';
  ui.editGroupInput.value                 = wallet.group || '';

  setLoadingState(ui.walletSummaryContainer, true, 'container');
  setLoadingState(ui.transactionHistoryContainer, true, 'container');
  ui.transactionHistoryUl.innerHTML = '';
  ui.visGraphContainer.innerHTML    = `<p>${t('loading_graph')}</p>`;

  tg.BackButton.show();

  // --- передаём telegramUserId явно первым аргументом в каждый fetchAPI (GET запросы) ---
  const summaryPromise = fetchWalletSummary(wallet.address, telegramUserId);
  const historyPromise = fetchTransactionHistory(wallet.address, telegramUserId);
  const graphPromise   = fetchAndRenderGraph(wallet.address, telegramUserId, true);

  summaryPromise.then(summaryData => {
    setLoadingState(ui.walletSummaryContainer, false, 'container');
    if (summaryData && !summaryData.error) {
      ui.summaryBalanceSpan.textContent = summaryData.balance_ton !== null
        ? `${parseFloat(summaryData.balance_ton).toFixed(4)} TON`
        : '-';
      ui.summaryTxCountSpan.textContent  = summaryData.total_tx_count !== null
        ? String(summaryData.total_tx_count)
        : '-';
      ui.summaryActivitySpan.textContent = summaryData.last_activity_ts
        ? formatTimestamp(summaryData.last_activity_ts)
        : '-';
      ui.summaryIsScamSpan.innerHTML     = summaryData.is_scam !== null
        ? summaryData.is_scam
          ? `<span style="color:var(--tg-theme-destructive-text-color); font-weight:bold;">🔴 ${t('yes_scam', {default: 'Да'})}</span>`
          : `<span style="color:green; font-weight:bold;">🟢 ${t('no_scam', {default: 'Нет'})}</span>`
        : '-';
      if (summaryData.alias) ui.summaryAliasSpan.textContent = summaryData.alias;
      if (summaryData.group) ui.summaryGroupSpan.textContent = summaryData.group;
    } else {
      ui.summaryBalanceSpan.textContent = t('error_generic');
      showAlert(t('error_loading_summary', { default: 'Ошибка загрузки сводки.' }), 'error');
    }
  });

  historyPromise.then(() => {
    setLoadingState(ui.transactionHistoryContainer, false, 'container');
  });

  graphPromise.then(() => {
    // Ничего не делаем: граф сам рендерится внутри fetchAndRenderGraph
  });

  // Обработчики кнопок и фильтров назначаются в events.js


  // Навешиваем обработчики на фильтры и кнопки только один раз при инициализации,
  // но здесь убедимся, что они сработают для ТЕКУЩЕГО кошелька.
  // Функции renderTransactionHistory и refreshGraphFiltersAndFetchData должны использовать currentWalletAddressForDetails.

  // Кнопка «Сохранить» для метки/группы
  // ui.saveAliasGroupButton.onclick назначается в events.js
}

async function fetchWalletSummary(address, telegramUserId) {
    return await fetchAPI(`/wallet/${address}/summary`, 'GET', null, telegramUserId);
}


/**
 * Загружает историю транзакций и рендерит их.
 */
export async function fetchTransactionHistory(address, telegramUserId) {
  ui.txLimitSpan.textContent = String(TRANSACTION_HISTORY_LIMIT);

  // --- GET запрос: telegramUserId снова передаётся в 4-м аргументе ---
  const result = await fetchAPI(
    `/wallet/${address}/history`,
    'GET',
    { limit: TRANSACTION_HISTORY_LIMIT },
    telegramUserId
  );

  if (result.error) {
    currentHistoryEvents = [];
    ui.transactionHistoryUl.innerHTML = `<li class="tx-empty">${t('tx_history_error')}: ${result.message}</li>`;
  } else {
    currentHistoryEvents = Array.isArray(result) ? result : [];
    if (currentHistoryEvents.length === 0) {
      ui.transactionHistoryUl.innerHTML = `<li class="tx-empty">${t('no_tx_history')}</li>`;
    }
  }
  renderTransactionHistory();
  return currentHistoryEvents;
}

/**
 * Рендерит историю транзакций на основе currentHistoryEvents и текущих фильтров.
 */
export function renderTransactionHistory() {
  if (!ui.transactionHistoryUl) return;
  ui.transactionHistoryUl.innerHTML = ''; // Очищаем перед рендерингом

  const normalizeType = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const typeFilter = ui.txTypeFilter ? normalizeType(ui.txTypeFilter.value) : 'all';
  const sortDir = ui.txSortSelect && ui.txSortSelect.value === 'asc' ? 'asc' : 'desc';
  console.log('renderTransactionHistory', { typeFilter, sortDir, events: currentHistoryEvents.length });

  if (currentHistoryEvents.length === 0 && !ui.transactionHistoryContainer.classList.contains('loading-overlay')) {
      // Если загрузка завершена и событий нет, показываем сообщение (уже должно быть установлено fetchTransactionHistory)
      // Дополнительно проверим, чтобы не перезаписать сообщение об ошибке
      if (!ui.transactionHistoryUl.querySelector('.tx-empty')) {
          ui.transactionHistoryUl.innerHTML = `<li class="tx-empty">${t('no_tx_history')}</li>`;
      }
      return;
  }


  const filteredAndSortedEvents = [...currentHistoryEvents]
    .map(event => ({
      ...event,
      // Фильтруем actions внутри каждого event ДО сортировки event'ов
      actions: event.actions.filter(act => {
        const actType = normalizeType(act.type);
        if (typeFilter === 'all') return true;
        // exact match first, then fallback to prefix for backward compatibility
        return actType === typeFilter || actType.startsWith(typeFilter);
      })
    }))
    // Убираем event'ы, у которых не осталось actions после фильтрации
    .filter(event => event.actions.length > 0)
    // Сортируем сами event'ы
    .sort((a, b) =>
      sortDir === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp
    );

  if (filteredAndSortedEvents.length === 0 && currentHistoryEvents.length > 0) {
      ui.transactionHistoryUl.innerHTML = `<li class="tx-empty">${t('no_tx_matching_filters', {default: 'Нет транзакций, соответствующих фильтрам.'})}</li>`;
      return;
  }


  filteredAndSortedEvents.forEach(evt => {
    const eventLi = document.createElement('li');
    eventLi.className = 'tx-event-card';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'tx-event-header';
    headerDiv.textContent = formatTimestamp(evt.timestamp);
    eventLi.appendChild(headerDiv);

    evt.actions.forEach(action => {
      const actionDiv = document.createElement('div');
      actionDiv.className = 'tx-action-item';
      actionDiv.innerHTML = formatAction(action, currentWalletAddressForDetails); // Передаем адрес текущего кошелька
      eventLi.appendChild(actionDiv);
    });
    ui.transactionHistoryUl.appendChild(eventLi);
  });
}

/**
 * Форматирует одно действие (action) в HTML строку.
 * @param {object} action - Объект действия из API.
 * @param {string} currentWalletAddr - Адрес просматриваемого кошелька для определения направления.
 * @returns {string} HTML строка.
 */
function formatAction(action, currentWalletAddr) {
  let html = '';
  const type = action.type || 'Unknown';
  const senderAddr = typeof action.sender === 'string' ? action.sender : action.sender?.address;
  const recipientAddr = typeof action.recipient === 'string' ? action.recipient : action.recipient?.address;
  const isSend = senderAddr === currentWalletAddr;
  const isReceive = recipientAddr === currentWalletAddr;

  // Суммы и символы
  const amountTON = action.amount_ton ? parseFloat(action.amount_ton).toFixed(4) : null;
  const amountJettonRaw = action.amount_jetton ?? action.amount;
  const amountJetton = amountJettonRaw != null ? parseFloat(amountJettonRaw).toFixed(4) : null;
  const jettonSymbol = action.jetton_symbol || action.jetton_master?.symbol || 'JET';
  const jettonImage = action.jetton_image || action.jetton_master?.image || '';

  const fee = action.fee_ton ? parseFloat(action.fee_ton).toFixed(5) : null; // Пример
  const comment = action.comment || action.message_body?.text || ''; // Пример

  let dirEmoji = '';
  if (isSend) dirEmoji = '📤';
  else if (isReceive) dirEmoji = '📥';
  else dirEmoji = '⚙️'; // Транзакция, где кошелек не отправитель и не получатель (например, исполнение контракта)

  let description = action.description || '';
  let title = `${t(`tx_type_${type}`, {default: type})}`; // Локализованный тип операции

  // Детализация по типам
  if (type.startsWith('TonTransfer')) {
    title = t('tx_type_TonTransfer');
    description = isSend
      ? t('tx_details_ton_sent', { amount: amountTON, to: shortenAddress(recipientAddr || '?') })
      : t('tx_details_ton_received', { amount: amountTON, from: shortenAddress(senderAddr || '?') });
    if (comment) description += ` (${t('tx_comment')}: ${comment})`;
  } else if (type.startsWith('JettonTransfer')) {
    title = t('tx_type_JettonTransfer');
    description = isSend
      ? t('tx_details_jetton_sent', { amount: amountJetton, symbol: jettonSymbol, to: shortenAddress(recipientAddr || '?') })
      : t('tx_details_jetton_received', { amount: amountJetton, symbol: jettonSymbol, from: shortenAddress(senderAddr || '?') });
     if (comment) description += ` (${t('tx_comment')}: ${comment})`;
  } else if (type.startsWith('NftTransfer')) {
    title = t('tx_type_NftTransfer');
    const nftName = action.nft_name || action.nft_item?.name || 'NFT';
    description = isSend
      ? t('tx_details_nft_sent', { name: nftName, to: shortenAddress(recipientAddr || '?') })
      : t('tx_details_nft_received', { name: nftName, from: shortenAddress(senderAddr || '?') });
  } else if (type.startsWith('JettonSwap')) {
    title = t('tx_type_JettonSwap');
    const amountIn = action.ton_in != null ? parseFloat(action.ton_in).toFixed(4) : '0';
    const symbolIn = 'TON';
    const amountOut = action.amount_out != null ? parseFloat(action.amount_out).toFixed(4) : '0';
    const symbolOut = action.jetton_symbol || 'JET';
    description = t('tx_details_swap', { amountIn, symbolIn, amountOut, symbolOut });
    if (action.dex) description += ` via ${action.dex}`;
  } else {
    // Общий случай
    if (amountTON) description += `${amountTON} TON. `;
    if (amountJetton) description += `${amountJetton} ${jettonSymbol}. `;
    if (comment) description += `(${t('tx_comment')}: ${comment})`;
  }


  html = `
    <span class="tx-emoji" title="${title}">${dirEmoji}</span>
    ${jettonImage && type.startsWith('Jetton') ? `<img src="${jettonImage}" alt="${jettonSymbol}" class="jetton-icon" />` : ''}
    <span class="tx-main-info" style="flex-grow:1;">
        <span style="font-weight:500;">${title}</span><br>
        <span class="tx-desc">${description || t('no_details')}</span>
    </span>
  `;
  if (fee) {
      html += `<span class="tx-fee" style="font-size:0.85em; color:var(--tg-theme-hint-color);">${t('tx_fee')}: ${fee} TON</span>`;
  }

  return html;
}


/**
 * Загружает данные для графа и рендерит его.
 * @param {string} address - Адрес целевого кошелька.
 * @param {string|number} telegramUserId - ID пользователя.
 * @param {boolean} [isInitialLoad=false] - Флаг первичной загрузки (для сброса фильтров).
 */
// --- Для построения графа (GET-запрос) достаточно передать telegramUserId как четвертый аргумент ---
export async function fetchAndRenderGraph(address, telegramUserId, isInitialLoad = false) {
  ui.visGraphContainer.innerHTML = `<p>${t('loading_graph')}</p>`;

  const incoming   = ui.filterIncomingCheckbox?.checked ?? true;
  const outgoing   = ui.filterOutgoingCheckbox?.checked ?? true;
  const jettonOnly = ui.filterJettonCheckbox?.checked ?? false;
  const minValueTON= parseFloat(ui.minAmountInput?.value) || 0;

  console.log('apply graph filters', { incoming, outgoing, jettonOnly, minValueTON });
  console.log('requesting /wallet/graph', {
    target_address: address,
    incoming,
    outgoing,
    jetton_only: jettonOnly,
    min_value: minValueTON
  });

  const result = await fetchAPI(
    `/wallet/graph`,
    'GET',
    {
      target_address: address,
      incoming,
      outgoing,
      jetton_only: jettonOnly,
      min_value: minValueTON
    },
    telegramUserId
  );

  if (result.error) {
    ui.visGraphContainer.innerHTML = `<p>${t('graph_data_error', { message: result.message })}</p>`;
  } else {
    generateAndDisplayVisGraph(result, address);
  }
}

/**
 * Обновляет граф на основе текущих значений фильтров.
 * Вызывается кнопкой "Применить" для фильтров графа.
 */
export function refreshGraphFiltersAndFetchData() {
    if (currentWalletAddressForDetails && currentTelegramUserIdForDetails) {
        console.log('refreshGraphFiltersAndFetchData click');
        setLoadingState(ui.applyGraphFiltersButton, true, 'button', t('apply_filters'));
        fetchAndRenderGraph(currentWalletAddressForDetails, currentTelegramUserIdForDetails, false)
            .finally(() => {
                setLoadingState(ui.applyGraphFiltersButton, false, 'button', t('apply_filters'));
            });
    }
}


/**
 * Сохраняет новую метку и группу.
 */
export async function saveAliasAndGroup() {
  if (!currentWalletAddressForDetails || !currentTelegramUserIdForDetails) {
    showAlert(t('telegram_id_missing'), 'error');
    return;
  }
  const newAlias = ui.editAliasInput.value.trim() || null;
  const newGroup = ui.editGroupInput.value.trim() || null;

  setLoadingState(ui.saveAliasGroupButton, true, 'button', t('save'));

  // --- формируем payload с telegram_user_id ---
  const payload = {
    telegram_user_id: currentTelegramUserIdForDetails,
    alias: newAlias,
    group: newGroup
  };
  const result = await fetchAPI(
    `/wallet/${currentWalletAddressForDetails}/update`, // предполагаемый endpoint
    'PUT',
    payload,
    null
  );
  setLoadingState(ui.saveAliasGroupButton, false, 'button', t('save'));

  if (result.error) {
    showAlert(`${t('save_error', { message: result.message })}`, 'error');
  } else {
    showAlert(t('save_success'), 'success');
    // После сохранения обновляем watchlist и детали
    currentFetchWatchlistCallback();
    // Обновим UI-поля summary:
    ui.summaryAliasSpan.textContent = newAlias || '-';
    ui.summaryGroupSpan.textContent = newGroup || '-';
  }
}

export async function deleteWalletFromDetails(address) {
  if (!currentTelegramUserIdForDetails) {
    showAlert(t('telegram_id_missing'), 'error');
    return;
  }
  const payload = {
    telegram_user_id: currentTelegramUserIdForDetails,
    address
  };
  const result = await fetchAPI(`/wallet/delete`, 'DELETE', payload, null);
  if (result.error) {
    showAlert(`${t('wallet_deleted_error')}: ${result.message}`, 'error');
  } else {
    showAlert(t('wallet_deleted_success'), 'success');
    currentFetchWatchlistCallback();
  }
}

/**
 * Показывает главный экран, скрывает «Детали».
 * @param {object} tg - Объект Telegram WebApp.
 */
export function showWatchlistScreen(tg) {
  ui.addWalletSection.style.display = 'block';
  ui.watchlistSection.style.display = 'block';
  ui.searchSection.style.display = 'block';
  ui.walletDetailsSection.style.display = 'none';

  tg.BackButton.hide();
  // Очищаем текущие детали, чтобы не было "утечки" состояния
  currentWalletAddressForDetails = null;
  currentTelegramUserIdForDetails = null;
  currentTgForDetails = null;
  currentFetchWatchlistCallback = null;
  currentHistoryEvents = [];
  if(ui.transactionHistoryUl) ui.transactionHistoryUl.innerHTML = '';
  if(ui.visGraphContainer) ui.visGraphContainer.innerHTML = '';

}
