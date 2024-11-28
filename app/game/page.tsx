'use client';

import { useEffect, useState } from 'react';
import { getRandomTextAndWords } from '@/utils/fileOperations';
import Link from 'next/link';

interface Card {
  id: number;
  text: string;
  textTitle: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryGame() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [currentTextTitle, setCurrentTextTitle] = useState<string>('');
  const [isGameComplete, setIsGameComplete] = useState(false);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    // Check if all cards are matched
    if (cards.length > 0 && cards.every(card => card.isMatched)) {
      setIsGameComplete(true);
    }
  }, [cards]);

  const initializeGame = async () => {
    const { words, selectedText } = await getRandomTextAndWords(5, 2, 10);
    // Save words and text for level 2
    localStorage.setItem('memoryGameWords', JSON.stringify(words.map(w => w.word)));
    localStorage.setItem('selectedText', JSON.stringify(selectedText));
    
    const gameCards = [...words, ...words]
      .sort(() => Math.random() - 0.5)
      .map((word, index) => ({
        id: index,
        text: word.word,
        textTitle: word.textTitle,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(gameCards);
    setIsGameComplete(false);
    setCurrentTextTitle(selectedText.title);
  };

  const handleCardClick = (cardId: number) => {
    if (isLocked) return;
    if (flippedCards.length === 2) return;
    if (cards[cardId].isMatched) return;
    if (flippedCards.includes(cardId)) return;

    const newCards = [...cards];
    newCards[cardId].isFlipped = true;
    setCards(newCards);

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setIsLocked(true);
      checkMatch(newFlippedCards[0], newFlippedCards[1]);
    }
  };

  const checkMatch = (firstId: number, secondId: number) => {
    setTimeout(() => {
      const newCards = [...cards];
      if (cards[firstId].text === cards[secondId].text) {
        newCards[firstId].isMatched = true;
        newCards[secondId].isMatched = true;
      } else {
        newCards[firstId].isFlipped = false;
        newCards[secondId].isFlipped = false;
      }
      setCards(newCards);
      setFlippedCards([]);
      setIsLocked(false);
    }, 1000);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto min-h-screen bg-white dark:bg-gray-900">
      <div className="flex flex-col items-end gap-2 mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">משחק זיכרון</h1>
        <div className="flex items-center gap-2">
          <h2 className="text-lg text-gray-600 dark:text-gray-300">
            {currentTextTitle}
          </h2>
          <span className="text-gray-500 dark:text-gray-400">:מתוך הטקסט</span>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={initializeGame}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            משחק חדש
          </button>
          {isGameComplete && (
            <Link 
              href="/game/level2"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors animate-bounce"
            >
              !עבור לשלב 2
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-right">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className="relative aspect-[4/3] cursor-pointer perspective-1000 h-32 sm:h-40"
          >
            <div
              className={`absolute w-full h-full transition-transform duration-500 transform-style-3d ${
                card.isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front of card */}
              <div className={`absolute w-full h-full flex items-center justify-center text-2xl 
                rounded-lg shadow-lg backface-hidden
                ${card.isMatched ? 'opacity-60' : ''}
                bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200`}
              >
                ?
              </div>
              
              {/* Back of card */}
              <div className={`absolute w-full h-full flex items-center justify-center text-xl 
                rounded-lg shadow-lg backface-hidden rotate-y-180
                ${card.isMatched ? 'opacity-60' : ''}
                bg-blue-500 text-white dark:bg-blue-700 dark:text-gray-100`}
              >
                {card.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
