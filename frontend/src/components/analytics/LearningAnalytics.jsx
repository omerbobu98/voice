import { useState, useEffect, useMemo } from 'react'
import { 
  TrendingUp, Target, Brain, Clock, Award, Users,
  CheckCircle2, ArrowUp, ArrowDown, Zap, Star,
  Calendar, BarChart3, PieChart, LineChart, Eye,
  Lightbulb, Trophy, Flame, Heart, Shield, Crown
} from 'lucide-react'

// Comprehensive Learning Analytics Dashboard
export default function LearningAnalytics({ 
  userData, 
  timeRange = '30d', 
  onTimeRangeChange, 
  language = 'he' 
}) {
  const [selectedMetric, setSelectedMetric] = useState('overview')
  const [insightLevel, setInsightLevel] = useState('detailed') // basic, detailed, advanced

  // Mock data - would come from API
  const analyticsData = {
    overview: {
      totalSessions: 48,
      totalTime: 1240, // minutes
      averageScore: 78,
      improvement: 23, // percentage points
      streak: 12,
      completedChallenges: 15,
      unlockedAchievements: 8,
      weaknessesImproved: 6
    },
    skillProgress: {
      discovery: { current: 85, previous: 70, exercises: 23, lastSession: '2024-01-19' },
      objection_handling: { current: 72, previous: 60, exercises: 18, lastSession: '2024-01-18' },
      closing: { current: 67, previous: 45, exercises: 12, lastSession: '2024-01-17' },
      storytelling: { current: 89, previous: 85, exercises: 31, lastSession: '2024-01-20' },
      value_articulation: { current: 76, previous: 68, exercises: 19, lastSession: '2024-01-19' },
      rapport_building: { current: 82, previous: 75, exercises: 22, lastSession: '2024-01-18' }
    },
    learningVelocity: {
      daily: [12, 15, 8, 22, 18, 25, 19, 13, 28, 16, 21, 24, 17, 29],
      weekly: [85, 92, 78, 96, 88, 94],
      monthly: [320, 410, 385, 445]
    },
    timeDistribution: {
      practice_scenarios: 35,
      skill_exercises: 28,
      ai_coaching: 20,
      story_creation: 12,
      theory_reading: 5
    },
    mistakePatterns: [
      { 
        mistake: 'premature_pricing',
        nameHe: 'חשיפת מחיר מוקדמת',
        nameEn: 'Premature Price Reveal',
        frequency: 12,
        trend: -3,
        lastOccurrence: '2024-01-15',
        improvement: 65
      },
      { 
        mistake: 'weak_discovery',
        nameHe: 'גילוי חלש',
        nameEn: 'Weak Discovery',
        frequency: 8,
        trend: -2,
        lastOccurrence: '2024-01-12',
        improvement: 45
      }
    ],
    personalizedInsights: [
      {
        type: 'strength',
        titleHe: 'מצטיין בבניית סיפורים',
        titleEn: 'Excelling at Storytelling',
        descHe: 'הסיפורים שלך משפרים ב-89% מהמקרים את העמדה מול התנגדויות',
        descEn: 'Your stories improve objection handling success by 89%',
        actionHe: 'תשתמש בכישרון הזה יותר בתחילת השיחות',
        actionEn: 'Use this talent more at the beginning of calls',
        confidence: 92
      },
      {
        type: 'opportunity',
        titleHe: 'הזדמנות לשיפור בסגירה',
        titleEn: 'Closing Improvement Opportunity',
        descHe: 'אתה מפסיד 23% מהעסקאות בשלב הסגירה',
        descEn: 'You lose 23% of deals at the closing stage',
        actionHe: 'התמקד בתרגול טכניקות סגירה השבוע',
        actionEn: 'Focus on closing technique practice this week',
        confidence: 87
      }
    ]
  }

  // Calculate learning metrics
  const learningMetrics = useMemo(() => {
    const data = analyticsData.overview
    return {
      learningVelocity: (data.totalSessions / 30 * 7).toFixed(1), // sessions per week
      skillDevelopmentRate: ((data.improvement / data.totalSessions) * 100).toFixed(1),
      practiceEfficiency: ((data.averageScore / data.totalTime) * 100).toFixed(1),
      consistencyScore: Math.min((data.streak / 30) * 100, 100).toFixed(0)
    }
  }, [analyticsData])

  // Smart insights generator
  const generateSmartInsights = (data) => {
    const insights = []
    
    // Learning pattern analysis
    if (data.overview.streak >= 7) {
      insights.push({
        type: 'achievement',
        iconComponent: Flame,
        titleHe: 'רצף למידה מרשים!',
        titleEn: 'Impressive Learning Streak!',
        descHe: `${data.overview.streak} ימים ברצף של תרגול - אתה בדרך הנכונה!`,
        descEn: `${data.overview.streak} consecutive days of practice - you're on the right track!`,
        priority: 'high'
      })
    }
    
    // Skill improvement detection
    Object.entries(data.skillProgress).forEach(([skill, progress]) => {
      const improvement = progress.current - progress.previous
      if (improvement >= 15) {
        insights.push({
          type: 'improvement',
          iconComponent: TrendingUp,
          titleHe: `שיפור משמעותי ב${getSkillNameHe(skill)}`,
          titleEn: `Significant improvement in ${getSkillNameEn(skill)}`,
          descHe: `עלית ${improvement} נקודות בכישור הזה`,
          descEn: `You improved ${improvement} points in this skill`,
          priority: 'medium'
        })
      }
    })
    
    return insights.slice(0, 5) // Return top 5 insights
  }

  const getSkillNameHe = (skill) => {
    const names = {
      discovery: 'גילוי לקוחות',
      objection_handling: 'טיפול בהתנגדויות',
      closing: 'סגירת עסקאות',
      storytelling: 'סיפורים',
      value_articulation: 'הצגת ערך',
      rapport_building: 'בניית קשר'
    }
    return names[skill] || skill
  }

  const getSkillNameEn = (skill) => {
    const names = {
      discovery: 'Discovery',
      objection_handling: 'Objection Handling', 
      closing: 'Closing',
      storytelling: 'Storytelling',
      value_articulation: 'Value Articulation',
      rapport_building: 'Rapport Building'
    }
    return names[skill] || skill
  }

  // Skill radar chart component
  const SkillRadarChart = ({ skills, size = 200 }) => {
    const skillKeys = Object.keys(skills)
    const center = size / 2
    const radius = size * 0.35
    const angleStep = (2 * Math.PI) / skillKeys.length
    
    // Create path for current skills
    const currentPath = skillKeys.map((skill, index) => {
      const angle = index * angleStep - Math.PI / 2
      const value = skills[skill].current
      const x = center + (radius * (value / 100)) * Math.cos(angle)
      const y = center + (radius * (value / 100)) * Math.sin(angle)
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ') + ' Z'
    
    // Create path for previous skills  
    const previousPath = skillKeys.map((skill, index) => {
      const angle = index * angleStep - Math.PI / 2
      const value = skills[skill].previous
      const x = center + (radius * (value / 100)) * Math.cos(angle)
      const y = center + (radius * (value / 100)) * Math.sin(angle)
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ') + ' Z'

    return (
      <div className="relative">
        <svg width={size} height={size} className="transform">
          {/* Grid circles */}
          {[20, 40, 60, 80, 100].map(value => (
            <circle
              key={value}
              cx={center}
              cy={center}
              r={radius * (value / 100)}
              fill="none"
              stroke="#374151"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
          
          {/* Grid lines */}
          {skillKeys.map((_, index) => {
            const angle = index * angleStep - Math.PI / 2
            const x = center + radius * Math.cos(angle)
            const y = center + radius * Math.sin(angle)
            return (
              <line
                key={index}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#374151"
                strokeWidth="1"
                opacity="0.3"
              />
            )
          })}
          
          {/* Previous scores (ghost) */}
          <path
            d={previousPath}
            fill="rgba(148, 163, 184, 0.2)"
            stroke="rgba(148, 163, 184, 0.5)"
            strokeWidth="2"
          />
          
          {/* Current scores */}
          <path
            d={currentPath}
            fill="rgba(139, 92, 246, 0.3)"
            stroke="rgb(139, 92, 246)"
            strokeWidth="2"
          />
          
          {/* Skill points */}
          {skillKeys.map((skill, index) => {
            const angle = index * angleStep - Math.PI / 2
            const value = skills[skill].current
            const x = center + (radius * (value / 100)) * Math.cos(angle)
            const y = center + (radius * (value / 100)) * Math.sin(angle)
            return (
              <circle
                key={skill}
                cx={x}
                cy={y}
                r="4"
                fill="rgb(139, 92, 246)"
                stroke="white"
                strokeWidth="2"
              />
            )
          })}
        </svg>
        
        {/* Skill labels */}
        {skillKeys.map((skill, index) => {
          const angle = index * angleStep - Math.PI / 2
          const labelRadius = radius + 25
          const x = center + labelRadius * Math.cos(angle)
          const y = center + labelRadius * Math.sin(angle)
          
          return (
            <div
              key={skill}
              className="absolute text-xs text-slate-400 font-medium"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {language === 'he' ? getSkillNameHe(skill) : getSkillNameEn(skill)}
            </div>
          )
        })}
      </div>
    )
  }

  // Progress timeline component
  const ProgressTimeline = ({ data, timeRange }) => {
    const maxValue = Math.max(...data)
    return (
      <div className="flex items-end gap-2 h-32">
        {data.map((value, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-gradient-to-t from-violet-500 to-fuchsia-500 rounded-t min-h-[4px] transition-all duration-300"
              style={{ height: `${(value / maxValue) * 100}%` }}
            />
            <span className="text-xs text-slate-500 mt-1">{index + 1}</span>
          </div>
        ))}
      </div>
    )
  }

  // Smart insights component
  const SmartInsights = ({ insights }) => (
    <div className="space-y-4">
      {insights.map((insight, index) => {
        const IconComponent = insight.iconComponent
        return (
          <div key={index} className={`p-4 rounded-xl border transition-all ${
            insight.type === 'achievement' ? 'bg-emerald-500/10 border-emerald-500/20' :
            insight.type === 'improvement' ? 'bg-blue-500/10 border-blue-500/20' :
            insight.type === 'opportunity' ? 'bg-amber-500/10 border-amber-500/20' :
            'bg-slate-800/50 border-slate-700/50'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                insight.type === 'achievement' ? 'bg-emerald-500/20' :
                insight.type === 'improvement' ? 'bg-blue-500/20' :
                insight.type === 'opportunity' ? 'bg-amber-500/20' :
                'bg-slate-700/50'
              }`}>
                <IconComponent className={`w-5 h-5 ${
                  insight.type === 'achievement' ? 'text-emerald-400' :
                  insight.type === 'improvement' ? 'text-blue-400' :
                  insight.type === 'opportunity' ? 'text-amber-400' :
                  'text-slate-400'
                }`} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">
                  {language === 'he' ? insight.titleHe : insight.titleEn}
                </h4>
                <p className="text-sm text-slate-300">
                  {language === 'he' ? insight.descHe : insight.descEn}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  const smartInsights = generateSmartInsights(analyticsData)

  return (
    <div className="space-y-6" dir={language === 'he' ? 'rtl' : 'ltr'}>
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {language === 'he' ? 'אנליטיקת למידה מתקדמת' : 'Advanced Learning Analytics'}
          </h2>
          <p className="text-slate-400">
            {language === 'he' ? 'תובנות מעמיקות על הביצועים והתקדמות שלך' : 'Deep insights into your performance and progress'}
          </p>
        </div>
        
        <div className="flex gap-3">
          {/* Time range selector */}
          <select 
            value={timeRange}
            onChange={(e) => onTimeRangeChange?.(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500"
          >
            <option value="7d">{language === 'he' ? 'שבוע אחרון' : 'Last Week'}</option>
            <option value="30d">{language === 'he' ? 'חודש אחרון' : 'Last Month'}</option>
            <option value="90d">{language === 'he' ? '3 חודשים' : '3 Months'}</option>
            <option value="1y">{language === 'he' ? 'שנה' : 'Year'}</option>
          </select>
          
          {/* Insight level */}
          <select 
            value={insightLevel}
            onChange={(e) => setInsightLevel(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500"
          >
            <option value="basic">{language === 'he' ? 'בסיסי' : 'Basic'}</option>
            <option value="detailed">{language === 'he' ? 'מפורט' : 'Detailed'}</option>
            <option value="advanced">{language === 'he' ? 'מתקדם' : 'Advanced'}</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex items-center gap-1 text-sm text-emerald-400">
              <ArrowUp className="w-4 h-4" />
              <span>+{analyticsData.overview.improvement}%</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{analyticsData.overview.averageScore}</p>
          <p className="text-sm text-slate-400">{language === 'he' ? 'ציון ממוצע' : 'Average Score'}</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-slate-400">{learningMetrics.learningVelocity}/week</span>
          </div>
          <p className="text-2xl font-bold text-white">{analyticsData.overview.totalTime}</p>
          <p className="text-sm text-slate-400">{language === 'he' ? 'דקות תרגול' : 'Practice Minutes'}</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-sm text-slate-400">{learningMetrics.consistencyScore}%</div>
          </div>
          <p className="text-2xl font-bold text-white">{analyticsData.overview.streak}</p>
          <p className="text-sm text-slate-400">{language === 'he' ? 'ימים ברצף' : 'Day Streak'}</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-pink-400" />
            </div>
            <span className="text-sm text-slate-400">+{analyticsData.overview.unlockedAchievements}</span>
          </div>
          <p className="text-2xl font-bold text-white">{analyticsData.overview.completedChallenges}</p>
          <p className="text-sm text-slate-400">{language === 'he' ? 'אתגרים הושלמו' : 'Challenges Completed'}</p>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Skills Radar Chart */}
        <div className="lg:col-span-1 bg-slate-900/50 rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {language === 'he' ? 'התפתחות מיומנויות' : 'Skills Development'}
              </h3>
              <p className="text-sm text-slate-400">
                {language === 'he' ? 'השוואה לחודש קודם' : 'Compared to last month'}
              </p>
            </div>
            <Target className="w-5 h-5 text-violet-400" />
          </div>
          
          <div className="flex justify-center">
            <SkillRadarChart skills={analyticsData.skillProgress} size={280} />
          </div>

          <div className="mt-6 space-y-3">
            {Object.entries(analyticsData.skillProgress).slice(0, 3).map(([skill, data]) => {
              const improvement = data.current - data.previous
              return (
                <div key={skill} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{language === 'he' ? getSkillNameHe(skill) : getSkillNameEn(skill)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{data.current}%</span>
                    <div className={`flex items-center gap-1 ${improvement >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {improvement >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      <span className="text-xs">+{improvement}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="lg:col-span-1 bg-slate-900/50 rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {language === 'he' ? 'מגמת למידה' : 'Learning Trend'}
              </h3>
              <p className="text-sm text-slate-400">
                {language === 'he' ? 'פעילות יומית' : 'Daily activity'}
              </p>
            </div>
            <LineChart className="w-5 h-5 text-violet-400" />
          </div>
          
          <ProgressTimeline data={analyticsData.learningVelocity.daily} timeRange={timeRange} />
          
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{learningMetrics.learningVelocity}</p>
              <p className="text-xs text-slate-400">{language === 'he' ? 'סשנים/שבוע' : 'Sessions/Week'}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-violet-400">{learningMetrics.skillDevelopmentRate}%</p>
              <p className="text-xs text-slate-400">{language === 'he' ? 'קצב פיתוח' : 'Dev. Rate'}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{learningMetrics.practiceEfficiency}%</p>
              <p className="text-xs text-slate-400">{language === 'he' ? 'יעילות' : 'Efficiency'}</p>
            </div>
          </div>
        </div>

        {/* Smart Insights */}
        <div className="lg:col-span-1 bg-slate-900/50 rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {language === 'he' ? 'תובנות חכמות' : 'Smart Insights'}
              </h3>
              <p className="text-sm text-slate-400">
                {language === 'he' ? 'המלצות מותאמות אישית' : 'Personalized recommendations'}
              </p>
            </div>
            <Brain className="w-5 h-5 text-violet-400" />
          </div>
          
          <SmartInsights insights={smartInsights} />
          
          {analyticsData.personalizedInsights.length > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <h4 className="font-semibold text-yellow-400">
                  {language === 'he' ? 'המלצה השבוע' : 'This Week\'s Recommendation'}
                </h4>
              </div>
              <p className="text-sm text-slate-300 mb-2">
                {language === 'he' ? analyticsData.personalizedInsights[0].descHe : analyticsData.personalizedInsights[0].descEn}
              </p>
              <p className="text-xs text-yellow-400">
                {language === 'he' ? analyticsData.personalizedInsights[0].actionHe : analyticsData.personalizedInsights[0].actionEn}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mistake Patterns Analysis */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {language === 'he' ? 'ניתוח דפוסי שגיאות' : 'Mistake Patterns Analysis'}
            </h3>
            <p className="text-sm text-slate-400">
              {language === 'he' ? 'שגיאות נפוצות ושיפור לאורך זמן' : 'Common mistakes and improvement over time'}
            </p>
          </div>
          <Eye className="w-5 h-5 text-violet-400" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {analyticsData.mistakePatterns.map((mistake, index) => (
            <div key={index} className="p-4 bg-slate-800/50 border border-slate-700/30 rounded-xl">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">
                    {language === 'he' ? mistake.nameHe : mistake.nameEn}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span>{language === 'he' ? 'תדירות:' : 'Frequency:'} {mistake.frequency}</span>
                    <div className={`flex items-center gap-1 ${mistake.trend < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {mistake.trend < 0 ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                      <span>{Math.abs(mistake.trend)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-emerald-400">{mistake.improvement}%</p>
                  <p className="text-xs text-slate-400">{language === 'he' ? 'שיפור' : 'Improved'}</p>
                </div>
              </div>
              
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${mistake.improvement}%` }}
                />
              </div>
              
              <p className="text-xs text-slate-500 mt-2">
                {language === 'he' ? 'אחרונה:' : 'Last:'} {mistake.lastOccurrence}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}