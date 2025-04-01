export interface VideoMetadata {
    title: string;
    description: string;
    channelName: string;
    publishDate: string;
    thumbnailUrl: string;
    duration: number;
    viewCount: number;
}
export interface VideoTranscript {
    text: string;
    segments: VideoTranscriptSegment[];
}
export interface VideoTranscriptSegment {
    text: string;
    start: number;
    duration: number;
}
export interface IVideoService {
    getVideoMetadata(videoUrl: string): Promise<VideoMetadata>;
    getVideoTranscript(videoUrl: string): Promise<VideoTranscript>;
    validateYouTubeUrl(url: string): boolean;
    extractVideoId(url: string): string | null;
}
