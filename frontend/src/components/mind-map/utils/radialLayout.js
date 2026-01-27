/**
 * Radial Mind Map Layout Algorithm
 * Positions nodes in concentric circles from center outward
 */

// Ring configuration - distance from center
const RING_RADII = {
  0: 0,      // Center (Opening)
  1: 200,    // Discovery
  2: 380,    // Solution
  3: 560,    // Objections
  4: 740,    // Closing
};

// Node sizes by type
const NODE_SIZES = {
  category: { width: 160, height: 80 },
  content: { width: 220, height: 100 },
  objection: { width: 240, height: 120 },
  story: { width: 220, height: 100 },
};

/**
 * Calculate position for a node in a ring
 * @param {number} index - Index of node in the ring
 * @param {number} total - Total nodes in the ring
 * @param {number} radius - Distance from center
 * @param {number} startAngle - Starting angle offset (in radians)
 * @returns {{ x: number, y: number }}
 */
export const calculateRingPosition = (index, total, radius, startAngle = -Math.PI / 2) => {
  if (total === 0) return { x: 0, y: 0 };
  
  const angleStep = (2 * Math.PI) / total;
  const angle = startAngle + (angleStep * index);
  
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
  };
};

/**
 * Calculate positions for child nodes around a parent
 * @param {number} parentX - Parent node X position
 * @param {number} parentY - Parent node Y position
 * @param {number} childCount - Number of children
 * @param {number} childRadius - Distance from parent
 * @param {number} spreadAngle - Total angle to spread children across (in radians)
 * @returns {Array<{ x: number, y: number }>}
 */
export const calculateChildPositions = (parentX, parentY, childCount, childRadius = 120, spreadAngle = Math.PI) => {
  if (childCount === 0) return [];
  if (childCount === 1) {
    return [{ x: parentX, y: parentY + childRadius }];
  }
  
  const positions = [];
  const startAngle = Math.PI / 2 - spreadAngle / 2; // Center the spread below parent
  const angleStep = spreadAngle / (childCount - 1);
  
  for (let i = 0; i < childCount; i++) {
    const angle = startAngle + (angleStep * i);
    positions.push({
      x: parentX + childRadius * Math.cos(angle),
      y: parentY + childRadius * Math.sin(angle),
    });
  }
  
  return positions;
};

/**
 * Convert mind map data to React Flow nodes and edges
 * @param {Object} data - Mind map data with categories and nodes
 * @param {number} centerX - Center X position
 * @param {number} centerY - Center Y position
 * @returns {{ nodes: Array, edges: Array }}
 */
export const convertMindMapToFlow = (categories, nodes, centerX = 600, centerY = 500) => {
  const flowNodes = [];
  const flowEdges = [];
  
  // Group nodes by category
  const nodesByCategory = {};
  nodes.forEach(node => {
    if (!nodesByCategory[node.category_id]) {
      nodesByCategory[node.category_id] = [];
    }
    nodesByCategory[node.category_id].push(node);
  });
  
  // Process categories by ring level
  const categoriesByRing = {};
  categories.forEach(cat => {
    if (!categoriesByRing[cat.ring_level]) {
      categoriesByRing[cat.ring_level] = [];
    }
    categoriesByRing[cat.ring_level].push(cat);
  });
  
  // Create category nodes
  Object.keys(categoriesByRing).sort((a, b) => a - b).forEach(ringLevel => {
    const ring = parseInt(ringLevel);
    const catsInRing = categoriesByRing[ring];
    const radius = RING_RADII[ring] || ring * 180;
    
    catsInRing.forEach((category, index) => {
      const position = ring === 0
        ? { x: centerX, y: centerY }
        : calculateRingPosition(index, catsInRing.length, radius);
      
      flowNodes.push({
        id: `category-${category.id}`,
        type: 'categoryNode',
        position: {
          x: centerX + position.x - NODE_SIZES.category.width / 2,
          y: centerY + position.y - NODE_SIZES.category.height / 2,
        },
        data: {
          ...category,
          isCenter: ring === 0,
          nodeCount: (nodesByCategory[category.id] || []).length,
        },
      });
      
      // Create edge from center to ring 1, and between consecutive rings
      if (ring > 0) {
        const sourceRing = ring === 1 ? 0 : ring - 1;
        const sourceCats = categoriesByRing[sourceRing] || [];
        
        if (sourceCats.length > 0) {
          // Connect to closest category in previous ring or center
          const sourceId = ring === 1
            ? `category-${sourceCats[0].id}`
            : `category-${sourceCats[Math.min(index, sourceCats.length - 1)].id}`;
          
          flowEdges.push({
            id: `edge-cat-${category.id}`,
            source: sourceId,
            target: `category-${category.id}`,
            type: 'smoothstep',
            animated: false,
            style: {
              stroke: category.color,
              strokeWidth: 2,
              opacity: 0.4,
            },
          });
        }
      }
    });
  });
  
  return { nodes: flowNodes, edges: flowEdges };
};

