// utils.js
import { ui } from './uiElements.js';

/**
 * Создаёт <li> для одного кошелька (Watchlist или результаты поиска).
 * @param {{ address: string, alias: string|null, group: string|null }} wallet
 * @returns {HTMLLIElement}
 */
export function createWalletListItem(wallet) {
  const li = document.createElement('li');
  const shortAddress = `${wallet.address.substring(0, 6)}…${wallet.address.slice(-4)}`;
  let displayText = wallet.alias
    ? `${wallet.alias} (${shortAddress})`
    : shortAddress;

  if (wallet.group) {
    displayText += ` [${wallet.group}]`;
  }

  li.textContent = displayText;
  li.dataset.address = wallet.address;
  li.dataset.alias = wallet.alias || '';
  li.dataset.group = wallet.group || '';
  li.style.cursor = 'pointer';
  return li;
}

// Быстрая проверка: в консоль выведется предупреждение,
// если какой-то элемент из uiElements не найден в DOM.
Object.values(ui).forEach(el => {
  if (!el) {
    console.warn('UI element not found in DOM. Проверьте, что index.html содержит этот элемент с правильным id.');
  }
});
