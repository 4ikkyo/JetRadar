// uiElements.js
/**
 * Вызывается после построения DOM, чтобы заполнить объект ui:
 */
export function initializeUI() {
  // --- Общие элементы ---
  ui.userInfoP              = document.getElementById('userInfo');
  ui.languageSwitcher       = document.getElementById('languageSwitcher');

  // --- Секция «Добавить кошелек» ---
  ui.addWalletSection       = document.getElementById('addWalletSection');
  ui.walletAddressInput     = document.getElementById('walletAddressInput');
  ui.walletAliasInput       = document.getElementById('walletAliasInput');
  ui.addWalletButton        = document.getElementById('addWalletButton');

  // --- Секция «Поиск» ---
  ui.searchSection          = document.getElementById('searchSection');
  ui.searchInput            = document.getElementById('searchInput');
  ui.searchButton           = document.getElementById('searchButton');
  ui.searchResultsContainer = document.getElementById('searchResultsContainer');
  ui.searchResultsUl        = document.getElementById('searchResultsUl');

  // --- Секция «Watchlist» ---
  ui.watchlistSection       = document.getElementById('watchlistSection');
  ui.refreshWatchlistButton = document.getElementById('refreshWatchlistButton');
  ui.walletListContainer    = document.getElementById('walletListContainer');
  ui.walletListUl           = document.getElementById('walletListUl');

  // --- Секция «Детали кошелька» ---
  ui.walletDetailsSection   = document.getElementById('walletDetailsSection');

  ui.walletSummaryContainer   = document.getElementById('walletSummaryContainer');
  ui.detailsAddressSpan       = document.getElementById('detailsAddressSpan');
  ui.summaryBalanceSpan       = document.getElementById('summaryBalanceSpan');
  ui.summaryTxCountSpan       = document.getElementById('summaryTxCountSpan');
  ui.summaryActivitySpan      = document.getElementById('summaryActivitySpan');
  ui.summaryIsScamSpan        = document.getElementById('summaryIsScamSpan');
  ui.summaryAliasSpan         = document.getElementById('summaryAliasSpan');
  ui.summaryGroupSpan         = document.getElementById('summaryGroupSpan');

  ui.editAliasGroupContainer  = document.getElementById('editAliasGroupContainer');
  ui.editAliasInput           = document.getElementById('editAliasInput');
  ui.editGroupInput           = document.getElementById('editGroupInput');
  ui.saveAliasGroupButton     = document.getElementById('saveAliasGroupButton');

  ui.txControls               = document.getElementById('txControls');
  ui.txSortSelect             = document.getElementById('txSortSelect');
  ui.txTypeFilter             = document.getElementById('txTypeFilter');
  ui.txLimitSpan              = document.getElementById('txLimitSpan');
  ui.transactionHistoryContainer = document.getElementById('transactionHistoryContainer');
  ui.transactionHistoryUl     = document.getElementById('transactionHistoryUl');

  ui.graphFilters             = document.getElementById('graphFilters');
  ui.filterIncomingCheckbox   = document.getElementById('filterIncomingCheckbox');
  ui.filterOutgoingCheckbox   = document.getElementById('filterOutgoingCheckbox');
  ui.filterJettonCheckbox     = document.getElementById('filterJettonCheckbox');
  ui.minAmountInput           = document.getElementById('minAmountInput');
  ui.applyGraphFiltersButton  = document.getElementById('applyGraphFiltersButton');
  ui.visGraphContainer        = document.getElementById('visGraphContainer');
}

export const ui = {
  // --- Общие элементы ---
  userInfoP: null,
  languageSwitcher: null,

  // --- Секция «Добавить кошелек» ---
  addWalletSection: null,
  walletAddressInput: null,
  walletAliasInput: null,
  addWalletButton: null,

  // --- Секция «Поиск» ---
  searchSection: null,
  searchInput: null,
  searchButton: null,
  searchResultsContainer: null,
  searchResultsUl: null,

  // --- Секция «Watchlist» ---
  watchlistSection: null,
  refreshWatchlistButton: null,
  walletListContainer: null,
  walletListUl: null,

  // --- Секция «Детали кошелька» ---
  walletDetailsSection: null,

  walletSummaryContainer: null,
  detailsAddressSpan: null,
  summaryBalanceSpan: null,
  summaryTxCountSpan: null,
  summaryActivitySpan: null,
  summaryIsScamSpan: null,
  summaryAliasSpan: null,
  summaryGroupSpan: null,

  editAliasGroupContainer: null,
  editAliasInput: null,
  editGroupInput: null,
  saveAliasGroupButton: null,

  txControls: null,
  txSortSelect: null,
  txTypeFilter: null,
  txLimitSpan: null,
  transactionHistoryContainer: null,
  transactionHistoryUl: null,

  graphFilters: null,
  filterIncomingCheckbox: null,
  filterOutgoingCheckbox: null,
  filterJettonCheckbox: null,
  minAmountInput: null,
  applyGraphFiltersButton: null,
  visGraphContainer: null,
};


import { t } from './lang.js'; // импорт локализации

/**
 * Управление состоянием загрузки (плейсхолдер / спиннер) для разных типов элементов.
 * @param {HTMLElement|null} element - элемент, для которого показывается загрузка
 * @param {boolean} isLoading - true, если загружаем, false — убираем
 * @param {'button' | 'container' | 'list'} type - тип элемента
 * @param {string} [originalText=''] - исходный текст (для кнопок)
 */
export function setLoadingState(element, isLoading, type = 'button', originalText = '') {
  if (!element) return;

  if (type === 'button') {
    const button = element;
    button.disabled = isLoading;
    if (isLoading) {
      if (!button.dataset.originalText) {
        button.dataset.originalText = originalText || button.innerHTML;
      }
      button.innerHTML = `<span class="spinner"></span> ${t('loading')}`;
    } else {
      button.innerHTML = button.dataset.originalText || originalText;
      delete button.dataset.originalText;
    }
  } else if (type === 'container' || type === 'list') {
    if (isLoading) {
      element.classList.add('loading-overlay');
      if (type === 'list') element.innerHTML = ''; // Очищаем список при показе оверлея
    } else {
      element.classList.remove('loading-overlay');
    }
  }
}
