// details.js
import { fetchAPI } from './api.js';
import { ui } from './uiElements.js';
import { t } from './lang.js';
import { generateAndDisplayVisGraph } from './graph.js';

/**
 * Отображает экран «Детали кошелька»:
 * - Скрывает секции «Добавить», «Поиск», «Watchlist»
 * - Показывает «Детали»
 * - Параллельно загружает summary, history и graph
 */
export async function showWalletDetails(wallet, tg, telegramUserId, fetchWatchlist) {
  // Скрываем главный экран
  ui.addWalletSection.style.display = 'none';
  ui.watchlistSection.style.display = 'none';
  ui.searchSection.style.display = 'none';
  // Показываем детали
  ui.walletDetailsSection.style.display = 'block';

  // Заполняем статические поля
  ui.detailsAddressSpan.textContent = wallet.address;
  ui.summaryAliasSpan.textContent = wallet.alias || '-';
  ui.editAliasInput.value = wallet.alias || '';
  ui.editGroupInput.value = wallet.group || '';
  ui.summaryGroupSpan.textContent = wallet.group || '-';

  // Ставим «Загрузка…» в поля summary + history + graph
  ui.summaryBalanceSpan.textContent = t('loading');
  ui.summaryTxCountSpan.textContent = t('loading');
  ui.summaryActivitySpan.textContent = t('loading');
  ui.summaryIsScamSpan.textContent = t('loading');
  ui.transactionHistoryUl.innerHTML = `<li>${t('loading_tx_history')}</li>`;
  ui.visGraphContainer.innerHTML = `<p>${t('loading_graph')}</p>`;

  // Показываем встроенную BackButton Telegram (стрелку в шапке), если он есть
  tg.BackButton.show();

  // Запускаем три запроса параллельно:
  const summaryPromise = fetchAPI(
    `/wallet/${wallet.address}/summary`,
    'GET',
    null,
    telegramUserId
  );
  const historyPromise = fetchTransactionHistory(
    wallet.address,
    tg,
    telegramUserId
  );
  const graphPromise = fetchAPI(
    `/wallet/graph`,
    'GET',
    { target_address: wallet.address, depth: 1 },
    telegramUserId
  );

  // Обновляем summary, как только придёт ответ
const summaryData = await fetchAPI(`/wallet/${wallet.address}/summary`, "GET", null, telegramUserId);
if (summaryData) {
  ui.summaryBalanceSpan.textContent =
    summaryData.balance_ton !== null
      ? `${summaryData.balance_ton.toFixed(4)} TON`
      : "-";
  ui.summaryTxCountSpan.textContent =
    summaryData.total_tx_count !== null
      ? summaryData.total_tx_count
      : "-";
  ui.summaryActivitySpan.textContent = summaryData.last_activity_ts
    ? new Date(summaryData.last_activity_ts * 1000).toLocaleString()
    : "-";
  ui.summaryIsScamSpan.innerHTML =
    summaryData.is_scam !== null
      ? summaryData.is_scam
        ? '<span style="color:red;">🔴 Так</span>'
        : '<span style="color:green;">🟢 Ні</span>'
      : "-";
  } else {
    ui.summaryBalanceSpan.textContent = t('tx_history_error');
    ui.summaryTxCountSpan.textContent = t('tx_history_error');
    ui.summaryActivitySpan.textContent = t('tx_history_error');
    ui.summaryIsScamSpan.textContent = t('tx_history_error');
  }

  // Дожидаемся отрисовки истории (historyPromise)
  await historyPromise;

  // Теперь рендерим граф
  const graphData = await graphPromise;
  if (!graphData.error && graphData.nodes && graphData.edges) {
    generateAndDisplayVisGraph(graphData);
  } else {
    const msg = graphData.error ? graphData.message : '';
    ui.visGraphContainer.innerHTML = `<p>${t('graph_data_error')}. ${msg}</p>`;
  }

  // Навешиваем кнопку «Сохранить» для метки/группы
  ui.saveAliasGroupButton.onclick = async () => {
    await saveAliasAndGroup(wallet.address, tg, telegramUserId, fetchWatchlist);
  };
}

/**
 * Загружает историю транзакций (последние 10) и рендерит их в <ul id="transactionHistory">.
 */
