import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  BookMarked, Plus, Wand2, Save, X, Heart, Trash2, ChevronLeft, 
  Sparkles, Volume2, Play, Pause, Edit3, Copy, Check, Filter,
  MessageSquare, Target, Zap, Clock, Star, TrendingUp, RefreshCw,
  ChevronRight, Search, Tag, ArrowRight, Lightbulb, PenTool
} from 'lucide-react'
import { API_URL } from '../lib/config'
import { supabase } from '../lib/supabase'

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
  const [activeView, setActiveView] = useState('library') // 'library' | 'builder' | 'improve'
  const [selectedStory, setSelectedStory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEmotion, setFilterEmotion] = useState('')
  const [filterObjection, setFilterObjection] = useState('')
  
  // Story Builder State
  const [builderMode, setBuilderMode] = useState('create') // 'create' | 'improve'
  const [rawStory, setRawStory] = useState('')
  const [targetMessage, setTargetMessage] = useState('')
  const [selectedEmotions, setSelectedEmotions] = useState([])
  const [selectedObjection, setSelectedObjection] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedStory, setGeneratedStory] = useState(null)
  const [saving, setSaving] = useState(false)
  
  // TTS State
  const [playingStoryId, setPlayingStoryId] = useState(null)
  const [audioLoading, setAudioLoading] = useState(false)

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

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text)
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
            <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
              <button
                onClick={() => { setActiveView('library'); setSelectedStory(null); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeView === 'library'
                    ? 'bg-amber-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                📚 ספריה
              </button>
              <button
                onClick={() => { setActiveView('builder'); resetBuilder(); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeView === 'builder'
                    ? 'bg-amber-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                ✨ בנה סיפור
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

        {/* Builder View */}
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
                  <h3 className="text-lg font-semibold text-white">צור סיפור חדש</h3>
                </div>
                <p className="text-sm text-gray-400">ה-AI יבנה סיפור מאפס בהתבסס על המסר והרגשות</p>
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
                  <h3 className="text-lg font-semibold text-white">שפר סיפור קיים</h3>
                </div>
                <p className="text-sm text-gray-400">הכנס סיפור שלך וה-AI ישפר אותו עם 6 האלמנטים</p>
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
