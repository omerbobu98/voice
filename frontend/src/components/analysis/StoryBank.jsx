import { useState, useEffect } from 'react'
import { 
  BookOpen, Sparkles, Plus, Heart, Trash2, Copy, Check, X, 
  ChevronDown, ChevronUp, Search, Filter, Volume2, Loader2,
  MessageSquare, Target, Tag, Clock, TrendingUp, Star, Zap,
  Library, PenTool, Save, RefreshCw, Bookmark, BookMarked,
  User, Briefcase, Award, MapPin, Quote, Building, BadgeCheck,
  Users, FileText, Edit3, Trash, PlusCircle
} from 'lucide-react'
import axios from 'axios'
import { API_URL } from '../../lib/config'

// ============ PERSONA BUILDER COMPONENT ============
function PersonaBuilder({ onPersonaUpdated }) {
  const [persona, setPersona] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [editMode, setEditMode] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    seller_name: '',
    nickname: '',
    years_experience: '',
    areas_served: [],
    background_story: '',
    why_this_job: '',
    specialties: [],
    certifications: [],
    total_projects_completed: 0,
    notable_projects: [],
    biggest_project: '',
    most_challenging_project: '',
    happy_customers_count: 0,
    referral_rate: '',
    repeat_customers_count: 0,
    customer_testimonials: [],
    achievements: []
  })
  
  // New item forms
  const [newArea, setNewArea] = useState('')
  const [newSpecialty, setNewSpecialty] = useState('')
  const [newCert, setNewCert] = useState('')
  const [newProject, setNewProject] = useState({ name: '', type: '', description: '', outcome: '', year: '' })
  const [newTestimonial, setNewTestimonial] = useState({ customer_name: '', quote: '', project_type: '', year: '' })
  const [newAchievement, setNewAchievement] = useState({ title: '', description: '', date: '' })
  
  useEffect(() => {
    fetchPersona()
  }, [])
  
  const fetchPersona = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('supabase_token') || sessionStorage.getItem('supabase_token')
      const res = await axios.get(`${API_URL}/api/persona`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.persona) {
        setPersona(res.data.persona)
        setFormData({
          ...formData,
          ...res.data.persona,
          areas_served: res.data.persona.areas_served || [],
          specialties: res.data.persona.specialties || [],
          certifications: res.data.persona.certifications || [],
          notable_projects: res.data.persona.notable_projects || [],
          customer_testimonials: res.data.persona.customer_testimonials || [],
          achievements: res.data.persona.achievements || []
        })
      } else {
        setEditMode(true)
      }
    } catch (err) {
      console.error('Error fetching persona:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const savePersona = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('supabase_token') || sessionStorage.getItem('supabase_token')
      const res = await axios.post(`${API_URL}/api/persona`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.persona) {
        setPersona(res.data.persona)
        setEditMode(false)
        onPersonaUpdated && onPersonaUpdated(res.data.persona)
      }
    } catch (err) {
      console.error('Error saving persona:', err)
      alert('שגיאה בשמירת הפרופיל')
    } finally {
      setSaving(false)
    }
  }
  
  const addToArray = (field, value, resetFn) => {
    if (!value || (typeof value === 'string' && !value.trim())) return
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), typeof value === 'string' ? value.trim() : value]
    }))
    resetFn()
  }
  
  const removeFromArray = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }
  
  const tabs = [
    { id: 'basic', label: 'פרטים בסיסיים', icon: User },
    { id: 'projects', label: 'פרויקטים', icon: Building },
    { id: 'testimonials', label: 'המלצות', icon: Quote },
    { id: 'achievements', label: 'הישגים', icon: Award }
  ]
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    )
  }
  
  // View Mode - Display Persona Profile
  if (persona && !editMode) {
    return (
      <div className="space-y-6" dir="rtl">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-pink-500/20 rounded-2xl border border-violet-500/30 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center text-3xl">
                👤
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-100">{persona.seller_name || 'המוכר שלי'}</h3>
                {persona.nickname && <p className="text-fuchsia-400">"{persona.nickname}"</p>}
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                  {persona.years_experience && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {persona.years_experience} שנות ניסיון
                    </span>
                  )}
                  {persona.total_projects_completed > 0 && (
                    <span className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {persona.total_projects_completed} פרויקטים
                    </span>
                  )}
                  {persona.happy_customers_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {persona.happy_customers_count} לקוחות מרוצים
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-xl flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              ערוך
            </button>
          </div>
          
          {/* Areas & Specialties */}
          <div className="mt-4 flex flex-wrap gap-2">
            {persona.areas_served?.map((area, i) => (
              <span key={i} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {area}
              </span>
            ))}
            {persona.specialties?.map((spec, i) => (
              <span key={i} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm flex items-center gap-1">
                <Star className="w-3 h-3" />
                {spec}
              </span>
            ))}
            {persona.certifications?.map((cert, i) => (
              <span key={i} className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" />
                {cert}
              </span>
            ))}
          </div>
        </div>
        
        {/* Background Story */}
        {persona.background_story && (
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              הסיפור שלי
            </h4>
            <p className="text-slate-200">{persona.background_story}</p>
          </div>
        )}
        
        {/* Notable Projects */}
        {persona.notable_projects?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4" />
              פרויקטים בולטים
            </h4>
            <div className="grid gap-3">
              {persona.notable_projects.map((proj, i) => (
                <div key={i} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div className="flex justify-between items-start">
                    <h5 className="font-medium text-slate-200">{proj.name}</h5>
                    {proj.year && <span className="text-xs text-slate-500">{proj.year}</span>}
                  </div>
                  {proj.type && <span className="text-xs text-violet-400">{proj.type}</span>}
                  {proj.description && <p className="text-sm text-slate-400 mt-1">{proj.description}</p>}
                  {proj.outcome && <p className="text-sm text-emerald-400 mt-1">תוצאה: {proj.outcome}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Customer Testimonials */}
        {persona.customer_testimonials?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
              <Quote className="w-4 h-4" />
              מה לקוחות אומרים
            </h4>
            <div className="grid gap-3">
              {persona.customer_testimonials.map((test, i) => (
                <div key={i} className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
                  <p className="text-slate-200 italic">"{test.quote}"</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-amber-400">— {test.customer_name}</span>
                    {test.project_type && <span className="text-xs text-slate-500">{test.project_type}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
            <p className="text-3xl font-bold text-violet-400">{persona.total_projects_completed || 0}</p>
            <p className="text-xs text-slate-500 mt-1">פרויקטים</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
            <p className="text-3xl font-bold text-emerald-400">{persona.happy_customers_count || 0}</p>
            <p className="text-xs text-slate-500 mt-1">לקוחות מרוצים</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
            <p className="text-3xl font-bold text-amber-400">{persona.referral_rate || '0%'}</p>
            <p className="text-xs text-slate-500 mt-1">הפניות</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Edit Mode - Form
  return (
    <div className="space-y-4" dir="rtl">
      <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-xl border border-violet-500/20 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100">בניית הדמות שלי</h3>
            <p className="text-xs text-slate-400">הפרטים האלה ישמשו ליצירת סיפורים אותנטיים ומותאמים אישית</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-violet-500 text-white'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
        
        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'basic' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">שם מלא</label>
                  <input
                    type="text"
                    value={formData.seller_name}
                    onChange={(e) => setFormData({...formData, seller_name: e.target.value})}
                    placeholder="דוד כהן"
                    className="w-full p-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">כינוי (אופציונלי)</label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                    placeholder="דודי המקצוען"
                    className="w-full p-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">שנות ניסיון</label>
                  <input
                    type="number"
                    value={formData.years_experience}
                    onChange={(e) => setFormData({...formData, years_experience: parseInt(e.target.value) || 0})}
                    placeholder="10"
                    className="w-full p-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">אחוז הפניות</label>
                  <input
                    type="text"
                    value={formData.referral_rate}
                    onChange={(e) => setFormData({...formData, referral_rate: e.target.value})}
                    placeholder="70%"
                    className="w-full p-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>
              </div>
              
              {/* Areas Served */}
              <div>
                <label className="text-sm text-slate-400 mb-1 block">אזורי שירות</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    placeholder="לוס אנג'לס"
                    className="flex-1 p-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200"
                    onKeyPress={(e) => e.key === 'Enter' && addToArray('areas_served', newArea, () => setNewArea(''))}
                  />
                  <button
                    onClick={() => addToArray('areas_served', newArea, () => setNewArea(''))}
                    className="px-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                  >
                    <PlusCircle className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.areas_served.map((area, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm flex items-center gap-1">
                      {area}
                      <button onClick={() => removeFromArray('areas_served', i)} className="hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Specialties */}
              <div>
                <label className="text-sm text-slate-400 mb-1 block">התמחויות</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    placeholder="Cool Life Paint"
                    className="flex-1 p-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200"
                    onKeyPress={(e) => e.key === 'Enter' && addToArray('specialties', newSpecialty, () => setNewSpecialty(''))}
                  />
                  <button
                    onClick={() => addToArray('specialties', newSpecialty, () => setNewSpecialty(''))}
                    className="px-3 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30"
                  >
                    <PlusCircle className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.specialties.map((spec, i) => (
                    <span key={i} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm flex items-center gap-1">
                      {spec}
                      <button onClick={() => removeFromArray('specialties', i)} className="hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Background Story */}
              <div>
                <label className="text-sm text-slate-400 mb-1 block">הסיפור שלי (איך הגעתי לתחום)</label>
                <textarea
                  value={formData.background_story}
                  onChange={(e) => setFormData({...formData, background_story: e.target.value})}
                  placeholder="ספר על עצמך - איך התחלת בתחום, מה מניע אותך..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 resize-none"
                />
              </div>
              
              <div>
                <label className="text-sm text-slate-400 mb-1 block">למה אני אוהב את העבודה הזו</label>
                <textarea
                  value={formData.why_this_job}
                  onChange={(e) => setFormData({...formData, why_this_job: e.target.value})}
                  placeholder="מה מיוחד בעבודה שלך, למה אתה נהנה לעזור ללקוחות..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 resize-none"
                />
              </div>
            </>
          )}
          
          {activeTab === 'projects' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">סה"כ פרויקטים שהושלמו</label>
                  <input
                    type="number"
                    value={formData.total_projects_completed}
                    onChange={(e) => setFormData({...formData, total_projects_completed: parseInt(e.target.value) || 0})}
                    className="w-full p-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">לקוחות מרוצים</label>
                  <input
                    type="number"
                    value={formData.happy_customers_count}
                    onChange={(e) => setFormData({...formData, happy_customers_count: parseInt(e.target.value) || 0})}
                    className="w-full p-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>
              </div>
              
              {/* Add Notable Project */}
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <h5 className="text-sm font-medium text-slate-300 mb-3">הוסף פרויקט בולט</h5>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    placeholder="שם הפרויקט"
                    className="p-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 text-sm"
                  />
                  <input
                    type="text"
                    value={newProject.type}
                    onChange={(e) => setNewProject({...newProject, type: e.target.value})}
                    placeholder="סוג (Cool Life, Turf...)"
                    className="p-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 text-sm"
                  />
                </div>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  placeholder="תיאור הפרויקט"
                  rows={2}
                  className="w-full p-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 text-sm resize-none mb-2"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProject.outcome}
                    onChange={(e) => setNewProject({...newProject, outcome: e.target.value})}
                    placeholder="תוצאה (חיסכון, שביעות רצון...)"
                    className="flex-1 p-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 text-sm"
                  />
                  <input
                    type="text"
                    value={newProject.year}
                    onChange={(e) => setNewProject({...newProject, year: e.target.value})}
                    placeholder="שנה"
                    className="w-20 p-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 text-sm"
                  />
                  <button
                    onClick={() => {
                      if (newProject.name) {
                        addToArray('notable_projects', newProject, () => setNewProject({ name: '', type: '', description: '', outcome: '', year: '' }))
                      }
                    }}
                    className="px-3 bg-violet-500 text-white rounded-lg hover:bg-violet-600"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Project List */}
              {formData.notable_projects.length > 0 && (
                <div className="space-y-2">
                  {formData.notable_projects.map((proj, i) => (
                    <div key={i} className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30 flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-200">{proj.name}</p>
                        <p className="text-xs text-slate-500">{proj.type} {proj.year && `• ${proj.year}`}</p>
                        {proj.description && <p className="text-sm text-slate-400 mt-1">{proj.description}</p>}
                      </div>
                      <button onClick={() => removeFromArray('notable_projects', i)} className="text-slate-500 hover:text-red-400">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          
          {activeTab === 'testimonials' && (
            <>
              {/* Add Testimonial */}
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <h5 className="text-sm font-medium text-slate-300 mb-3">הוסף המלצת לקוח</h5>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    value={newTestimonial.customer_name}
                    onChange={(e) => setNewTestimonial({...newTestimonial, customer_name: e.target.value})}
                    placeholder="שם הלקוח"
                    className="p-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 text-sm"
                  />
                  <input
                    type="text"
                    value={newTestimonial.project_type}
                    onChange={(e) => setNewTestimonial({...newTestimonial, project_type: e.target.value})}
                    placeholder="סוג הפרויקט"
                    className="p-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 text-sm"
                  />
                </div>
                <textarea
                  value={newTestimonial.quote}
                  onChange={(e) => setNewTestimonial({...newTestimonial, quote: e.target.value})}
                  placeholder="מה הלקוח אמר..."
                  rows={2}
                  className="w-full p-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 text-sm resize-none mb-2"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTestimonial.year}
                    onChange={(e) => setNewTestimonial({...newTestimonial, year: e.target.value})}
                    placeholder="שנה"
                    className="w-20 p-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 text-sm"
                  />
                  <button
                    onClick={() => {
                      if (newTestimonial.customer_name && newTestimonial.quote) {
                        addToArray('customer_testimonials', newTestimonial, () => setNewTestimonial({ customer_name: '', quote: '', project_type: '', year: '' }))
                      }
                    }}
                    className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    הוסף המלצה
                  </button>
                </div>
              </div>
              
              {/* Testimonial List */}
              {formData.customer_testimonials.length > 0 && (
                <div className="space-y-2">
                  {formData.customer_testimonials.map((test, i) => (
                    <div key={i} className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 flex justify-between items-start">
                      <div>
                        <p className="text-slate-200 italic">"{test.quote}"</p>
                        <p className="text-sm text-amber-400 mt-1">— {test.customer_name}</p>
                      </div>
                      <button onClick={() => removeFromArray('customer_testimonials', i)} className="text-slate-500 hover:text-red-400">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          
          {activeTab === 'achievements' && (
            <>
              {/* Add Achievement */}
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <h5 className="text-sm font-medium text-slate-300 mb-3">הוסף הישג</h5>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    value={newAchievement.title}
                    onChange={(e) => setNewAchievement({...newAchievement, title: e.target.value})}
                    placeholder="כותרת ההישג"
                    className="p-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 text-sm"
                  />
                  <input
                    type="text"
                    value={newAchievement.date}
                    onChange={(e) => setNewAchievement({...newAchievement, date: e.target.value})}
                    placeholder="תאריך"
                    className="p-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAchievement.description}
                    onChange={(e) => setNewAchievement({...newAchievement, description: e.target.value})}
                    placeholder="תיאור"
                    className="flex-1 p-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 text-sm"
                  />
                  <button
                    onClick={() => {
                      if (newAchievement.title) {
                        addToArray('achievements', newAchievement, () => setNewAchievement({ title: '', description: '', date: '' }))
                      }
                    }}
                    className="px-3 bg-violet-500 text-white rounded-lg hover:bg-violet-600"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Achievement List */}
              {formData.achievements.length > 0 && (
                <div className="space-y-2">
                  {formData.achievements.map((ach, i) => (
                    <div key={i} className="p-3 bg-violet-500/10 rounded-lg border border-violet-500/20 flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-200">{ach.title}</p>
                        {ach.description && <p className="text-sm text-slate-400">{ach.description}</p>}
                        {ach.date && <p className="text-xs text-slate-500 mt-1">{ach.date}</p>}
                      </div>
                      <button onClick={() => removeFromArray('achievements', i)} className="text-slate-500 hover:text-red-400">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Save Button */}
        <div className="flex gap-3 mt-6">
          {persona && (
            <button
              onClick={() => setEditMode(false)}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl"
            >
              ביטול
            </button>
          )}
          <button
            onClick={savePersona}
            disabled={saving}
            className="flex-1 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-50 text-white rounded-xl font-medium flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            שמור פרופיל
          </button>
        </div>
      </div>
    </div>
  )
}

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
  const [activeTab, setActiveTab] = useState('stories') // 'stories', 'generator', 'persona'
  
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
            onClick={() => setActiveTab('stories')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 'stories' ? 'bg-violet-500/20 text-violet-400 border-b-2 border-violet-500' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Library className="w-4 h-4" />
            הסיפורים שלי
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 'generator' ? 'bg-violet-500/20 text-violet-400 border-b-2 border-violet-500' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            צור סיפור
          </button>
          <button
            onClick={() => setActiveTab('persona')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 'persona' 
                ? 'bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 text-fuchsia-400 border-b-2 border-fuchsia-500' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <User className="w-4 h-4" />
            הדמות שלי
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'generator' && (
            <StoryGenerator 
              onStorySaved={(story) => {
                setStories([story, ...stories])
                setActiveTab('stories')
              }}
            />
          )}
          
          {activeTab === 'persona' && (
            <PersonaBuilder onPersonaUpdated={() => {}} />
          )}
          
          {activeTab === 'stories' && (
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
