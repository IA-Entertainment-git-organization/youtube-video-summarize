import { IVideoService, VideoMetadata, VideoTranscript } from '../interfaces/video-service.interface.js';
export declare class YouTubeVideoService implements IVideoService {
    getVideoMetadata(videoUrl: string): Promise<VideoMetadata>;
    getVideoTranscript(videoUrl: string): Promise<VideoTranscript>;
    validateYouTubeUrl(url: string): boolean;
    extractVideoId(url: string): string | null;
    tryAlternativeMetadataFetch(videoId: string): Promise<VideoMetadata | null>;
}
