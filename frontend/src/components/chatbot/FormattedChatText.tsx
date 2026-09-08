import React from 'react';

interface FormattedChatTextProps {
  text: string;
  isAssistant?: boolean;
}

export const FormattedChatText: React.FC<FormattedChatTextProps> = ({ text, isAssistant = false }) => {
  if (!text) return null;

  // Split lines
  const lines = text.split('\n');

  // Helper to render bold strings within a line
  const renderFormattedLine = (line: string) => {
    // Check for bold matches **text**
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className={`font-bold ${isAssistant ? 'text-slate-900' : 'text-white'}`}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="space-y-1.5 leading-relaxed text-xs sm:text-sm break-words overflow-hidden">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Heading 3 or 2
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
          const headingText = trimmed.replace(/^#{2,3}\s+/, '');
          return (
            <h5 
              key={idx} 
              className={`font-bold text-xs sm:text-sm mt-2 mb-1 flex items-center gap-1.5 ${
                isAssistant ? 'text-emerald-900 border-b border-slate-100 pb-0.5' : 'text-white'
              }`}
            >
              {renderFormattedLine(headingText)}
            </h5>
          );
        }

        // Bullet point
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletText = trimmed.replace(/^[•\-\*]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className={`text-xs mt-0.5 flex-shrink-0 ${isAssistant ? 'text-emerald-600 font-bold' : 'text-emerald-200'}`}>
                •
              </span>
              <div className="flex-1 min-w-0">
                {renderFormattedLine(bulletText)}
              </div>
            </div>
          );
        }

        // Numbered list item e.g. "1. " or "2. "
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          const num = numMatch[1];
          const rest = numMatch[2];
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full mt-0.5 flex-shrink-0 ${
                isAssistant ? 'bg-emerald-100 text-emerald-800' : 'bg-white/20 text-white'
              }`}>
                {num}
              </span>
              <div className="flex-1 min-w-0">
                {renderFormattedLine(rest)}
              </div>
            </div>
          );
        }

        // Standard paragraph line
        return (
          <p key={idx} className={isAssistant ? 'text-slate-800' : 'text-white'}>
            {renderFormattedLine(line)}
          </p>
        );
      })}
    </div>
  );
};
