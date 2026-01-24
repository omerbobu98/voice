import React, { useState, useRef, useEffect } from 'react';
import { X, MessageCircle, Lightbulb, User, Volume2, Square, Loader2, Send, Brain, AlertTriangle, Target, Eye, Dumbbell } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../../lib/config';
import { supabase } from '../../../lib/supabase';

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
};

const NodeDetailPanel = ({ node, onClose, treeInfo }) => {
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const audioRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setAudioProgress(0);
    setAudioCurrentTime(0);
    setAudioDuration(0);
    setShowAIChat(false);
    setAiMessages([]);
  }, [node?.id]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages]);

  if (!node) return null;

  const data = node.data || {};

  const getSpeakerLabel = () => {
    if (data.speaker === 'seller') return 'Seller';
    if (data.speaker === 'customer') return 'Customer';
    return 'System';
  };

  const getSpeakerColor = () => {
    if (data.speaker === 'seller') return 'text-purple-400';
    if (data.speaker === 'customer') return 'text-emerald-400';
    return 'text-blue-400';
  };

  const handlePlayAudio = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
      setAudioProgress(0);
      return;
    }

    setIsLoadingAudio(true);
    try {
      const response = await axios.post(`${API_URL}/api/tts`, {
        text: data.content || data.shortContent,
        voice: 'nova',
        hd: true,
        speed: 0.9,
      });

      if (response.data.audio_url) {
        const audio = new Audio(`${API_URL}${response.data.audio_url}`);
        audioRef.current = audio;

        audio.addEventListener('loadedmetadata', () => {
          setAudioDuration(audio.duration);
        });

        audio.addEventListener('timeupdate', () => {
          setAudioCurrentTime(audio.currentTime);
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        });

        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          setAudioProgress(0);
          setAudioCurrentTime(0);
          audioRef.current = null;
        });

        audio.addEventListener('error', () => {
          setIsPlaying(false);
          setIsLoadingAudio(false);
          audioRef.current = null;
        });

        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('TTS Error:', err);
      const utterance = new SpeechSynthesisUtterance(data.content || data.shortContent);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setAudioProgress(0);
    setAudioCurrentTime(0);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAskAI = async () => {
    if (!aiInput.trim()) return;

    const userMessage = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAiLoading(true);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/api/node-chat`,
        {
          node_id: node.id,
          message: userMessage,
          node_data: data,  // Pass full node data for sample/demo nodes
        },
        { headers }
      );

      setAiMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (err) {
      console.error('AI Chat Error:', err);
      setAiMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="absolute right-4 top-4 bottom-4 w-96 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center gap-2">
          <User className={`w-4 h-4 ${getSpeakerColor()}`} />
          <span className={`text-sm font-medium ${getSpeakerColor()}`}>
            {getSpeakerLabel()}
          </span>
          {data.stage && (
            <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
              {data.stage}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!showAIChat ? (
          <>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">{data.title}</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{data.content || data.shortContent}</p>
            </div>

            {data.branchLabel && (
              <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <span className="text-xs text-gray-400 block mb-1">Branch Condition</span>
                <span className="text-sm text-white italic">"{data.branchLabel}"</span>
              </div>
            )}

            {data.successProbability !== undefined && (
              <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <span className="text-xs text-gray-400 block mb-2">Success Probability</span>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${data.successProbability >= 0.6 ? 'bg-emerald-500' : data.successProbability >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${data.successProbability * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-white">
                    {Math.round(data.successProbability * 100)}%
                  </span>
                </div>
              </div>
            )}

            {data.coachingTips && data.coachingTips.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-400">Coaching Tips</span>
                </div>
                <ul className="space-y-2">
                  {data.coachingTips.map((tip, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-300 pl-4 border-l-2 border-yellow-500/30"
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.whyItWorks && (
              <div className="p-3 bg-emerald-900/20 rounded-lg border border-emerald-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Why This Works</span>
                </div>
                <p className="text-sm text-gray-300">{data.whyItWorks}</p>
              </div>
            )}

            {data.commonMistakes && data.commonMistakes.length > 0 && (
              <div className="p-3 bg-red-900/20 rounded-lg border border-red-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">Common Mistakes to Avoid</span>
                </div>
                <ul className="space-y-1">
                  {data.commonMistakes.map((mistake, index) => (
                    <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-red-400">✗</span>
                      <span>{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.practiceTip && (
              <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">Practice Exercise</span>
                </div>
                <p className="text-sm text-gray-300">{data.practiceTip}</p>
              </div>
            )}

            {data.customerMindset && (
              <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-400">Customer's Mindset</span>
                </div>
                <p className="text-sm text-gray-300 italic">"{data.customerMindset}"</p>
              </div>
            )}

            {data.signalsToNotice && data.signalsToNotice.length > 0 && (
              <div className="p-3 bg-cyan-900/20 rounded-lg border border-cyan-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-400">Signals to Notice</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.signalsToNotice.map((signal, index) => (
                    <span key={index} className="px-2 py-1 bg-cyan-900/30 text-cyan-300 text-xs rounded-full">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-purple-400">AI Coach</span>
              <button
                onClick={() => setShowAIChat(false)}
                className="text-xs text-gray-400 hover:text-white"
              >
                ← Back to details
              </button>
            </div>
            
            <div className="flex-1 space-y-3 overflow-y-auto mb-3">
              {aiMessages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Ask me anything about this conversation point!</p>
                  <p className="text-xs mt-1">e.g., "How should I respond to this objection?"</p>
                </div>
              )}
              {aiMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-purple-600/20 text-purple-200 ml-6'
                      : 'bg-gray-800 text-gray-300 mr-6'
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {isAiLoading && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-700 bg-gray-800/50 space-y-2">
        {showAIChat ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAskAI()}
              placeholder="Ask the AI coach..."
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              disabled={isAiLoading}
            />
            <button
              onClick={handleAskAI}
              disabled={isAiLoading || !aiInput.trim()}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setShowAIChat(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Ask AI About This</span>
            </button>

            {(data.content || data.shortContent) && (
              <div className="space-y-2">
                {isPlaying && (
                  <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1">
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 transition-all duration-200"
                            style={{ width: `${audioProgress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 font-mono min-w-[60px]">
                        {formatTime(audioCurrentTime)} / {formatTime(audioDuration)}
                      </span>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={isPlaying ? handleStopAudio : handlePlayAudio}
                  disabled={isLoadingAudio}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isPlaying
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  {isLoadingAudio ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Loading...</span>
                    </>
                  ) : isPlaying ? (
                    <>
                      <Square className="w-4 h-4" />
                      <span className="text-sm">Stop Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span className="text-sm">Play Audio</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NodeDetailPanel;
