#!/usr/bin/env node

// This is a simple entry point script that loads the actual server
// from the correct path - using CommonJS syntax

const { spawn } = require('child_process');
const path = require('path');

// Get the actual path to the index.js file
const serverPath = path.join(__dirname, 'build', 'index.js');
console.error(`Starting YouTube Video Summarizer MCP Server from: ${serverPath}`);

// Spawn the server as a child process and pipe all I/O
const server = spawn('node', [serverPath], {
  stdio: 'inherit', // This will connect stdin/stdout/stderr
  env: {
    ...process.env,
    MAX_VIDEO_LENGTH: process.env.MAX_VIDEO_LENGTH || '60',
    DEFAULT_SUMMARIZER: process.env.DEFAULT_SUMMARIZER || 'advanced'
  }
});

// Handle possible errors
server.on('error', (err) => {
  console.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});

// Forward exit code
server.on('close', (code) => {
  process.exit(code);
});
