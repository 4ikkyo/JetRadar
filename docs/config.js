// config.js
// Используйте export const API_BASE_URL = 'https://your-production-api.com'; для продакшена
export const API_BASE_URL = 'http://127.0.0.1:8000'; // Для локальной разработки

// Другие конфигурационные параметры, если нужны
export const TRANSACTION_HISTORY_LIMIT = 10;
export const GRAPH_DEFAULT_DEPTH = 1;

// Настройки для vis.js графа, если нужно вынести
export const DEFAULT_VIS_OPTIONS = {
  layout: {
    hierarchical: false,
    improvedLayout: true, // может быть ресурсоемким для больших графов
  },
  edges: {
    smooth: { type: 'continuous', roundness: 0.2 },
    width: 1.5, // немного толще
    font: {
      size: 10,
      align: 'middle',
      strokeWidth: 3, // для лучшей читаемости текста на ребре
      strokeColor: '#ffffff', // цвет обводки текста
      color: '#333333', // цвет самого текста
    },
    color: {
      inherit: 'from', // или 'to', или конкретный цвет '#848484'
      highlight: '#007AFF', // цвет при наведении/выделении
      hover: '#FF9500',
    },
    arrows: {
      to: { enabled: true, scaleFactor: 0.7, type: 'arrow' }
    }
  },
  nodes: {
    borderWidth: 1.5,
    font: { size: 12, face: 'Manrope, Arial, sans-serif', color: '#333333' },
    shadow: {
        enabled: true,
        color: 'rgba(0,0,0,0.2)',
        size: 5,
        x: 2,
        y: 2
    },
    color: {
        border: '#E0E0E0',
        background: '#FFFFFF',
        highlight: {
            border: '#007AFF',
            background: '#D1E7FF'
        },
        hover: {
            border: '#FF9500',
            background: '#FFEBCF'
        }
    },
    shape: 'dot', // 'ellipse', 'circle', 'database', 'box', 'text'
    size: 15, // базовый размер узла
  },
  physics: {
    enabled: true,
    solver: 'forceAtlas2Based', // хороший компромисс между качеством и скоростью
    forceAtlas2Based: {
      gravitationalConstant: -35,
      centralGravity: 0.008,
      springLength: 120,
      springConstant: 0.06,
      damping: 0.7,
      avoidOverlap: 0.3 // Помогает избежать наложения узлов
    },
    stabilization: {
      enabled: true,
      iterations: 200, // Увеличить для лучшей стабилизации на старте
      fit: true
    }
  },
  interaction: {
    hover: true,
    tooltipDelay: 200,
    navigationButtons: true, // кнопки зума и центрирования
    keyboard: true,
    dragNodes: true,
    dragView: true,
    zoomView: true,
    multiselect: true, // позволяет выбирать несколько узлов (Ctrl+Click)
    selectable: true,
  },
  groups: { // Можно определить группы узлов с разными стилями
    targetWallet: {
      color: { background: '#FFD700', border: '#FFA500' }, // Золотой для целевого кошелька
      shape: 'star',
      size: 25,
    },
    scamWallet: {
      color: { background: '#FF4136', border: '#D63027' }, // Красный для скам-кошельков
      shape: 'dot',
      icon: {
        face: "'Font Awesome 5 Free'", // Убедитесь, что шрифт загружен
        weight: "900", // Solid
        code: "\uf071", // fa-exclamation-triangle
        size: 20,
        color: '#FFFFFF'
      }
    }
    // ... другие группы
  }
};
