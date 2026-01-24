import React, { useState, useCallback, useEffect } from 'react';
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
import { edgeTypes } from './edges';
import { layoutTree, convertTreeDataToFlow } from './utils/treeLayout';

const minimapStyle = {
  height: 120,
  backgroundColor: '#1f2937',
};

const minimapNodeColor = (node) => {
  switch (node.type) {
    case 'root':
      return '#6366f1';
    case 'sellerAction':
      return '#8b5cf6';
    case 'customerResponse':
      return node.data?.successProbability >= 0.5 ? '#10b981' : '#f59e0b';
    case 'decision':
      return '#3b82f6';
    case 'outcome':
      return '#eab308';
    default:
      return '#6b7280';
  }
};

const ConversationTreeCanvas = ({
  treeData,
  mode = 'explore',
  onNodeClick,
  onModeChange,
  selectedNodeId,
  highlightedPath = [],
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (treeData) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = convertTreeDataToFlow(treeData);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [treeData, setNodes, setEdges]);

  useEffect(() => {
    if (highlightedPath.length > 0) {
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          animated: highlightedPath.includes(edge.source) && highlightedPath.includes(edge.target),
          style: {
            ...edge.style,
            strokeWidth: highlightedPath.includes(edge.source) && highlightedPath.includes(edge.target) ? 3 : 2,
            opacity: highlightedPath.includes(edge.source) && highlightedPath.includes(edge.target) ? 1 : 0.5,
          },
        }))
      );
    }
  }, [highlightedPath, setEdges]);

  useEffect(() => {
    if (selectedNodeId) {
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          selected: node.id === selectedNodeId,
        }))
      );
    }
  }, [selectedNodeId, setNodes]);

  const handleNodeClick = useCallback(
    (event, node) => {
      setSelectedNode(node);
      if (onNodeClick) {
        onNodeClick(node);
      }
    },
    [onNodeClick]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
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
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: 'custom',
          animated: false,
        }}
        fitView
        fitViewOptions={{
          padding: 0.2,
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
          gap={20}
          size={1}
          color="#374151"
        />

        <Panel position="top-left" className="flex items-center gap-2">
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-xs text-gray-300">Seller</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-gray-300">Customer (+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-xs text-gray-300">Objection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-xs text-gray-300">Outcome</span>
              </div>
            </div>
          </div>
        </Panel>

        {mode !== 'explore' && (
          <Panel position="top-right" className="mr-2 mt-2">
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-700">
              <span className="text-xs text-gray-400">Mode: </span>
              <span className="text-xs font-semibold text-white capitalize">{mode}</span>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

export default ConversationTreeCanvas;