export async function fetchTransactionHistory(address, telegramUserId) {
  const historyLimit = 10;
  ui.txLimitSpan.textContent = historyLimit.toString();

  // 1) Очищаем список (убираем "Загрузка истории транзакций…")
  ui.transactionHistoryUl.innerHTML = "";

  // 2) Запрашиваем историю у бекенда
  const result = await fetchAPI(
    `/wallet/${address}/history`,
    "GET",
    { limit: historyLimit },
    telegramUserId
  );

  // 3) Если ошибка или пустой результат
  if (!Array.isArray(result) || result.length === 0) {
    ui.transactionHistoryUl.innerHTML = `<li class="tx-empty">История транзакций пуста.</li>`;
    ui.summaryTxCountSpan.textContent = "0";
    return;
  }

  ui.summaryTxCountSpan.textContent = result.length.toString();

  // 4) Рендерим каждое событие (event)
  for (const evt of result) {
    // 4.a) Сформатируем timestamp
    let dtString = "N/A";
    if (evt.timestamp) {
      const dt = new Date(evt.timestamp * 1000);
      const day = dt.getDate().toString().padStart(2, "0");
      const month = (dt.getMonth() + 1).toString().padStart(2, "0");
      const year = dt.getFullYear();
      const hours = dt.getHours().toString().padStart(2, "0");
      const minutes = dt.getMinutes().toString().padStart(2, "0");
      const seconds = dt.getSeconds().toString().padStart(2, "0");
      dtString = `${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`;
    }

    // 4.b) Создаём элемент <li class="tx-event-card">
    const eventLi = document.createElement("li");
    eventLi.className = "tx-event-card";

    // 4.c) Вставляем шапку с датой/временем
    const headerDiv = document.createElement("div");
    headerDiv.className = "tx-event-header";
    headerDiv.textContent = dtString;
    eventLi.appendChild(headerDiv);

    // 4.d) Для каждого action внутри этого event:
    for (const action of evt.actions) {
      const actionDiv = document.createElement("div");
      actionDiv.className = "tx-action-item";

      let html = "";
      const type = action.type;

      // === 1) Обработка JettonSwap ===
      if (type === "JettonSwap" || action.is_swap) {
        // Берём реальные числа из бекенда:
        const tonIn = (action.ton_in || 0).toFixed(4);
        const amtOut = (action.amount_out || 0).toFixed(2);
        const sym = action.jetton_symbol || "";
        const name = action.jetton_name || "";
        const img = action.jetton_image || ""; // ${img ? `<img src="${img}" alt="${sym}" class="jetton-icon" />` : ""}
        const dex = action.dex || "";

        html = `
          <span class="tx-emoji">🔄</span>
          <span class="tx-swap-ton">${tonIn} TON</span>
          <span class="tx-swap-arrow">→</span>

          <span class="tx-swap-jetton">${amtOut} ${sym}</span>
          <span class="tx-desc">${action.description || ""}${dex ? ` via ${dex}` : ""}</span>
        `;
        //<span class="tx-token-name">${name}</span>
      }
      // === 2) Обработка TonTransfer ===
      else if (type === "TonTransfer") {
        const tonAmt = (action.amount_ton || 0).toFixed(4);
        const dirEmoji = action.is_send ? "📤" : "📥";
        const comment = action.comment || "";

        html = `
          <span class="tx-emoji">${dirEmoji}</span>
          <span class="tx-amount-ton">${tonAmt} TON</span>
          <span class="tx-desc">${comment}</span>
        `;
      }
      // === 3) Обработка JettonTransfer ===
      else if (type === "JettonTransfer") {
        const amtJ = (action.amount || 0).toFixed(2);
        const sym = action.jetton_symbol || "";
        const img = action.jetton_image || "";
        const dirEmoji = action.is_send ? "📤" : "📥";

        html = `
          <span class="tx-emoji">${dirEmoji}</span>
          ${img ? `<img src="${img}" alt="${sym}" class="jetton-icon" />` : ""}
          <span class="tx-amount-jetton">${amtJ} ${sym}</span>
          <span class="tx-desc">${action.description || ""}</span>
        `;
      }
      // === 4) Обработка NFT (если нужно) ===
      else if (type === "NftTransfer") {
        const dirEmoji = action.is_send ? "📤" : "📥";
        const nftName = action.nft_name || action.description || "NFT";

        html = `
          <span class="tx-emoji">${dirEmoji}</span>
          <span class="tx-nft">🖼️ ${nftName}</span>
          <span class="tx-desc">${action.description || ""}</span>
        `;
      }
      // === 5) Остальные типы ===
      else {
        html = `
          <span class="tx-type-plain">${type}</span>
          <span class="tx-desc">${action.description || ""}</span>
        `;
      }

      actionDiv.innerHTML = html;
      eventLi.appendChild(actionDiv);
    }

    // 4.e) Добавляем готовую карточку в <ul id="transactionHistory">
    ui.transactionHistoryUl.appendChild(eventLi);
  }
}

/**
 * Сохраняет новую метку и группу (PUT /wallet/update), затем обновляет Watchlist.
 */
export async function saveAliasAndGroup(address, tg, telegramUserId, fetchWatchlist) {
  const alias = ui.editAliasInput.value.trim();
  const group = ui.editGroupInput.value.trim();

  const payload = {
    telegram_user_id: telegramUserId,
    address,
    alias: alias || null,
    group: group || null
  };
  const result = await fetchAPI('/wallet/update', 'PUT', payload, telegramUserId);
  if (result.error) {
    tg.showAlert(`${t('save_error')}: ${result.message}`);
    return;
  }
  ui.summaryAliasSpan.textContent = result.alias || '-';
  ui.summaryGroupSpan.textContent = result.group || '-';
  tg.HapticFeedback.notificationOccurred('success');
  tg.showAlert(t('save_success'));
  await fetchWatchlist(tg, telegramUserId);
}

/**
 * Показывает главный экран («Добавить», «Поиск», «Watchlist»), скрывает «Детали».
 */
export function showWatchlistScreen(tg, telegramUserId) {
  ui.addWalletSection.style.display = 'block';
  ui.watchlistSection.style.display = 'block';
  ui.searchSection.style.display = 'block';
  ui.walletDetailsSection.style.display = 'none';
  tg.BackButton.hide();
}
