import { useState } from 'react'
import { 
  Users, ChevronDown, ChevronUp, Target, Zap, MessageCircle,
  Volume2, Play, Mic, Clock, Star, Sparkles, ArrowRight
} from 'lucide-react'
import { PRACTICE_TRANSLATIONS } from './PracticeTranslations'

export default function RoleplayCard({ scenario, lang, TTSButton }) {
  const pt = PRACTICE_TRANSLATIONS[lang]
  const [showDialogue, setShowDialogue] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Estimate difficulty based on techniques count
  const difficulty = scenario.techniques_to_use?.length > 2 ? 'hard' : scenario.techniques_to_use?.length > 1 ? 'medium' : 'easy'
  const diffConfig = {
    easy: { labelEn: 'Beginner', labelHe: 'מתחיל', color: 'emerald', stars: 1 },
    medium: { labelEn: 'Intermediate', labelHe: 'בינוני', color: 'amber', stars: 2 },
    hard: { labelEn: 'Advanced', labelHe: 'מתקדם', color: 'red', stars: 3 }
  }[difficulty]
  
  return (
    <div className="bg-gradient-to-br from-pink-500/5 via-rose-500/5 to-violet-500/5 rounded-2xl border border-pink-500/20 overflow-hidden hover:border-pink-500/40 transition-all">
      {/* Header - Enhanced with difficulty and time */}
      <div className="p-5 border-b border-pink-500/10 bg-gradient-to-r from-pink-500/5 to-transparent">
        <div className="flex items-start gap-4">
          {/* Animated icon container */}
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30 flex-shrink-0">
              <Users className="w-7 h-7 text-white" />
            </div>
            {/* Pulse indicator */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full animate-pulse" />
          </div>
          
          <div className="flex-1">
            {/* Meta badges */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {/* Difficulty */}
              <span className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-medium bg-${diffConfig.color}-500/20 text-${diffConfig.color}-400`}>
                {[...Array(3)].map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < diffConfig.stars ? 'fill-current' : 'opacity-30'}`} />
                ))}
              </span>
              
              {/* Estimated time */}
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                5-10 {lang === 'en' ? 'min' : 'דק׳'}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-slate-100 mb-1">{scenario.scenario_name}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{scenario.context}</p>
          </div>
        </div>
      </div>
      
      {/* Customer Opening - Enhanced chat bubble style */}
      <div className="p-5 border-b border-pink-500/10 bg-slate-800/30">
        <div className="flex items-start gap-3">
          {/* Customer avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-800 flex items-center justify-center">
              <MessageCircle className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          
          <div className="flex-1">
            <p className="text-xs text-emerald-400 font-medium mb-2">{pt.customerSays}</p>
            {/* Chat bubble */}
            <div className="relative p-4 bg-emerald-500/10 rounded-2xl rounded-tl-none border border-emerald-500/20">
              <p className="text-slate-200 font-medium leading-relaxed">"{scenario.customer_opening}"</p>
              
              {/* Listen button */}
              {TTSButton && (
                <div className="mt-3 flex justify-end">
                  <TTSButton text={scenario.customer_opening} className="flex-shrink-0" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Your turn indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-pink-400">
          <Mic className="w-4 h-4" />
          <span>{lang === 'en' ? 'Your turn to respond...' : 'תורך להגיב...'}</span>
        </div>
      </div>
      
      {/* Goal & Techniques */}
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-amber-400 font-medium mb-1">{pt.yourGoal}</p>
            <p className="text-slate-300 text-sm">{scenario.goal}</p>
          </div>
        </div>
        
        {scenario.techniques_to_use?.length > 0 && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-violet-400 font-medium mb-2">{pt.techniquesToUse}</p>
              <div className="flex flex-wrap gap-2">
                {scenario.techniques_to_use.map((tech, i) => (
                  <span key={i} className="px-2.5 py-1 bg-violet-500/20 text-violet-300 text-xs rounded-lg border border-violet-500/30">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Sample Dialogue Toggle */}
        {scenario.sample_dialogue?.length > 0 && (
          <button
            onClick={() => setShowDialogue(!showDialogue)}
            className="w-full p-3 bg-slate-800/50 rounded-xl text-sm text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center justify-center gap-2"
          >
            {showDialogue ? pt.hideDialogue : pt.showDialogue}
            {showDialogue ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
        
        {/* Sample Dialogue - Enhanced chat style */}
        {showDialogue && scenario.sample_dialogue && (
          <div className="space-y-3 pt-2">
            {scenario.sample_dialogue.map((line, i) => {
              const isCustomer = line.speaker === 'לקוח' || line.speaker?.toLowerCase() === 'customer'
              return (
                <div 
                  key={i} 
                  className={`flex gap-3 ${isCustomer ? '' : 'flex-row-reverse'}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCustomer 
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500' 
                      : 'bg-gradient-to-br from-violet-500 to-pink-500'
                  }`}>
                    <span className="text-white text-xs font-bold">{isCustomer ? 'C' : 'Y'}</span>
                  </div>
                  
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                    isCustomer 
                      ? 'bg-emerald-500/10 border border-emerald-500/20 rounded-tl-none' 
                      : 'bg-violet-500/10 border border-violet-500/20 rounded-tr-none'
                  }`}>
                    <p className={`text-xs font-medium mb-1 ${isCustomer ? 'text-emerald-400' : 'text-violet-400'}`}>
                      {isCustomer ? pt.customer : pt.you}
                    </p>
                    <p className="text-sm text-slate-200">{line.text}</p>
                  </div>
                </div>
              )
            })}
            
            {TTSButton && (
              <div className="flex justify-center pt-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 text-violet-400 rounded-xl text-sm hover:bg-violet-500/30 transition-colors">
                  <Volume2 className="w-4 h-4" />
                  {pt.listenToResponses}
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Start Practice Button */}
        <div className="mt-4 pt-4 border-t border-pink-500/10">
          <button className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20">
            <Play className="w-5 h-5" />
            {lang === 'en' ? 'Start Practice' : 'התחל תרגול'}
          </button>
        </div>
      </div>
    </div>
  )
}
