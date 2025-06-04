// js/main.js
import { initApp } from "./events.js";

// В Telegram WebApp объект доступен как window.Telegram.WebApp
document.addEventListener("DOMContentLoaded", () => {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    initApp(tg);
  } else {
    // Если не WebApp (например, прямое открытие в браузере)
    // Можно всё равно запустить, передав фиктивный объект tg
    const tg = {
      ready: () => {},
      expand: () => {},
      initDataUnsafe: null,
      showAlert: (msg) => alert(msg),
      HapticFeedback: { notificationOccurred: () => {} },
      BackButton: { show: () => {}, hide: () => {}, onClick: () => {} },
    };
    initApp(tg);
  }
});
