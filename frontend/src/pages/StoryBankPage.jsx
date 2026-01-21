import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  BookMarked, Plus, Wand2, Save, X, Heart, Trash2, ChevronLeft, 
  Sparkles, Volume2, Play, Pause, Edit3, Copy, Check, Filter,
  MessageSquare, Target, Zap, Clock, Star, TrendingUp, RefreshCw,
  ChevronRight, Search, Tag, ArrowRight, Lightbulb, PenTool,
  Mic, Square, StopCircle, FileText, Loader2, Globe, Type
} from 'lucide-react'
import { API_URL } from '../lib/config'
import { supabase } from '../lib/supabase'
import { 
  CrossDeviceRecorder, 
  playTTS, 
  stopTTS,
  getFileExtension,
  resumeAudioContext 
} from '../lib/audioUtils'

// Helper to get auth token
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || localStorage.getItem('supabase_token')
}

// Emotion options with colors
const EMOTIONS = [
  { id: 'trust', label: 'אמון', icon: '🤝', color: 'from-blue-500 to-blue-600', description: 'בניית אמינות וקשר' },
  { id: 'urgency', label: 'דחיפות', icon: '⚡', color: 'from-orange-500 to-red-500', description: 'יצירת תחושת דחף לפעולה' },
  { id: 'value', label: 'ערך', icon: '💎', color: 'from-emerald-500 to-teal-500', description: 'הדגשת הערך והתועלת' },
  { id: 'fomo', label: 'פחד מהפסד', icon: '😰', color: 'from-red-500 to-pink-500', description: 'הפסד הזדמנות' },
  { id: 'peace', label: 'שקט נפשי', icon: '🧘', color: 'from-cyan-500 to-blue-400', description: 'תחושת ביטחון ורוגע' },
  { id: 'pride', label: 'גאווה', icon: '🏆', color: 'from-amber-500 to-yellow-500', description: 'תחושת הישג והצלחה' },
  { id: 'social_proof', label: 'הוכחה חברתית', icon: '👥', color: 'from-violet-500 to-purple-500', description: 'מה אחרים עושים' },
]

// Objection types
const OBJECTION_TYPES = [
  { id: 'think', label: 'צריך לחשוב', icon: '🤔' },
  { id: 'price', label: 'יקר לי', icon: '💰' },
  { id: 'spouse', label: 'צריך להתייעץ', icon: '👫' },
  { id: 'offers', label: 'בודק הצעות', icon: '📊' },
  { id: 'timing', label: 'לא עכשיו', icon: '⏰' },
  { id: 'trust', label: 'לא מכיר אתכם', icon: '🔒' },
]

// Products
const PRODUCTS = [
  { id: 'cool_life', label: 'Cool Life', icon: '❄️' },
  { id: 'turf', label: 'Turf', icon: '🌿' },
  { id: 'pavers', label: 'Pavers', icon: '🧱' },
  { id: 'pergola', label: 'פרגולה', icon: '🏠' },
  { id: 'general', label: 'כללי', icon: '📦' },
]

