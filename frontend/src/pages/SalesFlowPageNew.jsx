import React, { useState, useCallback, useEffect } from 'react';
import {
  GitBranch,
  Plus,
  Sparkles,
  ChevronLeft,
  Settings,
  Trash2,
  Download,
  Share2,
  MoreVertical,
  Loader2,
  TreeDeciduous,
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../lib/config';
import { supabase } from '../lib/supabase';

import ConversationTreeCanvas from '../components/sales-flow/ConversationTreeCanvas';
import { ModeSelector, GenerateTreeModal } from '../components/sales-flow/controls';
import { NodeDetailPanel } from '../components/sales-flow/panels';
import { sampleTreeData } from '../components/sales-flow/utils/sampleData';

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
};

const SalesFlowPage = () => {
  const [trees, setTrees] = useState([]);
  const [selectedTree, setSelectedTree] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [mode, setMode] = useState('explore');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTrees();
  }, []);

  const loadTrees = async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/api/conversation-trees`, { headers });
      setTrees(response.data.trees || []);
      
      if (response.data.trees?.length > 0) {
        loadTree(response.data.trees[0].id);
      } else {
        setSelectedTree({ ...sampleTreeData, id: 'sample', name: 'Sample Flow (Demo)' });
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error loading trees:', err);
      setSelectedTree({ ...sampleTreeData, id: 'sample', name: 'Sample Flow (Demo)' });
      setIsLoading(false);
    }
  };

  const loadTree = async (treeId) => {
    if (treeId === 'sample') {
      setSelectedTree({ ...sampleTreeData, id: 'sample', name: 'Sample Flow (Demo)' });
      return;
    }
    
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/api/conversation-trees/${treeId}`, { headers });
      setSelectedTree(response.data);
    } catch (err) {
      console.error('Error loading tree:', err);
      setError('Failed to load conversation tree');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTree = async (formData) => {
    setIsGenerating(true);
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/api/conversation-trees/generate`,
        formData,
        { headers }
      );
      
      setTrees(prev => [response.data, ...prev]);
      setSelectedTree(response.data);
      setShowGenerateModal(false);
    } catch (err) {
      console.error('Error generating tree:', err);
      setError('Failed to generate conversation tree');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    setSelectedNode(null);
  }, []);

  const handleDeleteTree = async (treeId) => {
    if (!confirm('Are you sure you want to delete this tree?')) return;
    
    try {
      const headers = await getAuthHeaders();
      await axios.delete(`${API_URL}/api/conversation-trees/${treeId}`, { headers });
      setTrees(prev => prev.filter(t => t.id !== treeId));
      
      if (selectedTree?.id === treeId) {
        setSelectedTree(trees.length > 1 ? trees.find(t => t.id !== treeId) : null);
      }
    } catch (err) {
      console.error('Error deleting tree:', err);
      setError('Failed to delete tree');
    }
  };


  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900/80 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <GitBranch className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Conversation Tree</h1>
              <p className="text-xs text-gray-500">
                {selectedTree?.name || 'Select or create a tree'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ModeSelector
            currentMode={mode}
            onModeChange={handleModeChange}
            disabled={!selectedTree}
          />
          
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Generate New</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {showSidebar && (
          <aside className="w-64 bg-gray-900/50 border-r border-gray-800 flex flex-col">
            <div className="p-3 border-b border-gray-800">
              <button
                onClick={() => setShowGenerateModal(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">New Tree</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <button
                onClick={() => setSelectedTree({ ...sampleTreeData, id: 'sample', name: 'Sample Flow (Demo)' })}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                  selectedTree?.id === 'sample'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <TreeDeciduous className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Sample Flow (Demo)</p>
                  <p className="text-xs text-gray-500">Cool Life Paint</p>
                </div>
              </button>

              {trees.map((tree) => (
                <div
                  key={tree.id}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                    selectedTree?.id === tree.id
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <button
                    onClick={() => loadTree(tree.id)}
                    className="flex-1 flex items-center gap-3 text-left min-w-0"
                  >
                    <GitBranch className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tree.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {tree.product_type?.replace('_', ' ')}
                      </p>
                    </div>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTree(tree.id);
                    }}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}

              {trees.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <TreeDeciduous className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No trees yet</p>
                  <p className="text-xs mt-1">Generate your first tree!</p>
                </div>
              )}
            </div>
          </aside>
        )}

        <main className="flex-1 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
                <p className="text-gray-400">Loading conversation tree...</p>
              </div>
            </div>
          ) : selectedTree ? (
            <>
              <ConversationTreeCanvas
                treeData={selectedTree}
                mode={mode}
                onNodeClick={handleNodeClick}
                onModeChange={handleModeChange}
                selectedNodeId={selectedNode?.id}
              />
              
              {selectedNode && (
                <NodeDetailPanel
                  node={selectedNode}
                  onClose={() => setSelectedNode(null)}
                  treeInfo={selectedTree}
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
              <div className="text-center max-w-md">
                <div className="p-4 bg-purple-500/10 rounded-2xl inline-block mb-4">
                  <GitBranch className="w-12 h-12 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  No Conversation Tree Selected
                </h2>
                <p className="text-gray-400 mb-6">
                  Generate a new interactive conversation tree or select an existing one from the sidebar.
                </p>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="font-medium">Generate Your First Tree</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <GenerateTreeModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerateTree}
        isGenerating={isGenerating}
      />

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:bg-red-600 p-1 rounded">
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default SalesFlowPage;
