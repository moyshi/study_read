'use client';

import { useEffect, useState } from 'react';
import { getTextWithGaps } from '@/utils/fileOperations';
import Link from 'next/link';

interface GapWord {
  word: string;
  userInput: string[];
  isChecked: boolean;
  lastCheckedInput: string[];
  position: { start: number; end: number };
}

export default function TextCompletionGame() {
  const [title, setTitle] = useState('');
  const [gapWords, setGapWords] = useState<GapWord[]>([]);
  const [selectedGapIndex, setSelectedGapIndex] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [memoryWords, setMemoryWords] = useState<string[]>([]);
  const [textParts, setTextParts] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00');

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (startTime && !isComplete) {
      const timer = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        setElapsedTime(`${minutes}:${seconds}`);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [startTime, isComplete]);

  const initializeGame = async () => {
    const previousWords = JSON.parse(localStorage.getItem('memoryGameWords') || '[]');
    const selectedText = JSON.parse(localStorage.getItem('selectedText') || '{ "title": "", "content": "" }');
    setMemoryWords(previousWords);
    
    const textWithGaps = await getTextWithGaps(selectedText, previousWords);
    
    setTitle(textWithGaps.title);

    // Sort gaps by position
    const sortedGaps = [...textWithGaps.gapPositions].sort((a, b) => a.start - b.start);
    
    // Split text into parts based on gap positions
    const parts: string[] = [];
    let lastEnd = 0;
    
    sortedGaps.forEach((gap) => {
      parts.push(selectedText.content.slice(lastEnd, gap.start));
      parts.push('');
      lastEnd = gap.end;
    });
    
    if (lastEnd < selectedText.content.length) {
      parts.push(selectedText.content.slice(lastEnd));
    }
    
    setTextParts(parts);
    setGapWords(
      sortedGaps.map(pos => ({
        word: pos.word,
        userInput: Array(pos.word.length).fill(''),
        lastCheckedInput: Array(pos.word.length).fill(''),
        isChecked: false,
        position: pos
      }))
    );
    setIsComplete(false);
    setStartTime(Date.now());
  };

  const findNextInput = (currentGapIndex: number, currentLetterIndex: number, goForward: boolean = true) => {
    const rtlForward = !goForward;
    
    if (rtlForward && currentLetterIndex > 0) {
      return { gapIndex: currentGapIndex, letterIndex: currentLetterIndex - 1 };
    }
    if (!rtlForward && currentLetterIndex < gapWords[currentGapIndex].word.length - 1) {
      return { gapIndex: currentGapIndex, letterIndex: currentLetterIndex + 1 };
    }
    
    const nextGapIndex = goForward ? currentGapIndex + 1 : currentGapIndex - 1;
    if (nextGapIndex >= 0 && nextGapIndex < gapWords.length) {
      return { 
        gapIndex: nextGapIndex, 
        letterIndex: rtlForward ? gapWords[nextGapIndex].word.length - 1 : 0 
      };
    }
    
    return null;
  };

  const focusInput = (gapIndex: number, letterIndex: number) => {
    const nextInput = document.querySelector(
      `[data-gap="${gapIndex}"][data-letter="${letterIndex}"]`
    ) as HTMLInputElement;
    if (nextInput) nextInput.focus();
  };

  const handleLetterInput = (gapIndex: number, letterIndex: number, value: string) => {
    const newGapWords = [...gapWords];
    newGapWords[gapIndex].userInput[letterIndex] = value;
    setGapWords(newGapWords);

    if (value) {
      const next = findNextInput(gapIndex, letterIndex, true);
      if (next) focusInput(next.gapIndex, next.letterIndex);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, gapIndex: number, letterIndex: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newGapWords = [...gapWords];
      
      // If current box has a letter, just delete it and stay
      if (newGapWords[gapIndex].userInput[letterIndex]) {
        newGapWords[gapIndex].userInput[letterIndex] = '';
        setGapWords(newGapWords);
      } else {
        // If current box is empty, move to previous box and delete its letter
        const prev = findNextInput(gapIndex, letterIndex, false);
        if (prev) {
          newGapWords[prev.gapIndex].userInput[prev.letterIndex] = '';
          setGapWords(newGapWords);
          focusInput(prev.gapIndex, prev.letterIndex);
        }
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = findNextInput(gapIndex, letterIndex, true);
      if (next) focusInput(next.gapIndex, next.letterIndex);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const prev = findNextInput(gapIndex, letterIndex, false);
      if (prev) focusInput(prev.gapIndex, prev.letterIndex);
    }
  };

  const checkAllWords = () => {
    const newGapWords = gapWords.map(gap => ({
      ...gap,
      isChecked: true,
      lastCheckedInput: [...gap.userInput]
    }));
    setGapWords(newGapWords);

    const allCorrect = newGapWords.every(gap => 
      gap.userInput.join('') === gap.word
    );
    
    if (allCorrect) {
      const completionTime = Date.now();
      setEndTime(completionTime);
      setIsComplete(true);
      // Store completion time for level 3
      const timeInSeconds = Math.floor((completionTime - startTime) / 1000);
      localStorage.setItem('level2Time', timeInSeconds.toString());
      
      // Auto-redirect to level 3 after 2 seconds
      setTimeout(() => {
        window.location.href = '/game/level3';
      }, 2000);
    }
  };

  const renderGap = (gap: GapWord, index: number) => {
    const isSelected = selectedGapIndex === index;

    return (
      <div 
        key={index}
        className="inline-block mx-1 relative"
        onClick={() => setSelectedGapIndex(index)}
      >
        <div className="flex flex-row-reverse gap-0.5">
          {gap.word.split('').map((letter, letterIndex) => {
            const isCorrect = gap.isChecked && gap.lastCheckedInput[letterIndex] === letter;
            const isWrong = gap.isChecked && gap.lastCheckedInput[letterIndex] !== letter;
            
            return (
              <input
                key={letterIndex}
                type="text"
                maxLength={1}
                value={gap.userInput[letterIndex]}
                onChange={(e) => handleLetterInput(index, letterIndex, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index, letterIndex)}
                data-gap={index}
                data-letter={letterIndex}
                className={`w-6 h-8 text-center border-b-2 outline-none text-lg
                  ${!gap.isChecked ? 'border-gray-400' : 
                    isCorrect ? 'border-green-500 text-green-600' : 
                    isWrong ? 'border-red-500 text-red-600' : 'border-gray-400'}
                  ${isSelected ? 'bg-blue-50' : 'bg-transparent'}
                  dir="rtl"
                `}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto min-h-screen bg-white dark:bg-gray-900">
      <div className="flex flex-col items-end gap-4 mb-8">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <span className="text-xl font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
              {elapsedTime}
            </span>
            <Link 
              href="/game"
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              חזור לשלב 1
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">2 שלב - השלמת מילים</h1>
        </div>
        <h2 className="text-xl text-gray-700 dark:text-gray-300">{title}</h2>
        <div className="flex flex-wrap gap-2 justify-end">
          {memoryWords.map((word, index) => (
            <span 
              key={index}
              className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-lg"
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      <div className="text-right text-lg leading-loose text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
        {textParts.map((part, index) => (
          <span key={index}>
            {part}
            {index % 2 === 1 && index < gapWords.length * 2 && renderGap(gapWords[(index-1)/2], (index-1)/2)}
          </span>
        ))}
      </div>

      <div className="flex justify-center mt-12">
        <button
          onClick={checkAllWords}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors text-lg"
        >
          בדוק את כל המילים
        </button>
      </div>

      {isComplete && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          <div>!כל הכבוד, השלמת את כל המילים בהצלחה</div>
          <div className="text-center mt-1">
            {Math.floor((endTime - startTime) / 1000)} :זמן השלמה
          </div>
        </div>
      )}
    </div>
  );
}
