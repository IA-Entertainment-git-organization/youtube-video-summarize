import { VideoMetadata, VideoTranscript } from '../interfaces/video-service.interface.js';
/**
 * This utility provides alternative methods to fetch YouTube data
 * when the primary methods fail.
 */
export declare function attemptFallbackMetadata(videoId: string): Promise<VideoMetadata>;
/**
 * Attempts to fetch a transcript using alternative methods
 */
export declare function attemptFallbackTranscript(videoId: string): Promise<VideoTranscript>;
/**
 * Utility to check if a video might be age-restricted or otherwise limited
 */
export declare function checkVideoAccessibility(videoId: string): Promise<{
    accessible: boolean;
    reason?: string;
}>;
