import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  GitBranch, Target, Users, MessageSquare, Lightbulb, AlertTriangle,
  CheckCircle2, Play, Pause, Volume2, VolumeX, ChevronRight, ChevronDown,
  Plus, Trash2, Edit3, Save, X, Sparkles, RefreshCw, Download, Share2,
  Phone, Clock, Award, Mic, BookOpen, Zap, Shield, Heart, TrendingUp,
  ArrowRight, ArrowLeft, SkipForward, SkipBack, Settings, Filter,
  List, Grid3X3, Maximize2, Minimize2, HelpCircle, FileText, PlayCircle
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

// Stage type configurations
const STAGE_CONFIG = {
  opening: { icon: Phone, color: '#8b5cf6', label: 'Opening', emoji: '👋' },
  qualification: { icon: Target, color: '#3b82f6', label: 'Qualification', emoji: '🎯' },
  discovery: { icon: MessageSquare, color: '#10b981', label: 'Discovery', emoji: '🔍' },
  pain_amplification: { icon: AlertTriangle, color: '#f59e0b', label: 'Pain Amplification', emoji: '🔥' },
  solution: { icon: Lightbulb, color: '#06b6d4', label: 'Solution', emoji: '💡' },
  storytelling: { icon: BookOpen, color: '#ec4899', label: 'Storytelling', emoji: '📖' },
  objections: { icon: Shield, color: '#ef4444', label: 'Objections', emoji: '🛡️' },
  closing: { icon: CheckCircle2, color: '#22c55e', label: 'Closing', emoji: '🎉' },
  next_steps: { icon: ArrowRight, color: '#6366f1', label: 'Next Steps', emoji: '➡️' }
}

// Content type icons
const CONTENT_ICONS = {
  script: FileText,
  question: HelpCircle,
  story: BookOpen,
  objection: Shield,
  tip: Lightbulb
}

