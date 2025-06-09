// utils.js
import { t } from './lang.js'; // Для локализации в утилитах, если потребуется

/**
 * Создаёт HTML элемент <li> для отображения кошелька в списке.
 * @param {{ address: string, alias: string|null, group: string|null, balance_ton?: number, last_activity_ts?: number }} wallet - Данные кошелька.
 * @param {Function} [onDelete] - Опциональный callback для кнопки удаления.
 * @returns {HTMLLIElement} - Готовый элемент списка.
 */
export function createWalletListItem(wallet, onDelete) {
  const li = document.createElement('li');
  li.classList.add('wallet-list-item'); // Для возможной стилизации
  li.dataset.address = wallet.address;
  li.dataset.alias = wallet.alias || '';
  li.dataset.group = wallet.group || '';

  const shortAddress = `${wallet.address.substring(0, 6)}…${wallet.address.slice(-4)}`;
  let mainText = wallet.alias ? `${wallet.alias} (${shortAddress})` : shortAddress;
  if (wallet.group) {
    mainText += ` <span class="wallet-group-badge">[${wallet.group}]</span>`;
  }

  let subText = '';
  if (typeof wallet.balance_ton === 'number') {
    subText += `<span class="wallet-balance">${wallet.balance_ton.toFixed(2)} TON</span>`;
  }
  if (wallet.last_activity_ts) {
    const activityDate = new Date(wallet.last_activity_ts * 1000).toLocaleDateString();
    subText += subText ? ` - ${activityDate}` : activityDate;
  }


  let deleteButtonHtml = '';
  if (onDelete) {
    // Кнопка удаления будет справа
    deleteButtonHtml = `<button class="delete-wallet-btn" data-i18n-title="delete" title="${t('delete')}">&times;</button>`;
  }

  li.innerHTML = `
    <div class="wallet-item-content">
      <div class="wallet-item-main">${mainText}</div>
      ${subText ? `<div class="wallet-item-sub">${subText}</div>` : ''}
    </div>
    ${deleteButtonHtml}
  `;

  if (onDelete) {
    const deleteBtn = li.querySelector('.delete-wallet-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Предотвращаем клик по всему <li>
            onDelete(wallet.address, wallet.alias || shortAddress);
        });
    }
  }

  // Стили для элементов списка (можно вынести в CSS)
  const style = document.createElement('style');
  if (!document.getElementById('wallet-list-item-styles')) { // Добавляем стили только один раз
    style.id = 'wallet-list-item-styles';
    style.textContent = `
      .wallet-list-item { display: flex; justify-content: space-between; align-items: center; }
      .wallet-item-content { flex-grow: 1; }
      .wallet-item-main { font-weight: 500; }
      .wallet-item-sub { font-size: 0.85em; color: var(--tg-theme-hint-color); }
      .wallet-group-badge { font-size: 0.8em; color: var(--tg-theme-link-color); opacity: 0.8; }
      .delete-wallet-btn {
        background: none; border: none; color: var(--tg-theme-destructive-text-color);
        font-size: 1.5em; cursor: pointer; padding: 0 5px; margin-left: 10px;
        line-height: 1; width: auto !important; min-width: auto !important;
      }
      .delete-wallet-btn:hover { opacity: 0.7; }
    `;
    document.head.appendChild(style);
  }

  return li;
}

/**
 * Форматирует timestamp в читаемую строку даты и времени.
 * @param {number} timestamp - Unix timestamp в секундах.
 * @returns {string} - Форматированная дата и время или 'N/A'.
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return 'N/A';
  try {
    const dt = new Date(timestamp * 1000);
    // Используем toLocaleString для учета локали пользователя
    return dt.toLocaleString(undefined, { // undefined использует локаль браузера
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false // 24-часовой формат
    });
  } catch (e) {
    console.error("Error formatting timestamp:", e);
    return 'Invalid Date';
  }
}

/**
 * Проверяет, является ли строка валидным TON адресом (базовая проверка).
 * @param {string} address - Адрес для проверки.
 * @returns {boolean} - true, если адрес похож на валидный.
 */
export function isValidTonAddress(address) {
  if (!address || typeof address !== 'string') return false;
  // Базовая проверка: начинается с UQ или EQ, длина около 48 символов, base64-подобные символы.
  // Это не полная валидация, а быстрая проверка.
  return /^(UQ|EQ)[A-Za-z0-9\-_]{46}$/.test(address);
}

/**
 * Сокращает длинный адрес кошелька.
 * @param {string} address - Полный адрес.
 * @param {number} [startChars=6] - Количество символов в начале.
 * @param {number} [endChars=4] - Количество символов в конце.
 * @returns {string} - Сокращенный адрес.
 */
export function shortenAddress(address, startChars = 6, endChars = 4) {
    if (!address || address.length < startChars + endChars) return address;
    return `${address.substring(0, startChars)}…${address.slice(-endChars)}`;
}

/**
 * Показывает кастомное модальное окно подтверждения.
 * @param {string} title - Заголовок окна.
 * @param {string} message - Сообщение.
 * @param {Function} onConfirm - Callback при подтверждении.
 * @param {Function} [onCancel] - Callback при отмене.
 */
export function showConfirmationModal(title, message, onConfirm, onCancel) {
    const tg = window.Telegram?.WebApp;
    if (tg && tg.showConfirm) {
        tg.showConfirm(message, (confirmed) => {
            if (confirmed) {
                onConfirm();
            } else {
                if (onCancel) onCancel();
            }
        });
    } else {
        // Fallback для браузера (стандартный confirm)
        if (confirm(`${title}\n${message}`)) {
            onConfirm();
        } else {
            if (onCancel) onCancel();
        }
    }
}

/**
 * Показывает уведомление (alert).
 * @param {string} message - Сообщение для показа.
 * @param {'success' | 'error' | 'info'} [type='info'] - Тип уведомления для тактильной обратной связи.
 */
export function showAlert(message, type = 'info') {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.showAlert(message);
        if (type === 'success' && tg.HapticFeedback?.notificationOccurred) {
            tg.HapticFeedback.notificationOccurred('success');
        } else if (type === 'error' && tg.HapticFeedback?.notificationOccurred) {
            tg.HapticFeedback.notificationOccurred('error');
        }
        // Для 'info' можно использовать 'warning' или ничего
    } else {
        alert(message); // Fallback
    }
}
