import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './nodes';
import { convertMindMapToFlow, expandCategoryNodes, filterNodesByProduct } from './utils/radialLayout';

const minimapStyle = {
  height: 120,
  backgroundColor: '#1f2937',
};

const minimapNodeColor = (node) => {
  if (node.data?.color) return node.data.color;
  switch (node.type) {
    case 'categoryNode':
      return node.data?.isCenter ? '#8b5cf6' : '#6b7280';
    case 'contentNode':
      return '#3b82f6';
    case 'objectionNode':
      return '#f59e0b';
    case 'storyNode':
      return '#10b981';
    default:
      return '#6b7280';
  }
};

const MindMapCanvas = ({
  categories = [],
  nodes: allNodes = [],
  onNodeClick,
  onCategoryClick,
  selectedNodeId,
  productFilter = 'all',
  language = 'en',
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [canvasCenter, setCanvasCenter] = useState({ x: 600, y: 500 });

  // Filter nodes by product
  const filteredNodes = useMemo(() => {
    return filterNodesByProduct(allNodes, productFilter);
  }, [allNodes, productFilter]);

  // Build initial layout with categories
  useEffect(() => {
    if (categories.length > 0) {
      const { nodes: categoryNodes, edges: categoryEdges } = convertMindMapToFlow(
        categories,
        filteredNodes,
        canvasCenter.x,
        canvasCenter.y
      );
      
      // Add expanded category children
      let allFlowNodes = [...categoryNodes];
      let allFlowEdges = [...categoryEdges];
      
      expandedCategories.forEach(categoryId => {
        const category = categories.find(c => c.id === categoryId);
        const categoryNode = categoryNodes.find(n => n.id === `category-${categoryId}`);
        
        if (category && categoryNode) {
          const childNodes = filteredNodes.filter(n => n.category_id === categoryId);
          const { nodes: childFlowNodes, edges: childFlowEdges } = expandCategoryNodes(
            category,
            childNodes,
            categoryNode.position,
            canvasCenter.x,
            canvasCenter.y
          );
          
          allFlowNodes = [...allFlowNodes, ...childFlowNodes];
          allFlowEdges = [...allFlowEdges, ...childFlowEdges];
        }
      });
      
      setNodes(allFlowNodes);
      setEdges(allFlowEdges);
    }
  }, [categories, filteredNodes, expandedCategories, canvasCenter, setNodes, setEdges]);

  // Handle category click to expand/collapse
  const handleNodeClick = useCallback(
    (event, node) => {
      if (node.type === 'categoryNode') {
        const categoryId = node.id.replace('category-', '');
        
        setExpandedCategories(prev => {
          const newSet = new Set(prev);
          if (newSet.has(categoryId)) {
            newSet.delete(categoryId);
          } else {
            newSet.add(categoryId);
          }
          return newSet;
        });
        
        if (onCategoryClick) {
          onCategoryClick(node.data);
        }
      } else {
        // Content node clicked
        if (onNodeClick) {
          onNodeClick(node.data);
        }
      }
    },
    [onNodeClick, onCategoryClick]
  );

  const handlePaneClick = useCallback(() => {
    if (onNodeClick) {
      onNodeClick(null);
    }
  }, [onNodeClick]);

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
        fitView
        fitViewOptions={{
          padding: 0.3,
          minZoom: 0.3,
          maxZoom: 1.5,
        }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-gray-900"
      >
        <Controls
          className="!bg-gray-800 !border-gray-700 !rounded-lg !shadow-xl"
          showInteractive={false}
        />
        
        <MiniMap
          style={minimapStyle}
          nodeColor={minimapNodeColor}
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-gray-800 !border-gray-700 !rounded-lg"
        />
        
        <Background
          variant="dots"
          gap={30}
          size={1}
          color="#374151"
        />

        {/* Legend Panel */}
        <Panel position="top-left" className="flex items-center gap-2">
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700 shadow-xl">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-xs text-gray-300">
                  {language === 'he' ? 'פתיחה' : 'Opening'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-300">
                  {language === 'he' ? 'גילוי' : 'Discovery'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-gray-300">
                  {language === 'he' ? 'פתרון' : 'Solution'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-xs text-gray-300">
                  {language === 'he' ? 'התנגדויות' : 'Objections'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-xs text-gray-300">
                  {language === 'he' ? 'סגירה' : 'Closing'}
                </span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Instructions Panel */}
        <Panel position="bottom-center" className="mb-4">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700">
            <p className="text-xs text-gray-400 text-center">
              {language === 'he' 
                ? 'לחץ על קטגוריה כדי להרחיב • לחץ על פריט לפרטים נוספים'
                : 'Click a category to expand • Click an item for details'}
            </p>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default MindMapCanvas;
