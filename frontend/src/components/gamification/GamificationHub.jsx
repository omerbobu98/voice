import { useState, useEffect } from 'react'
import { 
  Trophy, Star, Flame, Target, TrendingUp, Award,
  Crown, Shield, Zap, Users, Clock, CheckCircle2,
  Lock, Gift, Sparkles, Medal, Calendar, ArrowUp
} from 'lucide-react'

// Comprehensive Gamification Hub
export default function GamificationHub({ userStats, onChallengeAccept, language = 'he' }) {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [showLevelUpModal, setShowLevelUpModal] = useState(false)
  const [recentAchievements, setRecentAchievements] = useState([])

  // User level calculation
  const calculateLevel = (xp) => Math.floor(xp / 1000) + 1
  const calculateProgress = (xp) => (xp % 1000) / 1000 * 100

  const currentLevel = calculateLevel(userStats?.totalXP || 0)
  const levelProgress = calculateProgress(userStats?.totalXP || 0)
  const nextLevelXP = currentLevel * 1000

  // Achievement system
  const achievements = [
    {
      id: 'first_call',
      nameHe: 'צעד ראשון',
      nameEn: 'First Step',
      descHe: 'ניתחת את השיחה הראשונה שלך',
      descEn: 'Analyzed your first sales call',
      icon: Target,
      rarity: 'common',
      xp: 50,
      unlocked: true,
      unlockedAt: '2024-01-15'
    },
    {
      id: 'objection_crusher',
      nameHe: 'מוחץ התנגדויות',
      nameEn: 'Objection Crusher',
      descHe: 'טיפלת בהצלחה ב-10 התנגדויות',
      descEn: 'Successfully handled 10 objections',
      icon: Shield,
      rarity: 'rare',
      xp: 200,
      unlocked: true,
      unlockedAt: '2024-01-20'
    },
    {
      id: 'story_master',
      nameHe: 'אמן סיפורים',
      nameEn: 'Story Master',
      descHe: 'יצרת 5 סיפורים מושלמים',
      descEn: 'Created 5 perfect stories',
      icon: Star,
      rarity: 'epic',
      xp: 300,
      unlocked: false,
      progress: 3,
      required: 5
    },
    {
      id: 'closing_legend',
      nameHe: 'אגדת סגירה',
      nameEn: 'Closing Legend',
      descHe: 'סגרת 50 עסקאות בתרגול',
      descEn: 'Closed 50 deals in practice',
      icon: Crown,
      rarity: 'legendary',
      xp: 500,
      unlocked: false,
      progress: 12,
      required: 50
    }
  ]

  // Rarity colors and effects
  const rarityConfig = {
    common: { 
      color: 'slate', 
      labelHe: 'רגיל', 
      labelEn: 'Common',
      glow: 'shadow-slate-500/20'
    },
    rare: { 
      color: 'blue', 
      labelHe: 'נדיר', 
      labelEn: 'Rare',
      glow: 'shadow-blue-500/30'
    },
    epic: { 
      color: 'purple', 
      labelHe: 'אפי', 
      labelEn: 'Epic',
      glow: 'shadow-purple-500/40'
    },
    legendary: { 
      color: 'yellow', 
      labelHe: 'אגדי', 
      labelEn: 'Legendary',
      glow: 'shadow-yellow-500/50'
    }
  }

  // Daily/Weekly challenges
  const challenges = [
    {
      id: 'daily_practice',
      type: 'daily',
      nameHe: 'תרגול יומי',
      nameEn: 'Daily Practice',
      descHe: 'השלם 3 תרגילי מכירות',
      descEn: 'Complete 3 sales exercises',
      progress: 1,
      target: 3,
      xpReward: 100,
      timeLeft: '18:30:00',
      difficulty: 'easy'
    },
    {
      id: 'objection_hunter',
      type: 'weekly',
      nameHe: 'צייד התנגדויות',
      nameEn: 'Objection Hunter',
      descHe: 'טפל ב-15 התנגדויות השבוע',
      descEn: 'Handle 15 objections this week',
      progress: 8,
      target: 15,
      xpReward: 500,
      timeLeft: '3 days',
      difficulty: 'medium'
    },
    {
      id: 'story_creator',
      type: 'weekly',
      nameHe: 'יוצר סיפורים',
      nameEn: 'Story Creator',
      descHe: 'צור 5 סיפורים חדשים עם כל 6 האלמנטים',
      descEn: 'Create 5 new stories with all 6 elements',
      progress: 2,
      target: 5,
      xpReward: 750,
      timeLeft: '5 days',
      difficulty: 'hard'
    }
  ]

  // Leaderboard data
  const leaderboard = [
    { rank: 1, name: 'דניאל כהן', xp: 15420, level: 16, avatar: '👑' },
    { rank: 2, name: 'שרה לוי', xp: 14100, level: 15, avatar: '🏆' },
    { rank: 3, name: 'מיכאל רוזן', xp: 12850, level: 13, avatar: '🥉' },
    { rank: 4, name: 'אתה', xp: userStats?.totalXP || 11200, level: currentLevel, avatar: '👤', isCurrentUser: true },
    { rank: 5, name: 'רונית ברק', xp: 10900, level: 11, avatar: '🌟' }
  ]

  // Achievement card component
  const AchievementCard = ({ achievement }) => {
    const config = rarityConfig[achievement.rarity]
    const Icon = achievement.icon
    
    return (
      <div className={`relative p-4 rounded-xl border transition-all group ${
        achievement.unlocked 
          ? `bg-${config.color}-500/10 border-${config.color}-500/30 ${config.glow}`
          : 'bg-slate-800/50 border-slate-700/50'
      }`}>
        {achievement.unlocked && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        )}
        
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            achievement.unlocked 
              ? `bg-${config.color}-500/20`
              : 'bg-slate-700/50'
          }`}>
            {achievement.unlocked ? (
              <Icon className={`w-6 h-6 text-${config.color}-400`} />
            ) : (
              <Lock className="w-6 h-6 text-slate-500" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold ${achievement.unlocked ? 'text-white' : 'text-slate-400'}`}>
              {language === 'he' ? achievement.nameHe : achievement.nameEn}
            </h3>
            <span className={`text-xs px-2 py-1 rounded-lg ${
              achievement.unlocked 
                ? `bg-${config.color}-500/20 text-${config.color}-400`
                : 'bg-slate-700/50 text-slate-500'
            }`}>
              {language === 'he' ? config.labelHe : config.labelEn}
            </span>
          </div>
        </div>
        
        <p className={`text-sm mb-3 ${achievement.unlocked ? 'text-slate-300' : 'text-slate-500'}`}>
          {language === 'he' ? achievement.descHe : achievement.descEn}
        </p>
        
        {achievement.unlocked ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {language === 'he' ? 'נפתח ב-' : 'Unlocked on'} {achievement.unlockedAt}
            </span>
            <span className={`text-sm font-bold text-${config.color}-400`}>+{achievement.xp} XP</span>
          </div>
        ) : (
          <>
            {achievement.progress !== undefined && (
              <div className="mb-2">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{language === 'he' ? 'התקדמות' : 'Progress'}</span>
                  <span>{achievement.progress}/{achievement.required}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-300"
                    style={{ width: `${(achievement.progress / achievement.required) * 100}%` }}
                  />
                </div>
              </div>
            )}
            <span className="text-sm text-violet-400 font-medium">+{achievement.xp} XP</span>
          </>
        )}
      </div>
    )
  }

  // Challenge card component
  const ChallengeCard = ({ challenge }) => {
    const difficultyConfig = {
      easy: { color: 'emerald', labelHe: 'קל', labelEn: 'Easy' },
      medium: { color: 'amber', labelHe: 'בינוני', labelEn: 'Medium' },
      hard: { color: 'red', labelHe: 'קשה', labelEn: 'Hard' }
    }
    
    const config = difficultyConfig[challenge.difficulty]
    const progressPercent = (challenge.progress / challenge.target) * 100
    const isCompleted = challenge.progress >= challenge.target
    
    return (
      <div className={`p-4 rounded-xl border transition-all ${
        isCompleted 
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                challenge.type === 'daily' 
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-purple-500/20 text-purple-400'
              }`}>
                {language === 'he' ? (challenge.type === 'daily' ? 'יומי' : 'שבועי') : (challenge.type === 'daily' ? 'Daily' : 'Weekly')}
              </span>
              <span className={`px-2 py-1 rounded-lg text-xs font-medium bg-${config.color}-500/20 text-${config.color}-400`}>
                {language === 'he' ? config.labelHe : config.labelEn}
              </span>
            </div>
            <h3 className="font-semibold text-white mb-1">
              {language === 'he' ? challenge.nameHe : challenge.nameEn}
            </h3>
            <p className="text-sm text-slate-400 mb-3">
              {language === 'he' ? challenge.descHe : challenge.descEn}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
              <Clock className="w-3 h-3" />
              <span>{challenge.timeLeft}</span>
            </div>
            <span className="text-lg font-bold text-violet-400">+{challenge.xpReward} XP</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-300">{challenge.progress}/{challenge.target}</span>
            <span className="text-slate-400">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                isCompleted 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                  : 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
              }`}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>
        
        {isCompleted ? (
          <button className="w-full py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {language === 'he' ? 'הושלם!' : 'Completed!'}
          </button>
        ) : (
          <button 
            onClick={() => onChallengeAccept?.(challenge)}
            className="w-full py-2 bg-violet-500/20 text-violet-400 rounded-lg text-sm font-medium hover:bg-violet-500/30 transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {language === 'he' ? 'התחל אתגר' : 'Start Challenge'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden" dir={language === 'he' ? 'rtl' : 'ltr'}>
      {/* Header with Level Progress */}
      <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {currentLevel}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {language === 'he' ? 'מרכז הישגים' : 'Achievement Hub'}
              </h2>
              <p className="text-sm text-slate-400">
                {language === 'he' ? `רמה ${currentLevel} • ${userStats?.totalXP || 0} נקודות ניסיון` : `Level ${currentLevel} • ${userStats?.totalXP || 0} XP`}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-lg font-bold text-white">{userStats?.streak || 0}</span>
              <span className="text-sm text-slate-400">{language === 'he' ? 'ימים ברצף' : 'day streak'}</span>
            </div>
            <div className="text-xs text-slate-500">
              {language === 'he' ? `עוד ${nextLevelXP - (userStats?.totalXP || 0)} XP לרמה הבאה` : `${nextLevelXP - (userStats?.totalXP || 0)} XP to next level`}
            </div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="relative">
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <div className="absolute -top-1 right-0 text-xs text-slate-400">
            {language === 'he' ? 'רמה' : 'Level'} {currentLevel + 1}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex gap-2 overflow-x-auto">
          {['overview', 'achievements', 'challenges', 'leaderboard'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                selectedTab === tab
                  ? 'bg-violet-500 text-white shadow-lg'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab === 'overview' && <TrendingUp className="w-4 h-4" />}
              {tab === 'achievements' && <Trophy className="w-4 h-4" />}
              {tab === 'challenges' && <Target className="w-4 h-4" />}
              {tab === 'leaderboard' && <Users className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {language === 'he' ? {
                  overview: 'סקירה',
                  achievements: 'הישגים', 
                  challenges: 'אתגרים',
                  leaderboard: 'לוח תוצאות'
                }[tab] : {
                  overview: 'Overview',
                  achievements: 'Achievements',
                  challenges: 'Challenges', 
                  leaderboard: 'Leaderboard'
                }[tab]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                <Trophy className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-400">{achievements.filter(a => a.unlocked).length}</p>
                <p className="text-xs text-slate-400">{language === 'he' ? 'הישגים' : 'Achievements'}</p>
              </div>
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 text-center">
                <Target className="w-8 h-8 text-violet-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-violet-400">{challenges.filter(c => c.progress >= c.target).length}</p>
                <p className="text-xs text-slate-400">{language === 'he' ? 'אתגרים הושלמו' : 'Challenges Completed'}</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                <Medal className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-400">#{leaderboard.find(u => u.isCurrentUser)?.rank || 4}</p>
                <p className="text-xs text-slate-400">{language === 'he' ? 'דירוג' : 'Ranking'}</p>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
                <Flame className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-400">{userStats?.streak || 0}</p>
                <p className="text-xs text-slate-400">{language === 'he' ? 'ימים ברצף' : 'Day Streak'}</p>
              </div>
            </div>

            {/* Recent achievements */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                {language === 'he' ? 'הישגים אחרונים' : 'Recent Achievements'}
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {achievements.filter(a => a.unlocked).slice(0, 2).map(achievement => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </div>

            {/* Active challenges preview */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                {language === 'he' ? 'אתגרים פעילים' : 'Active Challenges'}
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {challenges.slice(0, 2).map(challenge => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'achievements' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {language === 'he' ? 'כל הישגיך' : 'All Your Achievements'}
              </h3>
              <span className="text-sm text-slate-400">
                {achievements.filter(a => a.unlocked).length}/{achievements.length} {language === 'he' ? 'נפתחו' : 'unlocked'}
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map(achievement => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'challenges' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">
              {language === 'he' ? 'אתגרים פעילים' : 'Active Challenges'}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {challenges.map(challenge => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'leaderboard' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              {language === 'he' ? 'לוח המובילים' : 'Leaderboard'}
            </h3>
            <div className="space-y-3">
              {leaderboard.map((user) => (
                <div key={user.rank} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                  user.isCurrentUser 
                    ? 'bg-violet-500/20 border border-violet-500/30 ring-1 ring-violet-400'
                    : 'bg-slate-800/50 border border-slate-700/50'
                }`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                    user.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                    user.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                    user.rank === 3 ? 'bg-amber-600/20 text-amber-600' :
                    'bg-slate-700/50 text-slate-400'
                  }`}>
                    {user.rank <= 3 ? ['🥇', '🥈', '🥉'][user.rank - 1] : `#${user.rank}`}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold ${user.isCurrentUser ? 'text-violet-300' : 'text-white'}`}>
                        {user.name}
                      </h4>
                      {user.isCurrentUser && (
                        <span className="px-2 py-1 bg-violet-500/20 text-violet-400 text-xs rounded-lg">
                          {language === 'he' ? 'אתה' : 'You'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>{language === 'he' ? 'רמה' : 'Level'} {user.level}</span>
                      <span>{user.xp.toLocaleString()} XP</span>
                    </div>
                  </div>
                  {user.isCurrentUser && (
                    <div className="text-right">
                      <ArrowUp className="w-5 h-5 text-emerald-400 mx-auto" />
                      <span className="text-xs text-emerald-400">{language === 'he' ? 'עלית מקום!' : 'Moved up!'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}