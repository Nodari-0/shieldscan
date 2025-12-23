'use client';

import { useState, useEffect, useRef } from 'react';

const words = [
  { text: 'Scanning', color: '#c084fc', shadow: '0 0 10px rgba(192, 132, 252, 0.7), 0 0 20px rgba(192, 132, 252, 0.4)' },
  { text: 'Checking', color: '#facc15', shadow: '0 0 10px rgba(250, 204, 21, 0.7), 0 0 20px rgba(250, 204, 21, 0.4)' },
  { text: 'Monitoring', color: '#4ade80', shadow: '0 0 10px rgba(74, 222, 128, 0.7), 0 0 20px rgba(74, 222, 128, 0.4)' },
  { text: 'Protecting', color: '#c084fc', shadow: '0 0 10px rgba(192, 132, 252, 0.7), 0 0 20px rgba(192, 132, 252, 0.4)' },
  { text: 'Analyzing', color: '#facc15', shadow: '0 0 10px rgba(250, 204, 21, 0.7), 0 0 20px rgba(250, 204, 21, 0.4)' },
  { text: 'Securing', color: '#4ade80', shadow: '0 0 10px rgba(74, 222, 128, 0.7), 0 0 20px rgba(74, 222, 128, 0.4)' },
];

export default function ColoredTypewriter() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const currentWord = words[wordIndex];
    const fullText = currentWord.text;

    const handleTyping = () => {
      if (!isDeleting) {
        // Typing
        if (displayText.length < fullText.length) {
          setDisplayText(fullText.substring(0, displayText.length + 1));
          timeoutRef.current = setTimeout(handleTyping, 100);
        } else {
          // Finished typing, wait then start deleting
          timeoutRef.current = setTimeout(() => setIsDeleting(true), 2500);
        }
      } else {
        // Deleting
        if (displayText.length > 0) {
          setDisplayText(displayText.substring(0, displayText.length - 1));
          timeoutRef.current = setTimeout(handleTyping, 60);
        } else {
          // Finished deleting, move to next word
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    };

    timeoutRef.current = setTimeout(handleTyping, 100);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [displayText, isDeleting, wordIndex]);

  const currentWord = words[wordIndex];

  return (
    <span className="inline-block min-h-[1.2em]">
      <span
        className="text-5xl md:text-6xl lg:text-7xl font-display font-bold"
        style={{
          color: currentWord.color,
          textShadow: currentWord.shadow,
        }}
      >
        {displayText}
        <span 
          className="inline-block w-[3px] h-[0.9em] ml-1 animate-pulse"
          style={{ backgroundColor: currentWord.color }}
        />
      </span>
    </span>
  );
}
