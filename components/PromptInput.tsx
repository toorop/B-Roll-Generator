import React from 'react';
import { Spinner } from './Spinner';
import { SparklesIcon } from './icons/SparklesIcon';

interface PromptInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  rows?: number;
  onEnhanceClick: () => void;
  isEnhancing: boolean;
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  onDismissSuggestions: () => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
  onEnhanceClick,
  isEnhancing,
  suggestions,
  onSuggestionClick,
  onDismissSuggestions
}) => {
  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
      <div className="relative">
        <textarea
          id={id}
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-background border border-background-lighter rounded-lg p-2 pr-28 focus:ring-2 focus:ring-brand-primary outline-none transition"
        />
        <button
          onClick={onEnhanceClick}
          disabled={isEnhancing || !value.trim()}
          className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          aria-label="Enhance prompt with AI"
        >
          {isEnhancing ? (
            <Spinner className="w-4 h-4" />
          ) : (
            <SparklesIcon className="w-4 h-4" />
          )}
          Enhance
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-2 p-3 bg-background rounded-lg border border-background-lighter space-y-2 animate-fade-in">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-sm font-semibold text-text-secondary">Suggestions</h4>
            <button onClick={onDismissSuggestions} className="text-text-muted hover:text-text-primary text-xs" aria-label="Dismiss suggestions">
              Close
            </button>
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion)}
              className="w-full text-left p-2 bg-background-lighter hover:bg-brand-dark rounded-md text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
