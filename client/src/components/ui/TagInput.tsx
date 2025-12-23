'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { X, Tag as TagIcon, Plus } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
  disabled?: boolean;
}

export default function TagInput({
  tags,
  onChange,
  placeholder = 'Add a tag...',
  maxTags = 10,
  className = '',
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    
    // Validate tag
    if (!trimmedTag) {
      setInputValue('');
      return;
    }
    
    if (tags.length >= maxTags) {
      // Could show a toast here
      return;
    }
    
    if (tags.includes(trimmedTag)) {
      setInputValue('');
      return; // Tag already exists
    }
    
    if (trimmedTag.length > 30) {
      // Could show error message
      return;
    }
    
    // Only allow alphanumeric, hyphens, and underscores
    // Remove invalid characters instead of rejecting
    const cleanedTag = trimmedTag.replace(/[^a-z0-9-_]/g, '');
    
    if (!cleanedTag) {
      // Invalid characters only
      setInputValue('');
      return;
    }
    
    if (tags.includes(cleanedTag)) {
      setInputValue('');
      return;
    }
    
    onChange([...tags, cleanedTag]);
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter key
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const trimmedValue = inputValue.trim();
      if (trimmedValue) {
        addTag(trimmedValue);
        // Focus back to input after adding
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }
      return false;
    }
    
    // Handle comma key
    if (e.key === ',') {
      e.preventDefault();
      e.stopPropagation();
      const trimmedValue = inputValue.trim();
      if (trimmedValue) {
        addTag(trimmedValue);
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }
      return false;
    }
    
    // Handle Backspace to remove last tag
    if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      e.preventDefault();
      removeTag(tags[tags.length - 1]);
      return false;
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const pastedTags = pastedText.split(/[,\s]+/).filter(t => t.trim());
    
    pastedTags.forEach(tag => {
      if (tags.length < maxTags && !tags.includes(tag.trim().toLowerCase())) {
        addTag(tag);
      }
    });
  };

  // Handle input change to clean input value
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle form submit prevention
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  return (
    <div 
      className={`tag-input-wrapper ${className}`}
      onKeyDown={(e) => {
        // Prevent form submission if Enter is pressed anywhere in the wrapper
        if (e.key === 'Enter' && e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      {/* Tags Display */}
      <div 
        className="flex flex-wrap gap-2 mb-2 min-h-[40px] p-2 bg-dark-primary border border-dark-accent rounded-lg"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm font-medium group"
          >
            <TagIcon className="w-3 h-3" />
            <span>{tag}</span>
            {!disabled && (
              <button
                onClick={() => removeTag(tag)}
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
        
        {/* Input */}
        {!disabled && tags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onKeyPress={(e) => {
              // Prevent comma from being typed
              if (e.key === ',' || e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onPaste={handlePaste}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
            onBlur={(e) => e.stopPropagation()}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-white placeholder-gray-500 text-sm focus:outline-none"
            disabled={disabled}
            autoComplete="off"
            autoFocus={false}
          />
        )}
      </div>
      
      {/* Helper Text */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>
          {tags.length > 0 && `${tags.length}/${maxTags} tags`}
        </span>
        <span className="text-gray-600">
          Press Enter or comma to add
        </span>
      </div>
      
      {/* Popular Tags Suggestions */}
      {tags.length === 0 && inputValue.length === 0 && !disabled && (
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-xs text-gray-500">Suggestions:</span>
          {['production', 'staging', 'api', 'website', 'critical'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => addTag(suggestion)}
              className="px-2 py-1 text-xs text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded border border-dark-accent transition-colors"
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

