import { useState, useEffect, useRef } from 'react'
import { 
  GitBranch, Target, Users, MessageSquare, Lightbulb, AlertTriangle,
  CheckCircle2, Play, Pause, Volume2, ChevronRight, ChevronDown,
  Plus, Trash2, X, Sparkles, RefreshCw, Phone, BookOpen, Shield,
  ArrowRight, ArrowLeft, SkipForward, SkipBack, HelpCircle, FileText, PlayCircle
} from 'lucide-react'
import axios from 'axios'
import { API_URL } from '../lib/config'
import { supabase } from '../lib/supabase'

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token 
    ? { Authorization: `Bearer ${session.access_token}` }
    : {}
}

// Stage configurations
const STAGE_CONFIG = {
  opening: { icon: Phone, color: '#8b5cf6', label: 'Opening', emoji: '👋' },
  qualification: { icon: Target, color: '#3b82f6', label: 'Qualification', emoji: '🎯' },
  discovery: { icon: MessageSquare, color: '#10b981', label: 'Discovery', emoji: '🔍' },
  pain_amplification: { icon: AlertTriangle, color: '#f59e0b', label: 'Pain', emoji: '🔥' },
  solution: { icon: Lightbulb, color: '#06b6d4', label: 'Solution', emoji: '💡' },
  storytelling: { icon: BookOpen, color: '#ec4899', label: 'Stories', emoji: '📖' },
  objections: { icon: Shield, color: '#ef4444', label: 'Objections', emoji: '🛡️' },
  closing: { icon: CheckCircle2, color: '#22c55e', label: 'Closing', emoji: '🎉' },
  next_steps: { icon: ArrowRight, color: '#6366f1', label: 'Next Steps', emoji: '➡️' }
}

const CONTENT_ICONS = {
  script: FileText,
  question: HelpCircle,
  story: BookOpen,
  objection: Shield,
  tip: Lightbulb
}