// Flow Node Component
function FlowNode({ node, isActive, isExpanded, onClick, onToggle, index, total }) {
  const config = STAGE_CONFIG[node.stage_type] || STAGE_CONFIG.opening
  const Icon = config.icon
  
  return (
    <div className="relative">
      {/* Connection Line */}
      {index < total - 1 && (
        <div className="absolute left-6 top-16 w-0.5 h-8 bg-gradient-to-b from-white/20 to-transparent hidden sm:block" />
      )}
      
      <div
        onClick={onClick}
        className={`relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer group ${
          isActive 
            ? 'border-violet-500 shadow-lg shadow-violet-500/20 scale-[1.02]' 
            : 'border-white/10 hover:border-white/30'
        }`}
      >
        {/* Stage Number Badge */}
        <div 
          className="absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
          style={{ backgroundColor: config.color }}
        >
          {index + 1}
        </div>
        
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon */}
          <div 
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${config.color}20` }}
          >
            <Icon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: config.color }} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{config.emoji}</span>
              <h3 className="text-white font-bold text-base sm:text-lg truncate">{node.title}</h3>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm line-clamp-2">{node.description}</p>
            
            {/* Content Preview */}
            {node.content && node.content.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['script', 'question', 'story', 'objection', 'tip'].map(type => {
                  const count = node.content.filter(c => c.content_type === type).length
                  if (count === 0) return null
                  const ContentIcon = CONTENT_ICONS[type]
                  return (
                    <span 
                      key={type}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded text-xs text-gray-400"
                    >
                      <ContentIcon className="w-3 h-3" />
                      {count}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Expand/Collapse */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
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
      
      {/* For objections, show the response */}
      {content.content_type === 'objection' && content.response && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-gray-500 mb-1">How to respond:</p>
          <p className="text-emerald-400 text-sm">{content.response}</p>
        </div>
      )}
      
      {content.category && (
        <span className="inline-block mt-2 px-2 py-0.5 bg-white/10 rounded text-xs text-gray-400">
          {content.category}
        </span>
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
  const currentMessage = messages[currentIndex]
  
  const playMessage = async (index) => {
    if (index >= messages.length) {
      setIsPlaying(false)
      return
    }
    
    setCurrentIndex(index)
    
    // Check if audio exists
    let audioUrl = audioUrls[String(index)]
    
    if (!audioUrl) {
      // Generate audio for this message
      setIsGeneratingAudio(true)
      try {
        const headers = await getAuthHeaders()
        const response = await axios.post(
          `${API_URL}/api/simulations/${simulation.id}/audio`,
          { message_indices: [index] },
          { headers }
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
      
      audio.onerror = () => {
        console.error('Audio playback error')
        setIsPlaying(false)
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
  
  const goToMessage = (index) => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    setIsPlaying(false)
    setCurrentIndex(index)
  }
  
  const generateAllAudio = async () => {
    setIsGeneratingAudio(true)
    try {
      const headers = await getAuthHeaders()
      const response = await axios.post(
        `${API_URL}/api/simulations/${simulation.id}/audio`,
        {},
        { headers }
      )
      if (response.data.audio_urls) {
        setAudioUrls(response.data.audio_urls)
      }
    } catch (err) {
      console.error('Error generating all audio:', err)
    }
    setIsGeneratingAudio(false)
  }
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <PlayCircle className="w-6 h-6 text-violet-400" />
                Sales Simulation
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {simulation.prospect_name} - {simulation.scenario}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Conversation */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              onClick={() => goToMessage(idx)}
              className={`flex gap-3 cursor-pointer p-3 rounded-xl transition-all ${
                idx === currentIndex 
                  ? 'bg-violet-500/20 border border-violet-500/30' 
                  : idx < currentIndex 
                    ? 'opacity-60' 
                    : 'hover:bg-white/5'
              }`}
            >
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'seller' ? 'bg-violet-500/20' : 'bg-emerald-500/20'
              }`}>
                {msg.role === 'seller' ? (
                  <Mic className="w-5 h-5 text-violet-400" />
                ) : (
                  <Users className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              
              {/* Message */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-medium text-sm ${
                    msg.role === 'seller' ? 'text-violet-400' : 'text-emerald-400'
                  }`}>
                    {msg.role === 'seller' ? 'You (Seller)' : simulation.prospect_name}
                  </span>
                  {msg.stage && (
                    <span className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-400">
                      {msg.stage}
                    </span>
                  )}
                  {idx === currentIndex && isPlaying && (
                    <span className="flex items-center gap-1 text-violet-400 text-xs">
                      <Volume2 className="w-3 h-3 animate-pulse" />
                      Playing
                    </span>
                  )}
                </div>
                <p className="text-gray-200 text-sm">{msg.text}</p>
                {msg.notes && (
                  <p className="text-xs text-gray-500 mt-1 italic">💡 {msg.notes}</p>
                )}
                {msg.emotion && (
                  <p className="text-xs text-amber-400 mt-1">Emotion: {msg.emotion}</p>
                )}
              </div>
              
              {/* Play button for individual message */}
              <button
                onClick={(e) => { e.stopPropagation(); playMessage(idx); }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              >
                <Play className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
        
        {/* Controls */}
        <div className="p-4 sm:p-6 border-t border-white/10 bg-black/20">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Progress */}
            <div className="w-full sm:flex-1">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
                  style={{ width: `${((currentIndex + 1) / messages.length) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-center sm:text-left">
                {currentIndex + 1} / {messages.length} messages
              </p>
            </div>
            
            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToMessage(Math.max(0, currentIndex - 1))}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                disabled={currentIndex === 0}
              >
                <SkipBack className="w-5 h-5 text-gray-400" />
              </button>
              
              <button
                onClick={togglePlayPause}
                disabled={isGeneratingAudio}
                className="p-3 bg-violet-500 hover:bg-violet-600 rounded-full transition-colors disabled:opacity-50"
              >
                {isGeneratingAudio ? (
                  <RefreshCw className="w-6 h-6 text-white animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white" />
                )}
              </button>
              
              <button
                onClick={() => goToMessage(Math.min(messages.length - 1, currentIndex + 1))}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                disabled={currentIndex === messages.length - 1}
              >
                <SkipForward className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Options */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  autoPlay ? 'bg-violet-500/20 text-violet-400' : 'bg-white/5 text-gray-400'
                }`}
              >
                Auto-play
              </button>
              
              <button
                onClick={generateAllAudio}
                disabled={isGeneratingAudio}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-gray-400 transition-colors disabled:opacity-50"
              >
                {isGeneratingAudio ? 'Generating...' : 'Pre-generate Audio'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Generate Flow Modal
function GenerateFlowModal({ onClose, onGenerate }) {
  const [productType, setProductType] = useState('')
  const [industry, setIndustry] = useState('')
  const [language, setLanguage] = useState('en')
  const [isGenerating, setIsGenerating] = useState(false)
  
  const handleGenerate = async () => {
    if (!productType) return
    
    setIsGenerating(true)
    try {
      const headers = await getAuthHeaders()
      const response = await axios.post(
        `${API_URL}/api/sales-flows/generate`,
        { product_type: productType, industry, language },
        { headers }
      )
      
      if (response.data.success) {
        onGenerate(response.data.flow_id)
      }
    } catch (err) {
      console.error('Error generating flow:', err)
    }
    setIsGenerating(false)
  }
  
  // Quick presets
  const presets = [
    { product: 'Vinyl Fence', industry: 'Home Improvement' },
    { product: 'Solar Panels', industry: 'Energy' },
    { product: 'SaaS Software', industry: 'B2B Technology' },
    { product: 'Insurance Policy', industry: 'Financial Services' },
    { product: 'Real Estate', industry: 'Property' },
    { product: 'Car Sales', industry: 'Automotive' }
  ]
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            Generate Sales Flow
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Quick Presets */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Quick Start</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setProductType(preset.product)
                  setIndustry(preset.industry)
                }}
                className={`p-2 rounded-lg text-xs text-left transition-colors ${
                  productType === preset.product 
                    ? 'bg-violet-500/20 border border-violet-500/50 text-violet-300'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                {preset.product}
              </button>
            ))}
          </div>
        </div>
        
        {/* Custom Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Product / Service *</label>
            <input
              type="text"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              placeholder="e.g., Vinyl Fence, Solar Panels, SaaS Software"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Home Improvement, B2B, Healthcare"
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
        
        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!productType || isGenerating}
          className="w-full mt-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 rounded-xl text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Generating Flow...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Sales Flow
            </>
          )}
        </button>
        
        <p className="text-xs text-gray-500 text-center mt-3">
          AI will create a complete sales flow with scripts, questions, stories, and objection handling
        </p>
      </div>
    </div>
  )
}

// Main Sales Flow Page Component
export default function SalesFlowPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [flows, setFlows] = useState([])
  const [selectedFlow, setSelectedFlow] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [expandedNodes, setExpandedNodes] = useState({})
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [playingText, setPlayingText] = useState(null)
  const [simulation, setSimulation] = useState(null)
  const [isGeneratingSimulation, setIsGeneratingSimulation] = useState(false)
  const [viewMode, setViewMode] = useState('list') // list, flow
  const audioRef = useRef(null)
  
  useEffect(() => {
    fetchFlows()
  }, [])
  
  const fetchFlows = async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get(`${API_URL}/api/sales-flows`, { headers })
      setFlows(response.data || [])
    } catch (err) {
      console.error('Error fetching flows:', err)
    }
    setLoading(false)
  }
  
  const fetchFlowDetails = async (flowId) => {
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get(`${API_URL}/api/sales-flows/${flowId}`, { headers })
      setSelectedFlow(response.data)
      if (response.data.nodes && response.data.nodes.length > 0) {
        setSelectedNode(response.data.nodes[0])
      }
    } catch (err) {
      console.error('Error fetching flow details:', err)
    }
  }
  
  const handleFlowGenerated = (flowId) => {
    setShowGenerateModal(false)
    fetchFlows()
    fetchFlowDetails(flowId)
  }
  
  const toggleNodeExpanded = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }))
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
        { headers }
      )
      
      if (response.data.audio_url) {
        const audio = new Audio(`${API_URL}${response.data.audio_url}`)
        audioRef.current = audio
        
        audio.onended = () => setPlayingText(null)
        audio.onerror = () => setPlayingText(null)
        
        setPlayingText(text)
        await audio.play()
      }
    } catch (err) {
      console.error('Error playing content:', err)
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
    
    setIsGeneratingSimulation(true)
    try {
      const headers = await getAuthHeaders()
      const response = await axios.post(
        `${API_URL}/api/sales-flows/${selectedFlow.id}/simulate`,
        {
          prospect_persona: 'A busy homeowner who is skeptical but has a real need. They have been burned by contractors before and are price-conscious.',
          scenario: `Initial sales call for ${selectedFlow.product_type}`
        },
        { headers }
      )
      
      if (response.data.success) {
        setSimulation({
          id: response.data.simulation_id,
          ...response.data.simulation
        })
      }
    } catch (err) {
      console.error('Error generating simulation:', err)
    }
    setIsGeneratingSimulation(false)
  }
  
  const deleteFlow = async (flowId) => {
    if (!window.confirm('Are you sure you want to delete this flow?')) return
    
    try {
      const headers = await getAuthHeaders()
      await axios.delete(`${API_URL}/api/sales-flows/${flowId}`, { headers })
      setFlows(flows.filter(f => f.id !== flowId))
      if (selectedFlow?.id === flowId) {
        setSelectedFlow(null)
        setSelectedNode(null)
      }
    } catch (err) {
      console.error('Error deleting flow:', err)
    }
  }
  
  // Flow list view (no flow selected)
  if (!selectedFlow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <GitBranch className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Sales Flow</h1>
              <p className="text-gray-400 text-sm">Master your sales process step by step</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 rounded-xl text-white font-medium transition-colors shadow-lg shadow-violet-500/20"
          >
            <Sparkles className="w-5 h-5" />
            Create New Flow
          </button>
        </div>
        
        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        ) : flows.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-violet-500/20 rounded-2xl flex items-center justify-center mb-4">
              <GitBranch className="w-10 h-10 text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Sales Flows Yet</h3>
            <p className="text-gray-400 max-w-md mb-6">
              Create your first sales flow to visualize your entire sales process, 
              from opening to closing. Each stage includes scripts, questions, and handling techniques.
            </p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl text-white font-medium"
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
                className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 overflow-hidden group hover:border-violet-500/50 transition-colors cursor-pointer"
                onClick={() => fetchFlowDetails(flow.id)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-xl flex items-center justify-center">
                      <GitBranch className="w-6 h-6 text-violet-400" />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteFlow(flow.id); }}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                  
                  <h3 className="text-white font-bold text-lg mb-1 truncate">{flow.name}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{flow.description || 'Complete sales process'}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {flow.product_type && (
                      <span className="px-2 py-1 bg-violet-500/20 text-violet-300 rounded-lg text-xs">
                        {flow.product_type}
                      </span>
                    )}
                    {flow.industry && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs">
                        {flow.industry}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="px-5 py-3 bg-black/20 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(flow.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      View Flow
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Generate Modal */}
        {showGenerateModal && (
          <GenerateFlowModal
            onClose={() => setShowGenerateModal(false)}
            onGenerate={handleFlowGenerated}
          />
        )}
      </div>
    )
  }
  
  // Flow detail view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-white/10">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setSelectedFlow(null); setSelectedNode(null); }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white truncate max-w-[200px] sm:max-w-none">
                  {selectedFlow.name}
                </h1>
                <p className="text-xs sm:text-sm text-gray-400">
                  {selectedFlow.product_type} • {selectedFlow.nodes?.length || 0} stages
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={generateSimulation}
                disabled={isGeneratingSimulation}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isGeneratingSimulation ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Simulate Call</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content - Responsive Layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Left: Flow Stages */}
        <div className="w-full lg:w-1/2 xl:w-2/5 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-white/10 max-h-[50vh] lg:max-h-[calc(100vh-80px)] overflow-y-auto">
          <div className="space-y-4">
            {selectedFlow.nodes?.map((node, idx) => (
              <FlowNode
                key={node.id}
                node={node}
                index={idx}
                total={selectedFlow.nodes.length}
                isActive={selectedNode?.id === node.id}
                isExpanded={expandedNodes[node.id]}
                onClick={() => setSelectedNode(node)}
                onToggle={() => toggleNodeExpanded(node.id)}
              />
            ))}
          </div>
        </div>
        
        {/* Right: Node Details */}
        <div className="flex-1 p-4 sm:p-6 max-h-[50vh] lg:max-h-[calc(100vh-80px)] overflow-y-auto">
          {selectedNode ? (
            <div>
              {/* Node Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{STAGE_CONFIG[selectedNode.stage_type]?.emoji || '📍'}</span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">{selectedNode.title}</h2>
                </div>
                <p className="text-gray-400">{selectedNode.description}</p>
              </div>
              
              {/* Content Sections */}
              {selectedNode.content && selectedNode.content.length > 0 ? (
                <div className="space-y-6">
                  {/* Scripts */}
                  {selectedNode.content.filter(c => c.content_type === 'script').length > 0 && (
                    <div>
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-violet-400" />
                        Scripts & Phrases
                      </h3>
                      <div className="grid gap-3">
                        {selectedNode.content.filter(c => c.content_type === 'script').map((content, idx) => (
                          <ContentCard 
                            key={idx} 
                            content={content} 
                            onPlay={playContent}
                            isPlaying={playingText === content.content}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Questions */}
                  {selectedNode.content.filter(c => c.content_type === 'question').length > 0 && (
                    <div>
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-blue-400" />
                        Questions to Ask
                      </h3>
                      <div className="grid gap-3">
                        {selectedNode.content.filter(c => c.content_type === 'question').map((content, idx) => (
                          <ContentCard 
                            key={idx} 
                            content={content} 
                            onPlay={playContent}
                            isPlaying={playingText === content.content}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Stories */}
                  {selectedNode.content.filter(c => c.content_type === 'story').length > 0 && (
                    <div>
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-pink-400" />
                        Stories & Examples
                      </h3>
                      <div className="grid gap-3">
                        {selectedNode.content.filter(c => c.content_type === 'story').map((content, idx) => (
                          <ContentCard 
                            key={idx} 
                            content={content} 
                            onPlay={playContent}
                            isPlaying={playingText === content.content}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Objections */}
                  {selectedNode.content.filter(c => c.content_type === 'objection').length > 0 && (
                    <div>
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-400" />
                        Objection Handling
                      </h3>
                      <div className="grid gap-3">
                        {selectedNode.content.filter(c => c.content_type === 'objection').map((content, idx) => (
                          <ContentCard 
                            key={idx} 
                            content={content} 
                            onPlay={playContent}
                            isPlaying={playingText === content.content}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Tips */}
                  {selectedNode.content.filter(c => c.content_type === 'tip').length > 0 && (
                    <div>
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-400" />
                        Pro Tips
                      </h3>
                      <div className="grid gap-3">
                        {selectedNode.content.filter(c => c.content_type === 'tip').map((content, idx) => (
                          <ContentCard 
                            key={idx} 
                            content={content} 
                            onPlay={playContent}
                            isPlaying={playingText === content.content}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No content for this stage yet</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <GitBranch className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Select a stage to view its content</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Simulation Player */}
      {simulation && (
        <SimulationPlayer
          simulation={simulation}
          onClose={() => setSimulation(null)}
        />
      )}
    </div>
  )
}
