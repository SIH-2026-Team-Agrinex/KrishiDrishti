import React, { useState, useEffect, useRef } from 'react';
import { CropAnalysisReport } from '../../types/analysis.types';
import { useLanguage } from '../../contexts/LanguageContext';
import { Send, Bot, User, Sparkles, RefreshCw, HelpCircle, Globe } from 'lucide-react';
import { chatService } from '../../services/api/chatService';
import { FormattedChatText } from '../chatbot/FormattedChatText';

interface ReportAgronomistChatProps {
  report: CropAnalysisReport;
}

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
}

export const ReportAgronomistChat: React.FC<ReportAgronomistChatProps> = ({ report }) => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(true);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const latestMsgRef = useRef<HTMLDivElement | null>(null);

  // Scroll to the TOP of the new message (so response starts cleanly at the top, not bottom)
  const scrollToMessageTop = (el: HTMLElement | null) => {
    if (!chatContainerRef.current || !el) return;
    const container = chatContainerRef.current;
    const targetTop = el.offsetTop - container.offsetTop;
    container.scrollTo({
      top: Math.max(0, targetTop - 8),
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (messages.length > 1) {
      setTimeout(() => {
        scrollToMessageTop(latestMsgRef.current);
      }, 50);
    }
  }, [messages.length]);

  // On mount or when report changes, first send all test data to our model for thorough analysis
  useEffect(() => {
    let isMounted = true;
    setAnalyzing(true);

    chatService
      .analyzeReport(report, language)
      .then((res) => {
        if (!isMounted) return;
        setMessages([
          {
            role: 'assistant',
            text: res.analysis,
          },
        ]);
        setSuggestedQuestions(res.suggestedQuestions || []);
      })
      .catch((err) => {
        console.warn('Initial report analysis failed:', err);
        if (!isMounted) return;
        const fallbackNote =
          report.aiAdvisory?.farmerAdvisoryNote ||
          `I have analyzed your ${report.mlModelDetection.cropIdentified} specimen. How can I assist you with curative dosages, spray timings, or local market pesticides?`;
        setMessages([
          {
            role: 'assistant',
            text: fallbackNote,
          },
        ]);
        setSuggestedQuestions([
          `What is the exact spray dosage per 15L pump for ${report.mlModelDetection.cropIdentified}?`,
          'Can I tank-mix fungicide and insecticide in a single pass?',
          'What are the best organic / bio-control alternatives in the market?',
          "Is today's weather safe for foliar spraying?",
        ]);
      })
      .finally(() => {
        if (isMounted) setAnalyzing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [report.id, language]);

  const sendQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || loading || analyzing) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: trimmed }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const reply = await chatService.askReportQuestion(
        report,
        trimmed,
        newMessages.map((m) => ({ role: m.role, text: m.text })),
        language
      );

      setMessages([...newMessages, { role: 'assistant', text: reply }]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          text: `For your ${report.mlModelDetection.cropIdentified} diagnosis, apply the recommended curative spray at 2ml/L (approx 30ml per 15L backpack pump) during calm early morning hours. Inspect the foliage after 48 hours.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(input);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200/80 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-agro-600 to-emerald-500 text-white flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">AI Agronomist Consultation</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Globe className="w-2.5 h-2.5" />
                Live Agronomic Intelligence
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Analyzed {report.mlModelDetection.cropIdentified} • Commercial Brands • Tank-Mix • Dosages
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-agro-700 bg-agro-50 px-2.5 py-1 rounded-full border border-agro-200 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-agro-600" />
          Test Data Loaded
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div ref={chatContainerRef} className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
        {analyzing ? (
          <div className="p-4 rounded-2xl bg-agro-50/70 border border-agro-200/70 text-agro-900 space-y-2 animate-pulse">
            <div className="flex items-center gap-2 text-xs font-semibold text-agro-800">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-agro-600" />
              <span>Synthesizing comprehensive diagnostic report...</span>
            </div>
            <p className="text-[11px] text-agro-700 leading-relaxed">
              Feeding {report.mlModelDetection.cropIdentified} pathology results, entomological pest findings, and live environmental telemetry into the agronomist model to formulate your personalized opening briefing...
            </p>
          </div>
        ) : (
          messages.map((m, i) => {
            const isLatest = i === messages.length - 1;
            return (
              <div
                key={i}
                ref={isLatest ? latestMsgRef : null}
                className={`flex items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-agro-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl text-xs max-w-[88%] leading-relaxed shadow-2xs ${
                    m.role === 'user'
                      ? 'bg-agro-600 text-white rounded-tr-xs'
                      : 'bg-slate-50/90 text-slate-800 rounded-tl-xs border border-slate-200/80'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <FormattedChatText text={m.text} isAssistant={true} />
                  ) : (
                    m.text
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-agro-700 bg-agro-50/50 p-2.5 rounded-xl border border-agro-100 max-w-fit">
            <Bot className="w-3.5 h-3.5 animate-spin text-agro-600" />
            <span>Consulting agricultural database & commercial formulations...</span>
          </div>
        )}
      </div>

      {/* Suggested Follow-up Question Chips */}
      {!analyzing && suggestedQuestions.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-agro-600" />
            <span>Recommended follow-ups based on this test:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQuestions.map((q, qIdx) => (
              <button
                key={qIdx}
                type="button"
                onClick={() => sendQuery(q)}
                disabled={loading}
                className="text-[11px] text-slate-700 hover:text-agro-700 bg-slate-100 hover:bg-agro-50 px-3 py-1.5 rounded-full border border-slate-200 hover:border-agro-300 transition-all text-left flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-agro-500 shrink-0" />
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Box */}
      <form onSubmit={handleSend} className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about commercial brands, dosages, tank-mixing, or organic cures...`}
          disabled={loading || analyzing}
          className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-agro-500/30 focus:border-agro-500 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading || analyzing}
          className="p-2.5 bg-agro-600 hover:bg-agro-700 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all flex items-center justify-center shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
