import { ISummarizer } from '../interfaces/summarizer.interface.js';
export declare enum SummarizerType {
    BASIC = "basic",
    ADVANCED = "advanced",
    OPENAI = "openai"
}
export declare class SummarizerFactory {
    static createSummarizer(type?: SummarizerType): ISummarizer;
}
