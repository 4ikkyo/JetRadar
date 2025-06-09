// graph.js
import { ui } from './uiElements.js';
import { t } from './lang.js';
import { DEFAULT_VIS_OPTIONS } from './config.js'; // Импортируем дефолтные опции
import { shortenAddress } from './utils.js';


let network = null; // Храним экземпляр сети для взаимодействия

/**
 * Рендерит граф на основе данных из API.
 * @param {object} graphData - Данные графа (nodes, edges) от бэкенда.
 * @param {string} targetAddress - Адрес основного кошелька для выделения.
 */
export function generateAndDisplayVisGraph(graphData, targetAddress) {
  if (!ui.visGraphContainer) {
    console.error('visGraphContainer not found in DOM.');
    return;
  }
  if (!window.vis) {
    ui.visGraphContainer.innerHTML = `<p>Graph library (vis.js) not loaded.</p>`;
    console.error('vis.js library not loaded.');
    return;
  }
  ui.visGraphContainer.innerHTML = ''; // Очищаем предыдущий граф или сообщение

  if (!graphData || !Array.isArray(graphData.nodes) || !Array.isArray(graphData.edges) || graphData.nodes.length === 0) {
    ui.visGraphContainer.innerHTML = `<p>${t('no_graph_data')}${graphData?.message ? ` (${graphData.message})` : ''}</p>`;
    return;
  }

  // Уничтожаем предыдущий экземпляр сети, если он есть
  if (network) {
    network.destroy();
    network = null;
  }

  const nodes = new vis.DataSet(
    graphData.nodes.map(n => {
      const isTarget = n.id === targetAddress;
      const label = n.meta?.user_label || shortenAddress(n.id);
      let tooltip = `<strong>${t('graph_node_tooltip_title', { address: n.id })}</strong>`;
      if (n.meta?.user_label) {
        tooltip += `<br>${t('graph_node_tooltip_alias', { alias: n.meta.user_label })}`;
      }
      if (n.meta?.in_tx_count !== undefined) {
        tooltip += `<br>${t('graph_node_tooltip_in_tx', { count: n.meta.in_tx_count, volume: (n.meta.total_ton_in || 0).toFixed(2) })}`;
      }
      if (n.meta?.out_tx_count !== undefined) {
        tooltip += `<br>${t('graph_node_tooltip_out_tx', { count: n.meta.out_tx_count, volume: (n.meta.total_ton_out || 0).toFixed(2) })}`;
      }
      if (n.meta?.is_scam) {
        tooltip += `<br><strong style="color:var(--tg-theme-destructive-text-color);">${t('is_scam')}</strong>`;
      }

      return {
        id: n.id,
        label: label,
        title: tooltip, // HTML в title поддерживается vis.js
        color: n.color, // Бэкенд может присылать цвет
        shape: n.shape || (isTarget ? 'star' : 'dot'), // Пример: звезда для целевого
        value: n.value, // Для размера узла, если бэкенд рассчитывает
        group: isTarget ? 'targetWallet' : (n.meta?.is_scam ? 'scamWallet' : undefined), // Группировка для стилей
        font: {
            color: n.meta?.is_scam ? '#FFFFFF' : (isTarget ? '#000000' : undefined) // Цвет текста для скам/целевых узлов
        }
      };
    })
  );

  const edges = new vis.DataSet(
    graphData.edges.map(e => {
      let edgeTitle = '';
      if (e.total_value_ton !== undefined) {
        edgeTitle += `${t('graph_edge_tooltip_volume', { volume: `${parseFloat(e.total_value_ton).toFixed(2)} TON` })}`;
      }
      if (e.transaction_count !== undefined) {
        edgeTitle += `${edgeTitle ? '<br>' : ''}${t('graph_edge_tooltip_count', { count: e.transaction_count })}`;
      }
      if (e.jetton_transfers && e.jetton_transfers.length > 0) {
          e.jetton_transfers.forEach(jt => {
              edgeTitle += `<br>${parseFloat(jt.amount).toFixed(2)} ${jt.symbol}`;
          });
      }


      return {
        from: e.from_node,
        to: e.to_node,
        label: e.label || (e.total_value_ton ? `${parseFloat(e.total_value_ton).toFixed(1)} TON` : undefined), // Краткая метка на ребре
        title: edgeTitle || e.title, // Подробная подсказка
        arrows: e.arrows || { to: { enabled: true, scaleFactor: 0.7 } },
        value: e.value, // Для толщины ребра
        color: e.color, // Цвет ребра от бэкенда
        dashes: e.is_indirect || false, // Пунктир для непрямых связей
      };
    })
  );

  const options = { ...DEFAULT_VIS_OPTIONS }; // Копируем дефолтные опции
  // Можно переопределить опции здесь, если нужно, например, на основе данных

  network = new vis.Network(ui.visGraphContainer, { nodes, edges }, options);

  // Обработчики событий графа
  network.on("selectNode", function (params) {
    if (params.nodes.length === 1) {
      const selectedNodeId = params.nodes[0];
      // Можно реализовать переход к деталям выбранного узла, если это не текущий
      // console.log("Selected node: " + selectedNodeId);
      // if (selectedNodeId !== targetAddress) {
      //   Показать опцию "перейти к этому кошельку" или загрузить его детали
      // }
    }
  });

  network.on("hoverNode", function (params) {
    // console.log('hoverNode:', params.node);
    // Можно добавить кастомное поведение при наведении, если title недостаточно
  });

  network.on("stabilizationIterationsDone", function () {
    // Граф стабилизировался, можно сфокусироваться на целевом узле
    if (targetAddress && nodes.get(targetAddress)) {
        network.focus(targetAddress, {
            scale: 1.2, // Немного приблизить
            animation: {
                duration: 1000,
                easingFunction: "easeInOutQuad",
            },
        });
    }
  });
}

/**
 * Центрирует граф на указанном узле.
 * @param {string} nodeId - ID узла для центрирования.
 */
export function focusOnNodeInGraph(nodeId) {
  if (network && nodeId) {
    try {
        network.focus(nodeId, {
            scale: 1.5, // Можно настроить масштаб
            animation: true
        });
    } catch (e) {
        console.warn(`Node ${nodeId} not found in graph for focusing.`, e);
    }
  }
}

/**
 * Пример функции для выделения группы адресов (требует доработки).
 * @param {string[]} nodeIdsToHighlight - Массив ID узлов для выделения.
 */
export function highlightNodeGroup(nodeIdsToHighlight) {
  if (network && nodeIdsToHighlight && nodeIdsToHighlight.length > 0) {
    const allNodes = network.body.data.nodes.get({ returnType: "Array" });
    const updateArray = allNodes.map(node => {
      if (nodeIdsToHighlight.includes(node.id)) {
        return { ...node, color: { border: '#FF9500', background: '#FFEBCF' }, borderWidth: 3 }; // Пример стиля выделения
      } else {
        // Сброс стиля для остальных (или установка стиля "неактивных")
        return { ...node, color: DEFAULT_VIS_OPTIONS.nodes.color, borderWidth: DEFAULT_VIS_OPTIONS.nodes.borderWidth };
      }
    });
    network.body.data.nodes.update(updateArray);
  }
}
