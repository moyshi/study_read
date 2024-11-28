'use server';
import fs from 'fs';
import path from 'path';

const TEXTS_FILE = path.join(process.cwd(), 'data', 'words.json');

interface Text {
  id: number;
  title: string;
  content: string;
}

interface TextWithGaps {
  title: string;
  content: string;
  gapWords: string[];
  gapPositions: { start: number; end: number; word: string }[];
}

export async function readTextsFromFile() {
  try {
    const fileContent = await fs.promises.readFile(TEXTS_FILE, 'utf-8');
    return JSON.parse(fileContent).texts;
  } catch (error) {
    console.error('Error reading texts file:', error);
    return [];
  }
}

export async function writeTextsToFile(texts: Text[]) {
  try {
    await fs.promises.writeFile(TEXTS_FILE, JSON.stringify({ texts }, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing texts file:', error);
    return false;
  }
}

export async function getRandomTextAndWords(maxLength: number = 5, minLength: number = 2, count: number = 10): Promise<{ 
  words: { word: string; textTitle: string }[];
  selectedText: { title: string; content: string };
}> {
  try {
    const texts = await readTextsFromFile();
    // Select random text
    const randomText = texts[Math.floor(Math.random() * texts.length)];
    
    // Extract words from the selected text
    const words = randomText.content.split(/[\s,\.]+/); // Split by spaces, commas, and periods
    const wordFrequencyMap = new Map<string, number>();

    // Count word frequencies
    words.forEach((word: string) => {
      const cleanWord = word.trim();
      if (cleanWord && cleanWord.length <= maxLength && cleanWord.length >= minLength) {
        wordFrequencyMap.set(cleanWord, (wordFrequencyMap.get(cleanWord) || 0) + 1);
      }
    });

    // Convert to array and sort by frequency
    const wordFrequencies = Array.from(wordFrequencyMap.entries())
      .map(([word, frequency]) => ({ word, frequency }))
      .sort((a, b) => b.frequency - a.frequency);

    // Select words with weighted probability based on frequency
    const selectedWords: { word: string; textTitle: string }[] = [];
    const totalFrequency = wordFrequencies.reduce((sum, item) => sum + item.frequency, 0);

    while (selectedWords.length < count && wordFrequencies.length > 0) {
      const random = Math.random() * totalFrequency;
      let sum = 0;
      
      for (let i = 0; i < wordFrequencies.length; i++) {
        sum += wordFrequencies[i].frequency;
        if (random <= sum) {
          selectedWords.push({ 
            word: wordFrequencies[i].word, 
            textTitle: randomText.title 
          });
          // Remove selected word to avoid duplicates
          wordFrequencies.splice(i, 1);
          break;
        }
      }
    }

    return {
      words: selectedWords,
      selectedText: {
        title: randomText.title,
        content: randomText.content
      }
    };
  } catch (error) {
    console.error('Error getting game words:', error);
    return { words: [], selectedText: { title: '', content: '' } };
  }
}

export async function getTextWithGaps(text: { title: string; content: string }, words: string[]): Promise<TextWithGaps> {
  try {
    const gapPositions: { start: number; end: number; word: string }[] = [];
    let modifiedContent = text.content;

    // Create a set of words to track which ones we've used
    const remainingWords = new Set(words);
    
    // Split content into words while preserving spaces and punctuation
    const contentWords = modifiedContent.split(/(\s+|[,.!?])/);
    let currentPosition = 0;

    // Go through each word in the content
    contentWords.forEach((contentWord) => {
      const trimmedWord = contentWord.trim();
      
      // If this is a word (not whitespace/punctuation) and it's in our word list
      if (trimmedWord && remainingWords.has(trimmedWord)) {
        gapPositions.push({
          start: currentPosition,
          end: currentPosition + contentWord.length,
          word: trimmedWord
        });
        remainingWords.delete(trimmedWord);
      }
      
      currentPosition += contentWord.length;
    });

    // Sort positions from last to first to avoid index shifting
    gapPositions.sort((a, b) => b.start - a.start);

    // Replace words with underscores
    gapPositions.forEach(pos => {
      const before = modifiedContent.slice(0, pos.start);
      const after = modifiedContent.slice(pos.end);
      const underscores = '_'.repeat(pos.word.length);
      modifiedContent = before + underscores + after;
    });

    // Get the list of words that were actually found and used
    const usedWords = words.filter(word => !remainingWords.has(word));

    return {
      title: text.title,
      content: modifiedContent,
      gapWords: usedWords,
      gapPositions: gapPositions.reverse() // Reverse back to ascending order
    };
  } catch (error) {
    console.error('Error getting text with gaps:', error);
    return { title: '', content: '', gapWords: [], gapPositions: [] };
  }
}
