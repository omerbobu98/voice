import { useState, useEffect, useRef } from 'react'
import { 
  Target, TrendingUp, Award, CheckCircle2, Lock, Play,
  BookOpen, Mic, Video, Brain, Zap, Star, ArrowRight,
  Timer, Trophy, Flame, Users, MessageCircle
} from 'lucide-react'

// Interactive Visual Learning Pathways Component
export default function LearningPathways({ userProgress, onNodeClick, language = 'he' }) {
  const [selectedPath, setSelectedPath] = useState('discovery')
  const [hoveredNode, setHoveredNode] = useState(null)
  const [completedNodes, setCompletedNodes] = useState(new Set(userProgress?.completedNodes || []))
  const canvasRef = useRef(null)

  const learningPaths = {
    discovery: {
      nameHe: 'מסלול גילוי לקוחות',
      nameEn: 'Customer Discovery Path',
      color: 'emerald',
      nodes: [
        {
          id: 'basic_questions',
          nameHe: 'שאלות בסיסיות',
          nameEn: 'Basic Questions',
          level: 1,
          xp: 50,
          position: { x: 100, y: 100 },
          prerequisites: [],
          content: 'question_techniques',
          estimatedTime: 15
        },
        {
          id: 'pain_discovery',
          nameHe: 'גילוי נקודות כאב',
          nameEn: 'Pain Discovery',
          level: 2,
          xp: 100,
          position: { x: 250, y: 150 },
          prerequisites: ['basic_questions'],
          content: 'pain_analysis',
          estimatedTime: 25
        },
        {
          id: 'emotional_triggers',
          nameHe: 'טריגרים רגשיים',
          nameEn: 'Emotional Triggers',
          level: 3,
          xp: 150,
          position: { x: 400, y: 100 },
          prerequisites: ['pain_discovery'],
          content: 'psychology_module',
          estimatedTime: 30
        }
      ]
    },
    objection_handling: {
      nameHe: 'מסלול טיפול בהתנגדויות',
      nameEn: 'Objection Handling Path', 
      color: 'amber',
      nodes: [
        {
          id: 'objection_types',
          nameHe: 'סוגי התנגדויות',
          nameEn: 'Objection Types',
          level: 1,
          xp: 75,
          position: { x: 100, y: 300 },
          prerequisites: [],
          content: 'objection_library',
          estimatedTime: 20
        },
        {
          id: 'isolation_technique',
          nameHe: 'טכניקת בידוד',
          nameEn: 'Isolation Technique',
          level: 2,
          xp: 125,
          position: { x: 300, y: 350 },
          prerequisites: ['objection_types'],
          content: 'isolation_practice',
          estimatedTime: 35
        }
      ]
    },
    closing: {
      nameHe: 'מסלול סגירת עסקאות',
      nameEn: 'Deal Closing Path',
      color: 'violet',
      nodes: [
        {
          id: 'trial_closes',
          nameHe: 'סגירות ניסיון',
          nameEn: 'Trial Closes',
          level: 1,
          xp: 100,
          position: { x: 150, y: 500 },
          prerequisites: [],
          content: 'closing_techniques',
          estimatedTime: 25
        }
      ]
    }
  }

  // Check if node is unlocked
  const isNodeUnlocked = (node) => {
    return node.prerequisites.every(req => completedNodes.has(req))
  }

  // Get node status
  const getNodeStatus = (node) => {
    if (completedNodes.has(node.id)) return 'completed'
    if (isNodeUnlocked(node)) return 'available'
    return 'locked'
  }

  // Render connection lines between nodes
  const renderConnections = (path) => {
    const connections = []
    path.nodes.forEach(node => {
      node.prerequisites.forEach(prereqId => {
        const prereqNode = path.nodes.find(n => n.id === prereqId)
        if (prereqNode) {
          connections.push(
            <line
              key={`${prereqId}-${node.id}`}
              x1={prereqNode.position.x + 30}
              y1={prereqNode.position.y + 30}
              x2={node.position.x + 30}
              y2={node.position.y + 30}
              stroke="#374151"
              strokeWidth="2"
              strokeDasharray={completedNodes.has(prereqId) ? "none" : "5,5"}
              className="transition-all duration-300"
            />
          )
        }
      })
    })
    return connections
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden" dir={language === 'he' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {language === 'he' ? 'מסלולי למידה אינטראקטיביים' : 'Interactive Learning Paths'}
              </h2>
              <p className="text-sm text-slate-400">
                {language === 'he' ? 'בחר מסלול וקדם שלב אחר שלב' : 'Choose a path and progress step by step'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-white font-medium">{userProgress?.totalXP || 0} XP</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-violet-400" />
              <span className="text-white">{language === 'he' ? 'רמה' : 'Level'} {Math.floor((userProgress?.totalXP || 0) / 500) + 1}</span>
            </div>
          </div>
        </div>

        {/* Path Selection */}
        <div className="flex gap-2 overflow-x-auto">
          {Object.entries(learningPaths).map(([key, path]) => (
            <button
              key={key}
              onClick={() => setSelectedPath(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                selectedPath === key
                  ? `bg-${path.color}-500/20 text-${path.color}-400 border border-${path.color}-500/30`
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-transparent hover:border-slate-600/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">
                {language === 'he' ? path.nameHe : path.nameEn}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Map */}
      <div className="p-6 relative">
        <div className="relative w-full h-96 bg-slate-900/50 rounded-xl border border-slate-700/30 overflow-hidden">
          <svg 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 600 400"
          >
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#374151" strokeOpacity="0.1" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Connection lines */}
            {renderConnections(learningPaths[selectedPath])}
          </svg>

          {/* Learning Nodes */}
          {learningPaths[selectedPath].nodes.map((node) => {
            const status = getNodeStatus(node)
            const isHovered = hoveredNode === node.id
            
            return (
              <div
                key={node.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                  isHovered ? 'scale-110 z-10' : 'z-5'
                }`}
                style={{
                  left: `${(node.position.x / 600) * 100}%`,
                  top: `${(node.position.y / 400) * 100}%`
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Node Circle */}
                <button
                  onClick={() => status !== 'locked' && onNodeClick(node)}
                  disabled={status === 'locked'}
                  className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    status === 'completed'
                      ? 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/30'
                      : status === 'available'
                        ? `bg-${learningPaths[selectedPath].color}-500 border-${learningPaths[selectedPath].color}-400 hover:shadow-lg hover:shadow-${learningPaths[selectedPath].color}-500/30`
                        : 'bg-slate-700 border-slate-600 cursor-not-allowed'
                  }`}
                >
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  ) : status === 'locked' ? (
                    <Lock className="w-6 h-6 text-slate-400" />
                  ) : (
                    <Play className="w-6 h-6 text-white" />
                  )}
                </button>

                {/* Node Label */}
                <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 text-center ${isHovered ? 'opacity-100' : 'opacity-80'}`}>
                  <p className="text-sm font-medium text-white mb-1">
                    {language === 'he' ? node.nameHe : node.nameEn}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Timer className="w-3 h-3" />
                    <span>{node.estimatedTime}{language === 'he' ? ' דק' : ' min'}</span>
                    <Star className="w-3 h-3 text-amber-400" />
                    <span>{node.xp} XP</span>
                  </div>
                </div>

                {/* Hover Tooltip */}
                {isHovered && status !== 'locked' && (
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl z-20 w-48">
                    <p className="text-xs text-slate-300 mb-2">
                      {language === 'he' ? 'רמה' : 'Level'} {node.level} • {node.xp} XP
                    </p>
                    <p className="text-sm text-white font-medium mb-1">
                      {language === 'he' ? node.nameHe : node.nameEn}
                    </p>
                    {node.prerequisites.length > 0 && status === 'available' && (
                      <p className="text-xs text-emerald-400">
                        ✓ {language === 'he' ? 'דרישות מקדימות הושלמו' : 'Prerequisites completed'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Progress Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">{completedNodes.size}</p>
            <p className="text-xs text-slate-400">{language === 'he' ? 'הושלמו' : 'Completed'}</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Target className="w-4 h-4 text-violet-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {learningPaths[selectedPath].nodes.filter(n => isNodeUnlocked(n) && !completedNodes.has(n.id)).length}
            </p>
            <p className="text-xs text-slate-400">{language === 'he' ? 'זמינים' : 'Available'}</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white">{userProgress?.streak || 0}</p>
            <p className="text-xs text-slate-400">{language === 'he' ? 'ימים ברצף' : 'Day Streak'}</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-4 h-4 text-pink-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {Math.round((completedNodes.size / learningPaths[selectedPath].nodes.length) * 100)}%
            </p>
            <p className="text-xs text-slate-400">{language === 'he' ? 'התקדמות' : 'Progress'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}