import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { 
  Upload, Users, MessageSquare, Clock, FileAudio, CheckCircle2, Mic, Brain, UserCheck,
  BarChart3, TrendingUp, AlertTriangle, Target, Zap, Phone, PlayCircle, PauseCircle,
  ChevronRight, Sparkles, Shield, Award, PieChart, Activity, Volume2, Home, History,
  Settings, User, Menu, X, ChevronDown, Calendar, Hash, LogOut, FileDown, Edit3, Dumbbell, BookMarked,
  Heart, Trash2, Search, ThumbsUp, ThumbsDown, Globe
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from './contexts/AuthContext'
import { useLanguage } from './contexts/LanguageContext'
import { t } from './lib/translations'
import { supabase } from './lib/supabase'
import ProtectedRoute from './components/ProtectedRoute'
import { LanguageToggle } from './components/LanguageToggle'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminCallsPage from './pages/AdminCallsPage'
import AdminCallView from './pages/AdminCallView'
import LiveCallPageMobile from './pages/LiveCallPageMobile'
import AIAgentPage from './pages/AIAgentPage'
import PracticePage from './pages/PracticePage'
import { API_URL } from './lib/config'
import { AnalysisInsights } from './components/analysis'
import AIAssistant from './components/AIAssistant'
import { playAudioElement, createAudioElement, resumeAudioContext } from './lib/audioUtils'

// Helper function to get translated stages
const getStages = (lang) => [
  { key: 'upload', label: t('calls.uploading', lang), icon: Upload, progress: 10 },
  { key: 'queue', label: t('calls.inQueue', lang), icon: Clock, progress: 25 },
  { key: 'transcribe', label: t('calls.transcribing', lang), icon: Mic, progress: 50 },
  { key: 'speakers', label: t('calls.identifyingSpeakers', lang), icon: Users, progress: 75 },
  { key: 'classify', label: t('calls.analyzingRoles', lang), icon: Brain, progress: 90 },
  { key: 'complete', label: t('calls.complete', lang), icon: CheckCircle2, progress: 100 },
]

// Helper function to get translated nav items
const getNavItems = (lang) => [
  { id: 'dashboard', label: t('nav.dashboard', lang), icon: Home },
  { id: 'ai-agent', label: t('nav.aiAgent', lang), icon: Brain, highlight: true, isRoute: true },
  { id: 'story-bank', label: t('nav.storyBank', lang), icon: BookMarked },
  { id: 'upload', label: t('nav.newCall', lang), icon: Upload },
  { id: 'calls', label: t('nav.callHistory', lang), icon: History },
  { id: 'settings', label: t('nav.settings', lang), icon: Settings },
]

const upcomingFeatures = [
  { icon: BarChart3, title: 'Talk-to-Listen Ratio', description: 'Analyze speaking time distribution', status: 'coming' },
  { icon: AlertTriangle, title: 'Objection Detection', description: 'Identify and categorize objections', status: 'coming' },
  { icon: Target, title: 'MEDDIC/BANT Scoring', description: 'Score calls against sales methodologies', status: 'coming' },
  { icon: TrendingUp, title: 'Deal Risk Score', description: 'Predict deal success probability', status: 'coming' },
  { icon: Award, title: 'Rep Performance', description: 'Benchmark against top performers', status: 'coming' },
  { icon: Zap, title: 'AI Coaching', description: 'Get personalized improvement tips', status: 'coming' },
]

// Helper to get auth headers for API calls
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token 
    ? { Authorization: `Bearer ${session.access_token}` }
    : {}
}

