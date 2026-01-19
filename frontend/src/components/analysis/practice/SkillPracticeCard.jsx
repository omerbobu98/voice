import { useState, useRef } from 'react'
import { 
  BookOpen, PenTool, Mic, Star, Square, Send, Loader2,
  ChevronDown, ChevronUp, HelpCircle, Lightbulb, GraduationCap,
  AlertTriangle, Headphones, Brain, RotateCcw, ThumbsUp, ThumbsDown,
  Volume2, Copy, Check, Trophy, Zap, Target, Clock, Play,
  CheckCircle2, ArrowRight, Sparkles
} from 'lucide-react'
import axios from 'axios'
import { API_URL } from '../../../lib/config'
import { PRACTICE_TRANSLATIONS, SALES_METHODOLOGY_GUIDES } from './PracticeTranslations'
import { PriorityBadge, ScoreRing } from './PracticeHelpers'

export default function SkillPracticeCard({ weakness, exerciseContext, lang, TTSButton, onFeedbackReceived, onComplete }) {
  const pt = PRACTICE_TRANSLATIONS[lang]
  const [mode, setMode] = useState('guide')
  const [userInput, setUserInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showGuide, setShowGuide] = useState(false)
  const [copied, setCopied] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  
  const guideKey = weakness.guide_key || 'objection_handling'
  const guide = SALES_METHODOLOGY_GUIDES[guideKey] || SALES_METHODOLOGY_GUIDES.objection_handling
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await transcribeAndGetFeedback(audioBlob)
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
      alert(lang === 'en' ? 'Cannot access microphone.' : 'לא ניתן לגשת למיקרופון.')
    }
  }
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }
  
  const transcribeAndGetFeedback = async (audioBlob) => {
    setIsProcessing(true)
    setMode('feedback')
    
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      
      const transcribeRes = await axios.post(`${API_URL}/api/transcribe-practice`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (transcribeRes.data.text) {
        setUserInput(transcribeRes.data.text)
        await getFeedback(transcribeRes.data.text)
      }
    } catch (err) {
      console.error('Transcription error:', err)
      setFeedback({ error: lang === 'en' ? 'Transcription error.' : 'שגיאה בתמלול.' })
    } finally {
      setIsProcessing(false)
    }
  }
  
  const getFeedback = async (text) => {
    setIsProcessing(true)
    
    try {
      const res = await axios.post(`${API_URL}/api/practice-feedback`, {
        user_response: text || userInput,
        exercise_context: {
          scenario: exerciseContext?.scenario || weakness.weakness_summary,
          customer_statement: exerciseContext?.customer_statement || '',
          ideal_response: exerciseContext?.ideal_response || '',
          technique: exerciseContext?.technique || ''
        },
        exercise_type: weakness.skill_name || 'general'
      })
      
      if (res.data.feedback) {
        setFeedback(res.data.feedback)
        setMode('feedback')
        onFeedbackReceived && onFeedbackReceived(res.data.feedback)
        if (res.data.feedback.score >= 7) {
          onComplete && onComplete()
        }
      }
    } catch (err) {
      console.error('Feedback error:', err)
      setFeedback({ error: lang === 'en' ? 'Error getting feedback.' : 'שגיאה בקבלת פידבק.' })
    } finally {
      setIsProcessing(false)
    }
  }
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const resetPractice = () => {
    setMode('guide')
    setUserInput('')
    setFeedback(null)
    setRecordingTime(0)
  }
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs = [
    { id: 'guide', icon: BookOpen, label: pt.guide },
    { id: 'write', icon: PenTool, label: pt.write },
    { id: 'record', icon: Mic, label: pt.record },
  ]

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-emerald-400'
    if (score >= 6) return 'text-amber-400'
    return 'text-red-400'
  }

  const getScoreMessage = (score) => {
    if (score >= 8) return pt.excellent
    if (score >= 6) return pt.goodRoom
    return pt.needsPractice
  }

  // Get skill icon based on guide key
  const getSkillIcon = () => {
    switch(guideKey) {
      case 'objection_handling': return AlertTriangle
      case 'closing': return Zap
      case 'discovery': return Target
      case 'storytelling': return Star
      default: return BookOpen
    }
  }
  const SkillIcon = getSkillIcon()
  
  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
      {/* Header - Enhanced with icon and better visual hierarchy */}
      <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
        <div className="flex items-start gap-4">
          {/* Skill Icon with Score Ring */}
          <div className="relative flex-shrink-0">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              (weakness.current_score || 50) >= 70 
                ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30' 
                : (weakness.current_score || 50) >= 50 
                  ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30'
                  : 'bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30'
            }`}>
              <SkillIcon className={`w-7 h-7 ${
                (weakness.current_score || 50) >= 70 ? 'text-emerald-400' : 
                (weakness.current_score || 50) >= 50 ? 'text-amber-400' : 'text-red-400'
              }`} />
            </div>
            {/* Score badge */}
            <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-slate-800 ${
              (weakness.current_score || 50) >= 70 
                ? 'bg-emerald-500 text-white' 
                : (weakness.current_score || 50) >= 50 
                  ? 'bg-amber-500 text-white'
                  : 'bg-red-500 text-white'
            }`}>
              {weakness.current_score || 50}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <PriorityBadge priority={weakness.priority} lang={lang} />
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                ~10 {lang === 'en' ? 'min' : 'דק׳'}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-1">{weakness.skill_name}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{weakness.weakness_summary}</p>
            
            {/* Target score indicator */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    (weakness.current_score || 50) >= 70 ? 'bg-emerald-500' : 
                    (weakness.current_score || 50) >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${weakness.current_score || 50}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">
                {lang === 'en' ? 'Target:' : 'יעד:'} <span className="text-emerald-400 font-medium">{weakness.target_score || 80}</span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Specific Issues - Enhanced display */}
        {weakness.specific_issues?.length > 0 && (
          <div className="mt-4 p-3 bg-red-500/5 rounded-xl border border-red-500/10">
            <p className="text-xs text-red-400 font-medium mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {lang === 'en' ? 'Issues to address:' : 'בעיות לטיפול:'}
            </p>
            <div className="space-y-1.5">
              {weakness.specific_issues.slice(0, 3).map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-red-300/80">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span className="line-clamp-2">{issue}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Mode Tabs */}
      <div className="flex border-b border-slate-700/50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all ${
              mode === tab.id 
                ? 'bg-violet-500/20 text-violet-400 border-b-2 border-violet-500' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
        {feedback && (
          <button
            onClick={() => setMode('feedback')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all ${
              mode === 'feedback' 
                ? 'bg-emerald-500/20 text-emerald-400 border-b-2 border-emerald-500' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">{pt.feedback}</span>
          </button>
        )}
      </div>
      
      {/* Content */}
      <div className="p-5" dir={lang === 'he' ? 'rtl' : 'ltr'}>
        {/* Guide Mode - Enhanced with better visual hierarchy */}
        {mode === 'guide' && (
          <div className="space-y-5">
            {/* Why Important - with icon highlight */}
            <div className="p-4 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-xl border border-violet-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-violet-400" />
                  </div>
                  <h4 className="font-semibold text-violet-300">{pt.whyImportant}</h4>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {lang === 'en' ? guide.whyEn : guide.whyHe}
                </p>
              </div>
            </div>
            
            {/* Guiding Principle - highlighted box */}
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-xl border border-amber-500/20 relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500 rounded-l-xl" />
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-300 mb-1">{pt.guidingPrinciple}</h4>
                  <p className="text-sm text-slate-200 font-medium leading-relaxed">
                    {lang === 'en' ? guide.principleEn : guide.principleHe}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Steps to Follow - Interactive checklist style */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-200 flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                </div>
                {pt.stepsToFollow}
                <span className="text-xs text-slate-500 font-normal">({guide.steps?.length || 0} {lang === 'en' ? 'steps' : 'צעדים'})</span>
              </h4>
              
              <div className="relative">
                {/* Connection line */}
                <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-emerald-500/50 via-teal-500/30 to-transparent hidden md:block" />
                
                {guide.steps?.map((step, i) => (
                  <div key={i} className="relative flex gap-4 p-4 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl transition-all mb-2 group cursor-pointer border border-transparent hover:border-emerald-500/20">
                    {/* Step number with ring */}
                    <div className="relative z-10">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <span className="text-white font-bold">{i + 1}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 pt-1">
                      <p className="font-semibold text-slate-100 mb-1 group-hover:text-emerald-300 transition-colors">
                        {lang === 'en' ? step.stepEn : step.stepHe}
                      </p>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {lang === 'en' ? step.descEn : step.descHe}
                      </p>
                    </div>
                    
                    {/* Arrow indicator on hover */}
                    <ArrowRight className="w-5 h-5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity self-center" />
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full p-3 bg-slate-800/50 rounded-xl text-sm text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center justify-center gap-2"
            >
              {showGuide ? pt.showLess : pt.showMore}
              {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showGuide && guide.mistakesEn && (
              <div className="mt-4">
                <h4 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  {pt.commonMistakes}
                </h4>
                <ul className="space-y-2">
                  {(lang === 'en' ? guide.mistakesEn : guide.mistakesHe).map((mistake, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-red-400">✗</span>
                      {mistake}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setMode('write')}
                className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
              >
                <PenTool className="w-4 h-4" />
                {pt.practiceWriting}
              </button>
              <button
                onClick={() => setMode('record')}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
              >
                <Mic className="w-4 h-4" />
                {pt.practiceRecording}
              </button>
            </div>
          </div>
        )}
        
        {/* Write Mode */}
        {mode === 'write' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/70 rounded-xl border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">{pt.scenario}:</p>
              <p className="text-slate-200 font-medium">
                {exerciseContext?.customer_statement || weakness.weakness_summary}
              </p>
            </div>
            
            <div>
              <label className="text-sm text-slate-400 mb-2 block">{pt.yourAnswer}</label>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={pt.writePlaceholder}
                className="w-full h-36 p-4 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                dir={lang === 'he' ? 'rtl' : 'ltr'}
              />
              <p className="text-xs text-slate-500 mt-1">{userInput.length} {pt.characters}</p>
            </div>
            
            {exerciseContext?.technique && (
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-300">
                  {pt.tip}: {pt.tryUsing} <strong>{exerciseContext.technique}</strong>
                </p>
              </div>
            )}
            
            <button
              onClick={() => getFeedback()}
              disabled={!userInput.trim() || isProcessing}
              className="w-full py-3.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
            >
              {isProcessing ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{pt.processing}</>
              ) : (
                <><Send className="w-4 h-4" />{pt.sendForFeedback}</>
              )}
            </button>
          </div>
        )}
        
        {/* Record Mode */}
        {mode === 'record' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/70 rounded-xl border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">{pt.scenario}:</p>
              <p className="text-slate-200 font-medium">
                {exerciseContext?.customer_statement || weakness.weakness_summary}
              </p>
            </div>
            
            <div className="text-center py-10">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="w-28 h-28 bg-gradient-to-br from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-pink-500/30 transition-all hover:scale-105 active:scale-95"
                >
                  <Mic className="w-12 h-12 text-white" />
                </button>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={stopRecording}
                    className="w-28 h-28 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-red-500/30 animate-pulse"
                  >
                    <Square className="w-12 h-12 text-white" />
                  </button>
                  <div className="text-3xl font-mono text-red-400 font-bold">{formatTime(recordingTime)}</div>
                </div>
              )}
              
              <p className="text-slate-400 mt-6 text-lg">
                {isRecording ? pt.clickToStop : pt.clickToStart}
              </p>
            </div>
            
            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-start gap-3">
              <Headphones className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-300">{pt.speakClearly}</p>
            </div>
          </div>
        )}
        
        {/* Feedback Mode */}
        {mode === 'feedback' && (
          <div className="space-y-4">
            {isProcessing ? (
              <div className="text-center py-16">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-violet-500/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" />
                  <Brain className="absolute inset-0 m-auto w-8 h-8 text-violet-400" />
                </div>
                <p className="text-slate-300 font-medium text-lg">{pt.analyzingResponse}</p>
              </div>
            ) : feedback?.error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <p className="text-red-400 text-lg">{feedback.error}</p>
                <button
                  onClick={resetPractice}
                  className="mt-6 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-medium"
                >
                  {pt.tryAgain}
                </button>
              </div>
            ) : feedback && (
              <>
                {/* Score */}
                <div className="text-center py-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50">
                  <div className="text-6xl font-bold mb-2">
                    <span className={getScoreColor(feedback.score)}>{feedback.score}</span>
                    <span className="text-slate-600">/10</span>
                  </div>
                  <p className={`text-lg font-medium ${getScoreColor(feedback.score)}`}>
                    {getScoreMessage(feedback.score)}
                  </p>
                </div>
                
                {/* What you said */}
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-2">{pt.whatYouSaid}</p>
                  <p className="text-slate-300">{userInput}</p>
                </div>
                
                {/* Good points */}
                {feedback.good_points?.length > 0 && (
                  <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <ThumbsUp className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-semibold text-emerald-400">{pt.whatWasGood}</h4>
                    </div>
                    <ul className="space-y-2">
                      {feedback.good_points.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-emerald-300">
                          <span className="text-emerald-500">✓</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Improvements */}
                {feedback.improvements?.length > 0 && (
                  <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <ThumbsDown className="w-4 h-4 text-amber-400" />
                      <h4 className="font-semibold text-amber-400">{pt.whatToImprove}</h4>
                    </div>
                    <ul className="space-y-2">
                      {feedback.improvements.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-amber-300">
                          <span className="text-amber-500">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Suggested response */}
                {feedback.suggested_response && (
                  <div className="p-4 bg-violet-500/10 rounded-xl border border-violet-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-violet-400">{pt.suggestedResponse}</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(feedback.suggested_response)}
                          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                        </button>
                        {TTSButton && <TTSButton text={feedback.suggested_response} />}
                      </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{feedback.suggested_response}</p>
                  </div>
                )}
                
                {/* Tip */}
                {feedback.tip && (
                  <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-300">
                      <strong>{pt.nextTimeTip}:</strong> {feedback.tip}
                    </p>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={resetPractice}
                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {pt.practiceAgain}
                  </button>
                  <button
                    onClick={() => setMode('guide')}
                    className="flex-1 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    {pt.backToGuide}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
