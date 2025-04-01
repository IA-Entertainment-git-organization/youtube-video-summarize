#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
// Import services and utilities
import { YouTubeVideoService } from "./services/youtube-video.service.js";
import { SummarizerFactory, SummarizerType } from "./services/summarizer-factory.service.js";
import { createError, ErrorType, formatErrorResponse } from "./utils/error-handler.js";
// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });
// Configure maximum video length
const MAX_VIDEO_LENGTH_MINUTES = parseInt(process.env.MAX_VIDEO_LENGTH || "60");
// Initialize services
const videoService = new YouTubeVideoService();
// Create MCP server
const server = new McpServer({
    name: "youtube-video-summarize",
    version: "1.0.0",
});
// Register summarize-video tool
server.tool("summarize-video", "Summarize a YouTube video by providing its URL", {
    videoUrl: z.string().url().describe("URL of the YouTube video to summarize"),
    summarizerType: z.enum(["basic", "advanced", "openai"]).optional().describe("Type of summarizer to use (basic, advanced, or OpenAI)")
}, async ({ videoUrl, summarizerType = "advanced" }) => {
    try {
        console.error(`Processing video request for URL: ${videoUrl} with summarizer: ${summarizerType}`);
        // Validate YouTube URL
        if (!videoService.validateYouTubeUrl(videoUrl)) {
            console.error(`Invalid YouTube URL: ${videoUrl}`);
            throw createError("Invalid YouTube URL", ErrorType.INVALID_URL);
        }
        console.error(`Valid YouTube URL, attempting to fetch metadata...`);
        // Get video metadata
        try {
            const metadata = await videoService.getVideoMetadata(videoUrl);
            // Check if video is too long
            const durationMinutes = metadata.duration / 60;
            if (durationMinutes > MAX_VIDEO_LENGTH_MINUTES) {
                console.error(`Video too long: ${Math.round(durationMinutes)} minutes (max: ${MAX_VIDEO_LENGTH_MINUTES})`);
                throw createError(`Video is too long (${Math.round(durationMinutes)} minutes). Maximum allowed length is ${MAX_VIDEO_LENGTH_MINUTES} minutes.`, ErrorType.VIDEO_TOO_LONG);
            }
            console.error(`Video metadata retrieved successfully. Duration: ${Math.round(durationMinutes)} minutes`);
            console.error(`Attempting to fetch transcript...`);
            // Get video transcript
            try {
                const transcript = await videoService.getVideoTranscript(videoUrl);
                if (!transcript || transcript.text.trim().length === 0) {
                    console.error(`Empty transcript received`);
                    throw createError("No transcript available for this video", ErrorType.NO_TRANSCRIPT);
                }
                console.error(`Transcript fetched successfully. Length: ${transcript.text.split(/\s+/).length} words`);
                // Create summarizer
                let summarizerTypeMapped;
                switch (summarizerType) {
                    case "openai":
                        summarizerTypeMapped = SummarizerType.OPENAI;
                        break;
                    case "advanced":
                        summarizerTypeMapped = SummarizerType.ADVANCED;
                        break;
                    case "basic":
                    default:
                        summarizerTypeMapped = SummarizerType.BASIC;
                }
                console.error(`Creating ${summarizerTypeMapped} summarizer...`);
                const summarizer = SummarizerFactory.createSummarizer(summarizerTypeMapped);
                // Generate summary
                console.error(`Generating summary...`);
                try {
                    const summary = await summarizer.summarizeVideo(videoUrl, metadata, transcript);
                    console.error(`Summary generated successfully`);
                    // Format response
                    const response = [
                        `# Summary of: ${summary.title}`,
                        `\nOriginal video: ${summary.originalVideoUrl}`,
                        `\nVideo length: ${summary.durationInMinutes} minutes`,
                        `\n## Summary`,
                        `\n${summary.summaryText}`,
                        `\n## Key Points`,
                        ...summary.keyPoints.map((point) => `\n- ${point}`),
                        `\n\n*Transcript length: ${summary.transcriptLength} words*`
                    ].join("");
                    return {
                        content: [{ type: "text", text: response }],
                    };
                }
                catch (summaryError) {
                    console.error("Error in summarization process:", summaryError);
                    throw createError(`Failed to generate summary: ${summaryError.message}`, ErrorType.SUMMARIZATION_ERROR);
                }
            }
            catch (transcriptError) {
                console.error("Error fetching transcript:", transcriptError);
                throw transcriptError; // Re-throw to be caught by outer try/catch
            }
        }
        catch (metadataError) {
            console.error("Error fetching metadata:", metadataError);
            throw metadataError; // Re-throw to be caught by outer try/catch
        }
    }
    catch (error) {
        console.error("Error in summarize-video tool:", error);
        return {
            content: [{
                    type: "text",
                    text: formatErrorResponse(error)
                }],
        };
    }
});
// Register get-video-info tool (simpler tool to just get video metadata)
server.tool("get-video-info", "Get basic information about a YouTube video", {
    videoUrl: z.string().url().describe("URL of the YouTube video")
}, async ({ videoUrl }) => {
    try {
        console.error(`Processing get-video-info request for URL: ${videoUrl}`);
        // Validate YouTube URL
        if (!videoService.validateYouTubeUrl(videoUrl)) {
            console.error(`Invalid YouTube URL: ${videoUrl}`);
            throw createError("Invalid YouTube URL", ErrorType.INVALID_URL);
        }
        console.error(`Valid YouTube URL, attempting to fetch metadata...`);
        // Get video metadata
        try {
            const metadata = await videoService.getVideoMetadata(videoUrl);
            console.error(`Video metadata retrieved successfully`);
            // Format response
            const response = [
                `# Video Information: ${metadata.title}`,
                `\nChannel: ${metadata.channelName}`,
                `\nPublished: ${metadata.publishDate}`,
                `\nDuration: ${Math.ceil(metadata.duration / 60)} minutes`,
                `\nViews: ${metadata.viewCount.toLocaleString()}`,
                `\n## Description`,
                `\n${metadata.description}`
            ].join("");
            return {
                content: [{ type: "text", text: response }],
            };
        }
        catch (metadataError) {
            console.error("Error fetching metadata:", metadataError);
            throw metadataError; // Re-throw to be caught by outer try/catch
        }
    }
    catch (error) {
        console.error("Error in get-video-info tool:", error);
        return {
            content: [{
                    type: "text",
                    text: formatErrorResponse(error)
                }],
        };
    }
});
// Register get-video-transcript tool
server.tool("get-video-transcript", "Get the full transcript of a YouTube video", {
    videoUrl: z.string().url().describe("URL of the YouTube video")
}, async ({ videoUrl }) => {
    try {
        console.error(`Processing get-video-transcript request for URL: ${videoUrl}`);
        // Validate YouTube URL
        if (!videoService.validateYouTubeUrl(videoUrl)) {
            console.error(`Invalid YouTube URL: ${videoUrl}`);
            throw createError("Invalid YouTube URL", ErrorType.INVALID_URL);
        }
        console.error(`Valid YouTube URL, attempting to fetch metadata...`);
        // Get video metadata for the title
        try {
            const metadata = await videoService.getVideoMetadata(videoUrl);
            console.error(`Video metadata retrieved successfully`);
            console.error(`Attempting to fetch transcript...`);
            // Get video transcript
            try {
                const transcript = await videoService.getVideoTranscript(videoUrl);
                if (!transcript || transcript.text.trim().length === 0) {
                    console.error(`Empty transcript received`);
                    throw createError("No transcript available for this video", ErrorType.NO_TRANSCRIPT);
                }
                console.error(`Transcript fetched successfully. Length: ${transcript.text.split(/\s+/).length} words`);
                // Format response
                const response = [
                    `# Transcript: ${metadata.title}`,
                    `\nChannel: ${metadata.channelName}`,
                    `\nDuration: ${Math.ceil(metadata.duration / 60)} minutes`,
                    `\n## Full Transcript`,
                    `\n${transcript.text}`
                ].join("");
                return {
                    content: [{ type: "text", text: response }],
                };
            }
            catch (transcriptError) {
                console.error("Error fetching transcript:", transcriptError);
                throw transcriptError; // Re-throw to be caught by outer try/catch
            }
        }
        catch (metadataError) {
            console.error("Error fetching metadata:", metadataError);
            throw metadataError; // Re-throw to be caught by outer try/catch
        }
    }
    catch (error) {
        console.error("Error in get-video-transcript tool:", error);
        return {
            content: [{
                    type: "text",
                    text: formatErrorResponse(error)
                }],
        };
    }
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("YouTube Video Summarizer MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