// TTS Audio Player Component - Mini player for text-to-speech
function TTSPlayer({ text, label = "🔊 Listen", onPlay, onStop }) {
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)

  // Cross-device compatible audio playback
  const playAudio = async () => {
    if (audioRef.current) {
      // Resume AudioContext on user gesture (required for iOS)
      await resumeAudioContext()
      // Notify parent to stop main audio
      if (onPlay) onPlay()
      try {
        await playAudioElement(audioRef.current)
        setPlaying(true)
      } catch (err) {
        console.error('Audio playback error:', err)
        // On iOS, if autoplay fails, user needs to tap again
      }
    }
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlaying(false)
      setCurrentTime(0)
      if (onStop) onStop()
    }
  }

  const togglePlay = async () => {
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      await playAudio()
    }
  }

  const generateAudio = async () => {
    if (audioUrl) {
      await togglePlay()
      return
    }

    // Resume AudioContext on user gesture (required for iOS)
    await resumeAudioContext()
    
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/tts`, { 
        text,
        voice: 'nova',
        hd: true,
        speed: 0.9
      })
      const fullUrl = `${API_URL}${response.data.audio_url}`
      setAudioUrl(fullUrl)
      
      // Create audio element with iOS-compatible settings
      const audio = createAudioElement(fullUrl)
      audioRef.current = audio
      
      // Set up event handlers
      audio.onloadedmetadata = () => setDuration(audio.duration)
      audio.ontimeupdate = () => setCurrentTime(audio.currentTime)
      audio.onended = () => { setPlaying(false); setCurrentTime(0) }
      audio.onerror = () => console.error('Audio load error')
      
      // Auto-play after generation (on user gesture)
      try {
        await playAudioElement(audio)
        setPlaying(true)
        if (onPlay) onPlay()
      } catch (err) {
        console.error('Auto-play failed:', err)
        // User will need to tap play button
      }
    } catch (err) {
      console.error('TTS error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    setPlaying(false)
    setCurrentTime(0)
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    if (audioRef.current && duration > 0) {
      audioRef.current.currentTime = percent * duration
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="mt-3 sm:mt-4">
      {!audioUrl ? (
        <button
          onClick={generateAudio}
          disabled={loading}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-xl transition-all text-sm sm:text-base font-medium disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span>{label}</span>
            </>
          )}
        </button>
      ) : (
        <div className="bg-black/30 rounded-xl p-3 border border-violet-500/20">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform flex-shrink-0"
            >
              {playing ? (
                <PauseCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : (
                <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </button>
            
            {/* Stop Button */}
            <button
              onClick={stopAudio}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-red-500/20 hover:bg-red-500/30 rounded-full flex items-center justify-center transition-colors flex-shrink-0 border border-red-500/30"
              title="Stop"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            </button>
            
            {/* Progress Bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-violet-300">AI Voice</span>
                <span className="text-xs text-gray-400 font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <div 
                className="h-2 bg-white/10 rounded-full cursor-pointer overflow-hidden"
                onClick={handleSeek}
              >
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}

// Floating Audio Control - Shows when audio is playing for easy stop access
function FloatingAudioControl({ isPlaying, currentTime, duration, onStop, onTogglePlay, label = "Call Audio" }) {
  if (!isPlaying && currentTime === 0) return null

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-violet-500/30 shadow-2xl shadow-violet-500/20 w-[calc(100%-2rem)] max-w-md">
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform flex-shrink-0"
        >
          {isPlaying ? (
            <PauseCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          ) : (
            <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          )}
        </button>
        
        {/* Progress Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-violet-300 truncate">{label}</span>
            <span className="text-xs text-gray-400 font-mono flex-shrink-0 ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Stop Button */}
        <button
          onClick={onStop}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 hover:bg-red-500/30 rounded-full flex items-center justify-center transition-colors flex-shrink-0 border border-red-500/30"
          title="Stop"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
        </button>
      </div>
    </div>
  )
}

// PDF Download Button Component
function PDFDownloadButton({ analysisResult, fileName = 'call_analysis' }) {
  const [loading, setLoading] = useState(false)

  const downloadPDF = async () => {
    if (!analysisResult) return
    
    setLoading(true)
    try {
      const response = await axios.post(
        `${API_URL}/api/generate-pdf`,
        {
          analysis_data: analysisResult,
          file_name: fileName
        },
        {
          responseType: 'blob'
        }
      )
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${fileName}_report.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF download error:', err)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={downloadPDF}
      disabled={loading || !analysisResult}
      className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl transition-all font-medium flex items-center gap-2 text-sm sm:text-base disabled:opacity-50 shadow-lg shadow-emerald-500/20"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="hidden sm:inline">Generating...</span>
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          <span className="hidden sm:inline">Download PDF</span>
          <span className="sm:hidden">PDF</span>
        </>
      )}
    </button>
  )
}

// Story Bank Content Component - Clean Professional Design
// Bilingual story options
const getStoryEmotions = (lang) => [
  { value: 'trust', label: t('emotions.trust', lang), color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'urgency', label: t('emotions.urgency', lang), color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'value', label: t('emotions.value', lang), color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'fear_of_loss', label: t('emotions.fear_of_loss', lang), color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'professionalism', label: t('emotions.professionalism', lang), color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { value: 'integrity', label: t('emotions.integrity', lang), color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  { value: 'success', label: t('emotions.success', lang), color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'social_proof', label: t('emotions.social_proof', lang), color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' }
]

const getStoryObjections = (lang) => [
  { value: 'need_to_think', label: t('objections.need_to_think', lang) },
  { value: 'too_expensive', label: t('objections.too_expensive', lang) },
  { value: 'spouse_decision', label: t('objections.spouse_decision', lang) },
  { value: 'getting_quotes', label: t('objections.getting_quotes', lang) },
  { value: 'bad_timing', label: t('objections.bad_timing', lang) }
]

const getStoryProducts = (lang) => [
  { value: 'cool_life', label: t('products.cool_life', lang) },
  { value: 'turf', label: t('products.turf', lang) },
  { value: 'pavers', label: t('products.pavers', lang) },
  { value: 'concrete', label: t('products.concrete', lang) },
  { value: 'fence', label: t('products.fence', lang) }
]

function StoryBankContent() {
  const { language, dir } = useLanguage()
  const T = (key) => t(key, language)
  
  // Get translated options
  const STORY_EMOTIONS = getStoryEmotions(language)
  const STORY_OBJECTIONS = getStoryObjections(language)
  const STORY_PRODUCTS = getStoryProducts(language)
  
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStory, setSelectedStory] = useState(null)
  
  // Filter state
  const [filterEmotion, setFilterEmotion] = useState('')
  const [filterObjection, setFilterObjection] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadStories()
  }, [])

  const loadStories = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await axios.get(`${API_URL}/api/story-bank`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      setStories(res.data.stories || [])
    } catch (err) {
      console.error('Error loading stories:', err)
    }
    setLoading(false)
  }

  const deleteStory = async (id) => {
    if (!confirm('למחוק את הסיפור?')) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await axios.delete(`${API_URL}/api/story-bank/${id}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      setStories(prev => prev.filter(s => s.id !== id))
      if (selectedStory?.id === id) setSelectedStory(null)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const markStoryUsed = async (id, worked) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await axios.post(`${API_URL}/api/story-bank/${id}/use`, { worked }, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      loadStories()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  // Filter stories
  const filteredStories = stories.filter(story => {
    if (filterEmotion && !story.target_emotions?.includes(filterEmotion)) return false
    if (filterObjection && story.objection_type !== filterObjection) return false
    if (filterProduct && story.product !== filterProduct) return false
    if (searchQuery && !story.content?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !story.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // Group stories by objection type
  const storiesByObjection = filteredStories.reduce((acc, story) => {
    const objection = story.objection_type || 'general'
    if (!acc[objection]) acc[objection] = []
    acc[objection].push(story)
    return acc
  }, {})

  const getEmotionBadge = (emotionValue) => {
    const emotion = STORY_EMOTIONS.find(e => e.value === emotionValue)
    if (!emotion) return null
    return (
      <span key={emotionValue} className={`px-2 py-0.5 rounded text-xs border ${emotion.color}`}>
        {emotion.label}
      </span>
    )
  }

  const getObjectionLabel = (value) => {
    const obj = STORY_OBJECTIONS.find(o => o.value === value)
    return obj ? obj.label : T('storyBank.general')
  }

  return (
    <div className="max-w-5xl mx-auto" dir={dir}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <BookMarked className="w-7 h-7 text-violet-400" />
          {T('storyBank.title')}
        </h1>
        <p className="text-gray-400">
          {T('storyBank.subtitle')}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={T('storyBank.searchPlaceholder')}
            className={`w-full ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500`}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-4">
          {/* By Objection */}
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs text-gray-500 mb-2">{T('storyBank.byObjection')}</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterObjection('')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                  filterObjection === '' ? 'bg-violet-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {T('common.all')}
              </button>
              {STORY_OBJECTIONS.map(obj => (
                <button
                  key={obj.value}
                  onClick={() => setFilterObjection(filterObjection === obj.value ? '' : obj.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    filterObjection === obj.value ? 'bg-violet-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {obj.label}
                </button>
              ))}
            </div>
          </div>

          {/* By Product */}
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs text-gray-500 mb-2">{T('storyBank.byProduct')}</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterProduct('')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                  filterProduct === '' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {T('common.all')}
              </button>
              {STORY_PRODUCTS.map(prod => (
                <button
                  key={prod.value}
                  onClick={() => setFilterProduct(filterProduct === prod.value ? '' : prod.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    filterProduct === prod.value ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {prod.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <span className="text-sm text-gray-400">
            {filteredStories.length} {T('storyBank.stories')} {filteredStories.length !== stories.length && `(${T('common.of')} ${stories.length})`}
          </span>
          {(filterEmotion || filterObjection || filterProduct || searchQuery) && (
            <button
              onClick={() => { setFilterEmotion(''); setFilterObjection(''); setFilterProduct(''); setSearchQuery(''); }}
              className="text-xs text-violet-400 hover:text-violet-300"
            >
              {T('common.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : selectedStory ? (
        /* Story Detail View */
        <div className="space-y-6">
          <button onClick={() => setSelectedStory(null)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
            <ChevronRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} /> {T('storyBank.backToList')}
          </button>
          
          <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">{selectedStory.title || T('analysis.stories')}</h2>
                <div className="flex flex-wrap gap-2">
                  {selectedStory.objection_type && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs">
                      {T('storyBank.against')}: {getObjectionLabel(selectedStory.objection_type)}
                    </span>
                  )}
                  {selectedStory.target_emotions?.map(e => getEmotionBadge(e))}
                </div>
              </div>
              <button onClick={() => deleteStory(selectedStory.id)} className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>

            {selectedStory.setup_line && (
              <div className="bg-amber-500/10 rounded-xl border border-amber-500/20 p-4">
                <p className="text-xs text-amber-400 mb-1">🎯 {T('analysis.setupLine')}</p>
                <p className="text-white">{selectedStory.setup_line}</p>
              </div>
            )}

            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{selectedStory.content}</p>
            </div>

            {selectedStory.closing_bridge && (
              <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/20 p-4">
                <p className="text-xs text-emerald-400 mb-1">🌉 {T('analysis.closingBridge')}</p>
                <p className="text-white">{selectedStory.closing_bridge}</p>
              </div>
            )}

            {selectedStory.explanation && (
              <div className="bg-blue-500/10 rounded-xl border border-blue-500/20 p-4">
                <p className="text-xs text-blue-400 mb-1">💡 {T('storyBank.whyItWorks')}</p>
                <p className="text-gray-300 text-sm">{selectedStory.explanation}</p>
              </div>
            )}

            {/* Usage Tracking */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="text-sm text-gray-500">
                {T('storyBank.usageCount')}: {selectedStory.used_count || 0}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => markStoryUsed(selectedStory.id, true)}
                  className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm flex items-center gap-2"
                >
                  <ThumbsUp className="w-4 h-4" /> {T('storyBank.worked')}
                </button>
                <button
                  onClick={() => markStoryUsed(selectedStory.id, false)}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm flex items-center gap-2"
                >
                  <ThumbsDown className="w-4 h-4" /> {T('storyBank.didntWork')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : filteredStories.length > 0 ? (
        /* Stories List Grouped by Objection */
        <div className="space-y-8">
          {Object.entries(storiesByObjection).map(([objectionType, objStories]) => (
            <div key={objectionType}>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                {getObjectionLabel(objectionType)}
                <span className="text-sm font-normal text-gray-500">({objStories.length})</span>
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {objStories.map(story => (
                  <div
                    key={story.id}
                    onClick={() => setSelectedStory(story)}
                    className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-xl border border-white/10 hover:border-violet-500/50 p-4 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-white group-hover:text-violet-400 transition-colors line-clamp-1">
                        {story.title || T('analysis.stories')}
                      </h4>
                      {story.used_count > 0 && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> {story.used_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">{story.content}</p>
                    <div className="flex flex-wrap gap-1">
                      {story.target_emotions?.slice(0, 3).map(e => getEmotionBadge(e))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16">
          <BookMarked className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {stories.length === 0 ? T('storyBank.noStoriesYet') : T('storyBank.noStoriesMatch')}
          </h3>
          <p className="text-gray-500 mb-6">
            {stories.length === 0 
              ? T('storyBank.analyzeCallTip')
              : T('storyBank.tryChangingFilters')
            }
          </p>
          {stories.length === 0 && (
            <p className="text-sm text-violet-400">
              💡 {T('storyBank.tip')}: {T('storyBank.goToAnalysis')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function MainApp() {
  const { user, signOut } = useAuth()
  const { language, dir } = useLanguage()
  const T = (key) => t(key, language)
  
  // Get translated items
  const stages = getStages(language)
  const navItems = getNavItems(language)
  
  // Navigation state
  const [activeTab, setActiveTab] = useState('upload')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRole, setUserRole] = useState('user')
  
  // Dashboard state
  const [dashboardStats, setDashboardStats] = useState(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  
  // Calls history state
  const [callsList, setCallsList] = useState([])
  const [callsLoading, setCallsLoading] = useState(false)
  const [selectedCall, setSelectedCall] = useState(null)
  
  // Upload state
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [jobId, setJobId] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStage, setAnalysisStage] = useState('')
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [selectedText, setSelectedText] = useState('')
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [renaming, setRenaming] = useState(false)
  const timerRef = useRef(null)
  const pollRef = useRef(null)
  const audioRef = useRef(null)

  // Seek audio to specific timestamp (in milliseconds)
  const seekToTime = (timeMs) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timeMs / 1000
      if (!audioPlaying) {
        audioRef.current.play()
        setAudioPlaying(true)
      }
    }
  }

  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setAudioPlaying(!audioPlaying)
    }
  }

  // Stop main audio (used when TTS plays)
  const stopMainAudio = () => {
    if (audioRef.current && audioPlaying) {
      audioRef.current.pause()
      setAudioPlaying(false)
    }
  }

  // Completely stop and reset main audio
  const stopAndResetMainAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setAudioPlaying(false)
      setAudioCurrentTime(0)
    }
  }

  const formatAudioTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Rename call functions
  const openRenameModal = () => {
    setRenameValue(result?.file_name || '')
    setShowRenameModal(true)
  }

  const handleRename = async () => {
    if (!renameValue.trim() || !result?.call_id) return
    setRenaming(true)
    try {
      const headers = await getAuthHeaders()
      const response = await axios.post(
        `${API_URL}/api/calls/${result.call_id}/rename`,
        { name: renameValue.trim() },
        { headers }
      )
      if (response.data.success) {
        setResult(prev => ({ ...prev, file_name: renameValue.trim() }))
        setShowRenameModal(false)
        fetchCalls() // Refresh calls list
      }
    } catch (err) {
      console.error('Error renaming call:', err)
    }
    setRenaming(false)
  }

  const handleAutoGenerateName = async () => {
    if (!result?.call_id) return
    setRenaming(true)
    try {
      const headers = await getAuthHeaders()
      const response = await axios.post(
        `${API_URL}/api/calls/${result.call_id}/generate-name`,
        {},
        { headers }
      )
      if (response.data.success) {
        setResult(prev => ({ ...prev, file_name: response.data.name }))
        fetchCalls() // Refresh calls list
      }
    } catch (err) {
      console.error('Error auto-generating name:', err)
    }
    setRenaming(false)
  }

  // Check if user is admin on mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const headers = await getAuthHeaders()
        const response = await axios.get(`${API_URL}/api/admin/check`, { headers })
        setIsAdmin(response.data.is_admin)
        setUserRole(response.data.role || 'user')
      } catch (err) {
        console.error('Error checking admin status:', err)
        setIsAdmin(false)
      }
    }
    checkAdminStatus()
  }, [user])

  // Fetch calls on mount and when tab changes
  useEffect(() => {
    // Always fetch calls on mount for sidebar
    fetchCalls()
  }, [])

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard()
    } else if (activeTab === 'calls') {
      fetchCalls()
    }
  }, [activeTab])

  const fetchDashboard = async () => {
    setDashboardLoading(true)
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get(`${API_URL}/api/dashboard`, { headers })
      setDashboardStats(response.data)
    } catch (err) {
      console.error('Error fetching dashboard:', err)
    }
    setDashboardLoading(false)
  }

  const fetchCalls = async () => {
    setCallsLoading(true)
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get(`${API_URL}/api/calls`, { headers })
      setCallsList(response.data)
    } catch (err) {
      console.error('Error fetching calls:', err)
    }
    setCallsLoading(false)
  }

  const viewCall = async (callId) => {
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get(`${API_URL}/api/calls/${callId}`, { headers })
      setSelectedCall(response.data)
      
      // Map database fields to UI expected format
      const callData = response.data.call
      const mappedResult = {
        ...callData,
        audio_duration: callData.duration_seconds || 0,
        utterances: callData.utterances || [],
        speaker_roles: callData.speaker_roles || {},
        speakers_count: callData.speakers_count || 0,
        word_count: callData.word_count || 0,
        transcription: callData.transcription || '',
        call_id: callData.id
      }
      setResult(mappedResult)
      setJobId(callData.id) // Set jobId for potential re-analysis
      
      if (response.data.analysis) {
        // Merge call transcription into analysis for components that need it
        const fullTranscript = callData.transcription || ''
        const utterances = callData.utterances || []
        
        // Build formatted transcript from utterances if available
        let formattedTranscript = fullTranscript
        if (utterances.length > 0 && callData.speaker_roles) {
          formattedTranscript = utterances.map(u => {
            const role = callData.speaker_roles[u.speaker] || u.speaker
            return `${role}: ${u.text}`
          }).join('\n')
        }
        
        setAnalysisResult({ 
          metrics: response.data.analysis.metrics || {}, 
          analysis: {
            ...response.data.analysis.analysis,
            // Include transcript data for components that need it
            full_transcript: formattedTranscript,
            transcript: formattedTranscript
          },
          // Include full analysis data for practice tab
          full_analysis: {
            ...response.data.analysis.analysis,
            full_transcript: formattedTranscript
          }
        })
        setShowAnalysis(true)
      } else {
        setShowAnalysis(false)
        setAnalysisResult(null)
      }
      setActiveTab('upload')
    } catch (err) {
      console.error('Error fetching call:', err)
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const startTimer = () => {
    setElapsedTime(0)
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setResult(null)
      setProgress(0)
      setStage('')
    }
  }

  const pollStatus = async (jobId) => {
    try {
      const response = await axios.get(`${API_URL}/api/status/${jobId}`)
      const data = response.data

      setProgress(data.progress)
      setStage(data.stage)

      if (data.status === 'completed') {
        clearInterval(pollRef.current)
        stopTimer()
        setResult(data.result)
        setLoading(false)
      } else if (data.status === 'error') {
        clearInterval(pollRef.current)
        stopTimer()
        setError(data.error)
        setLoading(false)
      }
    } catch (err) {
      console.error('Polling error:', err)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an audio file')
      return
    }

    const formData = new FormData()
    formData.append('audio', file)

    setLoading(true)
    setError(null)
    setResult(null)
    setProgress(5)
    setStage('Uploading file...')
    startTimer()

    try {
      const headers = await getAuthHeaders()
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', ...headers },
      })

      const newJobId = response.data.job_id
      setJobId(newJobId)
      pollRef.current = setInterval(() => pollStatus(newJobId), 1000)

    } catch (err) {
      stopTimer()
      setError(err.response?.data?.error || 'Failed to process audio file')
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    const analyzeId = result?.call_id || jobId
    if (!analyzeId) return
    
    setAnalyzing(true)
    setAnalysisResult(null)
    setAnalysisProgress(0)
    setAnalysisStage('Starting analysis...')
    startTimer()

    try {
      const headers = await getAuthHeaders()
      const response = await axios.post(`${API_URL}/api/analyze/${analyzeId}`, {}, { headers })
      const analysisId = response.data.analysis_id
      
      const pollAnalysis = setInterval(async () => {
        try {
          const statusRes = await axios.get(`${API_URL}/api/status/${analysisId}`)
          const data = statusRes.data
          
          setAnalysisProgress(data.progress)
          setAnalysisStage(data.stage)
          
          if (data.status === 'completed') {
            clearInterval(pollAnalysis)
            stopTimer()
            setAnalysisResult(data.result)
            setAnalyzing(false)
            setShowAnalysis(true)
          } else if (data.status === 'error') {
            clearInterval(pollAnalysis)
            stopTimer()
            setError(data.error)
            setAnalyzing(false)
          }
        } catch (err) {
          console.error('Analysis polling error:', err)
        }
      }, 1000)
      
    } catch (err) {
      stopTimer()
      setError(err.response?.data?.error || 'Failed to start analysis')
      setAnalyzing(false)
    }
  }

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatElapsed = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}m ${secs}s`
  }

  const getRoleBadgeColor = (role) => {
    if (role === 'Seller') return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
    if (role === 'Buyer') return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
    return 'bg-gray-200 text-gray-700'
  }

  const getRoleBgColor = (role) => {
    if (role === 'Seller') return 'bg-blue-50 border-l-4 border-blue-500'
    if (role === 'Buyer') return 'bg-emerald-50 border-l-4 border-emerald-500'
    return 'bg-gray-50 border-l-4 border-gray-300'
  }

  const getCurrentStageIndex = () => {
    if (progress >= 100) return 5
    if (progress >= 85) return 4
    if (progress >= 75) return 3
    if (progress >= 30) return 2
    if (progress >= 20) return 1
    return 0
  }

  // Render Dashboard View
  const renderDashboard = () => (
    <div className="space-y-6" dir={dir}>
      <h2 className="text-2xl font-bold text-white">{T('dashboard.title')}</h2>
      
      {dashboardLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : dashboardStats ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-5 h-5 text-violet-400" />
                <span className="text-gray-500 text-sm">{T('dashboard.totalCalls')}</span>
              </div>
              <p className="text-4xl font-bold text-white">{dashboardStats.total_calls || 0}</p>
            </div>
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-gray-500 text-sm">{T('dashboard.avgDuration')}</span>
              </div>
              <p className="text-4xl font-bold text-white">{formatDuration(dashboardStats.avg_duration_seconds || 0)}</p>
            </div>
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <span className="text-gray-500 text-sm">{T('dashboard.avgScore')}</span>
              </div>
              <p className="text-4xl font-bold text-white">{dashboardStats.avg_overall_score || 0}<span className="text-lg text-gray-500">/100</span></p>
            </div>
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Volume2 className="w-5 h-5 text-fuchsia-400" />
                <span className="text-gray-500 text-sm">{T('dashboard.talkRatio')}</span>
              </div>
              <p className="text-4xl font-bold text-white">{dashboardStats.avg_seller_talk_pct || 50}<span className="text-lg text-gray-500">%</span></p>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Objections */}
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                {T('dashboard.topObjections')}
              </h3>
              {Object.keys(dashboardStats.objection_counts || {}).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(dashboardStats.objection_counts).slice(0, 5).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-gray-300 capitalize">{type}</span>
                      <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">{T('dashboard.noObjectionsYet')}</p>
              )}
            </div>

            {/* Areas to Improve */}
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                {T('dashboard.areasToImprove')}
              </h3>
              {(dashboardStats.improvement_areas || []).length > 0 ? (
                <ul className="space-y-2">
                  {dashboardStats.improvement_areas.map(([area, count], i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300">
                      <ChevronRight className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                      {area}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">{T('dashboard.analyzeMoreCalls')}</p>
              )}
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-400" />
              {T('dashboard.dealRiskDistribution')}
            </h3>
            <div className="flex gap-4">
              <div className="flex-1 text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <p className="text-3xl font-bold text-emerald-400">{dashboardStats.risk_distribution?.low || 0}</p>
                <p className="text-sm text-gray-500">{T('dashboard.lowRisk')}</p>
              </div>
              <div className="flex-1 text-center p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                <p className="text-3xl font-bold text-yellow-400">{dashboardStats.risk_distribution?.medium || 0}</p>
                <p className="text-sm text-gray-500">{T('dashboard.mediumRisk')}</p>
              </div>
              <div className="flex-1 text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <p className="text-3xl font-bold text-red-400">{dashboardStats.risk_distribution?.high || 0}</p>
                <p className="text-sm text-gray-500">{T('dashboard.highRisk')}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-500">{T('dashboard.noDataAvailable')}</p>
        </div>
      )}
    </div>
  )

  // Render Calls History View
  const renderCallsHistory = () => (
    <div className="space-y-4 sm:space-y-6" dir={dir}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-white">{T('calls.callHistory')}</h2>
        <button
          onClick={() => setActiveTab('upload')}
          className="px-3 sm:px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium flex items-center gap-2 text-sm sm:text-base active:scale-95 transition-all flex-shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden xs:inline">{T('nav.newCall')}</span>
          <span className="xs:hidden">{T('common.upload')}</span>
        </button>
      </div>

      {callsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : callsList.length > 0 ? (
        <div className="space-y-3">
          {callsList.map((call) => (
            <div
              key={call.id}
              onClick={() => viewCall(call.id)}
              className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10 cursor-pointer hover:border-violet-500/50 transition-colors active:scale-[0.99]"
            >
              {/* Mobile: Stack layout, Desktop: Row layout */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Left side: Icon + Info */}
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start sm:items-center justify-between gap-2">
                      <h3 className="text-white font-semibold text-sm sm:text-base truncate">{call.file_name}</h3>
                      {/* Status badge - Mobile: next to title */}
                      <span className={`sm:hidden px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                        call.status === 'analyzed' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {call.status === 'analyzed' ? T('calls.analyzed') : T('calls.notAnalyzed')}
                      </span>
                    </div>
                    {/* Metadata - wraps on mobile */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(call.duration_seconds || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {call.speakers_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(call.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Right side: Status badge + Arrow - Desktop only */}
                <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    call.status === 'analyzed' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {call.status === 'analyzed' ? T('calls.analyzed') : T('calls.notAnalyzed')}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10">
          <Phone className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">{T('calls.noCallsYet')}</p>
          <button
            onClick={() => setActiveTab('upload')}
            className="mt-4 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium"
          >
            {T('calls.uploadFirstCall')}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Floating Audio Control - Shows when main audio is playing */}
      <FloatingAudioControl
        isPlaying={audioPlaying}
        currentTime={audioCurrentTime}
        duration={audioDuration}
        onStop={stopAndResetMainAudio}
        onTogglePlay={toggleAudioPlayback}
        label={result?.file_name || "Call Audio"}
      />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-64
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-black/95 lg:bg-black/40 border-r border-white/10 flex flex-col transition-all duration-300
      `}>
        {/* Logo + Mobile Close */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">SalesAI</h1>
                <p className="text-xs text-gray-500">Conversation Intelligence</p>
              </div>
            </div>
            {/* Mobile close button at top */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              // Special handling for route-based navigation (AI Agent)
              if (item.isRoute) {
                return (
                  <li key={item.id}>
                    <a
                      href={`/${item.id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-violet-400 border border-violet-500/30 hover:from-violet-500/30 hover:to-fuchsia-500/30"
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                      {item.highlight && (
                        <span className="ml-auto px-2 py-0.5 bg-violet-500/30 text-violet-300 text-xs rounded-full">NEW</span>
                      )}
                    </a>
                  </li>
                )
              }
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Recent Calls Section */}
          {callsList.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between px-4 mb-2">
                <p className="text-xs text-gray-600 uppercase tracking-wider">Recent Calls</p>
                <button
                  onClick={() => {
                    setActiveTab('calls')
                    setMobileMenuOpen(false)
                  }}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  View All
                </button>
              </div>
              <ul className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                {callsList.slice(0, 5).map((call) => (
                  <li key={call.id}>
                    <button
                      onClick={() => {
                        viewCall(call.id)
                        setMobileMenuOpen(false)
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left ${
                        selectedCall?.call?.id === call.id
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        call.status === 'analyzed' ? 'bg-emerald-400' : 'bg-yellow-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{call.file_name}</p>
                        <p className="text-[10px] text-gray-600">
                          {new Date(call.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Admin Section */}
          {isAdmin && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="px-4 text-xs text-gray-600 uppercase tracking-wider mb-2">Admin</p>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-400 hover:text-white hover:bg-white/5"
                  >
                    <Shield className="w-5 h-5 flex-shrink-0 text-violet-400" />
                    <span className="font-medium">Admin Panel</span>
                  </a>
                </li>
              </ul>
            </div>
          )}
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {user && (
            <div className="px-4 py-2 text-xs text-gray-500 truncate">
              {user.email}
            </div>
          )}
          <button
            onClick={() => {
              signOut()
              setMobileMenuOpen(false)
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
            <span className="text-sm">Close Menu</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-30">
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 text-gray-400 hover:text-white lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-semibold text-white capitalize">
                {navItems.find(n => n.id === activeTab)?.label || 'SalesAI'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle compact />
              <span className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full text-xs font-medium">Beta</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'calls' && renderCallsHistory()}
          {activeTab === 'settings' && (
            <div className="text-center py-20">
              <Settings className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">{T('nav.settings')} - Coming soon</p>
            </div>
          )}
          {activeTab === 'story-bank' && (
            <StoryBankContent />
          )}
          {activeTab === 'upload' && (
            <>
              {!loading && !result && (
                <>
              {/* Hero Section */}
              <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-4 sm:mb-6">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-xs sm:text-sm text-violet-300">Powered by GPT-5.2 & AssemblyAI</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Analyze Your Sales Calls
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                    Like Never Before
                  </span>
                </h2>
                <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto px-4">
                  AI-powered transcription with automatic speaker identification and role classification
                </p>
              </div>

              {/* Upload Card */}
              <div className="max-w-2xl mx-auto mb-8 sm:mb-16">
                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-white/10 shadow-2xl">
                  <label className="block cursor-pointer group">
                    <div className="relative border-2 border-dashed border-white/20 rounded-2xl p-6 sm:p-12 text-center hover:border-violet-500/50 hover:bg-violet-500/5 transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-fuchsia-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/25">
                          <Upload className="w-10 h-10 text-white" />
                        </div>
                        <p className="text-lg text-white mb-2">
                          <span className="hidden sm:inline">Drop your audio file here or </span>
                          <span className="text-violet-400 font-semibold">
                            <span className="sm:hidden">Tap to select audio file</span>
                            <span className="hidden sm:inline">browse</span>
                          </span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Supports MP3, WAV, M4A, and more
                        </p>
                        {/* Mobile-friendly button */}
                        <div className="sm:hidden mt-4">
                          <span className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500/20 border border-violet-500/30 rounded-xl text-violet-300 font-medium">
                            <Upload className="w-5 h-5" />
                            Choose File
                          </span>
                        </div>
                        {file && (
                          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-300 font-medium">{file.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="audio/*,audio/mpeg,audio/mp3,audio/wav,audio/m4a,audio/aac,audio/ogg,audio/webm,.mp3,.wav,.m4a,.aac,.ogg,.webm,.flac,.wma"
                      onChange={handleFileChange} 
                    />
                  </label>

                  <button
                    onClick={handleUpload}
                    disabled={!file}
                    className="w-full mt-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-violet-500 hover:to-fuchsia-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 flex items-center justify-center gap-3"
                  >
                    <Zap className="w-5 h-5" />
                    Analyze Call
                  </button>

                  {error && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                </div>
              </div>

              {/* Features Grid */}
              <div className="mb-8 sm:mb-16">
                <div className="text-center mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Coming Soon</h3>
                  <p className="text-sm sm:text-base text-gray-500">Advanced features in development</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {upcomingFeatures.map((feature, index) => {
                    const Icon = feature.icon
                    return (
                      <div
                        key={index}
                        className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] hover:border-violet-500/30 transition-all duration-300 group"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:from-violet-500/30 group-hover:to-fuchsia-500/30 transition-colors">
                          <Icon className="w-6 h-6 text-violet-400" />
                        </div>
                        <h4 className="text-white font-semibold mb-1">{feature.title}</h4>
                        <p className="text-sm text-gray-500">{feature.description}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-gray-600">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span className="text-xs sm:text-sm">Enterprise Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span className="text-xs sm:text-sm">Real-time Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span className="text-xs sm:text-sm">GPT-5.2 Powered</span>
                </div>
              </div>
            </>
          )}

          {loading && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl sm:rounded-3xl p-4 sm:p-10 border border-white/10 shadow-2xl">
                {/* Timer */}
                <div className="text-center mb-6 sm:mb-10">
                  <div className="inline-flex items-center gap-4 px-8 py-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl mb-6">
                    <div className="w-12 h-12 bg-violet-500/20 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-violet-400 animate-pulse" />
                    </div>
                    <span className="text-4xl font-mono font-bold text-white tracking-wider">
                      {formatElapsed(elapsedTime)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">{stage}</h2>
                  <p className="text-gray-500">Analyzing your sales conversation...</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-10">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-400">Processing</span>
                    <span className="text-violet-400 font-semibold">{progress}%</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-500 ease-out relative"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                </div>

                {/* Stage Indicators */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
                  {stages.map((s, index) => {
                    const currentIndex = getCurrentStageIndex()
                    const isActive = index === currentIndex
                    const isCompleted = index < currentIndex
                    const Icon = s.icon

                    return (
                      <div
                        key={s.key}
                        className={`flex flex-col items-center p-2 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 ${
                          isActive
                            ? 'bg-violet-500/20 border border-violet-500/30 scale-105'
                            : isCompleted
                            ? 'bg-emerald-500/10 border border-emerald-500/20'
                            : 'bg-white/[0.02] border border-white/5'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 ${
                            isActive
                              ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30'
                              : isCompleted
                              ? 'bg-emerald-500'
                              : 'bg-white/5'
                          }`}
                        >
                          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive || isCompleted ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <span className={`text-[10px] sm:text-xs text-center font-medium ${isActive ? 'text-violet-300' : isCompleted ? 'text-emerald-400' : 'text-gray-600'}`}>
                          {s.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Analyzing State */}
          {analyzing && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-3xl p-10 border border-white/10 shadow-2xl">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-4 px-8 py-4 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-2xl mb-6">
                    <div className="w-12 h-12 bg-fuchsia-500/20 rounded-full flex items-center justify-center">
                      <Brain className="w-6 h-6 text-fuchsia-400 animate-pulse" />
                    </div>
                    <span className="text-4xl font-mono font-bold text-white tracking-wider">
                      {formatElapsed(elapsedTime)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">{analysisStage}</h2>
                  <p className="text-gray-500">AI Sales Coach is analyzing your conversation...</p>
                </div>
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-400">Deep Analysis</span>
                    <span className="text-fuchsia-400 font-semibold">{analysisProgress}%</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-500 rounded-full transition-all duration-500 ease-out relative"
                      style={{ width: `${analysisProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {result && !analyzing && !showAnalysis && (
            <div className="space-y-6">
              {/* Call Name Header (for saved calls) */}
              {selectedCall && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-2">
                  <button
                    onClick={() => {
                      setSelectedCall(null)
                      setResult(null)
                      setActiveTab('calls')
                    }}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl transition-colors font-medium flex items-center gap-2 active:scale-95"
                  >
                    ← Back to History
                  </button>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h1 className="text-lg sm:text-xl font-bold text-white truncate">{result.file_name}</h1>
                    <button
                      onClick={openRenameModal}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                      title="Rename"
                    >
                      <Edit3 className="w-4 h-4 text-gray-400 hover:text-white" />
                    </button>
                    <button
                      onClick={handleAutoGenerateName}
                      disabled={renaming}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
                      title="Auto-generate name from analysis"
                    >
                      <Sparkles className="w-4 h-4 text-violet-400 hover:text-violet-300" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Stats Header */}
              <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    {selectedCall ? 'Call Details' : 'Transcription Complete'}
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                      onClick={handleAnalyze}
                      className="w-full sm:w-auto px-5 sm:px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white rounded-xl transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-500/20 active:scale-95"
                    >
                      <Brain className="w-5 h-5" />
                      Analyze Call
                    </button>
                    <button
                      onClick={() => {
                        setResult(null)
                        setFile(null)
                        setProgress(0)
                        setElapsedTime(0)
                        setJobId(null)
                        setAnalysisResult(null)
                        setShowAnalysis(false)
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Upload className="w-4 h-4" />
                      New Upload
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6">
                  <div className="bg-white/[0.03] rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/5">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                      <span className="text-gray-500 text-xs sm:text-sm">Speakers</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{result.speakers_count}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/5">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                      <span className="text-gray-500 text-xs sm:text-sm">Segments</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{result.utterances.length}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/5">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-400" />
                      <span className="text-gray-500 text-xs sm:text-sm">Duration</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{result.audio_duration > 0 ? formatDuration(result.audio_duration) : '--'}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/5">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                      <span className="text-gray-500 text-xs sm:text-sm">Words</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{result.word_count || '--'}</p>
                  </div>
                </div>

                {/* Speaker Roles */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {Object.entries(result.speaker_roles).map(([speaker, role]) => (
                    <div
                      key={speaker}
                      className={`px-3 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold flex items-center gap-2 sm:gap-3 ${
                        role === 'Seller' 
                          ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 text-blue-300' 
                          : role === 'Buyer'
                          ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 text-emerald-300'
                          : 'bg-gray-500/20 border border-gray-500/30 text-gray-300'
                      }`}
                    >
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        role === 'Seller' ? 'bg-blue-500' : role === 'Buyer' ? 'bg-emerald-500' : 'bg-gray-500'
                      }`}>
                        <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs opacity-70">Speaker {speaker}</p>
                        <p className="font-bold text-sm sm:text-base">{role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audio Player */}
              {result.audio_url && (
                <div className="bg-gradient-to-b from-violet-500/10 to-white/[0.02] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-violet-500/20">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4">
                    <button
                      onClick={toggleAudioPlayback}
                      className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/30 hover:scale-105 transition-transform flex-shrink-0"
                    >
                      {audioPlaying ? (
                        <PauseCircle className="w-8 h-8 text-white" />
                      ) : (
                        <PlayCircle className="w-8 h-8 text-white" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold">Call Recording</span>
                        <span className="text-gray-400 text-sm font-mono">
                          {formatAudioTime(audioCurrentTime)} / {formatAudioTime(audioDuration)}
                        </span>
                      </div>
                      <div 
                        className="h-2 bg-white/10 rounded-full cursor-pointer overflow-hidden"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          const percent = (e.clientX - rect.left) / rect.width
                          if (audioRef.current) {
                            audioRef.current.currentTime = percent * audioDuration
                          }
                        }}
                      >
                        <div 
                          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
                          style={{ width: `${audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <audio
                    ref={audioRef}
                    src={result.audio_url}
                    onTimeUpdate={(e) => setAudioCurrentTime(e.target.currentTime)}
                    onLoadedMetadata={(e) => setAudioDuration(e.target.duration)}
                    onEnded={() => setAudioPlaying(false)}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-2">💡 Click on any transcript segment or timeline event to jump to that moment</p>
                </div>
              )}

              {/* Transcription */}
              <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-3">
                  <Mic className="w-5 h-5 text-violet-400" />
                  Full Transcription
                </h3>
                <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[600px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                  {result.utterances.map((utterance, index) => {
                    const role = result.speaker_roles[utterance.speaker] || 'Unknown'
                    const isSeller = role === 'Seller'
                    return (
                      <div
                        key={index}
                        onClick={() => result.audio_url && seekToTime(utterance.start)}
                        className={`flex gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-200 hover:scale-[1.005] ${
                          result.audio_url ? 'cursor-pointer' : ''
                        } ${
                          isSeller 
                            ? 'bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/30 hover:bg-blue-500/10' 
                            : 'bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-500/10'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isSeller ? 'bg-blue-500' : 'bg-emerald-500'
                          }`}>
                            <span className="text-white font-bold text-sm">{utterance.speaker}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`text-sm font-semibold ${isSeller ? 'text-blue-400' : 'text-emerald-400'}`}>
                              {role}
                            </span>
                            <button 
                              className={`text-xs font-mono px-2 py-0.5 rounded ${result.audio_url ? 'bg-white/10 hover:bg-white/20 text-violet-400' : 'text-gray-600'}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (result.audio_url) seekToTime(utterance.start)
                              }}
                            >
                              {formatTime(utterance.start)}
                            </button>
                          </div>
                          <p className="text-gray-300 leading-relaxed">{utterance.text}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Analysis Results View */}
          {showAnalysis && analysisResult && (
            <div className="space-y-6">
              {/* Back to History (for saved calls) */}
              {selectedCall && (
                <div className="flex items-center gap-4 mb-2">
                  <button
                    onClick={() => {
                      setSelectedCall(null)
                      setResult(null)
                      setShowAnalysis(false)
                      setAnalysisResult(null)
                      setActiveTab('calls')
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl transition-colors font-medium flex items-center gap-2"
                  >
                    ← Back to History
                  </button>
                  <h1 className="text-xl font-bold text-white">{result?.file_name}</h1>
                </div>
              )}
              
              {/* Premium Header with Key Metrics Dashboard */}
              <div className="bg-gradient-to-br from-violet-900/40 via-fuchsia-900/30 to-cyan-900/20 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-violet-500/20 shadow-2xl shadow-violet-500/10">
                {/* Top Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                      <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white">Sales Analysis Report</h2>
                      <p className="text-xs sm:text-sm text-gray-400">{result?.file_name || 'Call Analysis'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setShowAnalysis(false)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-all text-sm border border-white/10"
                    >
                      ← Back
                    </button>
                    <PDFDownloadButton analysisResult={analysisResult} fileName={result?.file_name} />
                    <button
                      onClick={() => {
                        setResult(null)
                        setFile(null)
                        setJobId(null)
                        setAnalysisResult(null)
                        setShowAnalysis(false)
                      }}
                      className="px-3 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-xl transition-all text-sm border border-violet-500/30"
                    >
                      <Upload className="w-4 h-4 inline mr-1" />
                      New
                    </button>
                  </div>
                </div>

                {/* Key Metrics Dashboard - Clean Design */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {/* Overall Score */}
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Performance</div>
                    <div className="text-3xl font-bold text-indigo-400">
                      {analysisResult.analysis?.seller_performance?.overall_score || 0}
                    </div>
                  </div>
                  
                  {/* Buying Readiness */}
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Buying Ready</div>
                    <div className="text-3xl font-bold text-indigo-400">
                      {analysisResult.analysis?.customer_interest?.buying_readiness || 0}%
                    </div>
                  </div>
                  
                  {/* Objections Count */}
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Objections</div>
                    <div className="text-3xl font-bold text-indigo-400">
                      {analysisResult.analysis?.objections?.length || 0}
                    </div>
                  </div>
                  
                  {/* Risk Level */}
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Risk Level</div>
                    <div className={`text-xl font-bold ${
                      analysisResult.analysis?.deal_risk_score?.risk_level === 'low' ? 'text-emerald-400' :
                      analysisResult.analysis?.deal_risk_score?.risk_level === 'medium' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {(analysisResult.analysis?.deal_risk_score?.risk_level || 'N/A').toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Call Outcome - Clean */}
                {analysisResult.analysis?.call_summary && (
                  <div className="mt-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                    <div className="flex items-start gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        analysisResult.analysis.call_summary.outcome === 'positive' ? 'bg-emerald-500/20 text-emerald-400' :
                        analysisResult.analysis.call_summary.outcome === 'neutral' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {analysisResult.analysis.call_summary.outcome?.toUpperCase()}
                      </span>
                      <p className="text-sm text-slate-300 flex-1">{analysisResult.analysis.call_summary.one_liner}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Audio Player - Clean Design */}
              {result?.audio_url && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={toggleAudioPlayback}
                      className="w-12 h-12 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      {audioPlaying ? (
                        <PauseCircle className="w-6 h-6 text-white" />
                      ) : (
                        <PlayCircle className="w-6 h-6 text-white" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-200 font-medium text-sm">Call Recording</span>
                        <span className="text-slate-400 text-xs font-mono">
                          {formatAudioTime(audioCurrentTime)} / {formatAudioTime(audioDuration)}
                        </span>
                      </div>
                      <div 
                        className="h-1.5 bg-slate-700 rounded-full cursor-pointer overflow-hidden"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          const percent = (e.clientX - rect.left) / rect.width
                          if (audioRef.current) {
                            audioRef.current.currentTime = percent * audioDuration
                          }
                        }}
                      >
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <audio
                    ref={audioRef}
                    src={result.audio_url}
                    onTimeUpdate={(e) => setAudioCurrentTime(e.target.currentTime)}
                    onLoadedMetadata={(e) => setAudioDuration(e.target.duration)}
                    onEnded={() => setAudioPlaying(false)}
                    className="hidden"
                  />
                </div>
              )}

              {/* Analysis Insights Section - All content organized in tabs */}
              <AnalysisInsights
                analysisResult={analysisResult}
                result={result}
                onSeek={seekToTime}
                onStopMainAudio={stopAndResetMainAudio}
              />
            </div>
          )}
            </>
          )}
        </div>
      </main>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139,92,246,0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139,92,246,0.5);
        }
      `}</style>

      {/* AI Sales Coach Assistant - Only show when we have analysis */}
      {showAnalysis && analysisResult && (
        <AIAssistant 
          analysisResult={analysisResult}
          result={result}
          selectedText={selectedText}
          onClearSelection={() => setSelectedText('')}
        />
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-6 w-full max-w-md border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">{T('calls.renameCall')}</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder={T('calls.callName')}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRenameModal(false)}
                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl transition-colors"
              >
                {T('common.cancel')}
              </button>
              <button
                onClick={handleRename}
                disabled={renaming || !renameValue.trim()}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                {renaming ? T('common.saving') : T('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/app" element={
        <ProtectedRoute>
          <MainApp />
        </ProtectedRoute>
      } />
      <Route path="/app/*" element={
        <ProtectedRoute>
          <MainApp />
        </ProtectedRoute>
      } />
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/calls" element={
        <ProtectedRoute>
          <AdminCallsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/calls/:callId" element={
        <ProtectedRoute>
          <AdminCallView />
        </ProtectedRoute>
      } />
      {/* Live Call Route - Now uses AIAgentPage with new UI */}
      <Route path="/live" element={
        <ProtectedRoute>
          <AIAgentPage />
        </ProtectedRoute>
      } />
      {/* AI Agent Route (alias) */}
      <Route path="/ai-agent" element={
        <ProtectedRoute>
          <AIAgentPage />
        </ProtectedRoute>
      } />
            <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
