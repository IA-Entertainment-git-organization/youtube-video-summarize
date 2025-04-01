import { ISummarizer, SummaryResult } from '../interfaces/summarizer.interface.js';
import { VideoMetadata, VideoTranscript } from '../interfaces/video-service.interface.js';

export class BasicSummarizerService implements ISummarizer {
  async summarizeVideo(
    videoUrl: string, 
    metadata: VideoMetadata, 
    transcript: VideoTranscript
  ): Promise<SummaryResult> {
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
      
      // Enhanced basic summarization approach:
      
      // 1. Split into sentences
      const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];
      
      // 2. Calculate sentence importance based on word frequency
      const wordFrequency: Record<string, number> = {};
      const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
                               'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'like', 'of', 
                               'this', 'that', 'i', 'you', 'he', 'she', 'they', 'we', 'it']);
      
      // Count word frequencies
      words.forEach((word: string) => {
        const normalizedWord = word.toLowerCase().replace(/[^\w]/g, '');
        if (normalizedWord.length > 2 && !stopWords.has(normalizedWord)) {
          wordFrequency[normalizedWord] = (wordFrequency[normalizedWord] || 0) + 1;
        }
      });
      
      // Calculate sentence scores based on word frequency
      const sentenceScores: Record<number, number> = {};
      sentences.forEach((sentence: string, index: number) => {
        const sentenceWords = sentence.split(/\s+/);
        let score = 0;
        
        sentenceWords.forEach((word: string) => {
          const normalizedWord = word.toLowerCase().replace(/[^\w]/g, '');
          if (wordFrequency[normalizedWord]) {
            score += wordFrequency[normalizedWord];
          }
        });
        
        // Normalize by sentence length to avoid favoring longer sentences
        sentenceScores[index] = score / Math.max(1, sentenceWords.length);
        
        // Give slight boost to sentences at the beginning and end
        if (index < sentences.length * 0.2) {
          sentenceScores[index] *= 1.2;
        } else if (index > sentences.length * 0.8) {
          sentenceScores[index] *= 1.1;
        }
      });
      
      // Sort sentences by score
      const indexesWithScores = Object.entries(sentenceScores)
        .map(([index, score]) => ({ index: parseInt(index), score }))
        .sort((a, b) => b.score - a.score);
      
      // Take top ~20% of sentences for the summary
      const targetSentenceCount = Math.max(3, Math.ceil(sentences.length * 0.2));
      const topIndexes = indexesWithScores
        .slice(0, targetSentenceCount)
        .map(item => item.index)
        .sort((a, b) => a - b); // Sort by original position
      
      // Create summary from top sentences
      const summaryText = topIndexes.map(index => sentences[index]).join(' ');
      
      // Extract key points - take the top 3-5 sentences by score
      const keyPointCount = Math.min(5, Math.ceil(sentences.length * 0.1));
      const keyPoints = indexesWithScores
        .slice(0, keyPointCount)
        .map(item => sentences[item.index].trim())
        .filter((sentence, index, self) => 
          // Remove duplicate sentences
          index === self.findIndex(s => s.trim() === sentence.trim())
        );
      
      return {
        title: metadata.title,
        originalVideoUrl: videoUrl,
        summaryText,
        keyPoints,
        durationInMinutes: Math.ceil(metadata.duration / 60),
        transcriptLength
      };
    } catch (error) {
      console.error('Error in basic summarization:', error);
      throw new Error('Failed to summarize video');
    }
  }
}