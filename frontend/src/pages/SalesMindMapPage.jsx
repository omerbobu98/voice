import React, { useState, useCallback, useEffect } from 'react';
import {
  Brain,
  Plus,
  Filter,
  Globe,
  Save,
  Loader2,
  FolderOpen,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../lib/config';
import { supabase } from '../lib/supabase';

import MindMapCanvas from '../components/mind-map/MindMapCanvas';
import { NodeDetailPanel } from '../components/mind-map/panels';

const PRODUCT_OPTIONS = [
  { value: 'all', labelEn: 'All Products', labelHe: 'כל המוצרים' },
  { value: 'cool_life', labelEn: 'Cool Life Paint', labelHe: 'קול לייף' },
  { value: 'turf', labelEn: 'Synthetic Turf', labelHe: 'דשא סינטטי' },
  { value: 'pavers', labelEn: 'Pavers', labelHe: 'מרצפות' },
  { value: 'concrete', labelEn: 'Concrete', labelHe: 'בטון' },
  { value: 'fence', labelEn: 'Fencing', labelHe: 'גדרות' },
];

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
};

const SalesMindMapPage = () => {
  const [categories, setCategories] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [productFilter, setProductFilter] = useState('all');
  const [language, setLanguage] = useState('en');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  // My Scripts
  const [userScripts, setUserScripts] = useState([]);
  const [showMyScripts, setShowMyScripts] = useState(false);

  useEffect(() => {
    loadMindMapData();
  }, []);

  const loadMindMapData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/api/mind-map`, { headers });
      
      setCategories(response.data.categories || []);
      setNodes(response.data.nodes || []);
    } catch (err) {
      console.error('Error loading mind map:', err);
      setError('Failed to load mind map data');
      
      // Load default data if API fails
      loadDefaultData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadDefaultData = () => {
    // Default categories matching the design
    setCategories([
      { id: 'opening', name: 'Opening', name_he: 'פתיחה', ring_level: 0, color: '#8b5cf6', icon: 'HandWaving', description: 'Ice breaking and setting expectations' },
      { id: 'discovery', name: 'Discovery', name_he: 'גילוי צרכים', ring_level: 1, color: '#3b82f6', icon: 'Search', description: 'Uncover needs and pains' },
      { id: 'solution', name: 'Solution', name_he: 'פתרון/ערך', ring_level: 2, color: '#10b981', icon: 'Sparkles', description: 'Present value and stories' },
      { id: 'objections', name: 'Objections', name_he: 'התנגדויות', ring_level: 3, color: '#f59e0b', icon: 'AlertTriangle', description: 'Handle objections' },
      { id: 'closing', name: 'Closing', name_he: 'סגירה', ring_level: 4, color: '#eab308', icon: 'Trophy', description: 'Close the deal' },
    ]);
    
    // Default nodes (sample content)
    setNodes([
      // Opening
      { id: 'open-1', category_id: 'opening', node_type: 'script', title: 'Opening Introduction', title_he: 'פתיחה והצגה', content: 'Hi! Thanks for taking the time to meet with me today...', short_content: 'Build rapport and discover initial interest', coaching_tips: ['Smile and maintain eye contact', 'Use their name within first 30 seconds'] },
      { id: 'open-2', category_id: 'opening', node_type: 'question', title: 'Decision Maker Pre-frame', title_he: 'מיפוי מקבלי החלטות', content: 'Besides yourself, who else will be involved in making this decision?', short_content: 'Ask about decision makers early' },
      
      // Discovery
      { id: 'disc-1', category_id: 'discovery', node_type: 'question', title: 'Problem Discovery', title_he: 'גילוי בעיה', content: 'What challenges are you currently facing with your situation?', short_content: 'Uncover the main pain point' },
      { id: 'disc-2', category_id: 'discovery', node_type: 'question', title: 'Pain Amplification', title_he: 'הגברת הכאב', content: 'How does that affect your daily life? What happens if this continues?', short_content: 'Make the pain tangible' },
      { id: 'disc-3', category_id: 'discovery', node_type: 'question', title: 'Energy Bill Discovery', title_he: 'גילוי חשבון חשמל', content: 'How much are you spending during peak summer months?', short_content: 'Get specific numbers for ROI', product_type: 'cool_life' },
      
      // Solution
      { id: 'sol-1', category_id: 'solution', node_type: 'benefit', title: 'Heat Reflection', title_he: 'החזרת חום', content: 'Cool Life Paint reflects up to 85% of solar heat...', short_content: 'Heat reflection = energy savings', product_type: 'cool_life' },
      { id: 'sol-2', category_id: 'solution', node_type: 'story', title: "David's 3-Month Wait", title_he: 'סיפור ההמתנה של דויד', content: 'Let me tell you about David. He said exactly what you just said...', short_content: 'Prevention story for "need to think"', story_type: 'prevention', story_for_objection: 'need_to_think', categoryColor: '#10b981' },
      { id: 'sol-3', category_id: 'solution', node_type: 'story', title: 'Military Tank Story', title_he: 'סיפור טנק הצבא', content: 'You know where this technology came from? The military...', short_content: 'Military-grade technology proof', story_type: 'customer_success', product_type: 'cool_life', categoryColor: '#10b981' },
      
      // Objections
      { id: 'obj-1', category_id: 'objections', node_type: 'objection', title: 'Need to Think', title_he: 'צריך לחשוב', content: 'I need to think about it', objection_type: 'need_to_think', handle_script: 'I totally understand. When you say you need to think about it, what specifically would you be weighing?', prevent_script: 'At the end of our meeting today, you\'ll know clearly whether this is the right solution for you.', technique: 'isolate', categoryColor: '#f59e0b' },
      { id: 'obj-2', category_id: 'objections', node_type: 'objection', title: 'Too Expensive', title_he: 'יקר מדי', content: 'That\'s too expensive', objection_type: 'too_expensive', handle_script: 'I hear you. When you say it\'s expensive, help me understand - is it the total investment or the monthly cash flow?', prevent_script: 'Before we talk about price, let me make sure this is even the right solution for you.', technique: 'feel_felt_found', categoryColor: '#f59e0b' },
      { id: 'obj-3', category_id: 'objections', node_type: 'objection', title: 'Need to Talk to Spouse', title_he: 'צריך לדבר עם בן/בת הזוג', content: 'I need to talk to my wife/husband first', objection_type: 'spouse_decision', handle_script: 'I totally understand - this is a family decision. If your spouse was here, what do you think they\'d be most excited about?', prevent_script: 'Besides yourself, who else will be involved in making this decision?', technique: 'assumptive', categoryColor: '#f59e0b' },
      
      // Closing
      { id: 'close-1', category_id: 'closing', node_type: 'script', title: 'Trial Close', title_he: 'סגירת ניסיון', content: 'Does this make sense so far? On a scale of 1-10, how well does this fit?', short_content: 'Check understanding every 10-15 minutes' },
      { id: 'close-2', category_id: 'closing', node_type: 'script', title: 'Assumptive Close', title_he: 'סגירה אסומפטיבית', content: 'Great! Let\'s get the paperwork started. Would you prefer next week or the week after?', short_content: 'Assume the sale and move to logistics' },
      { id: 'close-3', category_id: 'closing', node_type: 'script', title: 'Isolation Close', title_he: 'סגירת בידוד', content: 'Other than that, is there anything else preventing you from moving forward today?', short_content: 'Isolate the final concern' },
    ]);
  };

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  const handleCategoryClick = useCallback((category) => {
    // Category expansion is handled by the canvas
    console.log('Category clicked:', category.name);
  }, []);

  const handleSaveScript = async (node) => {
    try {
      const headers = await getAuthHeaders();
      await axios.post(`${API_URL}/api/user-scripts`, {
        title: node.title,
        content: node.content,
        category: node.node_type,
        product_type: node.product_type || 'all',
        source_node_id: node.id,
      }, { headers });
      
      // Show success feedback
      alert(language === 'he' ? 'נשמר בהצלחה!' : 'Saved successfully!');
    } catch (err) {
      console.error('Error saving script:', err);
      alert(language === 'he' ? 'שגיאה בשמירה' : 'Error saving script');
    }
  };

  const getProductLabel = (value) => {
    const option = PRODUCT_OPTIONS.find(p => p.value === value);
    return language === 'he' ? option?.labelHe : option?.labelEn;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {language === 'he' ? 'מפת מכירות' : 'Sales Mind Map'}
              </h1>
              <p className="text-xs text-gray-400">
                {language === 'he' ? 'תהליך המכירה המלא' : 'Complete sales process visualization'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Product Filter */}
            <div className="relative">
              <button
                onClick={() => setShowProductDropdown(!showProductDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 transition-colors"
              >
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">{getProductLabel(productFilter)}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              
              {showProductDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                  {PRODUCT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setProductFilter(option.value);
                        setShowProductDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        productFilter === option.value ? 'text-purple-400 bg-gray-750' : 'text-gray-300'
                      }`}
                    >
                      {language === 'he' ? option.labelHe : option.labelEn}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'he' : 'en')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 transition-colors"
            >
              <Globe className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">
                {language === 'en' ? 'EN' : 'עב'}
              </span>
            </button>

            {/* My Scripts */}
            <button
              onClick={() => setShowMyScripts(!showMyScripts)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 transition-colors"
            >
              <FolderOpen className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">
                {language === 'he' ? 'הסקריפטים שלי' : 'My Scripts'}
              </span>
            </button>

            {/* Refresh */}
            <button
              onClick={loadMindMapData}
              disabled={isLoading}
              className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
              <p className="text-gray-400">
                {language === 'he' ? 'טוען מפת מכירות...' : 'Loading mind map...'}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={loadMindMapData}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
              >
                {language === 'he' ? 'נסה שוב' : 'Try Again'}
              </button>
            </div>
          </div>
        ) : (
          <MindMapCanvas
            categories={categories}
            nodes={nodes}
            onNodeClick={handleNodeClick}
            onCategoryClick={handleCategoryClick}
            selectedNodeId={selectedNode?.id}
            productFilter={productFilter}
            language={language}
          />
        )}

        {/* Node Detail Panel */}
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onSaveScript={handleSaveScript}
            language={language}
          />
        )}
      </div>
    </div>
  );
};

export default SalesMindMapPage;
