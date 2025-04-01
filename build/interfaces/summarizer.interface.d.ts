import { VideoMetadata, VideoTranscript } from './video-service.interface.js';
export interface SummaryResult {
    title: string;
    originalVideoUrl: string;
    summaryText: string;
    keyPoints: string[];
    durationInMinutes: number;
    transcriptLength: number;
}
export interface ISummarizer {
    summarizeVideo(videoUrl: string, metadata: VideoMetadata, transcript: VideoTranscript): Promise<SummaryResult>;
}
