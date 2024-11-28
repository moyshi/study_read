'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-8">
          משחק זיכרון ללימוד עברית
        </h1>
        
        <div className="flex flex-col gap-6 items-center">
          <Link 
            href="/game"
            className="w-64 bg-blue-500 hover:bg-blue-600 text-white text-xl font-semibold py-4 px-8 rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>🎮</span>
            <span>התחל משחק</span>
          </Link>
          
          <Link 
            href="/words"
            className="w-64 bg-green-500 hover:bg-green-600 text-white text-xl font-semibold py-4 px-8 rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>📚</span>
            <span>ניהול מילים</span>
          </Link>
        </div>

        <div className="mt-12 text-gray-600 dark:text-gray-400 text-right">
          <h2 className="text-2xl font-bold mb-4">:איך משחקים</h2>
          <ul className="space-y-2 text-lg">
            <li>🎯 שלב 1: משחק זיכרון - התאם זוגות של מילים</li>
            <li>📝 שלב 2: השלם את המילים החסרות בטקסט</li>
            <li>⏱️ שלב 3: השלם את המילים בזמן מוגבל</li>
            <li>🏆 שלב 4: אתגר סופי עם זמן קצר יותר</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
