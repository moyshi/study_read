'use client';

import { useState, useEffect } from 'react';
import { readTextsFromFile, writeTextsToFile } from '@/utils/fileOperations';
import Link from 'next/link';

interface Text {
  id: number;
  title: string;
  content: string;
}

export default function TextsPage() {
  const [texts, setTexts] = useState<Text[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedTextIndex, setSelectedTextIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadTexts = async () => {
      const loadedTexts = await readTextsFromFile();
      setTexts(loadedTexts);
    };
    loadTexts();
  }, []);

  const handleSave = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    const updatedTexts = [...texts];
    const newText = { 
      id: Math.max(0, ...texts.map(t => t.id)) + 1,
      title: newTitle.trim(),
      content: newContent.trim() 
    };

    if (selectedTextIndex !== null) {
      updatedTexts[selectedTextIndex] = newText;
    } else {
      updatedTexts.push(newText);
    }

    setTexts(updatedTexts);
    await writeTextsToFile(updatedTexts);
    setNewTitle('');
    setNewContent('');
    setSelectedTextIndex(null);
  };

  const handleEdit = (index: number) => {
    setNewTitle(texts[index].title);
    setNewContent(texts[index].content);
    setSelectedTextIndex(index);
  };

  const handleDelete = async (index: number) => {
    const updatedTexts = texts.filter((_, i) => i !== index);
    setTexts(updatedTexts);
    await writeTextsToFile(updatedTexts);
    if (selectedTextIndex === index) {
      setNewTitle('');
      setNewContent('');
      setSelectedTextIndex(null);
    }
  };

  const handleClear = () => {
    setNewTitle('');
    setNewContent('');
    setSelectedTextIndex(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link 
            href="/"
            className="text-blue-500 hover:text-blue-600 transition-colors text-lg"
          >
            חזרה לדף הראשי
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">ניהול טקסטים</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
          {/* Input Form */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg order-2 lg:order-1">
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 text-lg mb-2 text-right">
                כותרת
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 text-lg rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-right"
                placeholder="הכנס כותרת..."
                dir="rtl"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 text-lg mb-2 text-right">
                תוכן
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 text-lg rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-right min-h-[400px] resize-y"
                placeholder="הכנס תוכן..."
                dir="rtl"
              />
            </div>

            <div className="flex gap-4 justify-end">
              <button
                onClick={handleClear}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-lg"
              >
                נקה
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg"
              >
                {selectedTextIndex !== null ? 'עדכן' : 'שמור'}
              </button>
            </div>
          </div>

          {/* Saved Texts List */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg order-1 lg:order-2">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-right">
              טקסטים שמורים
            </h2>
            <div className="space-y-4">
              {texts.map((text, index) => (
                <div 
                  key={text.id}
                  className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(index)}
                        className="text-red-500 hover:text-red-600 transition-colors"
                      >
                        🗑️
                      </button>
                      <button
                        onClick={() => handleEdit(index)}
                        className="text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        ✏️
                      </button>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white text-right">
                      {text.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-right line-clamp-3">
                    {text.content}
                  </p>
                </div>
              ))}
              {texts.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  אין טקסטים שמורים
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
