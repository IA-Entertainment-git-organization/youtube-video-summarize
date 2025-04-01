# Installation Guide

If you're encountering issues with the npm build process, follow these steps:

## Manual Installation

1. First, ensure you have Node.js v16 or later installed.

2. Navigate to the project directory:
```bash
cd "D:\Iavar\AI\MCP Servers\web\youtube-video-summarize"
```

3. Install dependencies:
```bash
npm install
```

4. Compile TypeScript:
```bash
npx tsc
```

5. Make the main file executable (on Unix-like systems):
```bash
chmod +x build/index.js
```

## Troubleshooting

If you encounter errors related to package.json not being found, please verify:

1. That you're in the correct directory containing the package.json file
2. That npm is correctly installed and in your PATH
3. You may try running with administrator privileges if necessary

## The ES Module Fix

Note that we've made several important fixes to the TypeScript files:

1. Added `.js` extensions to all import paths (required for ESM)
2. Fixed type definitions for YouTube transcript API
3. Added explicit typing to all parameters in functions
4. Ensured all imports use the correct relative paths

These changes ensure compatibility with TypeScript's ESM support that's needed for the MCP Server infrastructure.
