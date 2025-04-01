import { ISummarizer, SummaryResult } from '../interfaces/summarizer.interface.js';
import { VideoMetadata, VideoTranscript } from '../interfaces/video-service.interface.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

export class OpenAISummarizerService implements ISummarizer {
  private readonly apiKey: string | undefined;
  
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    if (!this.apiKey) {
      console.warn('Warning: OPENAI_API_KEY not found in environment variables. Falling back to basic summarization.');
    }
  }
  
  async summarizeVideo(
    videoUrl: string, 
    metadata: VideoMetadata, 
    transcript: VideoTranscript
  ): Promise<SummaryResult> {
    try {
      // If no API key is provided, throw an error
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }
      
      const fullText = transcript.text;
      const words = fullText.split(/\s+/);
      const transcriptLength = words.length;
      
      // Create a prompt for the OpenAI API
      const prompt = `
        Please summarize the following YouTube video transcript. 
        Video title: "${metadata.title}"
        Channel: "${metadata.channelName}"
        Duration: ${Math.ceil(metadata.duration / 60)} minutes
        
        Provide a concise summary (3-5 paragraphs) and extract 3-5 key points.
        
        Transcript:
        ${fullText.substring(0, 15000)} ${fullText.length > 15000 ? '...(transcript truncated due to length)' : ''}
      `;
      
      // Make OpenAI API request
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { 
              role: 'user', 
              content: prompt 
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      const summaryContent = data.choices[0]?.message?.content || '';
      
      // Extract key points from the summary - looking for lists or bullet points
      const keyPointsMatch = summaryContent.match(/key\s*points?:?([\s\S]*?)(?:\n\n|$)/i);
      let keyPoints: string[] = [];
      
      if (keyPointsMatch && keyPointsMatch[1]) {
        // Try to extract bullet points or numbered lists
        const pointsText = keyPointsMatch[1].trim();
        keyPoints = pointsText
          .split(/\n+/)
          .map((line: string) => line.replace(/^[•\-*\d.\s]+/, '').trim())
          .filter((point: string) => point.length > 0);
      }
      
      // If we couldn't extract key points, just use the first few sentences
      if (keyPoints.length === 0) {
        const sentences = summaryContent.match(/[^.!?]+[.!?]+/g) || [summaryContent];
        keyPoints = sentences.slice(0, 3);
      }
      
      // Remove the key points section from the summary text if it exists
      let summaryText = summaryContent;
      if (keyPointsMatch) {
        summaryText = summaryContent.replace(keyPointsMatch[0], '').trim();
      }
      
      return {
        title: metadata.title,
        originalVideoUrl: videoUrl,
        summaryText,
        keyPoints,
        durationInMinutes: Math.ceil(metadata.duration / 60),
        transcriptLength
      };
      
    } catch (error) {
      console.error('Error in OpenAI summarization:', error);
      throw new Error('Failed to summarize video using OpenAI');
    }
  }
}