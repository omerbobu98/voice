import React, { useState } from 'react';
import {
  X,
  Volume2,
  Copy,
  Check,
  Sparkles,
  Shield,
  Ban,
  BookOpen,
  Send,
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../../lib/config';

const NodeDetailPanel = ({
  node,
  onClose,
  onSaveScript,
  language = 'en',
}) => {
  const [copied, setCopied] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showCoachingTips, setShowCoachingTips] = useState(false);
  const [activeTab, setActiveTab] = useState('content'); // content, handle, prevent, story, ai

  if (!node) return null;

  const isObjection = node.node_type === 'objection';
  const isStory = node.node_type === 'story';

  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayAudio = async (text, audioKey) => {
    if (playingAudio === audioKey) {
      setPlayingAudio(null);
      return;
    }

    try {
      setPlayingAudio(audioKey);
      const response = await axios.post(`${API_URL}/api/tts`, {
        text,
        voice: 'nova',
        hd: true,
        speed: 0.9,
      });

      if (response.data.audio_url) {
        const audio = new Audio(`${API_URL}${response.data.audio_url}`);
        audio.onended = () => setPlayingAudio(null);
        audio.onerror = () => setPlayingAudio(null);
        await audio.play();
      }
    } catch (error) {
      console.error('TTS error:', error);
      setPlayingAudio(null);
      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'he' ? 'he-IL' : 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => setPlayingAudio(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;

    setAiLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/mind-map/ai-generate`, {
        node_id: node.id,
        node_type: node.node_type,
        node_title: node.title,
        node_content: node.content,
        question: aiQuestion,
        language,
      });

      setAiResponse(response.data.response || 'No response generated.');
    } catch (error) {
      console.error('AI generation error:', error);
      setAiResponse('Failed to generate response. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const getTitle = () => {
    return language === 'he' && node.title_he ? node.title_he : node.title;
  };

  const getContent = () => {
    return language === 'he' && node.content_he ? node.content_he : node.content;
  };

  const renderContentSection = (title, content, audioKey) => (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-300">{title}</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePlayAudio(content, audioKey)}
            className={`p-1.5 rounded-lg transition-colors ${
              playingAudio === audioKey
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-400'
            }`}
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleCopy(content)}
            className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-400 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed">{content}</p>
    </div>
  );

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-gray-900 border-l border-gray-700 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div
        className="p-4 border-b border-gray-700 flex items-center justify-between"
        style={{ backgroundColor: `${node.categoryColor}15` }}
      >
        <div className="flex items-center gap-3">
          {isObjection && <AlertTriangle className="w-5 h-5 text-orange-400" />}
          {isStory && <BookOpen className="w-5 h-5 text-emerald-400" />}
          <div>
            <span
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: node.categoryColor }}
            >
              {node.node_type}
            </span>
            <h3 className="text-lg font-bold text-white">{getTitle()}</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Tabs for Objections */}
      {isObjection && (
        <div className="flex border-b border-gray-700">
          {['content', 'handle', 'prevent', 'ai'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-white border-b-2'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              style={{
                borderColor: activeTab === tab ? node.categoryColor : 'transparent',
              }}
            >
              {tab === 'content' && (language === 'he' ? 'תוכן' : 'Content')}
              {tab === 'handle' && (language === 'he' ? 'טיפול' : 'Handle')}
              {tab === 'prevent' && (language === 'he' ? 'מניעה' : 'Prevent')}
              {tab === 'ai' && 'AI'}
            </button>
          ))}
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Main Content / Objection Content Tab */}
        {(!isObjection || activeTab === 'content') && (
          <>
            {renderContentSection(
              language === 'he' ? 'תוכן' : 'Content',
              getContent(),
              'content'
            )}

            {/* Coaching Tips */}
            {node.coaching_tips && node.coaching_tips.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowCoachingTips(!showCoachingTips)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-800/70 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-semibold text-gray-300">
                      {language === 'he' ? 'טיפים לאימון' : 'Coaching Tips'}
                    </span>
                    <span className="text-xs text-gray-500">({node.coaching_tips.length})</span>
                  </div>
                  {showCoachingTips ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {showCoachingTips && (
                  <div className="px-4 pb-4 space-y-2">
                    {node.coaching_tips.map((tip, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-400"
                      >
                        <span className="text-yellow-400">•</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Why It Works */}
            {node.why_it_works && (
              <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-emerald-400 mb-2">
                  {language === 'he' ? 'למה זה עובד' : 'Why It Works'}
                </h4>
                <p className="text-sm text-gray-300">
                  {language === 'he' && node.why_it_works_he
                    ? node.why_it_works_he
                    : node.why_it_works}
                </p>
              </div>
            )}
          </>
        )}

        {/* Handle Tab (Objections) */}
        {isObjection && activeTab === 'handle' && node.handle_script && (
          <>
            {renderContentSection(
              language === 'he' ? 'סקריפט לטיפול' : 'Handle Script',
              language === 'he' && node.handle_script_he
                ? node.handle_script_he
                : node.handle_script,
              'handle'
            )}
            {node.technique && (
              <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3">
                <span className="text-xs text-blue-400 font-medium">
                  Technique: {node.technique.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            )}
          </>
        )}

        {/* Prevent Tab (Objections) */}
        {isObjection && activeTab === 'prevent' && node.prevent_script && (
          renderContentSection(
            language === 'he' ? 'סקריפט מניעה' : 'Prevention Script',
            language === 'he' && node.prevent_script_he
              ? node.prevent_script_he
              : node.prevent_script,
            'prevent'
          )
        )}

        {/* AI Tab or Non-Objection AI Section */}
        {(activeTab === 'ai' || !isObjection) && (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-semibold text-gray-300">
                {language === 'he' ? 'שאל את הAI' : 'Ask AI'}
              </h4>
            </div>

            <div className="space-y-3">
              <textarea
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder={
                  language === 'he'
                    ? 'שאל שאלה על תוכן זה...'
                    : 'Ask a question about this content...'
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={3}
              />

              <button
                onClick={handleAskAI}
                disabled={aiLoading || !aiQuestion.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-white font-medium transition-colors"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'he' ? 'מייצר...' : 'Generating...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{language === 'he' ? 'שלח' : 'Generate'}</span>
                  </>
                )}
              </button>

              {aiResponse && (
                <div className="bg-gray-700/50 rounded-lg p-3 border border-purple-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-purple-400 font-medium">AI Response</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePlayAudio(aiResponse, 'ai')}
                        className={`p-1 rounded transition-colors ${
                          playingAudio === 'ai' ? 'text-purple-400' : 'text-gray-500 hover:text-gray-400'
                        }`}
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleCopy(aiResponse)}
                        className="p-1 rounded text-gray-500 hover:text-gray-400 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{aiResponse}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-700 flex items-center gap-3">
        <button
          onClick={() => onSaveScript && onSaveScript(node)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>{language === 'he' ? 'שמור לסקריפטים שלי' : 'Save to My Scripts'}</span>
        </button>
      </div>
    </div>
  );
};

export default NodeDetailPanel;