// Content Card Component
function ContentCard({ content, onPlay, isPlaying }) {
  const Icon = CONTENT_ICONS[content.content_type] || FileText
  
  const typeColors = {
    script: 'border-violet-500/30 bg-violet-500/10',
    question: 'border-blue-500/30 bg-blue-500/10',
    story: 'border-pink-500/30 bg-pink-500/10',
    objection: 'border-red-500/30 bg-red-500/10',
    tip: 'border-yellow-500/30 bg-yellow-500/10'
  }
  
  const typeLabels = {
    script: 'Script',
    question: 'Question',
    story: 'Story',
    objection: 'Objection',
    tip: 'Tip'
  }
  
  return (
    <div className={`rounded-xl p-4 border ${typeColors[content.content_type] || 'border-white/10 bg-white/5'}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-400 uppercase">{typeLabels[content.content_type]}</span>
        </div>
        <button
          onClick={() => onPlay(content.content)}
          className={`p-1.5 rounded-lg transition-colors ${
            isPlaying ? 'bg-violet-500 text-white' : 'hover:bg-white/10 text-gray-400'
          }`}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
      
      {content.title && (
        <h4 className="text-white font-medium text-sm mb-1">{content.title}</h4>
      )}
      
      <p className="text-gray-300 text-sm leading-relaxed">{content.content}</p>
      
      {content.content_type === 'objection' && content.response && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-gray-500 mb-1">Response:</p>
          <p className="text-emerald-400 text-sm">{content.response}</p>
        </div>
      )}
    </div>
  )
}

// Simulation Player Component
function SimulationPlayer({ simulation, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [audioUrls, setAudioUrls] = useState(simulation.audio_urls || {})
  const [autoPlay, setAutoPlay] = useState(true)
  const audioRef = useRef(null)
  
  const messages = simulation.conversation || []
  
  const playMessage = async (index) => {
    if (index >= messages.length) {
      setIsPlaying(false)
      return
    }
    
    setCurrentIndex(index)
    let audioUrl = audioUrls[String(index)]
    
    if (!audioUrl) {
      setIsGeneratingAudio(true)
      try {
        const headers = await getAuthHeaders()
        const response = await axios.post(
          `${API_URL}/api/simulations/${simulation.id}/audio`,
          { message_indices: [index] },
          { headers, timeout: 30000 }
        )
        if (response.data.audio_urls) {
          setAudioUrls(prev => ({ ...prev, ...response.data.audio_urls }))
          audioUrl = response.data.audio_urls[String(index)]
        }
      } catch (err) {
        console.error('Error generating audio:', err)
      }
      setIsGeneratingAudio(false)
    }
    
    if (audioUrl) {
      const audio = new Audio(`${API_URL}${audioUrl}`)
      audioRef.current = audio
      
      audio.onended = () => {
        if (autoPlay && index < messages.length - 1) {
          setTimeout(() => playMessage(index + 1), 500)
        } else {
          setIsPlaying(false)
        }
      }
      
      setIsPlaying(true)
      await audio.play()
    }
  }
  
  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
    } else {
      playMessage(currentIndex)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-violet-400" />
              Sales Simulation
            </h2>
            <p className="text-gray-400 text-sm">{simulation.prospect_name} - {simulation.scenario}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              onClick={() => { setCurrentIndex(idx); }}
              className={`flex gap-3 cursor-pointer p-3 rounded-xl transition-all ${
                idx === currentIndex ? 'bg-violet-500/20 border border-violet-500/30' : 'hover:bg-white/5'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'seller' ? 'bg-violet-500/20' : 'bg-emerald-500/20'
              }`}>
                {msg.role === 'seller' ? '🎤' : '👤'}
              </div>
              <div className="flex-1">
                <span className={`font-medium text-sm ${msg.role === 'seller' ? 'text-violet-400' : 'text-emerald-400'}`}>
                  {msg.role === 'seller' ? 'You' : simulation.prospect_name}
                </span>
                <p className="text-gray-200 text-sm mt-1">{msg.text}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); playMessage(idx); }} className="p-2 hover:bg-white/10 rounded-lg">
                <Play className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} className="p-2 hover:bg-white/10 rounded-lg">
              <SkipBack className="w-5 h-5 text-gray-400" />
            </button>
            <button onClick={togglePlayPause} disabled={isGeneratingAudio} className="p-4 bg-violet-500 hover:bg-violet-600 rounded-full">
              {isGeneratingAudio ? <RefreshCw className="w-6 h-6 text-white animate-spin" /> : isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
            </button>
            <button onClick={() => setCurrentIndex(Math.min(messages.length - 1, currentIndex + 1))} className="p-2 hover:bg-white/10 rounded-lg">
              <SkipForward className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">{currentIndex + 1} / {messages.length}</p>
        </div>
      </div>
    </div>
  )
}

// Main Component
export default function SalesFlowPage() {
  const [view, setView] = useState('list') // list, detail, generate
  const [flows, setFlows] = useState([])
  const [selectedFlow, setSelectedFlow] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [playingText, setPlayingText] = useState(null)
  const [simulation, setSimulation] = useState(null)
  const [generatingSimulation, setGeneratingSimulation] = useState(false)
  
  // Generate form state
  const [productType, setProductType] = useState('')
  const [industry, setIndustry] = useState('')
  const [language, setLanguage] = useState('en')
  
  const audioRef = useRef(null)
  
  useEffect(() => {
    fetchFlows()
  }, [])
  
  const fetchFlows = async () => {
    setLoading(true)
    setError(null)
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get(`${API_URL}/api/sales-flows`, { headers, timeout: 15000 })
      setFlows(response.data || [])
    } catch (err) {
      console.error('Error fetching flows:', err)
      setError('Failed to load flows')
    }
    setLoading(false)
  }
  
  const fetchFlowDetails = async (flowId) => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get(`${API_URL}/api/sales-flows/${flowId}`, { headers, timeout: 15000 })
      setSelectedFlow(response.data)
      if (response.data.nodes?.length > 0) {
        setSelectedNode(response.data.nodes[0])
      }
      setView('detail')
    } catch (err) {
      console.error('Error fetching flow:', err)
      setError('Failed to load flow details')
    }
    setLoading(false)
  }
  
  const generateFlow = async () => {
    if (!productType.trim()) {
      setError('Please enter a product or service')
      return
    }
    
    setGenerating(true)
    setError(null)
    
    try {
      const headers = await getAuthHeaders()
      const response = await axios.post(
        `${API_URL}/api/sales-flows/generate`,
        { product_type: productType, industry: industry || 'General', language },
        { headers, timeout: 120000 } // 2 minute timeout for AI generation
      )
      
      if (response.data.success && response.data.flow_id) {
        await fetchFlowDetails(response.data.flow_id)
        setProductType('')
        setIndustry('')
      } else {
        setError(response.data.error || 'Failed to generate flow')
      }
    } catch (err) {
      console.error('Error generating flow:', err)
      if (err.code === 'ECONNABORTED') {
        setError('Generation timed out. Please try again.')
      } else if (err.response?.data?.error) {
        setError(err.response.data.error)
      } else {
        setError('Failed to generate flow. Please try again.')
      }
    }
    setGenerating(false)
  }
  
  const deleteFlow = async (flowId, e) => {
    e?.stopPropagation()
    if (!window.confirm('Delete this flow?')) return
    
    try {
      const headers = await getAuthHeaders()
      await axios.delete(`${API_URL}/api/sales-flows/${flowId}`, { headers })
      setFlows(flows.filter(f => f.id !== flowId))
      if (selectedFlow?.id === flowId) {
        setSelectedFlow(null)
        setView('list')
      }
    } catch (err) {
      console.error('Error deleting flow:', err)
    }
  }
  
  const playContent = async (text) => {
    if (playingText === text) {
      audioRef.current?.pause()
      setPlayingText(null)
      return
    }
    
    try {
      const headers = await getAuthHeaders()
      const response = await axios.post(
        `${API_URL}/api/flow-content/tts`,
        { text, voice: 'nova' },
        { headers, timeout: 30000 }
      )
      
      if (response.data.audio_url) {
        const audio = new Audio(`${API_URL}${response.data.audio_url}`)
        audioRef.current = audio
        audio.onended = () => setPlayingText(null)
        setPlayingText(text)
        await audio.play()
      }
    } catch (err) {
      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.onend = () => setPlayingText(null)
      setPlayingText(text)
      window.speechSynthesis.speak(utterance)
    }
  }
  
  const generateSimulation = async () => {
    if (!selectedFlow) return
    
    setGeneratingSimulation(true)
    try {
      const headers = await getAuthHeaders()
      const response = await axios.post(
        `${API_URL}/api/sales-flows/${selectedFlow.id}/simulate`,
        { prospect_persona: 'Skeptical but interested prospect', scenario: `Sales call for ${selectedFlow.product_type}` },
        { headers, timeout: 60000 }
      )
      
      if (response.data.success) {
        setSimulation({ id: response.data.simulation_id, ...response.data.simulation })
      }
    } catch (err) {
      console.error('Error generating simulation:', err)
      setError('Failed to generate simulation')
    }
    setGeneratingSimulation(false)
  }
  
  // Presets for quick generation
  const presets = [
    { product: 'Vinyl Fence', industry: 'Home Improvement' },
    { product: 'Solar Panels', industry: 'Energy' },
    { product: 'SaaS Software', industry: 'B2B Tech' },
    { product: 'Insurance', industry: 'Financial' },
    { product: 'Real Estate', industry: 'Property' },
    { product: 'Car Sales', industry: 'Automotive' }
  ]
  
  // LIST VIEW
  if (view === 'list') {
    return (
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Sales Flow</h1>
              <p className="text-gray-400 text-sm">Master your sales process</p>
            </div>
          </div>
          
          <button
            onClick={() => setView('generate')}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 rounded-xl text-white font-medium"
          >
            <Sparkles className="w-5 h-5" />
            Create New Flow
          </button>
        </div>
        
        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
          </div>
        )}
        
        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        ) : flows.length === 0 ? (
          // Empty State
          <div className="text-center py-20 bg-white/[0.02] rounded-2xl border border-white/10">
            <div className="w-20 h-20 bg-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GitBranch className="w-10 h-10 text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Sales Flows Yet</h3>
            <p className="text-gray-400 max-w-md mx-auto mb-6">
              Create your first AI-powered sales flow with scripts, questions, and objection handling.
            </p>
            <button
              onClick={() => setView('generate')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl text-white font-medium"
            >
              <Sparkles className="w-5 h-5" />
              Generate Your First Flow
            </button>
          </div>
        ) : (
          // Flows Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {flows.map(flow => (
              <div
                key={flow.id}
                onClick={() => fetchFlowDetails(flow.id)}
                className="bg-white/[0.03] rounded-2xl border border-white/10 p-5 cursor-pointer hover:border-violet-500/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center">
                    <GitBranch className="w-6 h-6 text-violet-400" />
                  </div>
                  <button
                    onClick={(e) => deleteFlow(flow.id, e)}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
                <h3 className="text-white font-bold mb-1 truncate">{flow.name}</h3>
                <p className="text-gray-400 text-sm line-clamp-2">{flow.description || 'Complete sales process'}</p>
                <div className="flex gap-2 mt-3">
                  {flow.product_type && (
                    <span className="px-2 py-1 bg-violet-500/20 text-violet-300 rounded text-xs">{flow.product_type}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  // GENERATE VIEW
  if (view === 'generate') {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" />
          Back to Flows
        </button>
        
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Generate Sales Flow</h2>
              <p className="text-gray-400 text-sm">AI will create a complete sales process</p>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
          
          {/* Quick Presets */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Quick Start</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => { setProductType(preset.product); setIndustry(preset.industry); }}
                  className={`p-3 rounded-xl text-sm text-left transition-all ${
                    productType === preset.product 
                      ? 'bg-violet-500/20 border border-violet-500/50 text-violet-300'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <div className="font-medium">{preset.product}</div>
                  <div className="text-xs opacity-70">{preset.industry}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Product / Service *</label>
              <input
                type="text"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                placeholder="e.g., Vinyl Fence, Solar Panels"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., Home Improvement, B2B"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Language</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    language === 'en' ? 'bg-violet-500 text-white' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('he')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    language === 'he' ? 'bg-violet-500 text-white' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  עברית
                </button>
              </div>
            </div>
          </div>
          
          <button
            onClick={generateFlow}
            disabled={!productType.trim() || generating}
            className="w-full mt-6 py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generating... (may take 30-60 seconds)
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Sales Flow
              </>
            )}
          </button>
        </div>
      </div>
    )
  }
  
  // DETAIL VIEW
  if (view === 'detail' && selectedFlow) {
    return (
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedFlow(null); setView('list'); }} className="p-2 hover:bg-white/10 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{selectedFlow.name}</h1>
              <p className="text-gray-400 text-sm">{selectedFlow.product_type} • {selectedFlow.nodes?.length || 0} stages</p>
            </div>
          </div>
          
          <button
            onClick={generateSimulation}
            disabled={generatingSimulation}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-medium disabled:opacity-50"
          >
            {generatingSimulation ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
            Simulate Call
          </button>
        </div>
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Stages */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Stages</h2>
            {selectedFlow.nodes?.map((node, idx) => {
              const config = STAGE_CONFIG[node.stage_type] || STAGE_CONFIG.opening
              const Icon = config.icon
              const isActive = selectedNode?.id === node.id
              
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-violet-500/20 border border-violet-500/50' 
                      : 'bg-white/[0.03] border border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{config.emoji}</span>
                        <h3 className="text-white font-medium truncate">{node.title}</h3>
                      </div>
                      <p className="text-gray-400 text-xs truncate">{node.description}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Right: Content */}
          <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-5 max-h-[70vh] overflow-y-auto">
            {selectedNode ? (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{STAGE_CONFIG[selectedNode.stage_type]?.emoji || '📍'}</span>
                    <h2 className="text-xl font-bold text-white">{selectedNode.title}</h2>
                  </div>
                  <p className="text-gray-400 text-sm">{selectedNode.description}</p>
                </div>
                
                {selectedNode.content?.length > 0 ? (
                  <div className="space-y-4">
                    {['script', 'question', 'story', 'objection', 'tip'].map(type => {
                      const items = selectedNode.content.filter(c => c.content_type === type)
                      if (items.length === 0) return null
                      
                      const labels = { script: 'Scripts', question: 'Questions', story: 'Stories', objection: 'Objections', tip: 'Tips' }
                      
                      return (
                        <div key={type}>
                          <h3 className="text-sm font-medium text-gray-400 mb-2">{labels[type]}</h3>
                          <div className="space-y-2">
                            {items.map((item, idx) => (
                              <ContentCard 
                                key={idx} 
                                content={item} 
                                onPlay={playContent}
                                isPlaying={playingText === item.content}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-10">No content for this stage</p>
                )}
              </>
            ) : (
              <div className="text-center py-10">
                <GitBranch className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Select a stage to view content</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Simulation Player */}
        {simulation && (
          <SimulationPlayer simulation={simulation} onClose={() => setSimulation(null)} />
        )}
      </div>
    )
  }
  
  return null
}
