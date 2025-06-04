// uiElements.js
export const ui = {
  // --- Общие элементы ---
  userInfoP: document.getElementById('userInfo'),
  globalBackButton: document.getElementById('globalBackButton'),

  // --- Секция «Добавить кошелек» ---
  walletAddressInput: document.getElementById('walletAddress'),
  walletAliasInput: document.getElementById('walletAlias'),
  addWalletButton: document.getElementById('addWalletButton'),
  refreshWatchlistButton: document.getElementById('refreshWatchlistButton'),
  walletListUl: document.getElementById('walletList'),
  addWalletSection: document.getElementById('addWalletSection'),
  watchlistSection: document.getElementById('watchlistSection'),

  // --- Секция «Поиск» ---
  searchSection: document.getElementById('searchSection'),
  searchInput: document.getElementById('searchInput'),
  searchButton: document.getElementById('searchButton'),
  searchResultsUl: document.getElementById('searchResults'),

  // --- Секция «Детали кошелька» ---
  walletDetailsSection: document.getElementById('walletDetailsSection'),
  detailsAddressSpan: document.getElementById('detailsAddress'),
  backToWatchlistButton: document.getElementById('backToWatchlistButton'),

  summaryBalanceSpan: document.getElementById('summaryBalance'),
  summaryTxCountSpan: document.getElementById('summaryTxCount'),
  summaryActivitySpan: document.getElementById('summaryActivity'),
  summaryIsScamSpan: document.getElementById('summaryIsScam'),
  summaryAliasSpan: document.getElementById('summaryAlias'),
  summaryGroupSpan: document.getElementById('summaryGroup'),

  editAliasInput: document.getElementById('editAliasInput'),
  editGroupInput: document.getElementById('editGroupInput'),
  saveAliasGroupButton: document.getElementById('saveAliasGroupButton'),

  transactionHistoryUl: document.getElementById('transactionHistory'),
  txLimitSpan: document.getElementById('txLimit'),
  visGraphContainer: document.getElementById('visGraphContainer'),
};
