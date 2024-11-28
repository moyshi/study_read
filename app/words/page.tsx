'use client';
import { useState, useEffect } from 'react';
import { readTextsFromFile, writeTextsToFile } from '@/utils/fileOperations';

interface Text {
    id: number;
    title: string;
    content: string;
}

export default function TextsPage() {
    const [texts, setTexts] = useState<Text[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const loadTexts = async () => {
            const loadedTexts = await readTextsFromFile();
            setTexts(loadedTexts);
        };
        loadTexts();
    }, []);

    const addText = async () => {
        const trimmedTitle = newTitle.trim();
        const trimmedContent = newContent.trim();
        if (trimmedTitle && trimmedContent) {
            // Check for duplicates
            if (texts.some(text => text.title === trimmedTitle)) {
                setError('כותרת זו כבר קיימת ברשימה');
                setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
                return;
            }

            const newTextObj = { 
                id: Math.max(0, ...texts.map(t => t.id)) + 1,
                title: trimmedTitle,
                content: trimmedContent 
            };
            
            // Add new text and sort immediately
            const updatedTexts = [...texts, newTextObj];
            setTexts(updatedTexts);
            await writeTextsToFile(updatedTexts);
            setNewTitle('');
            setNewContent('');
            setError('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            addText();
        }
    };

    const removeText = async (id: number) => {
        const updatedTexts = texts.filter(text => text.id !== id);
        setTexts(updatedTexts);
        await writeTextsToFile(updatedTexts);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto min-h-screen bg-white dark:bg-gray-900">
            <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">טקסטים</h1>
            
            <div className="mb-8 flex flex-col gap-2 items-center" dir="rtl">
                <div className="flex gap-2 w-full max-w-sm">
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="border p-2 rounded-lg flex-1 text-right 
                                bg-white dark:bg-gray-800 
                                text-gray-900 dark:text-white 
                                border-gray-300 dark:border-gray-600
                                focus:ring-blue-500 dark:focus:ring-blue-400
                                focus:border-blue-500 dark:focus:border-blue-400"
                        placeholder="הכנס כותרת חדשה"
                    />
                    <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="border p-2 rounded-lg flex-1 text-right 
                                bg-white dark:bg-gray-800 
                                text-gray-900 dark:text-white 
                                border-gray-300 dark:border-gray-600
                                focus:ring-blue-500 dark:focus:ring-blue-400
                                focus:border-blue-500 dark:focus:border-blue-400
                                h-20"
                        placeholder="הכנס תוכן חדש"
                    />
                    <button
                        onClick={addText}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg 
                                hover:bg-blue-600 dark:hover:bg-blue-400
                                transition-colors duration-200"
                    >
                        הוסף
                    </button>
                </div>
                {error && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1">{error}</p>
                )}
            </div>

            <div className="space-y-8">
                {texts.map((text) => (
                    <div key={text.id} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{text.title}</h2>
                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap text-right">
                            {text.content}
                        </p>
                        <button
                            onClick={() => removeText(text.id)}
                            className="text-red-500 hover:text-red-700 
                                    dark:text-red-400 dark:hover:text-red-300
                                    transition-colors duration-200"
                        >
                            מחק
                        </button>
                    </div>
                ))}
                {texts.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400">אין טקסטים עדיין</p>
                )}
            </div>
        </div>
    );
}
