// script.js
document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // UI элементы (без изменений, как в вашем файле)
    const userInfoP = document.getElementById('userInfo');
    const walletAddressInput = document.getElementById('walletAddress');
    const walletAliasInput = document.getElementById('walletAlias');
    const addWalletButton = document.getElementById('addWalletButton');
    const refreshWatchlistButton = document.getElementById('refreshWatchlistButton');
    const walletListUl = document.getElementById('walletList');
    const addWalletSection = document.getElementById('addWalletSection');
    const watchlistSection = document.getElementById('watchlistSection');
    const walletDetailsSection = document.getElementById('walletDetailsSection');
    const detailsAddressSpan = document.getElementById('detailsAddress');
    const backToWatchlistButton = document.getElementById('backToWatchlistButton');
    const summaryAliasSpan = document.getElementById('summaryAlias');
    const summaryBalanceSpan = document.getElementById('summaryBalance'); // Данные баланса не получаем, можно убрать или реализовать
    const summaryTxCountSpan = document.getElementById('summaryTxCount'); // Кол-во транзакций (событий)
    const summaryActivitySpan = document.getElementById('summaryActivity'); // Дата последней активности (можно добавить)
    const transactionHistoryUl = document.getElementById('transactionHistory');
    const txLimitSpan = document.getElementById('txLimit');
    // const graphDataOutputPre = document.getElementById('graphDataOutput'); // Если нужен вывод графа
    const editAliasInput = document.getElementById('editAliasInput');
    const editGroupInput = document.getElementById('editGroupInput');
    const saveAliasGroupButton = document.getElementById('saveAliasGroupButton');
    const visGraphContainer = document.getElementById('visGraphContainer'); // Контейнер для графа
    const searchInput = document.getElementById('searchInput'); // Пример
    const searchButton = document.getElementById('searchButton'); // Пример
    const searchResultsUl = document.getElementById('searchResults'); // Пример
    const summarySection = document.getElementById('walletSummary');

    const API_BASE_URL = "http://127.0.0.1:8000"; // Убедитесь, что совпадает с адресом вашего API
    let currentTelegramUserId = null;
    let currentWalletDataForDetails = {}; // Хранение данных текущего кошелька для деталей

    tg.ready();
    tg.expand();

    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        currentTelegramUserId = tg.initDataUnsafe.user.id;
        const user = tg.initDataUnsafe.user;
        const userName = user.username || `${user.first_name} ${user.last_name || ''}`.trim();
        userInfoP.textContent = `Користувач: ${userName} (ID: ${currentTelegramUserId})`;
        fetchWatchlist();
    } else {
        // userInfoP.textContent = 'Не вдалося отримати дані користувача Telegram. Працюємо в тестовому режимі.';
        // tg.showAlert('Не вдалося ідентифікувати користувача. Спробуйте перезапустити додаток.');
        // Для локального тестування без Telegram:
        currentTelegramUserId = 591582190; // ВАШ ТЕСТОВЫЙ ID или любой другой для тестов
        userInfoP.textContent = `ТЕСТОВИЙ РЕЖИМ (ID: ${currentTelegramUserId})`;
        fetchWatchlist(); // Загружаем список для тестового пользователя
    }

    async function fetchAPI(endpoint, method = 'GET', body = null) {
        if (!currentTelegramUserId && !(body && body.telegram_user_id)) {
            // Для POST/PUT ID пользователя должен быть в теле запроса, если не установлен глобально
            if (method !== 'POST' && method !== 'PUT') {
                 tg.showAlert('Помилка: ID користувача Telegram не доступний.');
                 console.error('Telegram User ID is missing for API call.');
                 return null;
            } else if (body && !body.telegram_user_id) {
                tg.showAlert('Помилка: ID користувача Telegram не переданий для операції.');
                console.error('Telegram User ID is missing in body for POST/PUT.');
                return null;
            }
        }

        let url = `${API_BASE_URL}${endpoint}`;
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };

        if (method === 'GET') {
            const queryParams = new URLSearchParams();
            // Для GET запросов ID пользователя передается как query параметр
            if (currentTelegramUserId) {
                 queryParams.append('telegram_user_id', currentTelegramUserId);
            }
            // Если тело передано для GET, оно также преобразуется в query параметры
            // (например, для /history?limit=X)
            if (body) {
                for (const [key, value] of Object.entries(body)) {
                    queryParams.append(key, value);
                }
            }
            if (queryParams.toString()) {
                 url += `?${queryParams.toString()}`;
            }
        } else if (body) { // Для POST, PUT и т.д.
            // ID пользователя уже должен быть в 'body' благодаря вызывающим функциям
            options.body = JSON.stringify(body);
        }

        showLoadingState(true, method === 'GET' ? 'refreshWatchlistButton' : 'addWalletButton'); // Общее состояние загрузки

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                let errorDetail = `Помилка API: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorDetail = errorData.detail || errorDetail;
                } catch (e) { /* не удалось распарсить JSON ошибки */ }
                throw new Error(errorDetail + ` (Статус: ${response.status})`);
            }
            // Для ответов 204 (No Content), например, при удалении
            if (response.status === 204) return { success: true };
            return await response.json();
        } catch (err) {
            console.error('Fetch API Error:', err);
            tg.showAlert(`Помилка запиту до API: ${err.message}`);
            return null;
        } finally {
            showLoadingState(false, method === 'GET' ? 'refreshWatchlistButton' : 'addWalletButton');
        }
    }

    async function fetchWatchlist() {
        showLoadingState(true, 'walletList');
        // Эндпоинт GET /wallet ожидает telegram_user_id как query параметр, fetchAPI это обработает
        const wallets = await fetchAPI('/wallet');
        showLoadingState(false, 'walletList');
        walletListUl.innerHTML = '';

        if (wallets && wallets.length > 0) {
            wallets.forEach(wallet => {
                const li = document.createElement('li');
                let displayText = wallet.alias || 'Без метки';
                const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`;
                displayText += ` (${shortAddress})`;
                if (wallet.group) {
                    displayText += ` <span class="wallet-group">[${wallet.group}]</span>`;
                }
                li.innerHTML = displayText; // Используем innerHTML для span
                li.dataset.address = wallet.address;
                li.dataset.alias = wallet.alias || '';
                li.dataset.group = wallet.group || ''; // Сохраняем группу
                li.addEventListener('click', () => showWalletDetails(wallet)); // Передаем весь объект wallet
                walletListUl.appendChild(li);
            });
        } else if (wallets && wallets.length === 0) {
            walletListUl.innerHTML = '<li>Ваш Watchlist порожній. Додайте гаманець вище.</li>';
        } else {
            walletListUl.innerHTML = '<li>Не вдалося завантажити Watchlist.</li>';
        }
    }

    async function addWallet() {
        const address = walletAddressInput.value.trim();
        const alias = walletAliasInput.value.trim();
        // const group = ""; // Можно добавить поле для группы при добавлении

        if (!address) {
            tg.showAlert('Будь ласка, введіть адресу гаманця.');
            return;
        }
        if (!/^(UQ|EQ)/.test(address) || address.length < 48) {
             tg.showAlert('Адреса гаманця не схожа на дійсну TON адресу.');
             return;
        }
        if (!currentTelegramUserId) {
            tg.showAlert('Помилка: ID користувача Telegram не визначено.');
            return;
        }

        showLoadingState(true, 'addWalletButton');
        const payload = {
            telegram_user_id: currentTelegramUserId,
            address: address,
            alias: alias || null, // Отправляем null, если пусто, API обработает
            // group: group || null,
            username: tg.initDataUnsafe?.user?.username || `${tg.initDataUnsafe?.user?.first_name} ${tg.initDataUnsafe?.user?.last_name || ''}`.trim()
        };

        const result = await fetchAPI('/wallet/add', 'POST', payload);
        showLoadingState(false, 'addWalletButton');

        if (result && result.message) { // API возвращает объект с message
            tg.HapticFeedback.notificationOccurred('success');
            tg.showAlert(result.message);
            walletAddressInput.value = '';
            walletAliasInput.value = '';
            fetchWatchlist(); // Обновляем список
        } else if (result && result.detail) { // Если API вернуло ошибку HTTPExceptio
             tg.showAlert(`Помилка: ${result.detail}`);
        }
    }

