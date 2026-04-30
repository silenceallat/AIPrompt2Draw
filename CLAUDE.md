# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AIPrompt2Draw (一语成图) is a zero-dependency, pure frontend AI flowchart generator. Users describe diagrams in natural language, and the app calls an AI provider API to generate DrawIO XML, which is loaded into an embedded diagrams.net editor. Deployed via GitHub Pages.

## Development Commands

```bash
# Local dev server (pick one)
npx serve . --listen 3000
python -m http.server 8000

# Then open http://localhost:3000/src/ (or :8000)
```

No build step, no bundler, no tests. All source is vanilla HTML/CSS/JS loaded directly by the browser.

## Architecture

### Module Loading Order (critical)

Scripts are loaded via `<script>` tags in `src/index.html` in this exact order — later modules depend on earlier ones:

1. **`config.js`** → `ConfigManager` (global `window.configManager`, `window.providerPresets`)
2. **`utils.js`** → Utility functions (global `window.Utils`, plus individual globals like `escapeHtml`, `downloadFile`, `readFile`)
3. **`drawio-generator.js`** → `DrawIOGenerator` (global `window.drawioGenerator`)
4. **`ui.js`** → `UIManager` (global `window.uiManager`)
5. **`core.js`** → `CoreEngine` (global `window.coreEngine`) — binds to `uiManager.onSendMessage` in constructor

### Core Data Flow

```
User input → UIManager.handleSendMessage() → CoreEngine.handleMessageSend()
  → fetch() to AI provider API (streaming or non-streaming, OpenAI-compatible format)
  → response parsed → DrawIOGenerator.extractXML() to pull <mxGraphModel> from markdown
  → DrawIOGenerator.loadXML() → postMessage to embedded diagrams.net iframe
```

### Key Classes

- **ConfigManager** — API keys, provider selection, model config. All persisted to `localStorage` with `config_` prefixed keys. Supports multi-provider (siliconflow, openrouter, kimi, zhipu, minimax, modelscope, custom).
- **CoreEngine** — Handles API calls. System prompt instructs the AI to output DrawIO XML in markdown code blocks. Builds auth headers (Bearer or Direct scheme). Processes SSE streaming responses.
- **DrawIOGenerator** — Manages the diagrams.net iframe via `postMessage` protocol. Handles `init`/`configure`/`load` events. Extracts XML from AI response using regex patterns. Includes `forceLoadXML` fallback.
- **UIManager** — Chat UI, message rendering, theme toggle, settings modal. Manages `conversationHistory[]` array for multi-turn context.

### AI Provider Integration

All providers use OpenAI-compatible `POST /v1/chat/completions` format. Provider presets (URLs, auth schemes, model lists) are defined in `providerPresets` object in `config.js`. Adding a new provider requires only adding a preset entry.

### DrawIO Embed

The app embeds `https://embed.diagrams.net/?embed=1&proto=json&libraries=1` as an iframe. Communication uses JSON `postMessage` with actions: `configure`, `load`. The `load` action sends raw DrawIO XML.

## Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) deploys the `src/` directory to GitHub Pages on push to `main` branch.

## Conventions

- Pure vanilla JS — no frameworks, no npm runtime dependencies (`serve` is devOnly)
- Modules expose globals on `window` with CommonJS `module.exports` fallback
- All user-facing text is in Chinese (zh-CN)
- Dark mode via `.dark-mode` class on `<body>`, toggled by `UIManager`
- No linter/formatter configured — manual review required
