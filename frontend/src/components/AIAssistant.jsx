import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Sparkles, Loader2, Copy, Check, Trash2, Minimize2, Maximize2 } from 'lucide-react'
import axios from 'axios'
import { API_URL } from '../lib/config'

export default function AIAssistant({ analysisResult, result, selectedText, onClearSelection }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  // Handle selected text from transcript
  useEffect(() => {
    if (selectedText && isOpen) {
      setInput(prev => prev ? `${prev}\n\nלגבי: "${selectedText}"` : `לגבי הטקסט הזה מהשיחה: "${selectedText}"`)
      inputRef.current?.focus()
    }
  }, [selectedText, isOpen])

  // Build call context for API
  const buildCallContext = () => {
    const context = {}
    
    if (result?.utterances) {
      const transcript = result.utterances.map(u => {
        const role = result.speaker_roles?.[u.speaker] || u.speaker
        return `[${role}]: ${u.text}`
      }).join('\n')
      context.transcript = transcript
    }
    
    if (analysisResult?.analysis) {
      context.analysis = analysisResult.analysis
    }
    
    return context
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    
    // Add user message to chat
    const newUserMsg = { role: 'user', content: userMessage }
    setMessages(prev => [...prev, newUserMsg])
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/api/assistant`, {
        message: userMessage,
        history: messages,
        call_context: buildCallContext(),
        selected_text: selectedText || ''
      })

      if (response.data.success) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.data.response 
        }])
        
        // Clear selected text after using it
        if (selectedText && onClearSelection) {
          onClearSelection()
        }
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'מצטער, משהו השתבש. נסה שוב.' 
        }])
      }
    } catch (error) {
      console.error('Assistant error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'שגיאה בחיבור לשרת. נסה שוב.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const suggestedQuestions = [
    "איך הייתי יכול להתמודד טוב יותר עם ההתנגדות?",
    "תן לי סיפור שיעזור לסגור את העסקה",
    "מה היו הרגעים הקריטיים בשיחה?",
    "איך אני יכול לשפר את ה-discovery?",
    "תן לי סקריפט לסגירה"
  ]

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full shadow-2xl shadow-indigo-500/30 flex items-center justify-center hover:scale-110 transition-all z-50 group"
        >
          <Sparkles className="w-6 h-6 text-white group-hover:animate-pulse" />
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
            AI
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed z-50 transition-all duration-300 ${
          isMinimized 
            ? 'bottom-6 right-6 w-72' 
            : 'inset-4 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[400px] sm:max-w-[calc(100vw-2rem)] sm:h-[600px] sm:max-h-[calc(100vh-6rem)]'
        }`}>
          <div className={`bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 overflow-hidden flex flex-col ${
            isMinimized ? 'h-auto' : 'h-full'
          }`}>
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-indigo-500/10 to-violet-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200">AI Sales Coach</h3>
                    <p className="text-xs text-slate-500">מאמן מכירות אישי</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <button
                      onClick={clearChat}
                      className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                      title="נקה צ'אט"
                    >
                      <Trash2 className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    {isMinimized ? (
                      <Maximize2 className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Minimize2 className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-indigo-400" />
                      </div>
                      <h4 className="text-slate-300 font-medium mb-2">מה תרצה לשאול?</h4>
                      <p className="text-slate-500 text-sm mb-6">אני יכול לעזור לך לנתח את השיחה, לתת סקריפטים, וליצור סיפורים</p>
                      
                      {/* Suggested Questions */}
                      <div className="space-y-2">
                        {suggestedQuestions.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setInput(q)
                              inputRef.current?.focus()
                            }}
                            className="block w-full text-right px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl text-sm text-slate-400 hover:text-slate-200 transition-colors border border-slate-700/50"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] ${
                          msg.role === 'user'
                            ? 'bg-indigo-500/20 border border-indigo-500/30'
                            : 'bg-slate-800/50 border border-slate-700/50'
                        } rounded-2xl p-4`}>
                          {msg.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-4 h-4 text-indigo-400" />
                              <span className="text-xs text-indigo-400 font-medium">AI Coach</span>
                              <button
                                onClick={() => copyToClipboard(msg.content, i)}
                                className="ml-auto p-1 hover:bg-slate-700/50 rounded transition-colors"
                              >
                                {copied === i ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-500" />
                                )}
                              </button>
                            </div>
                          )}
                          <p className={`text-sm whitespace-pre-wrap leading-relaxed ${
                            msg.role === 'user' ? 'text-slate-200' : 'text-slate-300'
                          }`}>
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                          <span className="text-sm text-slate-400">חושב...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Selected Text Indicator */}
                {selectedText && (
                  <div className="px-4 py-2 bg-violet-500/10 border-t border-violet-500/20">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-violet-400 truncate flex-1">
                        📌 נבחר: "{selectedText.substring(0, 50)}..."
                      </p>
                      <button
                        onClick={onClearSelection}
                        className="text-xs text-slate-500 hover:text-slate-300"
                      >
                        נקה
                      </button>
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-slate-700/50">
                  <div className="flex gap-2">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="שאל שאלה על השיחה..."
                      className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 resize-none"
                      rows={1}
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || loading}
                      className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Send className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 text-center">
                    Shift + Enter לשורה חדשה
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
