import { VideoMetadata, VideoTranscript } from '../interfaces/video-service.interface.js';
import { createError, ErrorType } from './error-handler.js';

/**
 * This utility provides alternative methods to fetch YouTube data
 * when the primary methods fail.
 */
export async function attemptFallbackMetadata(videoId: string): Promise<VideoMetadata> {
  console.error(`Attempting fallback metadata fetch for video ID: ${videoId}`);
  
  try {
    // Try to fetch video info without authentication
    const apiUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from oembed API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // This only gives us basic info, so we'll need to use fallback values for some fields
    return {
      title: data.title || 'Unknown Title',
      description: data.author_name ? `Video by ${data.author_name}` : 'No description available',
      channelName: data.author_name || 'Unknown Channel',
      publishDate: new Date().toISOString(), // We don't get this from oembed
      thumbnailUrl: data.thumbnail_url || '',
      duration: 0, // We don't get this from oembed
      viewCount: 0 // We don't get this from oembed
    };
  } catch (error) {
    console.error('Fallback metadata fetch failed:', error);
    throw createError(`All metadata fetching methods failed for video ID: ${videoId}`, ErrorType.API_ERROR);
  }
}

/**
 * Attempts to fetch a transcript using alternative methods
 */
export async function attemptFallbackTranscript(videoId: string): Promise<VideoTranscript> {
  console.error(`Attempting fallback transcript fetch for video ID: ${videoId}`);
  
  try {
    // Unfortunately, there's no reliable public API to get transcripts
    // without authentication. This is a placeholder for potential future
    // implementation with a 3rd party service.
    
    throw createError(
      "No transcript is available for this video or all transcript fetching methods failed.", 
      ErrorType.NO_TRANSCRIPT
    );
  } catch (error) {
    if ((error as any).type) {
      throw error; // Re-throw our custom errors
    }
    throw createError(`Failed to fetch transcript using all available methods: ${(error as Error).message}`, ErrorType.NO_TRANSCRIPT);
  }
}

/**
 * Utility to check if a video might be age-restricted or otherwise limited
 */
export async function checkVideoAccessibility(videoId: string): Promise<{accessible: boolean, reason?: string}> {
  try {
    // Try to fetch the video page and check for access restriction indicators
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      return { 
        accessible: false, 
        reason: `HTTP error: ${response.status} ${response.statusText}` 
      };
    }
    
    const html = await response.text();
    
    // Check for common restriction indicators in the page HTML
    if (html.includes('age-restricted') || html.includes('Age-restricted')) {
      return { 
        accessible: false, 
        reason: 'Age restricted content' 
      };
    }
    
    if (html.includes('This video is unavailable') || html.includes('Video unavailable')) {
      return { 
        accessible: false, 
        reason: 'Video unavailable' 
      };
    }
    
    if (html.includes('This video is private')) {
      return { 
        accessible: false, 
        reason: 'Private video' 
      };
    }
    
    return { accessible: true };
  } catch (error) {
    console.error('Error checking video accessibility:', error);
    return { 
      accessible: false, 
      reason: `Error checking: ${(error as Error).message}` 
    };
  }
}