export default function StoryBankPage() {
  const navigate = useNavigate()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('library') // 'library' | 'builder' | 'manual'
  const [selectedStory, setSelectedStory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEmotion, setFilterEmotion] = useState('')
  const [filterObjection, setFilterObjection] = useState('')
  
  // Story Builder State (AI Generated)
  const [builderMode, setBuilderMode] = useState('create') // 'create' | 'improve'
  const [rawStory, setRawStory] = useState('')
  const [targetMessage, setTargetMessage] = useState('')
  const [selectedEmotions, setSelectedEmotions] = useState([])
  const [selectedObjection, setSelectedObjection] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedStory, setGeneratedStory] = useState(null)
  const [saving, setSaving] = useState(false)
  
  // Manual Story Creation State
  const [manualStoryName, setManualStoryName] = useState('')
  const [manualStoryContent, setManualStoryContent] = useState('')
  const [manualSetupLine, setManualSetupLine] = useState('')
  const [manualClosingBridge, setManualClosingBridge] = useState('')
  const [manualEmotions, setManualEmotions] = useState([])
  const [manualObjection, setManualObjection] = useState('')
  const [manualProduct, setManualProduct] = useState('')
  const [savingManual, setSavingManual] = useState(false)
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcribing, setTranscribing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingIntervalRef = useRef(null)
  
  // TTS State
  const [playingStoryId, setPlayingStoryId] = useState(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  // Load stories on mount
  useEffect(() => {
    loadStories()
  }, [])

  const loadStories = async () => {
    setLoading(true)
    try {
      const token = await getAuthToken()
      const response = await axios.get(`${API_URL}/api/story-bank`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStories(response.data.stories || [])
    } catch (err) {
      console.error('Error loading stories:', err)
    }
    setLoading(false)
  }

  const toggleEmotion = (emotionId) => {
    setSelectedEmotions(prev => 
      prev.includes(emotionId) 
        ? prev.filter(e => e !== emotionId)
        : [...prev, emotionId]
    )
  }

  const generateStory = async () => {
    if (selectedEmotions.length === 0 || !targetMessage.trim()) {
      alert('נא לבחור לפחות רגש אחד ולהזין את המסר')
      return
    }

    setGenerating(true)
    try {
      const token = await getAuthToken()
      const response = await axios.post(`${API_URL}/api/story-bank/generate`, {
        mode: builderMode,
        raw_story: rawStory,
        target_emotions: selectedEmotions,
        target_message: targetMessage,
        objection_type: selectedObjection,
        product: selectedProduct,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setGeneratedStory(response.data.story)
    } catch (err) {
      console.error('Error generating story:', err)
      alert('שגיאה ביצירת הסיפור')
    }
    setGenerating(false)
  }

  const saveStory = async () => {
    if (!generatedStory) return
    
    setSaving(true)
    try {
      const token = await getAuthToken()
      await axios.post(`${API_URL}/api/story-bank`, {
        title: generatedStory.title,
        content: generatedStory.story_content,
        story_content: generatedStory.story_content,  // Required by DB
        setup_line: generatedStory.setup_line,
        closing_bridge: generatedStory.closing_bridge,
        target_emotions: selectedEmotions,
        target_message: targetMessage,
        objection_type: selectedObjection,
        product: selectedProduct,
        structure: generatedStory.structure,
        explanation: generatedStory.explanation,
        tags: generatedStory.tags || [],
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Reset and reload
      resetBuilder()
      setActiveView('library')
      loadStories()
    } catch (err) {
      console.error('Error saving story:', err)
      alert('שגיאה בשמירת הסיפור')
    }
    setSaving(false)
  }

  const deleteStory = async (storyId) => {
    if (!confirm('האם למחוק את הסיפור?')) return
    
    try {
      const token = await getAuthToken()
      await axios.delete(`${API_URL}/api/story-bank/${storyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStories(prev => prev.filter(s => s.id !== storyId))
      if (selectedStory?.id === storyId) setSelectedStory(null)
    } catch (err) {
      console.error('Error deleting story:', err)
    }
  }

  const toggleFavorite = async (story) => {
    try {
      const token = await getAuthToken()
      await axios.put(`${API_URL}/api/story-bank/${story.id}`, {
        is_favorite: !story.is_favorite
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStories(prev => prev.map(s => 
        s.id === story.id ? { ...s, is_favorite: !s.is_favorite } : s
      ))
    } catch (err) {
      console.error('Error updating story:', err)
    }
  }

  const resetBuilder = () => {
    setBuilderMode('create')
    setRawStory('')
    setTargetMessage('')
    setSelectedEmotions([])
    setSelectedObjection('')
    setSelectedProduct('')
    setGeneratedStory(null)
  }
  
  const resetManualBuilder = () => {
    setManualStoryName('')
    setManualStoryContent('')
    setManualSetupLine('')
    setManualClosingBridge('')
    setManualEmotions([])
    setManualObjection('')
    setManualProduct('')
  }

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text)
  }
  
  // Cross-device recorder instance
  const recorderRef = useRef(null)
  
  // Recording functions - Cross-device compatible
  const startRecording = async () => {
    try {
      // Resume AudioContext on user gesture (required for iOS)
      await resumeAudioContext()
      
      recorderRef.current = new CrossDeviceRecorder({
        onStop: async (blob, mimeType) => {
          const extension = getFileExtension(mimeType)
          await transcribeRecording(blob, extension)
        },
        onError: (error) => {
          console.error('Recording error:', error)
          setIsRecording(false)
          if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current)
          }
        }
      })
      
      await recorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }
  
  const stopRecording = async () => {
    if (recorderRef.current && isRecording) {
      await recorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }
  
  const transcribeRecording = async (audioBlob, extension = 'webm') => {
    setTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, `recording.${extension}`)
      
      const response = await axios.post(`${API_URL}/api/transcribe-quick`, formData)
      if (response.data.text) {
        setManualStoryContent(prev => prev + (prev ? '\n\n' : '') + response.data.text)
      }
    } catch (error) {
      console.error('Error transcribing:', error)
      alert('Error transcribing audio')
    } finally {
      setTranscribing(false)
    }
  }
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Save manual story
  const saveManualStory = async () => {
    if (!manualStoryContent.trim()) {
      alert('Please enter story content')
      return
    }
    
    setSavingManual(true)
    try {
      const token = await getAuthToken()
      await axios.post(`${API_URL}/api/story-bank`, {
        title: manualStoryName || 'My Story',
        content: manualStoryContent,
        story_content: manualStoryContent,  // Required by DB
        setup_line: manualSetupLine,
        closing_bridge: manualClosingBridge,
        target_emotions: manualEmotions,
        objection_type: manualObjection,
        product: manualProduct,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      resetManualBuilder()
      setActiveView('library')
      loadStories()
    } catch (err) {
      console.error('Error saving story:', err)
      alert('Error saving story: ' + (err.response?.data?.error || err.message))
    }
    setSavingManual(false)
  }
  
  // Text-to-speech - Cross-device compatible using OpenAI TTS with fallback
  const currentAudioRef = useRef(null)
  
  const speakStory = async (text, storyId) => {
    // If already playing this story, stop it
    if (speaking && playingStoryId === storyId) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
      stopTTS()
      setSpeaking(false)
      setPlayingStoryId(null)
      return
    }
    
    // Stop any existing playback
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    stopTTS()
    
    setAudioLoading(true)
    setSpeaking(true)
    setPlayingStoryId(storyId)
    
    try {
      // Use unified TTS with automatic fallback
      const token = await getAuthToken()
      currentAudioRef.current = await playTTS(text, {
        voice: 'nova',
        hd: true,
        speed: 0.9,
        authHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        onStart: () => {
          setAudioLoading(false)
        },
        onEnd: () => {
          setSpeaking(false)
          setPlayingStoryId(null)
          currentAudioRef.current = null
        },
        onError: () => {
          setSpeaking(false)
          setPlayingStoryId(null)
          setAudioLoading(false)
          currentAudioRef.current = null
        }
      })
    } catch (error) {
      console.error('TTS error:', error)
      setSpeaking(false)
      setPlayingStoryId(null)
      setAudioLoading(false)
    }
  }
  
  const toggleManualEmotion = (emotionId) => {
    setManualEmotions(prev => 
      prev.includes(emotionId) 
        ? prev.filter(e => e !== emotionId)
        : [...prev, emotionId]
    )
  }

  // Filter stories
  const filteredStories = stories.filter(story => {
    const storyContent = story.content || story.story_content || ''
    const matchesSearch = !searchQuery || 
      story.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      storyContent.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesEmotion = !filterEmotion || 
      (story.target_emotions || []).includes(filterEmotion) ||
      story.target_emotion === filterEmotion
    const matchesObjection = !filterObjection || 
      story.objection_type === filterObjection
    return matchesSearch && matchesEmotion && matchesObjection
  })

  // Sort: favorites first, then by date
  const sortedStories = [...filteredStories].sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1
    if (!a.is_favorite && b.is_favorite) return 1
    return new Date(b.created_at) - new Date(a.created_at)
  })

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/app')}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <BookMarked className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">בנק סיפורים</h1>
                  <p className="text-xs text-gray-500">Story Bank</p>
                </div>
              </div>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
              <button
                onClick={() => { setActiveView('library'); setSelectedStory(null); }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  activeView === 'library'
                    ? 'bg-amber-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <BookMarked className="w-4 h-4" />
                Library
              </button>
              <button
                onClick={() => { setActiveView('manual'); resetManualBuilder(); }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  activeView === 'manual'
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <PenTool className="w-4 h-4" />
                Create
              </button>
              <button
                onClick={() => { setActiveView('builder'); resetBuilder(); }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  activeView === 'builder'
                    ? 'bg-violet-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Wand2 className="w-4 h-4" />
                AI Generate
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Library View */}
        {activeView === 'library' && !selectedStory && (
          <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-2xl p-4 border border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-400 mb-1">
                  <BookMarked className="w-4 h-4" />
                  <span className="text-sm">סה״כ סיפורים</span>
                </div>
                <p className="text-2xl font-bold text-white">{stories.length}</p>
              </div>
              <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/10 rounded-2xl p-4 border border-pink-500/20">
                <div className="flex items-center gap-2 text-pink-400 mb-1">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">מועדפים</span>
                </div>
                <p className="text-2xl font-bold text-white">{stories.filter(s => s.is_favorite).length}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-2xl p-4 border border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">שימושים</span>
                </div>
                <p className="text-2xl font-bold text-white">{stories.reduce((acc, s) => acc + (s.usage_count || 0), 0)}</p>
              </div>
              <div className="bg-gradient-to-br from-violet-500/20 to-purple-500/10 rounded-2xl p-4 border border-violet-500/20">
                <div className="flex items-center gap-2 text-violet-400 mb-1">
                  <Star className="w-4 h-4" />
                  <span className="text-sm">השבוע</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {stories.filter(s => new Date(s.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                </p>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="חפש סיפור..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <select
                value={filterEmotion}
                onChange={(e) => setFilterEmotion(e.target.value)}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="">כל הרגשות</option>
                {EMOTIONS.map(e => (
                  <option key={e.id} value={e.id}>{e.icon} {e.label}</option>
                ))}
              </select>
              <select
                value={filterObjection}
                onChange={(e) => setFilterObjection(e.target.value)}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="">כל ההתנגדויות</option>
                {OBJECTION_TYPES.map(o => (
                  <option key={o.id} value={o.id}>{o.icon} {o.label}</option>
                ))}
              </select>
            </div>

            {/* Stories Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sortedStories.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortedStories.map(story => (
                  <div
                    key={story.id}
                    onClick={() => setSelectedStory(story)}
                    className="group bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10 hover:border-amber-500/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {story.is_favorite && <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />}
                        <h3 className="font-semibold text-white line-clamp-1">{story.title}</h3>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-amber-400 transition-colors" />
                    </div>
                    
                    <p className="text-sm text-gray-400 line-clamp-2 mb-4">{story.content || story.story_content}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {(story.target_emotions || []).slice(0, 3).map(emotionId => {
                          const emotion = EMOTIONS.find(e => e.id === emotionId)
                          return emotion ? (
                            <span key={emotionId} className="text-lg" title={emotion.label}>{emotion.icon}</span>
                          ) : null
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(story.created_at).toLocaleDateString('he-IL')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-gradient-to-b from-white/[0.05] to-transparent rounded-3xl border border-white/10">
                <BookMarked className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">אין סיפורים עדיין</h3>
                <p className="text-gray-500 mb-6">התחל לבנות את בנק הסיפורים שלך</p>
                <button
                  onClick={() => { setActiveView('builder'); resetBuilder(); }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-medium transition-all"
                >
                  <Plus className="w-5 h-5" />
                  צור סיפור ראשון
                </button>
              </div>
            )}
          </div>
        )}

        {/* Story Detail View */}
        {activeView === 'library' && selectedStory && (
          <div className="space-y-6">
            <button
              onClick={() => setSelectedStory(null)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              חזרה לספריה
            </button>

            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-white">{selectedStory.title}</h2>
                      <button
                        onClick={() => toggleFavorite(selectedStory)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Heart className={`w-5 h-5 ${selectedStory.is_favorite ? 'text-pink-400 fill-pink-400' : 'text-gray-400'}`} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(selectedStory.target_emotions || []).map(emotionId => {
                        const emotion = EMOTIONS.find(e => e.id === emotionId)
                        return emotion ? (
                          <span key={emotionId} className={`px-3 py-1 bg-gradient-to-r ${emotion.color} rounded-full text-white text-sm`}>
                            {emotion.icon} {emotion.label}
                          </span>
                        ) : null
                      })}
                      {selectedStory.objection_type && (
                        <span className="px-3 py-1 bg-slate-700 rounded-full text-slate-200 text-sm">
                          {OBJECTION_TYPES.find(o => o.id === selectedStory.objection_type)?.icon} {OBJECTION_TYPES.find(o => o.id === selectedStory.objection_type)?.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(selectedStory.content || selectedStory.story_content)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      title="העתק"
                    >
                      <Copy className="w-5 h-5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => deleteStory(selectedStory.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                      title="מחק"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Setup Line */}
                {selectedStory.setup_line && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-amber-400 mb-2">
                      <Lightbulb className="w-4 h-4" />
                      <span className="text-sm font-medium">משפט פתיחה</span>
                    </div>
                    <p className="text-white text-lg">{selectedStory.setup_line}</p>
                  </div>
                )}

                {/* Main Story */}
                <div>
                  <div className="flex items-center gap-2 text-gray-400 mb-3">
                    <BookMarked className="w-4 h-4" />
                    <span className="text-sm font-medium">הסיפור</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-5">
                    <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">{selectedStory.content || selectedStory.story_content}</p>
                  </div>
                </div>

                {/* Closing Bridge */}
                {selectedStory.closing_bridge && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                      <ArrowRight className="w-4 h-4" />
                      <span className="text-sm font-medium">גשר סגירה</span>
                    </div>
                    <p className="text-white text-lg">{selectedStory.closing_bridge}</p>
                  </div>
                )}

                {/* Target Message */}
                {selectedStory.target_message && (
                  <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-violet-400 mb-2">
                      <Target className="w-4 h-4" />
                      <span className="text-sm font-medium">המסר המרכזי</span>
                    </div>
                    <p className="text-white">{selectedStory.target_message}</p>
                  </div>
                )}

                {/* Explanation */}
                {selectedStory.explanation && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm font-medium">הסבר</span>
                    </div>
                    <p className="text-gray-300">{selectedStory.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manual Story Creation View */}
        {activeView === 'manual' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Card */}
            <div className="bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/5 rounded-2xl border border-emerald-500/30 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <PenTool className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Create Your Story</h2>
                  <p className="text-emerald-300/70">Type or record your sales story</p>
                </div>
              </div>
            </div>
            
            {/* Story Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-white font-medium">
                <FileText className="w-5 h-5 text-emerald-400" />
                Story Name
              </label>
              <input
                type="text"
                value={manualStoryName}
                onChange={(e) => setManualStoryName(e.target.value)}
                placeholder="e.g., David's Trust Story, Maria's Decision..."
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            
            {/* Story Content with Recording */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-white font-medium">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  Your Story
                </label>
                <div className="flex items-center gap-2">
                  {transcribing && (
                    <span className="flex items-center gap-2 text-sm text-amber-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Transcribing...
                    </span>
                  )}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-4 h-4" />
                        Stop ({formatTime(recordingTime)})
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Record
                      </>
                    )}
                  </button>
                </div>
              </div>
              <textarea
                value={manualStoryContent}
                onChange={(e) => setManualStoryContent(e.target.value)}
                placeholder="Tell your story here... You can type or use the record button to speak your story and it will be transcribed automatically."
                rows={8}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 resize-none"
              />
              <p className="text-xs text-gray-500">
                Tip: Record multiple times to add to your story. Each recording will append to your content.
              </p>
            </div>
            
            {/* Setup Line */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-white font-medium">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                Opening Line (Optional)
              </label>
              <input
                type="text"
                value={manualSetupLine}
                onChange={(e) => setManualSetupLine(e.target.value)}
                placeholder="e.g., 'Let me tell you about a customer I had last month...'"
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            
            {/* Closing Bridge */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-white font-medium">
                <ArrowRight className="w-5 h-5 text-cyan-400" />
                Closing Bridge (Optional)
              </label>
              <input
                type="text"
                value={manualClosingBridge}
                onChange={(e) => setManualClosingBridge(e.target.value)}
                placeholder="e.g., 'So my question to you is... are you ready to experience the same results?'"
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            
            {/* Emotions Selection */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-white font-medium">
                <Heart className="w-5 h-5 text-pink-400" />
                What emotions should this story evoke?
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map(emotion => (
                  <button
                    key={emotion.id}
                    onClick={() => toggleManualEmotion(emotion.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      manualEmotions.includes(emotion.id)
                        ? `bg-gradient-to-r ${emotion.color} text-white shadow-lg`
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <span>{emotion.icon}</span>
                    {emotion.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Objection Type */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-white font-medium">
                <Target className="w-5 h-5 text-orange-400" />
                Which objection does this story address?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {OBJECTION_TYPES.map(objection => (
                  <button
                    key={objection.id}
                    onClick={() => setManualObjection(manualObjection === objection.id ? '' : objection.id)}
                    className={`p-3 rounded-xl text-sm transition-all flex items-center gap-2 ${
                      manualObjection === objection.id
                        ? 'bg-orange-500/20 border-2 border-orange-500 text-orange-300'
                        : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{objection.icon}</span>
                    {objection.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Product */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-white font-medium">
                <Tag className="w-5 h-5 text-violet-400" />
                Related Product (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {PRODUCTS.map(product => (
                  <button
                    key={product.id}
                    onClick={() => setManualProduct(manualProduct === product.id ? '' : product.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      manualProduct === product.id
                        ? 'bg-violet-500/20 border-2 border-violet-500 text-violet-300'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <span>{product.icon}</span>
                    {product.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Preview & Save */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={resetManualBuilder}
                className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Clear All
              </button>
              <button
                onClick={saveManualStory}
                disabled={!manualStoryContent.trim() || savingManual}
                className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
              >
                {savingManual ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save to Story Bank
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Builder View (AI Generated) */}
        {activeView === 'builder' && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Mode Selection */}
            <div className="flex gap-4">
              <button
                onClick={() => setBuilderMode('create')}
                className={`flex-1 p-6 rounded-2xl border-2 transition-all ${
                  builderMode === 'create'
                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${builderMode === 'create' ? 'bg-amber-500' : 'bg-white/10'}`}>
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Create New Story</h3>
                </div>
                <p className="text-sm text-gray-400">AI will build a story from scratch based on your message and emotions</p>
              </button>
              
              <button
                onClick={() => setBuilderMode('improve')}
                className={`flex-1 p-6 rounded-2xl border-2 transition-all ${
                  builderMode === 'improve'
                    ? 'bg-gradient-to-br from-violet-500/20 to-purple-500/10 border-violet-500'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${builderMode === 'improve' ? 'bg-violet-500' : 'bg-white/10'}`}>
                    <Wand2 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Improve Existing Story</h3>
                </div>
                <p className="text-sm text-gray-400">Enter your story and AI will enhance it with all 6 elements</p>
              </button>
            </div>

            {/* Raw Story Input (for improve mode) */}
            {builderMode === 'improve' && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-white font-medium">
                  <PenTool className="w-5 h-5 text-violet-400" />
                  הסיפור שלך (הגרסה הנוכחית)
                </label>
                <textarea
                  value={rawStory}
                  onChange={(e) => setRawStory(e.target.value)}
                  placeholder="ספר את הסיפור שלך כמו שאתה מספר אותו היום..."
                  rows={6}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 resize-none"
                />
              </div>
            )}

            {/* Target Message */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-white font-medium">
                <Target className="w-5 h-5 text-amber-400" />
                מה המסר שאתה רוצה להעביר?
              </label>
              <textarea
                value={targetMessage}
                onChange={(e) => setTargetMessage(e.target.value)}
                placeholder="לדוגמה: לא לחכות יותר מדי כי המחירים עולים..."
                rows={3}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </div>

            {/* Emotions Selection */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-white font-medium">
                <Sparkles className="w-5 h-5 text-pink-400" />
                אילו רגשות אתה רוצה לעורר? (בחר לפחות אחד)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {EMOTIONS.map(emotion => (
                  <button
                    key={emotion.id}
                    onClick={() => toggleEmotion(emotion.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-right ${
                      selectedEmotions.includes(emotion.id)
                        ? `bg-gradient-to-r ${emotion.color} border-transparent`
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{emotion.icon}</span>
                      <span className="font-medium text-white">{emotion.label}</span>
                    </div>
                    <p className="text-xs text-white/70">{emotion.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Objection & Product */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-white font-medium">
                  <MessageSquare className="w-5 h-5 text-orange-400" />
                  סוג התנגדות (אופציונלי)
                </label>
                <select
                  value={selectedObjection}
                  onChange={(e) => setSelectedObjection(e.target.value)}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">בחר התנגדות</option>
                  {OBJECTION_TYPES.map(o => (
                    <option key={o.id} value={o.id}>{o.icon} {o.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-white font-medium">
                  <Tag className="w-5 h-5 text-emerald-400" />
                  מוצר (אופציונלי)
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">בחר מוצר</option>
                  {PRODUCTS.map(p => (
                    <option key={p.id} value={p.id}>{p.icon} {p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateStory}
              disabled={generating || selectedEmotions.length === 0 || !targetMessage.trim()}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  יוצר סיפור...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  {builderMode === 'improve' ? 'שפר את הסיפור' : 'צור סיפור'}
                </>
              )}
            </button>

            {/* Generated Story Preview */}
            {generatedStory && (
              <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl border border-amber-500/30 overflow-hidden animate-fade-in">
                <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span className="font-semibold text-white">הסיפור שנוצר</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(`${generatedStory.setup_line}\n\n${generatedStory.story_content}\n\n${generatedStory.closing_bridge}`)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={generateStory}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      title="נסה שוב"
                    >
                      <RefreshCw className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  <h3 className="text-xl font-bold text-white">{generatedStory.title}</h3>
                  
                  {/* Setup Line */}
                  {generatedStory.setup_line && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-amber-400 mb-2">
                        <Lightbulb className="w-4 h-4" />
                        <span className="text-sm font-medium">משפט פתיחה</span>
                      </div>
                      <p className="text-white text-lg">{generatedStory.setup_line}</p>
                    </div>
                  )}

                  {/* Main Story */}
                  <div className="bg-white/5 rounded-xl p-5">
                    <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">{generatedStory.story_content}</p>
                  </div>

                  {/* Closing Bridge */}
                  {generatedStory.closing_bridge && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-emerald-400 mb-2">
                        <ArrowRight className="w-4 h-4" />
                        <span className="text-sm font-medium">גשר סגירה</span>
                      </div>
                      <p className="text-white text-lg">{generatedStory.closing_bridge}</p>
                    </div>
                  )}

                  {/* Explanation */}
                  {generatedStory.explanation && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-blue-400 mb-2">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm font-medium">למה הסיפור עובד</span>
                      </div>
                      <p className="text-gray-300 text-sm">{generatedStory.explanation}</p>
                    </div>
                  )}

                  {/* Save Button */}
                  <button
                    onClick={saveStory}
                    disabled={saving}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        שומר...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        שמור לבנק הסיפורים
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
