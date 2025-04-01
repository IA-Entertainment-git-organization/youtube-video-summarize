import ytdl from 'ytdl-core';
import { IVideoService, VideoMetadata, VideoTranscript, VideoTranscriptSegment } from '../interfaces/video-service.interface.js';
import { createError, ErrorType } from '../utils/error-handler.js';
import { attemptFallbackMetadata, attemptFallbackTranscript, checkVideoAccessibility } from '../utils/youtube-fallback.js';

interface TranscriptResponse {
  text: string;
  offset: number;
  duration: number;
  start?: number; // Adding this to match the usage
}

export class YouTubeVideoService implements IVideoService {
  
  async getVideoMetadata(videoUrl: string): Promise<VideoMetadata> {
    try {
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId) {
        throw createError("Invalid YouTube URL", ErrorType.INVALID_URL);
      }
      
      console.error(`Attempting to fetch metadata for video ID: ${videoId}`);
      
      // First, check if the video is accessible
      const accessCheck = await checkVideoAccessibility(videoId);
      if (!accessCheck.accessible) {
        console.error(`Video accessibility check failed: ${accessCheck.reason}`);
        throw createError(
          `Video access check failed: ${accessCheck.reason || 'Unknown reason'}`, 
          ErrorType.ACCESS_RESTRICTED
        );
      }
      
      // Try primary method (ytdl-core)
      try {
        const info = await ytdl.getInfo(videoId);
        const videoDetails = info.videoDetails;
        
        return {
          title: videoDetails.title,
          description: videoDetails.description || '',
          channelName: videoDetails.author.name,
          publishDate: videoDetails.publishDate,
          thumbnailUrl: videoDetails.thumbnails[0]?.url || '',
          duration: parseInt(videoDetails.lengthSeconds),
          viewCount: parseInt(videoDetails.viewCount)
        };
      } catch (ytdlError: any) {
        console.error(`ytdl-core error details:`, ytdlError.message);
        
        // Check for specific error conditions
        if (ytdlError.message?.includes('age-restricted')) {
          throw createError("This video is age-restricted and cannot be accessed without authentication.", ErrorType.ACCESS_RESTRICTED);
        }
        
        if (ytdlError.message?.includes('copyright') || ytdlError.message?.includes('unavailable')) {
          throw createError("This video may be unavailable due to copyright restrictions or regional blocks.", ErrorType.ACCESS_RESTRICTED);
        }
        
        if (ytdlError.message?.includes('private')) {
          throw createError("This video is private and cannot be accessed.", ErrorType.ACCESS_RESTRICTED);
        }
        
        // Try fallback method if primary fails
        console.error(`Primary metadata fetch failed, attempting fallback...`);
        return await attemptFallbackMetadata(videoId);
      }
    } catch (error) {
      if ((error as any).type) {
        throw error; // Re-throw our custom errors
      }
      console.error('Error fetching video metadata:', error);
      throw createError(`Failed to fetch video metadata: ${(error as Error).message}`, ErrorType.API_ERROR);
    }
  }

  async getVideoTranscript(videoUrl: string): Promise<VideoTranscript> {
    try {
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId) {
        throw createError("Invalid YouTube URL", ErrorType.INVALID_URL);
      }
      
      console.error(`Attempting to fetch transcript for video ID: ${videoId}`);
      
      // Try primary method
      try {
        // Using the dynamic import to avoid Node.js module issues
        const { YoutubeTranscript } = await import('youtube-transcript');
        
        // Add a timeout to the transcript fetch to avoid hanging
        const transcriptPromise = YoutubeTranscript.fetchTranscript(videoId);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Transcript fetch timed out after 10 seconds')), 10000);
        });
        
        const transcriptResponse = await Promise.race([
          transcriptPromise,
          timeoutPromise
        ]) as any[];
        
        if (!transcriptResponse || transcriptResponse.length === 0) {
          throw createError("No transcript is available for this video.", ErrorType.NO_TRANSCRIPT);
        }
        
        const segments: VideoTranscriptSegment[] = transcriptResponse.map((item: TranscriptResponse) => ({
          text: item.text,
          start: item.offset || item.start || 0, // Use offset if start is not available
          duration: item.duration
        }));
        
        // Combine all segments into a full transcript text
        const fullText = segments.map(segment => segment.text).join(' ');
        
        return {
          text: fullText,
          segments
        };
      } catch (transcriptError: any) {
        console.error(`Transcript fetching error details:`, transcriptError.message);
        
        // Check for specific transcript errors
        if (transcriptError.message?.includes('could not find automatic captions')) {
          throw createError("This video does not have automatic captions or transcripts available.", ErrorType.NO_TRANSCRIPT);
        }
        
        // Try fallback method if primary fails
        console.error(`Primary transcript fetch failed, attempting fallback...`);
        try {
          return await attemptFallbackTranscript(videoId);
        } catch (fallbackError) {
          console.error(`Fallback transcript fetch also failed:`, fallbackError);
          throw createError(
            "No transcript is available for this video using any available method.", 
            ErrorType.NO_TRANSCRIPT
          );
        }
      }
    } catch (error) {
      if ((error as any).type) {
        throw error; // Re-throw our custom errors
      }
      console.error('Error fetching video transcript:', error);
      throw createError(`Failed to fetch video transcript: ${(error as Error).message}. The video might not have captions available.`, ErrorType.NO_TRANSCRIPT);
    }
  }

  validateYouTubeUrl(url: string): boolean {
    return !!this.extractVideoId(url);
  }

  extractVideoId(url: string): string | null {
    try {
      // Handle case where URL is already a video ID
      if (url.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
      }
      
      // First try using ytdl-core's built-in validator
      if (ytdl.validateID(url)) {
        return url;
      }
      
      if (ytdl.validateURL(url)) {
        try {
          return ytdl.getVideoID(url);
        } catch (e) {
          // Fall through to the manual extraction if this fails
        }
      }
      
      // Manual extraction for various YouTube URL formats
      
      // Standard youtube.com/watch?v= format
      try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('youtube.com')) {
          const searchParams = urlObj.searchParams;
          const videoId = searchParams.get('v');
          if (videoId && videoId.length === 11) {
            return videoId;
          }
        }
      } catch (e) {
        // If URL parsing fails, continue with regex approach
      }
      
      // youtu.be/ID format
      const shortUrlRegex = /youtu\.be\/([a-zA-Z0-9_-]{11})/;
      const shortMatch = url.match(shortUrlRegex);
      if (shortMatch) {
        return shortMatch[1];
      }
      
      // Embedded format
      const embedRegex = /embed\/([a-zA-Z0-9_-]{11})/;
      const embedMatch = url.match(embedRegex);
      if (embedMatch) {
        return embedMatch[1];
      }
      
      // General regex for most formats
      const generalRegex = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const generalMatch = url.match(generalRegex);
      if (generalMatch && generalMatch[7] && generalMatch[7].length === 11) {
        return generalMatch[7];
      }
      
      console.error(`Could not extract video ID from URL: ${url}`);
      return null;
    } catch (error) {
      console.error('Error extracting video ID:', error);
      return null;
    }
  }
  
  // New method to attempt getting metadata through multiple methods
  async tryAlternativeMetadataFetch(videoId: string): Promise<VideoMetadata | null> {
    try {
      // This could be extended with additional methods if ytdl-core fails
      // For example, using the YouTube Data API if you have an API key
      return null; // For now, just a placeholder for future implementation
    } catch (error) {
      console.error('Alternative metadata fetch failed:', error);
      return null;
    }
  }
}