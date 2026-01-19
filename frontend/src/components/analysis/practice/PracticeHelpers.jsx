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

// Enhanced Achievement Card with animations and better visuals
export function AchievementCard({ badge, unlocked, lang, progress = 0 }) {
  const iconMap = {
    first_practice: Rocket,
    story_master: BookText,
    objection_handler: Shield,
    streak_7: Flame,
    perfect_score: Crown,
    roleplay_pro: Users,
    closing_expert: Target,
    consistency_king: TrendingUp
  }
  const Icon = iconMap[badge.id] || Gem
  
  const colorMap = {
    emerald: { gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/30' },
    violet: { gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-500/10', border: 'border-violet-500/30', glow: 'shadow-violet-500/30' },
    amber: { gradient: 'from-amber-500 to-yellow-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: 'shadow-amber-500/30' },
    orange: { gradient: 'from-orange-500 to-red-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', glow: 'shadow-orange-500/30' },
    yellow: { gradient: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', glow: 'shadow-yellow-500/30' },
    pink: { gradient: 'from-pink-500 to-rose-500', bg: 'bg-pink-500/10', border: 'border-pink-500/30', glow: 'shadow-pink-500/30' },
    blue: { gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', glow: 'shadow-blue-500/30' }
  }
  
  const colors = colorMap[badge.color] || colorMap.violet
  
  return (
    <div className={`relative p-5 rounded-2xl border transition-all duration-300 overflow-hidden group ${
      unlocked 
        ? `${colors.bg} ${colors.border} hover:scale-105 cursor-pointer` 
        : 'bg-slate-800/30 border-slate-700/30'
    }`}>
      {/* Background glow effect for unlocked */}
      {unlocked && (
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
      )}
      
      {/* Lock overlay for locked achievements */}
      {!unlocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/70 rounded-2xl z-10 backdrop-blur-sm">
          <Lock className="w-8 h-8 text-slate-500 mb-2" />
          {progress > 0 && (
            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transition-all`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}
      
      {/* Icon with animated ring */}
      <div className="relative mb-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
          unlocked 
            ? `bg-gradient-to-br ${colors.gradient} shadow-lg ${colors.glow}` 
            : 'bg-slate-700'
        }`}>
          <Icon className={`w-8 h-8 ${unlocked ? 'text-white' : 'text-slate-500'}`} />
        </div>
        {unlocked && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-xs">✓</span>
          </div>
        )}
      </div>
      
      {/* Badge info */}
      <h4 className={`font-bold mb-1 ${unlocked ? 'text-slate-100' : 'text-slate-500'}`}>
        {lang === 'en' ? badge.nameEn : badge.nameHe}
      </h4>
      <p className={`text-xs mb-3 ${unlocked ? 'text-slate-400' : 'text-slate-600'}`}>
        {lang === 'en' ? badge.descEn : badge.descHe}
      </p>
      
      {/* XP and rarity */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
          unlocked ? 'bg-amber-500/20' : 'bg-slate-700/50'
        }`}>
          <Coins className={`w-3.5 h-3.5 ${unlocked ? 'text-amber-400' : 'text-slate-500'}`} />
          <span className={`text-xs font-bold ${unlocked ? 'text-amber-400' : 'text-slate-500'}`}>
            +{badge.xp} XP
          </span>
        </div>
        {badge.rarity && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            badge.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
            badge.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
            badge.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
            'bg-slate-500/20 text-slate-400'
          }`}>
            {badge.rarity}
          </span>
        )}
      </div>
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
