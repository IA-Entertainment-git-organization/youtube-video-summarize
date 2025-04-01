import { ISummarizer, SummaryResult } from '../interfaces/summarizer.interface.js';
import { VideoMetadata, VideoTranscript } from '../interfaces/video-service.interface.js';
export declare class BasicSummarizerService implements ISummarizer {
    summarizeVideo(videoUrl: string, metadata: VideoMetadata, transcript: VideoTranscript): Promise<SummaryResult>;
}
