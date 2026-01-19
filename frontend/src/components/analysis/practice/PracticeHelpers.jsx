import { useState, useRef } from 'react'
import { 
  Target, Flame, AlertTriangle, TrendingUp, Coins, Lock,
  BookText, Shield, Users, Crown, Rocket, Gem
} from 'lucide-react'
import { PRACTICE_TRANSLATIONS } from './PracticeTranslations'

// Animated Progress Ring
export function ProgressRing({ progress, size = 120, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-700/50"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#d946ef" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}

// Small Score Ring
export function ScoreRing({ current, target = 100, size = 50 }) {
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (current / target) * circumference
  
  const getColor = (score) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth="4"
          fill="none"
          className="stroke-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(current)}
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color: getColor(current) }}>{current}</span>
      </div>
    </div>
  )
}

// Priority Badge
export function PriorityBadge({ priority, lang }) {
  const t = PRACTICE_TRANSLATIONS[lang]
  const config = {
    critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', icon: AlertTriangle, label: t.critical },
    high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', icon: Flame, label: t.high },
    medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', icon: Target, label: t.medium },
    low: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', icon: TrendingUp, label: t.low }
  }
  
  const cfg = config[priority] || config.medium
  const Icon = cfg.icon
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

// XP Badge
export function XPBadge({ xp }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 rounded-lg">
      <Coins className="w-3.5 h-3.5 text-amber-400" />
      <span className="text-xs font-bold text-amber-400">+{xp} XP</span>
    </div>
  )
}

// Level Badge
export function LevelBadge({ level }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-xl border border-violet-500/30">
      <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
        <span className="text-xs font-bold text-white">{level}</span>
      </div>
      <span className="text-sm font-semibold text-violet-300">Level {level}</span>
    </div>
  )
}

// Streak Counter
export function StreakCounter({ days, lang }) {
  const t = PRACTICE_TRANSLATIONS[lang]
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 rounded-xl border border-orange-500/20">
      <Flame className="w-5 h-5 text-orange-400" />
      <div className="text-right">
        <span className="text-lg font-bold text-orange-400">{days}</span>
        <span className="text-xs text-orange-300 mr-1"> {t.streak}</span>
      </div>
    </div>
  )
}

// Achievement Card
export function AchievementCard({ badge, unlocked, lang }) {
  const iconMap = {
    first_practice: Rocket,
    story_master: BookText,
    objection_handler: Shield,
    streak_7: Flame,
    perfect_score: Crown,
    roleplay_pro: Users
  }
  const Icon = iconMap[badge.id] || Gem
  
  const colorMap = {
    emerald: 'from-emerald-500 to-teal-500',
    violet: 'from-violet-500 to-purple-500',
    amber: 'from-amber-500 to-yellow-500',
    orange: 'from-orange-500 to-red-500',
    yellow: 'from-yellow-400 to-amber-500',
    pink: 'from-pink-500 to-rose-500'
  }
  
  return (
    <div className={`relative p-4 rounded-2xl border transition-all ${
      unlocked 
        ? `bg-gradient-to-br ${colorMap[badge.color] || colorMap.violet}/10 border-slate-600/50` 
        : 'bg-slate-800/30 border-slate-700/30 opacity-50'
    }`}>
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-2xl z-10">
          <Lock className="w-8 h-8 text-slate-500" />
        </div>
      )}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
        unlocked ? `bg-gradient-to-br ${colorMap[badge.color] || colorMap.violet}` : 'bg-slate-700'
      }`}>
        <Icon className={`w-6 h-6 ${unlocked ? 'text-white' : 'text-slate-500'}`} />
      </div>
      <h4 className="font-semibold text-slate-200 mb-1">
        {lang === 'en' ? badge.nameEn : badge.nameHe}
      </h4>
      <XPBadge xp={badge.xp} />
    </div>
  )
}

// Quick Win Card
export function QuickWinCard({ win, index, lang }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/15 transition-all cursor-pointer">
      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
        <span className="text-white font-bold text-sm">{index + 1}</span>
      </div>
      <div>
        <p className="font-medium text-emerald-300">{win}</p>
        <p className="text-xs text-emerald-400/60 mt-1">
          {lang === 'en' ? 'Quick improvement' : 'שיפור מהיר'}
        </p>
      </div>
    </div>
  )
}

// Stat Card
export function StatCard({ icon: Icon, label, value, subtext, color = 'violet' }) {
  const colorClasses = {
    violet: 'from-violet-500/20 to-fuchsia-500/20 border-violet-500/30 text-violet-400',
    emerald: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400',
    pink: 'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400'
  }
  
  return (
    <div className={`p-4 bg-gradient-to-br ${colorClasses[color]} rounded-xl border`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${colorClasses[color].split(' ').pop()}`} />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className={`text-lg font-bold ${colorClasses[color].split(' ').pop()}`}>{value}</p>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
  )
}

// Language Toggle
export function LanguageToggle({ lang, setLang }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg border border-slate-700">
      <button
        onClick={() => setLang('en')}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          lang === 'en' 
            ? 'bg-violet-500 text-white' 
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang('he')}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          lang === 'he' 
            ? 'bg-violet-500 text-white' 
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        עב
      </button>
    </div>
  )
}
