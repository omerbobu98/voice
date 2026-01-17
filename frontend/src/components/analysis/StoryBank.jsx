import { useState, useEffect } from 'react'
import { 
  BookOpen, Sparkles, Plus, Heart, Trash2, Copy, Check, X, 
  ChevronDown, ChevronUp, Search, Filter, Volume2, Loader2,
  MessageSquare, Target, Tag, Clock, TrendingUp, Star, Zap,
  Library, PenTool, Save, RefreshCw, Bookmark, BookMarked
} from 'lucide-react'
import axios from 'axios'
import { API_URL } from '../../lib/config'

// Emotion options for story generation
const EMOTION_OPTIONS = [
  { id: 'trust', label: 'אמון', icon: '🤝', description: 'בניית קשר ואמינות' },
  { id: 'urgency', label: 'דחיפות', icon: '⏰', description: 'יצירת תחושת דחיפות להחלטה' },
  { id: 'value', label: 'ערך', icon: '💎', description: 'הדגשת הערך וה-ROI' },
  { id: 'fear_of_loss', label: 'פחד מהפסד', icon: '😰', description: 'מה יקרה אם לא יפעל' },
  { id: 'peace_of_mind', label: 'שקט נפשי', icon: '😌', description: 'ביטחון ושלווה אחרי הרכישה' },
  { id: 'pride', label: 'גאווה', icon: '🏆', description: 'תחושת הישג וגאווה' },
  { id: 'social_proof', label: 'הוכחה חברתית', icon: '👥', description: 'אחרים עשו את זה בהצלחה' }
]

// Objection type options
const OBJECTION_OPTIONS = [
  { id: 'price', label: 'מחיר', icon: '💰' },
  { id: 'timing', label: 'תזמון', icon: '📅' },
  { id: 'spouse', label: 'בן/בת זוג', icon: '💑' },
  { id: 'think_about_it', label: 'צריך לחשוב', icon: '🤔' },
  { id: 'competitor', label: 'הצעות מתחרים', icon: '🏃' },
  { id: 'general', label: 'כללי', icon: '📝' }
]

// Product options
const PRODUCT_OPTIONS = [
  { id: 'cool_life', label: 'Cool Life Paint', icon: '🎨' },
  { id: 'turf', label: 'דשא סינטטי', icon: '🌿' },
  { id: 'pavers', label: 'ריצוף', icon: '🧱' },
  { id: 'concrete', label: 'בטון', icon: '🏗️' },
  { id: 'fence', label: 'גדרות', icon: '🏠' },
  { id: 'general', label: 'כללי', icon: '📦' }
]

