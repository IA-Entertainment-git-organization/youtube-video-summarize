export class AdvancedSummarizerService {
    async summarizeVideo(videoUrl, metadata, transcript) {
        try {
            const fullText = transcript.text;
            const words = fullText.split(/\s+/);
            const transcriptLength = words.length;
            // If the transcript is very short, just return it as the summary
            if (transcriptLength < 100) {
                return {
                    title: metadata.title,
                    originalVideoUrl: videoUrl,
                    summaryText: fullText,
                    keyPoints: [fullText],
                    durationInMinutes: Math.ceil(metadata.duration / 60),
                    transcriptLength
                };
            }
            // Advanced summarization using TF-IDF approach
            // 1. Split into sentences
            const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];
            // 2. Split transcript into chunks (paragraphs) to calculate IDF
            const paragraphs = [];
            const chunkSize = Math.ceil(sentences.length / 10); // Aim for around 10 paragraphs
            for (let i = 0; i < sentences.length; i += chunkSize) {
                paragraphs.push(sentences.slice(i, i + chunkSize).join(' '));
            }
            // 3. Calculate document frequency (how many paragraphs contain each word)
            const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
                'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'like', 'of',
                'this', 'that', 'i', 'you', 'he', 'she', 'they', 'we', 'it']);
            const wordDocFreq = {};
            const wordFreq = {};
            // Count word frequencies in the entire document
            words.forEach((word) => {
                const normalizedWord = word.toLowerCase().replace(/[^\w]/g, '');
                if (normalizedWord.length > 2 && !stopWords.has(normalizedWord)) {
                    wordFreq[normalizedWord] = (wordFreq[normalizedWord] || 0) + 1;
                }
            });
            // Count document frequencies
            paragraphs.forEach(paragraph => {
                const seenWords = new Set();
                const paragraphWords = paragraph.split(/\s+/);
                paragraphWords.forEach(word => {
                    const normalizedWord = word.toLowerCase().replace(/[^\w]/g, '');
                    if (normalizedWord.length > 2 && !stopWords.has(normalizedWord) && !seenWords.has(normalizedWord)) {
                        seenWords.add(normalizedWord);
                        wordDocFreq[normalizedWord] = (wordDocFreq[normalizedWord] || 0) + 1;
                    }
                });
            });
            // 4. Calculate TF-IDF scores for each sentence
            const sentenceScores = {};
            sentences.forEach((sentence, index) => {
                const sentenceWords = sentence.split(/\s+/);
                let score = 0;
                sentenceWords.forEach((word) => {
                    const normalizedWord = word.toLowerCase().replace(/[^\w]/g, '');
                    if (normalizedWord.length > 2 && !stopWords.has(normalizedWord)) {
                        // TF = frequency of word in document
                        const tf = wordFreq[normalizedWord] || 0;
                        // IDF = log(total paragraphs / paragraphs containing word)
                        const df = wordDocFreq[normalizedWord] || 0;
                        const idf = Math.log(paragraphs.length / (df || 1));
                        score += tf * idf;
                    }
                });
                // Normalize by sentence length
                sentenceScores[index] = score / Math.max(1, sentenceWords.length);
                // Position bias - sentences at the beginning and end are often more important
                if (index < sentences.length * 0.1) {
                    // Beginning gets more weight
                    sentenceScores[index] *= 1.25;
                }
                else if (index > sentences.length * 0.85) {
                    // End gets slight boost
                    sentenceScores[index] *= 1.1;
                }
                // Length bias - avoid very short sentences
                if (sentenceWords.length < 5) {
                    sentenceScores[index] *= 0.7;
                }
            });
            // 5. Select top sentences for summary
            const indexesWithScores = Object.entries(sentenceScores)
                .map(([index, score]) => ({ index: parseInt(index), score }))
                .sort((a, b) => b.score - a.score);
            // Take top ~15% of sentences for the summary
            const targetSentenceCount = Math.max(3, Math.ceil(sentences.length * 0.15));
            const topIndexes = indexesWithScores
                .slice(0, targetSentenceCount)
                .map(item => item.index)
                .sort((a, b) => a - b); // Sort by original position
            // 6. Create coherent summary from top sentences
            const summaryText = topIndexes.map(index => sentences[index]).join(' ');
            // 7. Extract key points
            // Method: Identify sentences with the highest unique word occurrences 
            // that didn't make it into the summary
            // Get words that appear in the summary
            const summaryWords = new Set();
            topIndexes.forEach(index => {
                const words = sentences[index].split(/\s+/);
                words.forEach(word => {
                    const normalizedWord = word.toLowerCase().replace(/[^\w]/g, '');
                    if (normalizedWord.length > 2 && !stopWords.has(normalizedWord)) {
                        summaryWords.add(normalizedWord);
                    }
                });
            });
            // Score remaining sentences by unique information
            const keyPointScores = {};
            sentences.forEach((sentence, index) => {
                // Skip sentences already in summary
                if (topIndexes.includes(index)) {
                    return;
                }
                const sentenceWords = sentence.split(/\s+/);
                let uniqueScore = 0;
                let totalScore = 0;
                sentenceWords.forEach((word) => {
                    const normalizedWord = word.toLowerCase().replace(/[^\w]/g, '');
                    if (normalizedWord.length > 2 && !stopWords.has(normalizedWord)) {
                        totalScore += 1;
                        // Give higher score to words not in summary
                        if (!summaryWords.has(normalizedWord)) {
                            uniqueScore += 1;
                        }
                    }
                });
                // Score is percentage of unique words * original sentence importance
                const uniqueRatio = uniqueScore / Math.max(1, totalScore);
                keyPointScores[index] = uniqueRatio * sentenceScores[index];
            });
            // Select top sentences for key points
            const keyPointIndexes = Object.entries(keyPointScores)
                .map(([index, score]) => ({ index: parseInt(index), score }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .map(item => item.index);
            const keyPoints = keyPointIndexes.map(index => sentences[index].trim());
            return {
                title: metadata.title,
                originalVideoUrl: videoUrl,
                summaryText,
                keyPoints,
                durationInMinutes: Math.ceil(metadata.duration / 60),
                transcriptLength
            };
        }
        catch (error) {
            console.error('Error in advanced summarization:', error);
            throw new Error('Failed to summarize video');
        }
    }
}