async function showWalletDetails(wallet) {
    currentWalletDataForDetails = wallet;

    addWalletSection.style.display = 'none';
    watchlistSection.style.display = 'none';
    walletDetailsSection.style.display = 'block'; // Показываем секцию деталей
    // ... (остальное скрытие/отображение секций) ...

    detailsAddressSpan.textContent = wallet.address;
    summaryAliasSpan.textContent = wallet.alias || 'Без метки';
    editAliasInput.value = wallet.alias || '';
    editGroupInput.value = wallet.group || '';

    // Очистка предыдущих данных
    summaryBalanceSpan.textContent = 'Завантаження...';
    summaryTxCountSpan.textContent = 'Завантаження...';
    summaryActivitySpan.textContent = 'Завантаження...';
    document.getElementById('summaryIsScam').textContent = 'Завантаження...'; // Добавьте этот span в HTML
    transactionHistoryUl.innerHTML = '<li>Завантаження історії транзакцій...</li>';
    visGraphContainer.innerHTML = '<p>Завантаження графа...</p>';

    tg.BackButton.show();

    // 1. Загружаем сводку
    const summaryData = await fetchAPI(`/wallet/${wallet.address}/summary`, 'GET', { telegram_user_id: currentTelegramUserId });
    if (summaryData) {
        summaryBalanceSpan.textContent = summaryData.balance_ton !== null ? `${summaryData.balance_ton.toFixed(4)} TON` : '-';
        summaryTxCountSpan.textContent = summaryData.total_tx_count !== null ? summaryData.total_tx_count : '-';
        summaryActivitySpan.textContent = summaryData.last_activity_ts ? new Date(summaryData.last_activity_ts * 1000).toLocaleString() : '-';
        document.getElementById('summaryIsScam').innerHTML = summaryData.is_scam !== null ? (summaryData.is_scam ? '<span style="color:red;">🔴 Так</span>' : '<span style="color:green;">🟢 Ні</span>') : '-';
        // Заполните и другие поля сводки, если они есть в WalletSummary и HTML
    } else {
        summaryBalanceSpan.textContent = 'Помилка';
        // ... и для других полей сводки
    }

    // 2. Загружаем историю транзакций (как раньше)
    await fetchTransactionHistory(wallet.address); // fetchTransactionHistory уже есть и обновляет transactionHistoryUl

    // 3. Загружаем и отображаем граф
    // Передаем telegram_user_id, так как API /graph его ожидает
    const graphData = await fetchAPI(`/wallet/graph`, 'GET', { telegram_user_id: currentTelegramUserId, target_address: wallet.address, depth: 1 });
    if (graphData && graphData.nodes && graphData.edges) {
        generateAndDisplayVisGraph(graphData); // Новая функция для отрисовки с vis.js
    } else {
        visGraphContainer.innerHTML = `<p>Не вдалося завантажити дані для графа. ${graphData?.message || ''}</p>`;
    }
}

