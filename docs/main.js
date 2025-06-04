// main.js
import { initApp } from "./events.js";
import { applyTelegramTheme, applyTranslations, initLanguageSwitcher } from './lang.js';
import { initializeUI } from './uiElements.js'; // --- добавлено ---

document.addEventListener("DOMContentLoaded", () => {
  // Сначала инициализируем все ui-элементы:
  initializeUI(); // --- добавлено ---

  // Затем применяем тему и язык, чтобы избежать "мелькания" стандартных стилей/текстов
  applyTelegramTheme();
  initLanguageSwitcher();
  applyTranslations();

  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    try {
      initApp(tg);
    } catch (e) {
      console.error("Error initializing JetRadar App:", e);
      document.body.innerHTML = `<div style="padding: 20px; text-align: center; color: red;">
        Failed to initialize the application. Please try again later. Details: ${e.message}
      </div>`;
    }
  } else {
    // Режим standalone
    const tgMock = {
      ready: () => console.log("tgMock.ready() called"),
      expand: () => console.log("tgMock.expand() called"),
      initDataUnsafe: {
        user: { id: "007", first_name: "Browser", last_name: "User", username: "browser_user" },
      },
      themeParams: {
        bg_color: "#ffffff",
        text_color: "#000000",
        hint_color: "#8A8A8E",
        link_color: "#007AFF",
        button_color: "#007AFF",
        button_text_color: "#FFFFFF",
        secondary_bg_color: "#F9F9F9",
      },
      colorScheme: 'light',
      BackButton: {
        isVisible: false,
        show: function() { this.isVisible = true; console.log("tgMock.BackButton.show()"); },
        hide: function() { this.isVisible = false; console.log("tgMock.BackButton.hide()"); },
        onClick: function(callback) { console.log("tgMock.BackButton.onClick registered"); this._callback = callback; },
        triggerClick: function() { if(this._callback) this._callback(); }
      },
      HapticFeedback: {
        notificationOccurred: (type) => console.log(`tgMock.HapticFeedback.notificationOccurred(${type})`),
        impactOccurred: (style) => console.log(`tgMock.HapticFeedback.impactOccurred(${style})`),
      },
      showAlert: (message) => alert(`TG Alert: ${message}`),
      showConfirm: (message, callback) => {
        const result = confirm(`TG Confirm: ${message}`);
        if (callback) callback(result);
      },
      close: () => console.log("tgMock.close() called. App would close here."),
    };
    try {
      initApp(tgMock);
    } catch (e) {
      console.error("Error initializing JetRadar App with mock:", e);
      document.body.innerHTML = `<div style="padding: 20px; text-align: center; color: red;">
        Failed to initialize the application (mock). Details: ${e.message}
      </div>`;
    }
  }
});
