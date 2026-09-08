import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User as UserIcon, 
  Trash2, 
  History,
  PlusCircle,
  ChevronLeft,
  ArrowDown,
  MessageSquare,
  Clock
} from 'lucide-react';
import { ChatMessage, ChatSession } from '../../types/chat.types';
import { chatService, buildDynamicSuggestions } from '../../services/api/chatService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { ChatVisualCard } from './ChatVisualCard';
import { FormattedChatText } from './FormattedChatText';
import { localDb } from '../../services/db/localDb';

export const FloatingChatbot: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { location } = useLocation();

  const [liveStatus, setLiveStatus] = useState(() => chatService.getLiveStatus());
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // History & Sessions State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => localDb.getActiveSessionId());
  
  // Smart Scroll State
  const [hasNewMessageBelow, setHasNewMessageBelow] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Monitor network status
  useEffect(() => {
    const handleStatus = () => setLiveStatus(chatService.getLiveStatus());
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  // Refresh sessions list
  const refreshSessions = useCallback(() => {
    const allSessions = chatService.getChatSessions();
    setSessions(allSessions);
  }, []);

  // Load initial messages on language or location change
  useEffect(() => {
    if (!isAuthenticated) return;

    const stored = chatService.getStoredMessages(language, {
      crops: user?.cropInterests,
      city: location?.city,
    }, activeSessionId || undefined);

    setMessages(stored);
    setActiveSessionId(localDb.getActiveSessionId());
    refreshSessions();
  }, [language, user?.cropInterests, location?.city, activeSessionId, isAuthenticated, refreshSessions]);

  // Scroll detection handler
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceToBottom < 65;
    isNearBottomRef.current = nearBottom;
    if (nearBottom) {
      setHasNewMessageBelow(false);
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior,
    });
    setHasNewMessageBelow(false);
    isNearBottomRef.current = true;
  };

  // Send message
  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputVal).trim();
    if (!query || isLoading) return;

    setInputVal('');
    setIsLoading(true);

    // Optimistically show user message
    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    
    // User triggered an action -> auto-scroll to show their query
    setTimeout(() => scrollToBottom('smooth'), 50);

    try {
      const botResponse = await chatService.sendMessage(query, {
        cropName: user?.cropInterests?.[0],
        location,
        language,
        sessionId: activeSessionId || undefined,
      });

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        tempUserMsg,
        botResponse,
      ]);

      // IMPORTANT REQUIREMENT:
      // "Whenevery output generates it should not go auto down , it should be at the position at which user currently is."
      // If user scrolled up to read earlier text, PRESERVE their scroll position and show the pill badge.
      if (!isNearBottomRef.current) {
        setHasNewMessageBelow(true);
      } else {
        // User was already at bottom -> gently align
        setTimeout(() => scrollToBottom('smooth'), 80);
      }

      refreshSessions();
    } catch (err) {
      console.error('Chat send error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // End Current Session and Start a Fresh Chat
  const handleEndSessionAndNewChat = () => {
    const newSession = chatService.startNewSession(language, {
      crops: user?.cropInterests,
      city: location?.city,
    });
    setActiveSessionId(newSession.id);
    setMessages(newSession.messages);
    setIsHistoryOpen(false);
    refreshSessions();
    setTimeout(() => scrollToBottom('auto'), 50);
  };

  // Switch to a past session from History
  const handleSelectSession = (sessionId: string) => {
    const loaded = chatService.loadSession(sessionId);
    if (loaded) {
      setActiveSessionId(loaded.id);
      setMessages(loaded.messages);
      setIsHistoryOpen(false);
      setTimeout(() => scrollToBottom('auto'), 50);
    }
  };

  // Delete a past session from storage
  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    chatService.deleteSession(sessionId);
    refreshSessions();
    if (activeSessionId === sessionId) {
      handleEndSessionAndNewChat();
    }
  };

  // Clear current active conversation
  const handleClearCurrent = () => {
    chatService.clearChat(activeSessionId || undefined);
    const welcome = chatService.getWelcomeGreeting(language);
    const resetMsg: ChatMessage = {
      id: `msg_welcome_${Date.now()}`,
      sender: 'assistant',
      text: welcome,
      timestamp: new Date().toISOString(),
      suggestions: buildDynamicSuggestions(language, user?.cropInterests, location?.city),
    };
    setMessages([resetMsg]);
    localDb.saveChatMessage(resetMsg, activeSessionId || undefined);
    refreshSessions();
  };

  if (!isAuthenticated) return null;

  const dynamicFallbackSuggestions = buildDynamicSuggestions(
    language,
    user?.cropInterests,
    location?.city,
    0
  );

  const latestSuggestions = messages[messages.length - 1]?.suggestions || dynamicFallbackSuggestions;

  return (
    <div className="fixed bottom-5 right-5 z-50 no-print">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            refreshSessions();
            setTimeout(() => scrollToBottom('auto'), 80);
          }}
          className="group relative flex items-center gap-3 bg-gradient-to-r from-agro-700 via-agro-600 to-emerald-500 text-white p-4 rounded-full shadow-2xl shadow-agro-600/40 hover:shadow-agro-600/60 hover:scale-105 transition-all duration-300 border-2 border-white/40 cursor-pointer"
          aria-label="KrishiDrishti AI"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse" />
            {liveStatus.isLive ? (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5" title="Live Model Connected">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-agro-800"></span>
              </span>
            ) : (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5" title="Standby Mode (Local DB)">
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400 border-2 border-agro-800"></span>
              </span>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2 pr-1">
            <span className="font-semibold text-sm">KrishiDrishti AI</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ring-2 ring-white/30 ${
                liveStatus.isLive ? 'bg-emerald-300 animate-pulse' : 'bg-amber-300'
              }`}
              title={liveStatus.isLive ? 'Live Mode Active' : 'Standby Mode'}
            />
          </div>
          <div
            className={`absolute -top-2 -left-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm ${
              liveStatus.isLive
                ? 'bg-emerald-400 text-emerald-950'
                : 'bg-amber-400 text-amber-950'
            }`}
          >
            {liveStatus.isLive ? 'LIVE 24/7' : 'AI 24/7'}
          </div>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="w-[94vw] sm:w-[440px] h-[600px] max-h-[86vh] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-agro-800 via-agro-700 to-emerald-800 text-white p-3.5 sm:p-4 flex items-center justify-between shadow-md select-none">
            <div className="flex items-center gap-2.5">
              {isHistoryOpen ? (
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1.5 -ml-1 text-agro-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Back</span>
                </button>
              ) : (
                <div className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 flex-shrink-0">
                  <Bot className="w-5 h-5 text-emerald-300" />
                </div>
              )}
              
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-2">
                  <span>{isHistoryOpen ? 'Msg History' : t('chat_title')}</span>
                  {!isHistoryOpen && (
                    liveStatus.isLive ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/25 text-emerald-200 border border-emerald-400/50 shadow-sm"
                        title={`Live AI: ${liveStatus.provider}`}
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                        </span>
                        <span>LIVE</span>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/40"
                        title="Standby Mode (Local Farm DB)"
                      >
                        <span className="inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
                        <span>STANDBY</span>
                      </span>
                    )
                  )}
                </h3>
                <p className="text-[11px] text-agro-200 flex items-center gap-1.5 mt-0.5">
                  <span>{isHistoryOpen ? 'Saved Farm Consultations' : t('chat_advisory')}</span>
                  {liveStatus.isLive && !isHistoryOpen && (
                    <span className="text-[10px] text-emerald-300 font-medium">
                      • {liveStatus.provider}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-1">
              {/* Message History Button */}
              <button
                type="button"
                onClick={() => {
                  refreshSessions();
                  setIsHistoryOpen((prev) => !prev);
                }}
                className={`p-1.5 rounded-xl transition-all flex items-center gap-1 ${
                  isHistoryOpen 
                    ? 'bg-white text-agro-900 shadow-sm' 
                    : 'text-agro-200 hover:text-white hover:bg-white/10'
                }`}
                title="Message History"
              >
                <History className="w-4 h-4" />
                <span className="text-[10px] font-bold hidden sm:inline">History</span>
              </button>

              {/* End Session / Start New Chat Button */}
              <button
                type="button"
                onClick={handleEndSessionAndNewChat}
                className="p-1.5 text-agro-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1"
                title="End Session & Start New Chat"
              >
                <PlusCircle className="w-4 h-4 text-emerald-300" />
                <span className="text-[10px] font-bold hidden sm:inline">New</span>
              </button>

              {/* Reset/Clear Button */}
              <button
                type="button"
                onClick={handleClearCurrent}
                className="p-1.5 text-agro-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                title={t('chat_clear')}
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-agro-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                title={t('chat_close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* VIEW 1: HISTORY STORAGE DRAWER */}
          {isHistoryOpen ? (
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2.5 bg-slate-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-agro-600" />
                  Stored Chat Sessions ({sessions.length})
                </span>
                <button
                  type="button"
                  onClick={handleEndSessionAndNewChat}
                  className="text-[11px] font-bold text-agro-700 hover:text-agro-800 bg-agro-50 hover:bg-agro-100 border border-agro-200 px-2.5 py-1 rounded-xl transition-colors flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Start New Chat</span>
                </button>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-12 px-4 text-slate-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-medium">No previous chat sessions stored yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Whenever you consult the AI or end a session, history is securely saved here.</p>
                </div>
              ) : (
                sessions.map((sess) => {
                  const isActive = sess.id === activeSessionId;
                  const firstUserMsg = sess.messages.find((m) => m.sender === 'user')?.text;
                  const msgCount = sess.messages.length;
                  const timeFormatted = new Date(sess.lastActive).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={sess.id}
                      onClick={() => handleSelectSession(sess.id)}
                      className={`group p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isActive
                          ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                          : 'bg-white hover:bg-slate-100/80 border-slate-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                            {sess.title || firstUserMsg?.slice(0, 35) || 'Farm Consultation'}
                          </h4>
                          {isActive && (
                            <span className="text-[9px] font-extrabold bg-emerald-600 text-white px-2 py-0.2 rounded-full uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {firstUserMsg || sess.messages[0]?.text || 'No message content'}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                          <span>{timeFormatted}</span>
                          <span>•</span>
                          <span>{msgCount} messages</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(e, sess.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* VIEW 2: ACTIVE CONVERSATION FEED */
            <div className="flex-1 relative flex flex-col overflow-hidden bg-slate-50/70">
              
              {/* Messages Feed */}
              <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 scroll-smooth"
              >
                {messages.map((msg) => {
                  const isAssistant = msg.sender === 'assistant';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                    >
                      {isAssistant && (
                        <div className="w-7 h-7 rounded-xl bg-agro-100 text-agro-700 flex items-center justify-center flex-shrink-0 mt-0.5 border border-agro-200">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm overflow-hidden ${
                        isAssistant 
                          ? 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm' 
                          : 'bg-agro-600 text-white rounded-tr-sm'
                      }`}>
                        {/* Clear, Concise Rich Formatted Text */}
                        <FormattedChatText text={msg.text} isAssistant={isAssistant} />

                        {/* Interactive Visual Mediums (Weather/Spray, Pathology Diagram, Flowchart, GPS Map) */}
                        {isAssistant && msg.visualCard && (
                          <ChatVisualCard card={msg.visualCard} />
                        )}

                        {isAssistant && (
                          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>

                      {!isAssistant && (
                        <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <UserIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex gap-2.5 justify-start items-center animate-in fade-in">
                    <div className="w-7 h-7 rounded-xl bg-agro-100 text-agro-700 flex items-center justify-center border border-agro-200">
                      <Bot className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-white p-3 rounded-2xl rounded-tl-sm border border-slate-100 text-xs text-slate-500 flex items-center gap-1.5 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-agro-500 animate-pulse" />
                      <span>{t('chat_analyzing')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Floating "New Message Below" Indicator (Ensures user's scroll is not interrupted) */}
              {hasNewMessageBelow && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 animate-in fade-in slide-in-from-bottom-2">
                  <button
                    type="button"
                    onClick={() => scrollToBottom('smooth')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-agro-800 text-white text-xs font-bold rounded-full shadow-lg hover:bg-agro-900 transition-all border border-white/20"
                  >
                    <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
                    <span>New message</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Suggested Prompts (Only visible in Chat View) */}
          {!isHistoryOpen && latestSuggestions && latestSuggestions.length > 0 && (
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold text-slate-400 uppercase flex-shrink-0">
                {t('chat_quick')}
              </span>
              {latestSuggestions.slice(0, 3).map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="text-[11px] bg-agro-50 hover:bg-agro-100 text-agro-800 px-2.5 py-1 rounded-full whitespace-nowrap border border-agro-200 transition-colors flex-shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar (Only visible in Chat View) */}
          {!isHistoryOpen && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={t('chat_placeholder')}
                className="flex-1 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-transparent focus:border-agro-400 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isLoading}
                className="p-2.5 bg-agro-600 hover:bg-agro-700 disabled:opacity-40 text-white rounded-2xl shadow-md transition-all flex items-center justify-center flex-shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