/**
 * Expand a category to show its child nodes
 * @param {Object} category - The category being expanded
 * @param {Array} childNodes - Child nodes to display
 * @param {Object} categoryPosition - Position of the category node
 * @param {number} centerX - Canvas center X
 * @param {number} centerY - Canvas center Y
 * @returns {{ nodes: Array, edges: Array }}
 */
export const expandCategoryNodes = (category, childNodes, categoryPosition, centerX = 600, centerY = 500) => {
  const flowNodes = [];
  const flowEdges = [];
  
  if (!childNodes || childNodes.length === 0) return { nodes: flowNodes, edges: flowEdges };
  
  // Calculate angle from center to category
  const catCenterX = categoryPosition.x + NODE_SIZES.category.width / 2;
  const catCenterY = categoryPosition.y + NODE_SIZES.category.height / 2;
  const angleFromCenter = Math.atan2(catCenterY - centerY, catCenterX - centerX);
  
  // Position children in an arc extending outward from category
  const childRadius = 150;
  const spreadAngle = Math.min(Math.PI * 0.8, childNodes.length * 0.3); // Adaptive spread
  const startAngle = angleFromCenter - spreadAngle / 2;
  const angleStep = childNodes.length > 1 ? spreadAngle / (childNodes.length - 1) : 0;
  
  childNodes.forEach((node, index) => {
    const angle = childNodes.length === 1 ? angleFromCenter : startAngle + (angleStep * index);
    const x = catCenterX + childRadius * Math.cos(angle);
    const y = catCenterY + childRadius * Math.sin(angle);
    
    // Determine node type for React Flow
    let nodeType = 'contentNode';
    if (node.node_type === 'objection') nodeType = 'objectionNode';
    if (node.node_type === 'story') nodeType = 'storyNode';
    
    const nodeSize = NODE_SIZES[node.node_type] || NODE_SIZES.content;
    
    flowNodes.push({
      id: `node-${node.id}`,
      type: nodeType,
      position: {
        x: x - nodeSize.width / 2,
        y: y - nodeSize.height / 2,
      },
      data: {
        ...node,
        categoryColor: category.color,
      },
    });
    
    // Edge from category to child
    flowEdges.push({
      id: `edge-${category.id}-${node.id}`,
      source: `category-${category.id}`,
      target: `node-${node.id}`,
      type: 'smoothstep',
      animated: false,
      style: {
        stroke: category.color,
        strokeWidth: 1.5,
        opacity: 0.6,
      },
    });
  });
  
  return { nodes: flowNodes, edges: flowEdges };
};

/**
 * Get color for node based on type
 */
export const getNodeColor = (nodeType, category) => {
  const colors = {
    question: '#3b82f6',   // Blue
    script: '#8b5cf6',     // Purple
    story: '#10b981',      // Green
    objection: '#f59e0b',  // Orange
    benefit: '#10b981',    // Green
    tip: '#6366f1',        // Indigo
  };
  
  return colors[nodeType] || category?.color || '#6b7280';
};

/**
 * Filter nodes by product type
 */
export const filterNodesByProduct = (nodes, productType) => {
  if (!productType || productType === 'all') return nodes;
  return nodes.filter(node => !node.product_type || node.product_type === productType);
};

export default {
  calculateRingPosition,
  calculateChildPositions,
  convertMindMapToFlow,
  expandCategoryNodes,
  getNodeColor,
  filterNodesByProduct,
  RING_RADII,
  NODE_SIZES,
};
