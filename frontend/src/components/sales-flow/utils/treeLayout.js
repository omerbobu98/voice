const NODE_WIDTH = 240;
const NODE_HEIGHT = 120;
const HORIZONTAL_SPACING = 60;
const VERTICAL_SPACING = 100;

export function layoutTree(nodes, edges) {
  if (!nodes.length) return { nodes: [], edges };

  const nodeMap = new Map();
  nodes.forEach(node => nodeMap.set(node.id, { ...node }));

  const childrenMap = new Map();
  edges.forEach(edge => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source).push(edge.target);
  });

  const parentMap = new Map();
  edges.forEach(edge => {
    parentMap.set(edge.target, edge.source);
  });

  const rootNodes = nodes.filter(node => !parentMap.has(node.id));
  
  const levels = new Map();
  const visited = new Set();

  function assignLevels(nodeId, level) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    if (!levels.has(level)) {
      levels.set(level, []);
    }
    levels.get(level).push(nodeId);
    
    const children = childrenMap.get(nodeId) || [];
    children.forEach(childId => assignLevels(childId, level + 1));
  }

  rootNodes.forEach(node => assignLevels(node.id, 0));

  const subtreeWidths = new Map();

  function calculateSubtreeWidth(nodeId) {
    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) {
      subtreeWidths.set(nodeId, NODE_WIDTH);
      return NODE_WIDTH;
    }
    
    let totalWidth = 0;
    children.forEach((childId, index) => {
      if (index > 0) totalWidth += HORIZONTAL_SPACING;
      totalWidth += calculateSubtreeWidth(childId);
    });
    
    subtreeWidths.set(nodeId, Math.max(NODE_WIDTH, totalWidth));
    return subtreeWidths.get(nodeId);
  }

  rootNodes.forEach(node => calculateSubtreeWidth(node.id));

  function positionNodes(nodeId, startX, level) {
    const node = nodeMap.get(nodeId);
    if (!node) return;
    
    const subtreeWidth = subtreeWidths.get(nodeId) || NODE_WIDTH;
    const nodeX = startX + subtreeWidth / 2 - NODE_WIDTH / 2;
    const nodeY = level * (NODE_HEIGHT + VERTICAL_SPACING);
    
    node.position = { x: nodeX, y: nodeY };
    
    const children = childrenMap.get(nodeId) || [];
    let currentX = startX;
    
    children.forEach(childId => {
      const childWidth = subtreeWidths.get(childId) || NODE_WIDTH;
      positionNodes(childId, currentX, level + 1);
      currentX += childWidth + HORIZONTAL_SPACING;
    });
  }

  let startX = 0;
  rootNodes.forEach(node => {
    positionNodes(node.id, startX, 0);
    startX += (subtreeWidths.get(node.id) || NODE_WIDTH) + HORIZONTAL_SPACING * 2;
  });

  const layoutedNodes = nodes.map(node => ({
    ...node,
    position: nodeMap.get(node.id)?.position || { x: 0, y: 0 },
  }));

  return { nodes: layoutedNodes, edges };
}

export function convertTreeDataToFlow(treeData) {
  const nodes = [];
  const edges = [];
  
  function processNode(nodeData, parentId = null) {
    const node = {
      id: nodeData.id,
      type: getNodeType(nodeData),
      data: {
        title: nodeData.title,
        shortContent: nodeData.short_content || nodeData.shortContent,
        content: nodeData.content,
        stage: nodeData.stage,
        speaker: nodeData.speaker,
        branchLabel: nodeData.branch_label || nodeData.branchLabel,
        branchCondition: nodeData.branch_condition || nodeData.branchCondition,
        successProbability: nodeData.success_probability || nodeData.successProbability,
        coachingTips: nodeData.coaching_tips || nodeData.coachingTips,
        outcomeType: nodeData.outcome_type || nodeData.outcomeType,
      },
      position: { x: 0, y: 0 },
    };
    
    nodes.push(node);
    
    if (parentId) {
      edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        type: 'custom',
        data: {
          label: nodeData.branch_label || nodeData.branchLabel,
          edgeType: getEdgeType(nodeData),
        },
      });
    }
    
    const children = nodeData.children || [];
    children.forEach(child => processNode(child, node.id));
  }

  if (treeData.nodes) {
    treeData.nodes.forEach(node => processNode(node));
  } else if (treeData.id) {
    processNode(treeData);
  }
  
  return layoutTree(nodes, edges);
}

function getNodeType(nodeData) {
  if (nodeData.node_type === 'root' || nodeData.nodeType === 'root') {
    return 'root';
  }
  if (nodeData.node_type === 'outcome' || nodeData.nodeType === 'outcome') {
    return 'outcome';
  }
  if (nodeData.node_type === 'decision' || nodeData.nodeType === 'decision') {
    return 'decision';
  }
  if (nodeData.speaker === 'seller') {
    return 'sellerAction';
  }
  if (nodeData.speaker === 'customer') {
    return 'customerResponse';
  }
  return 'sellerAction';
}

function getEdgeType(nodeData) {
  const probability = nodeData.success_probability || nodeData.successProbability || 0.5;
  if (probability >= 0.6) return 'success';
  if (probability < 0.35) return 'objection';
  return 'default';
}

export { NODE_WIDTH, NODE_HEIGHT, HORIZONTAL_SPACING, VERTICAL_SPACING };