function generateAndDisplayVisGraph(graphData) {
    if (!visGraphContainer || !window.vis) {
        visGraphContainer.innerHTML = '<p>Бібліотека для графів (vis.js) не завантажена або контейнер не знайдений.</p>';
        return;
    }
    visGraphContainer.innerHTML = ''; // Очищаем

    if (!graphData || !graphData.nodes || !graphData.edges || graphData.nodes.length === 0) {
        visGraphContainer.innerHTML = `<p>Немає даних для побудови графа. ${graphData?.message || ''}</p>`;
        return;
    }

    const nodes = new vis.DataSet(graphData.nodes.map(n => ({
        id: n.id,
        label: n.label,
        title: n.meta ? `Label: ${n.meta.user_label || '-'}\nIn: ${n.meta.in_tx_count} tx (${n.meta.total_ton_in.toFixed(2)} TON)\nOut: ${n.meta.out_tx_count} tx (${n.meta.total_ton_out.toFixed(2)} TON)` : n.label,
        color: n.color,
        shape: n.shape,
        value: n.value // Размер узла
    })));

    const edges = new vis.DataSet(graphData.edges.map(e => ({
        from: e.from_node, // API отдает from_node
        to: e.to_node,     // API отдает to_node
        label: e.label,
        title: e.title,
        arrows: e.arrows || 'to',
        value: e.value // Толщина ребра
    })));

    const data = { nodes: nodes, edges: edges };
    const options = { // Настройки из вашего предыдущего script.js или улучшенные
        layout: {
            hierarchical: false,
            improvedLayout: true,
        },
        edges: {
            smooth: { type: 'continuous', roundness: 0.2 }, // 'continuous' может быть лучше для динамики
            width: 1,
            font: { size: 10, align: 'middle', strokeWidth: 2, strokeColor: '#ffffff' },
            color: { inherit: 'from' } // Цвет ребра от исходящего узла
        },
        nodes: {
            borderWidth: 1,
            font: { size: 12, face: 'Arial' },
            shadow: true
        },
        physics: {
            enabled: true,
            solver: 'forceAtlas2Based', // Другой солвер, может дать хороший результат
            forceAtlas2Based: {
                gravitationalConstant: -30,
                centralGravity: 0.005,
                springLength: 100,
                springConstant: 0.05,
                damping: 0.8
            },
            stabilization: { iterations: 150 }
        },
        interaction: {
            hover: true,
            tooltipDelay: 200,
            navigationButtons: true,
            keyboard: true,
            dragNodes: true,
            dragView: true,
            zoomView: true
        }
    };
    new vis.Network(visGraphContainer, data, options);

    // Можно добавить обработчики событий на клик по узлу и т.д.
    // network.on("click", function (params) { ... });
}

    async function performSearch() {
    if (!searchInput || !searchResultsUl) return; // Проверка наличия элементов

    const query = searchInput.value.trim();
    if (query.length < 3) {
        searchResultsUl.innerHTML = '<li>Введіть мінімум 3 символи для пошуку.</li>';
        return;
    }
    if (!currentTelegramUserId) {
        searchResultsUl.innerHTML = '<li>ID користувача не визначено.</li>';
        return;
    }

    showLoadingState(true, 'searchButton'); // Нужен соответствующий элемент или контекст
    searchResultsUl.innerHTML = '<li>Пошук...</li>';

    const results = await fetchAPI('/wallet/wallets/search', 'GET', { telegram_user_id: currentTelegramUserId, query: query });
    showLoadingState(false, 'searchButton');

    searchResultsUl.innerHTML = '';
    if (results && results.length > 0) {
        results.forEach(wallet => {
            const li = document.createElement('li');
            let displayText = wallet.alias || 'Без метки';
            const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`;
            displayText += ` (${shortAddress})`;
            if (wallet.group) {
                displayText += ` <span class="wallet-group">[${wallet.group}]</span>`;
            }
            li.innerHTML = displayText;
            li.dataset.address = wallet.address;
            li.dataset.alias = wallet.alias || '';
            li.dataset.group = wallet.group || '';
            // При клике на результат поиска можно открывать детали этого кошелька
            li.addEventListener('click', () => showWalletDetails(wallet));
            searchResultsUl.appendChild(li);
        });
    } else if (results) {
        searchResultsUl.innerHTML = '<li>Нічого не знайдено.</li>';
    } else {
        searchResultsUl.innerHTML = '<li>Помилка пошуку.</li>';
    }
}
if (searchButton) { // Если кнопка поиска есть на странице
    searchButton.addEventListener('click', performSearch);
}
if (searchInput) { // Поиск по Enter в поле ввода
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
}

function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const graphTargetAddress = urlParams.get('graph_target');
    const webAppUserId = urlParams.get('telegram_user_id'); // Если ID передается так

    if (webAppUserId && !currentTelegramUserId) {
        // Если ID из URL, а tg.initDataUnsafe не сработал (например, при прямом открытии)
        // Это для отладки, в реальном WebApp tg.initDataUnsafe должен быть главным источником
        // currentTelegramUserId = parseInt(webAppUserId);
        // userInfoP.textContent = `Користувач (з URL): ${currentTelegramUserId}`;
        // fetchWatchlist(); // Загрузить данные для этого пользователя
    }

    if (graphTargetAddress && currentTelegramUserId) {
        // Если в URL есть параметр для отображения графа конкретного адреса
        // Имитируем выбор этого кошелька и открытие деталей
        // Нужно найти или сформировать объект wallet для showWalletDetails
        const pseudoWallet = { address: graphTargetAddress, alias: "Граф для", group: "" };
        showWalletDetails(pseudoWallet);
    }
}


    async function fetchTransactionHistory(address) {
        const historyLimit = 10; // Можно сделать настраиваемым
        txLimitSpan.textContent = historyLimit.toString();
        // Для GET /history, body используется для передачи query параметров, таких как limit
        const historyEvents = await fetchAPI(`/wallet/${address}/history`, 'GET', { limit: historyLimit });
        transactionHistoryUl.innerHTML = '';

        if (historyEvents && historyEvents.length > 0) {
            summaryTxCountSpan.textContent = historyEvents.length.toString(); // Количество загруженных событий
            let latestTimestamp = 0;

            historyEvents.forEach(event => {
                if (event.timestamp && event.timestamp > latestTimestamp) {
                    latestTimestamp = event.timestamp;
                }
                const eventTimestamp = event.timestamp ? new Date(event.timestamp * 1000).toLocaleString() : 'Дата невідома';

                event.actions.forEach(action => {
                    const li = document.createElement('li');
                    let actionHtml = `<div class="tx-action">`;
                    actionHtml += `<span class="tx-type">${action.type || 'Невідомо'}</span> <small class="tx-time">(${eventTimestamp})</small>`;
                    if (action.status && action.status !== "ok") {
                        actionHtml += ` <span class="tx-status-failed">(${action.status})</span>`;
                    }
                    actionHtml += `<br>`;

                    let details = action.description || ''; // Используем описание из simplePreview если есть

                    switch (action.type) {
                        case "TON Transfer":
                            details = `${action.is_send ? '➡️ Відправлено' : '⬅️ Отримано'} <b>${(action.amount_ton || 0).toFixed(4)} TON</b>`;
                            details += ` ${action.is_send ? 'на' : 'з'} ${action.is_send ? action.recipient : action.sender}`;
                            if (action.comment) details += `<br><small class="tx-comment"><i>${action.comment}</i></small>`;
                            break;
                        case "Jetton Transfer":
                            details = `${action.is_send ? '➡️ Відправлено' : '⬅️ Отримано'} <b>${(action.amount || 0).toFixed(action.jetton_decimals || 2)} ${action.jetton_symbol || 'Jetton'}</b>`;
                            details += ` ${action.is_send ? 'на' : 'з'} ${action.is_send ? action.recipient : action.sender}`;
                            break;
                        case "NFT Transfer":
                            details = `${action.is_send ? '➡️ Відправлено' : '⬅️ Отримано'} NFT "<b>${action.nft_name || 'Без імені'}</b>"`;
                            details += ` ${action.is_send ? 'на' : 'з'} ${action.is_send ? action.recipient : action.sender}`;
                            break;
                        case "Swap":
                            details = `🔄 Обмін <b>${(action.amount_in || 0).toFixed(4)} ${action.asset_in || '?'}</b> на <b>${(action.amount_out || 0).toFixed(4)} ${action.asset_out || '?'}</b>`;
                            if(action.dex) details += ` через ${action.dex}`;
                            break;
                        default:
                            if (!details) details = `Тип: ${action.type}. Деталі не розібрані.`;
                            break;
                    }
                    actionHtml += `<span class="tx-details">${details}</span></div>`;
                    li.innerHTML = actionHtml;
                    transactionHistoryUl.appendChild(li);
                });
                if (event.actions.length > 0) { // Добавляем разделитель только если были действия
                    const separator = document.createElement('hr');
                    separator.className = 'tx-event-separator';
                    transactionHistoryUl.appendChild(separator);
                }
            });
            if (latestTimestamp > 0) {
                summaryActivitySpan.textContent = new Date(latestTimestamp * 1000).toLocaleDateString();
            }

        } else if (historyEvents && historyEvents.length === 0) {
            transactionHistoryUl.innerHTML = '<li>Історія транзакцій порожня.</li>';
            summaryTxCountSpan.textContent = '0';
        } else {
            transactionHistoryUl.innerHTML = '<li>Не вдалося завантажити історію транзакцій.</li>';
        }
    }


    async function saveAliasAndGroup() {
        const newAlias = editAliasInput.value.trim();
        const newGroup = editGroupInput.value.trim();
        const currentAddress = detailsAddressSpan.textContent;

        if (!currentAddress) {
            tg.showAlert('Помилка: Адресу гаманця не визначено.');
            return;
        }
         if (!currentTelegramUserId) {
            tg.showAlert('Помилка: ID користувача Telegram не визначено.');
            return;
        }

        showLoadingState(true, 'saveAliasGroupButton');
        const payload = {
            telegram_user_id: currentTelegramUserId,
            alias: newAlias || null, // API ожидает null, если строка пустая
            group: newGroup || null, // API ожидает null, если строка пустая
            username: tg.initDataUnsafe?.user?.username || `${tg.initDataUnsafe?.user?.first_name} ${tg.initDataUnsafe?.user?.last_name || ''}`.trim()
        };

        const result = await fetchAPI(`/wallet/${currentAddress}/label`, 'POST', payload); // Используем POST
        showLoadingState(false, 'saveAliasGroupButton');


        if (result && result.message) {
            tg.HapticFeedback.notificationOccurred('success');
            tg.showAlert(result.message);
            summaryAliasSpan.textContent = result.alias || 'Без метки'; // Обновляем отображаемую метку
            // Обновляем данные в currentWalletDataForDetails, чтобы при следующем открытии были свежие данные
            currentWalletDataForDetails.alias = result.alias;
            currentWalletDataForDetails.group = result.group;
            fetchWatchlist(); // Обновляем весь список, т.к. метка могла измениться
        } else if (result && result.detail) {
            tg.showAlert(`Помилка збереження: ${result.detail}`);
        }
    }

    function showWatchlistScreen() {
        addWalletSection.style.display = 'block';
        watchlistSection.style.display = 'block';
        walletDetailsSection.style.display = 'none';
        walletDetailsSection.classList.remove('visible');
        walletDetailsSection.classList.add('hidden');
        tg.BackButton.hide();
        currentWalletDataForDetails = {}; // Сброс данных
    }

    function showLoadingState(isLoading, elementContext) {
        // Можно сделать более гранулированное управление состоянием загрузки
        // Например, для кнопки "Добавить", "Обновить список", "Сохранить метку"
        let button;
        let originalText = '';

        if (elementContext === 'addWalletButton') {
            button = addWalletButton;
            originalText = 'Додати';
        } else if (elementContext === 'refreshWatchlistButton' || elementContext === 'walletList') {
            button = refreshWatchlistButton;
            originalText = 'Обновити список';
        } else if (elementContext === 'saveAliasGroupButton') {
            button = saveAliasGroupButton;
            originalText = '💾 Зберегти';
        }
        // Можно добавить глобальный спиннер на весь экран
        // document.getElementById('globalLoader').style.display = isLoading ? 'flex' : 'none';

        if (button) {
            button.disabled = isLoading;
            button.textContent = isLoading ? 'Завантаження...' : originalText;
        }
        // Для списка кошельков можно показывать/скрывать сообщение "Загрузка..."
        if (elementContext === 'walletList' && isLoading) {
            walletListUl.innerHTML = '<li>Завантаження списку гаманців...</li>';
        }
    }

    // --- Визуализация графа (пример с vis-network) ---
    // Эта функция должна быть вызвана, когда у вас есть данные для графа
    // Например, после загрузки истории транзакций или из отдельного эндпоинта API
    function generateAndDisplayGraph(walletAddress, transactions) {
        if (!visGraphContainer || !window.vis) {
            console.warn("Vis Network library or container not found.");
            visGraphContainer.innerHTML = '<p>Бібліотека для графів не завантажена.</p>';
            return;
        }
        visGraphContainer.innerHTML = ''; // Очищаем перед отрисовкой

        if (!transactions || transactions.length === 0) {
            visGraphContainer.innerHTML = '<p>Немає даних для побудови графа.</p>';
            return;
        }

        const nodes = new vis.DataSet();
        const edges = new vis.DataSet();
        const addedNodes = new Set();

        // Добавляем центральный узел (текущий кошелек)
        nodes.add({ id: walletAddress, label: ` monitored_wallet:\n${walletAddress.substring(0,6)}... `, color: '#FFD700', shape: 'box' });
        addedNodes.add(walletAddress);

        transactions.forEach(event => {
            event.actions.forEach(action => {
                let fromNode = null;
                let toNode = null;
                let label = action.type;
                let value = 0; // Для толщины ребра, если нужно

                if (action.type === "TON Transfer" || action.type === "Jetton Transfer" || action.type === "NFT Transfer") {
                    fromNode = action.sender;
                    toNode = action.recipient;
                    if (action.amount_ton) {
                         value = action.amount_ton;
                         label += `\n${action.amount_ton.toFixed(2)} TON`;
                    } else if (action.amount) {
                        value = action.amount; // Может быть очень большим для джеттонов без нормализации
                        label += `\n${action.amount.toFixed(2)} ${action.jetton_symbol || ''}`;
                    }
                } else if (action.type === "Swap") {
                    // Для Swap можно показать связь с DEX или входящий/исходящий актив как узлы
                    // Это более сложная визуализация, пока пропустим или упростим
                    return; // Пропускаем Swap для простого графа связей
                } else {
                    return; // Пропускаем другие типы действий
                }

                if (fromNode && toNode) {
                    if (fromNode !== walletAddress && !addedNodes.has(fromNode)) {
                        nodes.add({ id: fromNode, label: `${fromNode.substring(0,6)}...`, shape: 'ellipse' });
                        addedNodes.add(fromNode);
                    }
                    if (toNode !== walletAddress && !addedNodes.has(toNode)) {
                        nodes.add({ id: toNode, label: `${toNode.substring(0,6)}...`, shape: 'ellipse' });
                        addedNodes.add(toNode);
                    }

                    // Добавляем ребро
                    edges.add({
                        from: fromNode,
                        to: toNode,
                        arrows: 'to',
                        label: label.split('\n')[0], // Краткая метка на ребре
                        title: label, // Полная информация при наведении
                        value: Math.max(1, Math.log10(value + 1)) // Логарифмическое масштабирование для толщины
                    });
                }
            });
        });

        if (nodes.length <= 1) { // Только центральный узел
             visGraphContainer.innerHTML = '<p>Недостатньо даних для графа (тільки вихідний гаманець).</p>';
             return;
        }

        const data = { nodes: nodes, edges: edges };
        const options = {
            layout: {
                hierarchical: false, // Можно попробовать true для иерархического вида
                 improvedLayout:true,
            },
            edges: {
                smooth: {
                    type: 'cubicBezier',
                    forceDirection: 'horizontal',
                    roundness: 0.4
                },
                width: 2,
                 font: {
                    size: 10,
                    align: 'middle'
                },
            },
            nodes: {
                 borderWidth: 2,
                 font: {
                    size: 12,
                    face: 'Arial'
                },
                 shadow:true
            },
            physics: {
                enabled: true, // Включаем физику для лучшего распределения
                barnesHut: {
                    gravitationalConstant: -10000,
                    centralGravity: 0.1,
                    springLength: 150,
                    springConstant: 0.05,
                    damping: 0.09,
                    avoidOverlap: 0.1
                },
                solver: 'barnesHut', // 'repulsion' может быть альтернативой
                 stabilization: { iterations: 1000 }
            },
            interaction: {
                hover: true,
                tooltipDelay: 200,
                navigationButtons: true,
                keyboard: true
            }
        };
        new vis.Network(visGraphContainer, data, options);
    }


    // Переопределение showWalletDetails для отображения кнопки "Назад" Telegram
    const originalShowWalletDetails = showWalletDetails;
    showWalletDetails = (wallet) => { // Принимаем объект wallet
        originalShowWalletDetails(wallet);
        tg.BackButton.show();
        // Вызов функции отрисовки графа
        // Сначала нужно получить транзакции, затем передать их в generateAndDisplayGraph
        fetchAPI(`/wallet/${wallet.address}/history`, 'GET', { limit: 20 /* или другой лимит для графа */ })
            .then(historyEvents => {
                if (historyEvents) {
                    generateAndDisplayGraph(wallet.address, historyEvents);
                } else {
                     visGraphContainer.innerHTML = '<p>Не вдалося завантажити дані для графа.</p>';
                }
            });
    };

    // Переопределение showWatchlistScreen для скрытия кнопки "Назад" Telegram
    const originalShowWatchlistScreen = showWatchlistScreen;
    showWatchlistScreen = () => {
        originalShowWatchlistScreen();
        tg.BackButton.hide();
    };

    // Привязка событий
    addWalletButton.addEventListener('click', addWallet);
    refreshWatchlistButton.addEventListener('click', fetchWatchlist);
    backToWatchlistButton.addEventListener('click', showWatchlistScreen);
    saveAliasGroupButton.addEventListener('click', saveAliasAndGroup);

    // Назначаем обработчик для кнопки "Назад" Telegram
    tg.BackButton.onClick(showWatchlistScreen);

// Вызываем обработку URL параметров при загрузке
handleUrlParams();
});