// Story Card Component
function StoryCard({ story, onToggleFavorite, onDelete, onUse, TTSButton, expanded, onToggleExpand }) {
  const [copied, setCopied] = useState(false)
  
  const copyStory = async () => {
    try {
      await navigator.clipboard.writeText(story.story_content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  
  const emotionConfig = EMOTION_OPTIONS.find(e => e.id === story.target_emotion) || { icon: '📖', label: story.target_emotion }
  const objectionConfig = OBJECTION_OPTIONS.find(o => o.id === story.objection_type) || { icon: '📝', label: story.objection_type }
  
  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden hover:border-violet-500/30 transition-all">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{emotionConfig.icon}</span>
              <h4 className="font-semibold text-slate-200 truncate">{story.title}</h4>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {story.objection_type && (
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-lg flex items-center gap-1">
                  {objectionConfig.icon} {objectionConfig.label}
                </span>
              )}
              {story.product_type && story.product_type !== 'general' && (
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-lg">
                  {PRODUCT_OPTIONS.find(p => p.id === story.product_type)?.label || story.product_type}
                </span>
              )}
              {story.usage_count > 0 && (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {story.usage_count} שימושים
                </span>
              )}
            </div>
            
            <p className="text-sm text-slate-400 line-clamp-2" dir="rtl">
              {story.story_content?.substring(0, 150)}...
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => onToggleFavorite(story.id, !story.is_favorite)}
              className={`p-2 rounded-lg transition-colors ${
                story.is_favorite 
                  ? 'bg-pink-500/20 text-pink-400' 
                  : 'bg-slate-700/50 text-slate-500 hover:text-pink-400'
              }`}
            >
              {story.is_favorite ? <BookMarked className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <button
          onClick={() => onToggleExpand(story.id)}
          className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1"
        >
          {expanded ? 'הסתר סיפור מלא' : 'הצג סיפור מלא'}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      
      {expanded && (
        <div className="border-t border-slate-700/50 p-4 bg-slate-900/50" dir="rtl">
          <div className="space-y-4">
            {/* Full Story */}
            <div>
              <h5 className="text-sm font-medium text-slate-400 mb-2">הסיפור המלא:</h5>
              <p className="text-slate-200 leading-relaxed whitespace-pre-line">{story.story_content}</p>
            </div>
            
            {/* Story Structure */}
            {story.story_structure && (
              <div className="grid grid-cols-2 gap-3">
                {story.story_structure.character && (
                  <div className="p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                    <p className="text-xs text-violet-400 mb-1">הדמות</p>
                    <p className="text-sm text-slate-300">{story.story_structure.character}</p>
                  </div>
                )}
                {story.story_structure.hesitation && (
                  <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <p className="text-xs text-orange-400 mb-1">ההיסוס</p>
                    <p className="text-sm text-slate-300">{story.story_structure.hesitation}</p>
                  </div>
                )}
                {story.story_structure.cost_of_waiting && (
                  <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="text-xs text-red-400 mb-1">מחיר ההמתנה</p>
                    <p className="text-sm text-slate-300">{story.story_structure.cost_of_waiting}</p>
                  </div>
                )}
                {story.story_structure.transformation && (
                  <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <p className="text-xs text-emerald-400 mb-1">השינוי</p>
                    <p className="text-sm text-slate-300">{story.story_structure.transformation}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Key Quote */}
            {story.story_structure?.key_quote && (
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="text-xs text-amber-400 mb-1">ציטוט מפתח:</p>
                <p className="text-slate-200 font-medium">"{story.story_structure.key_quote}"</p>
              </div>
            )}
            
            {/* Tags */}
            {story.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {story.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded-lg">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-700/50">
              <button
                onClick={() => { copyStory(); onUse(story.id); }}
                className="flex-1 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'הועתק!' : 'העתק סיפור'}
              </button>
              
              {TTSButton && (
                <div className="flex-1">
                  <TTSButton text={story.story_content} label="🔊 האזן" className="w-full" />
                </div>
              )}
              
              <button
                onClick={() => onDelete(story.id)}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Story Generator Component
function StoryGenerator({ onStoryGenerated, onStorySaved }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedStory, setGeneratedStory] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    target_emotion: 'trust',
    target_message: '',
    objection_type: 'general',
    product_type: 'general',
    additional_context: ''
  })
  
  const generateStory = async () => {
    if (!formData.target_message.trim()) {
      alert('אנא הזן את המסר שאתה רוצה להעביר')
      return
    }
    
    setIsGenerating(true)
    setGeneratedStory(null)
    
    try {
      const token = localStorage.getItem('supabase_token') || sessionStorage.getItem('supabase_token')
      const res = await axios.post(`${API_URL}/api/story-bank/generate`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.data.story) {
        setGeneratedStory({
          ...res.data.story,
          ...formData
        })
        onStoryGenerated && onStoryGenerated(res.data.story)
      }
    } catch (err) {
      console.error('Error generating story:', err)
      alert('שגיאה ביצירת סיפור. נסה שוב.')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const saveStory = async () => {
    if (!generatedStory) return
    
    setIsSaving(true)
    
    try {
      const token = localStorage.getItem('supabase_token') || sessionStorage.getItem('supabase_token')
      const res = await axios.post(`${API_URL}/api/story-bank`, {
        title: generatedStory.title,
        story_content: generatedStory.story_content,
        target_emotion: formData.target_emotion,
        target_message: formData.target_message,
        objection_type: formData.objection_type,
        product_type: formData.product_type,
        story_structure: generatedStory.story_structure,
        tags: generatedStory.tags
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.data.story) {
        onStorySaved && onStorySaved(res.data.story)
        setGeneratedStory(null)
        setFormData({ ...formData, target_message: '', additional_context: '' })
        alert('הסיפור נשמר בהצלחה!')
      }
    } catch (err) {
      console.error('Error saving story:', err)
      alert('שגיאה בשמירת סיפור. נסה שוב.')
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <div className="bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 rounded-2xl border border-violet-500/20 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">יוצר הסיפורים</h3>
          <p className="text-sm text-slate-400">צור סיפורים מותאמים אישית לפי רגש ומסר</p>
        </div>
      </div>
      
      <div className="space-y-4" dir="rtl">
        {/* Target Message */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">
            <MessageSquare className="w-4 h-4 inline ml-1" />
            מה המסר שאתה רוצה להעביר?
          </label>
          <textarea
            value={formData.target_message}
            onChange={(e) => setFormData({ ...formData, target_message: e.target.value })}
            placeholder="למשל: לקוחות שמחכים מפסידים כסף, המחיר הזול יוצא הכי יקר בסוף..."
            className="w-full h-24 p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-violet-500"
          />
        </div>
        
        {/* Target Emotion */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">
            <Heart className="w-4 h-4 inline ml-1" />
            איזה רגש אתה רוצה לעורר?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EMOTION_OPTIONS.map(emotion => (
              <button
                key={emotion.id}
                onClick={() => setFormData({ ...formData, target_emotion: emotion.id })}
                className={`p-3 rounded-xl border text-right transition-all ${
                  formData.target_emotion === emotion.id
                    ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span className="text-lg">{emotion.icon}</span>
                <p className="text-sm font-medium mt-1">{emotion.label}</p>
              </button>
            ))}
          </div>
        </div>
        
        {/* Objection Type */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">
            <Target className="w-4 h-4 inline ml-1" />
            לאיזו התנגדות? (אופציונלי)
          </label>
          <div className="flex flex-wrap gap-2">
            {OBJECTION_OPTIONS.map(obj => (
              <button
                key={obj.id}
                onClick={() => setFormData({ ...formData, objection_type: obj.id })}
                className={`px-3 py-2 rounded-lg border text-sm transition-all flex items-center gap-1 ${
                  formData.objection_type === obj.id
                    ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span>{obj.icon}</span>
                {obj.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Product Type */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">
            <Tag className="w-4 h-4 inline ml-1" />
            לאיזה מוצר? (אופציונלי)
          </label>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_OPTIONS.map(prod => (
              <button
                key={prod.id}
                onClick={() => setFormData({ ...formData, product_type: prod.id })}
                className={`px-3 py-2 rounded-lg border text-sm transition-all flex items-center gap-1 ${
                  formData.product_type === prod.id
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span>{prod.icon}</span>
                {prod.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Additional Context */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">
            הקשר נוסף (אופציונלי)
          </label>
          <input
            type="text"
            value={formData.additional_context}
            onChange={(e) => setFormData({ ...formData, additional_context: e.target.value })}
            placeholder="פרטים נוספים שיעזרו ליצור סיפור מדויק יותר..."
            className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
        
        {/* Generate Button */}
        <button
          onClick={generateStory}
          disabled={isGenerating || !formData.target_message.trim()}
          className="w-full py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              יוצר סיפור...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              צור סיפור
            </>
          )}
        </button>
      </div>
      
      {/* Generated Story Preview */}
      {generatedStory && (
        <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-emerald-500/30" dir="rtl">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h4 className="font-bold text-emerald-400">סיפור חדש נוצר!</h4>
          </div>
          
          <h5 className="text-lg font-semibold text-slate-200 mb-2">{generatedStory.title}</h5>
          <p className="text-slate-300 leading-relaxed whitespace-pre-line mb-4">{generatedStory.story_content}</p>
          
          {generatedStory.key_quote && (
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 mb-4">
              <p className="text-xs text-amber-400 mb-1">ציטוט מפתח:</p>
              <p className="text-slate-200 font-medium">"{generatedStory.key_quote}"</p>
            </div>
          )}
          
          {generatedStory.when_to_use && (
            <p className="text-sm text-slate-400 mb-4">
              <Clock className="w-4 h-4 inline ml-1" />
              מתי להשתמש: {generatedStory.when_to_use}
            </p>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={saveStory}
              disabled={isSaving}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              שמור לבנק הסיפורים
            </button>
            <button
              onClick={generateStory}
              disabled={isGenerating}
              className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              נסה שוב
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Main Story Bank Component (Sidebar/Panel)
export function StoryBankPanel({ isOpen, onClose, TTSButton }) {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEmotion, setFilterEmotion] = useState('')
  const [filterObjection, setFilterObjection] = useState('')
  const [expandedStoryId, setExpandedStoryId] = useState(null)
  const [showGenerator, setShowGenerator] = useState(false)
  
  useEffect(() => {
    if (isOpen) {
      fetchStories()
    }
  }, [isOpen])
  
  const fetchStories = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('supabase_token') || sessionStorage.getItem('supabase_token')
      const res = await axios.get(`${API_URL}/api/story-bank`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStories(res.data.stories || [])
    } catch (err) {
      console.error('Error fetching stories:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const toggleFavorite = async (storyId, isFavorite) => {
    try {
      const token = localStorage.getItem('supabase_token') || sessionStorage.getItem('supabase_token')
      await axios.put(`${API_URL}/api/story-bank/${storyId}`, { is_favorite: isFavorite }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStories(stories.map(s => s.id === storyId ? { ...s, is_favorite: isFavorite } : s))
    } catch (err) {
      console.error('Error updating favorite:', err)
    }
  }
  
  const deleteStory = async (storyId) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הסיפור?')) return
    
    try {
      const token = localStorage.getItem('supabase_token') || sessionStorage.getItem('supabase_token')
      await axios.delete(`${API_URL}/api/story-bank/${storyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStories(stories.filter(s => s.id !== storyId))
    } catch (err) {
      console.error('Error deleting story:', err)
    }
  }
  
  const incrementUsage = async (storyId) => {
    try {
      const token = localStorage.getItem('supabase_token') || sessionStorage.getItem('supabase_token')
      await axios.post(`${API_URL}/api/story-bank/${storyId}/use`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStories(stories.map(s => s.id === storyId ? { ...s, usage_count: (s.usage_count || 0) + 1 } : s))
    } catch (err) {
      console.error('Error incrementing usage:', err)
    }
  }
  
  const filteredStories = stories.filter(story => {
    if (searchQuery && !story.title?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !story.story_content?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (filterEmotion && story.target_emotion !== filterEmotion) return false
    if (filterObjection && story.objection_type !== filterObjection) return false
    return true
  })
  
  const favoriteStories = filteredStories.filter(s => s.is_favorite)
  const regularStories = filteredStories.filter(s => !s.is_favorite)
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Panel */}
      <div className="absolute left-0 top-0 bottom-0 w-full max-w-2xl bg-slate-900 border-r border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
              <Library className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">בנק הסיפורים</h2>
              <p className="text-xs text-slate-400">{stories.length} סיפורים שמורים</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setShowGenerator(false)}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              !showGenerator ? 'bg-violet-500/20 text-violet-400 border-b-2 border-violet-500' : 'text-slate-400'
            }`}
          >
            <Library className="w-4 h-4" />
            הסיפורים שלי
          </button>
          <button
            onClick={() => setShowGenerator(true)}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              showGenerator ? 'bg-violet-500/20 text-violet-400 border-b-2 border-violet-500' : 'text-slate-400'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            צור סיפור חדש
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {showGenerator ? (
            <StoryGenerator 
              onStorySaved={(story) => {
                setStories([story, ...stories])
                setShowGenerator(false)
              }}
            />
          ) : (
            <div className="space-y-4" dir="rtl">
              {/* Search & Filters */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="חפש סיפורים..."
                    className="w-full pr-10 pl-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              
              {/* Filter Pills */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterEmotion}
                  onChange={(e) => setFilterEmotion(e.target.value)}
                  className="px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300"
                >
                  <option value="">כל הרגשות</option>
                  {EMOTION_OPTIONS.map(e => (
                    <option key={e.id} value={e.id}>{e.icon} {e.label}</option>
                  ))}
                </select>
                <select
                  value={filterObjection}
                  onChange={(e) => setFilterObjection(e.target.value)}
                  className="px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300"
                >
                  <option value="">כל ההתנגדויות</option>
                  {OBJECTION_OPTIONS.map(o => (
                    <option key={o.id} value={o.id}>{o.icon} {o.label}</option>
                  ))}
                </select>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                </div>
              ) : filteredStories.length === 0 ? (
                <div className="text-center py-12">
                  <Library className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">אין עדיין סיפורים בבנק</p>
                  <button
                    onClick={() => setShowGenerator(true)}
                    className="mt-4 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm"
                  >
                    צור סיפור ראשון
                  </button>
                </div>
              ) : (
                <>
                  {/* Favorite Stories */}
                  {favoriteStories.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-pink-400 mb-3 flex items-center gap-2">
                        <BookMarked className="w-4 h-4" />
                        מועדפים ({favoriteStories.length})
                      </h3>
                      <div className="space-y-3">
                        {favoriteStories.map(story => (
                          <StoryCard
                            key={story.id}
                            story={story}
                            TTSButton={TTSButton}
                            expanded={expandedStoryId === story.id}
                            onToggleExpand={(id) => setExpandedStoryId(expandedStoryId === id ? null : id)}
                            onToggleFavorite={toggleFavorite}
                            onDelete={deleteStory}
                            onUse={incrementUsage}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Regular Stories */}
                  {regularStories.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                        <Library className="w-4 h-4" />
                        כל הסיפורים ({regularStories.length})
                      </h3>
                      <div className="space-y-3">
                        {regularStories.map(story => (
                          <StoryCard
                            key={story.id}
                            story={story}
                            TTSButton={TTSButton}
                            expanded={expandedStoryId === story.id}
                            onToggleExpand={(id) => setExpandedStoryId(expandedStoryId === id ? null : id)}
                            onToggleFavorite={toggleFavorite}
                            onDelete={deleteStory}
                            onUse={incrementUsage}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Inline Story Generator for embedding in other components
export function InlineStoryGenerator({ onStorySaved, TTSButton }) {
  return <StoryGenerator onStorySaved={onStorySaved} />
}

export default StoryBankPanel
