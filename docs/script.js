document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // UI элементы
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
    const summaryBalanceSpan = document.getElementById('summaryBalance');
    const summaryTxCountSpan = document.getElementById('summaryTxCount');
    const summaryActivitySpan = document.getElementById('summaryActivity');
    const transactionHistoryUl = document.getElementById('transactionHistory');
    const txLimitSpan = document.getElementById('txLimit');
    const graphDataOutputPre = document.getElementById('graphDataOutput');

    const editAliasInput = document.getElementById('editAliasInput');
    const editGroupInput = document.getElementById('editGroupInput');
    const saveAliasGroupButton = document.getElementById('saveAliasGroupButton');

    const API_BASE_URL = "https://cb95-2a02-3035-a60-557f-8ee9-b277-1c19-2610.ngrok-free.app";
    let currentTelegramUserId = null;

    tg.ready();
    tg.expand();

    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        currentTelegramUserId = tg.initDataUnsafe.user.id;
        const userName = tg.initDataUnsafe.user.username || `${tg.initDataUnsafe.user.first_name} ${tg.initDataUnsafe.user.last_name || ''}`;
        userInfoP.textContent = `Пользователь: ${userName} (ID: ${currentTelegramUserId})`;
        fetchWatchlist();
    } else {
        userInfoP.textContent = 'Не удалось получить данные пользователя Telegram.';
        tg.showAlert('Не удалось идентифицировать пользователя. Попробуйте перезапустить приложение.');
        return;
    }

    async function fetchAPI(endpoint, method = 'GET', body = null) {
        if (!currentTelegramUserId) return null;

        let url = `${API_BASE_URL}${endpoint}`;
        const queryParams = new URLSearchParams({ telegram_user_id: currentTelegramUserId });

        if (method === 'GET' && body) {
            Object.keys(body).forEach(key => queryParams.append(key, body[key]));
        }

        url = `${url}?${queryParams.toString()}`;

        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };

        if (method !== 'GET' && body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`Ошибка API: ${response.statusText}`);
            return await response.json();
        } catch (err) {
            tg.showAlert(`Ошибка: ${err.message}`);
            return null;
        }
    }

    async function fetchWatchlist() {
        showLoadingState(true, 'walletList');
        const wallets = await fetchAPI('/wallets');
        showLoadingState(false, 'walletList');
        walletListUl.innerHTML = '';

        if (wallets && wallets.length) {
            wallets.forEach(wallet => {
                const li = document.createElement('li');
                li.textContent = `${wallet.alias || 'Без метки'} (${wallet.address})`;
                li.dataset.address = wallet.address;
                li.dataset.alias = wallet.alias || '';
                li.addEventListener('click', () => showWalletDetails(wallet.address, wallet.alias));
                walletListUl.appendChild(li);
            });
        } else {
            walletListUl.innerHTML = '<li>Watchlist пуст или ошибка загрузки.</li>';
        }
    }

    async function addWallet() {
        const address = walletAddressInput.value.trim();
        const alias = walletAliasInput.value.trim();
        if (!address) return tg.showAlert('Введите адрес');
        if (address.length < 40 || !/^UQ|EQ/.test(address)) return tg.showAlert('Неверный адрес');

        showLoadingState(true, 'addWalletButton');
        const result = await fetchAPI('/wallet/add', 'POST', { address, alias });
        showLoadingState(false, 'addWalletButton');

        if (result) {
            tg.showAlert('Кошелек добавлен');
            walletAddressInput.value = '';
            walletAliasInput.value = '';
            fetchWatchlist();
        }
    }

    async function showWalletDetails(address, alias) {
    addWalletSection.style.display = 'none';
    watchlistSection.style.display = 'none';
    walletDetailsSection.style.display = 'block';

    detailsAddressSpan.textContent = address;
    summaryAliasSpan.textContent = alias || 'Без метки';
    summaryBalanceSpan.textContent = '-';
    summaryTxCountSpan.textContent = '-';
    summaryActivitySpan.textContent = '-';
    transactionHistoryUl.innerHTML = '<li>Загрузка истории...</li>';

    const history = await fetchAPI(`/wallet/${address}/history`);
    transactionHistoryUl.innerHTML = '';

    if (history?.transactions?.length) {
        txLimitSpan.textContent = history.transactions.length;
        history.transactions.forEach(tx => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${tx.token_type}</strong> ${tx.amount} → ${tx.counterparty}`;
            transactionHistoryUl.appendChild(li);
        });
    } else {
        transactionHistoryUl.innerHTML = '<li>Нет транзакций</li>';
    }
}


    async function saveAliasAndGroup() {
        const newAlias = editAliasInput.value.trim();
        const newGroup = editGroupInput.value.trim();
        const currentAddress = detailsAddressSpan.textContent;

        if (!currentAddress) return tg.showAlert('Адрес не определен');

        const result = await fetchAPI(`/wallet/${currentAddress}/label`, 'POST', { alias: newAlias, group: newGroup });
        if (result && result.success) {
            tg.showAlert('Сохранено');
            summaryAliasSpan.textContent = newAlias || 'Без метки';
            fetchWatchlist();
        } else {
            tg.showAlert('Ошибка сохранения');
        }
    }

    function showWatchlistScreen() {
        addWalletSection.style.display = 'block';
        watchlistSection.style.display = 'block';
        walletDetailsSection.style.display = 'none';
        walletDetailsSection.classList.remove('visible');
        walletDetailsSection.classList.add('hidden');
    }

    function showLoadingState(isLoading, elementId) {
        const el = document.getElementById(elementId);
        if (!el) return;
        if (el.tagName === 'BUTTON') {
            el.disabled = isLoading;
            el.textContent = isLoading ? 'Загрузка...' : (elementId === 'addWalletButton' ? 'Добавить' : 'Обновить');
        }
    }

    // Привязка событий
    addWalletButton.addEventListener('click', addWallet);
    refreshWatchlistButton.addEventListener('click', fetchWatchlist);
    backToWatchlistButton.addEventListener('click', showWatchlistScreen);
    saveAliasGroupButton.addEventListener('click', saveAliasAndGroup);

    tg.BackButton.onClick(showWatchlistScreen);
    tg.BackButton.hide();

    const originalShowWalletDetails = showWalletDetails;
    showWalletDetails = (address, alias) => {
        originalShowWalletDetails(address, alias);
        tg.BackButton.show();
    };

    const originalShowWatchlistScreen = showWatchlistScreen;
    showWatchlistScreen = () => {
        originalShowWatchlistScreen();
        tg.BackButton.hide();
    };
});
