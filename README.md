# YouTube Video Summarizer MCP Server

An MCP (Model Context Protocol) server that summarizes YouTube videos by extracting and analyzing their transcripts.

## Features

- Extract metadata and transcripts from YouTube videos
- Summarize video content using various algorithms:
  - Basic: Simple text extraction and frequency analysis
  - Advanced: TF-IDF based algorithm that creates more coherent summaries (no API needed)
  - OpenAI: Uses OpenAI's API for high-quality summaries (requires API key)
- Extract key points from the video
- Provide formatted summaries that can be used by AI assistants
- Robust error handling with detailed error messages
- Fallback mechanisms for handling restricted or problematic videos
- Comprehensive logging for easier troubleshooting

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- TypeScript

## Installation

1. Clone the repository or download the source code
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

4. Build the project:

```bash
npm run build
```

## Configuration

Create a `.env` file in the root of the project with the following variables:

```
# YouTube API Key (optional - for additional metadata)
YOUTUBE_API_KEY=

# OpenAI API Key (optional - for AI-based summarization)
OPENAI_API_KEY=

# Maximum length of video to process (in minutes)
MAX_VIDEO_LENGTH=60
```

Note: The OpenAI API key is **optional**. Without it, the system will use the advanced TF-IDF based summarizer which still provides good results without requiring any external API.

## Troubleshooting

If you're having issues with the YouTube video summarizer, check the TROUBLESHOOTING.md file for common problems and solutions.

### Common Issues with YouTube Videos

Some videos may not work with this summarizer due to various restrictions:

1. **Age-restricted videos**: Videos that require age verification cannot be accessed without authentication
2. **Private videos**: Videos marked as private are not accessible
3. **Region-blocked videos**: Videos that are restricted in certain regions may not be accessible
4. **Missing transcripts**: Some videos don't have captions or transcripts available
5. **Copyright-restricted videos**: Some videos have special copyright protections

The tool now includes improved error handling to help identify these issues more clearly and provide better feedback.

## Usage

### As a standalone tool

You can run the tool directly from the command line:

```bash
node build/index.js
```

### Integrating with Claude or other AI assistants

Configure your Claude Desktop MCP server configuration file to include this MCP server:

```json
{
  "mcpServers": {
    "youtube-video-summarize": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/youtube-video-summarize/build/index.js"
      ],
      "env": {
        "MAX_VIDEO_LENGTH": "60"
      }
    }
  }
}
```

## Available Tools

The MCP server provides the following tools:

### summarize-video

Summarizes a YouTube video by extracting its transcript and generating a concise summary with key points.

Parameters:
- `videoUrl`: URL of the YouTube video to summarize
- `summarizerType`: Type of summarizer to use (`basic`, `advanced`, or `openai`)

### get-video-info

Retrieves basic information about a YouTube video without generating a summary.

Parameters:
- `videoUrl`: URL of the YouTube video

### get-video-transcript

Retrieves the full transcript of a YouTube video.

Parameters:
- `videoUrl`: URL of the YouTube video

## Summarization Methods

### Basic Summarizer

The Basic Summarizer uses word frequency and position-based heuristics to extract important sentences from the transcript. It's fast and requires no external APIs.

### Advanced Summarizer

The Advanced Summarizer uses TF-IDF (Term Frequency-Inverse Document Frequency) to identify important sentences. It also employs several techniques to ensure coherence and minimize redundancy. This summarizer provides good results without requiring any external API.

### OpenAI Summarizer

If you provide an OpenAI API key, the system can use OpenAI's powerful language models to generate higher-quality summaries. This option requires an API key and internet connectivity.

## Architecture

This project follows SOLID principles:

- **Single Responsibility Principle**: Each class has a single responsibility
- **Open/Closed Principle**: Code is open for extension but closed for modification
- **Liskov Substitution Principle**: Different summarizer implementations can be used interchangeably
- **Interface Segregation Principle**: Interfaces are specific to their clients' needs
- **Dependency Inversion Principle**: High-level modules depend on abstractions

## License

MIT
