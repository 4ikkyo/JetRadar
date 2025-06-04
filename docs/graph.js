// graph.js
import { ui } from './uiElements.js';

const DEFAULT_VIS_OPTIONS = {
  layout: {
    hierarchical: false,
    improvedLayout: true
  },
  edges: {
    smooth: { type: 'continuous', roundness: 0.2 },
    width: 1,
    font: { size: 10, align: 'middle', strokeWidth: 2, strokeColor: '#ffffff' },
    color: { inherit: 'from' }
  },
  nodes: {
    borderWidth: 1,
    font: { size: 12, face: 'Arial' },
    shadow: true
  },
  physics: {
    enabled: true,
    solver: 'forceAtlas2Based',
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

/**
 * Рендерит граф на основе данных из API: graphData.nodes и graphData.edges.
 */
export function generateAndDisplayVisGraph(graphData) {
  if (!ui.visGraphContainer || !window.vis) {
    ui.visGraphContainer.innerHTML =
      '<p>Graph library not loaded or контейнер отсутствует.</p>';
    return;
  }
  ui.visGraphContainer.innerHTML = '';

  if (
    !graphData ||
    !Array.isArray(graphData.nodes) ||
    !Array.isArray(graphData.edges) ||
    graphData.nodes.length === 0
  ) {
    ui.visGraphContainer.innerHTML = `<p>No data to build graph. ${
      graphData?.message || ''
    }</p>`;
    return;
  }

  const nodes = new vis.DataSet(
    graphData.nodes.map(n => ({
      id: n.id,
      label: n.label,
      title: n.meta
        ? `Label: ${n.meta.user_label || '-'}\nIn: ${
            n.meta.in_tx_count
          } tx (${n.meta.total_ton_in.toFixed(2)} TON)\nOut: ${
            n.meta.out_tx_count
          } tx (${n.meta.total_ton_out.toFixed(2)} TON)`
        : n.label,
      color: n.color,
      shape: n.shape,
      value: n.value
    }))
  );

  const edges = new vis.DataSet(
    graphData.edges.map(e => ({
      from: e.from_node,
      to: e.to_node,
      label: e.label,
      title: e.title,
      arrows: e.arrows || 'to',
      value: e.value
    }))
  );

  new vis.Network(ui.visGraphContainer, { nodes, edges }, DEFAULT_VIS_OPTIONS);
}

/**
 * Построение упрощённого графа на основе локальной истории транзакций.
 */
export function generateAndDisplayGraph(walletAddress, historyEvents) {
  if (!ui.visGraphContainer || !window.vis) {
    ui.visGraphContainer.innerHTML =
      '<p>Graph library not loaded or контейнер отсутствует.</p>';
    return;
  }
  ui.visGraphContainer.innerHTML = '';

  if (!historyEvents || historyEvents.length === 0) {
    ui.visGraphContainer.innerHTML = '<p>No data to build graph.</p>';
    return;
  }

  const nodes = new vis.DataSet();
  const edges = new vis.DataSet();
  const addedNodes = new Set();

  // Центральный узел (мониторимый кошелек)
  nodes.add({
    id: walletAddress,
    label: `${walletAddress.substring(0, 6)}…`,
    color: '#FFD700',
    shape: 'box'
  });
  addedNodes.add(walletAddress);

  for (const event of historyEvents) {
    for (const action of event.actions || []) {
      let fromNode = null;
      let toNode = null;
      let value = 0;
      if (
        action.type === 'TON Transfer' ||
        action.type === 'Jetton Transfer' ||
        action.type === 'NFT Transfer'
      ) {
        fromNode = action.sender;
        toNode = action.recipient;
        if (action.amount_ton) {
          value = action.amount_ton;
        } else if (action.amount) {
          value = action.amount;
        }
      } else {
        continue; // пропускаем другие типы действий
      }

      if (fromNode && toNode) {
        if (!addedNodes.has(fromNode)) {
          nodes.add({
            id: fromNode,
            label: `${fromNode.substring(0, 6)}…`,
            shape: 'ellipse'
          });
          addedNodes.add(fromNode);
        }
        if (!addedNodes.has(toNode)) {
          nodes.add({
            id: toNode,
            label: `${toNode.substring(0, 6)}…`,
            shape: 'ellipse'
          });
          addedNodes.add(toNode);
        }

        const label = action.type;
        edges.add({
          from: fromNode,
          to: toNode,
          arrows: 'to',
          label,
          title: label,
          value: Math.max(1, Math.log10(value + 1))
        });
      }
    }
  }

  if (nodes.length <= 1) {
    ui.visGraphContainer.innerHTML =
      '<p>Not enough data for graph (only the source wallet).</p>';
    return;
  }

  new vis.Network(ui.visGraphContainer, { nodes, edges }, DEFAULT_VIS_OPTIONS);
}
