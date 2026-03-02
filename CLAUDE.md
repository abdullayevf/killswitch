# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**KillSwitch** is a Chrome Extension (Manifest v3) that generates tailored freelance proposals for job posts on Upwork, Fiverr, and Freelancer. It supports multiple AI providers (Groq, Google Gemini, HuggingFace) and injects proposals directly into platform textareas via a content script.

## Development Commands

```bash
npm install          # Install dependencies
npm run build        # Production build → dist/
npm run watch        # Build with file watching (for iterative development)
npm run dev          # Vite dev server (limited use for extensions)
```

To test the extension: open `chrome://extensions/`, enable Developer mode, click "Load unpacked", and select the `dist/` folder. Reload after each build.

## Architecture

The build uses **Vite with 4 separate entry points** (`vite.config.ts`), each compiled to a flat JS file in `dist/`:

| Entry | Output | Purpose |
|---|---|---|
| `popup.html` | `popup.js` | React app mounted in the extension popup |
| `settings.html` | `settings.js` | React app opened as a new Chrome tab |
| `src/background.ts` | `background.js` | Service worker: context menu registration and message routing |
| `src/content.ts` | `content.js` | Injected into freelance platform pages; handles textarea injection |

### Data Flow

1. User selects text on a freelance site → context menu → `background.ts` saves it to `chrome.storage.local` and opens popup
2. Popup (`App.tsx`) reads saved text, builds prompt, calls selected AI provider API directly from extension context
3. On copy, user pastes proposal manually OR content script (`content.ts`) handles `injectProposal` message to auto-fill textarea

### Chrome Storage Keys

- `chrome.storage.sync`: `aiProvider`, `apiKeys` (map of provider→key), `selectedModel`, `defaultSettings` `{tone, goal, language}`, `customPrompt`, `autoInject`
- `chrome.storage.local`: `selectedText` (transient, cleared after popup reads it)

### AI Providers

Supported providers and their integrations are defined as a static `AI_PROVIDERS` array in `src/Settings.tsx`. The actual API calls live in `src/App.tsx` as standalone async functions (`callGroqAPI`, `callGeminiAPI`, `callHuggingFaceAPI`). Default provider is Groq; default model is `llama-3.3-70b-versatile`.

### Prompt System

`buildPrompt()` in `App.tsx` either uses a user-defined custom prompt (read from `chrome.storage.sync`) or falls back to a hardcoded default. Custom prompts support four template variables: `{jobDescription}`, `{tone}`, `{goal}`, `{language}`. Language auto-detection uses keyword frequency matching for Russian, Spanish, and French.

## Styling Convention

`App.tsx` (popup) uses **inline styles** only — Tailwind is NOT available in the popup context due to extension CSP constraints. `Settings.tsx` uses **Tailwind CSS classes** (it renders in a full tab with no such restrictions). Do not mix these conventions.

## Key Constraints

- **No tests** exist in this project — there is no test runner configured.
- **Manifest v3**: Background runs as a service worker (no persistent state between events). `chrome.action.openPopup()` is used to programmatically open the popup from the service worker.
- **Host permissions** for AI APIs are declared in `manifest.json` and must be updated there if new providers are added.
- The `dist/` directory and all image files (`*.png`, `*.jpg`, etc.) are gitignored.
