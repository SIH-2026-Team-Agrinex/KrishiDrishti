import React, { useState } from 'react';
import { CrossQuestionRequest } from '../../types/analysis.types';
import { 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  Leaf, 
  AlertCircle,
  MessageSquare
} from 'lucide-react';

interface CrossQuestioningModalProps {
  crossQuestionData: CrossQuestionRequest;
  imageThumbnail?: string;
  onSubmitAnswers: (answers: Record<string, string>, notes?: string) => void;
  onCancel?: () => void;
}

export const CrossQuestioningModal: React.FC<CrossQuestioningModalProps> = ({
  crossQuestionData,
  imageThumbnail,
  onSubmitAnswers,
  onCancel,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    crossQuestionData.questions.forEach((q) => {
      initial[q.id] = q.options[0]; // Pre-select first option for ease
    });
    return initial;
  });

  const [extraFarmerNote, setExtraFarmerNote] = useState('');

  const handleSelectOption = (questionId: string, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitAnswers(selectedAnswers, extraFarmerNote.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-5 sm:p-7 border border-agro-200 text-left relative my-8 overflow-hidden">
        
        {/* Top Header Banner */}
        <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 border border-amber-300 shadow-sm">
            <HelpCircle className="w-6 h-6 text-amber-700" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                Crop Clarification Required
              </span>
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <Leaf className="w-3 h-3 text-emerald-600" />
                {crossQuestionData.cropName}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1 leading-snug">
              AI Agronomist Cross-Examination
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {crossQuestionData.reason}
            </p>
          </div>
        </div>

        {/* Optional Image Preview */}
        {imageThumbnail && (
          <div className="my-3 p-2 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
            <img 
              src={imageThumbnail} 
              alt="Uploaded specimen" 
              className="w-12 h-12 rounded-xl object-cover border border-slate-300 flex-shrink-0"
            />
            <div className="text-[11px] text-slate-600">
              <span className="font-semibold text-slate-800">Your Uploaded Specimen: </span>
              Analyzing visible lesion patterns to eliminate false positives and fake results.
            </div>
          </div>
        )}

        {/* Interactive Questions Form */}
        <form onSubmit={handleSubmit} className="space-y-4 my-4 max-h-[50vh] overflow-y-auto pr-1">
          {crossQuestionData.questions.map((q, qIdx) => (
            <div key={q.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-agro-700 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                  {qIdx + 1}
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {q.question}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 italic">
                    Reason: {q.whyAsking}
                  </p>
                </div>
              </div>

              {/* Clickable Option Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[q.id] === opt;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(q.id, opt)}
                      className={`text-left p-2 rounded-xl text-xs transition-all flex items-center justify-between gap-2 border ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-semibold border-emerald-600 shadow-sm ring-2 ring-emerald-200'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <span className="leading-tight text-[11px]">{opt}</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white flex-shrink-0" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-slate-300 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Optional Extra Notes */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>Any other symptoms noticed? (Optional)</span>
            </label>
            <input
              type="text"
              value={extraFarmerNote}
              onChange={(e) => setExtraFarmerNote(e.target.value)}
              placeholder="e.g., noticed white mites under leaves, or fertilizer applied 3 days ago..."
              className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-agro-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-agro-700 to-emerald-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-agro-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Submit Details & Complete Diagnosis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 mt-2">
          <AlertCircle className="w-3.5 h-3.5 text-agro-600" />
          <span>KrishiDrishti AI validates against real farmer inputs only. No canned or fake assumptions.</span>
        </div>
      </div>
    </div>
  );
};
