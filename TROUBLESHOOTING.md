# Troubleshooting Guide

If you're having issues with the YouTube Video Summarizer MCP Server, here are some common problems and solutions:

## Module System Issues

If you're seeing an error like:
```
ReferenceError: require is not defined in ES module scope, you can use import instead
```

This is because the project is configured to use ES Modules, but some scripts are using CommonJS syntax.

### Solution: Use the CJS Starter Script

Use the `simple-config.json` file which uses a CommonJS starter script (`.cjs` extension):

```json
{
  "mcpServers": {
    "youtube-video-summarize": {
      "command": "node",
      "args": [
        "D:\\Iavar\\AI\\MCP Servers\\web\\youtube-video-summarize\\start-server.cjs"
      ],
      "env": {
        "MAX_VIDEO_LENGTH": "60",
        "DEFAULT_SUMMARIZER": "advanced"
      }
    }
  }
}
```

## Path Issues

If you're seeing an error like:
```
Error: Cannot find module 'D:\Iavar\AI\MCP Servers\web\youtube-video-summarizeuild\index.js'
```

This indicates a path resolution issue. Try these solutions:

### Solution 1: Use the Simple Configuration

Use the `simple-config.json` file which uses a dedicated starter script to avoid path resolution issues.

### Solution 2: Escape Backslashes Properly

Make sure you're using double backslashes in your configuration files when specifying Windows paths:

Instead of:
```
"D:/Iavar/AI/MCP Servers/web/youtube-video-summarize/build/index.js"
```

Use:
```
"D:\\Iavar\\AI\\MCP Servers\\web\\youtube-video-summarize\\build\\index.js"
```

## Missing Dependencies

If you see errors about missing modules, make sure you've installed all dependencies:

```bash
cd "D:\Iavar\AI\MCP Servers\web\youtube-video-summarize"
npm install
```

## Build Issues

If the TypeScript build is failing, try these steps:

1. Make sure TypeScript is installed:
```bash
npm install -g typescript
```

2. Run the TypeScript compiler directly:
```bash
npx tsc
```

3. Check for any errors in the output.

## Testing the Server Directly

You can test if the server works correctly by running it directly:

```bash
node "D:\Iavar\AI\MCP Servers\web\youtube-video-summarize\build\index.js"
```

If it starts without errors, the issue is likely in how Claude Desktop is calling it.

## Server Configuration in Claude Desktop

1. Open Claude Desktop
2. Go to Settings
3. Look for MCP Server Configuration
4. Paste the contents of the `simple-config.json` file
5. Restart Claude Desktop

## Still Having Issues?

If you're still experiencing problems:

1. Check Claude Desktop logs for more detailed error messages
2. Try using the absolute path to node.exe in your config:
```json
"command": "C:\\Program Files\\nodejs\\node.exe",
```
3. Make sure the Node.js version you're using is compatible (v16+)
