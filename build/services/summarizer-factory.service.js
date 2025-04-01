import { BasicSummarizerService } from './basic-summarizer.service.js';
import { AdvancedSummarizerService } from './advanced-summarizer.service.js';
import { OpenAISummarizerService } from './openai-summarizer.service.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });
export var SummarizerType;
(function (SummarizerType) {
    SummarizerType["BASIC"] = "basic";
    SummarizerType["ADVANCED"] = "advanced";
    SummarizerType["OPENAI"] = "openai";
})(SummarizerType || (SummarizerType = {}));
export class SummarizerFactory {
    static createSummarizer(type = SummarizerType.BASIC) {
        switch (type) {
            case SummarizerType.OPENAI:
                // Check if OpenAI API key is available
                if (process.env.OPENAI_API_KEY) {
                    return new OpenAISummarizerService();
                }
                else {
                    console.warn('OPENAI_API_KEY not found, falling back to advanced summarizer');
                    return new AdvancedSummarizerService();
                }
            case SummarizerType.ADVANCED:
                return new AdvancedSummarizerService();
            case SummarizerType.BASIC:
            default:
                return new BasicSummarizerService();
        }
    }
}
